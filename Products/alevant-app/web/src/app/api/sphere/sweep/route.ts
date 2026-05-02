import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";

/**
 * Sphere Brain — daily sweep.
 * Detects: anniversaries, equity-position alerts, LinkedIn job changes,
 * permit pulls in farm zones, life events from public records.
 *
 * V1: anniversary + birthday + equity-position only (signals derivable from
 * existing data without external integrations).
 */
export async function POST() {
  const svc = getSupabaseService();
  const { data: workspaces } = await svc.from("workspaces").select("id").eq("status", "active");
  let total_signals = 0;

  for (const ws of workspaces || []) {
    // Anniversaries: closed transactions from same month, prior years
    const today = new Date();
    const monthStart = new Date(today.getFullYear() - 1, today.getMonth(), 1);
    const { data: pastClosings } = await svc
      .from("transactions")
      .select("id, property_address, actual_close, listing_id, buyer_id")
      .eq("workspace_id", ws.id)
      .eq("status", "closed")
      .gte("actual_close", monthStart.toISOString().split("T")[0]);

    for (const tx of pastClosings || []) {
      const closeDate = new Date(tx.actual_close as string);
      if (closeDate.getMonth() === today.getMonth()) {
        // Anniversary signal
        const contactId = (tx as any).buyer_id;
        if (!contactId) continue;
        await svc.from("sphere_signals").insert({
          workspace_id: ws.id,
          contact_id: contactId,
          signal_type: "close_anniversary",
          signal_data: {
            years: today.getFullYear() - closeDate.getFullYear(),
            property_address: tx.property_address,
          },
          confidence: 95,
        });
        total_signals++;
      }
    }
  }

  return NextResponse.json({ swept: workspaces?.length || 0, signals_added: total_signals });
}

export async function GET(req: Request) {
  return POST();
}
