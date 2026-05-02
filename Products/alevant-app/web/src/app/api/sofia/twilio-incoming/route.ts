import { NextResponse } from "next/server";

/**
 * Twilio inbound voice webhook.
 *
 * Production flow: Retell's number registration handles the call directly — Twilio
 * routes voice through the Retell media stream and our LLM websocket endpoint.
 *
 * This endpoint exists as a fallback if a number is configured pointing here
 * directly (e.g., during dev or if Retell binding fails). Returns TwiML that
 * forwards to a hold message + voicemail.
 */
export async function POST(req: Request) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hi, this is Sofia, an AI assistant. I'm just spinning up — please leave a message and I'll have Thomas reach out within the hour.</Say>
  <Record maxLength="120" playBeep="true" trim="trim-silence" recordingStatusCallback="${process.env.NEXT_PUBLIC_APP_URL}/api/sofia/twilio-recording" />
  <Hangup />
</Response>`;

  return new NextResponse(twiml, {
    headers: { "content-type": "text/xml" },
  });
}
