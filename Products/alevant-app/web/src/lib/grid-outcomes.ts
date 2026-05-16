// Grid Outcomes — closed-loop ground truth ingestion and lift metrics.
//
// Without outcomes, the Grid never learns. This module exposes:
//   - recordOutcome()     — single-entry write
//   - reconcileMlsEvent() — webhook handler for listing events
//   - reconcileOwnerChange() — re-scan detected new owner (off-market sale)
//   - computeLift()       — per-workspace cohort lift vs. random baseline
//
// Every write is also mirrored to grid_audit_events so the audit log can answer
// "for each Grid prediction in cohort C, what happened next?"

import type { SupabaseClient } from "@supabase/supabase-js";

export type OutcomeType =
  | "listed"
  | "sold_off_market"
  | "agent_contacted"
  | "agent_won"
  | "agent_lost"
  | "dead_signal"
  | "re_listed"
  | "withdrawn";

export type OutcomeSource =
  | "mls"
  | "agent_manual"
  | "public_records"
  | "sphere"
  | "sofia"
  | "vesper";

export interface RecordOutcomeInput {
  workspace_id: string;
  property_address: string;
  outcome_type: OutcomeType;
  outcome_source: OutcomeSource;
  outcome_date: string; // YYYY-MM-DD
  outcome_value_usd?: number;
  notes?: string;
}

export async function recordOutcome(
  svc: SupabaseClient,
  input: RecordOutcomeInput
): Promise<{ id?: string; days_from_signal?: number }> {
  // Find the matching signal (if any) for this property in this workspace.
  const { data: signal } = await svc
    .from("grid_signals")
    .select("id, refreshed_at, engine_version, motivation_score, hazard_90d")
    .eq("workspace_id", input.workspace_id)
    .eq("property_address", input.property_address)
    .maybeSingle();

  let days_from_signal: number | undefined;
  if (signal?.refreshed_at) {
    const outcomeMs = new Date(input.outcome_date).getTime();
    const signalMs = new Date(signal.refreshed_at).getTime();
    days_from_signal = Math.round((outcomeMs - signalMs) / 86_400_000);
  }

  const payload = {
    workspace_id: input.workspace_id,
    signal_id: signal?.id ?? null,
    property_address: input.property_address,
    outcome_type: input.outcome_type,
    outcome_source: input.outcome_source,
    outcome_date: input.outcome_date,
    outcome_value_usd: input.outcome_value_usd ?? null,
    days_from_signal: days_from_signal ?? null,
    notes: input.notes ?? null,
    signal_engine_version: signal?.engine_version ?? null,
    signal_motivation_score: signal?.motivation_score ?? null,
    signal_hazard_90d: signal?.hazard_90d ?? null,
  };

  const { data: created, error } = await svc
    .from("grid_outcomes")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;

  // Mirror to audit log.
  await svc.from("grid_audit_events").insert({
    workspace_id: input.workspace_id,
    event_type: "outcome_attached",
    signal_id: signal?.id ?? null,
    property_address: input.property_address,
    output_snapshot: payload,
    served_by: input.outcome_source,
  });

  return { id: created?.id, days_from_signal };
}

/**
 * Reconciliation path: when an MLS webhook delivers a listing event, attach it
 * as an outcome on any Grid signal pointing at the same address.
 */
export async function reconcileMlsEvent(
  svc: SupabaseClient,
  ev: {
    property_address: string;
    list_date?: string;
    sold_date?: string;
    sold_price_usd?: number;
    withdrawn_date?: string;
  }
) {
  // Find all workspaces with a signal on this address.
  const { data: signals } = await svc
    .from("grid_signals")
    .select("workspace_id")
    .eq("property_address", ev.property_address);
  if (!signals?.length) return { matched: 0 };

  let matched = 0;
  for (const s of signals) {
    if (ev.sold_date) {
      await recordOutcome(svc, {
        workspace_id: s.workspace_id,
        property_address: ev.property_address,
        outcome_type: "sold_off_market", // closed via MLS but to another agent (worst case)
        outcome_source: "mls",
        outcome_date: ev.sold_date,
        outcome_value_usd: ev.sold_price_usd,
      });
      matched++;
    } else if (ev.list_date) {
      await recordOutcome(svc, {
        workspace_id: s.workspace_id,
        property_address: ev.property_address,
        outcome_type: "listed",
        outcome_source: "mls",
        outcome_date: ev.list_date,
      });
      matched++;
    } else if (ev.withdrawn_date) {
      await recordOutcome(svc, {
        workspace_id: s.workspace_id,
        property_address: ev.property_address,
        outcome_type: "withdrawn",
        outcome_source: "mls",
        outcome_date: ev.withdrawn_date,
      });
      matched++;
    }
  }
  return { matched };
}

