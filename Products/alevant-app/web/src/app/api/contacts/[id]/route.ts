import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { evaluateAndStart } from "@/lib/playbook-engine";

/**
 * GET    /api/contacts/[id] — contact detail + activity timeline
 * PATCH  /api/contacts/[id] — update fields
 * DELETE /api/contacts/[id] — soft-delete (lifecycle_stage = 'do_not_contact')
 */

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

  const [{ data: contact }, { data: gridSignals }, { data: sphereSignals }, { data: buyer }, { data: listings }] =
    await Promise.all([
      svc.from("contacts").select("*").eq("id", id).eq("workspace_id", ws.id).maybeSingle(),
      svc
        .from("grid_signals")
        .select("id, property_address, motivation_score, hazard_90d, band, refreshed_at")
        .eq("contact_id", id),
      svc.from("sphere_signals").select("*").eq("contact_id", id).order("detected_at", { ascending: false }),
      svc.from("buyers").select("*").eq("contact_id", id),
      svc.from("listings").select("*").eq("seller_contact_id", id),
    ]);

  if (!contact) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({
    contact,
    grid_signals: gridSignals ?? [],
    sphere_signals: sphereSignals ?? [],
    buyer_records: buyer ?? [],
    listings: listings ?? [],
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
    "full_name",
    "emails",
    "phones",
    "category",
    "lifecycle_stage",
    "tags",
    "relationship_score",
    "language",
    "notes",
    "last_touch_at",
    "temperature",
    "priority",
  ];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) patch[k] = body[k];
  }

  // Read prior state to detect transitions that should trigger playbook eval.
  const { data: before } = await svc
    .from("contacts")
    .select("temperature, lifecycle_stage")
    .eq("id", id)
    .eq("workspace_id", ws.id)
    .maybeSingle();

  const { data, error } = await svc
    .from("contacts")
    .update(patch)
    .eq("id", id)
    .eq("workspace_id", ws.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If temperature or lifecycle changed, evaluate playbooks. Best-effort —
  // failures here must not block the patch.
  const tempChanged = "temperature" in patch && before?.temperature !== data.temperature;
  const stageChanged =
    "lifecycle_stage" in patch && before?.lifecycle_stage !== data.lifecycle_stage;
  let playbook_started: { playbook_id: string | null; run_id: string | null } | null = null;
  if (tempChanged || stageChanged) {
    try {
      playbook_started = await evaluateAndStart(svc, {
        id: data.id,
        workspace_id: data.workspace_id,
        full_name: data.full_name,
        lifecycle_stage: data.lifecycle_stage,
        temperature: data.temperature,
      });
    } catch {
      // ignore — playbook eval is non-critical
    }
  }

  return NextResponse.json({ contact: data, playbook_started });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
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

  const { error } = await svc
    .from("contacts")
    .update({ lifecycle_stage: "do_not_contact" })
    .eq("id", id)
    .eq("workspace_id", ws.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
