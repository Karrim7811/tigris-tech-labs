# ALEVANT — Technical Architecture

**Tigris Tech Labs**
**Phase 0 · Foundation Document**
**Status: Architectural Specification**
**Pilot Tenant: Thomas Bichi (Keller Williams Capital Realty)**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Overview](#2-platform-overview)
3. [Multi-Tenancy Model](#3-multi-tenancy-model)
4. [Complete Module Inventory](#4-complete-module-inventory)
5. [AI Personas: Sofia & Vesper](#5-ai-personas-sofia--vesper)
6. [Technical Stack](#6-technical-stack)
7. [API Surface](#7-api-surface)
8. [Data Model](#8-data-model)
9. [Compliance Architecture](#9-compliance-architecture)
10. [Integration Architecture](#10-integration-architecture)
11. [Security Architecture](#11-security-architecture)
12. [Deployment & Infrastructure](#12-deployment--infrastructure)
13. [PRAIX Inheritance Map](#13-praix-inheritance-map)

---

## 1. EXECUTIVE SUMMARY

ALEVANT is the AI-native operating system for residential and small-commercial real estate. It is a multi-tenant SaaS platform that consolidates the four most expensive non-agent functions — inside sales, marketing, transaction coordination, and sphere management — into a single Claude-powered surface.

The platform is purpose-built for the post-Zillow-acquisition CRM era: agent-owned data, AI-native workflows, multilingual by design, with first-class support for the investor and small-multifamily segments that incumbent residential CRMs neglect.

**Pilot tenant:** Thomas Bichi, top-producing Keller Williams agent in Coral Gables, Florida. Volume profile: residential sales $200k-$2M, rentals $2k-$10k/month, with investor and small-MF expansion. Bichi's existing brand (`investmiami-livemiami.com`) is being rebuilt at `bichi.miami` as Phase 1 of ALEVANT — the website itself becomes the first product surface.

**Strategic positioning:** ALEVANT presents every agent at a marketing tier above their listing-price weight class. A $200k-$2M agent gets $10M-tier creative on every listing. The "look the part to get the part" play — sustained over 90 days — pulls agents up the price ladder.

**Inheritance:** The architectural pattern is a direct sibling of PRAIX (Tigris Tech Labs' commercial insurance platform). Same Next.js + Supabase + Vercel + Anthropic substrate; same Row-Level-Security multi-tenancy approach (with a workspace-scoped extension); same dual-persona design (PRAIX's Copilot ↔ ALEVANT's Sofia + Vesper). The PRAIX Azure Foundry deployment path applies for enterprise tenants.

---

## 2. PLATFORM OVERVIEW

### 2.1 Surfaces

| Surface | Audience | Stack |
|---|---|---|
| **app.alevant.ai** | Agents — primary CRM workspace | Next.js 16, server-rendered, deployed Vercel |
| **alevant.ai** | Marketing site, signup, demo | Next.js 16, deployed Vercel |
| **{tenant}.alevant.ai** | Tenant-branded agent portal (or custom domain like `bichi.miami`) | Next.js 16, dynamic tenant rendering |
| **{listing}.{tenant}.alevant.ai** | Auto-generated listing microsites | Next.js 16, static + ISR |
| **Sofia (phone)** | Inbound + outbound voice ISA | Retell + Twilio orchestration |
| **Mobile (Phase 5+)** | Field operations, voice, shake-to-Sofia | React Native (Expo) — fork of PRAIX shell |

### 2.2 High-Level Architecture

```
                         ┌──────────────────────────────────────────┐
                         │              CLIENT LAYER                 │
                         │  ─────────────────────────────────────   │
                         │   Web App  │  Tenant Portal  │  Mobile   │
                         │   Next.js  │   Next.js       │  RN/Expo  │
                         └────┬───────────┬───────────────┬─────────┘
                              │           │               │
                              v           v               v
                         ┌──────────────────────────────────────────┐
                         │           API LAYER (Vercel)              │
                         │  ─────────────────────────────────────   │
                         │      ~60 Next.js API Routes               │
                         │   /sofia  /vesper  /lead-inbox            │
                         │   /listings  /pipelines  /underwriter     │
                         │   /sphere  /transaction  /microsite       │
                         └──┬─────────┬─────────┬─────────┬─────────┘
                            │         │         │         │
                  ┌─────────v┐  ┌─────v────┐  ┌─v────┐  ┌v────────────┐
                  │ Supabase │  │ Anthropic│  │ Voice│  │ Integrations│
                  │ Postgres │  │  Claude  │  │      │  │             │
                  │   + RLS  │  │ +Foundry │  │Retell│  │ Gmail       │
                  │   + Auth │  │          │  │Twilio│  │ Cal · Meta  │
                  │ + Storage│  │          │  │ EL   │  │ X · TikTok  │
                  │+ Realtime│  │          │  │Whisp │  │ LI · YT     │
                  └──────────┘  └──────────┘  └──────┘  │ DocuSign    │
                                                         │ HeyGen      │
                                                         │ AirDNA      │
                                                         │ KW Command  │
                                                         │ MLS         │
                                                         │ ATTOM       │
                                                         │ Perplexity  │
                                                         └─────────────┘
```

### 2.3 Phase Plan

| Phase | Scope | Status |
|---|---|---|
| **Phase 0** | Foundation: docs, brand, architecture, scaffold | **In progress** |
| **Phase 1** | Bichi onboarding wizard + bichi.miami site rebuild + OAuth connectors | Next |
| **Phase 2** | Lead Inbox + Sofia text + 4 pipelines + Listings + Underwriter | |
| **Phase 3** | Sofia voice + Vesper for one listing end-to-end + HeyGen avatar + AirDNA | |
| **Phase 4** | Vesper full + Transaction Brain + Sphere Brain + Pre-Con Tracker | |
| **Phase 5** | Multi-tenant GA · pricing · press launch · brokerage tier | |

---

## 3. MULTI-TENANCY MODEL

### 3.1 The Workspace as Tenant

Every paying customer is a **workspace**. A workspace can be:
- A **solo agent** (Bichi V1)
- A **team** (multiple agents, shared brand kit, team admin)
- A **brokerage** (many teams, brokerage admin, white-label)

### 3.2 Data Isolation Strategy

Every domain row carries a `workspace_id`. Supabase Row Level Security (RLS) policies enforce that authenticated users can only read/write rows where `workspace_id` matches one of their `workspace_membership` records. The auth user → workspace mapping is many-to-many (an agent can belong to multiple workspaces — e.g., team + brokerage admin). Service role keys are server-only and never exposed.

### 3.3 Brand & Configuration Isolation

Each workspace owns four configuration entities loaded on every request:
- `brand_kit` — colors, typography, logos, photography assets, voice presets
- `sofia_config` — phone number, voice ID, hours, languages, handoff rules
- `vesper_config` — voice preset, channel priorities, cadence, approval mode
- `workspace_integrations` — OAuth refresh tokens, scopes, encrypted at rest

The agent-facing UI dynamically themes based on `brand_kit`. ALEVANT's own chrome (login screens, billing, system dialogs) uses ALEVANT brand identity exclusively.

### 3.4 Tenant Subdomains

`{slug}.alevant.ai` resolves dynamically via middleware on the Edge. A future custom-domain feature (Phase 5) lets enterprise tenants point CNAME records (e.g., `app.compass.com`) at the platform.

### 3.5 Cross-Tenant Operations

The only cross-tenant flows:
- **System administration** — billing, usage tracking, support (service role only)
- **Marketplace data** — anonymized aggregate metrics for benchmarks, opt-in
- **Press / case studies** — anonymized unless explicitly authorized

---

## 4. COMPLETE MODULE INVENTORY

### 4.1 Lead Inbox

Multi-source ingestion of every prospect/lead/inquiry into a unified inbox.

| Source | Mechanism |
|---|---|
| Gmail | Push subscription via Pub/Sub on inbox label or filtered query |
| IG / X / TikTok / LinkedIn DMs | OAuth + webhook subscriptions; long-poll fallback |
| Web form (agent's site) | Direct POST to `/api/leads/intake` with workspace API key |
| Phone call (Sofia) | Sofia post-call hook creates lead record |
| FB Lead Ads | Meta webhook → CRM record |
| Manual entry | Standard form |
| Bulk CSV import | Onboarding wizard (Stage 6) |

Each lead is auto-classified by Claude (intent, urgency, asset class, language) and routed to the correct pipeline.

### 4.2 Sofia — Voice ISA

See [Section 5.1](#51-sofia--voice-isa).

### 4.3 Pipelines

Four distinct pipelines, each with stage-specific automation:

| Pipeline | Stages | Special Automation |
|---|---|---|
| **Buyer** | Inquiry · Pre-Qual · Showing · Offer · Under Contract · Closed · Lost | Buyer-Broker Agreement gating (post-NAR settlement) |
| **Seller** | Inquiry · Listing Pres Booked · Listing Pres Done · Signed · Active · Pending · Closed · Lost | Vesper auto-trigger on Signed |
| **Investor** | Sourcing · Underwriting · LOI · Contract · DD · Close | Underwriter auto-runs on every property |
| **Rental** | Inquiry · Application · Approved · Lease Signed · Move-In | High-velocity (rentals close in days) |

### 4.4 Listings

CRUD for active/pending/sold listings. V1 is manual entry; the schema is shaped to absorb MLS RESO Web API (Phase 4-5). Each listing record drives Vesper, the microsite generator, and buyer-match notifications.

### 4.5 Vesper Studio

See [Section 5.2](#52-vesper--ai-marketing-director).

### 4.6 Underwriter

Two paths, one engine:

**Residential CMA** (60-second mode):
- Address → ATTOM lookup (Phase 2) / public records scrape (V1)
- Comparable sold (last 90/180 days, 0.25/0.5/1 mile radii)
- Days on market trend, price-per-sqft trend, absorption rate
- Suggested list price with confidence interval
- Branded PDF output

**Investor MF / small commercial**:
- Cap rate, cash-on-cash, GRM, DSCR
- BRRRR projection (refinance ARV from comps)
- STR projection (AirDNA — ADR, occupancy, RevPAR for the geo)
- 1031 exchange timing if active deal
- FIRPTA flag if foreign seller
- Sensitivity table (rate ±100bps, occupancy ±10%, expenses ±20%)

### 4.7 Pre-Construction Tracker

Miami-specific (V1 scope). Curated index of active towers with:
- Developer + reputation score (track record)
- Deposit schedule (typical: 10/10/10/10/10/50)
- Expected delivery (with delay risk)
- Current floor-plan inventory
- Assignment market activity
- Average price-per-sqft trend

Reuses the PRAIX permit-pull / Firecrawl scraper architecture for source ingestion.

### 4.8 Transaction Brain

Once a buyer or seller side goes "Under Contract":
- Generates a deal-specific timeline (inspection, appraisal, loan, title, HOA estoppel, walk-through, close)
- Subscribes to DocuSign envelope webhooks
- Nudges all parties at appropriate intervals (lender, title, HOA, inspector)
- Drafts client status update emails (agent reviews / approves / sends)
- Risk-flags: low-appraisal probability, lender silence, inspection deal-breaker keywords

Compresses median residential close from 35 days to ~21–25 by parallelizing nudges.

### 4.9 Sphere Brain

Continuous monitoring of the agent's contact graph for "right call" signals:
- LinkedIn job-change detection (via API where licensed; manual sync fallback)
- Public records: deed transfers, divorce filings, estate proceedings, tax delinquency
- Social monitoring (consented contacts only)
- Calendar-based: home anniversary, birthday, kids' school transitions
- Equity position alerts (their home now +X% — refi/move conversation)
- Past-client satisfaction score (NPS micro-pulse via Sofia)

Daily briefing surfaces top 3-5 right-calls with drafted opening message.

### 4.10 Microsites

Auto-generated static-rendered pages per listing at `{address-slug}.{tenant}.alevant.ai`:
- Full-bleed photography (from agent's photographer)
- Cinematic listing film embed (Vesper-generated)
- Editorial narrative copy (in agent's voice preset)
- Neighborhood data + market story
- Embedded Sofia chat ("Ask about this home")
- Showing booking CTA (Calendar OAuth)
- Offer-prep CTA for serious buyers
- Multilingual toggle (V2: ES/PT)

Each microsite is a permanent, indexable, branded asset that survives the listing's active lifecycle and doubles as a credibility artifact.

### 4.11 Cockpit

Agent's home dashboard:
- 90-second AI standup audio (TTS)
- Today's right-calls (Sphere Brain output)
- Hot leads (Sofia-qualified, awaiting handoff)
- Vesper queue (posts/campaigns awaiting approval)
- Pipeline KPIs (weighted, active, at-risk)
- Signal feed (deal-velocity, listing-pressure, market shifts)

Inherits PRAIX's signal-detection algorithms (z-score, Herfindahl-Hirschman concentration, deal velocity, win-probability v3.1, activity benchmarking).

---

## 5. AI PERSONAS: SOFIA & VESPER

### 5.1 Sofia — Voice ISA

#### Capabilities

| Capability | Specification |
|---|---|
| **Inbound voice** | Picks up <10 seconds. Real-time bidirectional conversation. |
| **Inbound text** | SMS, IG/X/TikTok/LinkedIn DMs, web chat. <30 second response. |
| **Outbound (Phase 3)** | Calls/texts past clients, sphere, expired listings — strict consent gating. |
| **Languages** | EN V1; ES + PT Phase 4. |
| **Hours** | 24/7 by default; Bichi handles 8:30am–6pm Mon–Sat, Sofia takes overflow + after-hours. |
| **Handoff** | Push notification + ringthrough to agent's cell when qualification score ≥ 70 ("hot lead"). |
| **Knowledge** | Listings (active + recently sold), agent's process, market data, past-client history (RAG over workspace data). |
| **Compliance** | TCPA-strict: no AI-initiated outbound without verified prior-express-written-consent; AI-disclosure on every conversation per state law. |

#### Stack

```
                            ┌──────────────┐
                            │   Twilio     │ ← Phone number
                            │   PSTN/SMS   │   provisioning per tenant
                            └──────┬───────┘
                                   │
                            ┌──────v───────┐
                            │   Retell     │ ← Voice orchestration
                            │   (LLM call) │   (turn-taking, interruption,
                            └──────┬───────┘    barge-in, end-of-utterance)
                                   │
                            ┌──────v───────────────────────┐
                            │   Claude (Sonnet 4.6)         │
                            │   Sofia system prompt        │
                            │   + workspace context        │
                            │   + listings RAG             │
                            │   + tool use:                │
                            │     - bookShowing            │
                            │     - createLead             │
                            │     - tagAsHot               │
                            │     - escalateToAgent        │
                            │     - sendListingDetails     │
                            └──────┬───────────────────────┘
                                   │
                            ┌──────v───────┐
                            │ ElevenLabs   │ ← TTS voice synthesis
                            │ Custom voice │   (Sofia voice cloned/picked)
                            └──────────────┘
```

#### Sofia's Tool Use

Sofia's Claude system prompt grants access to:
- `searchListings(filters)` — query workspace listings
- `getListingDetails(id)` — full record + photos + comp set
- `bookShowing(listingId, contactId, when)` — Calendar OAuth + ShowingTime
- `createOrUpdateLead(payload)` — write to inbox
- `qualifyLead(score, reason)` — mark with qualification metadata
- `escalateToAgent(reason)` — push notification + ring agent's cell
- `sendListingPDF(listingId, contactEmail)` — email handoff
- `addToSphere(contactId, relationship)` — sphere management
- `flagFairHousingConcern(text)` — auto-escalate if conversation drifts

#### Compliance Perimeter

Sofia *cannot*:
- Initiate outbound calls/texts without consent verification
- Provide legal/tax/financial advice (auto-deflects to "Thomas can answer that on Monday")
- Discuss protected-class language in steering manner
- Make commitments on price/terms (always "I'll have Thomas confirm")
- Operate outside the configured hours/languages

### 5.2 Vesper — AI Marketing Director

#### Persona Calibration

Vesper is calibrated at the level of a 30-year senior brand creative director who has worked on $10M+ Sotheby's / Aman / Four Seasons campaigns. Her output is editorial, restrained, never breathless. She generates the agent's brand at a tier above their listing-price weight class.

#### Voice Presets

| Preset | Reference | Sample |
|---|---|---|
| **The Insider** *(Bichi V1)* | Sotheby's · Aman | "Six bedrooms. The view at sunrise." |
| **The Storyteller** | Compass · T&C | "She wakes to the bay. Coffee on the terrace before the city stirs." |
| **The Authority** | The Agency · Mauricio Umansky | "Highest sale per sq ft in the building, 2026 YTD." |
| **The Local Legend** | Warm Miami insider | "From the team that closed 11 transactions on Brickell this year." |

#### Per-Listing Output (12 Deliverables)

Triggered automatically when a listing transitions to "Active" in Listings module:

1. **Cinematic listing film** — 60-90s. Vesper outputs script, shot list, music brief, voiceover. Agent or videographer films/edits using brief; Vesper renders if HeyGen avatar is configured.
2. **Hero photography brief** — light direction, styling, lens recommendations, shot list. For agent's photographer.
3. **Custom listing microsite** — `{address}.{tenant}.alevant.ai`
4. **Editorial brochure** — 8–12 page magazine-layout PDF, print-ready
5. **2-week social campaign** — 14 posts across IG / X / TikTok / LinkedIn, platform-native
6. **MLS description** — Fair Housing-linted, restrained editorial voice
7. **Email blast** — sphere segmentation + personalization
8. **Buyer-match outreach** — AI matches existing buyer pipeline records, drafts personalized "I think this is yours" message per match
9. **Open house event** — invite design + RSVP page + QR-code pre-qualification
10. **"Whisper" preview list** — top-50 sphere private preview before public listing
11. **Neighborhood report** — comps, trends, absorption rate, embedded in microsite
12. **Press pitch** — when listing merits (architectural significance, record price for building, celebrity provenance, etc.) — pitches to WSJ Real Estate, Mansion Global, The Real Deal, Robb Report

#### Weekly Content Engine

Outside per-listing campaigns, Vesper generates ongoing brand content:
- **Market stat post** (1×/week)
- **Just-sold post** (each closing, with permission)
- **Investor tip** (1×/week)
- **Pre-construction update** (1×/week)
- **Mortgage / market commentary** (as rates move)
- **Agent personality post** (drawn from agent's calendar, recent activity)
- **Testimonial repost** (when one arrives)
- **Local lifestyle / neighborhood spotlight** (1×/week)

#### Approval Modes

| Mode | Behavior |
|---|---|
| **Approval-Gated** *(default)* | Each post queued for agent review with 4-hour window. Approve / edit / reject. |
| **Autonomous** | Posts publish on schedule. Agent can pause any channel. |
| **Hybrid (per-channel)** | E.g., autonomous on IG and TikTok, approval-gated on LinkedIn. |

Default is **Approval-Gated for all channels** at activation. Each channel can be promoted to autonomous after agent demonstrates trust (≥10 approvals without major edits).

#### Compliance Perimeter (Hard Constraints)

Vesper *will not*:
- Generate copy with protected-class language (Fair Housing strict mode — not bypassable)
- Use stock photography (when stock-prohibition is on, default ON)
- Make material misrepresentations about properties
- Generate "guarantee" or "promise" language (regulated)
- Generate false urgency / scarcity claims
- Operate without watermark/agent-branding on visual outputs

#### Stack

```
                        ┌────────────────────────┐
                        │   Vesper Engine         │
                        │   /api/vesper/generate  │
                        └───────────┬────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
       ┌──────v──────┐      ┌───────v────────┐    ┌───────v────────┐
       │ Claude       │      │ Image Gen      │    │ HeyGen         │
       │ Opus 4.7     │      │ (DALL-E 3 or   │    │ (avatar video) │
       │              │      │ Midjourney via │    │                │
       │ Brand voice  │      │ proxy)         │    │ Bichi avatar   │
       │ + workspace  │      │                │    │ for narrated   │
       │ + listing    │      │ Visual assets  │    │ listing films  │
       │ context      │      │ + carousels    │    │                │
       │ → script,    │      │                │    │                │
       │ copy, IA     │      │                │    │                │
       └──────────────┘      └────────────────┘    └────────────────┘
                                    │
                        ┌───────────v────────────┐
                        │   Microsite Generator   │
                        │   (Next.js ISR build)   │
                        └────────────────────────┘
                                    │
                        ┌───────────v────────────┐
                        │   Channel Distribution  │
                        │   - Meta Graph (IG)     │
                        │   - X API               │
                        │   - TikTok Business     │
                        │   - LinkedIn API        │
                        │   - Gmail (email blast) │
                        └────────────────────────┘
```

---

## 6. TECHNICAL STACK

### 6.1 Frontend

| Component | Technology | Version |
|---|---|---|
| Framework | Next.js | 16.x |
| UI Library | React | 19.x |
| Styling | Tailwind CSS | v4 |
| Typography | Cormorant Garamond + Jost | Google Fonts |
| Icons | Lucide React | latest |
| Charts | Recharts | latest |
| Maps | Leaflet + React-Leaflet | latest |
| Spreadsheet | SheetJS (xlsx) | for CSV import |
| PDF gen | PptxGenJS, react-pdf | brochures, decks |
| Video calling (V3+) | LiveKit or Daily | for embedded showings |

### 6.2 Backend

All backend logic runs as Next.js API routes deployed on Vercel serverless infrastructure.

| Component | Technology |
|---|---|
| Runtime | Node.js (serverless) |
| Edge | Vercel Edge Network |
| Database | Supabase Postgres |
| Auth | Supabase Auth (Email + Google + Apple) |
| RLS | Supabase Row Level Security |
| Storage | Supabase Storage (brand assets, listing photos, generated brochures) |
| Realtime | Supabase Realtime (lead inbox, Vesper queue) |
| Background jobs | Vercel Cron + Supabase pg_cron (fallback Inngest if needed) |

### 6.3 AI / ML

| Provider | Use | Models |
|---|---|---|
| Anthropic Claude | All AI reasoning | Haiku 4.5 default (fast), Sonnet 4.6 (synthesis), **Opus 4.7 (Vesper creative)** |
| Anthropic Foundry (Azure) | Enterprise tenants requiring Azure-hosted | same Claude models |
| OpenAI Whisper | STT (Sofia voice + agent voice notes) | whisper-1 |
| ElevenLabs | TTS (Sofia voice) | custom voice clone |
| Retell | Voice ISA orchestration | Retell Conversation Engine |
| HeyGen | AI avatar video (Bichi avatar for listing films) | HeyGen Avatar v3 |
| Perplexity AI | Real-time web research (market intel, listing context) | sonar |
| Image gen | Listing visual assets, social carousels | DALL-E 3 + (optional Midjourney via proxy) |

### 6.4 Voice & Telephony

```
Twilio          → Phone number provisioning per tenant (local Miami area code)
                  SMS for Sofia text, lead responses, opt-in/opt-out
                  Voice for inbound; outbound Phase 3+
                  Recording for compliance (with consent)

Retell          → Voice orchestration (turn-taking, end-of-utterance, barge-in)
                  Hooks into Claude for reasoning
                  ElevenLabs for TTS

ElevenLabs      → Sofia voice synthesis
                  Eventually agent voice clones (with strict consent)

Whisper         → STT for Sofia inbound audio
                  STT for agent voice notes / showing notes
```

### 6.5 Data Sources

| Source | Use | Phase |
|---|---|---|
| **MLS adapter** | Active listings, recent sold, market data | V1 stub; V2 via MLS Grid / Bridge / Trestle |
| **ATTOM** | Comprehensive comps, property characteristics, ownership | V2 |
| **Public records (Florida)** | Tax data, deed transfers, owner of record | V1 (scraped) |
| **AirDNA** | STR projections (ADR, occupancy, RevPAR) | V1 (dashboard); V2 (API) |
| **CondoBlackBook + scraped sources** | Pre-construction Miami towers | V1 scraped |
| **Perplexity** | Real-time market intel, news scanning | V1 |
| **KW Command** | Bichi's existing pipeline + transaction sync | Stub V1; integrate when API available |
| **Zillow / Realtor.com URL paste** | Listing URL → scrape for manual entry shortcut | V1 (reusing PRAIX scraper) |

### 6.6 Marketing & Social

| Platform | Use | Notes |
|---|---|---|
| Meta Graph (IG + FB) | Vesper post + DM read | OAuth Business |
| X API v2 | Post + DM | OAuth |
| TikTok Business API | Post + analytics | OAuth |
| LinkedIn API | Post + DM | OAuth |
| YouTube Data API | Listing film uploads | OAuth |
| WhatsApp Business | Sofia DMs (V2 LATAM) | Cloud API |

### 6.7 Productivity

| Service | Use |
|---|---|
| Gmail API | Lead intake, sphere import, Sofia email replies, marketing email blast |
| Google Calendar API | Showing booking, agent calendar sync |
| DocuSign | Transaction Brain envelope monitoring + draft creation |

---

## 7. API SURFACE

Approximate API route inventory (~60 routes, organized by domain):

### 7.1 Core Workspace

```
/api/onboard/save               # Onboarding wizard state save
/api/onboard/activate           # Final activation; provision Sofia, Vesper warmup
/api/workspace/brand-kit        # Brand kit CRUD
/api/workspace/sofia-config     # Sofia config CRUD
/api/workspace/vesper-config    # Vesper config CRUD
/api/workspace/integrations     # OAuth manager
```

### 7.2 Lead Inbox

```
/api/leads/intake               # Universal lead intake endpoint
/api/leads/list                 # Paginated lead list
/api/leads/classify             # Re-run AI classification
/api/leads/[id]                 # CRUD on individual lead
/api/leads/escalate             # Manual hot-flag → push to agent
/api/webhooks/gmail             # Gmail push subscription handler
/api/webhooks/meta              # IG/FB webhook handler
/api/webhooks/twitter           # X webhook handler
/api/webhooks/tiktok            # TikTok webhook handler
/api/webhooks/linkedin          # LinkedIn webhook handler
/api/webhooks/twilio            # Twilio inbound SMS/voice
```

### 7.3 Sofia

```
/api/sofia/voice-webhook        # Retell webhook for voice events
/api/sofia/text                 # Inbound text turn handler
/api/sofia/qualify              # Qualification scoring tool
/api/sofia/handoff              # Agent push + ringthrough
/api/sofia/transcript/[callId]  # Get full call transcript + summary
/api/sofia/outbound/queue       # Phase 3+ outbound queue with consent gate
```

### 7.4 Vesper

```
/api/vesper/generate-listing-campaign   # Full 12-asset generation
/api/vesper/film-script                  # Listing film script generation
/api/vesper/microsite                    # Microsite content generation
/api/vesper/brochure                     # PDF brochure generation
/api/vesper/social-post                  # Single post generation
/api/vesper/weekly-cadence               # Weekly content engine batch
/api/vesper/approve/[postId]             # Approval flow
/api/vesper/publish                      # Multi-channel publish
/api/vesper/fair-housing-lint            # Compliance linter
```

### 7.5 Listings & Pipelines

```
/api/listings                   # CRUD
/api/listings/scrape-url        # Zillow/Realtor.com URL scrape (reuse PRAIX scraper)
/api/listings/photos            # Upload + management
/api/pipelines/buyer            # Buyer pipeline CRUD
/api/pipelines/seller           # Seller pipeline CRUD
/api/pipelines/investor         # Investor pipeline CRUD
/api/pipelines/rental           # Rental pipeline CRUD
/api/buyer-broker-agreement     # NAR-compliance gating
```

### 7.6 Underwriter

```
/api/underwriter/cma            # Residential CMA
/api/underwriter/investor       # Investor MF underwrite
/api/underwriter/str            # AirDNA STR projection
/api/underwriter/comps          # Comp set generation
/api/underwriter/pdf            # Branded PDF output
```

### 7.7 Sphere & Transaction

```
/api/sphere/sweep               # Daily sweep for right-calls
/api/sphere/import-gmail        # Onboarding sphere import
/api/sphere/right-call          # Today's surfaced calls
/api/sphere/draft-message       # AI message draft

/api/transaction/start          # Initiate from Under-Contract
/api/transaction/timeline/[id]  # Deal-specific timeline
/api/transaction/nudge          # Send nudge (lender, title, etc.)
/api/transaction/risk-flag      # Risk detection
/api/webhooks/docusign          # DocuSign envelope events
```

### 7.8 Microsites

```
/api/microsite/generate/[listingId]   # Build microsite
/api/microsite/[slug]                 # Public-facing route (catch-all)
```

### 7.9 Cockpit & Analytics

```
/api/cockpit/standup            # Daily AI briefing (audio + text)
/api/cockpit/signals            # Signal feed
/api/cockpit/kpis               # Pipeline KPIs
/api/dashboard/query            # Natural language dashboard query
```

### 7.10 Pre-Construction

```
/api/precon/towers              # List active Miami towers
/api/precon/tower/[id]          # Tower details
/api/precon/scrape              # Scraper job (cron)
```

### 7.11 Admin

```
/api/admin/health               # Health check
/api/admin/usage                # Per-workspace AI usage
/api/admin/provision            # New tenant provisioning
```

---

## 8. DATA MODEL

### 8.1 Core Tables

```sql
workspaces
  id                uuid pk
  slug              text unique          -- 'bichi'
  name              text                  -- 'Bichi Team'
  owner_user_id     uuid fk auth.users
  brokerage_id      uuid fk brokerages
  brand_kit_id      uuid fk brand_kits
  sofia_config_id   uuid fk sofia_configs
  vesper_config_id  uuid fk vesper_configs
  plan              text
  status            text                  -- 'onboarding'/'active'/'paused'
  created_at        timestamptz

workspace_memberships
  workspace_id      uuid fk
  user_id           uuid fk auth.users
  role              text                  -- 'owner'/'agent'/'admin'/'viewer'

brokerages
  id                uuid pk
  name              text
  address           text
  phone             text
  email             text
  license_state     text
  mls_memberships   text[]
  brokerage_logo_url text

brand_kits
  id                uuid pk
  workspace_id      uuid fk
  primary_color     text
  secondary_color   text
  accent_color      text
  surface_color     text
  ink_color         text
  display_font      text
  body_font         text
  logo_url          text
  wordmark_text     text
  tagline           text
  voice_preset      text                  -- 'insider'|'storyteller'|'authority'|'local_legend'
  photography_style text
  prohibit_stock    boolean default true

sofia_configs
  id                uuid pk
  workspace_id      uuid fk
  twilio_number     text
  voice_id          text                  -- ElevenLabs voice id
  name              text default 'Sofia'
  languages_enabled text[] default '{en}'
  hours_json        jsonb                 -- per-day schedule
  handoff_rules_json jsonb
  greeting_script   text
  disclaimer_script text
  qualification_threshold int default 70

vesper_configs
  id                uuid pk
  workspace_id      uuid fk
  voice_preset      text
  channel_priorities text[]
  cadence_json      jsonb
  approval_mode     text default 'gated'
  approval_window_minutes int default 240
  fair_housing_strict boolean default true
  prohibit_stock    boolean default true

workspace_integrations
  id                uuid pk
  workspace_id      uuid fk
  service           text                  -- 'gmail'|'gcalendar'|'instagram'|'x'|...
  oauth_refresh_token_encrypted text
  scopes            text[]
  connected_at      timestamptz
  status            text
```

### 8.2 People & Relationships

```sql
contacts
  id                uuid pk
  workspace_id      uuid fk
  full_name         text
  emails            text[]
  phones            text[]
  category          text                  -- 'lead'|'past_client'|'sphere'|'vendor'
  relationship_score int                  -- 0-100
  source            text                  -- 'gmail_import'|'kw_command_import'|'manual'|'sofia_intake'
  language          text
  notes             text
  metadata          jsonb
  last_touch_at     timestamptz
  created_at        timestamptz

agents
  id                uuid pk
  workspace_id      uuid fk
  user_id           uuid fk auth.users
  role              text
  full_name         text
  preferred_name    text
  title             text
  license_number    text
  languages         text[]
  specialties       text[]
  awards            text
  bio_text          text
  cell_phone        text                  -- for handoff
  email             text
  active_hours_json jsonb                 -- when agent takes live calls vs Sofia handles

sphere_signals
  id                uuid pk
  workspace_id      uuid fk
  contact_id        uuid fk contacts
  signal_type       text                  -- 'job_change'|'baby'|'anniversary'|'equity_position'|'divorce_filing'|...
  signal_data       jsonb
  detected_at       timestamptz
  surfaced_at       timestamptz
  resolved          boolean default false
```

### 8.3 Pipelines

```sql
listings
  id                uuid pk
  workspace_id      uuid fk
  agent_id          uuid fk agents
  address           text
  city              text
  state             text
  zip               text
  price             numeric
  property_type     text                  -- 'condo'|'sfh'|'townhouse'|'mf2-4'|'mf5+'|'land'|'commercial'
  beds              int
  baths             numeric
  sqft              int
  lot_sqft          int
  year_built        int
  hoa_monthly       numeric
  taxes_annual      numeric
  listing_date      date
  expiration_date   date
  status            text                  -- 'active'|'pending'|'under_contract'|'sold'|'expired'|'withdrawn'
  mls_number        text
  photos            jsonb                 -- array of urls + metadata
  marketing_materials jsonb
  showing_instructions text
  seller_contact_id uuid fk contacts
  vesper_campaign_status text             -- 'pending'|'generated'|'approved'|'live'

buyers
  id                uuid pk
  workspace_id      uuid fk
  agent_id          uuid fk agents
  contact_id        uuid fk contacts
  budget_min        numeric
  budget_max        numeric
  timeline          text                  -- 'urgent'|'1-3'|'3-6'|'6+'
  preapproval_status text
  preapproval_lender text
  preapproval_amount numeric
  criteria_json     jsonb
  type              text                  -- 'primary'|'investment'|'vacation'
  investor_flags_json jsonb
  bba_signed_at     timestamptz           -- buyer-broker agreement (NAR settlement compliance)

rentals
  id                uuid pk
  workspace_id      uuid fk
  agent_id          uuid fk agents
  contact_id        uuid fk contacts
  budget_per_month  numeric
  lease_term_months int
  move_in_target    date
  occupants_json    jsonb
  pets_json         jsonb
  prequal_status    text

investor_deals
  id                uuid pk
  workspace_id      uuid fk
  agent_id          uuid fk agents
  subject_property  text
  deal_type         text                  -- 'acquisition'|'1031'|'development'|'assignment'
  investor_id       uuid fk contacts
  equity_available  numeric
  financing_structure text
  stage             text
  cap_rate_target   numeric
  underwriter_output_id uuid fk underwriter_runs

preconstruction_towers
  id                uuid pk
  name              text
  address           text
  developer         text
  developer_reputation_score int
  expected_delivery date
  delivery_delay_risk text
  deposit_schedule  jsonb
  current_inventory jsonb
  metadata          jsonb

preconstruction_watchlist
  workspace_id      uuid fk
  tower_id          uuid fk preconstruction_towers
  assigned_investor_ids uuid[]
  notes             text
```

### 8.4 Activity & Engagement

```sql
activity_log
  id                uuid pk
  workspace_id      uuid fk
  agent_id          uuid fk agents
  contact_id        uuid fk contacts
  activity_type     text                  -- 'call'|'sms'|'email'|'showing'|'meeting'|'note'|'open_house'|'sofia_call'
  source            text                  -- 'agent'|'sofia'|'system'
  summary           text
  outcome           text
  next_action       text
  next_date         timestamptz
  duration_seconds  int
  metadata          jsonb
  created_at        timestamptz

sofia_conversations
  id                uuid pk
  workspace_id      uuid fk
  contact_id        uuid fk contacts (nullable for unknown caller)
  channel           text                  -- 'voice'|'sms'|'web_chat'|'ig_dm'|'x_dm'|'tiktok_dm'|'linkedin_dm'
  direction         text                  -- 'inbound'|'outbound'
  status            text                  -- 'live'|'completed'|'escalated'
  transcript        jsonb                 -- turn-by-turn
  qualification_score int
  classification    jsonb                 -- intent, urgency, asset class, language
  escalated_at      timestamptz
  recording_url     text
  consent_metadata  jsonb                 -- for compliance audit
  duration_seconds  int

vesper_assets
  id                uuid pk
  workspace_id      uuid fk
  agent_id          uuid fk agents
  listing_id        uuid fk listings (nullable for non-listing content)
  asset_type        text                  -- 'film_script'|'photo_brief'|'microsite'|'brochure'|'social_post'|'email_blast'|'mls_description'|'press_pitch'
  channel           text                  -- 'ig'|'x'|'tiktok'|'linkedin'|'email'|'print'|'youtube'
  content           jsonb
  visual_urls       text[]
  status            text                  -- 'queued'|'awaiting_approval'|'approved'|'rejected'|'published'
  scheduled_for     timestamptz
  published_at      timestamptz
  approval_metadata jsonb
  fair_housing_lint_passed boolean

transactions
  id                uuid pk
  workspace_id      uuid fk
  agent_id          uuid fk agents
  side              text                  -- 'buyer'|'seller'|'both'
  property_address  text
  contract_date     date
  expected_close    date
  actual_close      date
  status            text
  timeline_json     jsonb                 -- generated milestones
  risk_flags        jsonb

transaction_milestones
  id                uuid pk
  transaction_id    uuid fk
  type              text                  -- 'inspection'|'appraisal'|'loan_commit'|'title'|'hoa_estoppel'|'walkthrough'|'closing'
  due_date          date
  completed_at      timestamptz
  status            text
  nudges_sent       int default 0
```

### 8.5 Compliance Tables

```sql
compliance_acknowledgments
  workspace_id      uuid fk
  type              text                  -- 'tcpa'|'fair_housing'|'nar_buyer_broker'|'data_ownership'
  user_id           uuid fk auth.users
  acknowledged_at   timestamptz
  ip_address        text
  user_agent        text
  version           text                  -- track terms version

consent_records
  id                uuid pk
  workspace_id      uuid fk
  contact_id        uuid fk contacts
  consent_type      text                  -- 'sms'|'voice'|'email'|'whatsapp'
  scope             text                  -- 'transactional'|'marketing'|'ai_assistant'
  granted_at        timestamptz
  granted_via       text                  -- 'web_form'|'verbal'|'sms_double_optin'|'email_double_optin'
  evidence          jsonb                 -- proof of consent
  revoked_at        timestamptz

ai_disclosures_logged
  id                uuid pk
  conversation_id   uuid fk sofia_conversations
  disclosure_text   text
  delivered_at      timestamptz
```

### 8.6 RLS Policy Pattern (illustrative)

```sql
-- Every domain table has policies of the form:
CREATE POLICY "workspace_member_read"
  ON contacts FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_member_write"
  ON contacts FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_memberships
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'agent', 'admin')
    )
  );
```

---

## 9. COMPLIANCE ARCHITECTURE

### 9.1 TCPA (Telephone Consumer Protection Act)

**Strict mode at the platform level.**

- No outbound AI-initiated SMS or voice without a `consent_records` row of type `sms`/`voice` with `scope` = `marketing` or `ai_assistant` AND `revoked_at IS NULL`.
- Inbound is zero-friction (lead initiates).
- Consent capture is collected via:
  - Web form double opt-in
  - SMS double opt-in flow (Sofia text: "Reply Y to allow Sofia to text you")
  - Verbal consent during inbound calls (recorded with explicit acknowledgment)
- Opt-out keywords (STOP, UNSUBSCRIBE, REMOVE) auto-revoke consent and broadcast to all channels.
- Quiet hours respected per state (default 8am-9pm local time).
- Consent records are immutable; revocations create new rows, not deletions.

### 9.2 Fair Housing Act

**Strict linter, not bypassable.**

- All Vesper-generated copy passes through a Fair Housing linter before queuing.
- Linter detects:
  - Protected-class references (race, color, religion, sex, familial status, national origin, disability, plus state-extended classes — sexual orientation, gender identity, source of income, etc.)
  - Steering language ("perfect for families", "great schools", "quiet neighborhood")
  - Discriminatory exclusion language
- Failed lint blocks publish, returns specific guidance to Vesper for regeneration.
- All MLS descriptions are double-linted (Vesper internal + final pre-publish check).
- Audit log retained for 5 years.

### 9.3 NAR Settlement / Buyer-Broker Agreement

Post-NAR-settlement (Aug 2024), buyer-side workflows assume a signed buyer-broker representation agreement before showings. ALEVANT's Buyer pipeline gates:
- The "Schedule Showing" action requires `bba_signed_at IS NOT NULL` OR an explicit override checkbox with audit trail.
- Sofia's showing-booking tool checks the same gate.

### 9.4 AI Disclosure

Per state law (CA, NY, others have or are passing AI-bot disclosure rules), Sofia identifies as AI on every conversation:
- Voice: "Hi, this is Sofia, an AI assistant for Thomas Bichi…"
- SMS / DM: same disclosure on first inbound; "AI Assistant" tag in display name where supported.
- Recording consent disclosed where required by state two-party-consent law (CA, FL, etc.).

### 9.5 Data Ownership

The agent owns their workspace data. ALEVANT processes but does not resell. Export-at-any-time capability built in. On workspace termination, data is exportable for 90 days then deleted (configurable).

This is a **strategic differentiator** vs. Zillow-owned Follow Up Boss — ALEVANT advertises agent data ownership in its marketing.

### 9.6 PII / Data Residency

- All PII (contacts, leads, transcripts) stored in Supabase US region.
- Encryption at rest (AES-256 by Supabase).
- OAuth tokens encrypted with column-level encryption beyond Supabase's default (KMS-derived key).
- Voice recordings stored with workspace-scoped Supabase Storage bucket; opt-in retention (default 90 days).

### 9.7 Audit Trails

Every compliance-relevant event is logged:
- Consent grants / revocations
- AI disclosure deliveries
- Fair Housing linter blocks (with content + reason)
- Outbound message attempts (whether sent or blocked)
- TCPA quiet-hour blocks
- BBA gate hits

Retention: 5 years minimum.

---

## 10. INTEGRATION ARCHITECTURE

### 10.1 OAuth Connector Pattern

Every external service follows the same pattern:

```
1. Agent clicks "Connect [Service]" in Onboarding Wizard or Settings
2. ALEVANT redirects to service OAuth consent
3. Service redirects back with authorization code
4. ALEVANT exchanges code for refresh + access tokens
5. Refresh token encrypted (KMS) and stored in workspace_integrations
6. Webhooks subscribed where supported
7. Background poller for non-webhook services
```

### 10.2 Per-Service Specifics

| Service | Auth | Real-time | Notes |
|---|---|---|---|
| Gmail | Google OAuth (Workspace + consumer) | Push subscription via Pub/Sub | Read/send mail, contacts |
| Google Calendar | same | Push subscription | Read/write events |
| Meta (IG/FB) | Meta Business OAuth | Webhook | DM read, post write, Lead Ads ingestion |
| X | OAuth 2.0 | Webhook (Account Activity API) | DM, post |
| TikTok Business | OAuth | Polling fallback | Post + insights |
| LinkedIn | OAuth | Polling fallback | Post + DMs |
| YouTube | Google OAuth | n/a | Upload listing films |
| WhatsApp Business | Meta Cloud API | Webhook | V2 LATAM expansion |
| DocuSign | OAuth + JWT for backend | Connect (webhook) | Envelope events drive Transaction Brain |
| HeyGen | API key | n/a | Avatar video gen |
| AirDNA | Dashboard scrape V1, API V2 | n/a | STR projections |
| KW Command | TBD (waiting on API) | TBD | Stub for now |
| Twilio | Account SID + Token | Webhook | Sofia's number |
| Retell | API key | Webhook | Voice orchestration |
| ElevenLabs | API key | n/a | TTS |

### 10.3 MLS Adapter (Phased)

V1: schema is shaped to absorb MLS data; manual entry only.

V2: integrate one of:
- **MLS Grid** — single contract, ~80% US coverage via RESO Web API
- **Bridge Interactive** — strong Florida coverage
- **Trestle** — also broad coverage

Adapter implements:
- Listing sync (active, pending, sold)
- Photo sync
- Compliance logging (display rules per MLS)
- Rate limiting per MLS

Each MLS still requires per-broker authorization (Bichi authorizes once for his brokerage).

### 10.4 KW Command (Stubbed)

Until KW publishes a partner API:
- Onboarding accepts CSV exports (contacts, listings, transactions)
- Browser automation as fallback (last resort)
- When API drops: workspace_integrations row + standard sync pattern
- Feature-flag gates KW Command UI surface

---

## 11. SECURITY ARCHITECTURE

### 11.1 Auth

- Supabase Auth as primary identity provider
- Email/password + Google OAuth + Apple Sign-In
- 2FA recommended; required for owner/admin roles in Phase 5
- Magic link fallback for partner workflows

### 11.2 Authorization

- Roles per workspace: `owner`, `admin`, `agent`, `viewer`
- Sofia and Vesper run as **system service principals** with workspace-scoped tokens
- Cross-workspace access strictly via service role (admin operations only)

### 11.3 Secrets Management

- All API keys in Vercel environment variables (per environment)
- OAuth refresh tokens encrypted at column level beyond Supabase default
- KMS-derived encryption key rotated quarterly
- Per-tenant API keys (Anthropic etc.) stored encrypted (PRAIX pattern)

### 11.4 Network

- HTTPS everywhere; HSTS enforced
- Webhook endpoints validate signatures (Twilio, Meta, Retell, DocuSign)
- Rate limits per workspace + per IP
- WAF rules at Vercel Edge

### 11.5 PII Minimization

- AI prompts scrub PII when not strictly required (e.g., Vesper post generation gets listing data + persona, not buyer names)
- Voice transcripts auto-redact stored card numbers / SSNs

### 11.6 Penetration Testing

- Annual external pen test (post Phase 5 GA)
- Bug bounty program (post Phase 5 GA)

---

## 12. DEPLOYMENT & INFRASTRUCTURE

### 12.1 Environments

| Environment | Domain | Purpose |
|---|---|---|
| Local | `localhost:3000` | Dev |
| Preview | Vercel preview URLs | Per-PR review |
| Staging | `staging.alevant.ai` | Pre-prod validation |
| Production | `alevant.ai`, `app.alevant.ai`, `*.alevant.ai` | Live |

### 12.2 Vercel Configuration

- `next build --webpack`
- Serverless functions: 60-second execution for AI-heavy routes (Vesper generation), 10-second for standard routes
- Edge runtime for tenant routing middleware
- ISR for microsites (revalidate hourly + on-demand)

### 12.3 Supabase Project

- US-East region (default for pilot)
- Daily backups (Supabase managed)
- Point-in-time recovery (Pro plan)
- Read-replica added at Phase 5 if needed

### 12.4 Monitoring

- Vercel Analytics (performance)
- Sentry (errors)
- Supabase observability (DB perf)
- Custom usage tracker (`api_usage` table — per-workspace AI cost attribution)
- Status page at `status.alevant.ai`

### 12.5 Cron Jobs

| Job | Cadence | Purpose |
|---|---|---|
| Sphere sweep | Every 6 hours | Detect signals, surface right-calls |
| Vesper weekly cadence | Daily 6am ET | Queue weekly content |
| Pre-Con scraper | Daily 4am ET | Refresh tower data |
| Sofia health check | Every 5 min | Verify Twilio + Retell healthy |
| Daily standup generation | Daily 6:30am per agent's TZ | Pre-bake tomorrow's briefing |
| Listing snapshot | Daily | Patterns table for trend analysis |
| Compliance audit export | Weekly | Snapshot for retention |

### 12.6 Disaster Recovery

- RPO: 24 hours (daily backups)
- RTO: 4 hours (Vercel + Supabase failover)
- Tenant export-on-demand always available
- Critical paths (Sofia voice) have circuit breaker + degraded mode (text-only fallback)

---

## 13. PRAIX INHERITANCE MAP

ALEVANT is the architectural sibling of PRAIX. The mapping below documents what's reused vs. what's net-new.

| PRAIX Module | ALEVANT Module | Reuse |
|---|---|---|
| Copilot (NLP CRM) | Sofia (text/voice ISA) | Pattern reused; surface different |
| Research engine | Vesper research + Underwriter comp lookup | Pattern reused |
| Coverage Intelligence | Investor Underwriter (cap rate, BRRRR, STR) | Pattern reused, math swapped |
| SOV / Actuarial | Investor Underwriter sensitivity table | Pattern reused |
| Permit Pull / Construction | Pre-Construction Tracker | Scraper reused |
| Signal Engine (7 algos) | Sphere Brain + Cockpit signals | Direct reuse |
| Email Drafts | Vesper email blasts | Pattern reused |
| Call Mode + Live Coaching | Sofia + Live listing-presentation co-pilot | Pattern extended |
| Presentation Generator (PPTX) | Vesper editorial brochure (PDF) | Pattern reused, output format swapped |
| Morning Digest | Cockpit daily standup | Direct reuse |
| Live Notes (transcription) | Showing notes / voice memos | Direct reuse |
| Native bridge (mobile) | Same — fork RN shell at Phase 5 | Direct reuse |
| Supabase RLS | + workspace_id multi-tenancy | Extended |
| Azure Foundry path | Same | Direct reuse |

The *intent* of inheriting from PRAIX is velocity — every PRAIX-mature pattern that maps cleanly skips a re-design cycle.

---

## Appendix A — Glossary

| Term | Meaning |
|---|---|
| ALEVANT | The platform |
| Sofia | The voice ISA persona |
| Vesper | The AI Marketing Director persona |
| Workspace | A tenant — solo agent / team / brokerage |
| Tenant | Same as workspace |
| Brand Kit | Per-workspace visual + voice identity bundle |
| ISA | Inside Sales Agent — the role Sofia replaces |
| TC | Transaction Coordinator — the role Transaction Brain replaces |
| BBA | Buyer-Broker Agreement (NAR settlement compliance) |
| CMA | Comparative Market Analysis |
| BRRRR | Buy, Rehab, Rent, Refinance, Repeat (investor strategy) |
| ARV | After-Repair Value |
| STR | Short-Term Rental (Airbnb / VRBO) |
| ADR | Average Daily Rate (STR metric) |
| RevPAR | Revenue Per Available Rental |
| FIRPTA | Foreign Investment in Real Property Tax Act |
| 1031 | IRC §1031 like-kind exchange |
| MLS | Multiple Listing Service |
| RESO | Real Estate Standards Organization (RESO Web API standard) |
| IDX | Internet Data Exchange (MLS display protocol) |
| TCPA | Telephone Consumer Protection Act |
| PRAIX | Sibling Tigris Tech Labs product (commercial insurance) |

---

*This document is the architectural source of truth for ALEVANT Phase 0. It evolves with each phase. The next compounding artifact is the implementation of Phase 1 — the Bichi onboarding wizard plus the bichi.miami site rebuild.*
