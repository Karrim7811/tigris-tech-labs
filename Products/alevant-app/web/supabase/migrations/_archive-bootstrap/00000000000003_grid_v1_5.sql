-- ============================================================================
-- Grid v1.5 — Stub completion + outcome loop + multimodal signal foundations
-- See: docs/ALEVANT_Grid_Q3_Sprint.md
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. grid_signals — TTL/decay + MLS cross-ref + versioning
-- ---------------------------------------------------------------------------
alter table grid_signals
  add column if not exists effective_at  timestamptz,         -- when the underlying event occurred
  add column if not exists expires_at    timestamptz,         -- when this signal stops counting
  add column if not exists engine_version text default 'v1.5',
  add column if not exists mls_status    text,                -- active|pending|closed_recent|expired_recent|unknown|null
  add column if not exists mls_last_listed_at date,
  add column if not exists mls_last_closed_at date,
  -- Grid v2 hazard probabilities (computed when the hazard engine is live; null until then)
  add column if not exists hazard_90d         numeric,
  add column if not exists hazard_180d        numeric,
  add column if not exists hazard_365d        numeric,
  add column if not exists hazard_90d_ci_lo   numeric,
  add column if not exists hazard_90d_ci_hi   numeric,
  -- Per-signal-class age trackers (most-recent occurrence dates)
  add column if not exists pre_foreclosure_at date,
  add column if not exists probate_filing_at  date,
  add column if not exists divorce_filing_at  date,
  add column if not exists tax_delinquent_at  date,
  add column if not exists code_violation_at  date;

create index if not exists grid_signals_expiry_idx
  on grid_signals(workspace_id, expires_at);
create index if not exists grid_signals_mls_status_idx
  on grid_signals(workspace_id, mls_status);
create index if not exists grid_signals_hazard90_idx
  on grid_signals(workspace_id, hazard_90d desc nulls last);

-- ---------------------------------------------------------------------------
-- 2. florida_court_filings — raw cache for foreclosure / probate / divorce
-- ---------------------------------------------------------------------------
create table if not exists florida_court_filings (
  id            uuid primary key default uuid_generate_v4(),
  county        text not null,
  case_number   text not null,
  case_type     text not null,        -- foreclosure | probate | divorce | other
  filing_date   date not null,
  party_name    text not null,
  property_address text,
  source_url    text,
  raw_payload   jsonb,                -- preserve unparsed details for forensic audit
  fetched_at    timestamptz not null default now(),
  unique (county, case_number)
);
create index if not exists fl_court_filings_party_idx
  on florida_court_filings(party_name);
create index if not exists fl_court_filings_property_idx
  on florida_court_filings(property_address);
create index if not exists fl_court_filings_county_type_idx
  on florida_court_filings(county, case_type, filing_date desc);

-- ---------------------------------------------------------------------------
-- 3. florida_tax_records — raw cache for tax-collector delinquency
-- ---------------------------------------------------------------------------
create table if not exists florida_tax_records (
  id                uuid primary key default uuid_generate_v4(),
  county            text not null,
  folio             text not null,
  current_year_tax  numeric,
  is_delinquent     boolean default false,
  delinquent_amount numeric,
  delinquent_years  int[],
  source_url        text,
  fetched_at        timestamptz not null default now(),
  unique (county, folio)
);
create index if not exists fl_tax_records_county_folio_idx
  on florida_tax_records(county, folio);

-- ---------------------------------------------------------------------------
-- 4. florida_code_enforcement — raw cache for municipal code violations
-- ---------------------------------------------------------------------------
create table if not exists florida_code_enforcement (
  id              uuid primary key default uuid_generate_v4(),
  jurisdiction    text not null,        -- miami | miami-beach | coral-gables | broward | palm-beach | ...
  case_number     text not null,
  status          text not null,        -- open | closed | in_compliance
  filing_date     date not null,
  property_address text not null,
  violation_type  text,
  source_url      text,
  fetched_at      timestamptz not null default now(),
  unique (jurisdiction, case_number)
);
create index if not exists fl_code_enf_property_idx
  on florida_code_enforcement(property_address);
create index if not exists fl_code_enf_jur_status_idx
  on florida_code_enforcement(jurisdiction, status);

-- ---------------------------------------------------------------------------
-- 5. florida_permits — building / renovation permits (multimodal Phase 1)
-- ---------------------------------------------------------------------------
create table if not exists florida_permits (
  id              uuid primary key default uuid_generate_v4(),
  jurisdiction    text not null,
  permit_number   text not null,
  permit_type     text,                  -- residential_addition | pool | roof | kitchen | etc.
  permit_class    text,                  -- 'stay' | 'flip' | 'unknown' — Claude-classified
  issue_date      date,
  property_address text not null,
  declared_value  numeric,
  status          text,                  -- issued | finaled | inspected | expired
  source_url      text,
  fetched_at      timestamptz not null default now(),
  unique (jurisdiction, permit_number)
);
create index if not exists fl_permits_property_idx
  on florida_permits(property_address);
