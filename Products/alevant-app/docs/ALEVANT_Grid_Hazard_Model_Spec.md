# ALEVANT Grid v2 — Hazard Model Spec

**Premise:** The Grid's current 0-100 motivation score is a weighted additive heuristic. It works as a first pass but is **not statistically meaningful** — "82/100" doesn't mean 82% likely to sell, and there's no confidence interval, no time window, no calibration. This spec elevates the Grid from heuristic to **time-to-listing hazard model** with calibrated probabilities, per-neighborhood random effects, and a defensible validation framework.

**Status:** Specification. **Prerequisite:** Grid v1.5 ships (see `ALEVANT_Grid_Q3_Sprint.md`) and accumulates ≥6 months of outcome data before training begins.

**Target ship:** Grid v2 candidate ready by 2026-Q4, shadow-scoring v1.5 in production by 2027-Q1.

---

## 1. Why hazard model

A real-estate agent doesn't actually need a score. They need an answer to:

> *"Which 12 homeowners in my farm should I be calling this week, and what's the chance they'll list before someone else does?"*

The hazard model answers all three parts of that question — *who*, *when*, *how confident* — with one statistical primitive: the **probability that a property lists within window W, given everything we know about it at time T**.

What changes in the agent's UX:

| Today (v1.5) | After (v2) |
|---|---|
| "Motivation score: 82/100" | "47% probability of listing within 90 days (95% CI: 38-57%)" |
| Top-20 ranking by score | Top-20 ranking by *expected value × calibrated probability × your win rate* |
| Same recommendation regardless of neighborhood | Per-zip calibrated — Miami Beach behaves differently from Coral Gables |
| No accountability ("the score was high but they didn't sell") | The model is *graded* — calibration plots show whether 47% predictions actually convert ~47% |

What changes for compliance:

- A regulator (Fair Housing, state RE commission) gets a *calibration plot* and *AUC* and *per-protected-class TPR* on every model card. The model is defensible by construction.

What changes for the GTM story:

- Agents stop arguing about whether 79 is more motivated than 82. They get a probability they can reason about. The product graduates from "AI-flavored heuristic" to "predictive analytics with model risk discipline."

---

## 2. Methodology choice

Three reasonable candidates. Pick one; don't ensemble until v3.

### Option A — Discrete-time logistic survival model (recommended for v2)

For each property × month-bucket, model the probability of listing in *that month* given it hasn't listed yet:

$$
P(\text{list}_t = 1 \mid X, \text{not-listed-yet}) = \sigma(\beta_0 + \beta^T X + u_z)
$$

where $u_z$ is a per-zip random effect.

