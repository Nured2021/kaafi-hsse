# KAAFI HSSE Platform

KAAFI HSSE is a clean-start safety management platform for collecting HSSE inputs,
running a simple AI analysis chain, and presenting dashboard results.

## Project structure

```text
backend/   Node.js, Express, PostgreSQL, REST API
frontend/  Simple Vite + React UI with dashboard and AI page
ai/        Ollama model calls and sequential pipeline
docs/      Project documentation
```

## Backend

The backend keeps one public API endpoint for analysis:

- `GET /health` checks service and database connectivity.
- `POST /api/full-analysis` runs the full linear AI pipeline and returns
  `risk`, `jsa`, `documents`, `summary`, and model `status`.

Set environment variables before running:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/kaafi_hsse
OLLAMA_HOST=http://localhost:11434
PORT=3000
```

## AI pipeline

The backend calls one direct KAAFI pipeline function inside the same Express
process. There is no orchestration, no routing, and no multi-agent branching:

```text
User Input
  -> deepseek-r1:7b       risk
  -> mistral:7b-instruct  JSA
  -> gemma:7b             documents
  -> phi3                 summary
```

If a model fails, its output field contains the failure message and its status is
set to `FAILED`; later models still run with the available prior output.

## Frontend

The frontend contains a simple dashboard and an AI analysis page. It calls the
backend REST API through same-origin requests. The backend also serves the
compiled `frontend/dist` assets so production runs on one URL and one port.

The backend also applies KAAFI brand sanitization before returning
`/api/full-analysis`, so direct API callers receive cleaned KAAFI output.
