import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Auth session refresh for all routes
  const response = await updateSession(request);

  // Tenant routing: pass tenant slug to downstream via header
  const host = (request.headers.get("host") || "").toLowerCase().split(":")[0];
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "alevant.ai";

  let tenantHint: string | null = null;
  if (host.endsWith(`.${appDomain}`)) {
    const sub = host.replace(`.${appDomain}`, "");
    if (sub && sub !== "www" && sub !== "app") {
      tenantHint = sub;
    }
  } else if (host !== appDomain && host !== `www.${appDomain}` && host !== "localhost") {
    tenantHint = `__custom__:${host}`;
  }

  if (tenantHint) {
    response.headers.set("x-alevant-tenant", tenantHint);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
