// Playbook step draft prompts.
//
// Each system-playbook step references a `draft_prompt` id. This file maps each
// id to a Claude system prompt + a user-prompt builder. When the id is unknown
// or missing, falls back to a generic prompt that uses the step's `action` text.

export interface DraftContext {
  contact: {
    full_name?: string | null;
    first_name?: string;
    temperature?: string | null;
    priority?: string | null;
    lifecycle_stage?: string | null;
    tags?: string[] | null;
    notes?: string | null;
  };
  agent: {
    full_name?: string | null;
    brokerage?: string | null;
    market_city?: string | null;
  };
  step: {
    channel: "call" | "sms" | "email" | "meeting" | "note";
    action: string;
    day_offset: number;
  };
  recent_activity?: Array<{
    kind: string;
    subject?: string | null;
    body?: string | null;
    occurred_at?: string | null;
  }>;
  grid_signal_summary?: string | null;
  sphere_signal?: string | null;
  opportunity?: {
    name: string;
    side: string;
    stage: string;
    property_address?: string | null;
  } | null;
}

const COMMON_RULES = `STRICT RULES:
- Never speculate about or reference race, color, national origin, religion, sex, sexual orientation, gender identity, familial status, or disability.
- Never threaten or pressure. Tone is warm, professional, value-led.
- Always include opt-out language for direct mail / email channels.
- Use the contact's first name only — never "Mr." / "Ms." / "Mrs." unless explicitly told to.
- Reference SPECIFIC public data only (the signal that triggered, a recent comp, a known life event). Never make up facts.
- Length: SMS under 280 chars. Email body under 220 words. Call openers under 60 words.`;

const SYSTEMS = {
  call_open: `You are a senior real-estate listing agent writing a brief CALL OPENER for the agent to read at the start of a phone call.
${COMMON_RULES}
Return JSON: { "draft": "<the opener — first 30-60 seconds spoken>", "alt_voicemail": "<25 word voicemail to leave if no answer>" }`,
  sms: `You are writing a SHORT text message from the agent to a contact. Warm, professional, brief.
${COMMON_RULES}
Return JSON: { "draft": "<the text — under 280 chars>" }`,
  email: `You are writing an EMAIL from the agent to a contact. Subject line + body. Body in plain text, 3 short paragraphs max.
${COMMON_RULES}
Return JSON: { "subject": "<subject line>", "draft": "<email body in plain text>" }`,
  meeting: `You are writing a MEETING / coffee invitation from the agent.
${COMMON_RULES}
Return JSON: { "draft": "<the invitation message, under 120 words>" }`,
  generic: `You are writing a drafted message for a real-estate agent to send to a contact.
${COMMON_RULES}
Return JSON: { "draft": "<the message>" }`,
};

function pickSystem(channel: DraftContext["step"]["channel"]): string {
  switch (channel) {
    case "call":
      return SYSTEMS.call_open;
    case "sms":
      return SYSTEMS.sms;
    case "email":
      return SYSTEMS.email;
    case "meeting":
      return SYSTEMS.meeting;
    default:
      return SYSTEMS.generic;
  }
}

function buildUser(ctx: DraftContext): string {
  const lines: string[] = [];
  lines.push(`STEP ACTION: ${ctx.step.action}`);
  lines.push(`CHANNEL: ${ctx.step.channel}`);
  lines.push("");
  lines.push("CONTACT:");
  lines.push(`- Name: ${ctx.contact.full_name ?? "Unknown"}`);
  if (ctx.contact.temperature) lines.push(`- Temperature: ${ctx.contact.temperature}`);
  if (ctx.contact.lifecycle_stage) lines.push(`- Lifecycle stage: ${ctx.contact.lifecycle_stage}`);
  if (ctx.contact.tags?.length) lines.push(`- Tags: ${ctx.contact.tags.join(", ")}`);
  if (ctx.contact.notes) lines.push(`- Agent notes: ${ctx.contact.notes}`);

  lines.push("");
  lines.push("AGENT:");
  lines.push(`- Name: ${ctx.agent.full_name ?? "Agent"}`);
  if (ctx.agent.brokerage) lines.push(`- Brokerage: ${ctx.agent.brokerage}`);
  if (ctx.agent.market_city) lines.push(`- Market: ${ctx.agent.market_city}`);

  if (ctx.opportunity) {
    lines.push("");
    lines.push(
      `OPPORTUNITY: ${ctx.opportunity.name} (${ctx.opportunity.side} · ${ctx.opportunity.stage}${
        ctx.opportunity.property_address ? ` · ${ctx.opportunity.property_address}` : ""
      })`
    );
  }

  if (ctx.grid_signal_summary) {
    lines.push("");
    lines.push(`PROPERTY SIGNAL CONTEXT: ${ctx.grid_signal_summary}`);
  }
  if (ctx.sphere_signal) {
    lines.push(`SPHERE SIGNAL: ${ctx.sphere_signal}`);
  }

  if (ctx.recent_activity?.length) {
    lines.push("");
    lines.push("RECENT ACTIVITY (most recent first):");
    for (const a of ctx.recent_activity.slice(0, 5)) {
      const date = a.occurred_at ? new Date(a.occurred_at).toLocaleDateString("en-US") : "";
      lines.push(`- ${date} · ${a.kind}${a.subject ? ` · ${a.subject}` : ""}`);
    }
  }

  lines.push("");
  lines.push(`Draft the ${ctx.step.channel} message now. JSON only.`);
  return lines.join("\n");
}

export function buildDraftPrompt(ctx: DraftContext): { system: string; user: string } {
  return { system: pickSystem(ctx.step.channel), user: buildUser(ctx) };
}
