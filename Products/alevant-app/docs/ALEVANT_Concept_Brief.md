# ALEVANT — Concept Brief

**Tigris Tech Labs**
**Status: Phase 0 — Foundation**
**Pilot: Thomas Bichi (Keller Williams Capital Realty)**

---

## What It Is

ALEVANT is the **AI Operating System for Real Estate** — a single multi-tenant platform that replaces the four most expensive non-agent roles in a producing agent's business:

| Traditional Role | Cost / Year | ALEVANT Replaces With |
|---|---|---|
| Inside Sales Agent (ISA) | $40k–$70k base + commission | **Sofia** — voice + text AI ISA, 24/7 |
| Marketing Manager / Assistant | $50k–$90k | **Vesper** — AI Marketing Director, $10M-tier creative |
| Transaction Coordinator | $40k–$60k or $300–$500/deal | **Transaction Brain** — orchestration + nudge engine |
| Sphere / CRM Manager | $30k–$50k | **Sphere Brain** — life-event detection, right-call surfacing |

A single producing agent paying for ALEVANT replaces $160k–$270k of annual operating cost with a SaaS subscription. The math is brutal in our favor.

---

## The Wedge

We win **Miami investor and luxury-aspirational residential** before we expand. Why this wedge:

1. **Miami = international capital.** LATAM, EU, Canadian buyers funnel through one metro. Multilingual is a massive moat against US-only competitors.
2. **Investor LTV is 4-12x residential.** Investors buy multiple times, refer other investors, demand sophistication (cap rate, BRRRR, STR projections, 1031, FIRPTA) that residential CRMs don't deliver.
3. **Bichi is already there.** 10 years deep, top KW producer since 2016, "Invest Miami – Live Miami" team, Miami Beach South of Fifth specialty. Pilot conditions are ideal.
4. **Pre-construction is Miami-specific.** Towers, deposit schedules, assignment markets, developer reputations. Custom workflow nobody has built.
5. **Aspirational tier.** Bichi sells $200k–$2M but we present him as a $10M+ luxury agent. Marketing punching up the weight class pulls him up the weight class.

**Expansion path:** Miami investor → Miami residential → South Florida → Florida → US Sunbelt → US national.

---

## The Two AI Personas

### Sofia — Voice ISA

A 24/7 professional, warm, Miami-fluent inside sales agent with a Twilio number, vast knowledge of the agent's listings, market, and process. Speaks English V1, Spanish + Portuguese V2.

- **Inbound:** answers calls, texts, IG/X/TikTok/LinkedIn DMs, web chat. Qualifies on the fly. Books showings via the agent's calendar. Hands hot leads to the agent in <60 seconds via push.
- **Outbound (V2):** calls and texts past clients, sphere, expired-listing owners with strict TCPA-compliant consent.
- **Hours:** Bichi takes 8:30am–6pm. Sofia takes 6pm–8:30am and any overflow during the day.
- **Stack:** Retell (voice orchestration) + Twilio (number) + Claude (reasoning) + Whisper fallback + ElevenLabs voice.

### Vesper — AI Marketing Director

A 30-year-veteran-tier brand creative director who has worked on $10M+ Sotheby's / Aman / Four Seasons campaigns — applied to every Bichi listing regardless of price.

**Per listing — automatic deliverables:**
1. Cinematic listing film (60-90s, scripted, shot list, music brief, voiceover)
2. Hero photography brief (light direction, styling, lens recs)
3. Custom listing microsite at `address.alevant.ai` or `address.bichi.miami`
4. Editorial brochure (8–12 page magazine-layout PDF)
5. Multi-channel social campaign (IG / X / TikTok / LinkedIn — 2-week rollout calendar)
6. Email blast to sphere + AI-matched buyers
7. Just-listed / open-house event invite
8. Pre-launch private "whisper" preview to top-50 sphere
9. Press pitch (when listing merits it — WSJ, Mansion Global, The Real Deal)

**Voice preset V1: "The Insider"** — Sotheby's / Aman / restrained, knowing, never over-explains. *"Six bedrooms. The view at sunrise."*

**Cadence:** Approval-gated by default. Each agent can graduate to autonomous posting per channel as trust builds.

---

## Core Modules (V1)

```
Lead Inbox          — multi-source: Gmail, IG/X/TikTok/LinkedIn DMs, phone, web forms
Sofia               — voice + text ISA
Pipelines × 4       — Buyer, Seller, Investor, Rental (all distinct workflows)
Listings            — manual entry V1, MLS adapter ready
Vesper Studio       — per-listing campaigns + weekly content engine
Underwriter         — residential CMA + investor MF (cap rate, BRRRR, STR via AirDNA)
Pre-Con Tracker     — Miami towers, scraped (reusing PRAIX scraper)
Transaction Brain   — DocuSign-aware orchestration + nudges
Sphere Brain        — life-event detection, right-call surfacing
Microsites          — auto-generated per premium listing
Cockpit             — daily AI standup, signal feed, KPIs
```

---

## Multi-Tenant Architecture

ALEVANT is multi-tenant SaaS from day one with a clean upgrade path to enterprise/white-label:

