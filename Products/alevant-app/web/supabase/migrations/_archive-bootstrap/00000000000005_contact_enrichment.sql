-- ============================================================================
-- Contact research enrichment cache
-- One row per (workspace_id, contact_id). Replace-on-rerun semantics — the latest
-- enrichment wins; we don't keep history here. The raw_* JSON columns preserve
-- vendor output for forensic audit and to enable re-synthesis without re-paying
-- the vendors.
-- ============================================================================

create table if not exists contact_enrichment (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  contact_id      uuid not null references contacts(id) on delete cascade,
  -- Resolved identity
  linkedin_url    text,
  current_title   text,
  current_company text,
  location_text   text,
  headline        text,
  photo_url       text,
  -- Apollo person-match output
  apollo_email    text,
  apollo_phone    text,
  apollo_seniority text,
  raw_apollo      jsonb,
  -- Proxycurl LinkedIn profile output
  raw_proxycurl   jsonb,
  -- Perplexity research output (raw_text + citations)
  raw_perplexity  jsonb,
  -- Claude synthesis: short narrative brief shown in the UI
  ai_brief        text,
  ai_opening_line text,
  ai_signals      text[] default array[]::text[],
  -- Audit
  vendors_used    text[] default array[]::text[],
  fetched_at      timestamptz not null default now(),
  unique (workspace_id, contact_id)
);
create index if not exists contact_enrichment_workspace_idx
  on contact_enrichment(workspace_id);
create index if not exists contact_enrichment_contact_idx
  on contact_enrichment(contact_id);

alter table contact_enrichment enable row level security;
create policy "members_read_contact_enrichment" on contact_enrichment
  for select using (workspace_id in (select alevant_user_workspace_ids()));
create policy "members_write_contact_enrichment" on contact_enrichment
  for all using (workspace_id in (select alevant_user_workspace_ids()))
        with check (workspace_id in (select alevant_user_workspace_ids()));
