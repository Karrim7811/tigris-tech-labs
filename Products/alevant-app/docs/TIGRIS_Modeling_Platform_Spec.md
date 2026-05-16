# Tigris Modeling Platform — Architecture Spec

**Name:** Tigris Modeling Platform (TMP)
**Scope:** Shared modeling, scoring, governance, and audit infrastructure underneath PRAIX (commercial risk) and ALEVANT (residential real estate), with optional spin-out as a third Tigris product.
**Audience:** Karim Nasser (sponsor), eventual data-science lead, ALEVANT/PRAIX engineering.
**Status:** Phase 0 — Specification.

---

## 1. Mission

Give Tigris one foundation for predictive modeling that is **SAS-class in rigor, AI-native in delivery, and multi-tenant in shape**. Both PRAIX and ALEVANT consume the same primitives: feature store, model registry, training/scoring runtime, fairness CI, drift detection, outcome loop, explanation pipeline, audit log. The platform is invisible to end users — agents and risk officers see the answers, not the machinery — but the machinery is what makes the answers regulator-defensible, reproducible, and durable.

**One-line test of success:** five years from now a regulator hands you a single Grid score from 2026 and asks you to reproduce it. You can.

---

## 2. Why one platform serves two products

| Capability | PRAIX (Commercial Risk) | ALEVANT (Residential RE) | Shared? |
|---|---|---|---|
| Feature store w/ point-in-time correctness | Yes | Yes | **Shared primitive** |
| Model registry + versioning | Yes | Yes | **Shared primitive** |
| Training runtime | Yes | Yes | **Shared primitive** |
| Online scoring (low-latency) | Yes | Yes | **Shared primitive** |
| Audit log + reproducibility | Yes (regulatory exam) | Yes (Fair Housing exam) | **Shared primitive** |
| Drift detection | Yes | Yes | **Shared primitive** |
| Outcome loop | Yes (loss / claims) | Yes (transactions / closed leads) | **Shared primitive** |
| Fairness testing | ECOA / FCRA / state insurance regs | Fair Housing / disparate impact / RESPA | **Shared primitive, different protected-class definitions** |
| Survival / time-to-event modeling | Time-to-claim, time-to-default | Time-to-sell, time-to-relist | Shared methodology |
| Hierarchical models | Portfolio, line-of-business clustering | Neighborhood, MSA clustering | Shared methodology |
| Monte Carlo / sensitivity | Premium pricing, portfolio loss | Investor underwriter, STR yield | Shared methodology |
| LLM-prose explanation | Yes (broker / underwriter) | Yes (agent) | **Shared primitive** |

Everything PRAIX and ALEVANT need from a modeling discipline is shared. The only product-specific work is **feature definitions** and **protected-class schemas** — both pluggable.

**Strategic upside:** the platform is a third product if you ever want it to be. "Tigris Modeling Platform for vertical AI risk modeling" is a real SaaS in its own right — Veeva-of-modeling. Not the headline play, but it preserves optionality.

---

## 3. Architecture at a glance

```
                  ┌─────────────────────────────────────────────┐
                  │       TIGRIS MODELING PLATFORM (TMP)        │
                  │                                             │
   PRAIX  ─┐      │   ┌─────────────┐     ┌─────────────┐       │
           │      │   │  Feature    │     │   Model     │       │
   ALEVANT ┼──────┤   │   Store     │◄────┤  Registry   │       │
           │      │   │ (online +   │     │ (versioned, │       │
   3rd ────┘      │   │  offline)   │     │  staged)    │       │
   product?       │   └──────┬──────┘     └──────┬──────┘       │
                  │          │                   │              │
                  │          ▼                   ▼              │
                  │   ┌─────────────┐     ┌─────────────┐       │
                  │   │  Training   │     │   Scoring   │       │
                  │   │   Runtime   │     │   Runtime   │       │
                  │   │  (batch)    │     │ (real-time) │       │
                  │   └──────┬──────┘     └──────┬──────┘       │
                  │          │                   │              │
                  │          ▼                   ▼              │
                  │   ┌─────────────────────────────────┐       │
                  │   │       Audit Log (append-only)   │       │
                  │   └─────────────────────────────────┘       │
                  │                  │                          │
                  │   ┌──────────────┼──────────────┐           │
                  │   ▼              ▼              ▼           │
                  │ Fairness     Drift         Outcome          │
                  │   CI       Detection         Loop           │
                  │   │              │              │           │
                  │   └──────────────┴──────────────┘           │
                  │                  ▼                          │
                  │           Explanation Pipeline              │
                  │           (SHAP → Claude prose)             │
                  │                  │                          │
                  │                  ▼                          │
                  │           Model Card Publisher              │
                  │                                             │
                  └─────────────────────────────────────────────┘
```

