// Retell wrapper — agent provisioning + LLM-call orchestration.
// Retell offers a managed voice-agent runtime; we point a Twilio number at it
// and Retell handles turn-taking, end-of-utterance, barge-in.
//
// Docs: https://docs.retellai.com/api-references/

const RETELL_BASE = "https://api.retellai.com";

function authHeaders() {
  const key = process.env.RETELL_API_KEY;
  if (!key) throw new Error("RETELL_API_KEY missing");
  return {
    Authorization: `Bearer ${key}`,
    "content-type": "application/json",
  };
}

export interface RetellAgentOptions {
  agent_name: string;
  voice_id: string;          // ElevenLabs voice id
  language: string;          // 'en-US'
  llm_websocket_url: string; // our /api/sofia/voice-llm-ws
  webhook_url: string;       // our /api/sofia/voice-webhook
  enable_backchannel?: boolean;
  ambient_sound?: "office" | "coffee_shop" | "outside" | null;
  max_call_duration_ms?: number;
  metadata?: Record<string, unknown>;
}

export async function createRetellAgent(opts: RetellAgentOptions) {
  const r = await fetch(`${RETELL_BASE}/create-agent`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      agent_name: opts.agent_name,
      voice_id: opts.voice_id,
      language: opts.language,
      llm_websocket_url: opts.llm_websocket_url,
      webhook_url: opts.webhook_url,
      enable_backchannel: opts.enable_backchannel ?? true,
      ambient_sound: opts.ambient_sound ?? null,
      max_call_duration_ms: opts.max_call_duration_ms ?? 1800000,
      metadata: opts.metadata,
    }),
  });
  if (!r.ok) throw new Error(`Retell create-agent failed: ${r.status} ${await r.text()}`);
  return r.json();
}

export async function bindPhoneNumberToAgent(opts: {
  phone_number: string;
  agent_id: string;
  twilio_account_sid: string;
  twilio_auth_token: string;
}) {
  const r = await fetch(`${RETELL_BASE}/register-phone-number`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      phone_number: opts.phone_number,
      agent_id: opts.agent_id,
      inbound_agent_id: opts.agent_id,
      outbound_agent_id: opts.agent_id,
      twilio_account_sid: opts.twilio_account_sid,
      twilio_auth_token: opts.twilio_auth_token,
    }),
  });
  if (!r.ok) throw new Error(`Retell register-phone-number failed: ${r.status} ${await r.text()}`);
  return r.json();
}

export async function createOutboundCall(opts: {
  agent_id: string;
  from_number: string;
  to_number: string;
  metadata?: Record<string, unknown>;
}) {
  const r = await fetch(`${RETELL_BASE}/create-phone-call`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      agent_id: opts.agent_id,
      from_number: opts.from_number,
      to_number: opts.to_number,
      metadata: opts.metadata,
    }),
  });
  if (!r.ok) throw new Error(`Retell create-phone-call failed: ${r.status} ${await r.text()}`);
  return r.json();
}
