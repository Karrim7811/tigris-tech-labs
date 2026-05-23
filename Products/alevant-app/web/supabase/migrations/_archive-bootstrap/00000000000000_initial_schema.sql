-- ============================================================================
-- ALEVANT — Initial Schema
-- Multi-tenant via workspace_id + Row Level Security
-- Mirrors PRAIX patterns; extends with workspace tenancy
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 2. CORE WORKSPACE TABLES
-- ============================================================================

create table if not exists brokerages (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  address         text,
  phone           text,
  email           text,
  license_state   text,
  mls_memberships text[],
  logo_url        text,
  created_at      timestamptz not null default now()
);

create table if not exists brand_kits (
  id                uuid primary key default uuid_generate_v4(),
  primary_color     text default '#3D4F8C',
  secondary_color   text,
  accent_color      text default '#B5853E',
  surface_color     text default '#FAFAF8',
  ink_color         text default '#1A1915',
  display_font      text default 'Cormorant Garamond',
  body_font         text default 'Jost',
  logo_url          text,
  wordmark_text     text,
  tagline           text,
  voice_preset      text default 'insider',
  photography_style text,
  prohibit_stock    boolean default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists sofia_configs (
  id                       uuid primary key default uuid_generate_v4(),
  twilio_number            text,
  voice_id                 text,
  name                     text default 'Sofia',
  languages_enabled        text[] default array['en'],
  hours_json               jsonb default '{"mon":[0,24],"tue":[0,24],"wed":[0,24],"thu":[0,24],"fri":[0,24],"sat":[0,24],"sun":[0,24]}',
  agent_live_hours_json    jsonb default '{"mon":[8.5,18],"tue":[8.5,18],"wed":[8.5,18],"thu":[8.5,18],"fri":[8.5,18],"sat":[8.5,18],"sun":[]}',
  handoff_rules_json       jsonb,
  greeting_script          text,
  disclaimer_script        text,
  qualification_threshold  int default 70,
  ai_disclosure_enabled    boolean default true,
  recording_consent_enabled boolean default true,
  created_at               timestamptz not null default now()
);

create table if not exists vesper_configs (
  id                      uuid primary key default uuid_generate_v4(),
  voice_preset            text default 'insider',
  channel_priorities      text[] default array['instagram','linkedin','x','tiktok'],
  cadence_json            jsonb default '{"posts_per_day":1,"per_listing_assets":12}',
  approval_mode           text default 'gated',
  approval_window_minutes int default 240,
  fair_housing_strict     boolean default true,
  prohibit_stock          boolean default true,
  watermark_enabled       boolean default true,
  created_at              timestamptz not null default now()
);

create table if not exists workspaces (
  id                uuid primary key default uuid_generate_v4(),
  slug              text not null unique,
  name              text not null,
  owner_user_id     uuid references auth.users(id) on delete set null,
  brokerage_id      uuid references brokerages(id),
  brand_kit_id      uuid references brand_kits(id),
  sofia_config_id   uuid references sofia_configs(id),
  vesper_config_id  uuid references vesper_configs(id),
  plan              text default 'pilot',
  status            text default 'onboarding',
  custom_domain     text,
  metadata          jsonb default '{}',
  created_at        timestamptz not null default now(),
  activated_at      timestamptz
);
create index if not exists workspaces_slug_idx on workspaces(slug);
create index if not exists workspaces_custom_domain_idx on workspaces(custom_domain);

create table if not exists workspace_memberships (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'agent',
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists workspace_integrations (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  service       text not null,
  oauth_refresh_token_encrypted text,
  oauth_access_token_encrypted  text,
  scopes        text[],
  metadata      jsonb default '{}',
  status        text default 'connected',
  connected_at  timestamptz default now(),
  expires_at    timestamptz,
  unique (workspace_id, service)
);

-- ============================================================================
-- 3. PEOPLE & RELATIONSHIPS
-- ============================================================================

create table if not exists agents (
  id                uuid primary key default uuid_generate_v4(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  user_id           uuid references auth.users(id) on delete set null,
  role              text default 'agent',
  full_name         text not null,
  preferred_name    text,
  title             text,
  license_number    text,
  languages         text[] default array['en'],
  specialties       text[],
  awards            text,
  bio_text          text,
  cell_phone        text,
  email             text,
  active_hours_json jsonb,
  headshot_url      text,
  created_at        timestamptz not null default now()
);
create index if not exists agents_workspace_id_idx on agents(workspace_id);

create table if not exists contacts (
  id                  uuid primary key default uuid_generate_v4(),
  workspace_id        uuid not null references workspaces(id) on delete cascade,
  full_name           text,
  emails              text[] default array[]::text[],
  phones              text[] default array[]::text[],
  category            text default 'lead',
  relationship_score  int default 0,
  source              text,
  language            text,
  notes               text,
  metadata            jsonb default '{}',
  last_touch_at       timestamptz,
  created_at          timestamptz not null default now()
);
create index if not exists contacts_workspace_id_idx on contacts(workspace_id);
create index if not exists contacts_category_idx on contacts(workspace_id, category);
create index if not exists contacts_emails_idx on contacts using gin (emails);
create index if not exists contacts_phones_idx on contacts using gin (phones);

create table if not exists sphere_signals (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  contact_id    uuid not null references contacts(id) on delete cascade,
  signal_type   text not null,
  signal_data   jsonb,
  confidence    int default 50,
  detected_at   timestamptz not null default now(),
  surfaced_at   timestamptz,
  resolved      boolean default false,
  resolved_at   timestamptz
);
create index if not exists sphere_signals_workspace_idx on sphere_signals(workspace_id, resolved);

-- ============================================================================
-- 4. PIPELINES
-- ============================================================================

create table if not exists listings (
  id                       uuid primary key default uuid_generate_v4(),
  workspace_id             uuid not null references workspaces(id) on delete cascade,
  agent_id                 uuid references agents(id),
  address                  text not null,
  city                     text,
  state                    text,
  zip                      text,
  price                    numeric,
  property_type            text,
  beds                     int,
  baths                    numeric,
  sqft                     int,
  lot_sqft                 int,
  year_built               int,
  hoa_monthly              numeric,
  taxes_annual             numeric,
  listing_date             date,
  expiration_date          date,
  status                   text default 'draft',
  mls_number               text,
  photos                   jsonb default '[]',
  marketing_materials      jsonb default '[]',
  showing_instructions     text,
  seller_contact_id        uuid references contacts(id),
  vesper_campaign_status   text default 'pending',
  microsite_slug           text,
  description              text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index if not exists listings_workspace_idx on listings(workspace_id, status);
create unique index if not exists listings_microsite_slug_unique on listings(workspace_id, microsite_slug)
  where microsite_slug is not null;

create table if not exists buyers (
  id                  uuid primary key default uuid_generate_v4(),
  workspace_id        uuid not null references workspaces(id) on delete cascade,
  agent_id            uuid references agents(id),
  contact_id          uuid not null references contacts(id),
  budget_min          numeric,
  budget_max          numeric,
  timeline            text,
  preapproval_status  text,
  preapproval_lender  text,
  preapproval_amount  numeric,
  criteria_json       jsonb default '{}',
  type                text default 'primary',
  investor_flags_json jsonb,
  bba_signed_at       timestamptz,
  stage               text default 'inquiry',
  created_at          timestamptz not null default now()
);
create index if not exists buyers_workspace_idx on buyers(workspace_id, stage);

create table if not exists rentals (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  agent_id        uuid references agents(id),
  contact_id      uuid not null references contacts(id),
  budget_per_month numeric,
  lease_term_months int,
  move_in_target  date,
  occupants_json  jsonb,
  pets_json       jsonb,
  prequal_status  text,
  stage           text default 'inquiry',
  created_at      timestamptz not null default now()
);
create index if not exists rentals_workspace_idx on rentals(workspace_id, stage);

create table if not exists investor_deals (
  id                    uuid primary key default uuid_generate_v4(),
  workspace_id          uuid not null references workspaces(id) on delete cascade,
  agent_id              uuid references agents(id),
  subject_property      text,
  deal_type             text,
  investor_id           uuid references contacts(id),
  equity_available      numeric,
  financing_structure   text,
  stage                 text default 'sourcing',
  cap_rate_target       numeric,
  underwriter_output_id uuid,
  created_at            timestamptz not null default now()
);
create index if not exists investor_deals_workspace_idx on investor_deals(workspace_id, stage);

-- ============================================================================
-- 5. THE GRID — Predictive Seller Lead Engine
-- (Residential analog to PRAIX RiskGrid — finds homes likely to list)
-- ============================================================================

create table if not exists grid_signals (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  property_address text not null,
  property_city   text,
  property_state  text,
  property_zip    text,
  county          text,
  apn             text,
  owner_name      text,
  owner_mailing_address text,
  owner_phone     text,
  owner_email     text,
  estimated_value numeric,
  estimated_equity numeric,
  estimated_mortgage_balance numeric,
  years_owned     int,
  -- Composite score 0-100 — overall likelihood to list within 12 months
  motivation_score int default 0,
  -- Component scores 0-100 each
  tenure_score    int default 0,
  equity_score    int default 0,
  distress_score  int default 0,
  life_event_score int default 0,
  market_score    int default 0,
  -- Distress signals
  is_pre_foreclosure   boolean default false,
  is_tax_delinquent    boolean default false,
  has_code_violations  boolean default false,
  has_hoa_delinquency  boolean default false,
  is_vacant            boolean default false,
  is_absentee_owner    boolean default false,
  -- Life-event signals
  is_probate           boolean default false,
  is_divorce           boolean default false,
  is_senior_owner      boolean default false,
  -- Tenure signal
  long_tenure_flag     boolean default false,
  -- Market signal
  neighborhood_absorption_rate numeric,
  -- Computed reasons (Claude-generated narrative)
  reasons         text[],
  reasons_summary text,
  data_sources    text[],
  -- Lead lifecycle
  status          text default 'new',
  assigned_to     uuid references agents(id),
  outreach_history jsonb default '[]',
  do_not_contact  boolean default false,
  dnc_reason      text,
  -- Compliance
  on_dnc_registry boolean,
  dnc_checked_at  timestamptz,
  detected_at     timestamptz not null default now(),
  refreshed_at    timestamptz default now()
);
create index if not exists grid_signals_workspace_idx
  on grid_signals(workspace_id, motivation_score desc);
create index if not exists grid_signals_zip_idx on grid_signals(property_zip);
create index if not exists grid_signals_status_idx on grid_signals(workspace_id, status);

create table if not exists grid_farm_zones (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  zone_label      text,
  zip_codes       text[] not null,
  city            text,
  state           text default 'FL',
  active          boolean default true,
  weekly_lead_quota int default 50,
  created_at      timestamptz not null default now()
);

create table if not exists grid_outreach_campaigns (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  campaign_name   text not null,
  channel         text not null,
  target_grid_signal_ids uuid[],
  vesper_asset_id uuid,
  status          text default 'draft',
  scheduled_for   timestamptz,
  sent_at         timestamptz,
  responses_count int default 0,
  conversions_count int default 0,
  created_at      timestamptz not null default now()
);

-- ============================================================================
-- 6. PRE-CONSTRUCTION
-- ============================================================================

create table if not exists preconstruction_towers (
  id                          uuid primary key default uuid_generate_v4(),
  name                        text not null,
  address                     text,
  city                        text,
  state                       text default 'FL',
  developer                   text,
  developer_reputation_score  int,
  expected_delivery           date,
  delivery_delay_risk         text,
  deposit_schedule            jsonb,
  current_inventory           jsonb,
  metadata                    jsonb default '{}',
  source_urls                 text[],
  created_at                  timestamptz not null default now(),
  refreshed_at                timestamptz default now()
);

create table if not exists preconstruction_watchlist (
  workspace_id           uuid not null references workspaces(id) on delete cascade,
  tower_id               uuid not null references preconstruction_towers(id) on delete cascade,
  assigned_investor_ids  uuid[],
  notes                  text,
  primary key (workspace_id, tower_id)
);

-- ============================================================================
-- 7. ACTIVITY & ENGAGEMENT
-- ============================================================================

create table if not exists activity_log (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  agent_id        uuid references agents(id),
  contact_id      uuid references contacts(id),
  activity_type   text not null,
  source          text default 'agent',
  summary         text,
  outcome         text,
  next_action     text,
  next_action_type text,
  next_date       timestamptz,
  duration_seconds int,
  metadata        jsonb default '{}',
  completed       boolean default false,
  created_at      timestamptz not null default now()
);
create index if not exists activity_workspace_idx on activity_log(workspace_id, created_at desc);

create table if not exists sofia_conversations (
  id                  uuid primary key default uuid_generate_v4(),
  workspace_id        uuid not null references workspaces(id) on delete cascade,
  contact_id          uuid references contacts(id),
  channel             text not null,
  direction           text not null,
  status              text default 'live',
  transcript          jsonb default '[]',
  qualification_score int,
  classification      jsonb,
  escalated_at        timestamptz,
  recording_url       text,
  consent_metadata    jsonb,
  duration_seconds    int,
  caller_phone        text,
  caller_name         text,
  metadata            jsonb default '{}',
  started_at          timestamptz not null default now(),
  ended_at            timestamptz
);
create index if not exists sofia_conv_workspace_idx on sofia_conversations(workspace_id, started_at desc);

create table if not exists vesper_assets (
  id                  uuid primary key default uuid_generate_v4(),
  workspace_id        uuid not null references workspaces(id) on delete cascade,
  agent_id            uuid references agents(id),
  listing_id          uuid references listings(id) on delete cascade,
  campaign_id         uuid,
  asset_type          text not null,
  channel             text,
  content             jsonb,
  visual_urls         text[],
  status              text default 'queued',
  scheduled_for       timestamptz,
  published_at        timestamptz,
  approval_metadata   jsonb,
  fair_housing_lint_passed boolean,
  fair_housing_lint_findings jsonb,
  created_at          timestamptz not null default now()
);
create index if not exists vesper_workspace_idx on vesper_assets(workspace_id, status);
create index if not exists vesper_listing_idx on vesper_assets(listing_id);

create table if not exists vesper_campaigns (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  listing_id      uuid references listings(id) on delete cascade,
  campaign_type   text default 'per_listing',
  status          text default 'generating',
  asset_count     int default 0,
  approved_count  int default 0,
  published_count int default 0,
  created_at      timestamptz not null default now(),
  completed_at    timestamptz
);

-- ============================================================================
-- 8. TRANSACTIONS
-- ============================================================================

create table if not exists transactions (
  id                uuid primary key default uuid_generate_v4(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  agent_id          uuid references agents(id),
  side              text not null,
  property_address  text,
  listing_id        uuid references listings(id),
  buyer_id          uuid references buyers(id),
  contract_date     date,
  expected_close    date,
  actual_close      date,
  contract_price    numeric,
  status            text default 'active',
  timeline_json     jsonb,
  risk_flags        jsonb default '[]',
  docusign_envelope_id text,
  created_at        timestamptz not null default now()
);
create index if not exists transactions_workspace_idx on transactions(workspace_id, status);

create table if not exists transaction_milestones (
  id              uuid primary key default uuid_generate_v4(),
  transaction_id  uuid not null references transactions(id) on delete cascade,
  type            text not null,
  due_date        date,
  completed_at    timestamptz,
  status          text default 'pending',
  nudges_sent     int default 0,
  metadata        jsonb default '{}'
);

-- ============================================================================
-- 9. UNDERWRITER
-- ============================================================================

create table if not exists underwriter_runs (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  agent_id        uuid references agents(id),
  mode            text not null, -- 'cma' | 'investor_mf' | 'str'
  subject_address text not null,
  inputs          jsonb,
  comp_set        jsonb,
  result          jsonb,
  pdf_url         text,
  created_at      timestamptz not null default now()
);
create index if not exists underwriter_workspace_idx on underwriter_runs(workspace_id, created_at desc);

-- ============================================================================
-- 10. COMPLIANCE
-- ============================================================================

create table if not exists compliance_acknowledgments (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  user_id         uuid references auth.users(id),
  type            text not null,
  acknowledged_at timestamptz not null default now(),
  ip_address      text,
  user_agent      text,
  version         text
);

create table if not exists consent_records (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  contact_id    uuid not null references contacts(id) on delete cascade,
  consent_type  text not null,
  scope         text not null,
  granted_at    timestamptz not null default now(),
  granted_via   text,
  evidence      jsonb,
  revoked_at    timestamptz,
  revoke_reason text
);
create index if not exists consent_records_contact_idx on consent_records(contact_id, consent_type);

create table if not exists ai_disclosures_logged (
  id                uuid primary key default uuid_generate_v4(),
  conversation_id   uuid references sofia_conversations(id) on delete cascade,
  disclosure_text   text,
  delivered_at      timestamptz not null default now()
);

create table if not exists fair_housing_lint_log (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  asset_id        uuid references vesper_assets(id),
  passed          boolean,
  findings        jsonb,
  original_text   text,
  flagged_terms   text[],
  created_at      timestamptz not null default now()
);

-- ============================================================================
-- 11. BRAND ASSETS
-- ============================================================================

create table if not exists brand_assets (
  id                            uuid primary key default uuid_generate_v4(),
  workspace_id                  uuid not null references workspaces(id) on delete cascade,
  type                          text not null,
  url                           text,
  metadata                      jsonb default '{}',
  consent_for_avatar_training   boolean default false,
  created_at                    timestamptz not null default now()
);

-- ============================================================================
-- 12. ADMIN / METRICS
-- ============================================================================

create table if not exists api_usage (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid references workspaces(id),
  user_id       uuid references auth.users(id),
  route         text,
  model         text,
  input_tokens  int,
  output_tokens int,
  cost_cents    int,
  created_at    timestamptz not null default now()
);
create index if not exists api_usage_workspace_idx on api_usage(workspace_id, created_at desc);

create table if not exists pipeline_snapshots (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  snapshot_date   date not null,
  total_pipeline  numeric,
  weighted_pipeline numeric,
  active_buyers   int,
  active_listings int,
  active_rentals  int,
  active_investors int,
  hot_count       int,
  warm_count      int,
  cold_count      int,
  activity_count  int,
  unique (workspace_id, snapshot_date)
);

-- ============================================================================
-- 13. ROW LEVEL SECURITY
-- ============================================================================

alter table workspaces                  enable row level security;
alter table workspace_memberships       enable row level security;
alter table workspace_integrations      enable row level security;
alter table brokerages                  enable row level security;
alter table brand_kits                  enable row level security;
alter table sofia_configs               enable row level security;
alter table vesper_configs              enable row level security;
alter table agents                      enable row level security;
alter table contacts                    enable row level security;
alter table sphere_signals              enable row level security;
alter table listings                    enable row level security;
alter table buyers                      enable row level security;
alter table rentals                     enable row level security;
alter table investor_deals              enable row level security;
alter table grid_signals                enable row level security;
alter table grid_farm_zones             enable row level security;
alter table grid_outreach_campaigns     enable row level security;
alter table preconstruction_towers      enable row level security;
alter table preconstruction_watchlist   enable row level security;
alter table activity_log                enable row level security;
alter table sofia_conversations         enable row level security;
alter table vesper_assets               enable row level security;
alter table vesper_campaigns            enable row level security;
alter table transactions                enable row level security;
alter table transaction_milestones      enable row level security;
alter table underwriter_runs            enable row level security;
alter table compliance_acknowledgments  enable row level security;
alter table consent_records             enable row level security;
alter table ai_disclosures_logged       enable row level security;
alter table fair_housing_lint_log       enable row level security;
alter table brand_assets                enable row level security;
alter table api_usage                   enable row level security;
alter table pipeline_snapshots          enable row level security;

-- Helper: workspace members read/write their workspace data
create or replace function alevant_user_workspace_ids()
returns setof uuid language sql stable security definer as $$
  select workspace_id from workspace_memberships where user_id = auth.uid()
$$;

create policy "members_read_workspace" on workspaces
  for select using (id in (select alevant_user_workspace_ids()));
create policy "members_update_workspace" on workspaces
  for update using (id in (select alevant_user_workspace_ids()));

-- Generic policies factory pattern (apply same to every workspace-scoped table)
do $$
declare
  t text;
  scoped_tables text[] := array[
    'workspace_integrations','agents','contacts','sphere_signals','listings',
    'buyers','rentals','investor_deals','grid_signals','grid_farm_zones',
    'grid_outreach_campaigns','preconstruction_watchlist','activity_log',
    'sofia_conversations','vesper_assets','vesper_campaigns','transactions',
    'underwriter_runs','compliance_acknowledgments','consent_records',
    'fair_housing_lint_log','brand_assets','pipeline_snapshots'
  ];
begin
  foreach t in array scoped_tables loop
    execute format($p$
      create policy "members_read_%1$s" on %1$I
        for select using (workspace_id in (select alevant_user_workspace_ids()))
    $p$, t);
    execute format($p$
      create policy "members_write_%1$s" on %1$I
        for all using (workspace_id in (select alevant_user_workspace_ids()))
        with check (workspace_id in (select alevant_user_workspace_ids()))
    $p$, t);
  end loop;
end $$;

-- Memberships: users see their own
create policy "self_read_memberships" on workspace_memberships
  for select using (user_id = auth.uid());

-- Brokerages, brand_kits, sofia_configs, vesper_configs accessible if linked from a workspace user belongs to
create policy "linked_brokerages_read" on brokerages
  for select using (
    id in (select brokerage_id from workspaces where id in (select alevant_user_workspace_ids()))
  );
create policy "linked_brand_kits_all" on brand_kits
  for all using (
    id in (select brand_kit_id from workspaces where id in (select alevant_user_workspace_ids()))
  );
create policy "linked_sofia_configs_all" on sofia_configs
  for all using (
    id in (select sofia_config_id from workspaces where id in (select alevant_user_workspace_ids()))
  );
create policy "linked_vesper_configs_all" on vesper_configs
  for all using (
    id in (select vesper_config_id from workspaces where id in (select alevant_user_workspace_ids()))
  );

-- Pre-construction towers: globally readable (public market data)
create policy "public_read_precon_towers" on preconstruction_towers for select using (true);

-- AI disclosures: tied to conversations; readable through conversation
create policy "members_read_ai_disclosures" on ai_disclosures_logged
  for select using (
    conversation_id in (
      select id from sofia_conversations
      where workspace_id in (select alevant_user_workspace_ids())
    )
  );

-- API usage: own workspace only
create policy "members_read_api_usage" on api_usage
  for select using (workspace_id in (select alevant_user_workspace_ids()));
