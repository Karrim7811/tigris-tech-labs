"""Isotonic-regression calibration layer.

Maps raw model output → empirically-calibrated probability. A model with great AUC
but miscalibrated probabilities is unfit for product use — the agent needs the 47%
to actually mean ~47%.
"""
from __future__ import annotations
import numpy as np
from sklearn.isotonic import IsotonicRegression


class IsotonicCalibrator:
    """Thin wrapper exposing fit / transform with safe edge handling."""

    def __init__(self):
        self._iso = IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=1.0)
        self._fitted = False

    def fit(self, raw: np.ndarray, y_true: np.ndarray) -> "IsotonicCalibrator":
        # Need both classes present.
        if len(np.unique(y_true)) < 2:
            # Fall back to identity if data is degenerate.
            self._iso = None
            self._fitted = True
            return self
        self._iso.fit(raw, y_true)
        self._fitted = True
        return self

    def transform(self, raw: np.ndarray) -> np.ndarray:
        if not self._fitted:
            raise RuntimeError("IsotonicCalibrator not fitted")
        if self._iso is None:
            return raw.copy()
        return self._iso.transform(raw)


def fit_isotonic(raw: np.ndarray, y_true: np.ndarray) -> IsotonicCalibrator:
    """Convenience: fit and return a calibrator."""
    cal = IsotonicCalibrator()
    cal.fit(raw, y_true)
    return cal


def reliability_curve(p: np.ndarray, y: np.ndarray, n_bins: int = 10):
    """Return (bin_centers, observed_rate, predicted_rate, bin_counts) for plotting."""
    edges = np.linspace(0, 1, n_bins + 1)
    centers = (edges[:-1] + edges[1:]) / 2
    observed = np.zeros(n_bins)
    predicted = np.zeros(n_bins)
    counts = np.zeros(n_bins, dtype=int)
    for i in range(n_bins):
        mask = (p >= edges[i]) & (p < edges[i + 1])
        if mask.any():
            observed[i] = y[mask].mean()
            predicted[i] = p[mask].mean()
            counts[i] = int(mask.sum())
    return centers, observed, predicted, counts
