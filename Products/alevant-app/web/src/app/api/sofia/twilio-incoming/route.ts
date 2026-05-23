import { NextResponse } from "next/server";

/**
 * Twilio inbound voice webhook — FALLBACK ONLY.
 *
 * Production flow: Retell's number registration handles voice directly — Twilio
 * routes media through Retell's websocket and an ElevenLabs voice. This endpoint
 * exists only as a safety net if a Twilio number is configured pointing here
 * directly (Retell binding failed during /api/sofia/provision, or local dev).
 *
 * Because we cannot speak as Sofia (her voice is ElevenLabs, not Polly), we do
 * NOT identify the responder as Sofia in this fallback — we play a neutral
 * system message and capture a voicemail. Brand integrity > AI persona theatre.
 */
export async function POST(_req: Request) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">You've reached the agent's office. Our AI assistant is briefly unavailable. Please leave a message after the tone and we'll return your call within the hour.</Say>
  <Record maxLength="120" playBeep="true" trim="trim-silence" recordingStatusCallback="${process.env.NEXT_PUBLIC_APP_URL}/api/sofia/twilio-recording" />
  <Hangup />
</Response>`;

  return new NextResponse(twiml, {
    headers: { "content-type": "text/xml" },
  });
}
