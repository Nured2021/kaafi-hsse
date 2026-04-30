# AGENTS.md

## Cursor Cloud specific instructions

### Architecture overview

KAAFI HSSE is a single-URL safety management platform. The Express backend serves the React frontend (pre-built `frontend/dist/`) as static assets. All traffic goes through `http://localhost:3000`.

- `backend/` — Node.js Express API (port 3000)
- `frontend/` — React + Vite SPA (built assets served by backend)
- `ai/` — Ollama pipeline module (imported by backend, no separate server)
- `docs/` — Architecture docs

### Services

| Service | How to start | Notes |
|---|---|---|
| PostgreSQL | `sudo pg_ctlcluster 16 main start` | Must be running before backend starts. Database: `kaafi_hsse`, user: `kaafi`, password: `kaafi_dev_pass` |
| Ollama | `ollama serve` | Required for AI pipeline. Models needed: `deepseek-r1:7b`, `mistral:7b-instruct`, `gemma:7b`, `phi3`. Pipeline degrades gracefully if models are missing. |
| Backend | `DATABASE_URL=postgres://kaafi:kaafi_dev_pass@localhost:5432/kaafi_hsse npm run dev` (in `backend/`) | Uses `node --watch` for auto-reload. Serves frontend dist and API. |
| Frontend dev | `npm run dev` (in `frontend/`) | Vite dev server on port 5173. Only needed for frontend HMR development. For production-like testing, just use backend at port 3000. |

### Key caveats

- **One-link system**: The backend serves the built frontend. After frontend changes, run `npm run build` in `frontend/` and the backend will serve the new assets.
- **No linter or test framework**: This codebase has no ESLint config or test suite. The only code check is `npm run check` in `ai/` (syntax check via `node --check`).
- **Database schema auto-creates**: The backend calls `ensureSchema()` on startup, which runs `backend/src/schema.sql`. No manual migration step needed.
- **API endpoint**: The single analysis endpoint is `POST /api/full-analysis` with `{ "input": "..." }` body. The old `/api/ai/analyze` endpoint has been removed.
- **Frontend build assets are committed**: `frontend/dist/` is checked into the repo.
- **Environment variables**: `DATABASE_URL` (required), `OLLAMA_HOST` (default `http://localhost:11434`), `PORT` (default `3000`).
