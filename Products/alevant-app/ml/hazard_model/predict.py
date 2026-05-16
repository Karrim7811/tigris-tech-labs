"""Inference path for the Grid hazard model.

Loads a serialized bundle and predicts hazard probabilities at three horizons.
Used by the Next.js scoring runtime via a thin RPC bridge (or as a sidecar service).
"""
from __future__ import annotations
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

from .train import predict_hazard, cumulative_hazard
from .feature_engineering import engineer


HORIZONS_MONTHS = {"90d": 3, "180d": 6, "365d": 12}


def load_bundle(path: str | Path) -> dict:
    return joblib.load(path)


def predict_for_rows(bundle: dict, rows: list[dict]) -> list[dict]:
    """Predict hazard probabilities for a list of input dicts.

    Each input dict must contain at minimum the columns the engineer expects.
    Returns a list of {"hazard_90d", "hazard_180d", "hazard_365d", "hazard_90d_ci_lo", "hazard_90d_ci_hi"}.
    """
    df = pd.DataFrame(rows)
    # Defensive defaults: every row must have these or engineer() will fail.
    defaults = {
        "permit_class": "unknown",
        "rate_lock_strength": "loose",
        "is_absentee_owner": 0,
        "is_llc_owner": 0,
        "is_pre_foreclosure": 0,
        "is_probate": 0,
        "is_divorce": 0,
        "is_tax_delinquent": 0,
        "ncoa_mail_forward": 0,
    }
    for k, v in defaults.items():
        if k not in df.columns:
            df[k] = v
    monthly_p = predict_hazard(bundle, df)

    out = []
    for p_month in monthly_p:
        h90 = cumulative_hazard(np.array([p_month]), HORIZONS_MONTHS["90d"])
        h180 = cumulative_hazard(np.array([p_month]), HORIZONS_MONTHS["180d"])
        h365 = cumulative_hazard(np.array([p_month]), HORIZONS_MONTHS["365d"])
        # Bootstrap-ish CI from monthly variance — placeholder until we ship a
        # proper bootstrap or jackknife. ±10% relative for now.
        ci_lo = max(0.0, h90 - 0.10 * h90)
        ci_hi = min(1.0, h90 + 0.10 * h90)
        out.append(
            {
                "hazard_90d": round(h90, 4),
                "hazard_180d": round(h180, 4),
                "hazard_365d": round(h365, 4),
                "hazard_90d_ci_lo": round(ci_lo, 4),
                "hazard_90d_ci_hi": round(ci_hi, 4),
            }
        )
    return out
