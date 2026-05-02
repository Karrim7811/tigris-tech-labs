import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

/**
 * GET /api/mls/request?provider=mls_grid
 *
 * Stub — logs the connection request to workspace_integrations as 'pending'
 * so the MLS page reflects state. Real OAuth / partner-API flows hook here
 * when each aggregator's API is approved for our account.
 *
 * Once approved, this endpoint will redirect to the provider's OAuth page.
 */
export async function GET(req: Request) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const provider = new URL(req.url).searchParams.get("provider");
  if (!provider || !["mls_grid", "bridge", "trestle", "spark"].includes(provider)) {
    return NextResponse.redirect(new URL("/mls?error=unknown_provider", req.url));
  }

  const svc = getSupabaseService();
  const { data: ws } = await svc
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!ws) return NextResponse.redirect(new URL("/mls?error=no_workspace", req.url));

  await svc
    .from("workspace_integrations")
    .upsert(
      {
        workspace_id: ws.id,
        service: `mls_${provider}`,
        status: "pending_approval",
        scopes: ["read.listings"],
        metadata: { requested_at: new Date().toISOString() },
      },
      { onConflict: "workspace_id,service" }
    );

  return NextResponse.redirect(new URL("/mls?status=request_logged", req.url));
}