Every box is a discrete component with its own contract. The arrows are the only allowed couplings — no component bypasses another. That discipline is what keeps the platform composable as it grows.

---

## 4. Component specifications

### 4.1 Feature Store

**Purpose:** single source of truth for every input value any model has ever seen, with point-in-time correctness.

**Two tiers:**
- **Offline store:** Postgres (Supabase). Columnar layout (`feature_namespace`, `feature_name`, `feature_version`, `entity_id`, `tenant_id`, `value`, `valid_from`, `valid_until`, `computed_at`, `source_id`). Used for training, backfill, batch scoring, audit replay.
- **Online store:** Redis (Upstash). Keyed by `tenant_id:entity_id:feature_namespace.feature_name@version`. Sub-50ms read SLA. Used for real-time scoring.

**Hard rules:**
1. **Point-in-time joins only.** Training rows are constructed by asking *"what was the value of feature F for entity E at timestamp T?"* — never *"what is the current value of F?"* This single rule eliminates 80% of train-serve skew bugs.
2. **Immutable history.** Updating a feature value creates a new row with a new `computed_at`; old rows are never deleted. Audit reproducibility depends on this.
3. **Feature versioning is semver.** Breaking a feature's semantics requires a major bump. Old version stays available for backfill of old models.
4. **Tenant scoping enforced via RLS.** A PRAIX broker cannot query an ALEVANT feature, and an ALEVANT workspace cannot read another workspace's features.
5. **Source lineage.** Every feature row carries `source_id` pointing to the data pipeline that produced it. No anonymous features.

**Feature definition contract** (Python or TypeScript):
```python
@feature(
    namespace="alevant.property",
    name="months_since_refi",
    version="1.2.0",
    owner="grid-team",
    sources=["public_records.miami_dade.mortgage_records"],
    refresh="daily",
    pii=False,
    fairness_proxy_risk="low",   # for fairness audit
)
def compute(entity_id: str, asof: datetime) -> float:
    ...
```

A feature with `fairness_proxy_risk="high"` (zip code, surname, school district) triggers extra scrutiny in fairness CI.

**Defer:** Feast/Tecton. DIY on Postgres+Redis is the right call until model count > 50 or feature count > 5000. Both products are 2-3 years away from those thresholds.

---

### 4.2 Model Registry

**Purpose:** every model that has ever been trained, with full lineage to inputs, code, and metrics.

**Model record schema:**
```
model_id (uuid)
name              # e.g. "alevant.grid.motivation_score"
version           # semver
status            # dev | staging | champion | challenger | archived
framework         # sklearn | lightgbm | lifelines | pytorch | claude
training_data_hash  # hash of feature snapshot used
training_code_hash  # git commit
hyperparams_json
metrics_json        # AUC, lift, calibration, fairness scores
artifact_uri        # S3 / Supabase Storage path
fairness_audit_id   # FK to fairness_audits
model_card_uri
trained_at
promoted_at         # to champion, if applicable
trained_by          # human or service account
tenant_scope        # global | per-tenant
parent_model_id     # for retrains
```

**Promotion lifecycle:**
```
dev ──► staging ──► challenger ──► champion ──► archived
                       │              │
                       │              └─ rollback to previous champion (atomic)
                       │
                       └─ shadow-scores production traffic; can be promoted
                          to champion when fairness + AUC + business metric gates pass
```

**Promotion gates** (all must pass to enter `champion`):
- Validation AUC ≥ champion AUC − 0.01 (or business-metric equivalent)
- Calibration Brier score ≤ champion's
- Fairness CI passes (§4.5)
- Drift baseline established
- Model card published (§4.10)
- Human sign-off (data science lead) recorded

**Rollback:** O(1) — point the scoring router at previous champion. The previous version's artifact is always warm in the registry.

---

### 4.3 Training Runtime

**Purpose:** reproducible model training from feature-store inputs.

- **Compute:** Python container (Polars + sklearn + LightGBM + lifelines + statsmodels + PyTorch when justified). Runs as a scheduled job (GitHub Actions to start; graduates to a worker queue if cost/scale demands).
- **Inputs:** declared feature set + entity set + time window. Training rows constructed via point-in-time join.
- **Outputs:** model artifact + metrics JSON + fairness audit + model card draft, all written atomically to the registry.
- **Reproducibility contract:** given the same `training_data_hash` and `training_code_hash`, training must produce a model whose predictions are identical on a held-out test set (`sha256(model.predict(test_X))` matches). This is testable in CI.

