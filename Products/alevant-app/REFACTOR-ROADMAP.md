# REFACTOR-ROADMAP.md — alevant-app

Prioritized list of refactors and remediations surfaced during the foundation audit (2026-05-23). Each item carries an effort estimate (XS ≤ 1h · S ≤ 4h · M ≤ 1d · L ≤ 1w), the files most affected, and which audit lens surfaced it. Critical items are pre-launch blockers; High are launch-quality fixes; Medium are hygiene + design debt; Low + Future Automation are roadmap.

Effort calibration: a one-engineer-Claude pair sprint. Multiply by 1.5 for human-only.

---

## STATUS — what's already shipped

Foundation sprint (commits `a0f6442` → `b1855d8` on 2026-05-23) resolved:
**C-1** (onboarded_at migration), **C-4** (sphere sweep auth + FK fix),
**C-5** (vw_prospects band fix, partial C-2 hardening on `/api/contacts/[id]`),
**M-1** (migration timestamp dedup), **M-8** (Sofia voice mismatch),
**M-9** (default brand color), **L-2 + L-5** (already gitignored — no-op),
**H-3 Phase A** (generated Database types + opt-in `lib/supabase/typed.ts` +
`pnpm gen-types`). C-2 and C-3 still pending the systematic sweep — typed
clients now exist to use during it.

The type generation surfaced **new findings** added below as C-6, C-7, C-8.

---

## CRITICAL — block Bichi launch

### C-1 · Add missing `workspace_memberships.onboarded_at` column  ✅ SHIPPED
**Description.** `api/onboard/activate/route.ts:220-223` writes `onboarded_at = now()` to `workspace_memberships`; `(app)/dashboard/page.tsx:230` reads it as the gate that lets users into the dashboard. The column is not defined in any migration. Activate silently fails → every dashboard load redirects to `/onboard` → wizard appears to be uncompletable.

**Why it matters.** Bichi cannot complete onboarding today. End-to-end demo is broken.

**Effort.** XS — one migration + idempotent backfill for any user who has already completed all 9 stages.
**Files.** New `web/supabase/migrations/00000000000007_workspace_memberships_onboarded.sql`. Verify `activate/route.ts` and `dashboard/page.tsx`.
**Surfaced by.** code-review · supabase

### C-2 · Tenant-isolation defense in `/api/contacts/[id]` and similar
**Description.** Secondary queries in `web/src/app/api/contacts/[id]/route.ts` for `grid_signals`, `sphere_signals`, `buyers`, and `listings` filter only by `contact_id` and never by `workspace_id`. A user with a guessable UUID could read cross-tenant data. The pattern repeats in several routes that pivot off a foreign key without re-scoping to the workspace.

**Why it matters.** Direct PII / financial-data exposure across tenants. Real-estate CRM holds net worth, transaction history, contract terms, contact phone numbers. This is a P0 data-isolation bug.

**Effort.** S — sweep all `/api` routes for queries that don't `.eq("workspace_id", ws.id)` after the auth + workspace resolve.
**Files.** Audit all 78 `route.ts` files; primary offenders confirmed in `api/contacts/[id]/route.ts`. Add a lint rule or shared helper.
**Surfaced by.** security-guidance · code-review

### C-3 · Stop using service-role client for tenant-scoped reads/writes; lean on RLS
**Description.** 95 files call `getSupabaseService()`. The service client bypasses RLS entirely. The RLS policies in migration 0 are dead code — they protect nothing because nothing exercises them. This is also why C-2 is exploitable: defense-in-depth doesn't exist.

**Why it matters.** Multi-tenant SaaS holding PII must have RLS as the *last* line of defense, not the *only* line. The current pattern means a single bad `.eq("workspace_id", ...)` typo leaks tenant data.

**Effort.** L — systematic refactor. Replace `getSupabaseService()` with `getSupabaseServer()` in every authenticated route; reserve service-role for genuinely cross-tenant operations (webhooks, crons, marketing capture). Update workspace-resolution helper to use the authenticated client.
**Files.** All authenticated `/api/*/route.ts`, all `(app)/**/page.tsx`, `app/(app)/_lib/resolve-workspace.ts`.
**Surfaced by.** security-guidance · supabase · code-review

