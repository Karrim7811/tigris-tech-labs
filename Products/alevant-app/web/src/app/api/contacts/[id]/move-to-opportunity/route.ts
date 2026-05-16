import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { STAGE_PROBABILITY, type OppSide } from "@/lib/opp-stages";

/**
 * POST /api/contacts/[id]/move-to-opportunity
 * body: { side: 'buyer' | 'seller' | 'both', name?, property_address?, est_value_usd? }
 *
 * Creates an opportunity linked to the contact. **Does NOT delete the contact**
 * (per ALEVANT spec — contacts persist across multiple opportunities over time).
 *
 * Also bumps contact.lifecycle_stage to 'engaged'.
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
  if (!body.side || !["buyer", "seller", "both"].includes(body.side)) {
    return NextResponse.json(
      { error: "side required ('buyer' | 'seller' | 'both')" },
      { status: 400 }
    );
  }

  const { data: contact } = await svc
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  if (!contact) return NextResponse.json({ error: "contact not found" }, { status: 404 });

  // Auto-assign OPP number
  const { count } = await svc
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ws.id);
  const opp_number = `OPP-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const side = body.side as OppSide;
  const stage = "qualified";
  const name =
    body.name ??
    `${contact.full_name ?? "Unnamed contact"}${
      body.property_address ? ` — ${body.property_address}` : ""
    }`;

  const { data: opp, error } = await svc
    .from("opportunities")
    .insert({
      workspace_id: ws.id,
      contact_id: contact.id,
      opp_number,
      name,
      side,
      stage,
      probability: STAGE_PROBABILITY[stage],
      est_value_usd: body.est_value_usd ?? null,
      property_address: body.property_address ?? null,
      property_zip: body.property_zip ?? null,
      source_kind: "contact_promotion",
      source_id: contact.id,
      notes: body.notes ?? contact.notes ?? null,
      created_by: user.id,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Promote the contact to 'engaged'
  await svc
    .from("contacts")
    .update({ lifecycle_stage: "engaged", last_activity_at: new Date().toISOString() })
    .eq("id", contact.id)
    .eq("workspace_id", ws.id);

  // Stage history seed
  await svc.from("opportunity_stage_history").insert({
    opportunity_id: opp.id,
    from_stage: null,
    to_stage: stage,
    changed_by: user.id,
    notes: `Moved from contact ${contact.full_name ?? contact.id}`,
  });

  // Log on the contact timeline
  await svc.from("contact_activities").insert({
    workspace_id: ws.id,
    contact_id: contact.id,
    opportunity_id: opp.id,
    kind: "system_event",
    channel: "manual",
    direction: "internal",
    subject: `Promoted to opportunity ${opp_number}`,
    body: `Side: ${side}. Name: ${name}.`,
    occurred_at: new Date().toISOString(),
    logged_by: user.id,
    logged_by_system: "manual",
  });

  return NextResponse.json({ opportunity: opp });
}
