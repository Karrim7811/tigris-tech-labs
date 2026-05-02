import { headers } from "next/headers";
import { getSupabaseService } from "./supabase/server";
import type { BrandKit, Workspace } from "./types";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "alevant.ai";

/**
 * Resolve the current tenant from request headers.
 * Priority:
 *   1. Custom domain (future enterprise tenants) → workspaces.custom_domain match
 *   2. Subdomain on app domain (e.g. bichi.alevant.ai) → workspaces.slug match
 *   3. null (marketing / app root)
 */
export async function resolveTenantFromHeaders(): Promise<Workspace | null> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "").toLowerCase();
  if (!host) return null;

  // Strip port
  const hostname = host.split(":")[0];

  // Custom domain (enterprise tenants — V2)
  if (!hostname.endsWith(APP_DOMAIN)) {
    const sb = getSupabaseService();
    const { data } = await sb
      .from("workspaces")
      .select("*")
      .eq("custom_domain", hostname)
      .maybeSingle();
    return (data as Workspace) || null;
  }

  // Subdomain on app domain
  const sub = hostname.replace(`.${APP_DOMAIN}`, "");
  if (sub === APP_DOMAIN || sub === "" || sub === "www" || sub === "app") return null;

  const sb = getSupabaseService();
  const { data } = await sb
    .from("workspaces")
    .select("*")
    .eq("slug", sub)
    .maybeSingle();
  return (data as Workspace) || null;
}

export async function getBrandKit(workspaceId: string): Promise<BrandKit | null> {
  const sb = getSupabaseService();
  const { data: ws } = await sb
    .from("workspaces")
    .select("brand_kit_id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!ws?.brand_kit_id) return null;
  const { data: kit } = await sb
    .from("brand_kits")
    .select("*")
    .eq("id", ws.brand_kit_id)
    .maybeSingle();
  return (kit as BrandKit) || null;
}
