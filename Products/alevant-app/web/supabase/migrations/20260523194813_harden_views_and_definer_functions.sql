-- Applied to alevant-prod 2026-05-23 via MCP apply_migration.
-- Hardening pass on top of enable_rls_on_exposed_tables:
--   (a) recreate vw_prospects / vw_contacts_unified / vw_grid_actionable as
--       SECURITY INVOKER so RLS applies to the calling user, not the view owner.
--   (b) lock down SECURITY DEFINER functions (RLS helper + system-playbook seed)
--       from being called by anon/authenticated via REST.
--   (c) pin search_path on those same functions to prevent search_path attacks.
--   (d) add missing policies on transaction_milestones (pre-existing gap from
--       the initial schema — RLS was enabled, no policies were ever written).

-- ── (a) Recreate the three views as SECURITY INVOKER ─────────────────────────
alter view public.vw_prospects        set (security_invoker = true);
alter view public.vw_contacts_unified set (security_invoker = true);
alter view public.vw_grid_actionable  set (security_invoker = true);

-- ── (b) + (c) Lock the SECURITY DEFINER functions ───────────────────────────
-- The RLS helper. SECURITY DEFINER stays (it needs to read workspace_memberships
-- regardless of the caller's RLS). NOTE: cannot revoke EXECUTE from PUBLIC
-- because every RLS policy on the database calls this function — that would
-- break every authenticated query. Accepted advisor exposure: the function
-- returns only the caller's own workspace ids, which they can already derive.
alter function public.alevant_user_workspace_ids() set search_path = public;
revoke execute on function public.alevant_user_workspace_ids() from anon, authenticated;

-- Internal trigger helper. Should never be called via REST.
alter function public.seed_system_playbooks_for_workspace(uuid) set search_path = public;
revoke execute on function public.seed_system_playbooks_for_workspace(uuid) from anon, authenticated, public;

-- Trigger function itself. Same lockdown.
alter function public.trg_seed_system_playbooks() set search_path = public;
revoke execute on function public.trg_seed_system_playbooks() from anon, authenticated, public;

-- ── (d) transaction_milestones — workspace-derived via parent transaction ──
-- (RLS was already enabled in the initial schema; nobody ever wrote the
-- policies. Authenticated reads have been blocked since day one.)
create policy "members_read_transaction_milestones" on transaction_milestones
  for select using (
    transaction_id in (
      select id from transactions
      where workspace_id in (select alevant_user_workspace_ids())
    )
  );
create policy "members_write_transaction_milestones" on transaction_milestones
  for all using (
    transaction_id in (
      select id from transactions
      where workspace_id in (select alevant_user_workspace_ids())
    )
  )
  with check (
    transaction_id in (
      select id from transactions
      where workspace_id in (select alevant_user_workspace_ids())
    )
  );