create index if not exists fl_permits_jur_date_idx
  on florida_permits(jurisdiction, issue_date desc);

-- ---------------------------------------------------------------------------
-- 6. florida_business_filings — Sunbiz LLC / corporate filings
-- ---------------------------------------------------------------------------
create table if not exists florida_business_filings (
  id              uuid primary key default uuid_generate_v4(),
  document_number text not null,
  entity_name     text not null,
  entity_type     text,                  -- LLC | CORP | LP | LLLP
  status          text,                  -- ACTIVE | INACTIVE | DISSOLVED
  filing_date     date,
  dissolution_date date,
  principal_address text,
  registered_agent_name text,
  officer_addresses text[],
  source_url      text,
  fetched_at      timestamptz not null default now(),
  unique (document_number)
);
create index if not exists fl_business_entity_idx
  on florida_business_filings(entity_name);
create index if not exists fl_business_principal_addr_idx
  on florida_business_filings(principal_address);

-- ---------------------------------------------------------------------------
-- 7. florida_voter_roll_snapshots — per-property voter-roll state for diff
-- ---------------------------------------------------------------------------
create table if not exists florida_voter_roll_snapshots (
  id              uuid primary key default uuid_generate_v4(),
  county          text not null,
  residence_address text not null,
  snapshot_date   date not null,
  active_voter_count int default 0,
  total_voter_count  int default 0,
  most_recent_registration date,
  fetched_at      timestamptz not null default now(),
  unique (county, residence_address, snapshot_date)
);
create index if not exists fl_voter_addr_idx
  on florida_voter_roll_snapshots(residence_address);
create index if not exists fl_voter_county_date_idx
  on florida_voter_roll_snapshots(county, snapshot_date desc);

-- ---------------------------------------------------------------------------
-- 8. property_visual_diffs — StreetView year-over-year diffs (Phase 2 multimodal)
-- ---------------------------------------------------------------------------
create table if not exists property_visual_diffs (
  id              uuid primary key default uuid_generate_v4(),
  property_address text not null,
  property_zip    text,
  -- The two image timestamps actually used by Google StreetView
  current_image_date date,
  prior_image_date   date,
  rating          text not null,         -- deterioration | renovation | no_change | not_comparable
  confidence      numeric,               -- 0.0 .. 1.0
  vision_notes    text,
  model_version   text default 'claude-sonnet-4-6',
  fetched_at      timestamptz not null default now(),
  unique (property_address, current_image_date)
);
create index if not exists pvd_property_idx
  on property_visual_diffs(property_address);
create index if not exists pvd_rating_idx
  on property_visual_diffs(rating);

-- ---------------------------------------------------------------------------
-- 9. usps_ncoa_records — mail-forward signals (Phase 2; vendor-licensed)
-- ---------------------------------------------------------------------------
create table if not exists usps_ncoa_records (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid references workspaces(id) on delete cascade,
  resident_name   text,
  from_address    text not null,
  to_address      text,
  forward_type    text,                  -- individual | family | business | none
  effective_date  date,
  source          text default 'vendor',
  fetched_at      timestamptz not null default now()
);
create index if not exists ncoa_from_addr_idx
  on usps_ncoa_records(from_address);

-- ---------------------------------------------------------------------------
-- 10. dmf_records — Social Security Death Master File (Phase 2; vendor-licensed)
-- ---------------------------------------------------------------------------
create table if not exists dmf_records (
  id              uuid primary key default uuid_generate_v4(),
  full_name       text not null,
  date_of_birth   date,
  date_of_death   date not null,
  state_of_residence text,
  source          text default 'vendor',
  fetched_at      timestamptz not null default now()
);
create index if not exists dmf_name_idx
  on dmf_records(full_name);
create index if not exists dmf_dod_idx
  on dmf_records(date_of_death desc);

-- ---------------------------------------------------------------------------
-- 11. grid_outcomes — closed-loop ground truth for hazard model training
-- ---------------------------------------------------------------------------
create table if not exists grid_outcomes (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  signal_id       uuid references grid_signals(id) on delete set null,
  property_address text not null,
  outcome_type    text not null
    check (outcome_type in (
      'listed','sold_off_market','agent_contacted',
      'agent_won','agent_lost','dead_signal','re_listed','withdrawn'
    )),
  outcome_source  text not null,            -- 'mls' | 'agent_manual' | 'public_records' | 'sphere' | 'sofia' | 'vesper'
  outcome_date    date not null,
  outcome_value_usd numeric,
  days_from_signal int,                     -- derived at insert
  notes           text,
  signal_engine_version text,               -- which engine produced the original signal (audit primitive)
  signal_motivation_score int,              -- snapshot of score at outcome time
  signal_hazard_90d numeric,                -- snapshot of hazard at outcome time
  created_at      timestamptz not null default now()
);
create index if not exists grid_outcomes_workspace_date_idx
  on grid_outcomes(workspace_id, outcome_date desc);
