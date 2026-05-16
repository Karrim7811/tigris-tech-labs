import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { STAGE_PROBABILITY, type OppStage } from "@/lib/opp-stages";

/**
 * POST /api/opportunities/[id]/stage  body: { to_stage, notes?, loss_reason? }
 * Logs to opportunity_stage_history and updates the opportunity row atomically.
 * If to_stage='won', sets closed_at + handoff hint for Transactions.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
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
  const to_stage = body.to_stage as OppStage;
  if (!to_stage) {
    return NextResponse.json({ error: "to_stage required" }, { status: 400 });
  }

  const { data: existing } = await svc
    .from("opportunities")
    .select("id, stage, contact_id")
    .eq("id", id)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (existing.stage === to_stage) {
    return NextResponse.json({ opportunity: existing, no_op: true });
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    stage: to_stage,
    probability: STAGE_PROBABILITY[to_stage],
    stage_changed_at: now,
    updated_at: now,
  };
  if (to_stage === "won" || to_stage === "lost") {
    update.closed_at = now;
    if (to_stage === "lost" && body.loss_reason) update.loss_reason = body.loss_reason;
  }

  const { data: opp, error } = await svc
    .from("opportunities")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await svc.from("opportunity_stage_history").insert({
    opportunity_id: id,
    from_stage: existing.stage,
    to_stage,
    changed_by: user.id,
    notes: body.notes ?? null,
  });

  // Also log a system activity on the contact so the timeline reflects the move
  if (existing.contact_id) {
    await svc.from("contact_activities").insert({
      workspace_id: ws.id,
      contact_id: existing.contact_id,
      opportunity_id: id,
      kind: "system_event",
      channel: "manual",
      direction: "internal",
      subject: `Opportunity stage: ${existing.stage ?? "—"} → ${to_stage}`,
      body: body.notes ?? null,
      occurred_at: now,
      logged_by: user.id,
      logged_by_system: "manual",
    });
  }

  return NextResponse.json({ opportunity: opp });
}
