import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
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

  const [{ data: opp }, { data: history }, { data: activities }] = await Promise.all([
    svc
      .from("opportunities")
      .select("*, contact:contacts(*)")
      .eq("id", id)
      .eq("workspace_id", ws.id)
      .maybeSingle(),
    svc
      .from("opportunity_stage_history")
      .select("*")
      .eq("opportunity_id", id)
      .order("changed_at", { ascending: false }),
    svc
      .from("contact_activities")
      .select("*")
      .eq("opportunity_id", id)
      .order("occurred_at", { ascending: false })
      .limit(50),
  ]);
  if (!opp) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    opportunity: opp,
    stage_history: history ?? [],
    activities: activities ?? [],
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
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
  const allowed = [
    "name",
    "side",
    "est_value_usd",
    "est_commission_usd",
    "probability",
    "expected_close",
    "property_address",
    "property_zip",
    "notes",
    "loss_reason",
    "contact_id",
  ];
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) if (k in body) patch[k] = body[k];

  const { data, error } = await svc
    .from("opportunities")
    .update(patch)
    .eq("id", id)
    .eq("workspace_id", ws.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ opportunity: data });
}
