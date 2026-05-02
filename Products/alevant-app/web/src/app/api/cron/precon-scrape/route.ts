import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";

/**
 * Pre-construction scraper cron — refreshes Miami tower data daily.
 * V1: stub. V2: scrape CondoBlackBook + curated developer sites (PRAIX scraper pattern).
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.VERCEL_ENV === "production" && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const svc = getSupabaseService();
  const { data: towers } = await svc.from("preconstruction_towers").select("id");
  return NextResponse.json({ refreshed: towers?.length || 0 });
}
