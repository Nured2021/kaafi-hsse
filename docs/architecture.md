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

The backend exposes a REST API:

- `GET /health` checks service and PostgreSQL connectivity.
- `GET /api/dashboard` returns dashboard counters.
- `GET /api/ai/runs` lists recent AI analyses.
- `POST /api/full-analysis` runs the full linear AI pipeline and returns
  `risk`, `jsa`, `documents`, and `summary`.
- `POST /api/ai/analyze` runs the KAAFI HSSE AI pipeline and stores the result.

Set environment variables before running:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/kaafi_hsse
OLLAMA_HOST=http://localhost:11434
PORT=3000
```

## AI pipeline

There is no orchestrator and no model routing. The backend calls one direct
function that runs each Ollama model in this fixed order:

```text
User Input
  -> deepseek-r1:7b       risk
  -> mistral:7b-instruct  JSA
  -> gemma:7b             documents
  -> phi3                 summary
```

## Frontend

The frontend contains a simple dashboard and an AI analysis page. It calls the
backend REST API through same-origin requests. The backend also serves the
compiled `frontend/dist` assets so production runs on one URL and one port.
