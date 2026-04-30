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

export async function registerUser({ name, email, role }) {
  const result = await query(
    `INSERT INTO users (name, email, role)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, role, created_at`,
    [name, email, role || "worker"],
  );
  return result.rows[0];
}

export async function listUsers() {
  const result = await query(
    `SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`,
  );
  return result.rows;
}

export async function getUserStats() {
  const result = await query(
    `SELECT role, COUNT(*)::int AS count FROM users GROUP BY role`,
  );
  const stats = { clients: 0, contractors: 0, managers: 0, supervisors: 0, workers: 0 };
  for (const row of result.rows) {
    stats[row.role + "s"] = row.count;
  }
  return stats;
}

export async function listIncidents() {
  const result = await query(
    `SELECT id, title, description, severity, created_at
     FROM incidents ORDER BY created_at DESC LIMIT 50`,
  );
  return result.rows;
}

export async function clearIncidents() {
  await query(`DELETE FROM incidents`);
}

export async function clearAiRuns() {
  await query(`DELETE FROM ai_runs`);
}

export async function saveFormSubmission(formType, data) {
  const result = await query(
    `INSERT INTO form_submissions (form_type, data)
     VALUES ($1, $2)
     RETURNING id, form_type, data, created_at`,
    [formType, JSON.stringify(data)],
  );
  return result.rows[0];
}

export async function listFormSubmissions(formType) {
  const result = await query(
    `SELECT id, form_type, data, created_at
     FROM form_submissions
     WHERE ($1::text IS NULL OR form_type = $1)
     ORDER BY created_at DESC LIMIT 50`,
    [formType || null],
  );
  return result.rows;
}

export async function getFormSubmission(id) {
  const result = await query(
    `SELECT id, form_type, data, created_at FROM form_submissions WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}
