import { NextResponse } from "next/server";
import { resolveCurrentWorkspaceId } from "@/app/(app)/_lib/resolve-workspace";
import {
  createCustomRule,
  deleteCustomRule,
  setCustomRuleEnabled,
  updateCustomRule,
  type Persona,
} from "@/lib/ai/capabilities";
import { getSupabaseService } from "@/lib/supabase/server";

const PERSONAS: Persona[] = ["sofia", "vesper"];

export async function POST(req: Request) {
  const { workspaceId } = await resolveCurrentWorkspaceId();
  const body = await req.json().catch(() => null);
  if (
    !body ||
    !PERSONAS.includes(body.persona) ||
    typeof body.category !== "string" ||
    typeof body.title !== "string" ||
    typeof body.body !== "string" ||
    !body.title.trim() ||
    !body.body.trim()
  ) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const rule = await createCustomRule({
    workspaceId,
    persona: body.persona,
    category: body.category,
    title: body.title.trim(),
    body: body.body.trim(),
    scope: typeof body.scope === "string" ? body.scope : "global",
    scope_value: typeof body.scope_value === "string" ? body.scope_value : null,
  });
  return NextResponse.json({ ok: true, rule });
}

export async function PATCH(req: Request) {
  const { workspaceId } = await resolveCurrentWorkspaceId();
  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  // Confirm the rule belongs to this workspace
  const svc = getSupabaseService();
  const { data: rule } = await svc
    .from("ai_custom_rules")
    .select("id, workspace_id")
    .eq("id", body.id)
    .maybeSingle();
  if (!rule || rule.workspace_id !== workspaceId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (typeof body.enabled === "boolean") {
    await setCustomRuleEnabled(body.id, body.enabled);
  }
  if (
    typeof body.title === "string" ||
    typeof body.body === "string" ||
    typeof body.scope === "string" ||
    typeof body.scope_value === "string"
  ) {
    await updateCustomRule({
      id: body.id,
      title: typeof body.title === "string" ? body.title : undefined,
      body: typeof body.body === "string" ? body.body : undefined,
      scope: typeof body.scope === "string" ? body.scope : undefined,
      scope_value: typeof body.scope_value === "string" ? body.scope_value : undefined,
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { workspaceId } = await resolveCurrentWorkspaceId();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const svc = getSupabaseService();
  const { data: rule } = await svc
    .from("ai_custom_rules")
    .select("id, workspace_id")
    .eq("id", id)
    .maybeSingle();
  if (!rule || rule.workspace_id !== workspaceId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await deleteCustomRule(id);
  return NextResponse.json({ ok: true });
}
