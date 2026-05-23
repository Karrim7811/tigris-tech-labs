import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";

/**
 * Sphere Brain — daily sweep.
 * Detects: anniversaries, equity-position alerts, LinkedIn job changes,
 * permit pulls in farm zones, life events from public records.
 *
 * V1: anniversary only (signals derivable from existing data without external
 * integrations). Future generators land in lib/sphere/*.
 *
 * Auth: gated by CRON_SECRET — same posture as every other cron endpoint.
 */

function authorized(req: Request): boolean {
  // In production, require a Bearer CRON_SECRET. In dev (no VERCEL_ENV), accept
  // either the bearer or a missing secret so local sweeps work without setup.
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (process.env.VERCEL_ENV === "production") {
    return !!secret && auth === `Bearer ${secret}`;
  }
  if (!secret) return true;
  return auth === `Bearer ${secret}`;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const svc = getSupabaseService();
  const { data: workspaces } = await svc.from("workspaces").select("id").eq("status", "active");
  let total_signals = 0;

  for (const ws of workspaces || []) {
    // Anniversaries: closed transactions from same month, prior years
    const today = new Date();
    const monthStart = new Date(today.getFullYear() - 1, today.getMonth(), 1);
    const { data: pastClosings } = await svc
      .from("transactions")
      .select("id, property_address, actual_close, buyer_id")
      .eq("workspace_id", ws.id)
      .eq("status", "closed")
      .gte("actual_close", monthStart.toISOString().split("T")[0]);

    for (const tx of pastClosings || []) {
      const closeDate = new Date(tx.actual_close as string);
      if (closeDate.getMonth() !== today.getMonth()) continue;

      // tx.buyer_id is an FK to buyers, not contacts. Resolve to the actual
      // contact_id before inserting; sphere_signals.contact_id FK-references
      // contacts(id).
      if (!tx.buyer_id) continue;
      const { data: buyer } = await svc
        .from("buyers")
        .select("contact_id")
        .eq("id", tx.buyer_id)
        .maybeSingle();
      const contactId = buyer?.contact_id;
      if (!contactId) continue;

      // Idempotency: don't double-insert anniversary signals for the same
      // (workspace, contact, anniversary year).
      const years = today.getFullYear() - closeDate.getFullYear();
      const { data: existing } = await svc
        .from("sphere_signals")
        .select("id")
        .eq("workspace_id", ws.id)
        .eq("contact_id", contactId)
        .eq("signal_type", "close_anniversary")
        .contains("signal_data", { years, property_address: tx.property_address })
        .maybeSingle();
      if (existing) continue;

      await svc.from("sphere_signals").insert({
        workspace_id: ws.id,
        contact_id: contactId,
        signal_type: "close_anniversary",
        signal_data: {
          years,
          property_address: tx.property_address,
        },
        confidence: 95,
      });
      total_signals++;
    }
  }

  return NextResponse.json({ swept: workspaces?.length || 0, signals_added: total_signals });
}

export async function GET(req: Request) {
  return POST(req);
}
