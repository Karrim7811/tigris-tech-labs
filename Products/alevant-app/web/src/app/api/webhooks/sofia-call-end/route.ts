import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";
import { autoLogActivity } from "@/lib/autolog";
import crypto from "node:crypto";

/**
 * POST /api/webhooks/sofia-call-end
 *
 * Called when a Retell-orchestrated Sofia call ends. We log the call as a
 * contact_activity automatically (subject to comms-settings).
 *
 * Body (canonical — adapt to Retell's actual webhook shape when finalized):
 *   { workspace_id, call_id, caller_phone, agent_phone, direction,
 *     duration_seconds, outcome, transcript_summary, started_at }
 */
function verifySig(raw: string, signature: string | null): boolean {
  const secret = process.env.RETELL_WEBHOOK_SECRET;
  if (!secret) return true; // skip in dev when not set
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySig(raw, req.headers.get("x-retell-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let ev: any;
  try {
    ev = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!ev.workspace_id || !ev.call_id) {
    return NextResponse.json({ error: "workspace_id and call_id required" }, { status: 400 });
  }

  const svc = getSupabaseService();
  const isInbound = ev.direction === "inbound";
  const kind = isInbound ? "call_inbound" : "call_outbound";

  const result = await autoLogActivity(svc, {
    workspace_id: ev.workspace_id,
    source: "sofia",
    match_phone: ev.caller_phone,
    kind,
    channel: "sofia",
    direction: isInbound ? "inbound" : "outbound",
    subject: ev.outcome ?? "Sofia call",
    body: ev.transcript_summary ?? null,
    duration_seconds: ev.duration_seconds ?? null,
    outcome: ev.outcome ?? null,
    external_id: ev.call_id,
    occurred_at: ev.started_at ?? new Date().toISOString(),
    metadata: { agent_phone: ev.agent_phone, retell_call: ev.call_id },
  });

  return NextResponse.json({ ok: true, ...result });
}
