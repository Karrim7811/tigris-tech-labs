// Shared helper for system-driven activity logging (Sofia, Vesper, Gmail webhook,
// Twilio webhook). Respects workspace_comms_settings per-source toggle + global
// auto_log_mode.

import type { SupabaseClient } from "@supabase/supabase-js";

export type AutoLogSource = "gmail" | "twilio" | "sofia" | "vesper" | "linkedin";

interface CommsSettings {
  auto_log_mode: "full_auto" | "sofia_only" | "manual_only";
  gmail_enabled: boolean;
  twilio_enabled: boolean;
  sofia_enabled: boolean;
  vesper_enabled: boolean;
  linkedin_enabled: boolean;
}

const DEFAULTS: CommsSettings = {
  auto_log_mode: "full_auto",
  gmail_enabled: true,
  twilio_enabled: true,
  sofia_enabled: true,
  vesper_enabled: true,
  linkedin_enabled: false,
};

async function loadSettings(svc: SupabaseClient, workspaceId: string): Promise<CommsSettings> {
  const { data } = await svc
    .from("workspace_comms_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return (data ?? DEFAULTS) as CommsSettings;
}

/**
 * Is auto-logging allowed for this source under the current mode?
 */
export function canAutoLog(settings: CommsSettings, source: AutoLogSource): boolean {
  if (settings.auto_log_mode === "manual_only") return false;
  if (
    settings.auto_log_mode === "sofia_only" &&
    source !== "sofia" &&
    source !== "vesper"
  ) {
    return false;
  }
  // full_auto OR sofia/vesper under sofia_only — check per-source toggle
  switch (source) {
    case "gmail":
      return settings.gmail_enabled;
    case "twilio":
      return settings.twilio_enabled;
    case "sofia":
      return settings.sofia_enabled;
    case "vesper":
      return settings.vesper_enabled;
    case "linkedin":
      return settings.linkedin_enabled;
  }
}

export interface AutoLogInput {
  workspace_id: string;
  source: AutoLogSource;
  /** One of: full contact_id (preferred), or one of the lookup fields below. */
  contact_id?: string;
  /** Lookup by email if contact_id is unknown. */
  match_email?: string;
  /** Lookup by phone if contact_id is unknown. */
  match_phone?: string;
  kind:
    | "email_sent"
    | "email_received"
    | "sms_sent"
    | "sms_received"
    | "call_outbound"
    | "call_inbound"
    | "call_missed";
  channel: string;
  direction?: "inbound" | "outbound";
  subject?: string;
  body?: string;
  duration_seconds?: number;
  outcome?: string;
  external_id?: string;
  occurred_at?: string;
  opportunity_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Best-effort match a phone or email to a contact in this workspace.
 */
async function findContact(
  svc: SupabaseClient,
  workspaceId: string,
  match_email?: string,
  match_phone?: string
): Promise<string | null> {
  if (match_email) {
    const { data } = await svc
      .from("contacts")
      .select("id")
      .eq("workspace_id", workspaceId)
      .contains("emails", [match_email.toLowerCase()])
      .limit(1)
      .maybeSingle();
    if (data) return data.id;
  }
  if (match_phone) {
    const { data } = await svc
      .from("contacts")
      .select("id")
      .eq("workspace_id", workspaceId)
      .contains("phones", [match_phone])
      .limit(1)
      .maybeSingle();
    if (data) return data.id;
  }
  return null;
}

/**
 * Write an activity row when auto-logging is permitted. Returns the activity id
 * or null when the workspace has the source disabled.
 *
 * Idempotency: if `external_id` is provided and an existing activity has the
 * same external_id, no new row is created.
 */
export async function autoLogActivity(
  svc: SupabaseClient,
  input: AutoLogInput
): Promise<{ activity_id: string | null; skipped_reason?: string }> {
  const settings = await loadSettings(svc, input.workspace_id);
  if (!canAutoLog(settings, input.source)) {
    return { activity_id: null, skipped_reason: `auto-log disabled for ${input.source}` };
  }

  // Idempotency check
  if (input.external_id) {
    const { data: existing } = await svc
      .from("contact_activities")
      .select("id")
      .eq("workspace_id", input.workspace_id)
      .eq("external_id", input.external_id)
      .maybeSingle();
    if (existing) return { activity_id: existing.id, skipped_reason: "duplicate external_id" };
  }

  let contactId = input.contact_id ?? null;
  if (!contactId) {
    contactId = await findContact(svc, input.workspace_id, input.match_email, input.match_phone);
  }
  if (!contactId) {
    return { activity_id: null, skipped_reason: "no matching contact" };
  }

  const direction =
    input.direction ??
    (input.kind.endsWith("_sent") || input.kind === "call_outbound" ? "outbound" : "inbound");

  const { data, error } = await svc
    .from("contact_activities")
    .insert({
      workspace_id: input.workspace_id,
      contact_id: contactId,
      opportunity_id: input.opportunity_id ?? null,
      kind: input.kind,
      channel: input.channel,
      direction,
      subject: input.subject ?? null,
      body: input.body ?? null,
      duration_seconds: input.duration_seconds ?? null,
      outcome: input.outcome ?? null,
      external_id: input.external_id ?? null,
      occurred_at: input.occurred_at ?? new Date().toISOString(),
      logged_by_system: input.source,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();
  if (error) return { activity_id: null, skipped_reason: error.message };

  // Bump last_touch_at on the contact
  await svc
    .from("contacts")
    .update({ last_touch_at: input.occurred_at ?? new Date().toISOString() })
    .eq("id", contactId);

  return { activity_id: data.id };
}
