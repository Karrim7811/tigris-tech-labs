-- Applied to alevant-prod 2026-05-23 via MCP apply_migration.
-- C-6 in REFACTOR-ROADMAP.md: 16 tables had RLS disabled, exposing them via the
-- anon key. Enable RLS on all of them; add per-table policies that match how
-- application code actually uses each table.

-- ── 1. Workspace-scoped: AI personas + knowledge base ─────────────────────────
alter table ai_capabilities enable row level security;
create policy "members_read_ai_capabilities" on ai_capabilities
  for select using (workspace_id in (select alevant_user_workspace_ids()));
create policy "members_write_ai_capabilities" on ai_capabilities
  for all using (workspace_id in (select alevant_user_workspace_ids()))
        with check (workspace_id in (select alevant_user_workspace_ids()));

alter table ai_custom_rules enable row level security;
create policy "members_read_ai_custom_rules" on ai_custom_rules
  for select using (workspace_id in (select alevant_user_workspace_ids()));
create policy "members_write_ai_custom_rules" on ai_custom_rules
  for all using (workspace_id in (select alevant_user_workspace_ids()))
        with check (workspace_id in (select alevant_user_workspace_ids()));

alter table knowledge_collections enable row level security;
create policy "members_read_knowledge_collections" on knowledge_collections
  for select using (workspace_id in (select alevant_user_workspace_ids()));
create policy "members_write_knowledge_collections" on knowledge_collections
  for all using (workspace_id in (select alevant_user_workspace_ids()))
        with check (workspace_id in (select alevant_user_workspace_ids()));

alter table knowledge_entries enable row level security;
create policy "members_read_knowledge_entries" on knowledge_entries
  for select using (workspace_id in (select alevant_user_workspace_ids()));
create policy "members_write_knowledge_entries" on knowledge_entries
  for all using (workspace_id in (select alevant_user_workspace_ids()))
        with check (workspace_id in (select alevant_user_workspace_ids()));

alter table knowledge_files enable row level security;
create policy "members_read_knowledge_files" on knowledge_files
  for select using (workspace_id in (select alevant_user_workspace_ids()));
create policy "members_write_knowledge_files" on knowledge_files
  for all using (workspace_id in (select alevant_user_workspace_ids()))
        with check (workspace_id in (select alevant_user_workspace_ids()));

-- ── 2. Parent-FK-derived: opportunity_stage_history (via opportunities) ───────
alter table opportunity_stage_history enable row level security;
create policy "members_read_opp_stage_history" on opportunity_stage_history
  for select using (
    opportunity_id in (
      select id from opportunities
      where workspace_id in (select alevant_user_workspace_ids())
    )
  );
create policy "members_write_opp_stage_history" on opportunity_stage_history
  for all using (
    opportunity_id in (
      select id from opportunities
      where workspace_id in (select alevant_user_workspace_ids())
    )
  )
  with check (
    opportunity_id in (
      select id from opportunities
      where workspace_id in (select alevant_user_workspace_ids())
    )
  );

-- ── 3. Service-role-only (RLS on, no policies — only service role bypasses) ──
-- Florida raw caches and visual / mail / death-record vendor caches. These are
-- shared scrape caches with no workspace ownership; orchestrators run server-
-- side via the service role.
alter table florida_court_filings        enable row level security;
alter table florida_tax_records          enable row level security;
alter table florida_code_enforcement     enable row level security;
alter table florida_permits              enable row level security;
alter table florida_business_filings     enable row level security;
alter table florida_voter_roll_snapshots enable row level security;
alter table property_visual_diffs        enable row level security;
alter table usps_ncoa_records            enable row level security;
alter table dmf_records                  enable row level security;

-- ── 4. Public-read, service-role-write: grid_model_registry ──────────────────
-- ML model metadata (status, version, framework, fairness audit). No PII;
-- visible to all authenticated users for transparency. Writes (training,
-- promotion) go through the ML pipeline using the service role.
alter table grid_model_registry enable row level security;
create policy "public_read_grid_model_registry" on grid_model_registry
  for select using (true);
