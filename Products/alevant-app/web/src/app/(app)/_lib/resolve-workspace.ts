import { redirect } from "next/navigation";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

/** Resolve the current user's workspace (owner first, then membership). */
export async function resolveCurrentWorkspaceId(): Promise<{ userId: string; workspaceId: string }> {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const svc = getSupabaseService();
  const { data: ownedWs } = await svc
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  let workspaceId = ownedWs?.id as string | undefined;
  if (!workspaceId) {
    const { data: mem } = await svc
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("user_id", user.id)
      .maybeSingle();
    workspaceId = (mem as any)?.workspace_id;
  }
  if (!workspaceId) redirect("/onboard");
  return { userId: user.id, workspaceId: workspaceId! };
}
