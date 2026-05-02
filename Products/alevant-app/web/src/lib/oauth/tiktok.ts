// TikTok Business OAuth.
import type { OAuthAdapter } from "./index";

const SCOPES = ["user.info.basic", "video.publish", "video.upload"];

export const TikTokAdapter: OAuthAdapter = {
  service: "tiktok",
  authorize({ state, redirectUri }) {
    const params = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      response_type: "code",
      scope: SCOPES.join(","),
      redirect_uri: redirectUri,
      state,
    });
    return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
  },
  async exchange({ code, redirectUri }) {
    const r = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });
    if (!r.ok) throw new Error(`TikTok token exchange failed: ${r.status} ${await r.text()}`);
    const json = (await r.json()) as { access_token: string; refresh_token: string; expires_in: number; scope: string; open_id: string };
    return {
      access_token: json.access_token,
      refresh_token: json.refresh_token,
      expires_at: new Date(Date.now() + json.expires_in * 1000).toISOString(),
      scopes: json.scope?.split(",") || SCOPES,
      metadata: { access_token: json.access_token, open_id: json.open_id },
    };
  },
};
