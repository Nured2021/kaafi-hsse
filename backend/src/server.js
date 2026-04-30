import "dotenv/config";
import cors from "cors";
import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ensureSchema, getAiRun, getDatabaseInfo, listAiRuns, query, saveAiRun } from "./db.js";
import { enforceKaafiBranding, runKaafiPipeline } from "../../ai/index.js";

const app = express();
const port = process.env.PORT || 3000;
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDistPath = path.resolve(currentDir, "../../frontend/dist");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", async (_req, res) => {
  try {
    await query("SELECT 1");
    res.json({ status: "ok", database: getDatabaseInfo() });
  } catch (error) {
    res.status(503).json({ status: "error", database: "unavailable", message: error.message });
  }
});

app.get("/api/dashboard", async (_req, res, next) => {
  try {
    const aiRuns = await query("SELECT COUNT(*) AS count FROM ai_runs");

    res.json({
      aiAssessments: Number(aiRuns.rows[0]?.count || 0),
      platform: "KAAFI HSSE",
      pipeline: ["DeepSeek", "Mistral", "Gemma", "Phi-3"],
      database: getDatabaseInfo(),
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/ai/history", async (_req, res, next) => {
  try {
    res.json(await listAiRuns());
  } catch (error) {
    next(error);
  }
});

app.get("/api/ai/runs", async (_req, res, next) => {
  try {
    res.json(await listAiRuns());
  } catch (error) {
    next(error);
  }
});

app.get("/api/ai/runs/:id", async (req, res, next) => {
  try {
    const run = await getAiRun(req.params.id);

    if (!run) {
      return res.status(404).json({ message: "AI run not found" });
    }

    res.json(run);
  } catch (error) {
    next(error);
  }
});

app.post("/api/ai/analyze", async (req, res, next) => {
  const { input } = req.body;

  if (!input || typeof input !== "string") {
    return res.status(400).json({ message: "input is required" });
  }

  try {
    const analysis = enforceKaafiBranding(await runKaafiPipeline(input));
    const savedRun = await saveAiRun(analysis);

    res.json({ ...analysis, id: savedRun.id, created_at: savedRun.created_at });
  } catch (error) {
    next(error);
  }
});

app.post("/api/full-analysis", async (req, res, next) => {
  const { input } = req.body;

  if (!input || typeof input !== "string" || !input.trim()) {
    return res.status(400).json({ message: "input is required" });
  }

  try {
    const analysis = enforceKaafiBranding(await runKaafiPipeline(input));
    let savedRun = null;

    try {
      savedRun = await saveAiRun(analysis);
    } catch (databaseError) {
      console.error("Failed to save full analysis", databaseError);
    }

    res.json({
      id: savedRun?.id,
      risk: analysis.risk,
      jsa: analysis.jsa,
      documents: analysis.documents,
      summary: analysis.summary,
      status: analysis.status,
      failedModels: analysis.failedModels,
      currentModel: analysis.currentModel,
      safetyStop: analysis.safetyStop,
      riskLevel: analysis.riskLevel,
      contextBus: analysis.contextBus,
      created_at: savedRun?.created_at,
    });
  } catch (error) {
    next(error);
  }
});

app.use(express.static(frontendDistPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});

try {
  await ensureSchema();
} catch (databaseError) {
  console.error("Database schema setup failed", databaseError);
}

const server = app.listen(port, () => {
  console.log(`KAAFI HSSE backend listening on port ${port}`);
});

process.on("SIGTERM", async () => {
  server.close(async () => {
    process.exit(0);
  });
});
