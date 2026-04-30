CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_input TEXT NOT NULL,
  risk_output TEXT,
  jsa_output TEXT,
  document_output TEXT,
  summary_output TEXT,
  status JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
