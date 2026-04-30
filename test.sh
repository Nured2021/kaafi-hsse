#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-3100}"
OLLAMA_PORT="${OLLAMA_PORT:-11434}"
BACKEND_LOG="$(mktemp)"
OLLAMA_LOG="$(mktemp)"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "${OLLAMA_PID:-}" ]]; then
    kill "$OLLAMA_PID" 2>/dev/null || true
  fi
  rm -f "$BACKEND_LOG" "$OLLAMA_LOG"
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

echo "== Starting mocked Ollama =="
node -e '
const http = require("http");
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => body += chunk);
  req.on("end", () => {
    if (req.method !== "POST" || req.url !== "/api/generate") {
      res.writeHead(404);
      return res.end("not found");
    }

    const parsed = JSON.parse(body || "{}");
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({
      response: `SafetyCo Partners BP Wind Energy IHSA.ca Prepared by: John Smith TEST output from ${parsed.model}`
    }));
  });
});
server.listen(process.env.OLLAMA_PORT || 11434, () => console.log("mock ollama ready"));
' >"$OLLAMA_LOG" 2>&1 &
OLLAMA_PID=$!

echo "== Starting backend with SQLite fallback =="
DATABASE_URL="" PORT="$PORT" OLLAMA_HOST="http://localhost:$OLLAMA_PORT" node backend/src/server.js >"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

sleep 2

echo "== Backend health and database =="
HEALTH="$(curl -s "http://localhost:$PORT/health")"
assert_contains "$HEALTH" '"status":"ok"' "backend health ok"
assert_contains "$HEALTH" '"engine":"sqlite"' "SQLite fallback active"

echo "== Pipeline execution =="
ANALYSIS="$(curl -s -X POST "http://localhost:$PORT/api/full-analysis" \
  -H "Content-Type: application/json" \
  -d "{\"input\":\"High Pressure Valve Repair for SafetyCo Partners near BP equipment\",\"mode\":\"hybrid\",\"province\":\"AB\",\"manual_data\":{\"crew\":\"day shift\"}}")"
assert_contains "$ANALYSIS" '"risk"' "risk output returned"
assert_contains "$ANALYSIS" '"jsa"' "jsa output returned"
assert_contains "$ANALYSIS" '"documents"' "documents output returned"
assert_contains "$ANALYSIS" '"summary"' "summary output returned"
assert_contains "$ANALYSIS" '"status"' "model status returned"
assert_contains "$ANALYSIS" '"safetyStop"' "safety stop metadata returned"
assert_contains "$ANALYSIS" '"mode":"hybrid"' "mode returned"
assert_contains "$ANALYSIS" '"province":"AB"' "province returned"
assert_contains "$ANALYSIS" '"cores"' "core outputs returned"

echo "== Brand sanitization and privacy scrub =="
assert_contains "$ANALYSIS" "KAAFI HSSE" "legacy brands replaced"
assert_contains "$ANALYSIS" "[Removed for privacy]" "personal name scrubbed"

echo "== Database persistence =="
HISTORY="$(curl -s "http://localhost:$PORT/api/ai/history")"
assert_contains "$HISTORY" '"input"' "history returns saved run"

RUN_ID="$(node -e 'const rows = JSON.parse(process.argv[1]); console.log(rows[0]?.id || "")' "$HISTORY")"
DETAIL="$(curl -s "http://localhost:$PORT/api/ai/runs/$RUN_ID")"
assert_contains "$DETAIL" "$RUN_ID" "run detail returns by id"

echo "== Model status and PDF download =="
MODEL_STATUS="$(curl -s "http://localhost:$PORT/api/ai/model-status")"
assert_contains "$MODEL_STATUS" '"core0"' "model status includes core0"
assert_contains "$MODEL_STATUS" '"core6"' "model status includes core6"

PDF_RESPONSE="$(curl -s -i -X POST "http://localhost:$PORT/api/ai/download-pdf" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$RUN_ID\"}")"
assert_contains "$PDF_RESPONSE" "HTTP/1.1 200 OK" "PDF endpoint returns file"
assert_contains "$PDF_RESPONSE" "KAAFI HSSE - Safety Excellence" "PDF content branded"

echo "== Core files and Canadian HSE data =="
for file in \
  ai/src/core0_ingestion.js \
  ai/src/core1_hazard.js \
  ai/src/core2_jsa.js \
  ai/src/core3_documents.js \
  ai/src/core4_critic.js \
  ai/src/core5_synthesis.js \
  ai/src/core6_feedback.js \
  data/canada/ohs_acts.json \
  data/canada/csa_standards.json \
  data/canada/whmis_2015.json \
  data/canada/provincial_matrix.js; do
  [[ -f "$file" ]] || { echo "FAIL: missing $file"; exit 1; }
done
echo "PASS: core files and Canadian HSE data exist"

echo "== Frontend serving =="
FRONTEND="$(curl -s -i "http://localhost:$PORT/")"
assert_contains "$FRONTEND" "HTTP/1.1 200 OK" "frontend root served"
assert_contains "$FRONTEND" "KAAFI HSSE" "frontend html served"

FALLBACK="$(curl -s -i "http://localhost:$PORT/dashboard/ai")"
assert_contains "$FALLBACK" "HTTP/1.1 200 OK" "frontend fallback served"

echo "ALL TESTS PASSED"
