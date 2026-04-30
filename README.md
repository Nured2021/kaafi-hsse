# KAAFI HSSE Platform

Clean-start MVP for a safety management platform with:

- `backend/` - Node.js, Express, PostgreSQL REST API with SQLite fallback
- `frontend/` - simple Vite React AI page
- `ai/` - direct Ollama pipeline module
- `docs/` - project documentation

The AI flow is one clean linear Ollama pipeline:

```text
User Input -> DeepSeek risk -> Mistral JSA -> Gemma documents -> Phi-3 summary
```

No orchestration, no routing engine, no multi-agent system, and no legacy SAFE
WAY concepts are used.

Run the full local system verification with:

```bash
./test.sh
```
