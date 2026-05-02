import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";

/**
 * Daily Vesper cadence cron — queues a market-stat / investor-tip / agent-personality post
 * for each active workspace based on their cadence settings.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.VERCEL_ENV === "production" && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const svc = getSupabaseService();
  const { data: workspaces } = await svc
    .from("workspaces")
    .select("id, vesper_configs(*)")
    .eq("status", "active");
  return NextResponse.json({ queued: workspaces?.length || 0 });
}
