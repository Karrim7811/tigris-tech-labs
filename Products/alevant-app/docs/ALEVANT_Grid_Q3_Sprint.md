# ALEVANT Grid v1.5 — Stub Completion + Outcome Loop Sprint

**Window:** ~6 weeks · target start 2026-05-19 · target ship 2026-06-30
**Owner:** ALEVANT engineering (1 backend + 0.5 scraper specialist + 0.25 product)
**Outcome:** The Grid runs on its *designed* signal surface, not the 30% slice it runs on today. Every Grid score carries an expiration, an MLS-status check, and (going forward) an outcome record when something happens to the property.

This is the *engineering* sprint that has to land before the hazard-model rework (`ALEVANT_Grid_Hazard_Model_Spec.md`) makes sense to start. You can't train a hazard model on data that has no outcomes.

---

## 1. Why this sprint, why now

Reading the live code at `web/src/lib/scrapers/florida/`:

- **Live:** Miami-Dade Property Appraiser adapter, the heuristic scorer (`grid-engine.ts`), the fan-out orchestrator (`florida/index.ts`), the scan API (`api/grid/scan/route.ts`), the Claude reasoning pass.
- **Stubbed:** Clerk-of-court (foreclosure / probate / divorce), Tax Collector (delinquency), Code Enforcement (violations), Broward/Palm Beach/Monroe Property Appraisers, HOA, USPS NCOA.

The three court-filing signals carry weights of 70, 65, 50 inside the distress + life-event components. They are *the heaviest signals in the model* and they currently return empty arrays. The Grid is operating on tenure + equity + absentee for Miami-Dade only.

Beyond stub-completion, three structural gaps must close before the hazard model is even possible:
1. **No outcome capture** — when a flagged property actually lists, the system has no record.
2. **No signal decay** — a foreclosure flag from 2024 looks identical to one from yesterday.
3. **No MLS overlap check** — already-listed properties pollute the recommendation list.

Fix the four, ship Grid v1.5, then the hazard model has a foundation to stand on.

---

## 2. Workstreams

### WS-1 — Clerk of Court (foreclosure / probate / divorce)

**Files:** `web/src/lib/scrapers/florida/clerk-of-court.ts` and per-county sub-adapters.

**Scope:**
- Miami-Dade: `https://www2.miami-dadeclerk.com/cvweb/` — Playwright crawl, search by party-name and by property-address. Filter by case-type code (`FORECLOSURE - RES & COMM HOMESTEAD`, `PROBATE`, `DISSOLUTION OF MARRIAGE`).
- Broward: `https://www.browardclerk.org/` — same pattern; different selectors.
- Palm Beach: `https://applications.mypalmbeachclerk.com/RecordSearch/` — same.
- Monroe: smallest jurisdiction, lowest priority — ship if time permits.

**Approach (one Playwright session per county per scan batch):**
1. Open county portal, dismiss captcha if interactive (manual review queue for now).
2. Search by `party_name` (the property owner from the PA adapter) within a 36-month window.
3. Parse case-type, filing date, case number, parties.
4. Cross-reference filings to the property address via the docket (often listed on the case detail page).
5. Normalize into `CourtFiling[]` per the existing `types.ts` shape.
6. Cache in `florida_court_filings` Supabase table (new, see §3) with `(county, case_number)` primary key. TTL = 48h for re-scan cost control.

