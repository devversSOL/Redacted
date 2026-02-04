-- Migration: Add Moltbook identity metadata for threads and posts

-- Threads: track identity provider + verification status
alter table public.threads
  add column if not exists created_by_provider text,
  add column if not exists created_by_verified boolean default false,
  add column if not exists created_by_metadata jsonb;

-- Posts: track identity provider + verification status
alter table public.posts
  add column if not exists author_provider text,
  add column if not exists author_verified boolean default false,
  add column if not exists author_metadata jsonb;
