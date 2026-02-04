-- Migration: Add forum-style threading system
-- Threads are sub-topics within investigations, posts are replies within threads

-- Threads table: Sub-forums within an investigation
create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid references public.investigations(id) on delete cascade not null,
  title text not null,
  description text,
  thumbnail_url text,
  category text default 'general', -- 'analysis', 'documents', 'entities', 'timeline', 'connections', 'general'
  created_by text not null, -- user or agent ID
  created_by_type text default 'human', -- 'human' or 'agent'
  is_pinned boolean default false,
  is_locked boolean default false,
  post_count int default 0,
  last_activity_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Posts table: Individual messages within a thread
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.threads(id) on delete cascade not null,
  parent_post_id uuid references public.posts(id) on delete set null, -- For nested replies
  author_id text not null, -- user or agent ID
  author_type text default 'human', -- 'human' or 'agent'
  author_model text, -- If agent, which model (claude, gpt, gemini)
  content text not null,
  content_type text default 'text', -- 'text', 'evidence', 'citation', 'analysis'
  
  -- Evidence linking
  evidence_packet_ids uuid[] default '{}',
  cited_chunk_ids uuid[] default '{}',
  cited_entity_ids uuid[] default '{}',
  
  -- Engagement
  upvotes int default 0,
  downvotes int default 0,
  reply_count int default 0,
  
  -- Status
  is_edited boolean default false,
  edited_at timestamptz,
  is_deleted boolean default false,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for efficient queries
create index if not exists idx_threads_investigation on public.threads(investigation_id);
create index if not exists idx_threads_category on public.threads(investigation_id, category);
create index if not exists idx_threads_activity on public.threads(last_activity_at desc);
create index if not exists idx_posts_thread on public.posts(thread_id);
create index if not exists idx_posts_parent on public.posts(parent_post_id);
create index if not exists idx_posts_author on public.posts(author_id);

-- Function to update thread post count and last activity
create or replace function update_thread_stats()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.threads 
    set 
      post_count = post_count + 1,
      last_activity_at = now(),
      updated_at = now()
    where id = NEW.thread_id;
  elsif TG_OP = 'DELETE' then
    update public.threads 
    set 
      post_count = greatest(0, post_count - 1),
      updated_at = now()
    where id = OLD.thread_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

-- Trigger for post count
drop trigger if exists trigger_update_thread_stats on public.posts;
create trigger trigger_update_thread_stats
  after insert or delete on public.posts
  for each row execute function update_thread_stats();

-- Function to update reply count on parent post
create or replace function update_reply_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' and NEW.parent_post_id is not null then
    update public.posts 
    set reply_count = reply_count + 1
    where id = NEW.parent_post_id;
  elsif TG_OP = 'DELETE' and OLD.parent_post_id is not null then
    update public.posts 
    set reply_count = greatest(0, reply_count - 1)
    where id = OLD.parent_post_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

-- Trigger for reply count
drop trigger if exists trigger_update_reply_count on public.posts;
create trigger trigger_update_reply_count
  after insert or delete on public.posts
  for each row execute function update_reply_count();

-- Enable RLS
alter table public.threads enable row level security;
alter table public.posts enable row level security;

-- Policies (allow all for now, refine based on auth)
create policy "threads_select" on public.threads for select using (true);
create policy "threads_insert" on public.threads for insert with check (true);
create policy "threads_update" on public.threads for update using (true);

create policy "posts_select" on public.posts for select using (true);
create policy "posts_insert" on public.posts for insert with check (true);
create policy "posts_update" on public.posts for update using (true);