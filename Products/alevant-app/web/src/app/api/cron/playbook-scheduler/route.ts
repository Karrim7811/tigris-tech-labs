import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";
import { surfaceDueSteps } from "@/lib/playbook-engine";

/**
 * GET /api/cron/playbook-scheduler
 *
 * Marks scheduled steps as surfaced when their due_at has passed. Mirrors a single
 * audit event per pass.
 *
 * Hardened: requires Vercel cron header OR a shared secret.
 */
export async function GET(req: Request) {
  if (
    req.headers.get("x-vercel-cron") !== "1" &&
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET ?? ""}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const svc = getSupabaseService();
  const surfaced = await surfaceDueSteps(svc);

  await svc.from("grid_audit_events").insert({
    event_type: "feature_update",
    model_name: "playbook.scheduler",
    output_snapshot: { surfaced_count: surfaced, ran_at: new Date().toISOString() },
    served_by: "cron.playbook-scheduler",
  });

  return NextResponse.json({ ok: true, surfaced });
}
