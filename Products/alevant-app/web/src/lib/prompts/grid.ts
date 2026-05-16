// The Grid — Predictive Seller Engine prompts.

export const GRID_REASON_SYSTEM = `You are a senior real estate market analyst.
Given a property's signals, generate a concise, evidence-grounded ranking explanation:

1. A "reasons_summary" — one sentence (under 160 chars) explaining why this owner is likely to sell within 12 months.
2. A list of 3-6 "reasons" — each a short bullet (under 80 chars) tied to a specific signal.

Tone: factual, restrained, never speculative. Cite specific data points. No protected-class language ever. No assumptions about owner demographics.

Return JSON only:
{ "reasons_summary": "...", "reasons": ["...", "..."] }`;

export interface GridReasonInput {
  property_address: string;
  estimated_value?: number;
  estimated_equity?: number;
  years_owned?: number;
  motivation_score: number;
  components: {
    tenure_score: number;
    equity_score: number;
    distress_score: number;
    life_event_score: number;
    market_score: number;
  };
  flags: {
    is_pre_foreclosure?: boolean;
    is_tax_delinquent?: boolean;
    has_code_violations?: boolean;
    has_hoa_delinquency?: boolean;
    is_vacant?: boolean;
    is_absentee_owner?: boolean;
    is_probate?: boolean;
    is_divorce?: boolean;
    is_senior_owner?: boolean;
    long_tenure_flag?: boolean;
    // v1.5 multimodal additions
    permit_class?: "stay" | "flip" | "unknown" | string;
    visual_diff?: "deterioration" | "renovation" | "no_change" | "not_comparable" | string;
    ncoa_mail_forward?: boolean;
    voter_dropped?: boolean;
    llc_dissolved?: boolean;
    rate_lock_strength?: "tight" | "moderate" | "loose" | string;
  };
  market: {
    neighborhood_absorption_rate?: number;
  };
}

export function gridReasonPrompt(input: GridReasonInput): string {
  return `Generate the seller-likelihood reasoning for this property:
${JSON.stringify(input, null, 2)}`;
}

export const GRID_OUTREACH_SYSTEM = `You are a senior listing-pursuit creative director.
You write outreach to predicted sellers — homeowners flagged as likely to list within 12 months. The outreach is honest, specific, value-led, and never threatening or alarmist.

Tone discipline:
- Never reference distress signals directly (foreclosure, tax delinquency, etc.) — always frame around opportunity.
- Never reference protected-class signals.
- Lead with a recent comparable sale in their neighborhood ("a home like yours just sold for $X").
- Lead with the agent's track record where relevant.
- Always include a soft, opt-in call to action.
- Always include opt-out language for direct mail / email.

Return JSON with the requested asset structure.`;

export function gridOutreachPrompt(opts: {
  channel: "direct_mail" | "email" | "ig_dm" | "facebook_ad" | "ringless_voicemail" | "agent_call_script";
  signal_summary: string;
  agent_name: string;
  brokerage: string;
  recent_comp?: { address: string; sold_price: number; days_on_market: number };
  city: string;
}): string {
  return `Generate outreach copy for the ${opts.channel} channel.

Signal: ${opts.signal_summary}
Agent: ${opts.agent_name}, ${opts.brokerage}
Market: ${opts.city}
${opts.recent_comp ? `Recent comp: ${opts.recent_comp.address} sold $${opts.recent_comp.sold_price.toLocaleString()} in ${opts.recent_comp.days_on_market} days` : ""}

Return shape varies by channel:
- direct_mail: { headline, body_paragraphs:[...], signoff, opt_out_line }
- email: { subject, preheader, body_html, opt_out_line }
- ig_dm: { opening_line, follow_up_line }
- facebook_ad: { primary_text, headline, description, cta }
- ringless_voicemail: { script, duration_seconds }
- agent_call_script: { opener, value_anchor, qualifying_questions:[...], objection_handlers:[{ objection, response }], close }`;
}
