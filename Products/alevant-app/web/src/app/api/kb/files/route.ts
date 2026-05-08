import { NextResponse } from "next/server";
import { resolveCurrentWorkspaceId } from "@/app/(app)/_lib/resolve-workspace";
import { deleteKnowledgeFile, uploadKnowledgeFile, type KbPersona } from "@/lib/kb";

const PERSONAS: KbPersona[] = ["sofia", "vesper", "shared"];

export const runtime = "nodejs";
// Allow up to ~15 MB per upload — Vesper image library
export const dynamic = "force-dynamic";

/**
 * POST /api/kb/files — multipart/form-data
 *
 * Fields:
 *   persona      — 'sofia' | 'vesper' | 'shared'
 *   entry_id     — optional, attach to an existing entry
 *   caption      — optional
 *   tags         — optional, comma-separated
 *   shot_type    — optional ('headshot'|'lifestyle'|'drone'|'listing'|'mood')
 *   time_of_day  — optional ('sunrise'|'morning'|'midday'|'sunset'|'blue_hour'|'night')
 *   mood         — optional
 *   file         — the binary File
 */
export async function POST(req: Request) {
  const { workspaceId } = await resolveCurrentWorkspaceId();
  const form = await req.formData();
  const persona = form.get("persona")?.toString();
  if (!persona || !PERSONAS.includes(persona as KbPersona)) {
    return NextResponse.json({ error: "invalid persona" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "file too large (max 15 MB)" }, { status: 413 });
  }

  const tagsRaw = form.get("tags")?.toString() ?? "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const result = await uploadKnowledgeFile({
    workspaceId,
    persona: persona as KbPersona,
    entryId: form.get("entry_id")?.toString() || null,
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    bytes: await file.arrayBuffer(),
    caption: form.get("caption")?.toString(),
    tags,
    shot_type: form.get("shot_type")?.toString() || null,
    time_of_day: form.get("time_of_day")?.toString() || null,
    mood: form.get("mood")?.toString() || null,
  });

  return NextResponse.json({ ok: true, ...result });
}

export async function DELETE(req: Request) {
  await resolveCurrentWorkspaceId();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteKnowledgeFile(id);
  return NextResponse.json({ ok: true });
}
