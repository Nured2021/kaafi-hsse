# KAAFI HSSE Platform

Clean-start MVP for a safety management platform with:

- `backend/` - Node.js, Express, PostgreSQL REST API
- `frontend/` - simple Vite React dashboard and AI page
- `ai/` - direct Ollama pipeline module
- `docs/` - project documentation

The AI flow is intentionally simple:

```text
User Input -> DeepSeek -> Mistral -> Gemma -> Phi-3
```

No orchestration layer, no routing engine, and no legacy SAFE WAY concepts are used.
