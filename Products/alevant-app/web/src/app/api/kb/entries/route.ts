import { NextResponse } from "next/server";
import { resolveCurrentWorkspaceId } from "@/app/(app)/_lib/resolve-workspace";
import { createEntry, deleteEntry, updateEntry, type KbPersona } from "@/lib/kb";
import { getSupabaseService } from "@/lib/supabase/server";

const PERSONAS: KbPersona[] = ["sofia", "vesper", "shared"];

export async function POST(req: Request) {
  const { workspaceId } = await resolveCurrentWorkspaceId();
  const body = await req.json().catch(() => null);
  if (
    !body ||
    !PERSONAS.includes(body.persona) ||
    typeof body.category !== "string" ||
    typeof body.title !== "string" ||
    !body.title.trim()
  ) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const entry = await createEntry({
    workspaceId,
    persona: body.persona,
    collection_id: typeof body.collection_id === "string" ? body.collection_id : null,
    category: body.category,
    title: body.title.trim(),
    body: typeof body.body === "string" ? body.body : "",
    tags: Array.isArray(body.tags) ? body.tags : [],
    is_pinned: !!body.is_pinned,
    source: typeof body.source === "string" ? body.source : "manual",
    source_url: typeof body.source_url === "string" ? body.source_url : null,
  });
  return NextResponse.json({ ok: true, entry });
}

export async function PATCH(req: Request) {
  const { workspaceId } = await resolveCurrentWorkspaceId();
  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const svc = getSupabaseService();
  const { data: entry } = await svc
    .from("knowledge_entries")
    .select("id, workspace_id")
    .eq("id", body.id)
    .maybeSingle();
  if (!entry || entry.workspace_id !== workspaceId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await updateEntry({
    id: body.id,
    title: typeof body.title === "string" ? body.title : undefined,
    body: typeof body.body === "string" ? body.body : undefined,
    tags: Array.isArray(body.tags) ? body.tags : undefined,
    is_pinned: typeof body.is_pinned === "boolean" ? body.is_pinned : undefined,
    collection_id:
      typeof body.collection_id === "string" || body.collection_id === null
        ? body.collection_id
        : undefined,
    category: typeof body.category === "string" ? body.category : undefined,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { workspaceId } = await resolveCurrentWorkspaceId();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const svc = getSupabaseService();
  const { data: entry } = await svc
    .from("knowledge_entries")
    .select("id, workspace_id")
    .eq("id", id)
    .maybeSingle();
  if (!entry || entry.workspace_id !== workspaceId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await deleteEntry(id);
  return NextResponse.json({ ok: true });
}
