# KAAFI HSSE Platform

Clean-start MVP for a safety management platform with:

- `backend/` - Node.js, Express, PostgreSQL REST API with SQLite fallback
- `frontend/` - simple Vite React dashboard and AI page
- `ai/` - direct Ollama pipeline module
- `docs/` - project documentation

The AI flow now uses an in-process HSSE Context Bus inside the same backend:

```text
User Input -> DeepSeek risk gate -> Mistral JSA -> DeepSeek critic -> Gemma documents -> phi3 summary
```

No separate service, no routing engine, and no legacy SAFE WAY concepts are used.

The current UI also includes a KAAFI Core Layer bridge at
`frontend/src/core/kaafi_bridge/bridge.ts`. It injects KAAFI branding into the
existing form, cleans old company names before analysis, applies HSSE risk
colors, and shows a supportive safety assistant prompt.

Run the full local system verification with:

```bash
./test.sh
```
