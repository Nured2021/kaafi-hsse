# KAAFI HSSE Platform

Clean-start MVP for a safety management platform with:

- `backend/` - Node.js, Express, PostgreSQL REST API
- `frontend/` - simple Vite React dashboard and AI page
- `ai/` - direct Ollama pipeline module
- `docs/` - project documentation

The AI flow is intentionally simple:

```text
User Input -> DeepSeek -> Mistral -> Gemma -> phi3
```

No orchestration layer, no routing engine, and no legacy SAFE WAY concepts are used.

The current UI also includes a KAAFI Core Layer bridge at
`frontend/src/core/kaafi_bridge/bridge.ts`. It injects KAAFI branding into the
existing form, cleans old company names before analysis, applies HSSE risk
colors, and shows a supportive safety assistant prompt.