---

### 4.4 Scoring Runtime

**Purpose:** real-time and batch scoring with audit-grade logging.

- **Real-time:** Vercel serverless function (or a dedicated Cloud Run service if cold starts hurt). Reads features from online store, calls model artifact, writes score to audit log.
- **Batch:** nightly job for The Grid sweep, PRAIX portfolio refresh, etc. Same code path; just iterates entities.
- **Every score** writes to the audit log (§4.6) — no exceptions, no silent paths.
- **Tenant routing:** scoring router knows which model version is `champion` for this `(tenant_id, model_name)` tuple. Each tenant can pin a model version (frozen-model SLA for enterprise contracts).

---

### 4.5 Fairness CI

**Purpose:** every candidate model is tested for disparate impact before it can be promoted.

**Mandatory tests per model:**
1. **Demographic parity** — selection rate per protected group within ±10% of overall rate.
2. **Disparate impact ratio (80% rule)** — minority/majority selection ratio ≥ 0.80.
3. **Equal opportunity (TPR parity)** — TPR difference between groups ≤ 0.10.
4. **Calibration parity** — predicted probability matches observed rate within each group.
5. **Proxy audit** — feature attribution analyzed; any feature with high proxy-risk and high importance triggers manual review.

**Protected-class schemas are per-product:**
- **ALEVANT (Fair Housing):** race, color, national origin, religion, sex (incl. sexual orientation, gender identity), familial status, disability. Inferred via zip-code-overlay census data + BIFSG surname/geo inference, **never stored as a feature**, only used for fairness testing.
- **PRAIX:** ECOA + state insurance regulatory protected classes. Different schema, same primitives.

**Output:** a `fairness_audit` record linked to the model, with pass/fail per test plus full numeric report. **Failure blocks promotion.** No override path except a documented sign-off from designated counsel + data science lead, with the override itself logged immutably.

**Mitigation toolkit available to modelers:**
- Reweighing
- Threshold tuning per group (with calibration preserved)
- Adversarial debiasing
- Constraint-aware optimization (Fairlearn)
- Feature ablation of high-proxy features

---

### 4.6 Audit Log

**Purpose:** every score ever produced is reproducible from the log, forever.

**Append-only event log** (Postgres table, with planned migration to an immutable WORM tier in S3 / R2 once volume justifies it).

**Score event schema:**
```
event_id (uuid)
event_type        # "score" | "promotion" | "training" | "feature_update"
tenant_id
entity_id
model_name
model_version
input_features_snapshot_id  # FK to features_snapshot table
output_value
output_metadata_json
served_by         # request id, agent/user if applicable
timestamp
```

**Retention:** 7 years minimum (regulatory standard for both insurance and real estate). 10 years for any score that led to a consequential action (lead contacted, premium quoted, transaction scored).

**Reproducibility primitive:** `replay(event_id) → score`. Function loads the feature snapshot, the model artifact, recomputes the score, asserts equality with the logged value. CI runs this on a sample weekly. Production runs it on demand for compliance officers.

**Query interface:** `audit.search(tenant_id, entity_id, time_range, model_name)` — returns full history. Forms the basis of the compliance-officer dashboard.

---

### 4.7 Drift Detection

**Purpose:** alarm when models degrade before users notice.

**Three layers:**
- **Input drift:** Population Stability Index (PSI) per feature, computed nightly against the training distribution. PSI > 0.25 alerts.
- **Output drift:** model score distribution shift via KL divergence vs. baseline.
- **Outcome drift:** when outcomes (§4.8) arrive, compute rolling AUC / Brier / lift. Degradation > 5% triggers a retrain candidate.

**Action:** drift alerts go to a queue. Auto-retrain is *not* automatic — a human reviews, kicks off a candidate, fairness CI gates it, then promotion lifecycle takes over.

---

### 4.8 Outcome Loop

**Purpose:** close the loop from prediction to ground truth so models compound.

Every product action that constitutes a ground-truth outcome writes to a shared `outcomes` table:
```
outcome_id
tenant_id
entity_id
outcome_type      # transaction.closed | lead.contacted | claim.paid | premium.bound | ...
outcome_value     # numeric or json
related_score_ids # array of audit log event_ids this outcome validates/refutes
timestamp
```

