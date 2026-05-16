import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { completeStep, skipStep, snoozeStep } from "@/lib/playbook-engine";

/**
 * POST /api/playbook-step-runs/[id]
 * body: { action: 'complete' | 'skip' | 'snooze', notes?, snooze_days?, log_activity? }
 *
 * If action=complete and log_activity is provided, also writes a contact_activity
 * row and links it to the step.
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
  const action = body.action as "complete" | "skip" | "snooze";

  const { data: step } = await svc
    .from("playbook_step_runs")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  if (!step) return NextResponse.json({ error: "step not found" }, { status: 404 });

  if (action === "skip") {
    await skipStep(svc, id, body.notes);
    return NextResponse.json({ ok: true });
  }

  if (action === "snooze") {
    const days = body.snooze_days ?? 1;
    const until = new Date(Date.now() + days * 86_400_000);
    await snoozeStep(svc, id, until);
    return NextResponse.json({ ok: true });
  }

  if (action === "complete") {
    let activity_id: string | undefined;
    if (body.log_activity) {
      const stepJson = step.step_json as { channel: string; action: string };
      const kindByChannel: Record<string, string> = {
        call: "call_outbound",
        sms: "sms_sent",
        email: "email_sent",
        meeting: "meeting",
        note: "note",
      };
      const { data: activity } = await svc
        .from("contact_activities")
        .insert({
          workspace_id: ws.id,
          contact_id: step.contact_id,
          kind: kindByChannel[stepJson.channel] ?? "note",
          channel: "playbook",
          direction:
            stepJson.channel === "call" ||
            stepJson.channel === "sms" ||
            stepJson.channel === "email"
              ? "outbound"
              : "internal",
          subject: body.subject ?? stepJson.action,
          body: body.body ?? null,
          outcome: body.outcome ?? null,
          duration_seconds: body.duration_seconds ?? null,
          occurred_at: new Date().toISOString(),
          logged_by: user.id,
          logged_by_system: "manual",
          metadata: { playbook_step_run_id: step.id },
        })
        .select("id")
        .single();
      activity_id = activity?.id;
    }
    await completeStep(svc, id, { activity_id, notes: body.notes });
    return NextResponse.json({ ok: true, activity_id });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