### C-4 · `/api/sphere/sweep` has zero auth + writes invalid FK  ✅ SHIPPED
**Description.** `web/src/app/api/sphere/sweep/route.ts` accepts unauthenticated POST/GET, iterates **every active workspace**, and inserts `sphere_signals` rows. It uses `tx.buyer_id` (an FK to `buyers`, which itself FKs to `contacts`) as `sphere_signals.contact_id` directly — that will FK-violate at scale.

**Why it matters.** Anyone on the internet can trigger writes across every tenant. Even after auth is fixed, the FK bug means the sweep generates corrupt data.

**Effort.** XS — gate with `CRON_SECRET` like every other cron, resolve `tx.buyer_id → buyers.contact_id` before the insert.
**Files.** `web/src/app/api/sphere/sweep/route.ts`, `web/src/app/api/cron/sphere-sweep/route.ts`.
**Surfaced by.** security-guidance · code-review

### C-5 · Migration 4 `vw_prospects` will fail to deploy on fresh DBs  ✅ SHIPPED
**Description.** `supabase/migrations/00000000000004_contacts_prospects.sql:59` references `g.band as urgency_band`. There is no `band` column on `grid_signals` in any prior migration. `CREATE OR REPLACE VIEW` binds at definition time and will error. Production deploys only succeed today because migration 6 happens to replace the view in the same `db push`. Anyone who runs migrations one-at-a-time, or who creates a fresh DB and stops at migration 4, hits an error.

**Why it matters.** First-time setup is brittle. Bootstrap will surprise the next person who tries it.

**Effort.** XS — change migration 4 to compute the band inline (CASE on `motivation_score`) or drop the band column from the view entirely (since migration 6 supersedes it anyway).
**Files.** `supabase/migrations/00000000000004_contacts_prospects.sql`.
**Surfaced by.** supabase · code-review

### C-6 · 16 tables in prod have RLS disabled — anon-key writeable
**Description.** Supabase advisory flagged it during type-gen: `ai_capabilities`, `ai_custom_rules`, `knowledge_collections`, `knowledge_entries`, `knowledge_files`, all 8 Florida raw-cache tables, `property_visual_diffs`, `usps_ncoa_records`, `dmf_records`, `grid_model_registry`, `opportunity_stage_history`. Anyone with the anon key (which is publicly embedded in `NEXT_PUBLIC_SUPABASE_ANON_KEY`) can read or write every row. `knowledge_entries` has 41 rows of agent-personalized AI prompts; `grid_model_registry` has the live champion-model pointer (overwritable by anyone). The Florida raw caches are less sensitive but still a poisoning vector.

**Why it matters.** Top-1 production security issue. The advisory deliberately does NOT auto-apply the fix because `alter table … enable row level security` without policies blocks the app from reading those tables — the right answer requires choosing per-table policies (workspace-scoped for AI/KB tables; public-read for Florida caches; service-role-only for the model registry).

**Effort.** S — one migration, ~16 enable statements + ~16 policies. Plus testing each affected route.
**Files.** New `web/supabase/migrations/00000000000008_enable_missing_rls.sql`. Routes that read these tables: `api/settings/capabilities/route.ts`, `api/settings/custom-rules/route.ts`, `api/kb/*`, `api/playbook-step-runs/*`, every grid scraper.
**Surfaced by.** supabase advisory · security-guidance

### C-7 · Schema drift — six tables in prod aren't in any migration file
**Description.** Live prod has `ai_capabilities`, `ai_custom_rules`, `knowledge_collections`, `knowledge_entries`, `knowledge_files`, `playbook_step_runs`, plus column `workspaces.mls_safe_mode` — none of these appear in `web/supabase/migrations/`. Someone created them directly in the Supabase console. New environments (staging, QA, second pilot tenant) can never reproduce prod.

**Why it matters.** The migration file is supposed to be the source of truth. Any disaster-recovery rebuild is broken until this is reconciled. Also blocks any meaningful schema review.

**Effort.** S — dump the missing CREATE TABLE statements from prod, format as a new migration, sequence after the existing ones so it no-ops on prod (`if not exists`) and creates on fresh DBs.
**Files.** New `web/supabase/migrations/00000000000009_reconcile_prod_schema.sql`.
**Surfaced by.** supabase · code-review

