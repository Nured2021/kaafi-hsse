import "dotenv/config";
import cors from "cors";
import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  ensureSchema, listAiRuns, pool, saveAiRun,
  registerUser, listUsers, getUserStats,
  listIncidents, clearIncidents, clearAiRuns,
  saveFormSubmission, listFormSubmissions, getFormSubmission,
} from "./db.js";
import { runKaafiPipeline } from "../../ai/index.js";

const app = express();
const port = process.env.PORT || 3000;
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDistPath = path.resolve(currentDir, "../../frontend/dist");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(503).json({ status: "error", database: "unavailable", message: error.message });
  }
});

app.get("/api/dashboard", async (_req, res, next) => {
  try {
    const aiRuns = await pool.query("SELECT COUNT(*)::int AS count FROM ai_runs");

    res.json({
      aiAssessments: aiRuns.rows[0]?.count || 0,
      platform: "KAAFI HSSE",
      pipeline: ["DeepSeek", "Mistral", "Gemma", "Phi-3"],
    });
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

app.post("/api/full-analysis", async (req, res, next) => {
  const { input } = req.body;

  if (!input || typeof input !== "string" || !input.trim()) {
    return res.status(400).json({ message: "input is required" });
  }

  try {
    const analysis = await runKaafiPipeline(input);

    try {
      await saveAiRun(analysis);
    } catch (databaseError) {
      console.error("Failed to save full analysis", databaseError);
    }

    res.json({
      risk: analysis.risk,
      jsa: analysis.jsa,
      documents: analysis.documents,
      summary: analysis.summary,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users/register", async (req, res, next) => {
  const { name, email, role } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "name and email are required" });
  }

  try {
    const user = await registerUser({ name, email, role });
    res.status(201).json(user);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email already registered" });
    }
    next(error);
  }
});

app.get("/api/users", async (_req, res, next) => {
  try {
    res.json(await listUsers());
  } catch (error) {
    next(error);
  }
});

app.get("/api/users/stats", async (_req, res, next) => {
  try {
    res.json(await getUserStats());
  } catch (error) {
    next(error);
  }
});

app.get("/api/incidents", async (_req, res, next) => {
  try {
    res.json(await listIncidents());
  } catch (error) {
    next(error);
  }
});

app.delete("/api/incidents", async (_req, res, next) => {
  try {
    await clearIncidents();
    res.json({ message: "Incident history cleared" });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/ai/runs", async (_req, res, next) => {
  try {
    await clearAiRuns();
    res.json({ message: "AI run history cleared" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/forms", async (req, res, next) => {
  const { formType, data } = req.body;

  if (!formType || !data) {
    return res.status(400).json({ message: "formType and data are required" });
  }

  try {
    const submission = await saveFormSubmission(formType, data);
    res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
});

app.get("/api/forms", async (req, res, next) => {
  try {
    const formType = req.query.type || null;
    res.json(await listFormSubmissions(formType));
  } catch (error) {
    next(error);
  }
});

app.get("/api/forms/:id", async (req, res, next) => {
  try {
    const submission = await getFormSubmission(req.params.id);
    if (!submission) return res.status(404).json({ message: "Form not found" });
    res.json(submission);
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
    await pool.end();
    process.exit(0);
  });
});
