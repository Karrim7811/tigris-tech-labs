"""Feature engineering for the Grid hazard model.

Hard rule: every feature value at observation month t must be the value as it would
have been known at the START of t — never current state. Feature snapshots are
constructed by joining a property at month t against signal values with
`effective_at <= month_start` and `expires_at > month_start`.

This file defines the canonical feature contract used at both training and inference.
"""
from __future__ import annotations
import numpy as np
import pandas as pd

FEATURE_COLUMNS: list[str] = [
    "years_owned",
    "years_owned_sq",
    "long_tenure",
    "equity_ratio",
    "log_estimated_value",
    "is_absentee_owner",
    "is_llc_owner",
    # distress
    "is_pre_foreclosure",
    "is_probate",
    "is_divorce",
    "is_tax_delinquent",
    "ncoa_mail_forward",
    # multimodal
    "permit_stay",
    "permit_flip",
    "rate_lock_tight",
    "rate_lock_moderate",
]

CATEGORICAL_PERMIT = {"stay": "permit_stay", "flip": "permit_flip"}
CATEGORICAL_RATE = {"tight": "rate_lock_tight", "moderate": "rate_lock_moderate"}


def engineer(panel: pd.DataFrame) -> pd.DataFrame:
    """Project the raw panel into the model's feature matrix.

    Does NOT include the per-zip random effect — that is handled inside the training
    function (kept as a separate column the model adds as a categorical).
    """
    df = panel.copy()

    df["years_owned_sq"] = df["years_owned"] ** 2
    df["long_tenure"] = (df["years_owned"] >= 13).astype(int)
    df["log_estimated_value"] = np.log1p(df["estimated_value"])

    for cat, col in CATEGORICAL_PERMIT.items():
        df[col] = (df["permit_class"] == cat).astype(int)
    for cat, col in CATEGORICAL_RATE.items():
        df[col] = (df["rate_lock_strength"] == cat).astype(int)

    # Ensure all expected columns exist (defensive for sparse panels)
    for c in FEATURE_COLUMNS:
        if c not in df.columns:
            df[c] = 0

    return df


def X_y_zip(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series, pd.Series]:
    """Return the (features, label, zip-effect-key) triple.

    `listed` is optional — when called for inference on unlabeled rows we return a
    zero-vector label of matching length. Trainers must always pass a labeled panel.
    """
    X = df[FEATURE_COLUMNS].astype(float)
    y = (df["listed"].astype(int) if "listed" in df.columns else pd.Series(0, index=df.index, dtype=int))
    z = df["zip"].astype(str) if "zip" in df.columns else pd.Series("00000", index=df.index, dtype=str)
    return X, y, z
