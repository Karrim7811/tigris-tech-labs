import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { runClaudeJSON } from "@/lib/anthropic";
import { buildDraftPrompt } from "@/lib/prompts/playbook-drafts";

/**
 * POST /api/playbook-step-runs/[id]/draft
 *
 * Generates a Claude draft for the current step based on the contact's context.
 * Returns { subject?, draft, alt_voicemail? } depending on channel.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const svc = getSupabaseService();
  const { data: ws } = await svc
    .from("workspaces")
    .select("id, name, brokerage:brokerages(name, address)")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!ws) return NextResponse.json({ error: "no workspace" }, { status: 404 });

  // Step + contact + recent activity + opportunity (if any)
  const { data: step } = await svc
    .from("playbook_step_runs")
    .select("*, contact:contacts(*), playbook_run:playbook_runs(playbook_id)")
    .eq("id", id)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  if (!step) return NextResponse.json({ error: "step not found" }, { status: 404 });

  const contact = step.contact;
  const { data: recent } = await svc
    .from("contact_activities")
    .select("kind, subject, body, occurred_at")
    .eq("contact_id", contact.id)
    .order("occurred_at", { ascending: false })
    .limit(5);

  const { data: opp } = await svc
    .from("opportunities")
    .select("name, side, stage, property_address")
    .eq("contact_id", contact.id)
    .not("stage", "in", "(won,lost)")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: gridSignal } = await svc
    .from("grid_signals")
    .select("reasons_summary")
    .eq("contact_id", contact.id)
    .order("refreshed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: sphereSignal } = await svc
    .from("sphere_signals")
    .select("signal_type")
    .eq("contact_id", contact.id)
    .eq("resolved", false)
    .order("detected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: agent } = await svc
    .from("agents")
    .select("full_name, preferred_name")
    .eq("user_id", user.id)
    .eq("workspace_id", ws.id)
    .maybeSingle();

  const brokerageRel = (ws as any).brokerage;
  const brokerageRecord = Array.isArray(brokerageRel) ? brokerageRel[0] : brokerageRel;

  const stepJson = step.step_json as {
    channel: "call" | "sms" | "email" | "meeting" | "note";
    action: string;
    day_offset: number;
  };

  const { system, user: userPrompt } = buildDraftPrompt({
    contact: {
      full_name: contact.full_name,
      temperature: contact.temperature,
      priority: contact.priority,
      lifecycle_stage: contact.lifecycle_stage,
      tags: contact.tags,
      notes: contact.notes,
    },
    agent: {
      full_name: agent?.preferred_name ?? agent?.full_name ?? null,
      brokerage: brokerageRecord?.name ?? ws.name ?? null,
      market_city: brokerageRecord?.address ?? "Miami",
    },
    step: stepJson,
    recent_activity: recent ?? [],
    grid_signal_summary: gridSignal?.reasons_summary ?? null,
    sphere_signal: sphereSignal?.signal_type ?? null,
    opportunity: opp ?? null,
  });

  try {
    const out = await runClaudeJSON<{
      draft: string;
      subject?: string;
      alt_voicemail?: string;
    }>({
      tier: "fast",
      system,
      user: userPrompt,
      maxTokens: 800,
    });
    return NextResponse.json({
      draft: out.draft,
      subject: out.subject,
      alt_voicemail: out.alt_voicemail,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
