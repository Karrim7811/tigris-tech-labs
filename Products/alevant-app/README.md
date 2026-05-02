# ALEVANT

**The AI Operating System for Real Estate.**
*alevant.ai*

ALEVANT is a Tigris Tech Labs product — an AI-native CRM, marketing studio, voice ISA, predictive seller-lead engine, and transaction OS purpose-built for residential and small-commercial real estate agents. It replaces the inside sales agent, the marketing director, the transaction coordinator, and the sphere manager with a single multi-tenant platform powered by Claude.

---

## Pilot Tenant

**Thomas Bichi** — Keller Williams Capital Realty, Coral Gables FL. Top KW producer since 2016. Specializes Miami Beach + investor + small commercial multifamily. Sales $200k–$2M, rentals $2k–$10k/mo. New brand domain: `bichi.miami` (planned).

Tagline retained: *"Invest Miami. Live Miami."*

---

## Repository Layout

```
alevant-app/
├── README.md                                # This file
├── docs/
│   ├── ALEVANT_Concept_Brief.md             # Strategic foundation
│   ├── ALEVANT_Technical_Architecture.md    # System architecture, data model, ~60 API routes
│   ├── ALEVANT_Onboarding_Spec.md           # 9-stage agent onboarding wizard contract
│   ├── ALEVANT_Bichi_Kickoff.md             # 14-day pilot runbook
│   ├── ALEVANT_Launch_Plan.md               # Press strategy + launch sequence
│   ├── ALEVANT_Build_Manifest.md            # Comprehensive ops handoff
│   ├── ALEVANT_How_It_Works.html            # Clickable shareable preview
│   └── ALEVANT_Brand_Identity.html          # Brand identity board
├── brand/                                    # Logo SVGs, asset library
├── mobile/                                   # React Native (Expo) shell — fork-from-PRAIX spec
├── web/                                      # Next.js 16 app (multi-tenant SaaS)
│   ├── src/app/                             # Routes, pages, API (~50 endpoints)
│   ├── src/lib/                             # Anthropic, Supabase, OAuth, social, scrapers, brochure, transaction-brain, grid-engine
│   ├── src/components/                      # UI components
│   ├── supabase/migrations/                 # Initial schema + billing/admin
│   └── scripts/                             # Bichi seed + utilities
└── scripts/
```

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind v4 |
| Typography | Cormorant Garamond + Jost |
| Backend | Vercel serverless API routes |
| Database | Supabase Postgres + RLS (multi-tenant via `workspace_id`) |
| AI | Anthropic Claude — Haiku 4.5 default, Sonnet 4.6 synthesis, **Opus 4.7 for Vesper creative** |
| Voice | Retell + Twilio + Claude orchestration + ElevenLabs |
| Avatar | HeyGen (Bichi avatar) |
| Speech-to-text | OpenAI Whisper |
| Web intelligence | Perplexity AI |
| Comps / property data | ATTOM (V2) — public records + scraping V1 |
| Short-term rental data | AirDNA |
| Social | Meta/IG, X, TikTok, LinkedIn APIs |
| e-Sign | DocuSign |
| Email | Gmail API (delegation) |

---

## Two AI Personas

- **Sofia** — Voice ISA. 24/7 with Twilio number. Bichi handles 8:30am–6pm; Sofia covers off-hours and overflow. Strict TCPA stance. Inbound V1, consented-outbound V2.
- **Vesper** — AI Marketing Director. Senior brand creative caliber: cinematic listing films, magazine-tier microsites, multi-channel social campaigns, editorial brochures, press pitches. V1 voice preset: *"The Insider"* (Sotheby's / Aman tier).

---

## The Grid — Predictive Seller-Lead Engine

The residential analog to PRAIX's RiskGrid. Scores every home in agent farm zip codes daily on tenure, equity, distress, life events, and market velocity → composite Motivation Score 0-100. Generates ranked "ready-to-sell" lists with reasoning. Vesper drafts outreach (direct mail, geofenced ads, email, IG DM, agent call scripts). Sofia handles inbound. TCPA + DNC + Fair Housing compliant by construction.

---

## Brand

- **Wordmark:** `alevant` (lowercase, Cormorant Garamond italic 300, brass dot accent on the "a")
- **Primary:** Indigo `#3D4F8C`
- **Accent:** Brass `#B5853E`
- **Surface:** Parchment `#FAFAF8` / Ink `#1A1915`
- See `docs/ALEVANT_Brand_Identity.html` for the full board.

---

## Phase Status

| Phase | Scope | Status |
|---|---|---|
| **Phase 0** | Foundation: brief, brand, architecture, onboarding spec, How-It-Works | ✅ |
| **Phase 1** | Repo scaffold, auth, 9-stage onboarding wizard, cockpit | ✅ |
| **Phase 2** | Lead Inbox, Listings, 4 Pipelines, Underwriter, Sofia text, Vesper studio, Microsite, The Grid | ✅ |
| **Phase 3** | Florida public-records pipeline (Miami-Dade live), Vesper PDF brochure, Twilio + Retell provisioning, Grid scan | ✅ |
| **Phase 4** | DocuSign + Transaction Brain, social publishers (Meta/X/TikTok/LinkedIn), Vesper approve→publish, OAuth router, Sphere signals | ✅ |
| **Phase 5** | Stripe billing, brokerage admin, marketing site (pricing/demo/press), HeyGen avatar, Playwright crawler, mobile RN spec | ✅ |

---

*A Tigris Tech Labs Product · Where real estate intelligence begins.*
