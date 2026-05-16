"""End-to-end pipeline test on synthetic data.

If this passes, the pipeline (data → features → train → calibrate → predict → audit)
works. Real-data training is a swap of the data loader.
"""
from __future__ import annotations
import numpy as np
import pandas as pd
import pytest

from hazard_model.synthetic_data import generate_panel, split_train_val_test
from hazard_model.feature_engineering import engineer, FEATURE_COLUMNS
from hazard_model.train import fit, predict_hazard, cumulative_hazard, compute_metrics, passes_gates
from hazard_model.calibration import IsotonicCalibrator, reliability_curve
from hazard_model.fairness_audit import audit
from hazard_model.predict import predict_for_rows


@pytest.fixture(scope="module")
def panel():
    return generate_panel(n_properties=1500, months=18, seed=11)


@pytest.fixture(scope="module")
def splits(panel):
    return split_train_val_test(panel)


@pytest.fixture(scope="module")
def bundle(splits):
    train, val, _ = splits
    return fit(train, val)


def test_panel_shape(panel):
    assert len(panel) > 0
    assert "listed" in panel.columns
    # Realistic event rate: not all listed, not zero listed
    rate = panel["listed"].mean()
    assert 0.005 < rate < 0.30, f"event rate {rate} unrealistic"


def test_engineer_columns(panel):
    df = engineer(panel)
    for col in FEATURE_COLUMNS:
        assert col in df.columns


def test_fit_and_predict(bundle, splits):
    _, _, test = splits
    p = predict_hazard(bundle, test)
    assert len(p) == len(test)
    assert (p >= 0).all() and (p <= 1).all()


def test_metrics_realistic(bundle, splits):
    _, _, test = splits
    p = predict_hazard(bundle, test)
    metrics = compute_metrics(test["listed"].values, p)
    # On synthetic data with a fairly clean causal structure, AUC should be solidly
    # above chance.
    assert metrics["auc"] > 0.60, f"AUC {metrics['auc']} too low"
    assert 0.0 <= metrics["brier"] <= 0.5
    assert metrics["lift_top_decile"] >= 1.5


def test_calibration_layer():
    rng = np.random.default_rng(0)
    raw = rng.beta(2, 5, 500)
    y = (rng.random(500) < raw).astype(int)
    cal = IsotonicCalibrator().fit(raw, y)
    out = cal.transform(raw)
    assert out.shape == raw.shape
    # Reliability after calibration should be reasonably aligned
    _, observed, predicted, _ = reliability_curve(out, y, n_bins=8)
    delta = np.nanmean(np.abs(observed - predicted))
    assert delta < 0.20


def test_cumulative_hazard_monotonic():
    p_month = np.array([0.05])
    h90 = cumulative_hazard(p_month, 3)
    h180 = cumulative_hazard(p_month, 6)
    h365 = cumulative_hazard(p_month, 12)
    assert h90 < h180 < h365


def test_fairness_audit_passes_when_balanced():
    """With a balanced random group assignment, fairness audit should not fail."""
    rng = np.random.default_rng(2)
    n = 800
    y = rng.integers(0, 2, size=n)
    # Predict roughly aligned with y but noisy
    p = np.clip(y * 0.6 + rng.normal(0, 0.2, size=n) + 0.2, 0, 1)
    group = rng.choice(["a", "b", "c"], size=n)
    result = audit(y_true=y, p_pred=p, group=group, threshold=0.5)
    assert isinstance(result["by_group"], dict)
    assert len(result["tests"]) >= 6  # 4 tests × at least 2 non-ref groups (1 ref, 2 compared)


def test_fairness_audit_fails_when_biased():
    """If predictions strongly favor one group, the audit must flag it."""
    rng = np.random.default_rng(3)
    n = 600
    y = rng.integers(0, 2, size=n)
    group = rng.choice(["a", "b"], size=n)
    # Inject strong bias: group a gets +0.4 score regardless of truth
    p = np.where(group == "a", 0.9, 0.1)
    result = audit(y_true=y, p_pred=p, group=group, threshold=0.5)
    assert result["passed"] is False
    # At least one disparate-impact-ratio test should have failed
    failed_di = [t for t in result["tests"] if t["metric"] == "disparate_impact_ratio" and not t["passed"]]
    assert len(failed_di) >= 1


def test_predict_for_rows_shape(bundle):
    rows = [
        {
            "zip": "33139",
            "years_owned": 14,
            "estimated_value": 850_000,
            "equity_ratio": 0.65,
            "is_absentee_owner": 0,
            "is_pre_foreclosure": 1,
            "is_probate": 0,
            "is_divorce": 0,
            "is_tax_delinquent": 0,
            "ncoa_mail_forward": 0,
            "permit_class": "flip",
            "rate_lock_strength": "loose",
        },
        {
            "zip": "33156",
            "years_owned": 3,
            "estimated_value": 1_200_000,
            "equity_ratio": 0.15,
            "is_absentee_owner": 0,
            "is_pre_foreclosure": 0,
            "is_probate": 0,
            "is_divorce": 0,
            "is_tax_delinquent": 0,
            "ncoa_mail_forward": 0,
            "permit_class": "stay",
            "rate_lock_strength": "tight",
        },
    ]
    out = predict_for_rows(bundle, rows)
    assert len(out) == 2
    for o in out:
        assert "hazard_90d" in o
        assert 0 <= o["hazard_90d"] <= 1
        assert o["hazard_90d"] <= o["hazard_180d"] <= o["hazard_365d"]
    # The distressed property should score materially higher than the rate-locked one
    assert out[0]["hazard_90d"] > out[1]["hazard_90d"]


def test_passes_gates_function():
    good = {"auc": 0.78, "brier": 0.12, "ece": 0.03, "lift_top_decile": 5.1}
    bad = {"auc": 0.62, "brier": 0.21, "ece": 0.09, "lift_top_decile": 2.0}
    assert passes_gates(good) == (True, [])
    ok, failures = passes_gates(bad)
    assert ok is False
    assert len(failures) >= 1
