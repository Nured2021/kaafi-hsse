## Cursor Cloud specific instructions

### Services overview

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Backend (Express + SQLite) | `cd backend && npm run dev` | 3000 | Serves REST API and pre-built `frontend/dist` |
| Frontend (Vite dev server) | `cd frontend && npm run dev` | 5173 | Only needed for frontend hot-reload development |
| Ollama (AI LLM) | External or mock (see below) | 11434 | Required for AI analysis features |

### Running the backend

The backend uses SQLite by default when `DATABASE_URL` is not set — no external database needed. Start with:

```bash
cd backend && DATABASE_URL="" npm run dev
```

The `--watch` flag is built into the `dev` script for hot reloading.

### Mock Ollama for testing

A real Ollama server with large LLM models is not available in the cloud VM. Use the mock Ollama from `test.sh` or a minimal Node.js HTTP stub on port 11434 that responds to `POST /api/generate` with a JSON `{ "response": "..." }` body. Set `OLLAMA_HOST=http://localhost:11434` when starting the backend.

### Integration tests

Run `./test.sh` from the repo root. This script starts its own mock Ollama and backend instance (on port 3100 by default), runs all endpoint tests, and cleans up. No external services required.

### Frontend build

`cd frontend && npm run build` — output goes to `frontend/dist/` which is served by the backend's static middleware. A pre-built `dist/` is committed to the repo.

### Key gotchas

- The `ai/` module has no `node_modules` of its own — it is imported directly by the backend via relative path (`../../ai/index.js`).
- `better-sqlite3` is a native addon; if Node.js major version changes, run `npm rebuild` in `backend/`.
- The backend creates `backend/data/kaafi_hsse.sqlite` on first run; this path is gitignored.
- The test script (`test.sh`) uses port 3100 by default to avoid colliding with a running dev server on 3000.
