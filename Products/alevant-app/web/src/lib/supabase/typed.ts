// Typed Supabase clients — opt-in.
//
// The default clients in client.ts / server.ts return untyped `SupabaseClient`
// instances to preserve compatibility with ~95 files that pre-date type
// generation and rely on inference-less queries. New code and the C-3 refactor
// should import from here instead, so that schema/code drift is caught at
// build time.
//
// Regenerate `database.types.ts` whenever migrations change:
//
//   pnpm gen-types
//
// (See package.json. Backed by the Supabase MCP — see CLAUDE.md.)

import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

interface CookieItem {
  name: string;
  value: string;
  options?: CookieOptions;
}

/**
 * Authenticated, RLS-respecting server client. Use this in routes that scope
 * data to the calling user's workspace — RLS will enforce the boundary even if
 * an `.eq("workspace_id", ...)` is forgotten.
 */
export async function getTypedSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(items: CookieItem[]) {
          try {
            items.forEach(({ name, value, options }: CookieItem) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component cannot set cookies — middleware handles it
          }
        },
      },
    }
  );
}

/**
 * Service-role client — bypasses RLS. Reserve for genuinely cross-tenant
 * operations: cron sweeps, webhook ingest, marketing-site capture, ML training.
 * Do NOT use for any request scoped to a logged-in user; use
 * `getTypedSupabaseServer()` instead.
 */
export function getTypedSupabaseService() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// Convenience row/insert/update helpers — use these in app code instead of
// re-deriving from Database['public']['Tables'][T]['Row'] every time.
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
