// Florida voter-roll signal — owner moved away signal.
//
// Source: Florida Division of Elections county voter file (per-county purchase ~$5;
// then quarterly delta files are free at https://dos.fl.gov/elections/).
//
// The signal pipeline:
//   1. Periodic ingest of the voter file into `florida_voter_roll_snapshots` (per-property
//      aggregate: active_voter_count, total_voter_count, most_recent_registration).
//   2. Diff most-recent snapshot vs prior snapshot for the same property.
//   3. If active_voter_count dropped while total stayed similar, the registered voter
//      moved (deactivated at that address) — high-confidence move signal.
//
// This file is the LOOKUP side. The ingest job is a separate batch process (typically
// run quarterly when FL DoS publishes deltas) — that lives in a worker, not here.

import type { VoterRollSnapshot } from "./types";
import { getSupabaseService } from "@/lib/supabase/server";

export async function getLatestVoterSnapshot(
  county: string,
  residence_address: string
): Promise<VoterRollSnapshot | null> {
  const svc = getSupabaseService();
  const { data } = await svc
    .from("florida_voter_roll_snapshots")
    .select("*")
    .eq("county", county)
    .ilike("residence_address", residence_address)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    county: data.county,
    residence_address: data.residence_address,
    snapshot_date: data.snapshot_date,
    active_voter_count: data.active_voter_count ?? 0,
    total_voter_count: data.total_voter_count ?? 0,
    most_recent_registration: data.most_recent_registration ?? undefined,
  };
}

/**
 * Detect "active voter dropped from this address" by diffing the two most recent
 * snapshots. Returns true when the active_voter_count dropped by ≥1 while total
 * stayed roughly the same (move-out, not death — different signal).
 */
export async function detectRecentVoterDrop(
  county: string,
  residence_address: string
): Promise<{ recent_drop: boolean; latest: VoterRollSnapshot | undefined }> {
  const svc = getSupabaseService();
  const { data } = await svc
    .from("florida_voter_roll_snapshots")
    .select("*")
    .eq("county", county)
    .ilike("residence_address", residence_address)
    .order("snapshot_date", { ascending: false })
    .limit(2);
  if (!data || data.length < 2) {
    return { recent_drop: false, latest: (data?.[0] as VoterRollSnapshot) ?? undefined };
  }
  const [latest, prior] = data;
  const drop = (prior.active_voter_count ?? 0) - (latest.active_voter_count ?? 0);
  const totalDelta = Math.abs((prior.total_voter_count ?? 0) - (latest.total_voter_count ?? 0));
  return {
    recent_drop: drop >= 1 && totalDelta <= drop, // move-out, not full household refresh
    latest: latest as VoterRollSnapshot,
  };
}
