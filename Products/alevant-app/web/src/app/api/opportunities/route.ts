import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { STAGE_PROBABILITY, type OppStage, type OppSide } from "@/lib/opp-stages";

/**
 * GET  /api/opportunities?stage=&side=&open=true
 * POST /api/opportunities                          — create
 */

export async function GET(req: Request) {
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const svc = getSupabaseService();
  const { data: ws } = await svc
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!ws) return NextResponse.json({ error: "no workspace" }, { status: 404 });

  const url = new URL(req.url);
  const stage = url.searchParams.get("stage");
  const side = url.searchParams.get("side");
  const open = url.searchParams.get("open");

  let q = svc
    .from("opportunities")
    .select("*, contact:contacts(full_name, emails, phones, temperature, priority)")
    .eq("workspace_id", ws.id)
    .order("stage_changed_at", { ascending: false })
    .limit(500);
  if (stage) q = q.eq("stage", stage);
  if (side) q = q.eq("side", side);
  if (open === "true") q = q.not("stage", "in", "(won,lost)");
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ opportunities: data ?? [] });
}

export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const svc = getSupabaseService();
  const { data: ws } = await svc
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!ws) return NextResponse.json({ error: "no workspace" }, { status: 404 });

  const body = await req.json();
  if (!body.name || !body.side) {
    return NextResponse.json({ error: "name and side required" }, { status: 400 });
  }

  // Auto-assign OPP number
  const { count } = await svc
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ws.id);
  const opp_number = `OPP-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const stage: OppStage = (body.stage as OppStage) ?? "qualified";
  const payload = {
    workspace_id: ws.id,
    contact_id: body.contact_id ?? null,
    opp_number,
    name: body.name,
    side: body.side as OppSide,
    stage,
    est_value_usd: body.est_value_usd ?? null,
    est_commission_usd: body.est_commission_usd ?? null,
    probability: body.probability ?? STAGE_PROBABILITY[stage],
    expected_close: body.expected_close ?? null,
    source_kind: body.source_kind ?? "manual",
    source_id: body.source_id ?? null,
    property_address: body.property_address ?? null,
    property_zip: body.property_zip ?? null,
    notes: body.notes ?? null,
    created_by: user.id,
  };

  const { data, error } = await svc
    .from("opportunities")
    .insert(payload)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Initial stage history entry
  await svc.from("opportunity_stage_history").insert({
    opportunity_id: data.id,
    from_stage: null,
    to_stage: stage,
    changed_by: user.id,
    notes: "Opportunity created",
  });

  return NextResponse.json({ opportunity: data });
}
