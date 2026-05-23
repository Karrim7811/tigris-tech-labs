# Supabase migrations

This directory is the **canonical migration history** for alevant-prod (project ref `xipmovjuppwjjutcwhym`). Every file here is reconciled against `supabase_migrations.schema_migrations` in the live database.

## Layout

```
migrations/
├── 20260508165146_add_onboarded_at_to_workspace_memberships.sql
├── 20260508171243_add_dotloop_loop_id_to_transactions.sql
├── 20260508182945_add_capabilities_custom_rules_knowledge_base.sql
├── 20260516142740_grid_v1_5.sql
├── 20260516142805_contacts_prospects.sql
├── 20260516142820_contact_enrichment.sql
├── 20260516145803_opportunities_activities_v3.sql
├── 20260516150449_contacts_view_with_temp_priority.sql
├── 20260516151108_playbook_execution.sql
└── _archive-bootstrap/      ← historical placeholders, NOT applied by `supabase db push`
```

## Why two sets?

Before 2026-05-23, this repo used a parallel `00000000000000_*` → `00000000000007_*` placeholder set that captured the *intent* of the schema but was never the source of truth for production migration tracking. Prod was migrated directly via Supabase Studio's SQL editor, and the resulting SQL was kept only in `supabase_migrations.schema_migrations`. The `0000...` files drifted from prod over time (e.g., they were missing `ai_capabilities`, `knowledge_*`, `playbook_step_runs`, `mls_safe_mode`).

On 2026-05-23 the prod migration history was dumped via the Supabase MCP (`supabase_migrations.schema_migrations.statements`) and written here as the canonical set. The legacy `0000...` files were moved to `_archive-bootstrap/` so the Supabase CLI ignores them (it only picks up `*.sql` directly in this folder).

## Workflow

- **Adding a new migration:** `supabase migration new <name>` (creates a fresh `YYYYMMDDHHMMSS_<name>.sql`), then `supabase db push` to apply.
- **Pulling a manually-applied migration back into git:** `supabase db pull` writes any missing migrations from prod into this folder.
- **Regenerating TypeScript types:** `pnpm gen-types` (in `web/`) regenerates `src/lib/supabase/database.types.ts` against the live prod schema. Run this whenever migrations land.
- **Resetting a local Supabase project from scratch:** `supabase db reset` (only against a *local* DB — never prod) replays this directory from `20260508165146` forward.

## Outstanding schema fixes (see REFACTOR-ROADMAP.md)

- **C-8** — `grid_signals.property_neighborhood` is missing in prod. Code writes to it; writes silently fail. Needs a new migration.
- **C-6** — 16 tables have RLS disabled (`ai_capabilities`, `ai_custom_rules`, `knowledge_*`, all 8 Florida raw caches, `property_visual_diffs`, `usps_ncoa_records`, `dmf_records`, `grid_model_registry`, `opportunity_stage_history`). Needs a new migration with per-table policies — see roadmap for proposed defaults.
