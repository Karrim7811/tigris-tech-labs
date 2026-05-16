# ALEVANT Grid v3 — Multi-Modal Signals Spec

**Premise:** Public-records data (property appraiser + clerk of court + tax collector + code enforcement) is **commodity**. CoreLogic, ATTOM, and DataTree sell the same information to every CRM. If the Grid stops at public records, it has no durable moat — any well-funded competitor catches up in 18 months.

The moat is **multi-modal signal fusion**: pulling in dimensions that no real-estate CRM currently uses and feeding them through Claude into a coherent recommendation. Permits, utilities, visual signals from StreetView, business filings, voter rolls, rate-lock economics, MLS saved-search overlap. Each one alone is marginal. Stacked, they are unbeatable.

**Status:** Specification. **Prerequisite:** Grid v2 hazard model is in production (`ALEVANT_Grid_Hazard_Model_Spec.md`) — adding signals to a calibrated framework is principled; adding them to a heuristic is just heuristic-stacking.

**Target ship:** Phase 1 signals (permits, business filings, voter rolls) by 2027-Q2. Phase 2 (StreetView, utilities) by 2027-Q3. Phase 3 (social, MLS-overlap) by 2027-Q4.

---

## 1. Mission and frame

Every signal added to the Grid must clear three bars:

1. **Lift bar** — adds measurable AUC or top-decile lift in shadow evaluation against v2's baseline. No signal ships because it "feels useful." If it doesn't move the calibration curve, it doesn't ship.
2. **Privacy/Fair Housing bar** — the signal class has been audited for proxy risk and has documented mitigations. Some signals (school enrollment, surname) are deliberately *not* on this list because the legal cost outweighs the lift.
3. **Operational bar** — the source can be refreshed at a cadence that matches the signal's natural frequency. A signal that only refreshes quarterly cannot drive 90-day predictions.

The discipline is *not* "more signals." It's "more signals where each one carries its weight, with audit defensibility, where the marginal lift justifies the maintenance cost."

---

## 2. Signal catalog

Twelve signal classes evaluated. Ranked by *expected lift × buildability ÷ legal risk*.

| # | Signal class | Lift hypothesis | Source | Refresh | Build cost | Legal risk | Phase |
|---|---|---|---|---|---|---|---|
| 1 | **Building / renovation permits** | Renovation = staying-and-investing OR fluffing-to-sell. Sub-features distinguish (kitchen reno >$50k = sell; pool addition = stay). | County building departments | Daily | Low | Low | **1** |
| 2 | **Business / LLC filings** | LLC dissolution = liquidation event. LLC ownership = investor dynamics differ from owner-occupant. | FL Sunbiz (public, free, scrapable) | Daily | Low | Low | **1** |
| 3 | **Voter-roll changes** | Voter dropped from active roll at this address = recently moved out (vacancy precursor). Newly registered at a different address = move-out confirmed. | FL state voter file (public, ~$5 fee) | Monthly | Low | Medium | **1** |
| 4 | **Mortgage-rate gap** | Owner refi'd at 3.0% in 2021 → rate-lock effect; very unlikely to sell at 7%+. Acts as a *negative* hazard predictor. | Public mortgage records (already partly captured) | Quarterly | Low | Low | **1** |
| 5 | **Cross-litigation party** | Owner appears as party in unrelated lawsuits = financial stress signal beyond foreclosure. | Clerk-of-court (enrichment of existing) | Weekly | Medium | Low | **1** |
| 6 | **StreetView visual diffs** | YoY image diff via Claude vision: visible deterioration → distress; visible upgrades → staying. | Google StreetView Static API + Claude vision | Yearly (StreetView refresh rate) | Medium | Low | **2** |
| 7 | **Utility activity** | Disconnected utilities = vacancy stronger than NCOA. Recent reconnect = pre-listing prep. | Municipal utility records (varies per city, mostly regulated) | Monthly | High | Medium | **2** |
| 8 | **USPS NCOA** | Mail forward = move signal. Industry standard. | USPS NCOA via licensed vendor (~$5k/yr) | Weekly | Low | Low | **2** |
| 9 | **MLS saved-search overlap** | Property owner is *searching* for their next home on MLS = listing imminent. | MLS partner data (locked behind agreements) | Real-time | High | Medium | **3** |
| 10 | **Social: LinkedIn job changes** | New job in new metro = move signal. Public LinkedIn data only, no scraping. | LinkedIn API w/ user consent or third-party licensed feeds | Weekly | High | High | **3** |
| 11 | **Social: IG / TikTok renovation/move tags** | Public posts mentioning "moving," "selling," renovation milestones. | Compliant social listening (Meta API + curated) | Daily | High | High | **3** |
| 12 | **Death index** | Most owner-death triggers go through probate (already captured) but probate filing lags 2-12 months. Social Security Death Master File catches it earlier. | DMF via licensed vendor | Weekly | Low | Medium | **2** |

