import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { scanAll } from "@/lib/news/scanner";

export const maxDuration = 60;

/**
 * POST /api/news/scan — run a full news scan for the user's workspace.
 * Persists results as news_alerts rows.
 */
export async function POST() {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = getSupabaseService();
  const { data: ws } = await svc.from("workspaces").select("id, name").eq("owner_user_id", user.id).maybeSingle();
  if (!ws) return NextResponse.json({ error: "no workspace" }, { status: 404 });

  const [{ data: zones }, { data: listings }] = await Promise.all([
    svc.from("grid_farm_zones").select("zip_codes").eq("workspace_id", ws.id).eq("active", true),
    svc.from("listings").select("id, address, price, zip").eq("workspace_id", ws.id).eq("status", "active").limit(20),
  ]);

  const farmZips = (zones || []).flatMap((z: any) => z.zip_codes || []);
  const items = await scanAll({
    workspace_id: ws.id,
    market: "Miami",
    farm_zips: farmZips,
    active_listings: (listings || []).map((l: any) => ({ id: l.id, address: l.address, price: Number(l.price) || 0, zip: l.zip })),
    agent_name: ws.name,
    brokerage: "Keller Williams Capital Realty",
    competitor_brokerages: ["Compass", "Douglas Elliman", "The Agency", "ONE Sotheby's"],
  });

  // Persist
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

  return NextResponse.json({ scanned: items.length });
}
