import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

/**
 * POST /api/contacts/from-grid-signal  body: { signal_id }
 *
 * Converts a Grid signal into a contact and back-links them. Idempotent: re-calling
 * with the same signal_id returns the existing contact.
 */
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
  if (!body.signal_id) {
    return NextResponse.json({ error: "signal_id required" }, { status: 400 });
  }

  const { data: signal } = await svc
    .from("grid_signals")
    .select("*")
    .eq("id", body.signal_id)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  if (!signal) return NextResponse.json({ error: "signal not found" }, { status: 404 });

  // Idempotency: if already converted, return the existing contact.
  if (signal.contact_id) {
    const { data: existing } = await svc
      .from("contacts")
      .select("*")
      .eq("id", signal.contact_id)
      .maybeSingle();
    return NextResponse.json({ contact: existing, reused: true });
  }

  const payload = {
    workspace_id: ws.id,
    full_name: signal.owner_name ?? null,
    emails: signal.owner_email ? [signal.owner_email] : [],
    phones: signal.owner_phone ? [signal.owner_phone] : [],
    category: "lead",
    lifecycle_stage: "prospect",
    tags: ["grid", signal.county ? `county:${signal.county}` : null].filter(Boolean) as string[],
    prospect_source: "grid",
    source: "grid.signal",
    relationship_score: Math.min(100, Math.round(signal.motivation_score ?? 0)),
    notes: `Converted from Grid signal at ${signal.property_address}. ${
      signal.reasons_summary ?? ""
    }`.trim(),
    metadata: {
      property_address: signal.property_address,
      property_zip: signal.property_zip,
      grid_signal_id: signal.id,
      motivation_score: signal.motivation_score,
      hazard_90d: signal.hazard_90d,
    },
  };

  const { data: contact, error } = await svc.from("contacts").insert(payload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await svc
    .from("grid_signals")
    .update({
      contact_id: contact.id,
      converted_at: new Date().toISOString(),
      converted_by: user.id,
    })
    .eq("id", signal.id);

  // Audit
  await svc.from("grid_audit_events").insert({
    workspace_id: ws.id,
    event_type: "manual_override",
    signal_id: signal.id,
    property_address: signal.property_address,
    output_snapshot: { converted_to_contact: contact.id, source: "grid_signal_to_contact" },
    served_by: "api.contacts.from-grid-signal",
  });

  return NextResponse.json({ contact, reused: false });
}
