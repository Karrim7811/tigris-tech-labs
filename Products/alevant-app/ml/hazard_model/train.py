"""Train the Grid v2 hazard model.

Methodology: discrete-time logistic survival model with per-zip random effects
(implemented as fixed effects with shrinkage for V1 — true MixedLM is heavier and
becomes worth it once we have >40 positives per zip).

Inputs: panel from `feature_engineering.engineer(...)` plus the listed label.
Outputs:
  - joblib-serialized model bundle (features, base coefs, zip intercepts, isotonic)
  - metrics JSON (AUC, Brier, calibration ECE, lift at top decile)
  - fairness-audit JSON (filled by fairness_audit.audit)

Promotion gate: every metric must pass thresholds before status → 'champion'.
"""
from __future__ import annotations
import json
import argparse
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, brier_score_loss

from . import calibration as calib_mod
from .feature_engineering import engineer, X_y_zip, FEATURE_COLUMNS
from .synthetic_data import generate_panel, split_train_val_test


def _zip_dummies(zip_series: pd.Series, vocab: list[str] | None = None) -> tuple[pd.DataFrame, list[str]]:
    if vocab is None:
        vocab = sorted(zip_series.unique().tolist())
    cols = {f"zip_{z}": (zip_series == z).astype(int) for z in vocab}
    return pd.DataFrame(cols, index=zip_series.index), vocab


def fit(panel_train: pd.DataFrame, panel_val: pd.DataFrame) -> dict:
    """Fit the model. Returns a bundle dict ready to serialize."""
    train = engineer(panel_train)
    val = engineer(panel_val)
    X_tr, y_tr, zip_tr = X_y_zip(train)
    X_va, y_va, zip_va = X_y_zip(val)

    zip_tr_df, vocab = _zip_dummies(zip_tr)
    zip_va_df, _ = _zip_dummies(zip_va, vocab=vocab)
    X_tr_full = pd.concat([X_tr, zip_tr_df], axis=1)
    X_va_full = pd.concat([X_va, zip_va_df], axis=1)

    # L2-regularized logistic regression as the discrete-time-hazard fit.
    # Strong regularization on zip dummies (separate group could be done via
    # column-specific penalty; for V1 we apply a uniform C and let SHRINK do the work).
    model = LogisticRegression(
        penalty="l2",
        C=1.0,
        solver="lbfgs",
        max_iter=2000,
        class_weight="balanced",
    )
    model.fit(X_tr_full, y_tr)

    raw_val = model.predict_proba(X_va_full)[:, 1]

    # Isotonic calibration on the validation set
    iso = calib_mod.fit_isotonic(raw_val, y_va.values)
    cal_val = iso.transform(raw_val)

    bundle = {
        "feature_columns": FEATURE_COLUMNS,
        "zip_vocab": vocab,
        "model": model,
        "isotonic": iso,
        "trained_at": pd.Timestamp.utcnow().isoformat(),
        "framework": "sklearn.LogisticRegression+isotonic",
        "engine_version": "v2.0.0-dev",
    }

    metrics = compute_metrics(y_va.values, cal_val)
    bundle["metrics_val"] = metrics
    return bundle


def predict_hazard(bundle: dict, panel: pd.DataFrame) -> np.ndarray:
    """Return calibrated per-month hazard probabilities for the panel."""
    df = engineer(panel)
    X, _, zip_s = X_y_zip(df)
    zip_df, _ = _zip_dummies(zip_s, vocab=bundle["zip_vocab"])
    X_full = pd.concat([X, zip_df], axis=1)
    raw = bundle["model"].predict_proba(X_full)[:, 1]
    return bundle["isotonic"].transform(raw)


def cumulative_hazard(monthly_p: np.ndarray | float, horizon_months: int) -> float:
    """Convert per-month hazard to P(event within `horizon_months`)."""
    arr = np.atleast_1d(np.asarray(monthly_p, dtype=float))
    p_survive = (1.0 - arr[0]) ** horizon_months
    return float(1.0 - p_survive)


