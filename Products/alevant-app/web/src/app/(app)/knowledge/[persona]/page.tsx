import { notFound } from "next/navigation";
import { resolveCurrentWorkspaceId } from "@/app/(app)/_lib/resolve-workspace";
import { loadKnowledge, signFileUrls, type KbPersona } from "@/lib/kb";
import { KnowledgeClient } from "./_KnowledgeClient";

const VALID: KbPersona[] = ["sofia", "vesper", "shared"];

export default async function KnowledgePersonaPage({
  params,
}: {
  params: Promise<{ persona: string }>;
}) {
  const { persona: raw } = await params;
  if (!VALID.includes(raw as KbPersona)) notFound();
  const persona = raw as KbPersona;

  const { workspaceId } = await resolveCurrentWorkspaceId();
  const { collections, entries, files } = await loadKnowledge(workspaceId, persona);
  const fileUrls = files.length > 0 ? await signFileUrls(files) : {};

  return (
    <KnowledgeClient
      persona={persona}
      collections={collections}
      entries={entries}
      files={files}
      fileUrls={fileUrls}
    />
  );
}
