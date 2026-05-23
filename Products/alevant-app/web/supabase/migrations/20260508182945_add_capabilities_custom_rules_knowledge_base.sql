-- Reconciled from prod 2026-05-23 (originally applied 2026-05-08).
-- Adds AI capabilities + custom rules + per-persona knowledge base (with pgvector
-- embeddings for RAG retrieval) + the mls_safe_mode flag on workspaces +
-- the knowledge-files storage bucket.

CREATE EXTENSION IF NOT EXISTS vector;

-- ── AI capabilities — the toggle list per workspace per persona ──
CREATE TABLE IF NOT EXISTS ai_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  persona text NOT NULL CHECK (persona IN ('sofia', 'vesper')),
  category text NOT NULL,
  capability_key text NOT NULL,
  label text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  is_custom boolean NOT NULL DEFAULT false,
  is_master_kill boolean NOT NULL DEFAULT false,
  is_v2 boolean NOT NULL DEFAULT false,
  warns_when_off text,
  sort_order int NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, persona, capability_key)
);
CREATE INDEX IF NOT EXISTS ai_capabilities_workspace_persona_idx
  ON ai_capabilities (workspace_id, persona, enabled);

-- ── Custom rules added by Thomas ──
CREATE TABLE IF NOT EXISTS ai_custom_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  persona text NOT NULL CHECK (persona IN ('sofia', 'vesper')),
  category text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  scope text DEFAULT 'global',
  scope_value text,
  enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_custom_rules_workspace_persona_idx
  ON ai_custom_rules (workspace_id, persona, enabled);

-- ── Knowledge collections (folders) ──
CREATE TABLE IF NOT EXISTS knowledge_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  persona text NOT NULL CHECK (persona IN ('sofia', 'vesper', 'shared')),
  name text NOT NULL,
  description text,
  icon text,
  color text,
  sort_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Knowledge entries — the structured + RAG hybrid store ──
CREATE TABLE IF NOT EXISTS knowledge_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  persona text NOT NULL CHECK (persona IN ('sofia', 'vesper', 'shared')),
  collection_id uuid REFERENCES knowledge_collections(id) ON DELETE SET NULL,
  category text NOT NULL,
  title text NOT NULL,
  body text,
  metadata jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  is_pinned boolean NOT NULL DEFAULT false,
  source text DEFAULT 'manual',
  source_url text,
  embedding vector(1024),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS knowledge_entries_workspace_persona_idx
  ON knowledge_entries (workspace_id, persona);
CREATE INDEX IF NOT EXISTS knowledge_entries_pinned_idx
  ON knowledge_entries (workspace_id, persona, is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS knowledge_entries_tags_idx
  ON knowledge_entries USING gin (tags);
CREATE INDEX IF NOT EXISTS knowledge_entries_embedding_idx
  ON knowledge_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ── Knowledge files (image / PDF / video attachments) ──
CREATE TABLE IF NOT EXISTS knowledge_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  entry_id uuid REFERENCES knowledge_entries(id) ON DELETE CASCADE,
  persona text NOT NULL CHECK (persona IN ('sofia', 'vesper', 'shared')),
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  file_size_bytes bigint,
  caption text,
  tags text[] DEFAULT ARRAY[]::text[],
  shot_type text,
  time_of_day text,
  mood text,
  is_approved boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS knowledge_files_workspace_persona_idx
  ON knowledge_files (workspace_id, persona);

-- ── MLS-safe mode flag on workspaces (Option B middle-ground) ──
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS mls_safe_mode boolean DEFAULT false;
COMMENT ON COLUMN workspaces.mls_safe_mode IS
  'When ON: deny-word lint runs on Vesper publishes, MLS data ingestion paused. When OFF: no restrictions. Default OFF; auto-flip during MLS application review window.';

-- ── Storage bucket for KB files ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-files', 'knowledge-files', false)
ON CONFLICT (id) DO NOTHING;