create index if not exists grid_outcomes_signal_idx
  on grid_outcomes(signal_id);
create index if not exists grid_outcomes_type_idx
  on grid_outcomes(outcome_type, outcome_date desc);

alter table grid_outcomes enable row level security;
create policy "members_read_grid_outcomes" on grid_outcomes
  for select using (workspace_id in (select alevant_user_workspace_ids()));
create policy "members_write_grid_outcomes" on grid_outcomes
  for all using (workspace_id in (select alevant_user_workspace_ids()))
        with check (workspace_id in (select alevant_user_workspace_ids()));

-- ---------------------------------------------------------------------------
-- 12. vw_grid_actionable — agent-facing filtered view
-- Excludes already-listed, recently-closed, and expired signals.
-- ---------------------------------------------------------------------------
create or replace view vw_grid_actionable as
select g.*
from grid_signals g
where coalesce(g.mls_status, 'unknown') not in ('active','pending','closed_recent')
  and (g.expires_at is null or g.expires_at > now())
  and (g.motivation_score >= 45 or g.hazard_90d >= 0.15);

-- ---------------------------------------------------------------------------
-- 13. fairness_test_attributes — PROTECTED-CLASS INFERENCES (testing only)
-- ===========================================================================
-- HARD CONTRACT: This table exists ONLY to feed the fairness-audit pipeline.
-- It MUST NOT be joined to grid_signals, MUST NOT be exposed via product RLS,
-- and MUST NOT be readable by application service roles. Access is restricted
-- to the data-science role via a separate Supabase project in production.
-- ---------------------------------------------------------------------------
create table if not exists fairness_test_attributes (
  id              uuid primary key default uuid_generate_v4(),
  -- Reference a signal by id; do NOT join in production queries.
  signal_id       uuid references grid_signals(id) on delete cascade,
  -- Group inferences (categorical buckets; never confidence scores stored alongside signals)
  inferred_race_ethnicity text,
  inferred_sex    text,
  inferred_familial_status text,
  inference_method text,                    -- 'bifsg' | 'census_tract_overlay' | 'manual'
  inference_confidence numeric,
  inferred_at     timestamptz not null default now()
);
alter table fairness_test_attributes enable row level security;
-- No read policy by default. Service-role only via direct connection in the ML environment.

-- ---------------------------------------------------------------------------
-- 14. model_registry — TMP-light: which engine version produced which score
-- ---------------------------------------------------------------------------
create table if not exists grid_model_registry (
  id              uuid primary key default uuid_generate_v4(),
  model_name      text not null,           -- 'grid.heuristic' | 'grid.hazard'
  version         text not null,           -- semver, e.g. 'v1.5.0', 'v2.0.0'
  status          text not null default 'dev'
    check (status in ('dev','staging','challenger','champion','archived')),
  framework       text,                    -- 'heuristic' | 'statsmodels' | 'lightgbm'
  metrics_json    jsonb,                   -- AUC / lift / calibration / fairness summary
  artifact_uri    text,                    -- S3 / R2 path to serialized model
  fairness_audit_json jsonb,
  model_card_md   text,
  trained_at      timestamptz,
  promoted_at     timestamptz,
  trained_by      text,
  notes           text,
  unique (model_name, version)
);
create index if not exists grid_model_status_idx
  on grid_model_registry(model_name, status);

-- ---------------------------------------------------------------------------
-- 15. grid_audit_events — append-only score / promotion / training log
-- ---------------------------------------------------------------------------
create table if not exists grid_audit_events (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid references workspaces(id) on delete set null,
  event_type      text not null
    check (event_type in ('score','training','promotion','feature_update','outcome_attached','manual_override')),
  signal_id       uuid references grid_signals(id) on delete set null,
  property_address text,
  model_name      text,
  model_version   text,
  input_snapshot  jsonb,
  output_snapshot jsonb,
  served_by       text,
  created_at      timestamptz not null default now()
);
create index if not exists grid_audit_workspace_idx
  on grid_audit_events(workspace_id, created_at desc);
create index if not exists grid_audit_signal_idx
  on grid_audit_events(signal_id);

alter table grid_audit_events enable row level security;
create policy "members_read_grid_audit_events" on grid_audit_events
  for select using (
    workspace_id is null
    or workspace_id in (select alevant_user_workspace_ids())
  );

-- ---------------------------------------------------------------------------
-- 16. Seed the registry with the v1.5 heuristic engine
-- ---------------------------------------------------------------------------
insert into grid_model_registry (model_name, version, status, framework, notes)
values ('grid.heuristic', 'v1.5.0', 'champion', 'heuristic',
        'Stub-completion sprint. Weights tenure=15, equity=25, distress=30, life_event=20, market=10. Decay applied per-signal TTL.')
on conflict (model_name, version) do nothing;
