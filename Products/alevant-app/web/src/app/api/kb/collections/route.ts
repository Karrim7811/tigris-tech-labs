import { NextResponse } from "next/server";
import { resolveCurrentWorkspaceId } from "@/app/(app)/_lib/resolve-workspace";
import { createCollection, type KbPersona } from "@/lib/kb";

const PERSONAS: KbPersona[] = ["sofia", "vesper", "shared"];

export async function POST(req: Request) {
  const { workspaceId } = await resolveCurrentWorkspaceId();
  const body = await req.json().catch(() => null);
  if (!body || !PERSONAS.includes(body.persona) || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const collection = await createCollection({
    workspaceId,
    persona: body.persona,
    name: body.name.trim(),
    description: typeof body.description === "string" ? body.description : undefined,
  });
  return NextResponse.json({ ok: true, collection });
}
