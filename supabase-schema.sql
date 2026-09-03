-- NajiyaDaily — Supabase Schema
-- Run this in Supabase SQL Editor once after creating your project

create extension if not exists "uuid-ossp";

create table if not exists articles (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null,
  title         text not null,
  standfirst    text,
  category      text not null,
  labels        text[] default '{}',
  status        text not null default 'draft',  -- draft | published | archived
  featured_image text,
  image_credit  text,
  word_count    integer default 0,
  read_time     integer default 1,
  published_at  timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  -- Quick-access fields (full content is in Markdown file)
  excerpt       text,
  explains      text,
  why_matters   text,
  takeaways     text[] default '{}',
  whats_next    text[] default '{}'
);

-- Index for fast category + status queries
create index if not exists idx_articles_category  on articles(category);
create index if not exists idx_articles_status    on articles(status);
create index if not exists idx_articles_published on articles(published_at desc);
create index if not exists idx_articles_slug      on articles(slug);

-- Enable Row Level Security
alter table articles enable row level security;

-- Public can read published articles
create policy "Public read published"
  on articles for select
  using (status = 'published');

-- Service role can do everything (used by GitHub Actions)
create policy "Service role full access"
  on articles for all
  using (auth.role() = 'service_role');

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger articles_updated_at
  before update on articles
  for each row execute function update_updated_at();
