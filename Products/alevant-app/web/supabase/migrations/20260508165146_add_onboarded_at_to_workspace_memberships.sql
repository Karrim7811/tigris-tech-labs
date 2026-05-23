-- Reconciled from prod 2026-05-23 (originally applied 2026-05-08).
ALTER TABLE workspace_memberships ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;
COMMENT ON COLUMN workspace_memberships.onboarded_at IS 'Timestamp when this member completed the onboarding wizard. NULL means they have not onboarded yet and the dashboard should redirect them to /onboard.';
