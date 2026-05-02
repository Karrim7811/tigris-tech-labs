import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";
import { runClaudeJSON, runClaude } from "@/lib/anthropic";
import { sofiaSystemPrompt, SOFIA_QUALIFICATION_SCORING } from "@/lib/prompts/sofia";
import type { VoicePreset } from "@/lib/types";

/**
 * POST /api/sofia/text — handle a single inbound text turn (SMS or DM).
 * Stateless per request; conversation state stored in sofia_conversations.transcript.
 *
 * Body: { workspace_id, channel, caller_phone?, caller_name?, content, conversation_id? }
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { workspace_id, channel, content, caller_phone, caller_name } = body;
  let { conversation_id } = body;

  const svc = getSupabaseService();

  // Load workspace + sofia config
  const { data: ws } = await svc
    .from("workspaces")
    .select("*, sofia_configs(*), brokerages(*), brand_kits(*)")
    .eq("id", workspace_id)
    .maybeSingle();
  if (!ws) return NextResponse.json({ error: "workspace not found" }, { status: 404 });

  const sofiaCfg = (ws as any).sofia_configs;
  const brokerage = (ws as any).brokerages?.name || "the brokerage";
  const kit = (ws as any).brand_kits;

  // Find or create conversation
  if (!conversation_id) {
    const { data: created } = await svc
      .from("sofia_conversations")
      .insert({
        workspace_id,
        channel,
        direction: "inbound",
        status: "live",
        caller_phone,
        caller_name,
        transcript: [],
      })
      .select()
      .single();
    conversation_id = created?.id;
  }

  const { data: conv } = await svc
    .from("sofia_conversations")
    .select("transcript")
    .eq("id", conversation_id)
    .maybeSingle();
  const transcript = (conv?.transcript as any[]) || [];

  // Append user turn
  transcript.push({ role: "user", content, ts: new Date().toISOString() });

  // Active listings for context
  const { data: listings } = await svc
    .from("listings")
    .select("id, address, price, beds, baths, sqft")
    .eq("workspace_id", workspace_id)
    .eq("status", "active")
    .limit(20);

  const sys = sofiaSystemPrompt({
    workspaceName: ws.name,
    agentName: ws.name,
    agentTitle: "Realtor®",
    brokerage,
    area: "Miami",
    languages: sofiaCfg?.languages_enabled || ["en"],
    hoursLabel: "Mon-Sat 8:30am to 6pm",
    qualificationThreshold: sofiaCfg?.qualification_threshold || 70,
    voicePreset: (kit?.voice_preset as VoicePreset) || "insider",
    activeListingsCount: listings?.length || 0,
    aiDisclosureRequired: sofiaCfg?.ai_disclosure_enabled !== false,
  });

  const conversationHistory = transcript
    .map((t) => `${t.role.toUpperCase()}: ${t.content}`)
    .join("\n");

  const reply = await runClaude({
    tier: "fast",
    system: sys + "\n\nActive listings:\n" + JSON.stringify(listings || []),
    user: `Conversation so far:\n${conversationHistory}\n\nReply as Sofia. One concise turn. End with a question that advances qualification.`,
    maxTokens: 400,
  });

  transcript.push({ role: "assistant", content: reply, ts: new Date().toISOString() });

  // Background: re-run qualification scoring
  let qualification_score: number | undefined;
  let classification: any | undefined;
  try {
    const scored = await runClaudeJSON<any>({
      tier: "fast",
      system: SOFIA_QUALIFICATION_SCORING,
      user: `Score the conversation:\n${transcript.map((t) => `${t.role}: ${t.content}`).join("\n")}`,
      maxTokens: 400,
    });
    qualification_score = scored.qualification_score;
    classification = {
      intent: scored.intent,
      urgency: scored.urgency,
      asset_class: scored.asset_class,
      language: scored.language,
    };
  } catch {}

  // Persist
  await svc
    .from("sofia_conversations")
    .update({
      transcript,
      qualification_score,
      classification,
    })
    .eq("id", conversation_id);

  // Escalate if hot
  const threshold = sofiaCfg?.qualification_threshold || 70;
  if (qualification_score && qualification_score >= threshold) {
    await svc
      .from("sofia_conversations")
      .update({ escalated_at: new Date().toISOString(), status: "escalated" })
      .eq("id", conversation_id);
    // TODO: push notification + ringthrough to agent's cell
  }

  return NextResponse.json({
    conversation_id,
    reply,
    qualification_score,
    classification,
    escalated: !!(qualification_score && qualification_score >= threshold),
  });
}
