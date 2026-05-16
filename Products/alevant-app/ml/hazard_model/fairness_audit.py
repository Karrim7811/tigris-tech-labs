"""Fair Housing fairness audit for the Grid hazard model.

The model's predictions are tested for disparate impact across HUD-protected classes.
Tests:
  1. Disparate impact ratio (80% rule)
  2. Equal opportunity (TPR parity)
  3. Calibration parity (subgroup-level calibration delta)
  4. Demographic parity

Failures block promotion. There is no auto-override.

Protected-class attributes for ALEVANT (HUD/FHA):
  - race / color / national origin / religion / sex / familial status / disability

These attributes are inferred *for testing only* via BIFSG + census-tract overlay.
They live in a separate `fairness_test_attributes` table outside product RLS and
must never be input features.
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from dataclasses import dataclass, asdict


GATES = {
    "disparate_impact_min": 0.80,
    "equal_opportunity_delta_max": 0.10,
    "calibration_delta_max": 0.07,
    "demographic_parity_delta_max": 0.10,
}


@dataclass
class FairnessResult:
    metric: str
    group_a: str
    group_b: str
    value: float
    threshold: float
    passed: bool

    def as_dict(self) -> dict:
        return asdict(self)


def _tpr(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    pos = y_true == 1
    if pos.sum() == 0:
        return 0.0
    return float(((y_pred == 1) & pos).sum() / pos.sum())


def _calibration(y_true: np.ndarray, p: np.ndarray, n_bins: int = 10) -> float:
    """Expected calibration error within a subgroup."""
    if len(y_true) == 0:
        return 0.0
    edges = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    n = len(y_true)
    for i in range(n_bins):
        m = (p >= edges[i]) & (p < edges[i + 1])
        if not m.any():
            continue
        ece += (m.sum() / n) * abs(p[m].mean() - y_true[m].mean())
    return float(ece)


def audit(
    y_true: np.ndarray,
    p_pred: np.ndarray,
    group: np.ndarray,
    threshold: float = 0.5,
) -> dict:
    """Run the audit. `group` is a per-row protected-class label.

    Returns:
      {
        "tests": [FairnessResult, ...],
        "passed": bool,
        "by_group": {group: {selection_rate, tpr, calibration, n}},
        "gates": GATES,
      }
    """
    df = pd.DataFrame({"y": y_true, "p": p_pred, "g": group})
    df["pred"] = (df["p"] >= threshold).astype(int)

    by_group: dict[str, dict] = {}
    for g, sub in df.groupby("g"):
        by_group[str(g)] = {
            "n": int(len(sub)),
            "selection_rate": float(sub["pred"].mean()),
            "tpr": _tpr(sub["y"].values, sub["pred"].values),
            "calibration_ece": _calibration(sub["y"].values, sub["p"].values),
            "positive_rate": float(sub["y"].mean()),
        }

    if len(by_group) < 2:
        # Cannot audit with fewer than two groups.
        return {
            "tests": [],
            "passed": False,
            "by_group": by_group,
            "gates": GATES,
            "note": "fewer than two protected-class groups present",
        }

    # Pick reference group = highest selection rate (most-selected = majority-equivalent)
    ref = max(by_group, key=lambda k: by_group[k]["selection_rate"])

    tests: list[FairnessResult] = []

    for g, m in by_group.items():
        if g == ref:
            continue

        # 1. Disparate impact ratio (80% rule)
        di_ratio = (
            m["selection_rate"] / by_group[ref]["selection_rate"]
            if by_group[ref]["selection_rate"] > 0
            else 0.0
        )
        tests.append(
            FairnessResult(
                metric="disparate_impact_ratio",
                group_a=g,
                group_b=ref,
                value=float(di_ratio),
                threshold=GATES["disparate_impact_min"],
                passed=di_ratio >= GATES["disparate_impact_min"],
            )
        )

        # 2. Equal opportunity (TPR delta)
        tpr_delta = abs(m["tpr"] - by_group[ref]["tpr"])
        tests.append(
            FairnessResult(
                metric="equal_opportunity_delta",
                group_a=g,
                group_b=ref,
                value=float(tpr_delta),
                threshold=GATES["equal_opportunity_delta_max"],
                passed=tpr_delta <= GATES["equal_opportunity_delta_max"],
            )
        )

        # 3. Calibration parity
        cal_delta = abs(m["calibration_ece"] - by_group[ref]["calibration_ece"])
        tests.append(
            FairnessResult(
                metric="calibration_delta",
                group_a=g,
                group_b=ref,
                value=float(cal_delta),
                threshold=GATES["calibration_delta_max"],
                passed=cal_delta <= GATES["calibration_delta_max"],
            )
        )

        # 4. Demographic parity delta
        dp_delta = abs(m["selection_rate"] - by_group[ref]["selection_rate"])
        tests.append(
            FairnessResult(
                metric="demographic_parity_delta",
                group_a=g,
                group_b=ref,
                value=float(dp_delta),
                threshold=GATES["demographic_parity_delta_max"],
                passed=dp_delta <= GATES["demographic_parity_delta_max"],
            )
        )

    return {
        "tests": [t.as_dict() for t in tests],
        "passed": all(t.passed for t in tests),
        "by_group": by_group,
        "gates": GATES,
        "reference_group": ref,
    }
