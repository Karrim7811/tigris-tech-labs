# ALEVANT — Build Manifest

**Comprehensive ops handoff. Every file, every API, every cron, every env var, every dependency.**

---

## File inventory

### Documentation (`docs/`)
| File | Purpose |
|---|---|
| `ALEVANT_Concept_Brief.md` | Strategic foundation, wedge, two-persona architecture, phase plan |
| `ALEVANT_Technical_Architecture.md` | Full system architecture, data model, API surface, compliance perimeters |
| `ALEVANT_Onboarding_Spec.md` | 9-stage onboarding wizard contract |
| `ALEVANT_Brand_Identity.html` | Brand identity board (visual) |
| `ALEVANT_How_It_Works.html` | Clickable shareable preview |
| `ALEVANT_Bichi_Kickoff.md` | 14-day pilot runbook |
| `ALEVANT_Launch_Plan.md` | Press strategy + launch sequence |
| `ALEVANT_Build_Manifest.md` | This file |

### Mobile (`mobile/`)
| File | Purpose |
|---|---|
| `README.md` | RN/Expo SDK 55 fork-from-PRAIX spec, native bridge, deep links |

### Web app config (`web/`)
| File | Purpose |
|---|---|
| `package.json` | Next 16.1.6, React 19.2.3, Tailwind v4, Anthropic, Supabase, Stripe, Twilio, Retell, @react-pdf, Playwright |
| `tsconfig.json` | TS strict, path alias `@/*` |
| `next.config.ts` | Image remote patterns, server actions size limit |
| `tailwind.config.ts`* / `postcss.config.mjs` | Tailwind v4 PostCSS pipeline |
| `.env.example` | All env vars (~30) documented |
| `.gitignore` | Standard Next + Vercel |
| `vercel.json` | Per-route function durations + 5 cron schedules |
| `middleware.ts` | Tenant routing + Supabase session refresh |

### Database (`web/supabase/migrations/`)
| File | Tables |
|---|---|
| `00000000000000_initial_schema.sql` | brokerages · brand_kits · sofia_configs · vesper_configs · workspaces · workspace_memberships · workspace_integrations · agents · contacts · sphere_signals · listings · buyers · rentals · investor_deals · grid_signals · grid_farm_zones · grid_outreach_campaigns · preconstruction_towers · preconstruction_watchlist · activity_log · sofia_conversations · vesper_assets · vesper_campaigns · transactions · transaction_milestones · underwriter_runs · compliance_acknowledgments · consent_records · ai_disclosures_logged · fair_housing_lint_log · brand_assets · api_usage · pipeline_snapshots — all with RLS via `workspace_id` |
| `00000000000001_billing_and_admin.sql` | plans · billing_customers · usage_events · marketing_waitlist · demo_requests · press_inquiries · brokerage_kpi_snapshots |

### Lib (`web/src/lib/`)
| Module | Purpose |
|---|---|
| `anthropic.ts` | Claude client + Foundry path, Haiku/Sonnet/Opus router, `runClaude` / `runClaudeJSON` |
| `supabase/{server,client,middleware}.ts` | Server, browser, middleware Supabase clients |
| `tenant.ts` | Tenant resolution from request headers |
| `types.ts` | Shared TypeScript types |
| `utils.ts` | `cn`, currency, slugify, relative time, score band |
| `fair-housing.ts` | Strict linter (10 protected-class patterns + suggestions) |
| `tcpa.ts` | Consent gating, quiet hours, opt-out detection |
| `prompts/sofia.ts` | Sofia system prompt + qualification scoring rubric |
| `prompts/vesper.ts` | Vesper system prompt + 4 voice presets + 12-asset campaign user prompt |
| `prompts/underwriter.ts` | CMA + investor MF prompts |
| `prompts/grid.ts` | Grid reasoning + outreach generation prompts |
| `grid-engine.ts` | 5-component motivation scoring (tenure, equity, distress, life event, market) |
| `transaction-brain.ts` | 13-milestone FL residential template + risk detection + nudge scheduler |
| `docusign.ts` | JWT grant + envelope CRUD + Connect HMAC verification |
| `stripe.ts` | Checkout / Portal / webhook verification |
| `twilio.ts` | Number search / purchase / webhook config |
| `retell.ts` | Agent creation + number binding + outbound call |
| `heygen.ts` | Avatar video generation + status polling |
| `social/types.ts` · `meta.ts` · `x.ts` · `tiktok.ts` · `linkedin.ts` · `index.ts` | Channel publishers + router |
| `oauth/index.ts` · `google.ts` · `meta.ts` · `x.ts` · `linkedin.ts` · `tiktok.ts` | OAuth router + 5 provider adapters |
| `scrapers/florida/types.ts` · `miami-dade.ts` · `broward.ts` · `palm-beach.ts` · `clerk-of-court.ts` · `tax-collector.ts` · `code-enforcement.ts` · `index.ts` | Florida public-records pipeline |
| `scrapers/airdna.ts` | STR market data |
| `scrapers/playwright.ts` | Playwright orchestrator + Miami-Dade Clerk recipe + rate limiter |
| `sphere/signals.ts` | Anniversary, equity-position, LinkedIn job-change, deed-transfer signals |
| `brochure/fonts.ts` · `render.tsx` | @react-pdf editorial 10-page brochure renderer |

