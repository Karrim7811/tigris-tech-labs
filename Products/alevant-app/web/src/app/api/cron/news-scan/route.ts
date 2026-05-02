import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";
import { scanAll } from "@/lib/news/scanner";

/**
 * Twice-daily news scan cron — fans out across all active workspaces.
 * Schedule: 11:00 UTC (7am ET) and 21:00 UTC (5pm ET).
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.VERCEL_ENV === "production" && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const svc = getSupabaseService();
  const { data: workspaces } = await svc.from("workspaces").select("id, name").eq("status", "active");
  let total = 0;
  for (const ws of workspaces || []) {
    try {
      const [{ data: zones }, { data: listings }] = await Promise.all([
        svc.from("grid_farm_zones").select("zip_codes").eq("workspace_id", ws.id).eq("active", true),
        svc.from("listings").select("id, address, price, zip").eq("workspace_id", ws.id).eq("status", "active").limit(10),
      ]);
      const items = await scanAll({
        workspace_id: ws.id,
        market: "Miami",
        farm_zips: (zones || []).flatMap((z: any) => z.zip_codes || []),
        active_listings: (listings || []).map((l: any) => ({ id: l.id, address: l.address, price: Number(l.price) || 0, zip: l.zip })),
        agent_name: ws.name,
        brokerage: "",
      });
      for (const i of items) {
        await svc.from("news_alerts").insert({
          workspace_id: ws.id,
          category: i.category,
          severity: i.severity,
          title: i.title,
          summary: i.summary,
          source_name: i.source_name,
          source_url: i.source_url,
          related_listing_id: i.related_listing_id,
          related_zip: i.related_zip,
          related_market: i.related_market,
        });
      }
      total += items.length;
    } catch {
      // skip per-workspace failures
    }
  }
  return NextResponse.json({ workspaces_scanned: workspaces?.length || 0, alerts_created: total });
}