Signals deliberately *not* on this list (reasons in §5):
- Census-tract demographics
- Surname-based ethnicity inference (for features; only used for *testing* in fairness CI per Grid v2)
- School enrollment data
- Granular within-zip geography
- Credit-score adjacent data (PRAIX would; ALEVANT will not)

---

## 3. Build order with rationale

### Phase 1 — Cheap, public, low legal risk (Q2 2027)

These four ship together because they're each a self-contained scraper following the same Playwright + Supabase-cache pattern as Grid v1.5's clerk-of-court adapters. Estimated 8-10 weeks of one engineer.

- **Permits** — county building department portals. Same pattern as code enforcement. Per-county Playwright. Cache `florida_permit_filings` table.
- **Business filings** — FL Sunbiz has searchable web UI; some bulk download tiers. Cache `florida_business_filings`.
- **Voter-roll** — one-time annual purchase of the state file from FL Division of Elections (~$5/county). Bulk load, then monthly delta. Cache `florida_voter_file`.
- **Rate-gap** — derive from existing mortgage records + FRED 30-yr fixed rate series. Pure computation; no new scraping.
- **Cross-litigation** — enrichment query against the existing court-filing cache. No new source.

Each signal becomes a feature in the v2 hazard model. Each one is independently shadow-evaluated for lift. If a signal doesn't add measurable AUC, it stays in the data store but doesn't ship to the model.

### Phase 2 — Higher cost, higher signal (Q3 2027)

- **StreetView visual diffs** — for every flagged property, pull current StreetView image + the most recent prior year. Claude Vision (Sonnet) prompted: "Describe visible changes between these two images. Categorize: deterioration / renovation / no change / not comparable." Output is a structured rating + confidence. Costs roughly $0.003/property/year. For Bichi's farm of 20k properties: ~$60/year — trivial.
- **USPS NCOA** — license through a vendor (Melissa Data, Anchor Computer). $3-5k/year for ALEVANT's scale.
- **Utility activity** — per-city, varies wildly. Some cities (Miami Beach, Tampa) publish disconnect logs; most require records requests. Start with the 5 highest-listing-density cities only.
- **Death Master File** — license through a vendor (Inteletech, AccurateAppend). $2-5k/year.

### Phase 3 — Strategic but operationally complex (Q4 2027 and beyond)

- **MLS saved-search overlap** — depends on which MLSs ALEVANT has signed data agreements with and whether those agreements permit consumer-side searches as inputs to other agents' tooling. **Highest lift of any signal on the list**, but the legal posture is delicate. Treat as a competitive moat unlock, not a Phase 1 deliverable.
- **LinkedIn job changes** — requires either a licensed feed (expensive, six-figure annual contracts) or explicit user consent flows. Build the consented-data option first: agents whose sphere contacts have opted-in via the ALEVANT relationship-management UI.
- **IG / TikTok renovation/move tags** — Meta Graph API + compliance review. Limited to *public* posts, *opted-in* sphere accounts, never bulk scrape. Heavy operational lift for moderate signal.

---

## 4. Architecture — how new signals plug in

The Grid v1.5 orchestrator already has the right shape:

```
fuseAddressSignals({ address, zip, county, ... }) →
  Promise.all([
    property,
    court_filings,
    tax,
    code_enforcement,
    str_market,
  ])
  → FusedSignal
  → fusedToGridInputs
  → scoreGridSignal / hazardModel.predict
```

New signal classes extend this shape:

