import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";

/**
 * GET /api/cron/grid-decay
 *
 * Nightly job: re-score (or downgrade) signals whose effective signals have decayed
 * past their TTL. Strategy:
 *   1. Mark expired signals as band='watch' (drops them out of the actionable list).
 *   2. Schedule them for re-scan on the next farm-zone refresh — that's when
 *      whoever owns the zone can pull a fresh signal.
 *
 * Authorization: Vercel cron sets the `x-vercel-cron` header; reject otherwise to
 * prevent accidental external triggers.
 */
export async function GET(req: Request) {
  if (
    req.headers.get("x-vercel-cron") !== "1" &&
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET ?? ""}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const svc = getSupabaseService();
  const now = new Date().toISOString();

  // Count expired signals before update for telemetry.
  const { count: expiredCount } = await svc
    .from("grid_signals")
    .select("id", { count: "exact", head: true })
    .lt("expires_at", now);

  // Mark them — we don't delete; the audit log requires permanence.
  const { error } = await svc
    .from("grid_signals")
    .update({ status: "expired" })
    .lt("expires_at", now)
    .neq("status", "expired");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit a single decay-pass event (no workspace_id — global).
  await svc.from("grid_audit_events").insert({
    workspace_id: null,
    event_type: "feature_update",
    model_name: "grid.heuristic",
    output_snapshot: { decay_pass_at: now, expired_count: expiredCount ?? 0 },
    served_by: "cron.grid-decay",
  });

  return NextResponse.json({ ok: true, expired_count: expiredCount ?? 0 });
}