### C-8 · `00000000000002a` (property_neighborhood) was never applied to prod
**Description.** Migration file exists; the column doesn't. `api/grid/score` and `api/grid/scan` both insert `property_neighborhood` on every grid signal, and `vw_prospects` reads it. Either the migration was applied and the column got dropped, or it was never applied. The TS error chain in the typecheck revealed it.

**Why it matters.** Every grid scoring INSERT writes a nonexistent column → write fails → no new signals get stored. The Grid is silently broken in prod for any property where the neighborhood is set.

**Effort.** XS — push the C-1 migration plus the 0000...02a migration to prod in one batch.
**Files.** Just `supabase db push`.
**Surfaced by.** supabase · code-review

---

## HIGH — pre-launch quality, post-launch reliability

### H-1 · Workspace lookups must walk memberships, not assume owner
**Description.** `resolveCurrentWorkspaceId()` and every API route's inline workspace lookup hits `workspaces.owner_user_id = user.id` first and falls back to `workspace_memberships.workspace_id = user.id` only sometimes. The Team and Brokerage plans (priced in migration 1) need shared workspaces — a member who is not the owner can't access *any* route under the current pattern.

**Why it matters.** $999/mo Team plan and $4,999/mo Brokerage plan are not functional for non-owners.

**Effort.** S — unify on `workspace_memberships`; pick a primary workspace per user (or thread the chosen workspace through the URL/cookie for users with multiple memberships).
**Files.** `web/src/app/(app)/_lib/resolve-workspace.ts`, all `/api/*/route.ts` that do inline workspace resolution.
**Surfaced by.** code-review · feature-dev

### H-2 · TypeScript build, RLS health, and migration sanity in CI
**Description.** No `.github/workflows/`, no Vercel checks defined here. `pnpm typecheck` and `pnpm lint` and `supabase db lint` should fail PRs that break anything. The current "deploy via Vercel auto-on-master" path has zero pre-merge guarantees.

**Why it matters.** With the audit finding multiple schema/code drifts, basic CI would have caught them at the PR stage.

**Effort.** S — add a single GitHub Actions workflow with typecheck + lint + `supabase db diff` against migrations. Add a `db-types.ts` generation step.
**Files.** `.github/workflows/ci.yml`, `package.json` scripts.
**Surfaced by.** code-review · feature-dev

### H-3 · Generate Supabase TypeScript types and use them everywhere  ⏳ PHASE A SHIPPED
**Description.** Tables are referenced as `svc.from("contacts").select(...)` with no static type protection. Multiple `as any` casts in `dashboard/page.tsx` and elsewhere. Type drift between schema and code is invisible.

**Why it matters.** The audit found at least three references to columns that don't exist (`g.band`, `workspace_memberships.onboarded_at`, `tx.buyer_id` as contact_id semantically). Generated types would have made all of these compile errors.

**Effort.** S — run `supabase gen types typescript --linked > web/src/lib/supabase/database.types.ts`, then pass it as the generic to `createClient<Database>`. Fix the `as any` casts in waves.
**Files.** New `web/src/lib/supabase/database.types.ts`; update `lib/supabase/client.ts`, `server.ts`, `middleware.ts`.
**Surfaced by.** code-review · supabase

### H-4 · Webhook signature verification — fail closed in dev, not open
**Description.** `webhooks/twilio-sms` skips signature validation when `TWILIO_VALIDATE_SIGNATURE !== "1"` (default). `webhooks/sofia-call-end` skips when `RETELL_WEBHOOK_SECRET` is unset. `webhooks/gmail` makes its secret optional. `webhooks/docusign` only validates in `VERCEL_ENV === "production"`. The pattern is "if env not set, accept anyone." In dev that's a footgun; in preview deploys it's a real attack surface.

**Why it matters.** Preview deploys are reachable; attackers can spoof webhooks to insert fake data.

**Effort.** S — flip to fail-closed; require the secret to be set in every environment. Add a `dev-only` shared bypass header with rotating secret if dev ergonomics need it.
**Files.** Five webhook routes under `web/src/app/api/webhooks/` plus `api/cron/*` cron-secret check.
**Surfaced by.** security-guidance