**Acceptance criteria:**
- All four functions in `clerk-of-court.ts` (`fetchForeclosureFilings`, `fetchProbateFilings`, `fetchDivorceFilings`, `fetchAllCourtFilings`) return populated data for Miami-Dade and Broward.
- A sample run of 50 known-distressed Miami-Dade properties returns ≥35 with at least one filing detected.
- Rate limited to ≤1 request / 4s per portal (don't get banned).
- Playwright session is reused across the batch (don't re-login per address).
- Errors degrade gracefully — empty filing list, not a thrown exception.

**Out of scope this sprint:**
- HOA-specific filings (some Florida HOAs file in clerk; some via small claims).
- Bankruptcy filings (federal PACER — different system, separate sprint).

---

### WS-2 — Signal TTL and decay

**Files:** schema migration · `lib/grid-engine.ts` · `api/grid/scan/route.ts` · new helper `lib/grid-decay.ts`.

**The problem:** today every `grid_signals` row lives forever and is weighted identically regardless of age. A foreclosure flagged 18 months ago should not score the same as one flagged yesterday.

**Design:**
- Add `effective_at` (when the underlying event happened — e.g. `lis_pendens.filing_date`) and `expires_at` (computed from signal class TTL).
- Per-signal-class TTL config:

```typescript
export const SIGNAL_TTL_DAYS: Record<string, number> = {
  pre_foreclosure:   90,    // NOD → auction window
  probate:           540,   // estate timeline
  divorce:           365,   // dissolution → sale typically <1yr
  tax_delinquent:    180,   // annual cycle
  code_violation:    60,    // compliance window
  absentee_owner:    365,   // slow-moving
  vacant:            180,   // rapid status change
  long_tenure:       730,   // structural
  high_equity:       730,   // structural
};
```

- Scoring engine applies a *recency multiplier* — linear decay from 1.0 at `effective_at` down to 0.0 at `expires_at`. Don't kill the signal at expiry; downweight it.
- Nightly cron `/api/cron/grid-decay` re-scores rows where `expires_at < now()` to either drop them out of the active list or trigger a re-scan to refresh.

**Acceptance criteria:**
- `grid_signals.expires_at` populated on every new row.
- `scoreGridSignal()` accepts an optional `asof: Date` and returns a decay-adjusted score.
- An expired pre-foreclosure flag (>90 days post-filing) drops out of `band="blazing"`.
- Manual override: a workspace admin can extend or clear `expires_at` per signal.

---

### WS-3 — MLS cross-reference filter

**Files:** `lib/mls/` (new) · `api/grid/scan/route.ts` · DB view `vw_grid_actionable`.

**Depends on:** MLS API arriving in "a few weeks" — assume mid-June 2026.

**The problem:** the Grid currently recommends properties that are already listed. Waste of agent attention.

**Design:**
- MLS adapter exposes `getActiveListingByAddress(addr)` and `getRecentExpiredListing(addr, window_days)`.
- During Grid scan, every property is cross-checked:
  - **Currently active listing** → score still computed, but marked `mls_status="active"` and excluded from the agent's actionable list.
  - **Recently expired/withdrawn** (≤180 days) → strong relist signal; *boost* motivation by +15 points.
  - **Recently closed** (≤90 days, sold to someone else) → mark as `mls_status="closed_recent"`; demote.
- New view `vw_grid_actionable` filters: `mls_status NOT IN ('active', 'pending', 'closed_recent') AND motivation_score >= 45`.

**Acceptance criteria:**
- Every `grid_signals` row gets `mls_status`, `mls_last_listed_at`, `mls_last_closed_at` populated when MLS lookup succeeds.
- Dashboard reads from `vw_grid_actionable`, not `grid_signals` directly.
- Recently-expired-listing boost is auditable in `reasons`.

---

### WS-4 — Outcome ingestion (the most strategically important one)

**Files:** schema migration · `lib/grid-outcomes.ts` (new) · webhook handlers in `api/webhooks/mls/` · `api/listings/route.ts`.

**The problem:** today the system makes predictions and never learns from them. Every Grid signal is fire-and-forget. Until outcomes are captured, no hazard model is possible and no ROI evidence exists.

**Design:**

New table `grid_outcomes`:
```sql
CREATE TABLE grid_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  signal_id uuid REFERENCES grid_signals(id),
  property_address text NOT NULL,
  outcome_type text NOT NULL,    -- 'listed' | 'sold_off_market' | 'agent_contacted' | 'agent_won' | 'agent_lost' | 'dead_signal'
  outcome_source text NOT NULL,  -- 'mls' | 'agent_manual' | 'public_records' | 'sphere'
  outcome_date date NOT NULL,
  outcome_value_usd numeric,
  days_from_signal int,          -- derived: outcome_date - signal.refreshed_at
  notes text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON grid_outcomes (workspace_id, outcome_date);
CREATE INDEX ON grid_outcomes (signal_id);
```

**Ingestion paths:**
1. **MLS webhook** — when a new listing matches an existing `grid_signals.property_address`, insert outcome with `outcome_type='listed'`. Daily backfill job to catch missed webhooks.
2. **Public-records re-scan** — when a re-scan detects ownership change (new `owner_name` on the PA record), insert with `outcome_type='sold_off_market'`.
3. **Agent manual** — UI button on each signal: "Contacted", "Won the listing", "Lost it to X", "Dead lead." Writes directly.
4. **Sofia / Vesper integration** — when Sofia calls a Grid lead, write `outcome_type='agent_contacted'` automatically.

**Acceptance criteria:**
- `grid_outcomes` is populated for every flagged property that subsequently lists within 12 months.
- A nightly job computes per-workspace metrics: signals issued, contacted, listed, won, with conversion rates by `band` and by signal class.
- The cockpit UI surfaces *"Your Grid lift this month: 4.2x vs. random selection in the same farm zones."* This is the credibility line that sells the product to other agents.

---

## 3. Schema migrations

One migration file `supabase/migrations/2026_05_19_grid_v1_5.sql`:

```sql
-- Signal decay
ALTER TABLE grid_signals ADD COLUMN IF NOT EXISTS effective_at timestamptz;
ALTER TABLE grid_signals ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE grid_signals ADD COLUMN IF NOT EXISTS engine_version text DEFAULT 'v1.5';

-- MLS cross-ref
ALTER TABLE grid_signals ADD COLUMN IF NOT EXISTS mls_status text;
ALTER TABLE grid_signals ADD COLUMN IF NOT EXISTS mls_last_listed_at date;
ALTER TABLE grid_signals ADD COLUMN IF NOT EXISTS mls_last_closed_at date;
CREATE INDEX IF NOT EXISTS idx_grid_signals_mls_status ON grid_signals (workspace_id, mls_status);

-- Court filings cache (raw source-of-truth before fusion)
CREATE TABLE IF NOT EXISTS florida_court_filings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  county text NOT NULL,
  case_number text NOT NULL,
  case_type text NOT NULL,
  filing_date date NOT NULL,
  party_name text NOT NULL,
  property_address text,
  source_url text,
  fetched_at timestamptz DEFAULT now(),
  UNIQUE (county, case_number)
);
CREATE INDEX ON florida_court_filings (party_name);
CREATE INDEX ON florida_court_filings (property_address);
CREATE INDEX ON florida_court_filings (county, case_type, filing_date DESC);

-- Outcomes
CREATE TABLE IF NOT EXISTS grid_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  signal_id uuid REFERENCES grid_signals(id) ON DELETE SET NULL,
  property_address text NOT NULL,
  outcome_type text NOT NULL CHECK (outcome_type IN (
    'listed','sold_off_market','agent_contacted','agent_won','agent_lost','dead_signal'
  )),
  outcome_source text NOT NULL,
  outcome_date date NOT NULL,
  outcome_value_usd numeric,
  days_from_signal int,
  notes text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON grid_outcomes (workspace_id, outcome_date);
CREATE INDEX ON grid_outcomes (signal_id);

-- Actionable view (post-MLS-cross-ref)
CREATE OR REPLACE VIEW vw_grid_actionable AS
SELECT g.*
FROM grid_signals g
WHERE COALESCE(g.mls_status, 'unknown') NOT IN ('active','pending','closed_recent')
  AND (g.expires_at IS NULL OR g.expires_at > now())
  AND g.motivation_score >= 45;

-- RLS already inherited from grid_signals on the view; recheck explicitly.
ALTER TABLE grid_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY grid_outcomes_workspace_isolation ON grid_outcomes
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = auth.uid()));
```

---

## 4. Sequencing

```
Week 1-2: WS-1 (Miami-Dade clerk) + WS-2 (TTL/decay) + schema migration
          ─────────────────────────────────────────────────────────────
Week 2-3: WS-1 (Broward clerk) + WS-4 schema + agent-manual outcome UI
          ─────────────────────────────────────────────────────────────
Week 3-4: WS-1 (Palm Beach + Monroe) + WS-4 ingestion paths (manual + public-records)
          ─────────────────────────────────────────────────────────────
Week 4-5: WS-3 MLS cross-ref (gated on MLS API delivery) + WS-4 MLS webhook
          ─────────────────────────────────────────────────────────────
Week 5-6: End-to-end validation + cockpit lift dashboard + hardening
```

WS-3 is the only one gated externally. If MLS slips past mid-June, ship WS-1/2/4 as Grid v1.5, fold WS-3 into v1.6.

---

## 5. Definition of done

- A scan of 100 Miami-Dade properties in known-distress zones returns ≥80% with at least one non-stub signal (foreclosure / probate / divorce / tax / code).
- The cockpit Grid view filters out `mls_status='active'` automatically.
- Every signal in `grid_signals` has `expires_at` populated; expired signals don't appear in `vw_grid_actionable`.
- The "Won the listing" button on a signal writes a `grid_outcomes` row and triggers a celebration toast (it matters — agents need the feedback loop too).
- One backfilled month of outcomes exists by ship date, enough to compute a baseline lift number for the cockpit.
- `engine_version='v1.5'` stamped on every new row, so the hazard model rework knows which scores it can compare against.

---

## 6. What's intentionally NOT in this sprint

- Hazard model rework (separate spec, depends on outcome data this sprint creates).
- StreetView visual diffs / multi-modal signals (separate spec).
- Cross-tenant federated learning.
- HOA delinquency adapter.
- Bankruptcy / PACER integration.
- Counties outside FL.
- Senior-owner detection (requires voter-roll licensing).

Resist scope creep. Six weeks to ship v1.5 is the discipline that makes v2 possible.

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Florida clerk portals rate-limit or ban the scraper | Per-portal session reuse, 4s+ throttle, residential proxy if needed, manual captcha queue for first 90 days |
| MLS API delivery slips | WS-3 is independently shippable; v1.5 ships without it |
| Outcome data is sparse in month 1 (model can't learn yet) | Expected and accepted — month 1 is bootstrapping. Hazard model spec assumes 6 months of outcome data minimum. |
| Court-filing parsing breaks when portals change UI | Each per-county adapter has its own selector contract; one breaking doesn't break others. Monitor with synthetic check daily. |
| Legal review of clerk-of-court scraping | These are public records by Florida statute. Document the legal basis in `docs/COMPLIANCE.md` (not yet written) before production scaling. |

---

*Ship v1.5, generate the outcome data, then `ALEVANT_Grid_Hazard_Model_Spec.md` becomes a real project.*
