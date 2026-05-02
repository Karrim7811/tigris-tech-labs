import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import {
  searchAvailableLocalNumbers,
  purchaseNumber,
  reconfigureNumberWebhooks,
} from "@/lib/twilio";
import { createRetellAgent, bindPhoneNumberToAgent } from "@/lib/retell";

/**
 * POST /api/sofia/provision — provision Sofia for the authenticated user's workspace.
 * Steps:
 *   1. Search Twilio for an available local number in the agent's preferred area code (default 305).
 *   2. Purchase the number with our Twilio webhook URLs configured.
 *   3. Create a Retell agent bound to our LLM-WS endpoint with the workspace's voice + language config.
 *   4. Register the Twilio number with the Retell agent so inbound calls flow through.
 *   5. Persist twilio_number + retell_agent_id on sofia_configs.
 *
 * Idempotent: if a number is already provisioned, returns it.
 */
export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = getSupabaseService();
  const { data: ws } = await svc
    .from("workspaces")
    .select("*, sofia_configs(*), brand_kits(*), agents(full_name, cell_phone)")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!ws) return NextResponse.json({ error: "no workspace" }, { status: 404 });

  const sofia = (ws as any).sofia_configs;
  if (!sofia) return NextResponse.json({ error: "sofia_config missing — finish onboarding" }, { status: 400 });

  // Already provisioned?
  if (sofia.twilio_number && sofia.metadata?.retell_agent_id) {
    return NextResponse.json({
      twilio_number: sofia.twilio_number,
      retell_agent_id: sofia.metadata.retell_agent_id,
      already_provisioned: true,
    });
  }

  const body = await req.json().catch(() => ({} as any));
  const areaCode = body.area_code || process.env.TWILIO_DEFAULT_AREA_CODE || "305";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://alevant.ai";

  // 1. Search numbers
  const candidates = await searchAvailableLocalNumbers({ areaCode, voice: true, sms: true });
  if (!candidates.length) return NextResponse.json({ error: "no available numbers in area code" }, { status: 503 });

  // 2. Purchase first candidate
  const chosen = candidates[0].phone_number;
  const purchased = await purchaseNumber({
    phoneNumber: chosen,
    voiceUrl: `${baseUrl}/api/sofia/twilio-incoming`,
    smsUrl: `${baseUrl}/api/sofia/twilio-sms`,
    statusCallback: `${baseUrl}/api/sofia/twilio-status`,
    friendlyName: `ALEVANT Sofia · ${ws.slug}`,
  });

  // 3. Create Retell agent
  const agent = await createRetellAgent({
    agent_name: `Sofia · ${ws.name}`,
    voice_id: sofia.voice_id || process.env.ELEVENLABS_DEFAULT_VOICE_ID || "11labs-default",
    language: (sofia.languages_enabled?.[0] || "en") === "en" ? "en-US" : "es-ES",
    llm_websocket_url: `${baseUrl.replace(/^http/, "ws")}/api/sofia/voice-llm-ws?ws=${ws.id}`,
    webhook_url: `${baseUrl}/api/sofia/voice-webhook`,
    enable_backchannel: true,
    metadata: { workspace_id: ws.id },
  });

  // 4. Register number with agent
  await bindPhoneNumberToAgent({
    phone_number: chosen,
    agent_id: agent.agent_id,
    twilio_account_sid: process.env.TWILIO_ACCOUNT_SID!,
    twilio_auth_token: process.env.TWILIO_AUTH_TOKEN!,
  });

  // 4b. Reconfigure Twilio webhooks to forward to Retell (Retell binding does this in
  //     production — keeping our endpoints as fallback for direct TwiML if needed)
  await reconfigureNumberWebhooks({
    sid: purchased.sid,
    voiceUrl: `${baseUrl}/api/sofia/twilio-incoming`,
    smsUrl: `${baseUrl}/api/sofia/twilio-sms`,
    statusCallback: `${baseUrl}/api/sofia/twilio-status`,
  });

  // 5. Persist
  await svc
    .from("sofia_configs")
    .update({
      twilio_number: chosen,
    })
    .eq("id", sofia.id);

  // Persist retell_agent_id + twilio_sid in workspaces.metadata.sofia
  await svc
    .from("workspaces")
    .update({
      metadata: {
        ...((ws.metadata as Record<string, unknown>) || {}),
        sofia: {
          twilio_number: chosen,
          twilio_phone_sid: purchased.sid,
          retell_agent_id: agent.agent_id,
          provisioned_at: new Date().toISOString(),
        },
      },
    })
    .eq("id", ws.id);

  return NextResponse.json({
    twilio_number: chosen,
    twilio_phone_sid: purchased.sid,
    retell_agent_id: agent.agent_id,
    provisioned: true,
  });
}
