import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { getAdapter } from "@/lib/oauth";

/**
 * GET /api/onboard/oauth/[service]/callback — handle the OAuth redirect.
 * Validates state, exchanges code for tokens, persists workspace_integrations row.
 */
export async function GET(req: Request, { params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  if (!code || !stateParam) return NextResponse.redirect(new URL("/onboard/connections?error=missing_params", req.url));

  const cookieState = req.headers
    .get("cookie")
    ?.split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`alevant_oauth_state_${service}=`))
    ?.split("=")[1];
  if (!cookieState || cookieState !== stateParam) {
    return NextResponse.redirect(new URL("/onboard/connections?error=state_mismatch", req.url));
  }

  const adapter = getAdapter(service);
  if (!adapter) return NextResponse.redirect(new URL("/onboard/connections?error=unknown_service", req.url));

  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const redirectUri = new URL(`/api/onboard/oauth/${service}/callback`, process.env.NEXT_PUBLIC_APP_URL || req.url).toString();
  let exchanged;
  try {
    exchanged = await adapter.exchange({ code, redirectUri });
  } catch (e) {
    return NextResponse.redirect(new URL(`/onboard/connections?error=exchange_failed&detail=${encodeURIComponent((e as Error).message)}`, req.url));
  }

  const svc = getSupabaseService();
  const { data: ws } = await svc.from("workspaces").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (!ws) return NextResponse.redirect(new URL("/onboard?error=no_workspace", req.url));

  await svc
    .from("workspace_integrations")
    .upsert(
      {
        workspace_id: ws.id,
        service,
        oauth_access_token_encrypted: exchanged.access_token,
        oauth_refresh_token_encrypted: exchanged.refresh_token,
        scopes: exchanged.scopes,
        expires_at: exchanged.expires_at,
        metadata: exchanged.metadata || {},
        status: "connected",
        connected_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,service" }
    );

  return NextResponse.redirect(new URL(`/onboard/connections?connected=${service}`, req.url));
}
