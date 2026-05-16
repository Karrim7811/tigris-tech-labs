import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

/**
 * GET  /api/contacts/[id]/activities — list activity timeline
 * POST /api/contacts/[id]/activities — log a new activity (manual / from a quick-log button)
 */
const VALID_KINDS = [
  "email_sent",
  "email_received",
  "sms_sent",
  "sms_received",
  "call_outbound",
  "call_inbound",
  "call_missed",
  "meeting",
  "linkedin_dm",
  "note",
  "task_completed",
  "system_event",
] as const;
type Kind = (typeof VALID_KINDS)[number];

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

  const { data } = await svc
    .from("contact_activities")
    .select("*")
    .eq("workspace_id", ws.id)
    .eq("contact_id", id)
    .order("occurred_at", { ascending: false })
    .limit(200);
  return NextResponse.json({ activities: data ?? [] });
}

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
  const kind = body.kind as Kind;
  if (!VALID_KINDS.includes(kind)) {
    return NextResponse.json({ error: `kind must be one of ${VALID_KINDS.join(", ")}` }, { status: 400 });
  }

  const direction =
    body.direction ??
    (kind.endsWith("_sent") || kind === "call_outbound"
      ? "outbound"
      : kind.endsWith("_received") || kind === "call_inbound"
      ? "inbound"
      : "internal");

  const payload = {
    workspace_id: ws.id,
    contact_id: id,
    opportunity_id: body.opportunity_id ?? null,
    kind,
    channel: body.channel ?? "manual",
    direction,
    subject: body.subject ?? null,
    body: body.body ?? null,
    duration_seconds: body.duration_seconds ?? null,
    outcome: body.outcome ?? null,
    occurred_at: body.occurred_at ?? new Date().toISOString(),
    logged_by: user.id,
    logged_by_system: "manual",
    metadata: body.metadata ?? {},
  };

  const { data, error } = await svc
    .from("contact_activities")
    .insert(payload)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Bump last_touch_at + last_activity_at on the contact
  await svc
    .from("contacts")
    .update({
      last_touch_at: payload.occurred_at,
      last_activity_at: payload.occurred_at,
    })
    .eq("id", id)
    .eq("workspace_id", ws.id);

  return NextResponse.json({ activity: data });
}