```
WORKSPACE (e.g. "Bichi Team", future: "Compass Miami", "Coldwell Banker Brickell")
  ├── Brand Kit (logo, palette, typography, voice presets)
  ├── Sofia Config (voice, hours, languages, number)
  ├── Vesper Config (brand voice preset, social accounts, posting cadence)
  ├── Members (agent, ISA-replaced-by-Sofia role, TC role, admin)
  └── Data (workspace_id on every row, RLS enforced)
```

Single-tenant enterprise deployment is the architecture's hidden upside — when KW corporate or any major brokerage wants ALEVANT, we deploy a workspace with their brand kit, agent provisioning, and reporting dashboard. The PRAIX Azure Foundry pattern translates here: same Claude orchestration, hosted in their tenant, branded as theirs.

---

## Brand

| Element | Value |
|---|---|
| Master wordmark | `alevant` lowercase, Cormorant Garamond italic 300, brass dot on the "a" |
| Primary | Indigo `#3D4F8C` |
| Accent | Brass `#B5853E` |
| Surface | Parchment `#FAFAF8` / Ink `#1A1915` |
| Typography | Cormorant Garamond (display) + Jost (body) |
| Voice | Restrained, editorial, knowing — never breathless |

**Bichi tenant brand (distinct from ALEVANT chrome):** teal `#0E5560` + sand `#E8DCC4` + brass + ink. KW logo is footer-only "Brokered by Keller Williams Capital Realty."

---

## Phase Plan

### Phase 0 — Foundation (now)
- Strategic brief, technical architecture, onboarding spec
- Brand identity board (`ALEVANT_Brand_Identity.html`)
- Clickable How-It-Works preview (`ALEVANT_How_It_Works.html`)
- Repo scaffold
- USPTO trademark filing draft for ALEVANT

### Phase 1 — Bichi Onboarding & Site Rebuild
- Bichi Onboarding Wizard (the "before-CRM" data capture)
- New Bichi website at `bichi.miami` — Next.js, embedded Sofia chat, instant CMA, investor underwriter
- Domain registration: `alevant.ai` + `bichi.miami`
- Brand asset half-day shoot (Bichi's photographer)
- Gmail + Google Calendar OAuth
- Social handle OAuth (IG, X, TikTok, LinkedIn)
- KW Command CSV import scaffold

### Phase 2 — Core Platform
- Lead Inbox (multi-source ingestion)
- Sofia text ISA with Twilio number provisioning
- 4 pipelines (Buyer / Seller / Investor / Rental)
- Listings module (manual entry + MLS-ready adapter)
- Residential CMA + investor underwriter

### Phase 3 — Sofia Voice + Vesper V1
- Sofia voice (Retell + ElevenLabs + Twilio) with strict TCPA flow
- Vesper for one full listing end-to-end (film, microsite, brochure, campaign)
- HeyGen Bichi avatar
- AirDNA dashboard ingestion

### Phase 4 — Marketing Engine + Transaction Brain
- Vesper for all listings + weekly content cadence
- Transaction Brain with DocuSign integration
- Sphere Brain with LinkedIn/social monitoring
- Pre-construction tracker for Miami

### Phase 5 — Multi-Tenant General Availability
- Workspace provisioning self-serve
- Pricing model
- Press launch
- Brokerage-tier sales motion

---

## Strategic Differentiators (vs. competitive landscape)

| Capability | Follow Up Boss | kvCORE / Lofty | Sierra Interactive | **ALEVANT** |
|---|---|---|---|---|
| AI ISA (text) | Plug-in 3rd party | Plug-in | Plug-in | **Native, Claude-grade** |
| AI ISA (voice) | No | No | No | **Native** |
| AI Marketing Director | No | Templates only | No | **Native, $10M-tier** |
| Investor underwriting | No | No | No | **Native** |
| Pre-construction (Miami) | No | No | No | **Native** |
| Multilingual (ES/PT) | No | Partial | No | **Phase 2 native** |
| Listing microsites | Add-on | Add-on | Yes (templated) | **Native, magazine-tier** |
| Transaction Brain | Basic | Basic | Better | **AI-orchestrated** |
| Owner-of-data | Zillow-owned | Inside RE-owned | Independent | **Agent-owned** |
| Architecture | Legacy | Legacy | Modern-ish | **AI-native, multi-tenant SaaS** |

The "Zillow owns Follow Up Boss" wedge is real — every non-Zillow brokerage is currently nervous about routing their leads through a portal-owned CRM. ALEVANT positions as **the agent-owned, AI-native, neutral alternative.**

---

## What "Blowing the Industry" Looks Like

The shape of victory at 12 months:

- Bichi closes 2x his prior year volume on the same effort.
- ALEVANT generates the *Inman* feature: *"How a Miami agent tripled production with an AI ISA."*
- 50–100 agents are on the waitlist within 30 days of the press hit.
- KW corporate, Compass, Douglas Elliman, The Agency request enterprise demos.
- We ship multi-tenant GA, charge $399–$799/agent/mo, and the conversion of waitlist becomes the revenue ramp.

---

*This brief is the strategic foundation for the alevant-app product. It compounds: every artifact in `docs/` should be readable in isolation but coherent with this brief.*
