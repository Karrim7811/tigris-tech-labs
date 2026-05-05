import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const signalId = typeof body.signal_id === "string" ? body.signal_id : null;
  const autoCreate = body.auto_create === true;

  if (!signalId && !autoCreate) {
    return NextResponse.json({ error: "signal_id or auto_create required" }, { status: 400 });
  }

  const svc = getSupabaseService();
  const { data: ws } = await svc.from("workspaces").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (!ws) return NextResponse.json({ error: "no workspace" }, { status: 404 });

  let signals: Array<any> = [];

  if (signalId) {
    const { data: signal } = await svc
      .from("grid_signals")
      .select("*")
      .eq("workspace_id", ws.id)
      .eq("id", signalId)
      .maybeSingle();
    if (!signal) return NextResponse.json({ error: "signal not found" }, { status: 404 });
    signals = [signal];
  } else if (autoCreate) {
    const { data: rows } = await svc
      .from("grid_signals")
      .select("*")
      .eq("workspace_id", ws.id)
      .neq("status", "lead_created")
      .gte("motivation_score", 70)
      .order("motivation_score", { ascending: false })
      .limit(5);
    signals = rows ?? [];
  }

  if (!signals.length) {
    return NextResponse.json({ error: "no eligible market signals found" }, { status: 404 });
  }

  const createdContacts: Array<any> = [];

  for (const signal of signals) {
    const contactPayload: Record<string, any> = {
      workspace_id: ws.id,
      full_name: signal.owner_name || signal.property_address || "Market intelligence lead",
      category: "lead",
      relationship_score: 50,
      source: "market_intelligence",
      notes: `AI market intelligence lead sourced from ${signal.property_neighborhood || signal.property_city || signal.property_zip || "Florida market"}.`,
      metadata: {
        market_signal_id: signal.id,
        property_address: signal.property_address,
        motivation_score: signal.motivation_score,
      },
      created_at: new Date().toISOString(),
    };

    if (signal.owner_phone) {
      contactPayload.phones = [signal.owner_phone];
    }
    if (signal.owner_email) {
      contactPayload.emails = [signal.owner_email];
    }

    const { data: contact } = await svc.from("contacts").insert(contactPayload).select().single();
    if (contact) {
      createdContacts.push(contact);
      await svc.from("grid_signals").update({ status: "lead_created" }).eq("id", signal.id);
    }
  }

  return NextResponse.json({ created: createdContacts.length, contacts: createdContacts });
}