### Components (`web/src/components/`)
| Component | Purpose |
|---|---|
| `ui/{button,card,input,badge}.tsx` | Primitives |
| `alevant/wordmark.tsx` | Brand wordmark |

### App routes (`web/src/app/`)

**Public marketing**
- `/` (landing) · `/(marketing)/layout.tsx` · `/(marketing)/{pricing,demo,press,waitlist}/page.tsx`

**Auth**
- `/(auth)/{login,signup}/page.tsx`

**Onboarding wizard (9 stages)**
- `/onboard/{identity,brokerage,brand,connections,sofia,sphere,pipeline,marketing,compliance}/page.tsx` + shell + index

**Authenticated app (`/(app)/`)**
- `cockpit` · `inbox` + `[id]` · `listings` + `new` + `[id]` · `pipelines/[kind]` · `grid` + `scan` · `underwriter` · `sofia` · `vesper` (interactive queue) · `sphere` · `transactions` + `[id]` · `settings` + `billing` · `admin` + `members` + `branding` + `reporting` + `compliance`

**Dynamic microsite**
- `/m/[tenant]/[slug]/page.tsx` — public per-listing site, brand-kit themed

**API routes**
| Group | Routes |
|---|---|
| Auth-aware setup | `/api/onboard/{save,activate}`, `/api/onboard/oauth/[service]/{,,callback}` |
| Lead intake | `/api/leads/intake`*, `/api/listings`, `/api/listings/scrape-url`* |
| AI personas | `/api/sofia/{text,voice-webhook,provision,twilio-incoming,twilio-sms,twilio-status}`, `/api/vesper/{generate-campaign,fair-housing-lint,brochure,avatar-video,approve/[asset_id],reject/[asset_id],publish/[asset_id]}` |
| Underwriter | `/api/underwriter/{cma,investor}` |
| The Grid | `/api/grid/{score,scan,outreach}` |
| Sphere + cockpit | `/api/sphere/sweep`, `/api/cockpit/standup` |
| Transactions | `/api/transaction/start`, `/api/transaction/[id]` |
| Billing | `/api/billing/{checkout,portal}` |
| Marketing | `/api/marketing/{waitlist,demo}` |
| Webhooks | `/api/webhooks/{docusign,stripe}` |
| Crons | `/api/cron/{sphere-sweep,vesper-cadence,precon-scrape,grid-scan,transaction-nudges}` |

*marked items are referenced from UI but defer detailed implementation to per-tenant ops

### Scripts
| Script | Purpose |
|---|---|
| `scripts/seed-bichi.ts` | Provisions Bichi workspace, brokerage, brand kit, Sofia + Vesper configs, sample listings, farm zones, Grid signals |

---

