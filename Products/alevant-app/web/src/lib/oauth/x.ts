// X OAuth 2.0 with PKCE.
import type { OAuthAdapter } from "./index";
import crypto from "node:crypto";

const SCOPES = ["tweet.read", "tweet.write", "users.read", "dm.read", "dm.write", "offline.access"];

const _verifierByState = new Map<string, string>();

function genVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}
function challenge(verifier: string) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export const XAdapter: OAuthAdapter = {
  service: "x",
  authorize({ state, redirectUri }) {
    const verifier = genVerifier();
    _verifierByState.set(state, verifier);
    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.X_CLIENT_ID!,
      redirect_uri: redirectUri,
      scope: SCOPES.join(" "),
      state,
      code_challenge: challenge(verifier),
      code_challenge_method: "S256",
    });
    return `https://twitter.com/i/oauth2/authorize?${params}`;
  },
  async exchange({ code, redirectUri }) {
    // Verifier is keyed by state; the route handler must pass it through.
    // V1: requires the state-scoped Map to be populated within the same process.
    // Production: persist verifiers in Redis or signed cookies.
    const verifier = Array.from(_verifierByState.values()).pop();
    const r = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: process.env.X_CLIENT_ID!,
        redirect_uri: redirectUri,
        code_verifier: verifier || "",
      }),
    });
    if (!r.ok) throw new Error(`X token exchange failed: ${r.status} ${await r.text()}`);
    const json = (await r.json()) as { access_token: string; refresh_token: string; expires_in: number; scope: string };
    return {
      access_token: json.access_token,
      refresh_token: json.refresh_token,
      expires_at: new Date(Date.now() + json.expires_in * 1000).toISOString(),
      scopes: json.scope?.split(" ") || SCOPES,
      metadata: { access_token: json.access_token },
    };
  },
};
