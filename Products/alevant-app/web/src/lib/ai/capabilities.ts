/**
 * AI Capability + Custom Rule layer.
 *
 * Backs the /settings/sofia + /settings/vesper toggle UI and feeds the
 * prompt builder. Read functions return the data shape the UI uses;
 * mutation functions are server-only.
 */
import { getSupabaseService } from "@/lib/supabase/server";

export type Persona = "sofia" | "vesper";

export interface Capability {
  id: string;
  workspace_id: string;
  persona: Persona;
  category: string;
  capability_key: string;
  label: string;
  description: string | null;
  enabled: boolean;
  is_custom: boolean;
  is_master_kill: boolean;
  is_v2: boolean;
  warns_when_off: string | null;
  sort_order: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CustomRule {
  id: string;
  workspace_id: string;
  persona: Persona;
  category: string;
  title: string;
  body: string;
  scope: string;
  scope_value: string | null;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PersonaSettings {
  master: Capability | null;
  categories: Array<{
    category: string;
    label: string;
    capabilities: Capability[];
    customRules: CustomRule[];
  }>;
}

// Human-friendly category labels (UI ordering follows the order in this map)
const CATEGORY_LABELS_SOFIA: Record<string, string> = {
  channels: "Channels she answers",
  qualification: "Qualification flow",
  specialized_intake: "Specialized intake flows",
  call_behaviors: "Real-time call behaviors",
  handoff: "Handoff & escalation",
  showings: "Showings & calendar",
  crm: "CRM operations",
  compliance: "Compliance gates",
  voicemail: "Voicemail handling",
  post_call: "Post-call output",
};

const CATEGORY_LABELS_VESPER: Record<string, string> = {
  channels: "Output channels",
  asset_types: "Asset types per listing",
  triggers: "Generation triggers",
  guardrails: "Brand guardrails",
  auto_publish: "Per-channel auto-publish",
  kb: "Knowledge base integration",
};

export function categoryLabel(persona: Persona, category: string): string {
  const map = persona === "sofia" ? CATEGORY_LABELS_SOFIA : CATEGORY_LABELS_VESPER;
  return map[category] ?? category;
}

/** Order categories the way they should appear in the UI. */
function categoryOrder(persona: Persona): string[] {
  return Object.keys(persona === "sofia" ? CATEGORY_LABELS_SOFIA : CATEGORY_LABELS_VESPER);
}

/** Read all capabilities + custom rules for a workspace+persona, grouped by category. */
export async function loadPersonaSettings(
  workspaceId: string,
  persona: Persona
): Promise<PersonaSettings> {
  const svc = getSupabaseService();
  const [{ data: caps }, { data: rules }] = await Promise.all([
    svc
      .from("ai_capabilities")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("persona", persona)
      .order("sort_order", { ascending: true }),
    svc
      .from("ai_custom_rules")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("persona", persona)
      .order("sort_order", { ascending: true }),
  ]);

  const all = (caps ?? []) as Capability[];
  const customRules = (rules ?? []) as CustomRule[];
  const master = all.find((c) => c.is_master_kill) ?? null;
  const nonMaster = all.filter((c) => !c.is_master_kill);

  const order = categoryOrder(persona);
  const grouped = order
    .filter((category) => nonMaster.some((c) => c.category === category) || customRules.some((r) => r.category === category))
    .map((category) => ({
      category,
      label: categoryLabel(persona, category),
      capabilities: nonMaster.filter((c) => c.category === category),
      customRules: customRules.filter((r) => r.category === category),
    }));

  // Append any uncatalogued categories at the end
  const seen = new Set(order);
  const extras = Array.from(new Set([...nonMaster.map((c) => c.category), ...customRules.map((r) => r.category)]))
    .filter((c) => !seen.has(c))
    .map((category) => ({
      category,
      label: category,
      capabilities: nonMaster.filter((c) => c.category === category),
      customRules: customRules.filter((r) => r.category === category),
    }));

  return { master, categories: [...grouped, ...extras] };
}

/** Set a single capability's enabled state. */
export async function setCapabilityEnabled(capabilityId: string, enabled: boolean): Promise<void> {
  const svc = getSupabaseService();
  const { error } = await svc
    .from("ai_capabilities")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", capabilityId);
  if (error) throw new Error(error.message);
}

/** Create a custom rule (Thomas adds an extra instruction). */
export async function createCustomRule(input: {
  workspaceId: string;
  persona: Persona;
  category: string;
  title: string;
  body: string;
  scope?: string;
  scope_value?: string | null;
}): Promise<CustomRule> {
  const svc = getSupabaseService();
  const { data, error } = await svc
    .from("ai_custom_rules")
    .insert({
      workspace_id: input.workspaceId,
      persona: input.persona,
      category: input.category,
      title: input.title,
      body: input.body,
      scope: input.scope ?? "global",
      scope_value: input.scope_value ?? null,
      enabled: true,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as CustomRule;
}

export async function setCustomRuleEnabled(ruleId: string, enabled: boolean): Promise<void> {
  const svc = getSupabaseService();
  const { error } = await svc
    .from("ai_custom_rules")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", ruleId);
  if (error) throw new Error(error.message);
}

export async function updateCustomRule(input: {
  id: string;
  title?: string;
  body?: string;
  scope?: string;
  scope_value?: string | null;
}): Promise<void> {
  const svc = getSupabaseService();
  const patch: Record<string, any> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) patch.title = input.title;
  if (input.body !== undefined) patch.body = input.body;
  if (input.scope !== undefined) patch.scope = input.scope;
  if (input.scope_value !== undefined) patch.scope_value = input.scope_value;
  const { error } = await svc.from("ai_custom_rules").update(patch).eq("id", input.id);
  if (error) throw new Error(error.message);
}

export async function deleteCustomRule(ruleId: string): Promise<void> {
  const svc = getSupabaseService();
  const { error } = await svc.from("ai_custom_rules").delete().eq("id", ruleId);
  if (error) throw new Error(error.message);
}
