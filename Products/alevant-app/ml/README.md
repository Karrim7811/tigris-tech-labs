# ALEVANT Hazard Model (`web/ml/`)

Time-to-listing hazard model for residential real estate. Replaces the v1.5 heuristic
score with a calibrated probability — `P(property lists within W days)` for
W ∈ {90, 180, 365}.

See `docs/ALEVANT_Grid_Hazard_Model_Spec.md` for the methodological background.

## What this package does

```
hazard_model/
├── synthetic_data.py    # generate fake Grid signals + outcomes (for tests + cold-start)
├── data_loader.py       # pull real signals + outcomes from Supabase
├── feature_engineering.py  # point-in-time feature panel construction
├── train.py             # discrete-time logistic survival w/ per-zip random effects
├── calibration.py       # isotonic regression on validation set
├── fairness_audit.py    # Fair Housing protected-class audit (HUD/FHA)
├── predict.py           # inference: features → hazard_90d/180d/365d + CI
└── tests/               # pytest, runs on synthetic data end-to-end
```

## Quick start

```bash
cd web/ml/
uv venv .venv
source .venv/bin/activate          # or .venv\Scripts\activate on Windows
uv pip install -e ".[dev]"

# Run the synthetic-data end-to-end test
pytest -v

# Train on synthetic data (proves the pipeline)
python -m hazard_model.train --synthetic

# Train on real data once outcomes accumulate (>=6mo of Grid v1.5)
python -m hazard_model.train --supabase-env-file ../.env.local
```

## Status

- **Today:** Pipeline runs end-to-end on synthetic data. Calibration + fairness audit pass.
- **When real outcomes accumulate (~6 months post-Grid-v1.5):** Switch the data-loader source from synthetic to Supabase, retrain, validate, promote.

The synthetic-data path is not throwaway — it's the regression test that proves the
methodology before betting it on real data.

## Fair Housing posture

The model is audited at every promotion candidate for disparate impact across HUD-protected
classes (race, color, national origin, religion, sex incl. orientation/gender identity,
familial status, disability). Protected-class attributes are NEVER inputs — they are
inferred for the audit only, via BIFSG + census-tract overlay, stored in a separate
`fairness_test_attributes` table outside product RLS.

Test thresholds (must all pass to promote):
- Disparate impact ratio ≥ 0.80 (80% rule)
- Equal opportunity (TPR delta across groups) ≤ 0.10
- Calibration delta across groups ≤ 0.07

Failures block promotion. There is no auto-override.
