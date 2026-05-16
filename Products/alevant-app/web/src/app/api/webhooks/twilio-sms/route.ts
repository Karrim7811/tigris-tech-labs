import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";
import { autoLogActivity } from "@/lib/autolog";
import crypto from "node:crypto";

/**
 * POST /api/webhooks/twilio-sms
 * Twilio status-callback / inbound-message webhook.
 *
 * Two ways Twilio posts here:
 *   - Inbound SMS: From=+1305..., To=<our number>, Body=...
 *   - Status callback: MessageSid, MessageStatus, To, From
 *
 * We auto-log when the receiving (To) number is one of our workspace's Sofia
 * numbers AND comms-settings.twilio_enabled.
 *
 * Auth: Twilio signs the request with X-Twilio-Signature (HMAC-SHA1 of full URL
 * + sorted params, signed with auth token). For local dev we accept unsigned;
 * production should set TWILIO_VALIDATE_SIGNATURE=1.
 */

function validate(req: Request, rawBody: string, params: URLSearchParams): boolean {
  if (process.env.TWILIO_VALIDATE_SIGNATURE !== "1") return true;
  const sig = req.headers.get("x-twilio-signature");
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sig || !token) return false;
  const url = new URL(req.url).toString();
  const sortedKeys = Array.from(params.keys()).sort();
  const data = url + sortedKeys.map((k) => k + (params.get(k) ?? "")).join("");
  const expected = crypto.createHmac("sha1", token).update(data).digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  const params = new URLSearchParams(raw);
  if (!validate(req, raw, params)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const from = params.get("From") ?? "";
  const to = params.get("To") ?? "";
  const body = params.get("Body") ?? "";
  const sid = params.get("MessageSid") ?? params.get("SmsSid") ?? "";
  const status = params.get("MessageStatus") ?? null;
  const direction = params.get("Direction") ?? null;

  const svc = getSupabaseService();

  // Find the workspace whose Sofia number matches the receiving leg.
  const ourNumber = direction === "outbound-api" || direction === "outbound" ? from : to;
  const { data: sofia } = await svc
    .from("sofia_configs")
    .select("id, twilio_number")
    .eq("twilio_number", ourNumber)
    .maybeSingle();
  if (!sofia) {
    return NextResponse.json({ ok: true, skipped: "no Sofia config matching number" });
  }

  // workspaces link sofia_config_id → workspace
  const { data: ws } = await svc
    .from("workspaces")
    .select("id")
    .eq("sofia_config_id", sofia.id)
    .maybeSingle();
  if (!ws) return NextResponse.json({ ok: true, skipped: "no workspace" });

  // The "other" leg is the consumer
  const consumerPhone = direction === "outbound-api" || direction === "outbound" ? to : from;
  const isInbound = !direction?.startsWith("outbound");
  const kind = isInbound ? "sms_received" : "sms_sent";

  const result = await autoLogActivity(svc, {
    workspace_id: ws.id,
    source: "twilio",
    match_phone: consumerPhone,
    kind,
    channel: "twilio",
    direction: isInbound ? "inbound" : "outbound",
    body,
    external_id: sid,
    outcome: status ?? undefined,
    occurred_at: new Date().toISOString(),
    metadata: { from, to, status, direction },
  });

  return NextResponse.json({ ok: true, ...result });
}
