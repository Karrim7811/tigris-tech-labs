import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

/**
 * GET /api/prospects?source=&band=&min_score=&limit=
 *
 * Reads the vw_prospects view that unifies Grid + Inbox + Sphere into one ranked list.
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
  const source = url.searchParams.get("source");
  const band = url.searchParams.get("band");
  const minScore = parseFloat(url.searchParams.get("min_score") ?? "0");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 500);

  let q = svc
    .from("vw_prospects")
    .select("*")
    .eq("workspace_id", ws.id)
    .gte("score", isFinite(minScore) ? minScore : 0)
    .order("score", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (source) q = q.eq("source", source);
  if (band) q = q.eq("urgency_band", band);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prospects: data ?? [] });
}