- **Pros:** trivially handled by any sklearn/statsmodels stack. Direct probability output. Easy calibration. Natively handles right-censoring (properties that don't list during observation window). Easy to add per-zip random effects via mixed-effects model or just include zip as a categorical with regularization.
- **Cons:** assumes constant hazard within each month bucket (mild assumption; acceptable given typical real-estate timing).
- **Tooling:** `statsmodels.MixedLM` or `pymc` for Bayesian; alternatively `lightgbm` with custom objective.

### Option B — Cox proportional hazards

$$
h(t \mid X) = h_0(t) \cdot \exp(\beta^T X)
$$

- **Pros:** classical, well-understood by any statistician hire. Continuous time. `lifelines` library is excellent.
- **Cons:** proportional-hazards assumption is restrictive (often violated in real estate where the effect of e.g. probate filing is huge in months 1-6 then fades). Per-zip random effects via Cox frailty is more awkward than the discrete-time approach.

### Option C — Gradient-boosted survival trees (`lightgbm` survival objective)

- **Pros:** captures non-linearity and interactions for free. Top performer on real-world tabular survival benchmarks.
- **Cons:** uncalibrated by default — needs an explicit calibration layer (isotonic regression on a holdout). Less interpretable; SHAP helps but isn't a substitute for a clean coefficient.

**Recommendation:** start with Option A (discrete-time logistic with mixed effects). It's the cleanest, the most defensible, and the easiest to explain to a compliance officer. Reserve Option C for v2.5 once we know whether the simpler model leaves performance on the table.

---

## 3. Data preparation

### 3.1 Observation unit

One row = one **(property, month)** observation while the property is *not yet listed*.

- Properties enter the panel when they first appear in the Grid scan.
- Properties exit when one of: (a) they list (`outcome_type='listed'`), (b) they sell off-market (`outcome_type='sold_off_market'`), (c) observation window closes.
- Right-censoring is explicit — a property that is still un-listed at the end of the window has censored survival, not a label of "won't list."

### 3.2 Feature snapshot rule (point-in-time correctness)

Every feature value at observation month *t* must be the value as it would have been known at the start of *t* — **never current state**. This is the single most important rule for avoiding label leakage:

- `years_owned` at *t* = `(t - last_sale_date) / 365`
- `is_pre_foreclosure` at *t* = TRUE if any foreclosure filing exists with `filing_date ≤ t`
- `estimated_equity` at *t* = computed using the equity heuristic with values as of *t*
- `mls_status` at *t* = MLS state at the start of *t* — never current

The Grid v1.5 schema (with `effective_at` on signals) is what makes this possible. Without v1.5's append-only signal history, point-in-time joins are not reliable.

### 3.3 Training window

- **Training set:** observations from 2026-07 through 2027-06 (12 months), once Grid v1.5 has been collecting outcomes since 2026-05.
- **Validation set:** observations from 2027-07 through 2027-09 (3-month rolling forward).
- **Test set:** observations from 2027-10 through 2027-12, held out until final model selection.

Forward-rolling validation only. **Never** k-fold across time — that leaks future information into past predictions.

### 3.4 Minimum viable training data

The model is trainable when *all* of these are true:
- ≥6 months of Grid v1.5 outcome data.
- ≥800 positive labels (`outcome_type='listed'`) across all workspaces in the training window.
- ≥40 positive labels per geographic cluster (zip or contiguous-zip group) for the random effect to converge.

If positives are sparse in some zips, fall back to a hierarchical pool (zip → MSA → state) with shrinkage. Don't fit a per-zip random effect on 3 observations.

---

## 4. Feature engineering

Inputs are the same fields the heuristic uses, but engineered carefully for the hazard model:

| Feature class | Specific features | Engineering |
|---|---|---|
| **Tenure** | `years_owned`, `years_owned_sq`, `years_above_median` | Non-linear in tenure — peak hazard around years 7-13. Include squared term. |
| **Equity** | `equity_ratio`, `estimated_equity_log`, `homestead_exempt` | Log-transform absolute equity; cap ratio at 1.0. |
| **Distress** (binary flags w/ recency) | `pre_foreclosure_within_180d`, `pre_foreclosure_within_90d`, `tax_delinquent_2yr_plus` | Each binary flag becomes two: "ever in window" + "filed in last 90d." Recency matters more than presence. |
| **Life event** | `probate_within_18mo`, `divorce_within_12mo`, `senior_owner` | Time-since-event as continuous feature in addition to binary flag. |
| **Property type** | `is_condo`, `is_sfr`, `is_multifamily`, `building_age` | Different hazard curves per type. |
| **Market context** | `zip_absorption_months`, `zip_inventory_change_yoy`, `mortgage_rate_gap` | `mortgage_rate_gap` = current 30yr − rate at last refi (proxy for rate-lock). |
| **MLS history** | `prior_listings_count`, `days_since_last_expired`, `prior_listings_avg_dom` | Properties with prior listing attempts behave differently. |
| **Owner type** | `is_absentee`, `is_LLC_owned`, `years_at_mailing_address` | LLC ownership has very different exit dynamics. |
| **Neighborhood RE** | Random effect $u_z$ | Mixed-effects intercept per zip. |

Excluded by Fair Housing policy:
- Any direct or near-direct proxy for race, color, religion, national origin, sex, familial status, disability.
- Surname or name-based features.
- Census-tract demographics.
- Granular within-zip geography that would proxy race-by-block.

These exclusions apply at training time; fairness CI (§7) audits the *learned* model to ensure no high-importance feature is acting as a hidden proxy.

---

## 5. Calibration

A model can have great AUC and still be miscalibrated — predicting "50%" for groups that actually convert at 70%. Calibration is non-negotiable for a probability-claiming product.

**Approach:**
1. Train the model on the training window.
2. On the validation set, plot reliability curve (predicted probability buckets vs. observed listing rate).
3. Fit **isotonic regression** on the validation set to map raw probabilities → calibrated probabilities.
4. Apply calibration transform at inference time.
5. Verify calibration holds on the test set before promotion.

**Calibration is also audited per zip and per protected class** (see fairness §7). A model that's calibrated overall but miscalibrated for a subgroup is a fairness failure.

---

## 6. Validation framework

Every Grid v2 candidate model must pass *all* of these on the test set before promotion:

| Metric | Threshold |
|---|---|
| AUC (overall) | ≥ 0.72 |
| AUC (per top-15 zip) | ≥ 0.65 |
| Brier score | ≤ 0.18 |
| Calibration ECE (expected calibration error) | ≤ 0.05 |
| Lift at top decile | ≥ 4.0x random baseline |
| Recall at top-100 predictions per zip | ≥ 35% |
| Per-protected-class calibration delta | ≤ 0.07 |
| Per-protected-class TPR delta | ≤ 0.10 |

If any threshold fails, the model goes back. No exceptions, no overrides.

---

## 7. Fairness considerations

ALEVANT's regulated surface is Fair Housing (HUD/FHA), not insurance. The fairness framework reflects that:

### Protected classes (Fair Housing)
- Race
- Color
- National origin
- Religion
- Sex (incl. sexual orientation, gender identity)
- Familial status
- Disability

### Inference (testing only — never as input features)
- Geographic proxy: Census ACS data by tract, weighted by tract-to-property assignment.
- Surname: BIFSG (Bayesian Improved First Name Surname Geocoding) for race/ethnicity *for testing only*.
- These inferences are stored *outside* the feature store, in a separate `fairness_test_attributes` table with strict access controls.

### Tests run on every candidate model
1. **Disparate impact** — top-decile selection rate per group; minority/majority ratio ≥ 0.80.
2. **Equal opportunity** — TPR (listed-and-flagged / listed) within ±0.10 across groups.
3. **Calibration parity** — calibration curves per group should not diverge by >0.07.
4. **Proxy audit** — feature importance vs. proxy correlation; any feature in top 5 importance with high proxy-class correlation is flagged for review.

### Mitigations if a test fails
- Threshold tuning per group (with calibration preserved via group-specific isotonic regression).
- Feature ablation of high-proxy features.
- Reweighing the training set.
- Last resort: **don't promote the model.** A miscalibrated-but-fair model beats a high-AUC discriminating one in this domain.

### Audit artifact
Every promoted model carries a `fairness_audit` JSON document with the full numeric report, attached to its model card. This is what gets handed to a brokerage compliance officer or a HUD investigator if it ever comes to that.

---

## 8. Output schema

The Grid v2 score replaces v1.5's flat `motivation_score` with a richer object stored on `grid_signals`:

```sql
ALTER TABLE grid_signals
  ADD COLUMN hazard_90d numeric,      -- P(list in 0-90d)
  ADD COLUMN hazard_180d numeric,     -- P(list in 0-180d)
  ADD COLUMN hazard_365d numeric,     -- P(list in 0-365d)
  ADD COLUMN hazard_90d_ci_lo numeric,
  ADD COLUMN hazard_90d_ci_hi numeric,
  ADD COLUMN engine_version text;     -- 'v2.0', 'v2.1', etc.

-- Keep the heuristic motivation_score for backward compatibility during v2 shadow period.
```

The cockpit UI consumes hazard probabilities; v1.5 motivation_score remains computed for telemetry comparison and graceful fallback.

---

## 9. Migration from v1.5 (champion/challenger)

**Don't cut over.** Shadow-score for 60 days, then ramp.

**Phase A (Day 0-30):** v2 is `challenger`. Every scan produces both v1.5 and v2 scores. v2 is invisible in the UI. Daily reconciliation report compares the two — *what does v2 say about properties v1.5 missed, and vice versa?* Manual review of disagreements.

**Phase B (Day 30-60):** v2 is `challenger` in shadow on production traffic. A/B ramp: 10% of workspaces see v2 in the cockpit (gated by feature flag `grid_engine=v2`). Compare downstream lead-conversion and listing-capture rates.

**Phase C (Day 60+):** v2 promoted to `champion` if all of:
- All validation thresholds pass on the rolling test set.
- Lead-conversion rate of v2 cohort ≥ v1.5 cohort.
- No fairness regression vs. v1.5 (v1.5 had no formal fairness audit — v2 sets a higher bar).
- Engineering sign-off on stability (no scoring latency regression beyond +50ms).

v1.5 stays available as a fallback for 12 months. After that, the v1.5 engine code is archived (registry keeps the artifacts for audit).

---

## 10. Open questions to resolve before training begins

1. **Where does training compute run?** GitHub Actions runner for V1 (free, fine for this scale). Promote to a dedicated training service if training run >2hr or cost >$500/mo.
2. **Who owns the model risk sign-off?** ALEVANT data-science lead (TBH) + a senior engineer review. *Not* SR 11-7 ceremony — appropriate scoping for a sales-prioritization model, not a credit model.
3. **How are protected-class inferences stored / accessed?** Separate Supabase project, separate RLS policy, encrypted at rest, access logged. Hard wall between training data and product data.
4. **What's the appeal mechanism if a homeowner believes they were unfairly targeted?** Required for HUD compliance. UI surface: "Why was I included on your outreach list?" → returns model card link + per-feature contribution (SHAP-derived) + opt-out path.
5. **Does outcome data from one workspace inform models served to another workspace?** For v2: **yes, the global model is trained on aggregate outcome data across all FL workspaces.** This is the cross-tenant flywheel — privacy-preserved because no individual workspace's data is exposed; only the aggregate model parameters cross workspaces.

---

## 11. What this gives ALEVANT

- **Methodologically defensible predictive analytics**, calibrated and audited, on every Grid score.
- **A compliance posture** that survives the first HUD or Fair Housing inquiry without panic.
- **A learning system** — every outcome refines the model, monthly. v1.5 is static; v2 compounds.
- **A sales asset** — the model card becomes the artifact that closes brokerage-tier deals. "Here is our published calibration plot. Here is our fairness audit. Here is what your competitor's CRM does not have."
- **The methodological foundation for the multi-modal signals** in `ALEVANT_Multimodal_Signals_Spec.md` — adding new features becomes a discipline, not a guess.

The Grid v1 was a useful heuristic. The Grid v2 is the moment ALEVANT becomes a serious predictive product.
