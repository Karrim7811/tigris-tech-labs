-- ============================================================================
-- ALEVANT — Billing & Admin migration
-- Stripe integration tables + brokerage admin metrics + waitlist + press leads
-- ============================================================================

-- Plans / pricing (system-managed reference table)
create table if not exists plans (
  id            text primary key,
  name          text not null,
  monthly_cents int not null,
  annual_cents  int,
  agent_seats   int default 1,
  features      jsonb default '{}',
  stripe_price_id_month text,
  stripe_price_id_year  text,
  active        boolean default true,
  display_order int default 0
);

insert into plans (id, name, monthly_cents, annual_cents, agent_seats, features, display_order)
values
  ('pilot',     'Pilot',     0,      0,      1,  '{"sofia":true,"vesper":true,"grid":true,"transactions":true,"trial_days":90}', 1),
  ('agent',     'Agent',     39900,  399000, 1,  '{"sofia":true,"vesper":true,"grid":true,"transactions":true,"voice_minutes":2000}', 2),
  ('team',      'Team',      99900,  999000, 5,  '{"sofia":true,"vesper":true,"grid":true,"transactions":true,"team_admin":true,"voice_minutes":10000}', 3),
  ('brokerage', 'Brokerage', 499900, 4999000, 50, '{"all":true,"white_label":true,"brokerage_admin":true,"sso":true,"voice_minutes":50000}', 4)
on conflict (id) do nothing;

-- Stripe customer linkage (per workspace)
create table if not exists billing_customers (
  workspace_id          uuid primary key references workspaces(id) on delete cascade,
  stripe_customer_id    text unique,
  stripe_subscription_id text,
  plan_id               text references plans(id),
  status                text default 'trialing',
  trial_end_at          timestamptz,
  current_period_end    timestamptz,
  cancel_at             timestamptz,
  payment_method_brand  text,
  payment_method_last4  text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- Usage metering (Stripe usage-based billing for Sofia minutes / Vesper credits)
create table if not exists usage_events (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  meter         text not null,
  quantity      numeric not null,
  unit          text default 'count',
  occurred_at   timestamptz not null default now(),
  reported_to_stripe_at timestamptz,
  metadata      jsonb default '{}'
);
create index if not exists usage_workspace_meter_idx on usage_events(workspace_id, meter, occurred_at desc);

-- Marketing-site lead capture
create table if not exists marketing_waitlist (
  id            uuid primary key default uuid_generate_v4(),
  email         text not null,
  full_name     text,
  brokerage     text,
  market        text,
  source        text,
  intent        text,
  metadata      jsonb,
  created_at    timestamptz default now(),
  unique (email)
);

create table if not exists demo_requests (
  id            uuid primary key default uuid_generate_v4(),
  email         text not null,
  full_name     text,
  brokerage     text,
  agent_count   int,
  preferred_time text,
  notes         text,
  status        text default 'new',
  created_at    timestamptz default now()
);

create table if not exists press_inquiries (
  id            uuid primary key default uuid_generate_v4(),
  outlet        text,
  reporter_name text,
  email         text,
  topic         text,
  deadline_at   timestamptz,
  notes         text,
  status        text default 'new',
  created_at    timestamptz default now()
);

-- Brokerage admin: aggregate KPIs per agent (denormalized for cross-agent reporting)
create table if not exists brokerage_kpi_snapshots (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  agent_id        uuid references agents(id),
  snapshot_date   date not null,
  active_listings int default 0,
  active_buyers   int default 0,
  closed_ytd      numeric default 0,
  pipeline_total  numeric default 0,
  sofia_calls     int default 0,
  sofia_qualified int default 0,
  vesper_published int default 0,
  grid_signals_blazing int default 0,
  unique (workspace_id, agent_id, snapshot_date)
);

-- RLS
alter table plans                    enable row level security;
alter table billing_customers        enable row level security;
alter table usage_events             enable row level security;
alter table marketing_waitlist       enable row level security;
alter table demo_requests            enable row level security;
alter table press_inquiries          enable row level security;
alter table brokerage_kpi_snapshots  enable row level security;

create policy "public_read_plans" on plans for select using (true);

create policy "members_read_billing" on billing_customers
  for select using (workspace_id in (select alevant_user_workspace_ids()));
create policy "members_read_usage" on usage_events
  for select using (workspace_id in (select alevant_user_workspace_ids()));
create policy "members_read_kpi_snap" on brokerage_kpi_snapshots
  for select using (workspace_id in (select alevant_user_workspace_ids()));

-- Marketing tables: writes from public via service role only
create policy "service_only_waitlist" on marketing_waitlist for select using (false);
create policy "service_only_demos" on demo_requests for select using (false);
create policy "service_only_press" on press_inquiries for select using (false);