/**
 * Reconciliation path: a re-scan of public records detects a new owner_name on a
 * property that previously had a Grid signal. That's an off-market sale we missed.
 */
export async function reconcileOwnerChange(
  svc: SupabaseClient,
  ev: {
    property_address: string;
    new_owner_name: string;
    detected_at: string;
    prior_owner_name?: string;
  }
) {
  const { data: signals } = await svc
    .from("grid_signals")
    .select("workspace_id, owner_name")
    .eq("property_address", ev.property_address);
  if (!signals?.length) return { matched: 0 };

  let matched = 0;
  for (const s of signals) {
    if (
      s.owner_name &&
      ev.new_owner_name &&
      s.owner_name.toLowerCase() === ev.new_owner_name.toLowerCase()
    ) {
      continue; // not actually changed
    }
    await recordOutcome(svc, {
      workspace_id: s.workspace_id,
      property_address: ev.property_address,
      outcome_type: "sold_off_market",
      outcome_source: "public_records",
      outcome_date: ev.detected_at,
      notes: `Owner change detected: ${s.owner_name ?? "unknown"} → ${ev.new_owner_name}`,
    });
    matched++;
  }
  return { matched };
}

/**
 * Per-workspace cohort lift over a rolling window.
 * Lift = (positive rate among Grid-flagged) / (positive rate among random in same farm).
 * "Positive" = an outcome_type in the win set within the look-forward window.
 */
export async function computeLift(
  svc: SupabaseClient,
  workspaceId: string,
  windowDays: number = 90
) {
  const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();

  // Flagged cohort: signals with score >= 65 ("hot" or "blazing") in the window.
  const { data: flagged } = await svc
    .from("grid_signals")
    .select("id")
    .eq("workspace_id", workspaceId)
    .gte("refreshed_at", since)
    .gte("motivation_score", 65);

  const flaggedIds = (flagged ?? []).map((r) => r.id);

  // Outcomes attached to flagged cohort
  const { data: hits } = flaggedIds.length
    ? await svc
        .from("grid_outcomes")
        .select("outcome_type")
        .eq("workspace_id", workspaceId)
        .in("signal_id", flaggedIds)
        .in("outcome_type", ["listed", "agent_won", "sold_off_market"])
    : { data: [] };

  const flaggedTotal = flaggedIds.length;
  const flaggedHits = (hits ?? []).length;
  const flaggedRate = flaggedTotal > 0 ? flaggedHits / flaggedTotal : 0;

  // Baseline: all signals in window regardless of score
  const { data: baseline } = await svc
    .from("grid_signals")
    .select("id")
    .eq("workspace_id", workspaceId)
    .gte("refreshed_at", since);
  const baseIds = (baseline ?? []).map((r) => r.id);
  const { data: baseHits } = baseIds.length
    ? await svc
        .from("grid_outcomes")
        .select("outcome_type")
        .eq("workspace_id", workspaceId)
        .in("signal_id", baseIds)
        .in("outcome_type", ["listed", "agent_won", "sold_off_market"])
    : { data: [] };
  const baseTotal = baseIds.length;
  const baseHitsN = (baseHits ?? []).length;
  const baseRate = baseTotal > 0 ? baseHitsN / baseTotal : 0;

  const lift = baseRate > 0 ? flaggedRate / baseRate : null;

  return {
    window_days: windowDays,
    flagged_count: flaggedTotal,
    flagged_outcomes: flaggedHits,
    flagged_rate: flaggedRate,
    baseline_count: baseTotal,
    baseline_outcomes: baseHitsN,
    baseline_rate: baseRate,
    lift,
  };
}
