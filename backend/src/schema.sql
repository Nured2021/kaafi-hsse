CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_input TEXT NOT NULL,
  risk_output TEXT,
  jsa_output TEXT,
  document_output TEXT,
  summary_output TEXT,
  status JSONB,
  risk_level TEXT,
  safety_stop BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'worker',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_run_id UUID REFERENCES ai_runs(id) ON DELETE SET NULL,
  risk_level TEXT NOT NULL,
  hazards JSONB NOT NULL DEFAULT '[]'::jsonb,
  controls JSONB NOT NULL DEFAULT '[]'::jsonb,
  safety_stop BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jsa_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_run_id UUID REFERENCES ai_runs(id) ON DELETE SET NULL,
  task TEXT NOT NULL,
  steps TEXT,
  critic_notes TEXT,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

