"""Generate synthetic Grid signals + outcomes for testing.

The synthetic generator models the real causal structure we expect to see in
production: tenure, equity, distress, life-event, and multimodal signals drive
the probability of listing within a horizon, with random per-zip variation.

Used by:
  - tests/ (end-to-end pipeline tests pass on this data)
  - train.py --synthetic (proves the model runs before real outcomes exist)
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Sequence

# Zip codes used for the per-zip random effect — Miami-Dade core
DEFAULT_ZIPS: Sequence[str] = (
    "33139", "33140", "33141", "33149", "33156", "33158",
    "33165", "33176", "33129", "33133", "33134", "33145",
)


def _logistic(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-x))


def generate_panel(
    n_properties: int = 2000,
    months: int = 18,
    seed: int = 7,
    zips: Sequence[str] = DEFAULT_ZIPS,
    asof: datetime | None = None,
) -> pd.DataFrame:
    """Synthesize a property × month panel with realistic features and outcomes.

    Returns a DataFrame with one row per (property, observation-month) until the
    property either lists (`listed=1`) or hits the end of the observation window
    (right-censored).
    """
    rng = np.random.default_rng(seed)
    asof = asof or datetime(2026, 5, 15)

    # Property-level fixed attributes
    zip_idx = rng.integers(0, len(zips), size=n_properties)
    years_owned_start = rng.integers(0, 25, size=n_properties)
    estimated_value = rng.uniform(250_000, 3_500_000, size=n_properties)
    equity_ratio = np.clip(rng.beta(3, 2, size=n_properties), 0.05, 1.0)
    is_absentee = rng.random(n_properties) < 0.18
    is_llc = rng.random(n_properties) < 0.10
    permit_class = rng.choice(["stay", "flip", "unknown"], size=n_properties, p=[0.10, 0.06, 0.84])
    rate_lock = rng.choice(["tight", "moderate", "loose"], size=n_properties, p=[0.40, 0.35, 0.25])

    # Per-zip random effect (latent base hazard variation by neighborhood)
    zip_re = rng.normal(0, 0.30, size=len(zips))

    # Build the long panel
    rows = []
    rng_eff = np.random.default_rng(seed + 1)
    for i in range(n_properties):
        z = zip_idx[i]
        listed = False
        # Distress event onset — Poisson-ish hazard within window
        foreclosure_month = rng_eff.integers(0, months * 3) if rng_eff.random() < 0.08 else None
        probate_month = rng_eff.integers(0, months * 3) if rng_eff.random() < 0.04 else None
        divorce_month = rng_eff.integers(0, months * 3) if rng_eff.random() < 0.06 else None
        tax_delinq_month = rng_eff.integers(0, months * 3) if rng_eff.random() < 0.05 else None
        ncoa_month = rng_eff.integers(0, months * 3) if rng_eff.random() < 0.07 else None

        for m in range(months):
            if listed:
                break
            yo = years_owned_start[i] + m / 12.0
            fc = int(foreclosure_month is not None and foreclosure_month <= m)
            pb = int(probate_month is not None and probate_month <= m)
            dv = int(divorce_month is not None and divorce_month <= m)
            tx = int(tax_delinq_month is not None and tax_delinq_month <= m)
            nc = int(ncoa_month is not None and ncoa_month <= m)

            # Linear predictor for monthly hazard
            xb = (
                -4.4
                + 0.06 * yo                       # tenure
                + 1.0 * equity_ratio[i]           # equity
                + 0.45 * is_absentee[i]
                + 0.15 * is_llc[i]
                + 1.8 * fc
                + 1.3 * pb
                + 1.1 * dv
                + 0.7 * tx
                + 0.7 * nc
                + (-0.6 if permit_class[i] == "stay" else 0.0)
                + (0.5 if permit_class[i] == "flip" else 0.0)
                + (-0.7 if rate_lock[i] == "tight" else 0.0)
                + (-0.2 if rate_lock[i] == "moderate" else 0.0)
                + zip_re[z]
            )
            p = _logistic(xb)
            event = rng_eff.random() < p

            rows.append(
                {
                    "property_id": f"p{i:05d}",
                    "zip": zips[z],
                    "obs_month": m,
                    "obs_date": (asof - timedelta(days=(months - m) * 30)).date().isoformat(),
                    "years_owned": yo,
                    "estimated_value": estimated_value[i],
                    "equity_ratio": equity_ratio[i],
                    "is_absentee_owner": is_absentee[i],
                    "is_llc_owner": is_llc[i],
                    "is_pre_foreclosure": fc,
                    "is_probate": pb,
                    "is_divorce": dv,
                    "is_tax_delinquent": tx,
                    "ncoa_mail_forward": nc,
                    "permit_class": permit_class[i],
                    "rate_lock_strength": rate_lock[i],
                    "listed": int(event),
                }
            )
            if event:
                listed = True

    return pd.DataFrame(rows)


def split_train_val_test(
    panel: pd.DataFrame, train_frac: float = 0.7, val_frac: float = 0.15
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Forward-rolling temporal split (no k-fold across time)."""
    panel = panel.sort_values("obs_month").reset_index(drop=True)
    n = len(panel)
    a = int(n * train_frac)
    b = int(n * (train_frac + val_frac))
    return panel.iloc[:a].copy(), panel.iloc[a:b].copy(), panel.iloc[b:].copy()