def compute_metrics(y_true: np.ndarray, p_pred: np.ndarray) -> dict:
    """Validation metrics for promotion gating."""
    if len(np.unique(y_true)) < 2:
        return {"auc": float("nan"), "brier": float("nan"), "ece": float("nan"), "lift_top_decile": float("nan")}

    auc = float(roc_auc_score(y_true, p_pred))
    brier = float(brier_score_loss(y_true, p_pred))
    ece = _expected_calibration_error(y_true, p_pred)
    lift = _lift_at_top_decile(y_true, p_pred)
    return {"auc": auc, "brier": brier, "ece": ece, "lift_top_decile": lift}


def _expected_calibration_error(y_true: np.ndarray, p_pred: np.ndarray, n_bins: int = 10) -> float:
    bins = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    n = len(y_true)
    for i in range(n_bins):
        mask = (p_pred >= bins[i]) & (p_pred < bins[i + 1])
        if not mask.any():
            continue
        bin_p = p_pred[mask].mean()
        bin_y = y_true[mask].mean()
        ece += (mask.sum() / n) * abs(bin_p - bin_y)
    return float(ece)


def _lift_at_top_decile(y_true: np.ndarray, p_pred: np.ndarray) -> float:
    order = np.argsort(-p_pred)
    top_n = max(1, len(order) // 10)
    top_rate = y_true[order[:top_n]].mean()
    base_rate = y_true.mean() if y_true.mean() > 0 else 1e-9
    return float(top_rate / base_rate)


# Promotion gates (mirror docs/ALEVANT_Grid_Hazard_Model_Spec.md §6)
GATES = {
    "auc_min": 0.72,
    "brier_max": 0.18,
    "ece_max": 0.05,
    "lift_top_decile_min": 4.0,
}


def passes_gates(metrics: dict) -> tuple[bool, list[str]]:
    failures: list[str] = []
    if metrics.get("auc", 0) < GATES["auc_min"]:
        failures.append(f"AUC {metrics['auc']:.3f} < {GATES['auc_min']}")
    if metrics.get("brier", 1) > GATES["brier_max"]:
        failures.append(f"Brier {metrics['brier']:.3f} > {GATES['brier_max']}")
    if metrics.get("ece", 1) > GATES["ece_max"]:
        failures.append(f"ECE {metrics['ece']:.3f} > {GATES['ece_max']}")
    if metrics.get("lift_top_decile", 0) < GATES["lift_top_decile_min"]:
        failures.append(f"Lift {metrics['lift_top_decile']:.2f} < {GATES['lift_top_decile_min']}")
    return (len(failures) == 0, failures)


def save_bundle(bundle: dict, out_path: Path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, out_path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--synthetic", action="store_true", help="Use synthetic data (no Supabase)")
    ap.add_argument("--n", type=int, default=2000)
    ap.add_argument("--months", type=int, default=18)
    ap.add_argument("--out", type=str, default="artifacts/hazard_v2_dev.joblib")
    args = ap.parse_args()

    if args.synthetic:
        panel = generate_panel(n_properties=args.n, months=args.months, seed=7)
        train, val, test = split_train_val_test(panel)
        bundle = fit(train, val)

        # Test-set metrics (separately tracked)
        cal_test = predict_hazard(bundle, test)
        test_metrics = compute_metrics(test["listed"].values, cal_test)
        bundle["metrics_test"] = test_metrics

        ok, failures = passes_gates(test_metrics)
        bundle["promotion_eligible"] = ok
        bundle["promotion_failures"] = failures

        save_bundle(bundle, Path(args.out))
        print(json.dumps({
            "engine_version": bundle["engine_version"],
            "metrics_val": bundle["metrics_val"],
            "metrics_test": test_metrics,
            "promotion_eligible": ok,
            "promotion_failures": failures,
        }, indent=2))
    else:
        raise SystemExit("Real-data training requires Supabase outcomes and is unimplemented in V1. Pass --synthetic.")


if __name__ == "__main__":
    main()
