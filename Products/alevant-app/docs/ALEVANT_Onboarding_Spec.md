# ALEVANT — Agent Onboarding Wizard Specification

**Purpose:** A structured, single-session onboarding wizard the agent (V1: Thomas Bichi) completes **before** ALEVANT activates. Captures every piece of data, credential, and brand input the platform needs so Sofia, Vesper, and the CRM can run autonomously from minute one.

**Design principle:** The wizard is the agent's only "manual data entry" experience with ALEVANT. After this, every interaction is conversational, AI-mediated, or auto-imported.

**UX target:** 25–40 minutes one-time. Save-and-resume. Mobile-friendly. Branded as a luxury onboarding (this is the agent's first impression — it must feel earned).

---

## Wizard Structure — 9 Stages

Each stage saves progressively. Stage gates: `1 → 2 → ... → 9 → ACTIVATE`.

### Stage 1 — Welcome & Identity

**Purpose:** Capture core agent identity and authenticate the workspace owner.

| Field | Type | Required | Notes |
|---|---|---|---|
| Legal first name | text | yes | for documents |
| Legal last name | text | yes | for documents |
| Preferred display name | text | yes | "Thomas Bichi" |
| Title | text | yes | "Realtor® / Team Lead" |
| Email | email | yes | OAuth-bound |
| Mobile phone (cell) | phone | yes | for personal handoff from Sofia |
| Year started in real estate | number | yes | for bio/positioning |
| Specialties (multi-select) | enum | yes | Residential / Investor / Luxury / New Construction / Rentals / Commercial / Multifamily / Pre-Construction / Foreign Buyers / Vacation / 1031 |
| Languages spoken | multi-select | yes | EN / ES / PT / FR / IT / Other |
| Years at current brokerage | number | yes | |
| Awards / recognitions | textarea | optional | freeform list, AI parses for press use |

**System action on stage complete:** Provision Supabase auth user, create workspace, assign owner role, generate workspace slug (e.g. `bichi`).

---

### Stage 2 — Brokerage & License

**Purpose:** Compliance-required brokerage data and licensing.

| Field | Type | Required | Notes |
|---|---|---|---|
| Brokerage name | text | yes | "Keller Williams Capital Realty" |
| Brokerage address | text | yes | "550 Biltmore Way #PH2, Coral Gables, FL 33134" |
| Brokerage phone | phone | yes | KW office number |
| Office email | email | optional | |
| Real Estate License # | text | yes | required for some integrations |
| License state(s) | multi-select | yes | FL primary, others optional |
| MLS membership(s) | multi-select | yes | Miami MLS, MLS of South FL, etc. |
| Team name | text | optional | "Invest Miami – Live Miami" |
| Team members | repeatable | optional | name + role + email — for future expansion |
| Brokerage logo upload | file | yes | for "Brokered by" footer placement |
| Brokerage compliance email (for audit copies) | email | optional | |
| KW Command username | text | optional (V1) | held until Command API drops |

**System action:** Validate license format, geocode brokerage address, create brokerage entity in `workspaces.brokerage_id`.

---

### Stage 3 — Personal Brand Kit

**Purpose:** Capture every brand asset and decision Vesper needs to generate magazine-tier creative.

#### 3a. Logo & Wordmark
- Personal logo (SVG preferred, PNG fallback) — file upload
- Wordmark text — what does the agent want spelled out? ("Bichi" / "Thomas Bichi" / "Invest Miami")
- Tagline — text ("Invest Miami. Live Miami.")
- Logo lockup variants — vertical / horizontal / monogram (we generate if not provided)

#### 3b. Color Palette
Pre-loaded suggestions per archetype (luxe Miami / coastal / urban / classic). Agent picks or customizes:
- Primary color (hex)
- Secondary color (hex)
- Accent color (hex)
- Surface / background (hex)
- Text / ink (hex)

**Bichi default suggestion (Phase 1):** Teal `#0E5560` / Sand `#E8DCC4` / Brass `#B5853E` / Parchment `#FAFAF8` / Ink `#1A1915`.

#### 3c. Typography
- Display font (default: Cormorant Garamond, agent can pick from 12 curated alternatives)
- Body font (default: Jost, agent can pick from 12 curated alternatives)

#### 3d. Photography
- Headshots — 3-10 file uploads
- Lifestyle / on-camera photos — 5-30 file uploads
- Drone / b-roll footage — multi-file upload
- Logo / brand b-roll — multi-file upload
- **Stock-photo prohibition toggle** — when on, Vesper will refuse to use stock photography in any generated asset. Default: ON.

#### 3e. Video & Voice
- IG video URLs (paste up to 10) — for AI to learn agent's on-camera voice/style
- TikTok video URLs (paste up to 10)
- YouTube channel URL (if any)
- Voice sample upload (optional, .m4a/.mp3, 30-90 seconds) — used to train HeyGen avatar voice clone *only with explicit consent*
- HeyGen avatar consent toggle (yes/no, with full disclosure copy)

#### 3f. Brand Voice
**Vesper voice preset** — agent picks one (with sample copy preview side-by-side):
- **The Insider** — Sotheby's / Aman tier (recommended for luxury aspirational) — *"Six bedrooms. The view at sunrise."*
- **The Storyteller** — Compass / T&C tier — *"She wakes to the bay. Coffee on the terrace before the city stirs."*
- **The Authority** — The Agency / Mauricio Umansky tier — *"Highest sale per sq ft in the building, 2026 YTD."*
- **The Local Legend** — warm Miami insider — *"From the team that closed 11 transactions on Brickell this year."*

Plus: 5 sample posts in chosen voice — agent rates 1-5. Vesper calibrates.

**Bichi V1 default:** The Insider.

---

### Stage 4 — Connected Accounts (OAuth)

**Purpose:** Authorize ALEVANT to read/write across the agent's tools.

Each connection is a one-click OAuth flow with clear scope disclosure.

| Service | Scope | Required for | Status |
|---|---|---|---|
| **Gmail** (Google Workspace OAuth) | read.threads, send.email, read.contacts | Lead intake, sphere import, Sofia email replies | **Required V1** |
| **Google Calendar** | read.events, write.events | Showing booking, appointment sync | **Required V1** |
| **Instagram (Meta Business)** | read.dms, write.posts, read.insights | Sofia DMs, Vesper posting | **Required V1** |
| **Facebook Business Page** | write.posts, read.insights | Vesper posting + Lead Ads ingestion | Optional |
| **X (formerly Twitter)** | read.dms, write.posts | Sofia DMs, Vesper posting | **Required V1** |
| **TikTok Business** | write.posts, read.insights | Vesper posting | **Required V1** |
| **LinkedIn** | read.messages, write.posts | Sofia DMs, Vesper posting | **Required V1** |
| **YouTube (Google)** | write.uploads | Vesper listing films | Optional |
| **WhatsApp Business** | read.messages, write.messages | Sofia (LATAM), V2 | Optional |
| **DocuSign** | read.envelopes, write.envelopes | Transaction Brain | **Required V1** |
| **KW Command** | held — API not public | KW transaction sync (V2 once API drops) | Stub |
| **HeyGen** | API key | Bichi avatar generation | Optional V1 |
| **Twilio** *(provisioned by ALEVANT, not user)* | n/a | Sofia phone number | Auto-provisioned |

**System action per connection:** Store OAuth refresh tokens in Supabase `workspace_integrations` (encrypted at rest), create webhook subscriptions where supported (Gmail push, IG webhooks).

---

### Stage 5 — Phone & Sofia Configuration

**Purpose:** Provision Sofia and configure handoff rules.

| Setting | Default | Customizable |
|---|---|---|
| Sofia phone number | Auto-provisioned local Miami area code via Twilio | yes |
| Sofia voice (gender + accent) | Female, neutral US-English warm | yes (10 voice samples) |
| Sofia name | "Sofia" | yes |
| Languages enabled | English V1; ES/PT V2 | yes |
| Active hours | 24/7 | per-day customizable |
| Live handoff to agent | Mon-Fri 8:30am–6:00pm; Sat-Sun off | yes |
| Handoff method | Push notification + ringthrough to agent's cell | yes (SMS / email / Slack alternatives) |
| Handoff threshold | "Hot lead" only (qualification score ≥ 70) | yes |
| Voicemail behavior outside hours | Sofia handles full conversation | yes |
| Greeting script | Auto-generated from brand voice | reviewable + editable |
| Closing / disclaimer | TCPA-compliant; auto-generated per state | reviewable, *not bypassable* |

**Bichi V1:** Sofia 24/7. Live handoff Mon-Sat 8:30am–6pm. Sofia handles all overflow.

---

### Stage 6 — Sphere & Lead Database Import

**Purpose:** One-time import of the agent's existing book.

#### 6a. Gmail-derived sphere
With Gmail OAuth granted in Stage 4, ALEVANT scans the agent's last 36 months of mail:
- Extracts contacts with ≥3 conversations
- AI-classifies each as: Past Client / Active Client / Sphere / Vendor / Personal / Other
- Estimates relationship strength (0–100 score)
- Surfaces for agent review in batches of 50 — agent confirms/rejects/recategorizes

#### 6b. KW Command export
Manual CSV upload (until API). Standard fields auto-mapped via Claude:
- Contacts CSV (name, email, phone, source, status, notes)
- Listings CSV (active/sold/expired)
- Transactions CSV (closed deals + commissions)

#### 6c. Manual additions
Agent can add: VIP investors, top-50 sphere, deals-not-in-Gmail, off-market relationships.

**System action:** Dedupe across sources, normalize phone/email, geocode addresses, build `contacts`, `past_clients`, `sphere_relationships`, `historical_deals` tables (workspace-scoped).

---

### Stage 7 — Active Pipeline Capture

**Purpose:** Snapshot the agent's *current* live business so Day 1 isn't a blank slate.

#### 7a. Active Listings (manual entry until MLS API)
Per listing:
- Address
- Price
- Property type (Condo / SFH / Townhouse / Multifamily / Land / Commercial)
- Beds / baths / sq ft / lot
- Year built
- HOA fees / taxes
- Listing date / expiration
- Status (Active / Pending / Under Contract)
- MLS # (if applicable)
- Photos (drag-drop)
- Existing marketing materials (PDFs, brochures)
- Showing instructions
- Seller contact (name, email, phone, motivation, timeline)

**Or:** Paste a Zillow / Realtor.com / Compass URL — Vesper scrapes and pre-fills (uses PRAIX scraper).

#### 7b. Active Buyers
Per buyer:
- Name + contact
- Buying budget range
- Timeline (urgent / 1-3mo / 3-6mo / 6+mo)
- Pre-approval status + lender
- Property criteria (beds, baths, sq ft, location, must-haves, dealbreakers)
- Buy-side: primary residence / investment / vacation
- Investor flags (cap rate target, IRR target, asset class preference)
- Buyer-broker agreement signed (yes/no/expires-when)

#### 7c. Active Rentals
- Renter name + contact
- Budget / month
- Lease term sought
- Occupants / pets
- Move-in target date
- Pre-qualification status

#### 7d. Active Investor Deals
- Subject property address
- Deal type (acquisition / 1031 exchange / development / assignment)
- Investor name + entity
- Equity available / financing structure
- Deal stage (sourcing / underwriting / LOI / contract / due diligence / close)
- Cap rate target

#### 7e. Pre-Construction Watchlist
- Towers/projects of active interest (multi-select from auto-curated Miami list, with manual add)
- Per project: assigned investors, deposit timing, expected delivery

**System action:** Create pipeline entities, generate initial Sphere Brain matches (which buyers go with which listings, which past clients are renewal-anniversary candidates).

---

### Stage 8 — Marketing Defaults

**Purpose:** Set Vesper's posting cadence, approval rules, and channel priorities.

| Setting | Default | Customizable |
|---|---|---|
| Default cadence | 1 post/day across active channels | per-channel |
| **Approval mode** | Approval-gated (agent reviews each post before publishing) | yes — can graduate to autonomous per channel |
| Approval window | 4 hours from generation; auto-discard if not approved | yes |
| Per-listing campaign trigger | Auto-generated 12-asset campaign within 24h of listing going active | yes |
| Channel priorities (V1) | IG > LinkedIn > X > TikTok | yes |
| Story / Reel / Post mix | 40% / 30% / 30% | yes |
| Hashtag strategy | AI-curated per post (location, asset class, lifestyle) | reviewable |
| Watermark on all visuals | Agent logo + KW footer | yes |
| Music library (for video) | Royalty-free curated by Vesper | yes |
| Geo-targeting (where supported) | Miami metro + agent-defined feeder markets | yes |
| Audience targeting | Auto from Vesper's brand voice + listing context | yes |
| Cross-posting de-dupe | On (won't post identical content across channels) | yes |
| **Fair Housing linter** | **Strict mode** — refuses to post copy with protected-class language | not bypassable |

**Bichi V1:** Approval-gated. 1 post/day per active channel. Cadence dynamically increases per active listing (a new $1M listing might get 5 posts in week 1 across 4 channels).

---

### Stage 9 — Compliance & Activation

**Purpose:** Final compliance gates and platform activation.

#### 9a. TCPA / CAN-SPAM Acknowledgment
- Agent explicitly acknowledges: ALEVANT will never send AI-initiated SMS or calls without verified prior express written consent. Agent confirms their lead-source consent practices (free-text describe + checkbox).

#### 9b. Fair Housing Acknowledgment
- Agent acknowledges Fair Housing Act compliance and that all generated content is auto-linted for protected-class violations.

#### 9c. NAR Settlement / Buyer-Broker Acknowledgment
- Agent acknowledges all buyer-side workflows assume a signed buyer-broker representation agreement before showings (post-NAR settlement compliance).

#### 9d. AI Disclosure Preferences
- Sofia call/text disclosure: "Hi, this is Sofia, an AI assistant for Thomas Bichi" — required by some state laws. Agent confirms enabled (default ON, recommended ON).
- HeyGen avatar disclosure: when avatar appears in video, on-screen text says "AI-generated representation" (default ON, can be toggled with legal counsel review).

#### 9e. Data Ownership Confirmation
- Agent owns all data. ALEVANT processes but does not resell. Confirmed by checkbox.

#### 9f. Brokerage Authorization
- For team workspaces: brokerage compliance officer's sign-off (email confirmation flow). For solo agent V1 (Bichi): self-attest.

#### 9g. Activation
- "Activate ALEVANT" button.
- Triggers: Sofia number provisioning, Vesper warm-up (generates first 5 posts for review), Sphere Brain initial sweep, daily AI standup scheduled, welcome call from human onboarding lead.

---

## Post-Activation: Day 1 Experience

Within 60 seconds of activation:
1. Sofia goes live on the new Twilio number.
2. Vesper queues 5 sample social posts for agent approval.
3. Sphere Brain runs first sweep → surfaces 5–10 "right call today" recommendations.
4. Daily AI Standup is scheduled for 7:00am next day.
5. Custom microsite generated for any Active Listings entered in Stage 7.
6. Agent receives welcome video from Bichi-style avatar (until they add their own).

---

## Data Model — Onboarding Tables

```
workspaces (id, slug, name, owner_user_id, brokerage_id, brand_kit_id, sofia_config_id, vesper_config_id, plan, created_at)
brokerages (id, name, address, phone, email, license_state, mls_memberships, brokerage_logo_url)
brand_kits (id, workspace_id, primary_color, secondary_color, accent_color, surface_color, ink_color, display_font, body_font, logo_url, wordmark_text, tagline, voice_preset, photography_style)
sofia_configs (id, workspace_id, twilio_number, voice_id, name, languages_enabled, hours_json, handoff_rules_json, greeting_script, disclaimer_script)
vesper_configs (id, workspace_id, voice_preset, channel_priorities, cadence_json, approval_mode, approval_window_minutes, fair_housing_strict)
workspace_integrations (id, workspace_id, service, oauth_refresh_token_encrypted, scopes, connected_at, status)
brand_assets (id, workspace_id, type [logo|headshot|lifestyle|drone|video|voice_sample], url, metadata_json, consent_for_avatar_training boolean)
agents (id, workspace_id, user_id, role, full_name, license_number, languages, specialties, awards, bio_text)
contacts (id, workspace_id, name, emails[], phones[], category, relationship_score, source, last_touch_at, notes)
listings (id, workspace_id, agent_id, address, price, type, beds, baths, sqft, status, mls_number, photos[], seller_contact_id, marketing_materials[], showing_instructions)
buyers (id, workspace_id, agent_id, contact_id, budget_min, budget_max, timeline, preapproval_status, criteria_json, type, investor_flags_json, bba_signed_at)
rentals (id, workspace_id, agent_id, contact_id, budget_per_month, lease_term, move_in_target, occupants_json)
investor_deals (id, workspace_id, agent_id, subject_property, deal_type, investor_id, equity_available, stage, cap_rate_target)
preconstruction_watchlist (workspace_id, project_id, assigned_investor_ids[])
compliance_acknowledgments (workspace_id, type, acknowledged_at, ip_address, version)
```

---

## Implementation Notes

- **Tech:** Next.js wizard at `/onboard/[stage]`. State persisted on each step via `POST /api/onboard/save`. Resume token sent via email if abandoned.
- **Validation:** Zod schemas per stage. Server-side enforced.
- **AI assists:** Stage 6 (Gmail sphere classification), Stage 7 (Vesper URL-scrape pre-fill), Stage 3f (voice preset sample copy).
- **Mobile:** Same flow, single-column, file uploads via mobile camera.
- **Branding:** Wizard itself uses ALEVANT chrome (indigo + brass + parchment) — *not* the agent's tenant brand. The tenant brand activates only inside the post-activation app.
- **Time-to-complete target:** 25–40 minutes. Save-and-resume from any stage.
- **Phase 1 deliverable:** Wizard implemented end-to-end. Bichi runs through it. Output is the seed for everything ALEVANT does after.

---

*This spec is the contract between Bichi (and every future agent) and ALEVANT. The wizard's quality determines the platform's quality from minute one.*