The training runtime treats outcomes as labels for the next retrain cycle. The audit log records the link between every score and every consequent outcome — which is what makes "the Grid's lift at decile 1 in 2026Q1 was 4.2x" a defensible, auditable claim instead of a marketing line.

**This is the single most strategically important component** because it's what makes the platform compound. Most CRMs never wire this up; they predict, they don't learn.

---

### 4.9 Explanation Pipeline

**Purpose:** every score has a human-readable "why" attached.

**Two-stage pipeline:**
1. **Statistical attribution** — SHAP values (or framework-appropriate equivalent) computed at scoring time, cached with the score.
2. **Prose generation** — a Claude call (Haiku for cost, Sonnet for higher-stakes products) takes the top-N SHAP features + the entity's context and writes a paragraph in the product's tone of voice. Vesper-flavored for ALEVANT, underwriter-flavored for PRAIX.

**Contract:** every score returned from the platform has both a `score` and an `explanation` field. Products never have to call a separate explanation API.

**Audit-grade:** the SHAP values are logged with the score. The prose is logged separately and is re-generatable at any time.

---

### 4.10 Model Card Publisher

**Purpose:** every model in `staging` or above has a public-internal model card.

A model card is a markdown + JSON artifact, generated automatically at training time from registry metadata + fairness audit + drift baseline + sample SHAP plots. Rendered at `tmp.tigris.internal/models/<model_name>/<version>` (or wherever Tigris hosts internal docs).

**Required sections:**
- Purpose and intended use
- Out-of-scope use
- Training data lineage
- Validation methodology
- Performance metrics (AUC, lift, calibration)
- Fairness assessment
- Known limitations
- Owner + contact
- Approval log

Model cards become the single artifact handed to a compliance officer during onboarding, a regulator during exam, or an acquirer during due diligence.

---

## 5. Multi-product contract

Both products consume TMP through a thin client library:

```typescript
// PRAIX or ALEVANT consumer code
import { tmp } from "@tigris/modeling-platform-client";

const result = await tmp.score({
  tenant: workspace_id,
  model: "alevant.grid.motivation_score",
  entity: property_id,
  features: { /* optional inline overrides */ },
});

// result.score, result.explanation, result.audit_event_id
```

Behind the client:
- Feature reads → online store
- Model selection → registry (champion for this tenant)
- Score → scoring runtime
- Log → audit log
- Explanation → cached or generated

**Product-specific code** (in ALEVANT or PRAIX) defines:
- Feature definitions (Python functions registered to the platform)
- Outcome ingestion (when product knows a ground truth, write to `outcomes`)
- Protected-class schema (compile-time config)
- UI surfaces that display the score + explanation

**Everything else is platform.**

---

## 6. Data model summary

Six tables form the spine. All have `tenant_id` and RLS. All immutable except where noted.

| Table | Purpose | Mutability |
|---|---|---|
| `features` | Feature value history (offline store) | Append-only |
| `feature_definitions` | Code-registered feature contracts | Versioned |
| `models` | Model registry | Status field mutable; rest append-only |
| `fairness_audits` | One row per model promotion candidate | Append-only |
| `audit_events` | Every score, training run, promotion | Append-only |
| `outcomes` | Ground-truth labels for retraining | Append-only |

Online feature cache lives in Redis with TTLs matched to feature `refresh` declaration.

---

## 7. Technology choices

| Layer | Choice | Why |
|---|---|---|
| Persistence | Supabase Postgres + RLS | Already in both products' stacks; multi-tenant isolation primitive matches |
| Online cache | Upstash Redis | Serverless, pay-per-request, low latency, zero ops |
| Artifacts | Supabase Storage (V1) → Cloudflare R2 (V2) | Cheap, S3-compatible, no egress |
| Training compute | GitHub Actions runners (V1) → dedicated worker queue (V2) | Free until model count justifies; trivial to graduate |
| Inference compute | Vercel serverless (V1) → Cloud Run (V2 if cold-start sensitive) | Already in stack |
| Modeling | Python + Polars + sklearn + LightGBM + lifelines + statsmodels; PyTorch only when DL is justified | The statistical methods that matter for risk and RE are tabular and survival. DL is over-reach for V1. |
| Orchestration | Inngest or simple cron + queues | Keep it boring |
| Explanation LLM | Anthropic Claude (Haiku default, Sonnet for high-stakes) | Already in stack |
| Fairness library | Fairlearn + custom | Standard, well-tested, Microsoft-maintained |
| Drift library | Evidently AI (open source) | Battle-tested, integrates with the model card pipeline |

