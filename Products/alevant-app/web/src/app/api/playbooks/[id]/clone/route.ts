import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

/**
 * POST /api/playbooks/[id]/clone
 * Clones a (system or workspace) playbook into a new workspace-scoped, non-system
 * playbook the user can edit. Returns the new playbook id.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const svc = getSupabaseService();
  const { data: ws } = await svc
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!ws) return NextResponse.json({ error: "no workspace" }, { status: 404 });

  const { data: source } = await svc
    .from("playbooks")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  if (!source) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: clone, error } = await svc
    .from("playbooks")
    .insert({
      workspace_id: ws.id,
      name: `${source.name} (custom)`,
      description: source.description,
      trigger_lifecycle_stages: source.trigger_lifecycle_stages,
      trigger_temperatures: source.trigger_temperatures,
      steps_json: source.steps_json,
      is_system: false,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ playbook: clone });
}
