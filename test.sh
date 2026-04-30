#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-3100}"
BACKEND_LOG="$(mktemp)"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  rm -f "$BACKEND_LOG"
}
trap cleanup EXIT

assert_contains() {
  local value="$1"
  local expected="$2"
  local label="$3"

  if [[ "$value" != *"$expected"* ]]; then
    echo "FAIL: $label"
    echo "Expected to find: $expected"
    echo "Actual:"
    echo "$value"
    exit 1
  fi

  echo "PASS: $label"
}

cd "$ROOT_DIR"

echo "== Build and syntax checks =="
(cd backend && node --check src/server.js)
(cd ai && node --check src/pipeline.js && node --check src/brandSanitizer.js)
(cd frontend && npm run build >/dev/null)
echo "PASS: build and syntax"

echo "== Starting backend with SQLite fallback =="
DATABASE_URL="" PORT="$PORT" OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}" node backend/src/server.js >"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

sleep 2

echo "== Backend health and database =="
HEALTH="$(curl -s "http://localhost:$PORT/health")"
assert_contains "$HEALTH" '"status":"ok"' "backend health ok"
assert_contains "$HEALTH" '"engine":"sqlite"' "SQLite fallback active"

echo "== Real Ollama pipeline execution =="
ANALYSIS="$(curl -s -X POST "http://localhost:$PORT/api/full-analysis" \
  -H "Content-Type: application/json" \
  -d "{\"input\":\"Working at height installing scaffolding\"}")"
assert_contains "$ANALYSIS" '"risk"' "risk output returned"
assert_contains "$ANALYSIS" '"jsa"' "jsa output returned"
assert_contains "$ANALYSIS" '"documents"' "documents output returned"
assert_contains "$ANALYSIS" '"summary"' "summary output returned"
assert_contains "$ANALYSIS" '"status"' "model status returned"
assert_contains "$ANALYSIS" '"deepseek"' "deepseek status returned"
assert_contains "$ANALYSIS" '"mistral"' "mistral status returned"
assert_contains "$ANALYSIS" '"gemma"' "gemma status returned"
assert_contains "$ANALYSIS" '"phi3"' "phi3 status returned"

echo "== Frontend serving =="
FRONTEND="$(curl -s -i "http://localhost:$PORT/")"
assert_contains "$FRONTEND" "HTTP/1.1 200 OK" "frontend root served"
assert_contains "$FRONTEND" "KAAFI HSSE" "frontend html served"

FALLBACK="$(curl -s -i "http://localhost:$PORT/dashboard/ai")"
assert_contains "$FALLBACK" "HTTP/1.1 200 OK" "frontend fallback served"

echo "ALL TESTS PASSED"