**Deliberately deferred:** Feast, Tecton, MLflow, Weights & Biases, Kubeflow, Airflow, Snowflake, dbt. All good. All overkill at platform-month-0. Revisit when model count > 50 or training cost > $5k/month.

---

## 8. Phasing

### Phase 0 — Foundation (Weeks 0-6)
- Postgres schemas for `features`, `feature_definitions`, `models`, `audit_events`
- Python feature-definition decorator + offline-store writer
- Online-store sync job (Postgres → Redis)
- Minimal model registry (CRUD + artifact upload)
- Training runtime as a Python container with one example model (a re-baselined Grid v1.5)
- Scoring runtime as a Vercel function with one endpoint: `/tmp/score`
- Audit log writes on every score
- **Definition of done:** PRAIX *or* ALEVANT replaces one of its current models with a TMP-backed call. Old code path can be deleted.

### Phase 1 — Discipline (Weeks 6-14)
- Reproducibility CI test (`replay(event_id) → score` matches)
- Fairness audit pipeline with all five tests (§4.5)
- Promotion gates enforced (no champion without fairness pass)
- Drift detection (input PSI, score KL)
- Outcomes table + first outcome ingestion from ALEVANT's transaction events
- Model card auto-publisher
- **Definition of done:** every model in production has a model card, every promotion is gated, every score is reproducible from the audit log.

### Phase 2 — Compounding (Weeks 14-24)
- Outcome ingestion in PRAIX (claims, premium bind, default events)
- Retrain candidate pipeline triggered by drift or outcome degradation
- SHAP → Claude explanation pipeline as a platform primitive
- Champion/challenger framework live (production traffic shadow-split)
- Compliance officer dashboard (read-only view of audit events, fairness audits, model cards) usable by an external regulator
- **Definition of done:** a brokerage compliance officer can be handed a URL, log in, and conduct a self-serve audit of every score affecting their workspace.

### Phase 3 — Productize (Months 6-12)
- Spin out as `@tigris/modeling-platform-client` + standalone service
- Public-facing documentation
- White-label deployment option (a third Tigris product, if you want it)
- SOC 2 Type II covers TMP as a subprocessor

---

## 9. What this gives Tigris at each milestone

**Month 6:** ALEVANT's Grid v2 ships on TMP. Every score is reproducible, every model has a card, fairness is gated. Bichi-tier customers see better predictions with plain-English explanations. *Internally:* the discipline conversation is over — you have one place to look at every model in flight.

**Month 12:** PRAIX migrates onto TMP. Both products now share a feature store and audit spine. Compliance officer dashboard goes live. First brokerage demo includes a self-serve regulator view. *Externally:* enterprise sales motion has the artifact it needs.

**Month 18:** Outcome loops are compounding. Grid v3 in ALEVANT is measurably better than v1 because of closed-loop retraining. PRAIX risk models retrain monthly with full audit trail. *Externally:* "our models get smarter every month, here's the public model card history" is a sales asset competitors structurally cannot match.

**Month 24:** TMP is shippable as its own SaaS. Vertical AI risk modeling for anyone who needs SAS-class discipline without SAS prices. *Optional:* it becomes Tigris product #3.

---

## 10. Risks and open questions

1. **Statistician hire is the critical path.** No one on the current team has the methodological background. The first six weeks of Phase 0 can be done by engineering; everything from fairness CI onward needs a real data scientist. **Recommend hiring in parallel with Phase 0 start.**
2. **Protected-class inference is a legal minefield.** Even for fairness *testing*, inferring race-by-zip or BIFSG triggers state-specific scrutiny. Counsel review before Phase 1.
3. **Outcome attribution is messier than it looks.** A transaction closes; was it the Grid's prediction or Sofia's call or Vesper's campaign that caused it? Multi-touch attribution is a research problem. V1 accepts simple last-touch; revisit at Month 12.
4. **Compute cost.** SHAP on every score is non-trivial. May need to cache + recompute-on-demand instead of always-compute. Decide in Phase 2.
5. **Cross-tenant signals (federated learning, differential privacy)** are explicitly *out of scope* for this spec — that's a Phase 4 architecture revision once the spine is solid.

---

*This spec is the foundation for the modeling platform that will underpin every predictive surface in Tigris. It should be readable in isolation but coherent with the ALEVANT and PRAIX architectures. Update it; don't fork it.*