### H-5 · Compliance acks must persist consent evidence, not just type
**Description.** `compliance_acknowledgments` stores `(workspace_id, user_id, type, version)` — but the per-state TCPA / AI-disclosure flow needs the *exact text* the user saw, an IP, a user-agent, and a timestamp tied to the rendered version. The table has `ip_address`, `user_agent`, `version` columns but `activate/route.ts:208-215` writes neither IP nor UA. The evidence trail is incomplete.

**Why it matters.** Compliance is a legal posture, not a feature. Bichi-tier producer + TCPA enforcement environment means any future TCPA defense requires the actual evidence captured at ack time.

**Effort.** S — capture `req.headers.get("x-forwarded-for")` and `user-agent` in `activate/route.ts`; freeze and version the disclosure text in a `disclosure_templates` table.
**Files.** `api/onboard/activate/route.ts`, new migration for `disclosure_templates`.
**Surfaced by.** security-guidance · code-review

---

## MEDIUM — design debt, hygiene, future-proofing

### M-1 · Collapse duplicate migration timestamp `00000000000002`  ✅ SHIPPED
**Description.** Both `00000000000002_market_intelligence_neighborhood.sql` and `00000000000002_news_intel.sql` share the timestamp. Supabase CLI alphabetizes, so `market_intelligence_neighborhood` (m < n) runs first by chance. Rename one to `00000000000002a_*` or push the news_intel migration to `0000000000000_2_5_*` to make ordering explicit.
**Effort.** XS. **Files.** Rename one of the two SQL files. **Surfaced by.** supabase

### M-2 · Centralize workspace resolution + add a `requireWorkspace()` helper
**Description.** The same 8-line "get user, look up workspace, return 401/404" boilerplate appears in 60+ routes. Extract once. Returns `{ user, workspaceId, sb }` or throws a typed `RouteError` that the wrapper converts to `NextResponse.json({ error }, { status })`.
**Effort.** S. **Files.** New `web/src/lib/route-auth.ts`; refactor 60+ routes in batches. **Surfaced by.** simplify · code-review

### M-3 · Replace `as any` in dashboard scoring with typed contracts
**Description.** `(app)/dashboard/page.tsx` has 8+ `as any` casts on Supabase rows. Once H-3 lands, swap them out. While there, extract `generateActions()` and `dealMomentumScore()` into `web/src/lib/dashboard/`.
**Effort.** S. **Files.** `app/(app)/dashboard/page.tsx`, new `lib/dashboard/*`. **Surfaced by.** simplify · code-review

### M-4 · Frontend design — wire JetBrains Mono and standardize the brand tokens
**Description.** README + brand-identity HTML reference JetBrains Mono for data; no font import exists. Tailwind v4 config lacks the family declaration. Three different teal/indigo color treatments live in code (`#3D4F8C` ALEVANT indigo, Tigris `#00C9B1`, Bichi `#0E5560`). Pick one canonical token system, expose via Tailwind theme + CSS variables, document in `docs/ALEVANT_Brand_Identity`.
**Effort.** S. **Files.** `app/layout.tsx`, Tailwind config, `lib/brand/tokens.ts` (new). **Surfaced by.** frontend-design · brand-guidelines

### M-5 · Backfill TODO/FIXME and remove dead onboarding scaffolding
**Description.** 82 TODO/FIXME instances across 35 files. Cluster: onboarding stage forms (8 in identity, 14 in brand, 7 in brokerage), contact panels (`MoveToOppButton`, `ActivityTimeline`, `PlaybookPanel` carry 3 each). Some are real follow-ups, some are old TODOs left from initial scaffolding. Sweep, file as issues or delete.
**Effort.** S. **Files.** 35 files, mostly under `app/onboard/` and `app/(app)/contacts/[id]/`. **Surfaced by.** simplify

### M-6 · Sphere Brain — real signal sources beyond anniversary
**Description.** `lib/sphere/signals.ts` plus `api/sphere/sweep` currently only generate close-anniversary signals. The Concept Brief promises: birthdays, LinkedIn job changes, permit pulls, life events from public records, equity-position shifts. The data sources are mostly already wired (grid scrapers + enrichment). Build the additional generators.
**Effort.** M. **Files.** `lib/sphere/signals.ts`, `lib/sphere/*` (new generators), `api/sphere/sweep/route.ts`. **Surfaced by.** feature-dev · code-review