```typescript
// New, in lib/scrapers/florida/types.ts
export interface PermitRecord { ... }
export interface BusinessFiling { ... }
export interface VoterRollSnapshot { ... }
export interface VisualDiff { rating: 'deterioration' | 'renovation' | 'no_change' | 'not_comparable'; confidence: number; vision_notes: string; }

export interface FusedSignal {
  property: PropertyRecord;
  tax?: TaxRecord;
  court_filings: CourtFiling[];
  code_enforcement: CodeEnforcementRecord[];
  // Phase 1 additions
  permits?: PermitRecord[];
  business_filings?: BusinessFiling[];
  voter_snapshot?: VoterRollSnapshot;
  rate_gap?: { current_rate: number; estimated_owner_rate: number; gap_bps: number };
  // Phase 2 additions
  visual_diff?: VisualDiff;
  utility_status?: { is_connected: boolean; last_change_at: string };
  ncoa?: { has_mail_forward: boolean; forwarded_at?: string };
  // ...
  fetched_at: string;
}
```

Each new source is one adapter file. Each one has its own cache table with TTL. Failures degrade gracefully (`.catch(() => undefined)`) — a missing utility-status doesn't kill a Grid scan.

**Key architectural decision:** signals are stored *raw* in their cache tables, with feature engineering happening at `fusedToGridInputs` time. This means:
- Reprocessing historical data is possible without re-fetching from the source.
- Feature definitions can evolve (the hazard model rev'd from v2.0 to v2.1) without re-scraping.
- Point-in-time correctness (Grid v2's central rule) is enforceable — every cache row carries `fetched_at` and represents the source's state at that moment.

---

## 5. Privacy and Fair Housing guardrails per signal class

This is where most CRM-AI projects get themselves in trouble. The guardrails are signal-specific:

### Low-risk signals (Phase 1)
- **Permits, business filings, voter-roll, rate-gap, cross-litigation:** all are official public records by statute. Privacy posture: *we are using data that the citizen explicitly accepts is public.* The Fair Housing concern is whether the *learned model* uses these as proxies — handled in the hazard model's fairness CI (Grid v2 §7). Treatment: no special handling, but the fairness audit must continue to pass.

### Medium-risk signals (Phase 2)
- **StreetView visual diffs:** the visual content is publicly visible. The risk is *what Claude Vision returns*. Claude must be instructed to describe *the property's physical condition*, never *the people in or near the image* (and Google StreetView blurs faces, but never lean on that). Prompt-engineering constraint: structured output only, with explicit rejection if any human is described.
- **USPS NCOA:** licensed product, governed by USPS data-use agreement. Standard real-estate-industry use; well-trodden compliance path.
- **Utility activity:** varies by jurisdiction. Some cities consider disconnect logs FOIA-able; others require records requests with a stated purpose. Don't go beyond what the source explicitly permits.
- **Death Master File:** governed by Social Security Administration; certified user requirement. Use only for property-attribution (death of homeowner) and *never* for marketing-list construction.

### High-risk signals (Phase 3)
- **MLS saved-search overlap:** MLS data agreements rarely permit using *consumer-side* searches as a *vendor-facing* signal. Requires explicit negotiation with each MLS. The privacy of MLS consumers must be preserved — never expose which specific consumer searched for which property, only the aggregate signal "this property's owner ID appears in the search-side panel." Anonymization gate is mandatory.
- **LinkedIn job changes:** API ToS prohibits bulk inference about non-consenting users. Build the *consented* path first — sphere contacts who opt in via the relationship UI. Bulk inference about non-sphere contacts is off-limits, no exceptions.
- **IG / TikTok renovation/move tags:** Meta API gives access only to public content; respect rate limits. Never scrape. Storage of social content must comply with platform retention rules (typically 30-90 days).

### Hard-no signals (not in this spec, will never be)
- Race / ethnicity inference as a feature (only allowed in fairness *testing*, never in the model)
- School enrollment as a feature (proxies familial status; protected class)
- Religious affiliation, in any form
- Sexual orientation, gender identity
- Disability status
- Credit-adjacent data
- Census-tract demographics as direct features

If any of these proves predictive, that is itself the discriminatory pattern, and the response is to *reject the feature*, not to find a creative way to include it.

---

## 6. Visual signals — the StreetView case study

This is the signal class most worth elaborating because it's a uniquely AI-native moat. Walkthrough:

**Source:** Google StreetView Static API. Cost: $7 per 1000 requests after free tier; effectively a few hundred dollars per agent farm per year.

**Pipeline:**
1. For each flagged property, request StreetView image at the property's lat/long.
2. Request the same lat/long with `&source=outdoor` and a date filter for the previous year's panorama.
3. Pass both images to Claude Sonnet with a structured prompt:

```
You are evaluating a residential property for signs of seller motivation
based on two StreetView images, one from {year_current} and one from {year_previous}.

DESCRIBE ONLY the physical condition of the property and its grounds.
Do not describe any people, vehicles, or non-property elements.

Categorize the change between the two images, using the strictest interpretation:

  - DETERIORATION: peeling paint, broken windows, overgrown landscaping,
    structural damage, dead vegetation, debris accumulation, deferred maintenance.
  - RENOVATION: new paint, new landscaping, new fencing, visible additions,
    new roof, hardscape improvements, evidence of recent contractor work.
  - NO_CHANGE: properties appear materially identical.
  - NOT_COMPARABLE: image quality, angle, season, or obstruction prevents
    confident comparison.

Output JSON: { rating, confidence: 0-1, vision_notes: string (max 200 chars) }
```

4. Store as `visual_diff` in the cache table. Surface to the agent as plain English in the Grid reasoning ("Property shows visible deterioration vs. 2024 — peeling paint, overgrown front yard, deferred roof").

**Why this is uniquely AI-native:** no traditional CRM and no traditional public-records vendor does this. CoreLogic and ATTOM don't ship visual analysis. The only people who could ship it are AI-native companies, and ALEVANT is *already* AI-native. This is the dimension that lets ALEVANT say "we see things your last CRM didn't" — and mean it.

**Why this won't be sued for Fair Housing:** the signal is *about the property*, not the person. The model can use the property's visual condition; what it cannot do is use *who lives there* or *what neighborhood it's in* in a way that proxies protected class. Fairness CI on the hazard model is the safeguard.

---

## 7. Phasing — concrete dates

Assumes Grid v2 ships in 2027-Q1 as planned.

```
2027-Q1: Grid v2 in production (hazard model)
2027-Q2: Phase 1 — permits, business filings, voter-roll, rate-gap, cross-litigation
2027-Q3: Phase 2 — StreetView visual, NCOA, utility (limited cities), DMF
2027-Q4: Phase 3 prep — MLS saved-search negotiations begin; consented LinkedIn opt-in UI ships
2028-Q1+: Phase 3 deployment as agreements land
```

Each Phase ships its signals together as `engine_version=v3.{phase}`. Shadow-eval against the prior version for 30 days. Promote only signals that move the calibration plot and pass fairness CI.

---

## 8. What this gives ALEVANT

- A signal mesh **no incumbent CRM has any path to**. CoreLogic sells data; they don't fuse multi-modal. FUB/kvCORE buy data; they don't engineer features. Zillow has the data but can't ethically use it competitively. ALEVANT is positioned alone.
- **Year-over-year compounding lift** — each Phase adds 3-5 AUC points on top of v2. By 2028 the Grid is *materially better* than any single-source predictor in the market.
- **A defensible story for the brokerage and enterprise sale** — "Here are the 12 signal classes we fuse, here is the model card with calibration and fairness audits, here is the audit trail." That's the conversation that closes Compass, Douglas Elliman, KW corporate.
- **The conceptual foundation for territory-as-a-service** — once the signal mesh is dense enough, the product flips. Not "agent X uses ALEVANT to work their farm" but *"ALEVANT is the operating system of the territory; agents license it as their lens onto the market."* That's a step-function shift in defensibility and pricing power.

---

## 9. Risks and what would kill this

1. **The lift hypothesis on Phase 1 signals is wrong.** Permits and voter-roll might add only marginal AUC. Mitigation: shadow-evaluate each signal independently; ship only the ones that earn it.
2. **Legal exposure from one of the harder signals.** Mitigation: counsel review before each Phase 2/3 signal goes live. Have a written legal opinion on file per signal class.
3. **Cost of source maintenance** — every county portal can change UI; every vendor contract can renegotiate. Mitigation: monitoring with synthetic checks, fallback to "this signal class temporarily unavailable" rather than silent breakage.
4. **Over-engineering the signal mesh past the point of agent comprehension** — at some point an agent doesn't need to know that "permit + voter-roll-drop + rate-gap-200bps" produced the score. They need the prose summary. The explanation pipeline (Claude rendering top-N SHAP features as plain English) must keep pace.

---

*This signal mesh is the moat. Public records get you to parity with CoreLogic. Multi-modal fusion is what makes ALEVANT structurally uncatchable.*
