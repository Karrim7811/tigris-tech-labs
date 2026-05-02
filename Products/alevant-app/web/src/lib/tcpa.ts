import { getSupabaseService } from "./supabase/server";

export interface ConsentCheck {
  ok: boolean;
  reason?: string;
  consent_id?: string;
}

/**
 * Check whether outbound (SMS / voice / email / whatsapp) is permitted to a contact.
 * Strict TCPA mode — requires an active consent_records row for the channel + scope.
 */
export async function checkOutboundConsent(opts: {
  workspaceId: string;
  contactId: string;
  channel: "sms" | "voice" | "email" | "whatsapp";
  scope: "transactional" | "marketing" | "ai_assistant";
}): Promise<ConsentCheck> {
  const sb = getSupabaseService();
  const { data, error } = await sb
    .from("consent_records")
    .select("id, granted_at, revoked_at")
    .eq("workspace_id", opts.workspaceId)
    .eq("contact_id", opts.contactId)
    .eq("consent_type", opts.channel)
    .eq("scope", opts.scope)
    .is("revoked_at", null)
    .order("granted_at", { ascending: false })
    .limit(1);
  if (error) return { ok: false, reason: error.message };
  if (!data || data.length === 0) {
    return {
      ok: false,
      reason: `No active ${opts.channel}/${opts.scope} consent on file for contact.`,
    };
  }
  return { ok: true, consent_id: data[0].id };
}

const QUIET_HOURS_BY_STATE: Record<string, [number, number]> = {
  default: [8, 21], // 8am-9pm local
  FL: [8, 21],
  CA: [8, 21],
  NY: [8, 21],
};

export function withinQuietHours(stateAbbr: string | undefined, now: Date = new Date()): boolean {
  const [start, end] = QUIET_HOURS_BY_STATE[stateAbbr || "default"] || QUIET_HOURS_BY_STATE.default;
  const hour = now.getHours() + now.getMinutes() / 60;
  return hour >= start && hour < end;
}

export function isOptOutMessage(text: string): boolean {
  return /\b(stop|unsubscribe|remove|opt[\s-]?out|cancel|quit|end)\b/i.test(text.trim());
}