### M-7 · Stripe API version pinned to 2024-12-18 — needs a refresh strategy
**Description.** `lib/stripe.ts` hardcodes `apiVersion: "2024-12-18.acacia"`. That's fine, but document the upgrade cadence and add a renewal reminder. Stripe quietly deprecates older versions.
**Effort.** XS. **Files.** `lib/stripe.ts`, CLAUDE.md. **Surfaced by.** code-review

### M-8 · Twilio incoming voice TwiML uses Polly.Joanna — but Sofia is a custom ElevenLabs voice  ✅ SHIPPED
**Description.** `api/sofia/twilio-incoming/route.ts` is the "fallback when Retell isn't bound" path. The TwiML uses `<Say voice="Polly.Joanna">` saying "Hi, this is Sofia." That voice mismatch (Polly is not Sofia) breaks the brand promise. Either route to a pre-recorded Sofia ElevenLabs MP3 or remove the fallback entirely and surface "Sofia not yet provisioned" via an admin alert.
**Effort.** XS. **Files.** `api/sofia/twilio-incoming/route.ts`. **Surfaced by.** code-review · brand-guidelines

### M-9 · Onboarding wizard prefill defaults to PRAIX-tropical colors, not ALEVANT indigo  ✅ SHIPPED
**Description.** `api/onboard/activate/route.ts:78` defaults `primary_color` to `#0E5560` (Bichi's tropical teal) when the brand step is empty. That should default to ALEVANT's `#3D4F8C` indigo (the house default for unbranded tenants), with Bichi's color only applied to the seeded Bichi workspace.
**Effort.** XS. **Files.** `api/onboard/activate/route.ts`. **Surfaced by.** brand-guidelines

---

## LOW — nice-to-have, easy wins

### L-1 · Empty top-level `brand/` and `scripts/` directories
**Description.** Committed empty dirs. Either populate (move logo SVGs from `docs/ALEVANT_Brand_Identity.html` into `brand/`) or delete with a `.gitkeep`.
**Effort.** XS. **Files.** `alevant-app/brand/`, `alevant-app/scripts/`. **Surfaced by.** simplify

### L-2 · Remove `*.tsbuildinfo` from version control
**Description.** `web/tsconfig.tsbuildinfo` is 1.8 MB and committed. `.gitignore` includes `*.tsbuildinfo` but the file was committed before that rule. Delete from git history (`git rm --cached`).
**Effort.** XS. **Files.** `web/tsconfig.tsbuildinfo`. **Surfaced by.** simplify · code-review

### L-3 · Recharts is imported but check actual usage
**Description.** `recharts: ^3.8.0` in package.json. Verify all charts use it consistently; remove if unused. The dashboard/KPI surfaces look like they may use raw SVG instead.
**Effort.** XS. **Files.** `package.json`, grep for `recharts` imports. **Surfaced by.** simplify

### L-4 · `cinematic/moments.tsx` is 47 KB in one file
**Description.** Single component file at 47 KB. Almost certainly a god-component. Split per cinematic moment for readability and code-splitting wins.
**Effort.** S. **Files.** `components/cinematic/moments.tsx`. **Surfaced by.** simplify

### L-5 · Tidy `.gitignore` and stop tracking `next-env.d.ts`
**Description.** `next-env.d.ts` is committed but Next regenerates it. Add to gitignore consistently.
**Effort.** XS. **Files.** `.gitignore`, remove `web/next-env.d.ts` from index. **Surfaced by.** simplify

---

## FUTURE AUTOMATION — make alevant-app more autonomous itself

These are the longer-horizon places where the product can do its own work without a human in the loop. Most map to one or more MCP servers that alevant-app would call at runtime.

### FA-1 · Scheduled listing enrichment + auto-microsite generation
When a listing transitions to `status='active'`, automatically: fetch ATTOM + Miami-Dade PA data, generate Vesper campaign (already wired), build microsite, queue social posts, deliver an editorial brochure to the seller within 6 hours of listing. Today this requires manual triggering. Effort: M.

### FA-2 · Automated comp generation on inbound buyer leads
When a Sofia call ends with a qualified buyer, kick off comp generation against the buyer's stated criteria (location + budget + property type). Surface to the agent as part of the post-call recap, not as a button the agent has to push. Effort: M.

### FA-3 · Auto-classification + routing of inbound leads
Today, inbox leads land in a flat list. Build a Claude-driven classifier that assigns lifecycle stage, temperature, priority, and prospect type (buyer/seller/investor/rental) at intake. Route into the right pipeline automatically. Re-use Bichi's pre-launch lead history for fine-tuning the heuristics. Effort: M.

### FA-4 · Market-event-triggered outreach drafts
Subscribe each tenant to NEWS_SCAN + GRID_DECAY signals. When a tenant's farm zone sees a rate cut, a major sale at a benchmark price, or a flurry of new listings, automatically have Vesper draft an outreach (without sending) and surface it on the dashboard with a single approve-and-send button. Effort: M.

### FA-5 · MCP server for MLS data
Build a `mcp-mls` server that proxies the agent's MLS (RETS/Spark/Bridge feeds) into a normalized Claude-callable interface. Sofia and Vesper invoke it directly during conversation/campaign generation. Run alongside or as a subroutine of the `/api/mls/request` endpoint. Effort: L. Surfaced by mcp-builder.

### FA-6 · MCP server for Florida public records
Wrap the existing Florida scrapers (`lib/scrapers/florida/*`) as an MCP server callable at conversation time. When Sofia is on a call and the caller mentions an address, Sofia can pull the property's owner, equity, distress signals, and life events live and personalize the next 30 seconds of the conversation. Effort: M. Surfaced by mcp-builder.

### FA-7 · MCP server for county property appraisers (multi-state)
Extend the FL adapter pattern to a generic county-PA MCP — a single `lookup_property(address, state)` call that dispatches to the right county adapter and returns a normalized PropertyRecord. Becomes the foundation for non-FL geographic expansion. Effort: L. Surfaced by mcp-builder.

### FA-8 · Comp engine MCP
Wrap `lib/valuation.ts` as an MCP server so the underwriter can be invoked by Claude (Sofia or Vesper) mid-conversation. "What's this property worth?" → comp pull + valuation in <5s. Effort: S. Surfaced by mcp-builder.

### FA-9 · Closed-loop hazard model training on outcomes
Today the v1.5 heuristic Grid feeds `grid_outcomes`. When 6 months of outcomes accumulate, the Python hazard model auto-trains on a cron, runs fairness audit, and promotes the model registry entry from `challenger` → `champion` if all gates pass. Build the orchestration loop now so it triggers when the data arrives. Effort: M.

### FA-10 · Auto-detect TCPA opt-out from any inbound message (cross-channel)
TCPA opt-out today only triggers from SMS with literal "STOP". Expand to inbound emails, Sofia voice calls (transcript scan), and IG/FB DMs. Update `consent_records` automatically and propagate to every channel. Effort: S.

### FA-11 · Brokerage-admin auto-reporting
Daily compute KPI snapshots per agent (already a table — `brokerage_kpi_snapshots`); compose a daily standup email for the broker-owner summarizing GCI pipeline, at-risk transactions, top performers. Effort: S.

### FA-12 · Self-healing scraper monitoring
Florida county adapters fail silently. Wrap each in a circuit-breaker that publishes scraper-health metrics, falls back to last-known-good cache, and notifies on degradation. Critical once volume scales. Effort: M.

---

## Quick-win batch (parallel-safe)

These are independent and can be picked off in any order — first foundation sprint:

- **C-1** (onboarding column)
- **C-4** (sphere sweep auth + FK fix)
- **C-5** (vw_prospects band fix)
- **M-1** (dedup migration timestamp)
- **M-8** (Sofia voice mismatch)
- **M-9** (onboarding default color)
- **L-2** (tsbuildinfo)
- **L-5** (next-env.d.ts)

Total estimate ~3-4 hours.

## Sequenced sprint

After the quick-win batch:

1. **H-3** (Supabase types) — unlocks correctness on everything else.
2. **C-2 + C-3** (RLS hygiene) — the big one. Tackle while types are fresh.
3. **H-1** (membership-aware workspace lookup) — falls out naturally once you're touching every route.
4. **M-2** (`requireWorkspace` helper) — extract during the C-3 refactor, don't duplicate the work.
5. **H-2** (CI) — lock in the work above with pre-merge gates.

Estimate: 1 focused week.

