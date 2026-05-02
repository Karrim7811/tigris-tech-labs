// Unified OAuth router for ALEVANT connections.
//
// Each provider exports an Adapter:
//   - authorize(opts)  → returns the redirect URL the agent's browser should visit
//   - exchange(opts)   → swaps code for tokens, returns metadata blob to persist
//
// State is signed with a per-user JWT to prevent CSRF.

export interface OAuthAdapter {
  service: string;
  authorize: (opts: { state: string; redirectUri: string }) => string;
  exchange: (opts: {
    code: string;
    redirectUri: string;
  }) => Promise<{
    access_token: string;
    refresh_token?: string;
    expires_at?: string;
    scopes: string[];
    metadata?: Record<string, any>;
  }>;
}

export const ADAPTERS = ["gmail", "gcal", "instagram", "x", "tiktok", "linkedin", "youtube", "facebook"] as const;
export type AdapterKey = (typeof ADAPTERS)[number];

import { GoogleAdapter } from "./google";
import { MetaAdapter } from "./meta";
import { XAdapter } from "./x";
import { LinkedInAdapter } from "./linkedin";
import { TikTokAdapter } from "./tiktok";

const REGISTRY: Partial<Record<AdapterKey, OAuthAdapter>> = {
  gmail: GoogleAdapter("gmail"),
  gcal: GoogleAdapter("gcal"),
  instagram: MetaAdapter("instagram"),
  facebook: MetaAdapter("facebook"),
  x: XAdapter,
  linkedin: LinkedInAdapter,
  tiktok: TikTokAdapter,
  youtube: GoogleAdapter("youtube"),
};

export function getAdapter(service: string): OAuthAdapter | null {
  return (REGISTRY as Record<string, OAuthAdapter | undefined>)[service] || null;
}
