-- ============================================================================
-- ALEVANT — News & Intel migration
-- Real-time intelligence feeds (Perplexity-powered) — market, listing,
-- farm-zone, sphere, competitor, regulatory, mortgage-rate news.
-- ============================================================================

create table if not exists news_alerts (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  category        text not null,                -- 'market'|'listing'|'farm_zone'|'sphere'|'competitor'|'regulatory'|'mortgage_rates'|'pre_construction'
  severity        text not null default 'info', -- 'info'|'watch'|'act'
  title           text not null,
  summary         text,
  source_name     text,
  source_url      text,
  related_listing_id uuid references listings(id) on delete set null,
  related_contact_id uuid references contacts(id) on delete set null,
  related_zip     text,
  related_market  text,
  fetched_at      timestamptz not null default now(),
  surfaced_at     timestamptz default now(),
  dismissed_at    timestamptz,
  metadata        jsonb default '{}'
);
create index if not exists news_workspace_idx
  on news_alerts(workspace_id, surfaced_at desc) where dismissed_at is null;
create index if not exists news_category_idx
  on news_alerts(workspace_id, category, surfaced_at desc);

create table if not exists news_topics (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  topic           text not null,                -- free-form: "Miami Brickell condo market", "Compass Miami top agents"
  category        text not null,
  active          boolean default true,
  refresh_minutes int default 360,              -- every 6h default
  last_run_at     timestamptz,
  created_at      timestamptz default now()
);

alter table news_alerts enable row level security;
alter table news_topics enable row level security;

create policy "members_read_news"   on news_alerts
  for select using (workspace_id in (select alevant_user_workspace_ids()));
create policy "members_write_news"  on news_alerts
  for all using (workspace_id in (select alevant_user_workspace_ids()))
  with check (workspace_id in (select alevant_user_workspace_ids()));
create policy "members_topics"      on news_topics
  for all using (workspace_id in (select alevant_user_workspace_ids()))
  with check (workspace_id in (select alevant_user_workspace_ids()));
