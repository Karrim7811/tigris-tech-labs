import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

/**
 * GET /api/contacts/[id]/playbooks
 * Returns active + recently completed playbook runs with their steps.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
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

  const { data: runs } = await svc
    .from("playbook_runs")
    .select("*, playbook:playbooks(id, name, description)")
    .eq("workspace_id", ws.id)
    .eq("contact_id", id)
    .order("started_at", { ascending: false })
    .limit(10);

  if (!runs?.length) return NextResponse.json({ runs: [] });

  const runIds = runs.map((r) => r.id);
  const { data: steps } = await svc
    .from("playbook_step_runs")
    .select("*")
    .in("run_id", runIds)
    .order("step_index", { ascending: true });

  const out = runs.map((r) => ({
    ...r,
    steps: (steps ?? []).filter((s) => s.run_id === r.id),
  }));
  return NextResponse.json({ runs: out });
}
