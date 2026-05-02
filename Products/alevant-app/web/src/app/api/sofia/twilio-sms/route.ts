import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";
import { isOptOutMessage } from "@/lib/tcpa";

/**
 * Twilio inbound SMS webhook → routes through Sofia.text handler.
 * Auto-handles STOP/UNSUBSCRIBE keywords by revoking SMS consent.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const fromNumber = String(form.get("From") || "");
  const toNumber = String(form.get("To") || "");
  const body = String(form.get("Body") || "");

  const svc = getSupabaseService();

  // Resolve workspace by inbound number
  const { data: cfg } = await svc
    .from("sofia_configs")
    .select("id, workspace_id:id")
    .eq("twilio_number", toNumber)
    .maybeSingle();

  // Reverse-lookup workspace via sofia_configs.id (workspaces.sofia_config_id)
  const { data: ws } = await svc
    .from("workspaces")
    .select("id, name")
    .eq("sofia_config_id", cfg?.id || "")
    .maybeSingle();
  if (!ws) {
    return new NextResponse("<Response/>", { headers: { "content-type": "text/xml" } });
  }

  // Opt-out handling
  if (isOptOutMessage(body)) {
    const { data: contact } = await svc
      .from("contacts")
      .select("id")
      .eq("workspace_id", ws.id)
      .contains("phones", [fromNumber])
      .maybeSingle();
    if (contact) {
      await svc
        .from("consent_records")
        .update({ revoked_at: new Date().toISOString(), revoke_reason: "sms_stop_keyword" })
        .eq("workspace_id", ws.id)
        .eq("contact_id", contact.id)
        .eq("consent_type", "sms")
        .is("revoked_at", null);
    }
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>You've been unsubscribed. Reply START to opt back in.</Message>
</Response>`;
    return new NextResponse(twiml, { headers: { "content-type": "text/xml" } });
  }

  // Forward to Sofia text handler
  const r = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sofia/text`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      workspace_id: ws.id,
      channel: "sms",
      caller_phone: fromNumber,
      content: body,
    }),
  });
  const json = (await r.json().catch(() => ({}))) as { reply?: string };

  const reply = json.reply || "Hi, I'm Sofia, an AI assistant. One moment — Thomas will respond shortly.";
  const escaped = reply.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escaped}</Message>
</Response>`;
  return new NextResponse(twiml, { headers: { "content-type": "text/xml" } });
}
