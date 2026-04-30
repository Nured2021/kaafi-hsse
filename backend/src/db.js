import pg from "pg";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const { Pool } = pg;
const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "schema.sql");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export function query(text, params) {
  return pool.query(text, params);
}

export async function ensureSchema() {
  const schema = await readFile(schemaPath, "utf8");
  await pool.query(schema);
}

export async function saveAiRun({ input, risk, jsa, documents, summary }) {
  const result = await query(
    `INSERT INTO ai_runs (user_input, risk_output, jsa_output, document_output, summary_output)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING
       id,
       user_input AS input,
       risk_output AS risk,
       jsa_output AS jsa,
       document_output AS documents,
       summary_output AS summary,
       created_at`,
    [input, risk, jsa, documents, summary],
  );

  return result.rows[0];
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
       created_at
     FROM ai_runs
     ORDER BY created_at DESC
     LIMIT 50`,
  );

  return result.rows;
}
