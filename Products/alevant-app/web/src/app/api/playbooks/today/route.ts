import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

/**
 * GET /api/playbooks/today
 * Returns "today's plays" — surfaced or scheduled-and-due step runs for the user's
 * workspace, joined with the contact + playbook info needed to render in the UI.
 */
export async function GET() {
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

  const now = new Date().toISOString();
  const { data } = await svc
    .from("playbook_step_runs")
    .select(
      "*, contact:contacts(id, full_name, emails, phones, temperature, priority, lifecycle_stage), playbook_run:playbook_runs(id, status, playbook:playbooks(id, name))"
    )
    .eq("workspace_id", ws.id)
    .in("state", ["scheduled", "surfaced"])
    .lte("due_at", now)
    .order("due_at", { ascending: true })
    .limit(100);

  return NextResponse.json({ plays: data ?? [] });
}
