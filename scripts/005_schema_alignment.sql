-- Migration: Align schema with current codebase usage
-- Run after 001-004 migrations
-- All operations are wrapped in existence checks to be idempotent

-- ===========================================
-- DOCUMENTS TABLE: Add missing columns used by OCR route
-- ===========================================

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'documents') then
    -- Make file_url optional if it exists and is not null
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'documents' and column_name = 'file_url' and is_nullable = 'NO') then
      alter table public.documents alter column file_url drop not null;
    end if;
    
    -- Make file_type optional if it exists and is not null
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'documents' and column_name = 'file_type' and is_nullable = 'NO') then
      alter table public.documents alter column file_type drop not null;
    end if;
    
    -- Add columns used by OCR processing
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'documents' and column_name = 'content_hash') then
      alter table public.documents add column content_hash text;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'documents' and column_name = 'page_count') then
      alter table public.documents add column page_count int default 1;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'documents' and column_name = 'status') then
      alter table public.documents add column status text default 'pending';
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'documents' and column_name = 'metadata') then
      alter table public.documents add column metadata jsonb default '{}';
    end if;
  end if;
end $$;

-- Create index for content hash lookups (deduplication)
create index if not exists idx_documents_content_hash on public.documents(content_hash);

-- ===========================================
-- EVIDENCE_PACKETS TABLE: Add validation and forensic columns
-- ===========================================

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'evidence_packets') then
    -- Rename upvotes to votes if upvotes exists and votes doesn't
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'evidence_packets' and column_name = 'upvotes') 
       and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'evidence_packets' and column_name = 'votes') then
      alter table public.evidence_packets rename column upvotes to votes;
    end if;
    
    -- Make agent_type optional if it exists
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'evidence_packets' and column_name = 'agent_type' and is_nullable = 'NO') then
      alter table public.evidence_packets alter column agent_type drop not null;
    end if;
    
    -- Add agent_model
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'evidence_packets' and column_name = 'agent_model') then
      alter table public.evidence_packets add column agent_model text;
    end if;
    
    -- Add forensic validation columns
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'evidence_packets' and column_name = 'uncertainty_notes') then
      alter table public.evidence_packets add column uncertainty_notes text[] default '{}';
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'evidence_packets' and column_name = 'supporting_chunk_ids') then
      alter table public.evidence_packets add column supporting_chunk_ids uuid[] default '{}';
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'evidence_packets' and column_name = 'validation_status') then
      alter table public.evidence_packets add column validation_status text default 'pending';
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'evidence_packets' and column_name = 'validation_notes') then
      alter table public.evidence_packets add column validation_notes text[] default '{}';
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'evidence_packets' and column_name = 'raw_agent_output') then
      alter table public.evidence_packets add column raw_agent_output text;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'evidence_packets' and column_name = 'document_id') then
      alter table public.evidence_packets add column document_id uuid references public.documents(id);
    end if;
  end if;
end $$;

-- Create index for validation status filtering
create index if not exists idx_evidence_validation_status on public.evidence_packets(validation_status);

-- ===========================================
-- AGENT_ACTIVITY TABLE: Add metadata and agent_model
-- ===========================================

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'agent_activity') then
    -- Add columns if not exists
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'agent_activity' and column_name = 'agent_model') then
      alter table public.agent_activity add column agent_model text;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'agent_activity' and column_name = 'metadata') then
      alter table public.agent_activity add column metadata jsonb default '{}';
    end if;
    
    -- Set default on agent_type only if column exists
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'agent_activity' and column_name = 'agent_type') then
      alter table public.agent_activity alter column agent_type set default 'system';
    end if;
  end if;
end $$;

-- ===========================================
-- VALIDATION_LOG TABLE: Create if not exists (used by redaction validator)
-- ===========================================

do $$
begin
  -- Create table if not exists
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'validation_log') then
    create table public.validation_log (
      id uuid primary key default gen_random_uuid(),
      entity_type text not null,
      entity_id text,
      validation_status text not null,
      is_valid boolean not null,
      violations jsonb default '[]',
      warnings jsonb default '[]',
      content_sample text,
      created_at timestamptz default now()
    );
    
    alter table public.validation_log enable row level security;
    create policy "public_validation_log" on public.validation_log for all using (true) with check (true);
  end if;
  
  -- Create indexes if table has entity_type column
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'validation_log' and column_name = 'entity_type') then
    create index if not exists idx_validation_log_entity on public.validation_log(entity_type, entity_id);
  end if;
  
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'validation_log' and column_name = 'validation_status') then
    create index if not exists idx_validation_log_status on public.validation_log(validation_status);
  end if;
end $$;

-- ===========================================
-- ENTITIES TABLE: Add unique constraint for upsert (only if table exists)
-- ===========================================

do $$ 
begin
  -- Only proceed if entities table exists
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'entities') then
    -- Add unique constraint on name if not exists
    if not exists (select 1 from pg_constraint where conname = 'entities_name_key') then
      alter table public.entities add constraint entities_name_key unique (name);
    end if;
    
    -- Add metadata column if not exists
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'entities' and column_name = 'metadata') then
      alter table public.entities add column metadata jsonb default '{}';
    end if;
  end if;
end $$;
