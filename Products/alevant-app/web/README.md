# ALEVANT — Web

Next.js 16 + Supabase + Anthropic Claude. Multi-tenant SaaS for residential and small-commercial real estate.

## Stack

- **Framework:** Next.js 16, React 19, Tailwind v4, TypeScript strict
- **Auth + DB:** Supabase (Postgres + RLS + Auth + Storage + Realtime)
- **AI:** Anthropic Claude — Haiku 4.5 (fast), Sonnet 4.6 (synth), **Opus 4.7 (Vesper creative)**
- **Voice:** Retell + Twilio + ElevenLabs + Whisper
- **Avatar:** HeyGen
- **Data:** ATTOM (V2), AirDNA (V1 dashboard, V2 API), public records scraping V1, MLS adapter V2
- **Social:** Meta Graph (IG/FB), X API, TikTok Business, LinkedIn, YouTube

## Setup

```bash
# 1. Install
pnpm install     # or npm/yarn

# 2. Copy env
cp .env.example .env.local
# fill in keys

# 3. Apply schema
supabase db push     # or run supabase/migrations/00000000000000_initial_schema.sql against your Supabase

# 4. Seed Bichi tenant
pnpm seed:bichi

# 5. Dev
pnpm dev
```

## Tenant routing

- `alevant.ai` — marketing site
- `app.alevant.ai` — agent app
- `{slug}.alevant.ai` — tenant-branded portal (e.g. `bichi.alevant.ai`)
- `bichi.miami` — custom domain pointing at Bichi's tenant

Middleware (`src/middleware.ts`) sets `x-alevant-tenant` header for downstream routing.

## Key surfaces

| Path | Purpose |
|---|---|
| `/` | Marketing landing page |
| `/login` · `/signup` | Supabase auth |
| `/onboard/*` | 9-stage agent onboarding wizard |
| `/dashboard` | Daily AI standup home |
| `/inbox` | Lead Inbox (multi-source) |
| `/listings` · `/listings/new` · `/listings/[id]` | Listings module |
| `/pipelines/[buyer\|seller\|investor\|rental]` | 4 distinct pipelines |
| `/grid` | The Grid — predictive seller leads |
| `/underwriter` | CMA + investor MF + STR |
| `/sofia` | Voice ISA control room |
| `/vesper` | Marketing director studio |
| `/sphere` | Sphere Brain — today's right calls |
| `/transactions` | Transaction Brain |
| `/m/[tenant]/[slug]` | Listing microsite (public, dynamically themed) |

## Module checklist

- [x] Next.js scaffold + Tailwind v4 + ALEVANT design tokens
- [x] Supabase schema with RLS + workspace_id multi-tenancy
- [x] Auth (email/password)
- [x] 9-stage onboarding wizard
- [x] App shell with sidebar nav
- [x] Lead Inbox + detail
- [x] Listings (list, new, detail)
- [x] 4 Pipelines (buyer, seller, investor, rental) — kanban
- [x] **The Grid** — predictive seller engine + scoring + outreach generation
- [x] Underwriter (CMA + investor MF + STR)
- [x] Sofia (config, recent conversations, voice webhook)
- [x] Vesper (studio, approval queue, full campaign generation)
- [x] Sphere Brain (right-call surface)
- [x] Transactions (deal list)
- [x] Microsite (dynamic per-tenant themed)
- [x] API routes — onboard, listings, underwriter (CMA + investor), sofia (text + voice), vesper (campaign + lint), grid (score + outreach), sphere (sweep), dashboard (standup), crons
- [x] Bichi seed script
- [x] **Florida public-records scrapers** — Miami-Dade Property Appraiser API live; clerk-of-court / tax collector / code enforcement scaffolded with documented endpoints
- [x] **Vesper PDF brochure renderer** — magazine-tier 10-page editorial layout via `@react-pdf/renderer`; Cormorant + Jost registered; per-tenant brand-kit theming
- [x] **Twilio + Retell provisioning** — `/api/sofia/provision` wires Twilio number purchase → Retell agent creation → number-to-agent binding; auto-fires from `/api/onboard/activate` when creds present; SMS handler with TCPA opt-out enforcement
- [x] OAuth providers (Gmail, Meta, X, TikTok, LinkedIn) — full router + initiate + callback wired
- [x] HeyGen avatar — `lib/heygen.ts` + `/api/vesper/avatar-video` for film-script → vertical avatar video
- [x] Florida county scaffolds — Broward + Palm Beach adapter signatures wired into orchestrator
- [x] Stripe billing — checkout + portal + webhook + plans table + per-workspace billing UI
- [x] Brokerage admin dashboard — cross-agent KPI snapshots + member management routes
- [x] Marketing site — pricing / demo / press / waitlist routes + capture endpoints
- [x] Playwright orchestrator pattern — Miami-Dade Clerk recipe + rate-limit helper
- [x] Mobile app spec — `mobile/README.md` with PRAIX-fork instructions and native-bridge contract

## Architecture

See `../docs/ALEVANT_Technical_Architecture.md` for the full architectural reference.
See `../docs/ALEVANT_Concept_Brief.md` for the strategic foundation.
See `../docs/ALEVANT_Onboarding_Spec.md` for the onboarding wizard contract.

## Compliance perimeters

- **TCPA strict** — no AI-initiated outbound without verified consent (`src/lib/tcpa.ts`)
- **Fair Housing strict** — Vesper output linted, blocks not bypassable (`src/lib/fair-housing.ts`)
- **NAR settlement** — buyer pipeline gates showings on signed BBA
- **AI disclosure** — Sofia identifies as AI on every conversation (configurable per-state)
- **Data ownership** — agent owns workspace data; export-anytime; 90-day retention on termination

## Phase status

- ✅ **Phase 0** — Concept brief, brand identity, technical architecture, How-It-Works
- ✅ **Phase 1** — Repo scaffold + onboarding wizard + auth + dashboard
- ✅ **Phase 2** — Lead Inbox, Listings, 4 Pipelines, Underwriter, Sofia text, Vesper studio, Microsite, The Grid
- ✅ **Phase 3** — Florida public-records scrapers (Miami-Dade Property Appraiser API live), Vesper PDF brochure renderer, Twilio + Retell provisioning, Grid scan UI, Grid scan cron, AirDNA fixtures + API path
- ✅ **Phase 4** — DocuSign integration (JWT auth + Connect webhooks), Transaction Brain orchestrator (timeline generator + nudge engine + risk flagging), social publishers (Meta/X/TikTok/LinkedIn), Vesper approve→publish flow, full OAuth router (Google / Meta / X / LinkedIn / TikTok), Sphere external-signal stubs, Broward + Palm Beach county scaffolds
- ✅ **Phase 5** — Stripe billing (checkout + portal + webhook + plans table + per-workspace billing UI), brokerage admin dashboard with cross-agent KPI snapshots, marketing site (pricing / demo / press / waitlist), HeyGen avatar integration for film-script videos, Playwright orchestrator (Miami-Dade Clerk recipe + rate limiter), mobile RN scaffold spec with PRAIX-fork instructions
