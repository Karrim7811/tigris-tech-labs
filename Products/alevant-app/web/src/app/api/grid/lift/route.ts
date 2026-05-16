import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { computeLift } from "@/lib/grid-outcomes";

/**
 * GET /api/grid/lift?window=90
 * Returns cockpit lift metric: flagged-cohort conversion vs. baseline.
 */
export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const window = parseInt(url.searchParams.get("window") ?? "90", 10);

  try {
    const lift = await computeLift(svc, ws.id, isFinite(window) && window > 0 ? window : 90);
    return NextResponse.json(lift);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
