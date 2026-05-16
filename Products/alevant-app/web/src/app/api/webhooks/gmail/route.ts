import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";
import { autoLogActivity } from "@/lib/autolog";

/**
 * POST /api/webhooks/gmail
 *
 * Gmail uses Pub/Sub push notifications — the body contains a base64-encoded
 * Pub/Sub message wrapping a Gmail historyId + emailAddress. Receiving this
 * means the user's Gmail history advanced; we then use the Gmail API (with the
 * stored OAuth token from onboarding) to list the new messages and log them.
 *
 * For V1 we accept a simplified payload from a local poller OR the real Pub/Sub
 * payload. Real Pub/Sub will need a Pub/Sub subscription set up in onboard/oauth.
 *
 * Body (V1 simplified):
 *   { workspace_id, gmail_message_id, from, to, subject, snippet, sent_at, direction }
 */
interface GmailPayload {
  workspace_id: string;
  gmail_message_id: string;
  from: string;
  to: string;
  subject?: string;
  snippet?: string;
  sent_at?: string;
  direction: "inbound" | "outbound";
}

export async function POST(req: Request) {
  // Cheap auth: shared secret from onboarding. Replace with full Pub/Sub OIDC
  // verification once production wiring is in.
  const secret = process.env.GMAIL_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-alevant-webhook-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: GmailPayload | { message?: { data?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Pub/Sub envelope: { message: { data: base64(json), messageId, publishTime } }
  let event: GmailPayload;
  if ("message" in body && body.message?.data) {
    try {
      const decoded = JSON.parse(Buffer.from(body.message.data, "base64").toString("utf-8"));
      event = decoded as GmailPayload;
    } catch {
      return NextResponse.json({ error: "invalid pubsub payload" }, { status: 400 });
    }
  } else {
    event = body as GmailPayload;
  }

  if (!event.workspace_id || !event.gmail_message_id) {
    return NextResponse.json(
      { error: "workspace_id and gmail_message_id required" },
      { status: 400 }
    );
  }

  const svc = getSupabaseService();
  const consumerEmail = event.direction === "outbound" ? event.to : event.from;
  const kind = event.direction === "outbound" ? "email_sent" : "email_received";

  const result = await autoLogActivity(svc, {
    workspace_id: event.workspace_id,
    source: "gmail",
    match_email: consumerEmail,
    kind,
    channel: "gmail",
    direction: event.direction,
    subject: event.subject,
    body: event.snippet,
    external_id: event.gmail_message_id,
    occurred_at: event.sent_at ?? new Date().toISOString(),
    metadata: { from: event.from, to: event.to },
  });

  return NextResponse.json({ ok: true, ...result });
}
