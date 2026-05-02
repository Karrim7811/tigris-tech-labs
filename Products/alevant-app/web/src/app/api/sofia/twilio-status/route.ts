import { NextResponse } from "next/server";

/**
 * Twilio status callback — call lifecycle events (initiated, ringing, in-progress, completed).
 * V1: stub. V2: write to sofia_conversations.metadata for audit + dashboard.
 */
export async function POST() {
  return new NextResponse(null, { status: 204 });
}
