import { NextResponse } from "next/server";
import { setCapabilityEnabled } from "@/lib/ai/capabilities";
import { resolveCurrentWorkspaceId } from "@/app/(app)/_lib/resolve-workspace";
import { getSupabaseService } from "@/lib/supabase/server";

/**
 * PATCH /api/settings/capabilities
 * Body: { capability_id: string, enabled: boolean }
 *
 * Toggles a single capability on/off. Confirms the capability belongs to
 * the current user's workspace before mutating.
 */
export async function PATCH(req: Request) {
  const { workspaceId } = await resolveCurrentWorkspaceId();
  const body = await req.json().catch(() => null);
  if (!body || typeof body.capability_id !== "string" || typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  // Auth check — capability must belong to this workspace
  const svc = getSupabaseService();
  const { data: cap } = await svc
    .from("ai_capabilities")
    .select("id, workspace_id, is_master_kill")
    .eq("id", body.capability_id)
    .maybeSingle();
  if (!cap || cap.workspace_id !== workspaceId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await setCapabilityEnabled(body.capability_id, body.enabled);
  return NextResponse.json({ ok: true });
}
