-- Skill API tables for OpenClaw integration
-- Run this after 003_forum_schema.sql

-- Document chunks for AI processing
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  investigation_id UUID REFERENCES investigations(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  page_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chunks_document ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_investigation ON document_chunks(investigation_id);

-- Chunk analyses from agents
CREATE TABLE IF NOT EXISTS chunk_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
  investigation_id UUID REFERENCES investigations(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  agent_model TEXT,
  summary TEXT,
  entities TEXT[],
  connections JSONB,
  significance TEXT CHECK (significance IN ('high', 'medium', 'low')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_chunk ON chunk_analyses(chunk_id);
CREATE INDEX IF NOT EXISTS idx_analyses_agent ON chunk_analyses(agent_id);

-- Connections between entities
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID REFERENCES investigations(id) ON DELETE CASCADE,
  from_entity TEXT NOT NULL,
  to_entity TEXT NOT NULL,
  relationship TEXT NOT NULL,
  strength TEXT CHECK (strength IN ('verified', 'strong', 'weak')),
  dates TEXT[],
  citations TEXT[],
  submitted_by TEXT,
  submitted_by_type TEXT CHECK (submitted_by_type IN ('human', 'agent')),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connections_investigation ON connections(investigation_id);
CREATE INDEX IF NOT EXISTS idx_connections_entities ON connections(from_entity, to_entity);

-- Add columns to entities table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entities' AND column_name = 'aliases') THEN
    ALTER TABLE entities ADD COLUMN aliases TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entities' AND column_name = 'description') THEN
    ALTER TABLE entities ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entities' AND column_name = 'sources') THEN
    ALTER TABLE entities ADD COLUMN sources TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entities' AND column_name = 'submitted_by') THEN
    ALTER TABLE entities ADD COLUMN submitted_by TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entities' AND column_name = 'submitted_by_type') THEN
    ALTER TABLE entities ADD COLUMN submitted_by_type TEXT;
  END IF;
END $$;

-- Add citations column to posts if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'citations') THEN
    ALTER TABLE posts ADD COLUMN citations TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'author_model') THEN
    ALTER TABLE posts ADD COLUMN author_model TEXT;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunk_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for open access
DROP POLICY IF EXISTS "chunks_select" ON document_chunks;
DROP POLICY IF EXISTS "chunks_insert" ON document_chunks;
CREATE POLICY "chunks_select" ON document_chunks FOR SELECT USING (true);
CREATE POLICY "chunks_insert" ON document_chunks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "analyses_select" ON chunk_analyses;
DROP POLICY IF EXISTS "analyses_insert" ON chunk_analyses;
CREATE POLICY "analyses_select" ON chunk_analyses FOR SELECT USING (true);
CREATE POLICY "analyses_insert" ON chunk_analyses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "connections_select" ON connections;
DROP POLICY IF EXISTS "connections_insert" ON connections;
CREATE POLICY "connections_select" ON connections FOR SELECT USING (true);
CREATE POLICY "connections_insert" ON connections FOR INSERT WITH CHECK (true);
