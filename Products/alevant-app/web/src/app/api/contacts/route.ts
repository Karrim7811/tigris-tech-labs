import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

/**
 * GET  /api/contacts?lifecycle=&category=&search=
 * POST /api/contacts  body: contact fields
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
  const lifecycle = url.searchParams.get("lifecycle");
  const category = url.searchParams.get("category");
  const search = url.searchParams.get("search");
  const tag = url.searchParams.get("tag");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "200", 10), 500);

  let q = svc
    .from("vw_contacts_unified")
    .select("*")
    .eq("workspace_id", ws.id)
    .order("last_touch_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (lifecycle) q = q.eq("lifecycle_stage", lifecycle);
  if (category) q = q.eq("category", category);
  if (tag) q = q.contains("tags", [tag]);
  if (search) q = q.ilike("full_name", `%${search}%`);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data ?? [] });
}

export async function POST(req: Request) {
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

  const body = await req.json();
  if (!body.full_name && !body.emails?.length && !body.phones?.length) {
    return NextResponse.json(
      { error: "at least one of full_name / emails / phones required" },
      { status: 400 }
    );
  }

  const payload = {
    workspace_id: ws.id,
    full_name: body.full_name ?? null,
    emails: body.emails ?? [],
    phones: body.phones ?? [],
    category: body.category ?? "lead",
    lifecycle_stage: body.lifecycle_stage ?? "prospect",
    tags: body.tags ?? [],
    prospect_source: body.prospect_source ?? "manual",
    relationship_score: body.relationship_score ?? 0,
    source: body.source ?? null,
    language: body.language ?? null,
    notes: body.notes ?? null,
    metadata: body.metadata ?? {},
  };

  const { data, error } = await svc.from("contacts").insert(payload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contact: data });
}
