-- Reconciled from prod 2026-05-23 (originally applied 2026-05-16).
-- Per-step scheduled execution of a playbook_run + seed system playbooks.
create table if not exists playbook_step_runs (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  run_id          uuid not null references playbook_runs(id) on delete cascade,
  contact_id      uuid not null references contacts(id) on delete cascade,
  step_index      int not null,
  step_json       jsonb not null,
  due_at          timestamptz not null,
  state           text not null default 'scheduled'
    check (state in ('scheduled','surfaced','completed','skipped','snoozed','aborted')),
  surfaced_at     timestamptz,
  completed_at    timestamptz,
  snoozed_until   timestamptz,
  related_activity_id uuid references contact_activities(id) on delete set null,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (run_id, step_index)
);
create index if not exists psr_due_idx on playbook_step_runs(state, due_at) where state in ('scheduled','surfaced');
create index if not exists psr_contact_idx on playbook_step_runs(contact_id, state);
create index if not exists psr_workspace_idx on playbook_step_runs(workspace_id, state, due_at);

alter table playbook_step_runs enable row level security;
create policy "members_read_psr" on playbook_step_runs for select using (workspace_id in (select alevant_user_workspace_ids()));
create policy "members_write_psr" on playbook_step_runs for all using (workspace_id in (select alevant_user_workspace_ids())) with check (workspace_id in (select alevant_user_workspace_ids()));

-- Seed system playbooks for every existing workspace + for any future workspace via trigger.
create or replace function seed_system_playbooks_for_workspace(ws uuid) returns void
language plpgsql security definer as $$
begin
  insert into playbooks (workspace_id, name, description, trigger_lifecycle_stages, trigger_temperatures, steps_json, is_system)
  values
    (
      ws,
      'Hot Prospect — 7-day blitz',
      'Aggressive cadence when a prospect or lead goes Hot. Personal call, follow-up text, comps email, re-call.',
      array['prospect','lead']::text[],
      array['Hot']::text[],
      $j${"steps":[
        {"day_offset":0,"channel":"call","action":"Personal call. Reference the specific signal (probate / pre-foreclosure / refi / sphere event).","draft_prompt":"hot_call_open"},
        {"day_offset":1,"channel":"sms","action":"Follow-up text — short, warm, confirms voicemail or thanks for the chat.","draft_prompt":"hot_sms_followup"},
        {"day_offset":3,"channel":"email","action":"Send neighborhood comps + a 1-page market summary.","draft_prompt":"comps_email"},
        {"day_offset":7,"channel":"call","action":"Re-call. If still no contact, downgrade to Warm.","draft_prompt":"hot_call_retry"}
      ]}$j$::jsonb,
      true
    ),
    (
      ws,
      'Warm Nurture — quarterly value',
      'For Warm prospects who arent ready yet. Quarterly value-add touches, no pressure.',
      array['prospect','lead','engaged']::text[],
      array['Warm']::text[],
      $j${"steps":[
        {"day_offset":0,"channel":"email","action":"Send a neighborhood market update (last quarter summary).","draft_prompt":"market_update_email"},
        {"day_offset":30,"channel":"sms","action":"Casual check-in text. Reference one relevant local change.","draft_prompt":"warm_checkin_sms"},
        {"day_offset":90,"channel":"call","action":"Quarterly call. Ask about plans for the year, not the property.","draft_prompt":"warm_quarterly_call"},
        {"day_offset":180,"channel":"email","action":"Send a fresh CMA or off-market opportunity.","draft_prompt":"warm_cma_email"}
      ]}$j$::jsonb,
      true
    ),
    (
      ws,
      'Cold Drip — monthly content',
      'Cold contacts receive a low-touch monthly content drip. One email, no calls.',
      array['prospect','lead']::text[],
      array['Cold']::text[],
      $j${"steps":[
        {"day_offset":0,"channel":"email","action":"Welcome-back email with a useful resource (school district, taxes, market data).","draft_prompt":"cold_welcome_email"},
        {"day_offset":30,"channel":"email","action":"Monthly market summary email.","draft_prompt":"market_update_email"},
        {"day_offset":60,"channel":"email","action":"Monthly market summary email.","draft_prompt":"market_update_email"},
        {"day_offset":90,"channel":"email","action":"Monthly market summary email. Ask one soft qualifying question.","draft_prompt":"cold_qualifier_email"}
      ]}$j$::jsonb,
      true
    ),
    (
      ws,
      'Past Client — annual touch',
      'Stay top-of-mind with closed clients. Anniversary, valuation update, holiday.',
      array['client_past']::text[],
      array['Hot','Warm','Cold']::text[],
      $j${"steps":[
        {"day_offset":0,"channel":"email","action":"Closing-anniversary note with a thank-you and one personal detail.","draft_prompt":"anniversary_email"},
        {"day_offset":90,"channel":"email","action":"Quarterly home-value update (CMA on their property).","draft_prompt":"client_cma_email"},
        {"day_offset":180,"channel":"call","action":"Mid-year check-in call. Ask about renovations, refis, life changes.","draft_prompt":"client_midyear_call"},
        {"day_offset":275,"channel":"email","action":"Holiday card / message.","draft_prompt":"holiday_email"}
      ]}$j$::jsonb,
      true
    ),
    (
      ws,
      'Sphere Annual — relationship maintenance',
      'For sphere members. Birthday, anniversary, and one personal value-add per year.',
      array['sphere']::text[],
      array['Hot','Warm','Cold']::text[],
      $j${"steps":[
        {"day_offset":0,"channel":"sms","action":"Personal text — reference a recent life event or shared connection.","draft_prompt":"sphere_personal_sms"},
        {"day_offset":120,"channel":"email","action":"Birthday or anniversary note, personalized.","draft_prompt":"sphere_milestone_email"},
        {"day_offset":240,"channel":"meeting","action":"Coffee / lunch / drinks invite.","draft_prompt":"sphere_meeting_invite"}
      ]}$j$::jsonb,
      true
    );
end $$;

-- Seed for existing workspaces
do $$
declare w record;
begin
  for w in select id from workspaces loop
    if not exists (select 1 from playbooks where workspace_id = w.id and is_system = true) then
      perform seed_system_playbooks_for_workspace(w.id);
    end if;
  end loop;
end $$;

-- Trigger so new workspaces get the system playbooks automatically
create or replace function trg_seed_system_playbooks() returns trigger
language plpgsql security definer as $$
begin
  perform seed_system_playbooks_for_workspace(NEW.id);
  return NEW;
end $$;

drop trigger if exists workspaces_seed_playbooks on workspaces;
create trigger workspaces_seed_playbooks
  after insert on workspaces
  for each row execute function trg_seed_system_playbooks();
