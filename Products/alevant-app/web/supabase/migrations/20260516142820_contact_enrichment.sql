-- Reconciled from prod 2026-05-23 (originally applied 2026-05-16).
-- Contact research enrichment cache — one row per (workspace_id, contact_id).
create table if not exists contact_enrichment (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  contact_id      uuid not null references contacts(id) on delete cascade,
  linkedin_url    text,
  current_title   text,
  current_company text,
  location_text   text,
  headline        text,
  photo_url       text,
  apollo_email    text,
  apollo_phone    text,
  apollo_seniority text,
  raw_apollo      jsonb,
  raw_proxycurl   jsonb,
  raw_perplexity  jsonb,
  ai_brief        text,
  ai_opening_line text,
  ai_signals      text[] default array[]::text[],
  vendors_used    text[] default array[]::text[],
  fetched_at      timestamptz not null default now(),
  unique (workspace_id, contact_id)
);
create index if not exists contact_enrichment_workspace_idx on contact_enrichment(workspace_id);
create index if not exists contact_enrichment_contact_idx on contact_enrichment(contact_id);

alter table contact_enrichment enable row level security;
create policy "members_read_contact_enrichment" on contact_enrichment
  for select using (workspace_id in (select alevant_user_workspace_ids()));
create policy "members_write_contact_enrichment" on contact_enrichment
  for all using (workspace_id in (select alevant_user_workspace_ids()))
        with check (workspace_id in (select alevant_user_workspace_ids()));
