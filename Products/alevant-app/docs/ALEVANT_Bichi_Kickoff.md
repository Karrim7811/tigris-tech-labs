# ALEVANT — Bichi Kickoff Playbook

**Pilot tenant: Thomas Bichi · Keller Williams Capital Realty · Coral Gables, FL**
**Status: scaffold complete · ready for live activation**

This is the day-by-day runbook to take Bichi from "scaffold ready" to "winning listings with ALEVANT" in 14 days.

---

## Day 0 — Ops setup (no Bichi time required)

Before scheduling Bichi, the ops team provisions third-party accounts and drops creds into Vercel.

**Required accounts**
- [ ] Anthropic API key
- [ ] Supabase project (US East), schema migrated, both migrations applied (`00000000000000_initial_schema.sql`, `00000000000001_billing_and_admin.sql`)
- [ ] Vercel project linked, custom domain pointing to `alevant.ai` + wildcard `*.alevant.ai`
- [ ] Twilio account, default area code 305
- [ ] Retell account
- [ ] ElevenLabs voice picked for Sofia ("warm authority Miami English")
- [ ] HeyGen account (we'll train Bichi's avatar in Day 5)
- [ ] AirDNA dashboard access (V1) or API key (V2)
- [ ] DocuSign developer account, JWT integration key + RSA key registered
- [ ] Stripe account, price IDs created for Agent / Team / Brokerage tiers
- [ ] Google Cloud OAuth client (Gmail + Calendar scopes approved)
- [ ] Meta Business app (Instagram scopes approved — `instagram_content_publish` requires App Review)
- [ ] X Developer app (OAuth 2.0 with PKCE)
- [ ] LinkedIn Marketing Developer Platform app
- [ ] TikTok Business Developer app

**Optional (Phase 4-5 features)**
- [ ] Browserless or Browserbase account for Playwright crawler
- [ ] ATTOM API key
- [ ] Perplexity API key

**Vercel env vars** — copy from `web/.env.example` and fill.

