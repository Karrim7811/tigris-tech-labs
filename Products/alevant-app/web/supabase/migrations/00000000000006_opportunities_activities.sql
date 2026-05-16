-- ============================================================================
-- Opportunities, contact activities, playbooks, temperature/priority, comms-settings
-- Conversation 2026-05-16
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. contacts: temperature, priority, last_activity_at
-- ---------------------------------------------------------------------------
alter table contacts
  add column if not exists temperature text default 'Warm'
    check (temperature in ('Hot','Warm','Cold','Disqualified')),
  add column if not exists priority    text default 'Medium'
    check (priority in ('High','Medium','Low')),
  add column if not exists last_activity_at timestamptz;

create index if not exists contacts_temperature_idx
  on contacts(workspace_id, temperature);
create index if not exists contacts_priority_idx
  on contacts(workspace_id, priority);

-- ---------------------------------------------------------------------------
-- 2. opportunities — real-estate-specific pre-contract working deals
-- ---------------------------------------------------------------------------
create table if not exists opportunities (
  id                uuid primary key default uuid_generate_v4(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  contact_id        uuid references contacts(id) on delete set null,
  opp_number        text not null,                  -- 'OPP-001'
  name              text not null,                  -- short display label, e.g. "Carlos Mendes — 1450 Brickell Bay"
  side              text not null
    check (side in ('buyer','seller','both')),
  stage             text not null
    check (stage in (
      'qualified',                  -- buyer + seller both start here
      'showing',                    -- buyer
      'offer_submitted',            -- buyer
      'listing_appointment',        -- seller
      'listed',                     -- seller
      'offer_received',             -- seller
      'won',                        -- graduates to transaction
      'lost'
    )),
  loss_reason       text,
  est_value_usd     numeric,                        -- list price or purchase budget
  est_commission_usd numeric,
  probability       int default 25 check (probability >= 0 and probability <= 100),
  expected_close    date,
  source_kind       text,                           -- 'grid_signal' | 'inbox_lead' | 'sphere_signal' | 'manual'
  source_id         uuid,                           -- FK varies (signal_id / contact_id / etc.)
  property_address  text,                           -- when known
  property_zip      text,
  notes             text,
  created_by        uuid references auth.users(id) on delete set null,
  won_transaction_id uuid,                          -- set when graduates to transactions table
  opened_at         timestamptz not null default now(),
  stage_changed_at  timestamptz not null default now(),
  closed_at         timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (workspace_id, opp_number)
);
create index if not exists opps_workspace_stage_idx
  on opportunities(workspace_id, stage);
create index if not exists opps_contact_idx
  on opportunities(contact_id);
create index if not exists opps_expected_close_idx
  on opportunities(workspace_id, expected_close);

alter table opportunities enable row level security;
create policy "members_read_opportunities" on opportunities
  for select using (workspace_id in (select alevant_user_workspace_ids()));
create policy "members_write_opportunities" on opportunities
  for all using (workspace_id in (select alevant_user_workspace_ids()))
        with check (workspace_id in (select alevant_user_workspace_ids()));

-- Stage history (append-only audit of stage transitions)
create table if not exists opportunity_stage_history (
  id              uuid primary key default uuid_generate_v4(),
  opportunity_id  uuid not null references opportunities(id) on delete cascade,
  from_stage      text,
  to_stage        text not null,
  changed_by      uuid references auth.users(id) on delete set null,
  notes           text,
  changed_at      timestamptz not null default now()
);
create index if not exists opp_stage_history_opp_idx
  on opportunity_stage_history(opportunity_id, changed_at desc);

-- ---------------------------------------------------------------------------
-- 3. contact_activities — communications timeline
-- Captures every email/sms/call/note/meeting/linkedin touch on a contact.
-- ---------------------------------------------------------------------------
create table if not exists contact_activities (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  contact_id      uuid not null references contacts(id) on delete cascade,
  opportunity_id  uuid references opportunities(id) on delete set null,
  kind            text not null
    check (kind in (
      'email_sent','email_received',
      'sms_sent','sms_received',
      'call_outbound','call_inbound','call_missed',
      'meeting','linkedin_dm','note','task_completed',
      'system_event'
    )),
  channel         text,                              -- 'gmail' | 'twilio' | 'sofia' | 'vesper' | 'manual' | 'linkedin'
  direction       text check (direction in ('inbound','outbound','internal')),
  subject         text,
  body            text,
  duration_seconds int,                              -- for calls
  outcome         text,                              -- for calls: 'connected' | 'voicemail' | 'no_answer'
  external_id     text,                              -- gmail message id / twilio sid / sofia call_id
  occurred_at     timestamptz not null default now(),
  logged_by       uuid references auth.users(id) on delete set null,
  logged_by_system text,                             -- 'sofia' | 'vesper' | 'gmail-webhook' | 'twilio-webhook' | 'manual'
  metadata        jsonb default '{}',
  created_at      timestamptz not null default now()
);
create index if not exists contact_activities_contact_idx
  on contact_activities(contact_id, occurred_at desc);
create index if not exists contact_activities_workspace_idx
  on contact_activities(workspace_id, occurred_at desc);
create index if not exists contact_activities_opp_idx
  on contact_activities(opportunity_id, occurred_at desc) where opportunity_id is not null;
create index if not exists contact_activities_external_idx
  on contact_activities(external_id) where external_id is not null;

alter table contact_activities enable row level security;
create policy "members_read_contact_activities" on contact_activities
  for select using (workspace_id in (select alevant_user_workspace_ids()));
create policy "members_write_contact_activities" on contact_activities
  for all using (workspace_id in (select alevant_user_workspace_ids()))
        with check (workspace_id in (select alevant_user_workspace_ids()));

-- ---------------------------------------------------------------------------
-- 4. playbooks — outreach cadence templates
-- Triggered by a (lifecycle_stage, temperature) tuple. Step engine V2; for V1
-- we persist runs but execution is gated until the engine ships.
-- ---------------------------------------------------------------------------
create table if not exists playbooks (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  name            text not null,
  description     text,
  trigger_lifecycle_stages text[],                   -- e.g. ['prospect','lead']
  trigger_temperatures     text[],                   -- e.g. ['Hot']
  steps_json      jsonb not null,                    -- [{day_offset, channel, action, prompt_template_id}]
  is_system       boolean default false,             -- shipped defaults
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists playbooks_workspace_idx
  on playbooks(workspace_id);

alter table playbooks enable row level security;
create policy "members_read_playbooks" on playbooks
  for select using (workspace_id in (select alevant_user_workspace_ids()) or is_system = true);
create policy "members_write_playbooks" on playbooks
  for all using (workspace_id in (select alevant_user_workspace_ids()))
        with check (workspace_id in (select alevant_user_workspace_ids()));

create table if not exists playbook_runs (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  playbook_id     uuid not null references playbooks(id) on delete cascade,
  contact_id      uuid not null references contacts(id) on delete cascade,
  status          text not null default 'active'
    check (status in ('active','paused','completed','aborted')),
  current_step    int default 0,
  started_at      timestamptz not null default now(),
  paused_at       timestamptz,
  completed_at    timestamptz,
  unique (workspace_id, playbook_id, contact_id, started_at)
);
create index if not exists playbook_runs_contact_idx
  on playbook_runs(contact_id, status);
create index if not exists playbook_runs_workspace_status_idx
  on playbook_runs(workspace_id, status);

alter table playbook_runs enable row level security;
create policy "members_read_playbook_runs" on playbook_runs
  for select using (workspace_id in (select alevant_user_workspace_ids()));
create policy "members_write_playbook_runs" on playbook_runs
  for all using (workspace_id in (select alevant_user_workspace_ids()))
        with check (workspace_id in (select alevant_user_workspace_ids()));

-- Seed system playbooks (workspace_id null and is_system true; available to all workspaces via RLS)
-- Use a sentinel "system" workspace by inserting NULL workspace_id NOT allowed by FK, so we just
-- create per-workspace later in onboarding. For now, deliberately empty.

-- ---------------------------------------------------------------------------
-- 5. workspace_comms_settings — per-workspace auto-logging mode
-- ---------------------------------------------------------------------------
create table if not exists workspace_comms_settings (
  workspace_id     uuid primary key references workspaces(id) on delete cascade,
  auto_log_mode    text not null default 'full_auto'
    check (auto_log_mode in ('full_auto','sofia_only','manual_only')),
  gmail_enabled    boolean default true,
  twilio_enabled   boolean default true,
  sofia_enabled    boolean default true,
  vesper_enabled   boolean default true,
  linkedin_enabled boolean default false,
  updated_at       timestamptz not null default now(),
  updated_by       uuid references auth.users(id) on delete set null
);
alter table workspace_comms_settings enable row level security;
create policy "members_read_comms_settings" on workspace_comms_settings
  for select using (workspace_id in (select alevant_user_workspace_ids()));
create policy "members_write_comms_settings" on workspace_comms_settings
  for all using (workspace_id in (select alevant_user_workspace_ids()))
        with check (workspace_id in (select alevant_user_workspace_ids()));

-- ---------------------------------------------------------------------------
-- 6. Replace vw_prospects to surface temperature + priority
-- ---------------------------------------------------------------------------
create or replace view vw_prospects as
select
  'grid' as source,
  g.id as source_id,
  g.workspace_id,
  g.contact_id,
  g.property_address as title,
  g.property_city as city,
  g.property_zip as zip,
  g.owner_name as person_name,
  coalesce(g.hazard_90d * 100, g.motivation_score) as score,
  case
    when g.motivation_score >= 80 then 'Hot'
    when g.motivation_score >= 65 then 'Hot'
    when g.motivation_score >= 45 then 'Warm'
    else 'Cold' end as temperature,
  case
    when g.motivation_score >= 75 then 'High'
    when g.motivation_score >= 50 then 'Medium'
    else 'Low' end as priority,
  case
    when g.motivation_score >= 80 then 'blazing'
    when g.motivation_score >= 65 then 'hot'
    when g.motivation_score >= 45 then 'warm'
    else 'watch' end as urgency_band,
  g.reasons_summary as why,
  g.expires_at as expires_at,
  g.refreshed_at as detected_at,
  case when g.contact_id is not null then 'engaged' else 'new' end as state
from grid_signals g
where (coalesce(g.mls_status, 'unknown') not in ('active','pending','closed_recent'))
  and (g.expires_at is null or g.expires_at > now())
  and (g.motivation_score >= 45 or g.hazard_90d >= 0.15)

union all

select
  'inbox' as source,
  c.id as source_id,
  c.workspace_id,
  c.id as contact_id,
  coalesce(c.full_name, c.emails[1], c.phones[1], 'Unknown lead') as title,
  null::text as city,
  null::text as zip,
  c.full_name as person_name,
  c.relationship_score::numeric as score,
  coalesce(c.temperature, 'Warm') as temperature,
  coalesce(c.priority, 'Medium') as priority,
  case
    when c.relationship_score >= 70 then 'hot'
    when c.relationship_score >= 40 then 'warm'
    else 'watch' end as urgency_band,
  c.notes as why,
  null::timestamptz as expires_at,
  c.created_at as detected_at,
  case when c.last_touch_at is null then 'new' else 'engaged' end as state
from contacts c
where c.category = 'lead'
  and c.lifecycle_stage in ('prospect','lead')
  and (c.last_touch_at is null or c.last_touch_at < now() - interval '14 days')

union all

select
  'sphere' as source,
  ss.id as source_id,
  ss.workspace_id,
  ss.contact_id,
  coalesce(c.full_name, 'Sphere contact') as title,
  null::text as city,
  null::text as zip,
  c.full_name as person_name,
  (ss.confidence)::numeric as score,
  coalesce(c.temperature, 'Warm') as temperature,
  coalesce(c.priority, 'Medium') as priority,
  case
    when ss.confidence >= 70 then 'hot'
    when ss.confidence >= 40 then 'warm'
    else 'watch' end as urgency_band,
  ss.signal_type as why,
  null::timestamptz as expires_at,
  ss.detected_at as detected_at,
  case when ss.surfaced_at is not null then 'engaged' else 'new' end as state
from sphere_signals ss
join contacts c on c.id = ss.contact_id
where ss.resolved = false;
