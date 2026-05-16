-- ============================================================================
-- Contacts + Prospects — unify the people model across Grid, Sphere, Inbox, Pipelines.
-- See: conversation with Karim 2026-05-15
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Link grid_signals to contacts (a Grid signal can be "converted" to a contact)
-- ---------------------------------------------------------------------------
alter table grid_signals
  add column if not exists contact_id   uuid references contacts(id) on delete set null,
  add column if not exists converted_at timestamptz,
  add column if not exists converted_by uuid references auth.users(id) on delete set null;

create index if not exists grid_signals_contact_id_idx
  on grid_signals(contact_id) where contact_id is not null;

-- ---------------------------------------------------------------------------
-- 2. Lifecycle stage on contacts (canonical CRM stage independent of category)
-- ---------------------------------------------------------------------------
alter table contacts
  add column if not exists lifecycle_stage text default 'prospect'
    check (lifecycle_stage in (
      'prospect','lead','engaged','client_active','client_past','sphere','do_not_contact'
    )),
  add column if not exists tags text[] default array[]::text[],
  add column if not exists prospect_source text;  -- 'grid' | 'inbox' | 'sphere' | 'manual' | 'import'

create index if not exists contacts_lifecycle_idx
  on contacts(workspace_id, lifecycle_stage);
create index if not exists contacts_tags_idx
  on contacts using gin (tags);

-- ---------------------------------------------------------------------------
-- 3. Cross-source prospects view — the unified "today's call list" surface
-- ---------------------------------------------------------------------------
--
-- A prospect is anyone who might become a client soon:
--   (a) Grid-flagged homeowner with motivation_score >= 45 or hazard_90d >= 0.15
--       AND not already a contact
--   (b) Inbox lead that hasn't been engaged
--   (c) Sphere contact with an unresolved life-event signal
--
create or replace view vw_prospects as
-- (a) Grid-flagged prospects (not yet converted to contacts)
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
  g.band as urgency_band,
  g.reasons_summary as why,
  g.expires_at as expires_at,
  g.refreshed_at as detected_at,
  case when g.contact_id is not null then 'engaged' else 'new' end as state
from grid_signals g
where (coalesce(g.mls_status, 'unknown') not in ('active','pending','closed_recent'))
  and (g.expires_at is null or g.expires_at > now())
  and (g.motivation_score >= 45 or g.hazard_90d >= 0.15)

union all

-- (b) Inbox-derived prospects with no engagement yet
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

-- (c) Sphere members with an unresolved life-event signal
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

-- ---------------------------------------------------------------------------
-- 4. Unified contacts view — joins relationships across the data model
-- ---------------------------------------------------------------------------
create or replace view vw_contacts_unified as
select
  c.id,
  c.workspace_id,
  c.full_name,
  c.emails,
  c.phones,
  c.category,
  c.lifecycle_stage,
  c.tags,
  c.relationship_score,
  c.prospect_source,
  c.source,
  c.language,
  c.notes,
  c.last_touch_at,
  c.created_at,
  -- relationships
  (select count(*) from buyers b where b.contact_id = c.id) as buyer_deals,
  (select count(*) from listings l where l.seller_contact_id = c.id) as seller_listings,
  (select count(*) from grid_signals g where g.contact_id = c.id) as linked_grid_signals,
  (select count(*) from sphere_signals s where s.contact_id = c.id and s.resolved = false) as open_sphere_signals
from contacts c;
