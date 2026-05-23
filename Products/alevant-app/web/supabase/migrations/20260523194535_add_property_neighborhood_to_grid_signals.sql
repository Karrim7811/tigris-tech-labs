-- Applied to alevant-prod 2026-05-23 via MCP apply_migration.
-- C-8 in REFACTOR-ROADMAP.md: api/grid/score and api/grid/scan write to
-- grid_signals.property_neighborhood on every signal, but the column did not
-- exist in prod (the local _archive-bootstrap/0000...02a file was never
-- applied). Every grid scoring INSERT was silently failing for any row whose
-- shape included this column.

ALTER TABLE grid_signals ADD COLUMN IF NOT EXISTS property_neighborhood text;
CREATE INDEX IF NOT EXISTS grid_signals_neighborhood_idx
  ON grid_signals (property_neighborhood)
  WHERE property_neighborhood IS NOT NULL;
COMMENT ON COLUMN grid_signals.property_neighborhood IS
  'Neighborhood label (e.g. "Brickell", "South Beach"). Written by api/grid/score and api/grid/scan; surfaced in vw_prospects and market-insights.';
