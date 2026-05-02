import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";

/**
 * POST /api/sofia/voice-webhook — Retell webhook handler.
 * Receives turn-by-turn events during a live voice conversation.
 *
 * Events: call_started, transcript_partial, transcript_final, tool_call, call_ended
 */
export async function POST(req: Request) {
  const event = await req.json().catch(() => null);
  if (!event) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const svc = getSupabaseService();

  switch (event.event_type) {
    case "call_started": {
      await svc.from("sofia_conversations").insert({
        id: event.call_id,
        workspace_id: event.metadata?.workspace_id,
        channel: "voice",
        direction: event.direction === "outbound" ? "outbound" : "inbound",
        status: "live",
        caller_phone: event.from_number,
        started_at: new Date().toISOString(),
      });
      break;
    }
    case "transcript_final": {
      const { data: conv } = await svc
        .from("sofia_conversations")
        .select("transcript")
        .eq("id", event.call_id)
        .maybeSingle();
      const transcript = (conv?.transcript as any[]) || [];
      transcript.push({ role: event.role, content: event.transcript, ts: event.timestamp });
      await svc
        .from("sofia_conversations")
        .update({ transcript })
        .eq("id", event.call_id);
      break;
    }
    case "call_ended": {
      await svc
        .from("sofia_conversations")
        .update({
          status: "completed",
          ended_at: new Date().toISOString(),
          duration_seconds: event.duration_seconds,
          recording_url: event.recording_url,
        })
        .eq("id", event.call_id);
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
