# AGENTS.md

## Cursor Cloud specific instructions

### Overview

KAAFI HSSE is a safety management platform (MVP) for AI-powered HSSE analysis. It is a monorepo with three npm packages: `backend/`, `frontend/`, and `ai/` (no dependencies of its own). The backend serves the compiled frontend from `frontend/dist/` and exposes REST APIs.

### Running services

- **Backend**: `DATABASE_URL="" PORT=3000 OLLAMA_HOST=http://localhost:11434 node backend/src/server.js`
  - Uses SQLite fallback automatically when `DATABASE_URL` is empty (no PostgreSQL needed).
  - The entry point used by `test.sh` is `backend/src/server.js` (not `src/index.js`).
- **Mock Ollama** (for development/testing without GPU): see the inline mock server in `test.sh` — a simple Node HTTP server on port 11434 that returns test responses.
- **Frontend dev server**: `cd frontend && npm run dev` (Vite on port 5173). Only needed when actively editing frontend code; the backend serves the built `frontend/dist/` on port 3000.

### Testing

Run the full integration test suite with `./test.sh` from the repo root. It:
1. Syntax-checks backend and AI modules
2. Builds the frontend (`npm run build`)
3. Starts a mock Ollama server and the backend (SQLite mode)
4. Exercises health, full-analysis, history, model-status, PDF download, and frontend-serving endpoints
5. Validates brand sanitization and PII scrubbing

There are no separate lint or unit test scripts; `test.sh` is the sole automated test.

### Key gotchas

- `backend/src/server.js` imports `dotenv/config` but `dotenv` is not listed in `backend/package.json`. Install it with `cd backend && npm install dotenv` or the server will crash on startup.
- The `ai/` package has no runtime dependencies (no `node_modules` needed).
- The `backend/package.json` `"main"` points to `src/index.js` (the alternative Ostrich v2 entry), but `test.sh` and the primary flow use `src/server.js`.
- SQLite data is stored at `backend/data/kaafi_hsse.sqlite`; this directory is created automatically.
