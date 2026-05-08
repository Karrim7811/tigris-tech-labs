import { resolveCurrentWorkspaceId } from "@/app/(app)/_lib/resolve-workspace";
import { loadPersonaSettings } from "@/lib/ai/capabilities";
import { PersonaSettingsClient } from "../_PersonaSettingsClient";

export default async function SofiaSettingsPage() {
  const { workspaceId } = await resolveCurrentWorkspaceId();
  const settings = await loadPersonaSettings(workspaceId, "sofia");
  return <PersonaSettingsClient persona="sofia" settings={settings} />;
}
