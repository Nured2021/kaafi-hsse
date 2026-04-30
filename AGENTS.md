# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

KAAFI HSSE is a 3-tier Node.js monorepo (backend + frontend + AI module) for HSSE safety analysis. See `docs/architecture.md` and `README.md` for details.

### Running services

- **Backend** (Express, port 3000): `cd backend && npm run dev` — uses `node --watch` for hot reload. Set `DATABASE_URL=""` to use SQLite fallback (no Postgres needed for dev).
- **Frontend** (Vite + React): `cd frontend && npm run dev` — runs on port 5173. The backend also serves the built frontend from `frontend/dist/` on port 3000, so a separate Vite dev server is optional.
- **AI pipeline**: runs in-process inside the backend — no separate service needed. Requires an Ollama-compatible server at `OLLAMA_HOST` (default `http://localhost:11434`).

### Mock Ollama for development

Real Ollama with 7B models is not available in Cloud Agent VMs. Use a mock Ollama server instead:

```bash
node -e 'const http=require("http");http.createServer((req,res)=>{let b="";req.on("data",c=>b+=c);req.on("end",()=>{if(req.method!=="POST"||req.url!=="/api/generate"){res.writeHead(404);return res.end("not found")}const p=JSON.parse(b||"{}");res.writeHead(200,{"content-type":"application/json"});res.end(JSON.stringify({response:"KAAFI HSSE safety analysis output from "+p.model+". Hazards identified: working at heights, confined spaces. Risk Level: MEDIUM. Recommended PPE: hard hat, safety harness, steel-toe boots."}))})}).listen(11434,()=>console.log("mock ollama ready"))'
```

### Testing

Run the full integration test suite: `./test.sh` (from repo root). It starts its own mock Ollama and backend, so no manual setup is needed.

### Build

Frontend build: `cd frontend && npm run build` — outputs to `frontend/dist/`.

### Key gotchas

- The AI module (`ai/`) has no runtime dependencies of its own — it imports from the backend's `node_modules`. Only `backend/` and `frontend/` need `npm install`.
- The backend uses ES modules (`"type": "module"`) — use `import` not `require`.
- `better-sqlite3` is a native addon compiled at install time; if `npm install` fails, check Node.js version compatibility (v18+ required).
- `test.sh` uses port 3100 by default (configurable via `PORT` env var) and port 11434 for mock Ollama (configurable via `OLLAMA_PORT`).
