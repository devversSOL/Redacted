-- Migration: Add forensic-grade schema for chunks, events, connections, and document hashing
-- This migration adds the missing tables required for audit-safe evidence processing

-- Add hash column to documents for integrity verification
alter table public.documents add column if not exists content_hash text;
alter table public.documents add column if not exists page_count int default 1;

-- Chunks table: Addressable text segments with page/offset tracking
create table if not exists public.chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  page int not null default 1,
  start_offset int not null,
  end_offset int not null,
  text text not null,
  chunk_index int not null,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  
  constraint valid_offsets check (end_offset > start_offset),
  constraint valid_page check (page >= 1)
);

-- Index for efficient chunk lookups
create index if not exists idx_chunks_document on public.chunks(document_id);
create index if not exists idx_chunks_page on public.chunks(document_id, page);

-- Events table: Temporal anchors extracted from documents
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid references public.investigations(id) on delete set null,
  time_start timestamptz,
  time_end timestamptz,
  time_precision text default 'day', -- 'year', 'month', 'day', 'hour', 'minute', 'exact'
  time_raw text, -- Original text representation
  location text,
  location_type text, -- 'city', 'country', 'address', 'coordinates', 'unknown'
  description text not null,
  event_type text default 'unknown', -- 'meeting', 'transaction', 'travel', 'communication', 'filing', 'unknown'
  supporting_chunk_ids uuid[] default '{}',
  confidence float default 0.5,
  created_by text,
  created_at timestamptz default now(),
  
  constraint valid_time_range check (time_end is null or time_end >= time_start)
);

create index if not exists idx_events_investigation on public.events(investigation_id);
create index if not exists idx_events_time on public.events(time_start);

-- Connections table: Relationships between entities
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid references public.investigations(id) on delete set null,
  source_entity_id uuid references public.entities(id) on delete cascade,
  target_entity_id uuid references public.entities(id) on delete cascade,
  relationship_type text not null, -- 'employed_by', 'met_with', 'traveled_to', 'transferred_to', 'associated_with'
  relationship_label text, -- Human-readable description
  strength text default 'unverified', -- 'confirmed', 'likely', 'possible', 'unverified'
  direction text default 'directed', -- 'directed', 'bidirectional'
  supporting_packet_ids uuid[] default '{}',
  supporting_chunk_ids uuid[] default '{}',
  first_observed timestamptz,
  last_observed timestamptz,
  occurrence_count int default 1,
  metadata jsonb default '{}',
  created_by text,
  created_at timestamptz default now(),
  
  constraint no_self_connection check (source_entity_id != target_entity_id)
);

create index if not exists idx_connections_investigation on public.connections(investigation_id);
create index if not exists idx_connections_source on public.connections(source_entity_id);
create index if not exists idx_connections_target on public.connections(target_entity_id);

-- Update evidence_packets to support chunk-based citations
alter table public.evidence_packets add column if not exists supporting_chunk_ids uuid[] default '{}';
alter table public.evidence_packets add column if not exists validation_status text default 'pending'; -- 'pending', 'valid', 'flagged', 'rejected'
alter table public.evidence_packets add column if not exists validation_notes text[] default '{}';
alter table public.evidence_packets add column if not exists raw_agent_output text; -- Store original for audit

-- Update entities table
alter table public.entities add column if not exists first_seen_chunk_id uuid references public.chunks(id);
alter table public.entities add column if not exists mention_count int default 1;
alter table public.entities add column if not exists confidence float default 0.5;

-- Validation audit log: Track all validation decisions
create table if not exists public.validation_log (
  id uuid primary key default gen_random_uuid(),
  target_type text not null, -- 'evidence_packet', 'entity', 'connection'
  target_id uuid not null,
  validation_result text not null, -- 'passed', 'flagged', 'rejected'
  rule_violations text[] default '{}',
  validator_version text default '1.0',
  raw_content text,
  created_at timestamptz default now()
);

create index if not exists idx_validation_target on public.validation_log(target_type, target_id);

-- Enable RLS on new tables
alter table public.chunks enable row level security;
alter table public.events enable row level security;
alter table public.connections enable row level security;
alter table public.validation_log enable row level security;

-- Policies for new tables
create policy "public_chunks" on public.chunks for all using (true) with check (true);
create policy "public_events" on public.events for all using (true) with check (true);
create policy "public_connections" on public.connections for all using (true) with check (true);
create policy "public_validation" on public.validation_log for all using (true) with check (true);
