import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getAdapter } from "@/lib/oauth";
import crypto from "node:crypto";

/**
 * GET /api/onboard/oauth/[service] — initiate OAuth for a service.
 * Generates state, stores it in a signed cookie, redirects to provider.
 */
export async function GET(req: Request, { params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const adapter = getAdapter(service);
  if (!adapter) return NextResponse.json({ error: `unknown service ${service}` }, { status: 404 });

  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const state = crypto.randomBytes(24).toString("base64url");
  const redirectUri = new URL(`/api/onboard/oauth/${service}/callback`, process.env.NEXT_PUBLIC_APP_URL || req.url).toString();
  const authUrl = adapter.authorize({ state, redirectUri });

  const res = NextResponse.redirect(authUrl);
  res.cookies.set(`alevant_oauth_state_${service}`, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
