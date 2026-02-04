-- Migration: Add thread thumbnail support
-- Run after 003_forum_schema.sql

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'threads') then
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'threads'
        and column_name = 'thumbnail_url'
    ) then
      alter table public.threads add column thumbnail_url text;
    end if;
  end if;
end $$;
