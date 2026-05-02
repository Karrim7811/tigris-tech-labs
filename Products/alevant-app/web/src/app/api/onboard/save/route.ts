import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * POST /api/onboard/save — persist a single stage of the onboarding wizard.
 * Body: { stage: number, data: Record<string, unknown> }
 * Auth: required.
 */
export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.stage !== "number") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  // V1: persist into workspaces.metadata under onboarding_state.{stage}
  // (Stage-specific tables are filled in /api/onboard/activate.)
  const { data: ws } = await sb
    .from("workspaces")
    .select("id, metadata")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!ws) {
    // Create a placeholder workspace
    const { data: created } = await sb
      .from("workspaces")
      .insert({
        slug: `pending-${user.id.slice(0, 8)}`,
        name: "Pending Workspace",
        owner_user_id: user.id,
        status: "onboarding",
        metadata: { onboarding_state: { [body.stage]: body.data } },
      })
      .select()
      .single();
    return NextResponse.json({ workspace_id: created?.id });
  }

  const meta = (ws.metadata as Record<string, unknown>) || {};
  const onboarding_state = (meta.onboarding_state as Record<string, unknown>) || {};
  onboarding_state[String(body.stage)] = body.data;
  await sb
    .from("workspaces")
    .update({ metadata: { ...meta, onboarding_state } })
    .eq("id", ws.id);

  return NextResponse.json({ workspace_id: ws.id, ok: true });
}
