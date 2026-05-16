"""Load real Grid signals + outcomes from Supabase, shape them as a training panel.

Activated when 6+ months of grid_outcomes are populated; until then, training runs
on synthetic data only (see synthetic_data.py).
"""
from __future__ import annotations
import os
import pandas as pd
from typing import Optional


def load_panel_from_supabase(
    url: Optional[str] = None,
    service_role_key: Optional[str] = None,
    workspace_ids: Optional[list[str]] = None,
) -> pd.DataFrame:
    """Construct the training panel by joining grid_signals + grid_outcomes.

    Each row = (property, observation-month) until the property lists or is censored.
    """
    try:
        from supabase import create_client
    except ImportError:
        raise SystemExit("supabase-py not installed. Add to pyproject and `uv pip install -e .`.")

    url = url or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = service_role_key or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError(
            "Supabase credentials missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
        )

    client = create_client(url, key)

    # Pull all grid_signals (point-in-time snapshots) and grid_outcomes for the
    # workspaces we're training on. In production this is filtered to a training-
    # window date range to avoid pulling the universe.
    sig_q = client.table("grid_signals").select(
        "id, workspace_id, property_address, property_zip, years_owned, estimated_value, "
        "estimated_equity, is_absentee_owner, is_pre_foreclosure, is_probate, is_divorce, "
        "is_tax_delinquent, refreshed_at, engine_version, effective_at, expires_at, "
        "pre_foreclosure_at, probate_filing_at, divorce_filing_at, tax_delinquent_at"
    )
    if workspace_ids:
        sig_q = sig_q.in_("workspace_id", workspace_ids)
    signals = pd.DataFrame(sig_q.execute().data or [])

    out_q = client.table("grid_outcomes").select(
        "signal_id, property_address, outcome_type, outcome_date, days_from_signal, workspace_id"
    )
    if workspace_ids:
        out_q = out_q.in_("workspace_id", workspace_ids)
    outcomes = pd.DataFrame(out_q.execute().data or [])

    if signals.empty:
        return pd.DataFrame()

    # Mark which signals have a "listed" outcome
    list_events = outcomes[outcomes["outcome_type"].isin(["listed", "agent_won"])]
    listed_addresses = set(list_events["property_address"].dropna().tolist())

    # For the V1 panel, we collapse to a single observation per signal — sufficient
    # for an MVP hazard fit. A true panel reconstruction (month-by-month observation
    # rows) requires materialized point-in-time feature snapshots, which lands in v2.1.
    signals["listed"] = signals["property_address"].isin(listed_addresses).astype(int)
    signals["equity_ratio"] = (
        signals["estimated_equity"].fillna(0) / signals["estimated_value"].replace(0, pd.NA)
    ).fillna(0)
    signals["zip"] = signals["property_zip"].fillna("00000")
    signals["is_llc_owner"] = 0  # not yet on grid_signals; can be added when sunbiz join lands
    signals["ncoa_mail_forward"] = 0
    signals["permit_class"] = "unknown"
    signals["rate_lock_strength"] = "loose"
    signals["obs_month"] = 0
    signals["obs_date"] = signals["refreshed_at"].astype(str).str.slice(0, 10)

    cols = [
        "property_address", "zip", "obs_month", "obs_date",
        "years_owned", "estimated_value", "equity_ratio",
        "is_absentee_owner", "is_llc_owner",
        "is_pre_foreclosure", "is_probate", "is_divorce", "is_tax_delinquent",
        "ncoa_mail_forward", "permit_class", "rate_lock_strength", "listed",
    ]
    return signals[cols].copy()
