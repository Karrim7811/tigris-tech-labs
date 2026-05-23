-- ============================================================================
-- Workspace memberships — onboarded_at gate column
-- ============================================================================
-- The 9-stage onboarding wizard is gated on workspace_memberships.onboarded_at:
--   - api/onboard/activate/route.ts writes it = now() on the final stage
--   - app/(app)/dashboard/page.tsx redirects to /onboard when it is null
-- The column was referenced from day one but never added by a migration.
-- Backfill any member of an already-activated workspace so existing rows do not
-- get bounced back into the wizard.
-- ============================================================================

alter table workspace_memberships
  add column if not exists onboarded_at timestamptz;

create index if not exists workspace_memberships_onboarded_idx
  on workspace_memberships(user_id) where onboarded_at is not null;

-- Backfill: any membership whose workspace is already 'active' is treated as
-- onboarded (using the workspace's activated_at, falling back to created_at).
update workspace_memberships wm
set onboarded_at = coalesce(w.activated_at, w.created_at)
from workspaces w
where wm.workspace_id = w.id
  and wm.onboarded_at is null
  and w.status = 'active';
