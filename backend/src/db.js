import Database from "better-sqlite3";
import pg from "pg";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import path from "node:path";

const { Pool } = pg;
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(currentDir, "../data");
const sqlitePath = process.env.SQLITE_PATH || path.join(dataDir, "kaafi_hsse.sqlite");
const usePostgres = Boolean(process.env.DATABASE_URL);

let sqlite;

export const pool = usePostgres
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  : {
      async query(text, params = []) {
        await ensureSqliteReady();
        const prepared = sqlite.prepare(toSqliteSql(text));
        if (/^\s*select/i.test(text) || /\sreturning\s/i.test(text)) {
          return { rows: prepared.all(params) };
        }

        prepared.run(params);
        return { rows: [] };
      },
      async end() {
        sqlite?.close();
      },
    };

function toSqliteSql(sql) {
  return sql
    .replace(/\$\d+/g, "?")
    .replace(/COUNT\(\*\)::int/gi, "COUNT(*)")
    .replace(/TIMESTAMPTZ/gi, "TEXT")
    .replace(/NOW\(\)/gi, "CURRENT_TIMESTAMP");
}

export function query(text, params) {
  return pool.query(text, params);
}

export async function ensureSchema() {
  if (usePostgres) {
    await ensurePostgresSchema();
    return;
  }

  await ensureSqliteReady();
}

async function ensurePostgresSchema() {
  await pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT,
      email TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_input TEXT NOT NULL,
      risk_output TEXT,
      jsa_output TEXT,
      document_output TEXT,
      summary_output TEXT,
      risk_level TEXT,
      safety_stop BOOLEAN NOT NULL DEFAULT FALSE,
      status_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      errors_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      context_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS risk_assessments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ai_run_id UUID REFERENCES ai_runs(id) ON DELETE CASCADE,
      risk_level TEXT NOT NULL,
      hazards_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      controls_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      safety_stop BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jsa_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ai_run_id UUID REFERENCES ai_runs(id) ON DELETE CASCADE,
      jsa_text TEXT NOT NULL,
      critic_output TEXT,
      approved BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

function ensureSqliteSchema() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_runs (
      id TEXT PRIMARY KEY,
      user_input TEXT NOT NULL,
      risk_output TEXT,
      jsa_output TEXT,
      document_output TEXT,
      summary_output TEXT,
      risk_level TEXT,
      safety_stop INTEGER NOT NULL DEFAULT 0,
      status_json TEXT NOT NULL DEFAULT '{}',
      errors_json TEXT NOT NULL DEFAULT '[]',
      context_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS risk_assessments (
      id TEXT PRIMARY KEY,
      ai_run_id TEXT REFERENCES ai_runs(id) ON DELETE CASCADE,
      risk_level TEXT NOT NULL,
      hazards_json TEXT NOT NULL DEFAULT '[]',
      controls_json TEXT NOT NULL DEFAULT '[]',
      safety_stop INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jsa_records (
      id TEXT PRIMARY KEY,
      ai_run_id TEXT REFERENCES ai_runs(id) ON DELETE CASCADE,
      jsa_text TEXT NOT NULL,
      critic_output TEXT,
      approved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function ensureSqliteReady() {
  if (sqlite) {
    return;
  }

  await mkdir(dataDir, { recursive: true });
  sqlite = new Database(sqlitePath);
  sqlite.pragma("journal_mode = WAL");
  ensureSqliteSchema();
}

export async function checkDatabase() {
  await query("SELECT 1");
  return {
    status: "connected",
    engine: usePostgres ? "postgresql" : "sqlite",
  };
}

export function getDatabaseInfo() {
  return usePostgres
    ? { engine: "postgresql", connected: true }
    : { engine: "sqlite", connected: Boolean(sqlite), path: sqlitePath };
}

export async function saveAiRun(analysis) {
  const {
    input,
    risk,
    jsa,
    documents,
    summary,
    riskMatrix = {},
    safetyStop = null,
    status = {},
    errors = [],
  } = analysis;
  const id = randomUUID();
  const safetyStopActive = Boolean(safetyStop?.active);
  const contextJson = JSON.stringify({
    models: analysis.models,
    riskMatrix,
    safetyStop,
    critic: analysis.critic,
  });
  const statusJson = JSON.stringify(status);
  const errorsJson = JSON.stringify(errors);

  const result = await query(
    `INSERT INTO ai_runs (
       id,
       user_input,
       risk_output,
       jsa_output,
       document_output,
       summary_output,
       risk_level,
       safety_stop,
       status_json,
       errors_json,
       context_json
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING
       id,
       user_input AS input,
       risk_output AS risk,
       jsa_output AS jsa,
       document_output AS documents,
       summary_output AS summary,
       risk_level,
       safety_stop,
       status_json,
       errors_json,
       context_json,
       created_at`,
    [
      id,
      input,
      risk,
      jsa,
      documents,
      summary,
      riskMatrix.level || "UNKNOWN",
      safetyStopActive ? 1 : 0,
      statusJson,
      errorsJson,
      contextJson,
    ],
  );

  await saveRiskAssessment(id, analysis);
  await saveJsaRecord(id, analysis);

  return normalizeAiRun(result.rows[0]);
}

export async function listAiRuns() {
  const result = await query(
    `SELECT
       id,
       user_input AS input,
       risk_output AS risk,
       jsa_output AS jsa,
       document_output AS documents,
       summary_output AS summary,
       risk_level,
       safety_stop,
       status_json,
       errors_json,
       context_json,
       created_at
     FROM ai_runs
     ORDER BY created_at DESC
     LIMIT 50`,
  );

  return result.rows.map(normalizeAiRun);
}

export async function getAiRunById(id) {
  const result = await query(
    `SELECT
       id,
       user_input AS input,
       risk_output AS risk,
       jsa_output AS jsa,
       document_output AS documents,
       summary_output AS summary,
       risk_level,
       safety_stop,
       status_json,
       errors_json,
       context_json,
       created_at
     FROM ai_runs
     WHERE id = $1`,
    [id],
  );

  return result.rows[0] ? normalizeAiRun(result.rows[0]) : null;
}

export const getAiRun = getAiRunById;

async function saveRiskAssessment(aiRunId, analysis) {
  await query(
    `INSERT INTO risk_assessments (
       id, ai_run_id, risk_level, hazards_json, controls_json, safety_stop
     )
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      randomUUID(),
      aiRunId,
      analysis.riskMatrix?.level || "UNKNOWN",
      JSON.stringify(analysis.riskMatrix?.hazards || []),
      JSON.stringify(analysis.riskMatrix?.controls || []),
      analysis.safetyStop?.active ? 1 : 0,
    ],
  );
}

async function saveJsaRecord(aiRunId, analysis) {
  await query(
    `INSERT INTO jsa_records (id, ai_run_id, jsa_text, critic_output, approved)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      randomUUID(),
      aiRunId,
      analysis.jsa || "",
      analysis.critic?.review || "",
      analysis.critic?.approved ? 1 : 0,
    ],
  );
}

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeAiRun(row) {
  return {
    ...row,
    safety_stop: Boolean(row.safety_stop),
    status: parseJson(row.status_json, {}),
    errors: parseJson(row.errors_json, []),
    context: parseJson(row.context_json, {}),
  };
}