## Cron schedule (`vercel.json`)

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cron/sphere-sweep` | every 6h | Detect anniversaries / equity / life events |
| `/api/cron/vesper-cadence` | daily 11:00 UTC (7am ET) | Queue weekly content for active workspaces |
| `/api/cron/precon-scrape` | daily 09:00 UTC | Refresh pre-construction tower data |
| `/api/cron/standup-prebake` | daily 11:30 UTC | Pre-bake daily standup audio |
| `/api/cron/grid-scan` | daily 10:00 UTC | Scan farm-zone properties → grid_signals |
| `/api/cron/transaction-nudges` | daily | Compute nudges + risk flags per active transaction |

Crons authenticate via `Bearer ${CRON_SECRET}`.

---

## Environment variables (~32)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Anthropic
ANTHROPIC_API_KEY
ANTHROPIC_MODEL_FAST          # claude-haiku-4-5-20251001
ANTHROPIC_MODEL_SYNTH         # claude-sonnet-4-6
ANTHROPIC_MODEL_CREATIVE      # claude-opus-4-7

# Azure Foundry (enterprise)
AZURE_ANTHROPIC_ENDPOINT
AZURE_ANTHROPIC_API_KEY
AZURE_ANTHROPIC_MODEL

# Voice (Sofia)
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_DEFAULT_AREA_CODE      # 305
RETELL_API_KEY
ELEVENLABS_API_KEY
ELEVENLABS_DEFAULT_VOICE_ID

# AI / Vesper
HEYGEN_API_KEY

# Investor data
AIRDNA_API_KEY
ATTOM_API_KEY

# Web intelligence
PERPLEXITY_API_KEY
OPENAI_API_KEY                # Whisper

# Productivity OAuth
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI

# Social OAuth
META_APP_ID
META_APP_SECRET
X_CLIENT_ID
X_CLIENT_SECRET
TIKTOK_CLIENT_KEY
TIKTOK_CLIENT_SECRET
LINKEDIN_CLIENT_ID
LINKEDIN_CLIENT_SECRET

# DocuSign
DOCUSIGN_INTEGRATION_KEY
DOCUSIGN_USER_ID
DOCUSIGN_ACCOUNT_ID
DOCUSIGN_PRIVATE_KEY
DOCUSIGN_BASE_URL
DOCUSIGN_REST_BASE
DOCUSIGN_CONNECT_HMAC_SECRET

# Stripe
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_AGENT_MONTH
STRIPE_PRICE_AGENT_YEAR
STRIPE_PRICE_TEAM_MONTH
STRIPE_PRICE_TEAM_YEAR
STRIPE_PRICE_BROKERAGE_MONTH
STRIPE_PRICE_BROKERAGE_YEAR

# App
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_DOMAIN
TENANT_BICHI_DOMAIN
CRON_SECRET
```

---

## Compliance perimeter (built into code, not policy)

| Compliance area | Mechanism |
|---|---|
| **TCPA strict** | `lib/tcpa.ts` — `checkOutboundConsent` blocks AI-initiated outbound without active consent record. Quiet-hours per state. STOP keywords auto-revoke consent. |
| **Fair Housing strict** | `lib/fair-housing.ts` — 10-pattern linter, blocks Vesper publishes with protected-class language. Re-lints on approval. All events logged 5-year retention. |
| **NAR settlement** | Buyer pipeline gates "Schedule Showing" on `bba_signed_at`. Sofia's bookShowing tool checks the same gate. |
| **AI disclosure** | Sofia identifies as AI on every conversation when `sofia_configs.ai_disclosure_enabled` (default true). Disclosure log written per call. |
| **Data ownership** | Workspace data owned by tenant. Export-anytime. 90-day deletion on termination. |
| **Recording consent** | Sofia announces recording when `recording_consent_enabled` (default true). Two-party-consent state compliance. |

---

## Build / deploy commands

```bash
# Install
cd web
pnpm install

# Database
pnpm db:migrate           # applies both migrations to linked Supabase

# Seed pilot tenant
pnpm seed:bichi

# Local dev
pnpm dev                  # http://localhost:3000

# Build
pnpm build                # next build --webpack

# Production deploy
vercel deploy --prod
```

---

## What's deferred to ops

The scaffold compiles, types, and ships. These are activated by ops, not code:

- **Stripe price IDs** — created in Stripe dashboard, copied to env.
- **Meta Business app review** — `instagram_content_publish` requires App Review (~2 weeks).
- **DocuSign JWT consent** — admin must grant impersonation consent once.
- **Twilio A2P 10DLC registration** — required for SMS at any volume.
- **Playwright worker host** — clerk-of-court / tax / code crawls need a long-lived non-serverless host.
- **HeyGen avatar training** — submit Bichi footage manually first time.
- **MLS data licensing** — separately negotiated per market (MLS Grid / Bridge / Trestle).
- **DNS** — `alevant.ai`, `*.alevant.ai`, `bichi.miami` CNAMEs.
- **SOC 2** — Type II audit (post-revenue).

---

*This manifest is the operator's source of truth. Update on every architectural change.*