**Domain setup**
- `alevant.ai` → Vercel
- `*.alevant.ai` → Vercel wildcard
- `bichi.miami` → CNAME to Vercel (custom domain on Bichi's workspace)

**Smoke test**
```bash
cd web
pnpm install
pnpm db:migrate
pnpm seed:bichi
pnpm dev
# visit http://localhost:3000 — marketing landing renders
# visit http://localhost:3000/m/bichi/2150-ocean-drive-ph4 — sample microsite renders
```

---

## Day 1 — Bichi onboarding session (90 minutes)

**Prep:**
- Bichi has his KW license number, phone, and a working Gmail account.
- Schedule 10am Miami time. Bichi at his desk, ALEVANT team on Zoom.

**Walkthrough:**
1. Bichi creates account at `alevant.ai/signup`.
2. Walk through the 9-stage onboarding wizard:
   - **Identity** — full name, license, languages (EN/ES/PT), specialties.
   - **Brokerage** — KW Capital Realty, 550 Biltmore Way #PH2, Coral Gables.
   - **Brand kit** — upload his existing logo + headshots, pick palette (we'll iterate post-photoshoot in Day 4), select voice preset *The Insider*.
   - **Connections** — OAuth Gmail, Calendar, Instagram, X, TikTok, LinkedIn.
   - **Sofia** — confirm 24/7, live handoff Mon-Sat 8:30am–6pm, qualification threshold 70.
   - **Sphere** — Gmail import runs in background; Bichi uploads KW Command CSV exports.
   - **Pipeline** — Bichi enters his current 7 listings, 23 buyers, 5 rentals, 3 investor deals.
   - **Marketing** — approval-gated, 1 post/day default, all four social channels enabled.
   - **Compliance** — TCPA + Fair Housing + NAR + AI disclosure + data ownership all signed.
3. Hit **Activate ALEVANT**.

**What happens automatically on activation:**
- Sofia provisioned: local 305 number purchased, Retell agent created, number bound.
- Vesper warmup: 5 sample posts queued for review.
- Sphere Brain runs first sweep.
- Daily standup scheduled for 7am.

**Bichi homework after the session:**
- Forward his cell to Sofia's new number after 6pm and weekends (call-forwarding instructions emailed).
- Email Bichi the live URL `bichi.alevant.ai` (or `bichi.miami` if DNS is propagated).

---

## Day 2 — First Vesper campaign

**Pick Bichi's most photogenic active listing** — likely 2150 Ocean Drive #PH4 ($1.395M penthouse with rooftop view).

1. In the app, navigate to Listings → 2150 Ocean Drive → "Trigger Vesper."
2. Wait ~90 seconds for Opus 4.7 to generate the 12-asset campaign.
3. Review queue at `/vesper`:
   - Listing film script + shot list (Bichi's videographer films from this brief)
   - Photo brief (Bichi's photographer shoots from this)
   - Microsite at `2150-ocean-drive-ph4.bichi.miami` (auto-deployed)
   - Editorial brochure PDF (10 pages)
   - 14 social posts across IG / X / TikTok / LinkedIn
   - MLS description
   - Sphere email + buyer-match outreach to 47 matches
   - Open house invite + whisper preview
   - Press pitch for Mansion Global
4. Bichi approves the IG post first → publishes live to his @thomasbichi account.

**Result:** within 24 hours, Bichi has a luxury-tier marketing campaign for a sub-$2M listing. This is the wedge.

---

## Day 3 — Sofia's first inbound

By Day 3 Bichi will receive his first inbound call to Sofia's number (test-call from the team if no organic call lands).

- Confirm Sofia picks up in <10 seconds.
- Confirm she opens with the AI disclosure.
- Confirm she qualifies and either escalates (push to Bichi's cell) or completes solo.
- Review the transcript in `/sofia` and the auto-created lead in `/inbox`.

---

## Day 4 — Brand photo shoot

- Half-day shoot with Bichi's existing photographer.
- Locations: Brickell rooftop, Coral Gables office, a sold-listing kitchen, a multifamily site visit.
- Output: 30+ headshots / lifestyle / behind-the-scenes — uploaded to Brand Kit.

---

## Day 5 — HeyGen avatar training

- Submit ~3 minutes of Bichi on-camera footage to HeyGen.
- Avatar id stored on workspace metadata.
- First avatar video generated: a 60-second "About Bichi" intro reel for `bichi.miami`.

---

## Day 6-10 — Operating rhythm

**Daily for Bichi:**
- 7:00am — listen to AI Standup in his car
- Throughout day — handle live calls 8:30am-6pm; Sofia handles overflow + after-hours
- Approve Vesper queue (1-2x daily, ~5 minutes total)
- Act on Sphere right-calls (1-3/day suggested)
- Run Underwriter on 3-5 properties for investor clients

**Daily for ALEVANT team:**
- Check Sofia conversation quality; tune system prompt if any qualification is off
- Watch Vesper output for any voice-preset drift
- Watch Fair Housing lint log for false positives or near-misses

---

## Day 11-14 — The Grid goes live

Once we have a Playwright worker running for clerk-of-court crawls:
1. Bichi confirms his farm zones (33131, 33132, 33134, 33139, 33141, 33143).
2. First Grid scan kicks off — 4 hours to fuse public records + score 200-500 properties.
3. `/grid` populates with blazing/hot/warm signals.
4. Bichi works the top 20 — direct mail (Vesper drafts), IG ads (Vesper visuals), agent call scripts (Vesper-generated).

---

## Success criteria — 30 days

| Metric | Day 1 | Day 30 target |
|---|---|---|
| Active listings | 7 | 8-10 |
| Sofia calls handled | 0 | 80+ |
| Sofia qualifications ≥ 70 | 0 | 25+ |
| Vesper posts published | 0 | 90+ (3/day × 30) |
| Microsites live | 0 | 8-10 |
| Grid signals scored | 0 | 500+ in farm zones |
| Investor underwrites run | 0 | 15+ |
| Listings won via ALEVANT marketing | 0 | 1-2 |

---

## Success criteria — 90 days (press window)

| Metric | Target |
|---|---|
| Listings closed via ALEVANT-sourced leads | 3-5 |
| Sofia-to-closing conversion rate | ≥ 6% (industry benchmark for ISA-handled inbound: ~2-4%) |
| Hours saved per week (vs. pre-ALEVANT) | 18-25 |
| Total revenue attributed to ALEVANT-handled leads | $80k-$200k GCI |
| Net Promoter (Bichi → ALEVANT) | ≥ 9 |

If we hit these — pitch Inman, Mansion Global, The Real Deal, WSJ Real Estate. See `ALEVANT_Launch_Plan.md`.

---

*This playbook is the contract between the ALEVANT team and Bichi. Update after each pilot to refine for tenant #2.*
