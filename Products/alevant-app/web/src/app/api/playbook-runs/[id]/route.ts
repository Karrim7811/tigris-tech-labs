import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { abortRun, pauseRun, resumeRun } from "@/lib/playbook-engine";

/**
 * POST /api/playbook-runs/[id]
 * body: { action: 'pause' | 'resume' | 'abort' }
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
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

  const { data: run } = await svc
    .from("playbook_runs")
    .select("id")
    .eq("id", id)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  if (!run) return NextResponse.json({ error: "run not found" }, { status: 404 });

  const action = (await req.json()).action as "pause" | "resume" | "abort";
  if (action === "pause") await pauseRun(svc, id);
  else if (action === "resume") await resumeRun(svc, id);
  else if (action === "abort") await abortRun(svc, id);
  else return NextResponse.json({ error: "unknown action" }, { status: 400 });

  return NextResponse.json({ ok: true });
}
