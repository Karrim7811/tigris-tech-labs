// Dotloop — OAuth 2.0 + Public API helpers + webhook signature verification.
// Docs: https://dotloop.github.io/public-api/
//
// Flow:
//   1. OAuth 2.0 authorization-code grant → access_token + refresh_token
//      (exchange in /api/onboard/oauth/dotloop/callback when wired live).
//   2. CRUD loops, documents, signature requests via the Public API v2.
//   3. Subscribe to loop events via webhooks; verify with HMAC signature.
//
// V1 stubs: shape mirrors lib/docusign.ts so transaction-brain can dispatch
// to either provider through a thin abstraction. All functions throw with a
// clear message if env credentials aren't configured — Bichi's onboarding
// queues Dotloop for connection; real OAuth wiring goes live when his
// account credentials land in env.
//
// Required env (when going live):
//   DOTLOOP_CLIENT_ID
//   DOTLOOP_CLIENT_SECRET
//   DOTLOOP_REDIRECT_URI
//   DOTLOOP_WEBHOOK_SECRET
//   DOTLOOP_API_BASE  (default: https://api-gateway.dotloop.com/public/v2)

import crypto from "node:crypto";

const API_BASE = process.env.DOTLOOP_API_BASE || "https://api-gateway.dotloop.com/public/v2";
const CLIENT_ID = process.env.DOTLOOP_CLIENT_ID;
const CLIENT_SECRET = process.env.DOTLOOP_CLIENT_SECRET;

interface TokenSet {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// Per-account token cache. In V2 this should live in workspace_integrations.
const tokenCache = new Map<string, TokenSet>();

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<TokenSet> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Dotloop env not configured (DOTLOOP_CLIENT_ID / DOTLOOP_CLIENT_SECRET).");
  }
  const r = await fetch(`${API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  if (!r.ok) throw new Error(`Dotloop token exchange failed: ${r.status} ${await r.text()}`);
  const j = (await r.json()) as { access_token: string; refresh_token: string; expires_in: number };
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: Date.now() + j.expires_in * 1000,
  };
}

export async function refreshToken(refresh: string): Promise<TokenSet> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Dotloop env not configured.");
  }
  const r = await fetch(`${API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  if (!r.ok) throw new Error(`Dotloop refresh failed: ${r.status} ${await r.text()}`);
  const j = (await r.json()) as { access_token: string; refresh_token: string; expires_in: number };
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: Date.now() + j.expires_in * 1000,
  };
}

async function dlFetch(workspaceId: string, path: string, init: RequestInit = {}) {
  const tok = tokenCache.get(workspaceId);
  if (!tok) throw new Error(`Dotloop not connected for workspace ${workspaceId}`);
  const r = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${tok.access_token}`,
      "content-type": "application/json",
    },
  });
  if (!r.ok) throw new Error(`Dotloop ${path} failed: ${r.status} ${await r.text()}`);
  return r.json();
}

// ── Loop helpers (Dotloop's term for a transaction folder) ────────────

export interface CreateLoopOptions {
  workspaceId: string;
  profileId: string; // Dotloop "profile" — the agent's account context
  name: string;
  status?: "PRE_LISTING" | "PRIVATE_LISTING" | "ACTIVE_LISTING" | "UNDER_CONTRACT" | "SOLD" | "LEASED" | "ARCHIVED";
  transactionType?: "LISTING_FOR_LEASE" | "LISTING_FOR_SALE" | "PURCHASE" | "LEASE";
}

export async function createLoop(opts: CreateLoopOptions) {
  return dlFetch(opts.workspaceId, `/profile/${opts.profileId}/loop`, {
    method: "POST",
    body: JSON.stringify({
      name: opts.name,
      status: opts.status || "UNDER_CONTRACT",
      transactionType: opts.transactionType || "PURCHASE",
    }),
  });
}

export async function getLoop(workspaceId: string, profileId: string, loopId: string) {
  return dlFetch(workspaceId, `/profile/${profileId}/loop/${loopId}`);
}

export async function listLoopParticipants(workspaceId: string, profileId: string, loopId: string) {
  return dlFetch(workspaceId, `/profile/${profileId}/loop/${loopId}/participant`);
}

export async function listLoopDocuments(workspaceId: string, profileId: string, loopId: string, folderId: string) {
  return dlFetch(workspaceId, `/profile/${profileId}/loop/${loopId}/folder/${folderId}/document`);
}

/**
 * Verify a Dotloop webhook signature.
 * Dotloop signs webhooks with HMAC-SHA256 over the raw body using a shared secret.
 * Header: `x-dotloop-signature` (hex digest).
 */
export function verifyWebhookSignature(rawBody: string, providedSignature: string | null): boolean {
  const secret = process.env.DOTLOOP_WEBHOOK_SECRET;
  if (!secret || !providedSignature) return false;
  const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(providedSignature, "hex"), Buffer.from(computed, "hex"));
  } catch {
    return false;
  }
}
