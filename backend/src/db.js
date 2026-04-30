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
    CREATE TABLE IF NOT EXISTS ai_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_input TEXT NOT NULL,
      risk_output TEXT,
      jsa_output TEXT,
      document_output TEXT,
      summary_output TEXT,
      status_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

function ensureSqliteSchema() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS ai_runs (
      id TEXT PRIMARY KEY,
      user_input TEXT NOT NULL,
      risk_output TEXT,
      jsa_output TEXT,
      document_output TEXT,
      summary_output TEXT,
      status_json TEXT NOT NULL DEFAULT '{}',
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
  const id = randomUUID();
  const statusJson = JSON.stringify(analysis.status || {});

  const result = await query(
    `INSERT INTO ai_runs (
       id,
       user_input,
       risk_output,
       jsa_output,
       document_output,
       summary_output,
       status_json
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING
       id,
       user_input AS input,
       risk_output AS risk,
       jsa_output AS jsa,
       document_output AS documents,
       summary_output AS summary,
       status_json,
       created_at`,
    [
      id,
      analysis.input,
      analysis.risk,
      analysis.jsa,
      analysis.documents,
      analysis.summary,
      statusJson,
    ],
  );

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
       status_json,
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
       status_json,
       created_at
     FROM ai_runs
     WHERE id = $1`,
    [id],
  );

  return result.rows[0] ? normalizeAiRun(result.rows[0]) : null;
}

export const getAiRun = getAiRunById;

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
    status: parseJson(row.status_json, {}),
  };
}
