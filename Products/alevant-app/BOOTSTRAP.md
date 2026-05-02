# ALEVANT — Bootstrap Runbook

The full sequence to take ALEVANT from "code committed locally" to "live at alevant.ai with Bichi onboarded." Every step has the exact command or click-path.

**Estimated time:** 6-8 hours of clicking + waiting (most of it waiting on Meta App Review).

---

## Step 0 — install missing CLIs (your machine)

```powershell
# GitHub CLI — for repo creation + secret pushes
winget install GitHub.cli
gh auth login

# Vercel CLI — for deploys
npm install -g vercel
vercel login

# Supabase CLI — for migrations
npm install -g supabase
supabase login

# pnpm (project uses it; npm works too if you prefer)
npm install -g pnpm
```

---

## Step 1 — register domains (~5 min)

Recommended registrar: **Cloudflare Registrar** (at-cost pricing, free DNS).

1. `alevant.ai` — ~$70/yr
2. `bichi.miami` — ~$30/yr
3. After purchase: leave both at Cloudflare nameservers (we'll wire to Vercel below).

---

## Step 2 — provision Supabase (~10 min)

1. Create a new project at https://supabase.com — region **East US (N. Virginia)**.
2. Save these from Project Settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL` (the `https://xxxxx.supabase.co` URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the public anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` (the secret service role key — server only)
3. From Project Settings → Database, copy the connection string for migrations.
4. Push schema (run from `Products/alevant-app/web/`):
   ```powershell
   cd Z:\TigrisTechLabs\Products\alevant-app\web
   supabase link --project-ref <YOUR_PROJECT_REF>
   supabase db push
   ```
   Three migrations apply: initial schema, billing/admin, news/intel.

---

## Step 3 — provision third-party accounts (~2 hours, mostly waiting)

In rough order of how blocking each is:

### Anthropic (5 min)
- Sign up at https://console.anthropic.com → API Keys → create key.
- Save: `ANTHROPIC_API_KEY`.

### Twilio (10 min + A2P 10DLC review later)
- Sign up at https://twilio.com → upgrade to paid (need this for number purchase).
- Save: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`.
- The Sofia provisioning flow purchases a 305-area-code number on first activation.
- Submit A2P 10DLC business registration (required for SMS at scale; ~3-5 day review).

### Retell (10 min)
- Sign up at https://www.retellai.com → API key.
- Save: `RETELL_API_KEY`.

### ElevenLabs (5 min)
- Sign up at https://elevenlabs.io → Studio → pick a voice you like for Sofia.
- Save: `ELEVENLABS_API_KEY`, `ELEVENLABS_DEFAULT_VOICE_ID`.

### OpenAI (Whisper) (5 min)
- Sign up at https://platform.openai.com → API keys.
- Save: `OPENAI_API_KEY`.

### Perplexity (5 min)
- Sign up at https://www.perplexity.ai/settings/api → generate key.
- Save: `PERPLEXITY_API_KEY`.

### HeyGen (10 min)
- Sign up at https://www.heygen.com → API keys.
- Save: `HEYGEN_API_KEY`.

### AirDNA (skippable for V1 — fixtures present)
- Subscribe at https://www.airdna.co → API tier (~$129/mo for entry).
- Save: `AIRDNA_API_KEY`.

### Stripe (15 min)
- Sign up at https://stripe.com → activate (KYC required).
- Create products + prices in Dashboard → Products:
  - **Agent** — $399/mo + $3,990/yr → save 2 price IDs
  - **Team** — $999/mo + $9,990/yr → 2 price IDs
  - **Brokerage** — $4,999/mo + $49,990/yr → 2 price IDs
- Save: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (created in step 6 below), all 6 price IDs.

### DocuSign (20 min)
- Sign up at https://developers.docusign.com → create app with JWT grant.
- Generate RSA keypair, paste public key into DocuSign app.
- Grant impersonation consent (one-time admin click).
- Save: `DOCUSIGN_INTEGRATION_KEY`, `DOCUSIGN_USER_ID`, `DOCUSIGN_ACCOUNT_ID`, `DOCUSIGN_PRIVATE_KEY`.

### Google Cloud (Gmail + Calendar OAuth) (15 min)
- https://console.cloud.google.com → OAuth Client → Web app.
- Authorized redirect URIs:
  - `https://alevant.ai/api/onboard/oauth/gmail/callback`
  - `https://alevant.ai/api/onboard/oauth/gcal/callback`
  - `https://alevant.ai/api/onboard/oauth/youtube/callback`
- Enable Gmail API + Calendar API + YouTube Data API.
- Save: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- Submit for verification if going beyond 100 users.

### Meta Business (Instagram + Facebook) (~2 weeks for App Review)
- https://developers.facebook.com → create app → Business type.
- Add products: Instagram Graph API, Pages API, Lead Ads.
- **Submit for `instagram_content_publish` App Review** — this gates IG posting and takes 1-2 weeks. Submit early.
- Save: `META_APP_ID`, `META_APP_SECRET`.

### X (Twitter) (10 min)
- https://developer.x.com → app with OAuth 2.0.
- Save: `X_CLIENT_ID`, `X_CLIENT_SECRET`.

### LinkedIn (~1 week for partner approval)
- https://www.linkedin.com/developers → Create app → Marketing Developer Platform.
- Apply for **w_member_social** scope (1 week review).
- Save: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`.

### TikTok Business (~1 week)
- https://developers.tiktok.com → app → Content Posting API.
- Save: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`.

---

## Step 4 — push to GitHub (~2 min)

```powershell
cd Z:\TigrisTechLabs\Products\alevant-app

# Option A — keep alevant-app inside the existing tigris-tech-labs monorepo
cd Z:\TigrisTechLabs
git push origin master

# Option B — make alevant-app its own repo (recommended for clean Vercel deploy)
cd Z:\TigrisTechLabs\Products\alevant-app
git init
git add .
git commit -m "Initial commit — ALEVANT"
gh repo create Karrim7811/alevant --private --source=. --remote=origin --push
```

---

## Step 5 — connect Vercel (~5 min)

```powershell
cd Z:\TigrisTechLabs\Products\alevant-app\web
vercel link    # link to the GitHub repo created above
```

In Vercel Dashboard → your alevant project → Settings → Environment Variables, paste every value collected from Step 3 (the `.env.example` has the full list).

Set the framework preset to **Next.js**, root directory to `web/` (if you went with Option A monorepo path: set root to `Products/alevant-app/web/`).

---

## Step 6 — wire webhooks (~10 min)

Each provider needs your prod URL configured.

### Stripe
Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://alevant.ai/api/webhooks/stripe`
- Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.paid`
- Copy signing secret → set `STRIPE_WEBHOOK_SECRET` in Vercel.

### DocuSign Connect
DocuSign Admin → Connect → Add Configuration:
- URL: `https://alevant.ai/api/webhooks/docusign`
- HMAC secret: generate one, save it as `DOCUSIGN_CONNECT_HMAC_SECRET` in Vercel.
- Events: Envelope sent / completed / declined.

### Twilio
Phone number's Voice + SMS webhooks are auto-configured by `/api/sofia/provision` when activation runs — nothing manual.

### Retell
Auto-bound to the Twilio number by `/api/sofia/provision`.

---

## Step 7 — DNS (~10 min + propagation)

In Cloudflare DNS for `alevant.ai`:
- A record `@` → `76.76.21.21` (Vercel)
- CNAME `www` → `cname.vercel-dns.com`
- CNAME `*` → `cname.vercel-dns.com` (wildcard for tenant subdomains)

In Cloudflare DNS for `bichi.miami`:
- CNAME `@` → `cname.vercel-dns.com`
- CNAME `www` → `cname.vercel-dns.com`

In Vercel Dashboard → Domains:
- Add `alevant.ai` (set as production)
- Add `*.alevant.ai`
- Add `bichi.miami` (assign to Bichi's tenant via custom_domain field once seeded)

---

## Step 8 — deploy (~3 min)

```powershell
cd Z:\TigrisTechLabs\Products\alevant-app\web
vercel deploy --prod
```

Or just push to `master` — Vercel's GitHub integration auto-deploys.

---

## Step 9 — seed Bichi (~1 min)

```powershell
cd Z:\TigrisTechLabs\Products\alevant-app\web
pnpm install
pnpm seed:bichi
```

This creates the `bichi` workspace, brokerage, brand kit, Sofia + Vesper configs, sample listings, farm zones, and 3 sample Grid signals.

Then point Bichi's tenant subdomain — in Supabase SQL editor:
```sql
update workspaces set custom_domain = 'bichi.miami' where slug = 'bichi';
```

---

## Step 10 — Bichi's onboarding session

Follow `docs/ALEVANT_Bichi_Kickoff.md` — Day 1 walkthrough is a 90-minute Zoom session. After he completes the 9-stage wizard and hits Activate:
- Sofia provisions a 305 number automatically
- Vesper queues 5 sample posts
- Sphere Brain runs first sweep
- News & Intel runs first scan within 6 hours

---

## Critical reminders

- **Never commit `.env.local`** — `.gitignore` already blocks it.
- **`.env.example` is the source of truth** for what env vars exist — keep it updated.
- **Stripe live keys go in Vercel only** — never local commit.
- **Meta App Review can block launch** — submit Day 1 of Step 3.
- **A2P 10DLC** is required before high-volume SMS — 3-5 day approval, but Sofia can run on a single number for early pilot without it.

---

## Done means

✅ `alevant.ai` loads the marketing landing
✅ `app.alevant.ai` requires login
✅ `bichi.miami` resolves to the Bichi tenant microsite
✅ A test signup completes the onboarding wizard end-to-end
✅ Sofia answers a test call within 10 seconds
✅ Vesper queues a test post when a listing transitions to Active
✅ The Grid scan endpoint returns motivation scores against the Miami-Dade PA API
✅ News & Intel feed populates within 6 hours
✅ Stripe Checkout flow works end-to-end with a test card

When all 9 are true: ship it to Bichi.
