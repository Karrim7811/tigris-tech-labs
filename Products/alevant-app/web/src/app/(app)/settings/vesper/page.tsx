import { resolveCurrentWorkspaceId } from "@/app/(app)/_lib/resolve-workspace";
import { loadPersonaSettings } from "@/lib/ai/capabilities";
import { PersonaSettingsClient } from "../_PersonaSettingsClient";

export default async function VesperSettingsPage() {
  const { workspaceId } = await resolveCurrentWorkspaceId();
  const settings = await loadPersonaSettings(workspaceId, "vesper");
  return <PersonaSettingsClient persona="vesper" settings={settings} />;
}
