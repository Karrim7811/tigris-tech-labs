# CLAUDE.md — alevant-app

This is the project brief that every future Claude Code session reads first. It captures what alevant-app actually is, the state of the codebase today, and the operating contract between Karim and Claude.

---

## 1. Context & Intent

Karim Naqvi is SVP at Aon in Miami (commercial real estate and construction insurance) by day and founder of Tigris Tech Labs by night. He holds a Florida Real Estate License and has spent his career across commercial real estate brokerage (ONE Sotheby's, KW Commercial) and insurance brokerage (Aon, USI, Morgan Whitney). alevant-app is a Tigris Tech Labs product targeting the residential / small-commercial real estate market — the sister product to **PRAIX**, which targets commercial insurance.

Karim is technical, direct, and expects pushback when warranted. Lead with answers. No preamble. No applause. If something is wrong, say so and propose the fix.

---

## 2. What alevant-app actually is (inferred from the codebase)

ALEVANT — the "AI Operating System for Real Estate." A multi-tenant SaaS where each agent (or brokerage) gets a workspace and runs four AI surfaces:

1. **Sofia** — Voice ISA. Twilio number + Retell orchestration + ElevenLabs voice + Claude LLM brain. Handles inbound calls / SMS, qualifies leads, hands off to the human agent during work hours, covers overflow + off-hours. Strict TCPA posture (consent gating in `src/lib/tcpa.ts`).
2. **Vesper** — AI Marketing Director. Generates per-listing campaigns (cinematic film script, microsite, IG/FB/X/LinkedIn/TikTok posts, editorial brochure, press pitches) with a Fair-Housing linter in front of every asset. Approve-then-publish. Brand-kit themed per tenant. PDF brochures via `@react-pdf/renderer`.
3. **The Grid** — Predictive seller-lead engine. The residential analog to PRAIX's RiskGrid. Composite "motivation score 0-100" computed from public-records signals fused per address: Florida property appraiser (Miami-Dade live; Broward / Palm Beach / Monroe scaffolded), clerk-of-court (foreclosure / probate / divorce), tax-collector delinquency, code enforcement, permits, Sunbiz LLC filings, voter-roll diff, USPS NCOA mail-forward, SSA Death Master File, AirDNA STR, Google StreetView visual diff. v1.5 heuristic engine is live (`src/lib/grid-engine.ts`, `grid-decay.ts`); a Python hazard model (`ml/hazard_model/`) sits as a planned v2 replacement with fairness audit gates.
4. **Sphere Brain + Transaction Brain** — Sphere surfaces "today's right calls" against existing relationships (close-anniversaries, life events, equity-position triggers). Transaction Brain builds a milestone timeline for each closing (35-day FL residential default), schedules nudges, detects risk flags (lender silence, appraisal gap, missing DocuSign, HOA delay).

Plus: 9-stage onboarding wizard, multi-source Lead Inbox, Listings module with public per-tenant Microsite, 4 distinct pipelines (buyer / seller / investor / rental), Underwriter (CMA + investor MF + STR), Stripe billing (4 plans), brokerage admin, marketing site, knowledge base per persona, playbook engine, opportunities + activities timeline. Cinematic landing, "How It Works" interactive page.

**Pilot tenant:** Thomas Bichi — Keller Williams Capital Realty, Coral Gables. Lives at `bichi.alevant.ai` (subdomain via wildcard DNS). His Bichi brand kit uses Tropical Teal `#0E5560` / Brass `#B5853E` (overrides ALEVANT's house indigo).

---

## 3. Brand

ALEVANT is part of the Tigris Tech Labs family but **does not use the family Neural Teal `#00C9B1`**. It has its own identity (see `docs/ALEVANT_Brand_Identity.html` and `web/scripts/seed-bichi.ts`):

| Token | Value |
|---|---|
| Display font | Cormorant Garamond (italic 300 for wordmark) |
| UI / body font | Jost |
| Data / mono | JetBrains Mono (not yet wired in code — see Open Q) |
| Primary | Indigo `#3D4F8C` |
| Accent | Brass `#B5853E` |
| Surface | Parchment `#FAFAF8` |
| Ink | `#1A1915` |
| Wordmark | `alevant` lowercase, brass dot accent on the "a" |

Per-tenant brand kits override these in the `brand_kits` table.

---

## 4. Tech stack — as it exists today

| Layer | Choice |
|---|---|
| Framework | Next.js **16.1.6** (App Router, React Server Components, server actions enabled with 8MB body limit) |
| Runtime | React **19.2.3** |
| Language | TypeScript strict, `noEmit`, target ES2022 |
| Styling | Tailwind v4 (PostCSS plugin), `@tailwindcss/postcss` |
| Auth + DB | Supabase Postgres + Auth + Storage + Realtime via `@supabase/ssr` 0.5.2 and `@supabase/supabase-js` 2.47.10 |
| Multi-tenant | `workspace_id` foreign key on every business table + RLS policies + subdomain routing via middleware |
| AI | Anthropic SDK `0.32.1` — Haiku 4.5 (`fast`), Sonnet 4.6 (`synth`), Opus 4.7 (`creative` for Vesper) via `src/lib/anthropic.ts`. Optional Azure Foundry routing for enterprise tenants. Ephemeral cache on system prompts. |
| Voice ISA | Twilio (`twilio` 5.4.0) + Retell + ElevenLabs + OpenAI Whisper |
| Avatar | HeyGen |
| Web intelligence | Perplexity AI |
| People enrichment | Apollo person-match, Proxycurl LinkedIn, Jina reader, Perplexity research synthesis |
| Property data | Miami-Dade PA proxy (live), Broward / Palm Beach / Monroe (scaffolded), ATTOM (planned), AirDNA (fixtures + live API path) |
| e-Sign | DocuSign JWT grant + Connect HMAC webhook, Dotloop as peer |
| Email | Gmail API (delegation) — webhook ingest + auto-log |
| Social publishers | Meta Graph (IG/FB), X v2, TikTok Business, LinkedIn |
| Payments | Stripe `17.5.0` — checkout, billing portal, webhook (subscription lifecycle) |
| PDF | `@react-pdf/renderer` for Vesper brochures |
| Crawler | Playwright `1.49.1` (server-side orchestrator) |
| Hosting | Vercel (cron schedules in `vercel.json`, per-route `maxDuration` overrides) |
| Mobile | React Native / Expo SDK 55 — `mobile/README.md` is a fork-from-PRAIX spec, no code yet |
| ML | Python hazard model in `ml/hazard_model/` (uv + pytest, synthetic-data path works, real-data path waits on outcomes accumulation) |

---

## 5. Repository layout

```
alevant-app/
├── README.md                        — top-level product brief
├── BOOTSTRAP.md                     — 6-8h runbook from "code committed" to "live at alevant.ai"
├── deploy.sh
├── docs/                            — 14 strategic + technical docs
│   ├── ALEVANT_Concept_Brief.md
│   ├── ALEVANT_Technical_Architecture.md   (56 KB — authoritative reference)
│   ├── ALEVANT_Onboarding_Spec.md          (9-stage wizard contract)
│   ├── ALEVANT_Bichi_Kickoff.md            (14-day pilot runbook)
│   ├── ALEVANT_Build_Manifest.md
│   ├── ALEVANT_Launch_Plan.md
│   ├── ALEVANT_Grid_Hazard_Model_Spec.md
│   ├── ALEVANT_Grid_Q3_Sprint.md
│   ├── ALEVANT_Multimodal_Signals_Spec.md
│   ├── ALEVANT_Release_Notes_2026-05-16.md
│   ├── TIGRIS_Modeling_Platform_Spec.md
│   ├── ALEVANT_How_It_Works.html
│   └── ALEVANT_Brand_Identity.html
├── brand/                           — empty (TODO: populate logo SVGs)
├── scripts/                         — empty
├── ml/                              — Python hazard model package
├── mobile/                          — README-only spec (no RN code yet)
├── Thomas/                          — Bichi headshots (assets, not code)
└── web/                             — Next.js app (primary product)
    ├── src/
    │   ├── middleware.ts            — auth refresh + tenant header
    │   ├── app/
    │   │   ├── (app)/               — authenticated app shell (~22 page surfaces)
    │   │   ├── (auth)/              — login, signup, reset-password
    │   │   ├── (marketing)/         — pricing, demo, press, waitlist
    │   │   ├── api/                 — 78 route.ts endpoints
    │   │   ├── onboard/             — 9-stage wizard
    │   │   ├── m/[tenant]/[slug]    — public listing microsite
    │   │   ├── cinematic/           — landing cinematic
    │   │   └── how-it-works/
    │   ├── lib/                     — 70+ helper modules (anthropic, supabase, scrapers, oauth, etc.)
    │   ├── components/              — alevant/, cinematic/, listings/, standard/, ui/
    │   └── hooks/
    ├── supabase/migrations/         — 8 SQL files (initial + 7 incremental)
    ├── scripts/                     — seed-bichi, attach-user-to-bichi, karim-setup, create-test-user
    └── package.json
```

---

## 6. Main features and current state

| Surface | State | Notes |
|---|---|---|
| Marketing landing + cinematic | working | `/`, `/cinematic`, `/how-it-works` |
| Auth (email/password + reset) | working | Supabase Auth via `@supabase/ssr` |
| 9-stage onboarding wizard | **partially broken** | UI complete; the gate `workspace_memberships.onboarded_at` is read in `dashboard/page.tsx:230` and written in `api/onboard/activate/route.ts:222` but the column is missing from `supabase/migrations/00000000000000_initial_schema.sql` — every activate is a silent no-op, every dashboard load redirects back to `/onboard`. See Critical-1 in REFACTOR-ROADMAP.md. |
| Dashboard (standup) | working with caveat | Reads via service role (bypasses RLS); requires the onboarding gate fix to be reachable. |
| Lead Inbox + detail | working | `inbox/page.tsx`, `inbox/[id]/page.tsx`; recent commit replaced mock data with real DB queries. |
| Listings (list / new / [id] / microsite) | working | Public microsite at `m/[tenant]/[slug]`. |
| 4 Pipelines (buyer / seller / investor / rental) | working | Kanban via `pipelines/[kind]`. |
| Contacts + Prospects + Opportunities | working | Cross-source unified view `vw_prospects` (migration 6 overwrites the broken migration-4 version). |
| The Grid (scan + outreach + outcomes + lift + decay) | working (heuristic v1.5) | Hazard model v2 in `ml/` — synthetic-data path only. |
| Underwriter (CMA + investor MF + STR) | working | `lib/valuation.ts` is 15 KB of comp logic. |
| Sofia (provision + text + voice webhook + Twilio SMS) | working | `api/sofia/provision` purchases Twilio number + creates Retell agent. SMS auto-log with TCPA opt-out. |
| Vesper (campaign / brochure / lint / approve / publish / avatar-video) | working | Approve-then-publish gating + Fair-Housing linter (`lib/fair-housing.ts`). |
| Sphere Brain | partially broken | `api/sphere/sweep` has **no auth gate** and uses `tx.buyer_id` (FK to `buyers`, not `contacts`) as `contact_id` for `sphere_signals` inserts. Will FK-violate. |
| Transactions (DocuSign + Dotloop + risk + timeline + nudges) | working | DocuSign JWT auth + Connect HMAC verification implemented. |
| Stripe billing (checkout + portal + webhook + plans) | working | 4 plans seeded in migration 1. |
| Knowledge base per persona | working | `kb/collections`, `kb/entries`, `kb/files`. |
| Playbooks (engine + scheduler cron) | working | `lib/playbook-engine.ts`, triggered on contact temperature/lifecycle transitions. |
| Brokerage admin | working | `(app)/admin/{members,branding,compliance,reporting}`. |
| Marketing capture (pricing / demo / waitlist / press) | working | All capture endpoints write to `marketing_waitlist`, `demo_requests`, `press_inquiries`. |
| Crons (9 schedules) | working but unguarded in dev | `CRON_SECRET` checked only when `VERCEL_ENV=production`; non-prod is open. |
| Mobile (RN/Expo) | spec only | `mobile/README.md` — fork-from-PRAIX instructions, no code. |
| ML hazard model | synthetic only | `ml/hazard_model/` — pipeline runs end-to-end on synthetic data; awaits real outcomes (~6 mo). |

---

## 7. Data model (current schema)

8 migrations under `web/supabase/migrations/`:

| # | File | Purpose |
|---|---|---|
| 0 | `00000000000000_initial_schema.sql` | Core: brokerages, brand_kits, sofia_configs, vesper_configs, workspaces, workspace_memberships, workspace_integrations, agents, contacts, sphere_signals, listings, buyers, rentals, investor_deals, grid_signals, grid_farm_zones, grid_outreach_campaigns, preconstruction_*, activity_log, sofia_conversations, vesper_assets, vesper_campaigns, transactions, transaction_milestones, underwriter_runs, compliance + consent + ai_disclosures + fair_housing_lint_log, brand_assets, api_usage, pipeline_snapshots. RLS via `alevant_user_workspace_ids()` SECURITY DEFINER. |
| 1 | `00000000000001_billing_and_admin.sql` | plans (seeded with pilot/agent/team/brokerage), billing_customers, usage_events, marketing_waitlist, demo_requests, press_inquiries, brokerage_kpi_snapshots. |
| 2a | `00000000000002_market_intelligence_neighborhood.sql` | Adds `property_neighborhood` to grid_signals. **Duplicate timestamp with 2b — fragile ordering.** |
| 2b | `00000000000002_news_intel.sql` | news_alerts + news_topics. |
| 3 | `00000000000003_grid_v1_5.sql` | Grid v1.5: TTL + MLS cross-ref + 8 raw-cache Florida tables (court, tax, code, permits, sunbiz, voter, visual_diffs, ncoa, dmf) + grid_outcomes + grid_model_registry + grid_audit_events + `fairness_test_attributes` (segregated for ML fairness audit) + `vw_grid_actionable` view. |
| 4 | `00000000000004_contacts_prospects.sql` | Adds `lifecycle_stage`, `tags`, `prospect_source` to contacts; links grid_signals to contacts; **defines `vw_prospects` referencing nonexistent `g.band` — migration will error on first deploy unless 6 runs to replace the view.** |
| 5 | `00000000000005_contact_enrichment.sql` | contact_enrichment cache (Apollo + Proxycurl + Perplexity raw + Claude synth brief). |
| 6 | `00000000000006_opportunities_activities.sql` | contacts: temperature + priority + last_activity_at; opportunities + opportunity_stage_history + contact_activities + playbooks + playbook_runs + workspace_comms_settings. **Replaces `vw_prospects` correctly here, masking the migration-4 bug if migrations run in order.** |

RLS pattern: helper `alevant_user_workspace_ids()` returns workspaces the auth user is a member of; every business table has paired `members_read_*` and `members_write_*` policies scoped on `workspace_id`. **However, almost all server code calls `getSupabaseService()` (service-role client) which bypasses RLS entirely.** RLS exists, but it provides no defense-in-depth because the app never exercises it.

---

## 8. Integrations (live in code)

Anthropic, Azure Foundry (optional), Supabase, Twilio, Retell, ElevenLabs, OpenAI (Whisper), Perplexity, HeyGen, AirDNA, ATTOM (env-wired, code path uses scrapers as V1), Apollo, Proxycurl, Jina, Stripe, DocuSign, Dotloop, Google (Gmail + Calendar + YouTube OAuth), Meta Graph (IG + FB), X v2, LinkedIn, TikTok Business, Miami-Dade PA, Broward / Palm Beach / Monroe county adapters, Sunbiz, Florida tax collectors, code enforcement, building permits, voter roll, Google StreetView (visual diff), USPS NCOA, SSA Death Master File, Playwright (server-side scraping orchestrator).

Webhooks accepting external callbacks (signature-verified): Stripe, DocuSign Connect, MLS, Dotloop, Twilio SMS, Gmail (Pub/Sub or shared-secret), Sofia call-end (Retell), Sofia voice (Retell media stream binding).

---

## 9. Migration state / lifecycle stage

**Active development.** Greenfield code (initial commit `50bb75e` "Add ALEVANT — AI Operating System for Real Estate"), ~5 weeks of dense work, currently on commit `105eb21`. The product is feature-complete per the README phase chart (Phases 0–5 ✅) but has not been deployed to production and has not seen Bichi onboarded yet. The "what's left" is reconciliation work — the onboarding gate bug, RLS hygiene, schema fix-ups, and DNS/account provisioning per BOOTSTRAP.md.

Local working tree at the monorepo root has 60+ unstaged files unrelated to alevant-app (Aon condo briefing, PRAIX backups, Ai Workshop). Branch is 1 commit ahead of `origin/master`.

---

## 10. Known issues (from code + TODO/FIXME scan)

These are surfaced in detail in **REFACTOR-ROADMAP.md** but live here as a checklist:

1. **Onboarding gate broken** — `workspace_memberships.onboarded_at` column missing from schema; activate is a no-op; dashboard loops. (Critical)
2. **Service-role-everywhere** — RLS provides no defense-in-depth because every server route uses the service client to query tenant-scoped tables. (Critical)
3. **Workspace lookups assume owner == user** — team members (members but not owners) get HTTP 404. The schema supports memberships but the helpers ignore them. (High)
4. **Cross-tenant data leak risk in `/api/contacts/[id]`** — secondary queries (`grid_signals`, `sphere_signals`, `buyers`, `listings`) don't filter by `workspace_id`. (Critical)
5. **`/api/sphere/sweep` has zero auth** — anyone can POST; also writes `tx.buyer_id` into `sphere_signals.contact_id` (FK violation). (Critical)
6. **Migration 4 `vw_prospects` references nonexistent `g.band`** — deploy will fail unless 6 runs in sequence to replace. (High)
7. **Duplicate migration timestamp `00000000000002`** — two files share the same prefix; Supabase CLI orders alphabetically but this is fragile. (Medium)
8. **`getSupabaseServer()` doesn't refresh cookies** — `setAll` is a no-op outside middleware; session refresh only happens on requests that pass through middleware (most paths do, but server-action edge cases exist). (Medium)
9. **Cron auth bypass in non-prod** — `CRON_SECRET` is only checked when `VERCEL_ENV === "production"`. Preview deploys are open. (Medium)
10. **TODO/FIXME spread** — 82 instances across 35 files; significant cluster in onboarding stage forms and contact panels. (Medium)
11. **JetBrains Mono declared but not wired** — README references it; no font import in code. (Low)
12. **Empty `brand/` and `scripts/` (top-level) directories** committed. (Low)
13. **Hardcoded Bichi tenant assumption in places** — seed script + a few branding strings. Will need cleanup before second tenant. (Medium)

---

## 11. Working principles for Claude

Every session, in order:

1. **Read CLAUDE.md first.** This file is the canonical context. If something in this file contradicts the codebase, the codebase wins — but flag the discrepancy.
2. **Push back when warranted.** If Karim's proposed approach is wrong, say so directly. Skip the praise. Lead with the disagreement and the alternative.
3. **Commit incrementally.** Use the `/commit` (commit-commands) plugin or a normal `git commit -m`. Each logical change is its own commit. Don't let uncommitted work accumulate past ~30 minutes of active editing.
4. **Match the existing patterns.** Service-role client + manual workspace scoping is the current pattern even though it's wrong; if you're refactoring it, refactor systematically and update CLAUDE.md. Don't introduce a third pattern.
5. **Respect the compliance perimeter.** TCPA, Fair Housing, NAR buyer-broker, AI disclosure are not optional features — they are non-bypassable. Don't add a flag to skip them.
6. **Never write to production directly without confirming.** Anything that touches live Supabase data, live Stripe, or sends real outbound (Sofia call, Vesper publish, DocuSign envelope) requires explicit confirmation.

---

## 12. Autonomy guidelines

### Decisions Claude makes without asking
- File naming, directory layout within an existing module.
- Refactor patterns that match the existing style.
- Dependencies inside the existing stack (Next/React/Tailwind ecosystem, Supabase ecosystem, Anthropic SDK, libraries already imported elsewhere).
- Code formatting, lint fixes, type tightening.
- Commit messages (use conventional commit prefixes; the repo already uses `feat(scope):`, `fix(scope):`, `chore:`).
- Adding tests, adding logging, adding error handling, splitting large files, deleting dead code.
- Updating documentation (README, CLAUDE.md, in-repo docs) to reflect what was changed.
- Adding/removing TODO/FIXME comments.
- Anything reversible by `git checkout` or `git revert` in <1 minute.

### Decisions that require asking first
- Data-model changes that affect existing rows in production (column drops, type changes, destructive `update` queries).
- Anything touching client PII, transaction data, or financial info in a production database.
- Creating a new external paid integration (new SaaS subscription, new vendor API).
- Changing the compliance posture (loosening TCPA, Fair Housing, AI disclosure).
- Force-pushing, history rewrites, branch deletions.
- Deploying to production (Vercel `--prod`, `supabase db push` against a live project).
- Anything that sends real outbound on behalf of the tenant — call, SMS, email, DocuSign envelope, social publish.
- Cancelling a Stripe subscription, refunding, modifying plans.

### Communication style
- Direct. No preamble. Lead with the answer or the finding.
- Push back when something is wrong.
- One-line status updates are fine; multi-paragraph "what I'm about to do" preambles are not.
- Code blocks for code, file_path:line_number for references.
- If you don't know, say so. If you guessed (and were 60%+ sure), say so and which way you guessed.

### Build pattern
- Small commits, working state preserved between them.
- Run `pnpm typecheck` (or `npm run typecheck`) before committing whenever you touched TypeScript.
- Run `pnpm lint` before committing whenever you touched code.
- Don't leave uncommitted work for more than ~30 minutes of active editing.
- If you need to leave a half-finished change, commit it as a WIP and call it out in the commit message.

### Default disposition
Act. Ask only when the uncertainty is high AND the decision is hard to reverse. Cost of pausing to confirm is low for irreversible decisions, but cost of pausing on every edit destroys momentum. Default to acting and surfacing the decision in the commit message or a brief end-of-turn note.

---

## 13. Open questions (resolve at the end, not mid-session)

These accumulated during the audit. Answer them in batch — none of them block progress; each has a most-likely interpretation assumed in the meantime.

1. **`workspace_memberships.onboarded_at` — add the column or change the gate?** The code reads/writes it; the schema doesn't have it. Most-likely interpretation: a migration was forgotten. Add a new migration `00000000000007_workspace_membership_onboarded.sql` that adds `onboarded_at timestamptz`. (Alternative: move the gate to `workspaces.activated_at`, which already exists.)
2. **Service-role-everywhere vs. real RLS — is the team-member account model real, or pilot-tenant-only?** If alevant is owner-only forever, the workspace lookups can stay as-is. If the Team / Brokerage plans need real shared workspaces, every `getSupabaseService()` in an authenticated route needs to become `getSupabaseServer()` and let RLS do its job. The current code can't support `Team` plan correctly.
3. **Brand palette — keep ALEVANT's Indigo `#3D4F8C` / Brass `#B5853E` (per README) or extend the Tigris Tech Labs family Neural Teal `#00C9B1`?** The README says Indigo. The Tigris family default is teal. Bichi's tenant overrides to Tropical Teal `#0E5560`. Three different teal/indigo/teal interpretations live in the repo. Pick one canonical.
4. **JetBrains Mono — is the data-mono font supposed to be wired in?** README mentions it; no font import exists. Either wire it as the mono token across data tables / KPIs, or strike it from the brand doc.
5. **Where does the brand asset library live?** `alevant-app/brand/` is empty in git. Are logos under git LFS elsewhere, or do we still need to bring them in from the brand-identity HTML?
6. **Live `.env.local`** — `web/.env.local` is checked-out (not in git) and contains the real anon + service-role + Anthropic keys. Confirm this Supabase project (`xipmovjuppwjjutcwhym`) is the dev/staging project, not production. If it's prod, rotate the service-role key after the audit since it's been seen by the audit tooling.
7. **Mobile app timing** — `mobile/` is a README-only spec. Is the RN/Expo build slated for the Bichi pilot, or post-pilot once the web product proves out?
8. **ML hazard model promotion path** — `ml/hazard_model/` runs on synthetic data. Confirm the "wait 6 months for real outcomes" plan vs. cold-starting on PRAIX-comparable transferred data.
9. **Tenant for Karim himself** — `scripts/karim-setup.ts` and `scripts/seed-karim-workspace.ts` exist. Are these dev-only utilities, or is Karim's personal tenant also a real launch tenant?
10. **MLS data source** — README claims "MLS adapter V2"; code has a `/api/mls/request` endpoint and an `MLS_WEBHOOK_SECRET` envelope but no actual MLS partner contract referenced. Confirm whether MLS access has been negotiated or this is aspirational.
11. **County scrapers — legal posture?** The Florida county adapters hit public records APIs and identify as `ALEVANT/1.0 (real-estate-research; +https://alevant.ai/contact)`. Confirm these endpoints are explicitly permitted public APIs (not ToS-breaching scraping) for the Bichi pilot — Miami-Dade is documented; Broward / Palm Beach / Monroe are scaffolded with documented endpoints but the legal posture should be confirmed before scale.
12. **Fairness audit data path** — `fairness_test_attributes` is documented as "service-role only via direct connection in the ML environment." Is there a separate Supabase project for fairness data, or does the production project house both? The spec says separate; the code doesn't enforce it.

