# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

KAAFI HSSE is a safety management platform (Health, Safety, Security, Environment) for Canadian industrial workplaces. It uses an AI pipeline ("Ostrich Pipeline") with 6 cores calling local Ollama LLM models. The project has three sub-packages: `backend/`, `frontend/`, and `ai/`.

### Running the application

- **Dev server**: `cd backend && DATABASE_URL="" npm run dev` starts the backend on port 3000 with SQLite fallback and `--watch` for hot reload. It serves both the REST API and the compiled frontend from `frontend/dist/`.
- **Frontend build**: `cd frontend && npm run build` compiles the React/Vite frontend into `frontend/dist/`. Must be run before the backend can serve the UI.
- The backend has **two entry points**: `src/index.js` (primary dev entry, "Ostrich Platform" with full dashboard/auth/pipeline) and `src/server.js` (used by `test.sh`, imports from `../../ai/index.js`).
- Without Ollama running locally, AI analysis endpoints will fail but the rest of the app (health, dashboard, auth, frontend) works fine.
- The `dotenv` package is required by `server.js` (`import "dotenv/config"`) but is not listed in `backend/package.json`. It is installed as part of the update script.

### Testing

- Run `./test.sh` from the repo root for full integration tests. It starts a mock Ollama server, launches the backend with SQLite, and tests all API endpoints including pipeline execution, brand sanitization, PDF download, and frontend serving.
- The test suite is self-contained and cleans up all spawned processes on exit.

### Key gotchas

- `better-sqlite3` is a native addon; the environment needs build tools (Python, make, g++) for `npm install` to succeed.
- The backend SQLite fallback creates the DB at the path set by `SQLITE_PATH` or defaults. Set `DATABASE_URL=""` explicitly to force SQLite mode.
- The `ai/` module has no npm dependencies of its own; it is imported directly by the backend.
