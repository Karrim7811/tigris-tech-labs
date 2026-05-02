// LinkedIn OAuth 2.0.
import type { OAuthAdapter } from "./index";

const SCOPES = ["openid", "profile", "email", "w_member_social"];

export const LinkedInAdapter: OAuthAdapter = {
  service: "linkedin",
  authorize({ state, redirectUri }) {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      redirect_uri: redirectUri,
      state,
      scope: SCOPES.join(" "),
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  },
  async exchange({ code, redirectUri }) {
    const r = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        redirect_uri: redirectUri,
      }),
    });
    if (!r.ok) throw new Error(`LinkedIn token exchange failed: ${r.status} ${await r.text()}`);
    const json = (await r.json()) as { access_token: string; expires_in: number };

    // Fetch user URN
    const me = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${json.access_token}` },
    });
    const meJson = (await me.json()) as { sub: string };

    return {
      access_token: json.access_token,
      expires_at: new Date(Date.now() + json.expires_in * 1000).toISOString(),
      scopes: SCOPES,
      metadata: {
        access_token: json.access_token,
        person_urn: `urn:li:person:${meJson.sub}`,
      },
    };
  },
};
