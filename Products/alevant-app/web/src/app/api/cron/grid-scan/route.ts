import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";

/**
 * Daily Grid scan cron.
 * For each active workspace's farm zones, scans a quota of properties → fuses public records →
 * scores → persists/updates grid_signals.
 *
 * V1: requires an address-generation pipeline per zip (e.g. property tax roll iteration).
 * For Bichi pilot: addresses come from zip-level tax-roll bulk download (Miami-Dade publishes
 * folio rolls quarterly). Stub for now — orchestrator wired and ready.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.VERCEL_ENV === "production" && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const svc = getSupabaseService();
  const { data: zones } = await svc
    .from("grid_farm_zones")
    .select("workspace_id, zone_label, zip_codes, weekly_lead_quota")
    .eq("active", true);

  let scanned = 0;
  for (const zone of zones || []) {
    // V2: enumerate addresses per zip from tax-roll bulk download → call /api/grid/scan
    // V1 stub records the cron run.
    scanned += zone.zip_codes?.length || 0;
  }
  return NextResponse.json({ zones: zones?.length || 0, zips_queued: scanned });
}
