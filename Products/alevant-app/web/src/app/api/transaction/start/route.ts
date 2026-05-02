import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { buildResidentialTimeline } from "@/lib/transaction-brain";

/**
 * POST /api/transaction/start — initiate Transaction Brain orchestration.
 * Body: { listing_id?, buyer_id?, side, contract_date, contract_price, expected_close? }
 * Returns: { transaction_id, milestones[] }
 */
export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const svc = getSupabaseService();
  const { data: ws } = await svc.from("workspaces").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (!ws) return NextResponse.json({ error: "no workspace" }, { status: 404 });

  const timeline = buildResidentialTimeline(body.contract_date, body.expected_close);

  const { data: tx } = await svc
    .from("transactions")
    .insert({
      workspace_id: ws.id,
      side: body.side,
      property_address: body.property_address,
      listing_id: body.listing_id,
      buyer_id: body.buyer_id,
      contract_date: body.contract_date,
      expected_close: body.expected_close || timeline[timeline.length - 1].due_date,
      contract_price: body.contract_price,
      status: "active",
      timeline_json: timeline,
    })
    .select()
    .single();

  // Create milestone rows for granular nudge tracking
  for (const m of timeline) {
    await svc.from("transaction_milestones").insert({
      transaction_id: tx!.id,
      type: m.type,
      due_date: m.due_date,
      status: m.status,
    });
  }

  return NextResponse.json({ transaction_id: tx!.id, timeline });
}
