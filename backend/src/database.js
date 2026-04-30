import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DATABASE_URL || path.join(__dirname, "..", "..", "data", "kaafi_hsse.db");

export async function initDatabase() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      company TEXT DEFAULT '',
      role TEXT DEFAULT 'worker',
      province TEXT DEFAULT 'AB',
      is_active INTEGER DEFAULT 1,
      session_token TEXT,
      last_login TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    
    CREATE TABLE IF NOT EXISTS ai_runs (
      id TEXT PRIMARY KEY,
      user_input TEXT,
      province TEXT,
      status TEXT DEFAULT 'pending',
      result TEXT,
      started_at TEXT,
      completed_at TEXT
    );
    
    CREATE TABLE IF NOT EXISTS jsa_records (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      title TEXT,
      steps TEXT,
      hazards TEXT,
      controls TEXT,
      risk_level TEXT,
      company TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    
    CREATE TABLE IF NOT EXISTS permits (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      permit_type TEXT,
      status TEXT DEFAULT 'active',
      work_description TEXT,
      location TEXT,
      issued_at TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      incident_type TEXT,
      severity TEXT,
      description TEXT,
      location TEXT,
      reported_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      action TEXT,
      user_id TEXT,
      resource TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  
  console.log(`Database ready: ${DB_PATH}`);
  return db;
}
