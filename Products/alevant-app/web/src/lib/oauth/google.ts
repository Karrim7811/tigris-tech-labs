// Google OAuth — Gmail, Calendar, YouTube.

import type { OAuthAdapter } from "./index";

const SCOPES_BY_SERVICE: Record<string, string[]> = {
  gmail: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/contacts.readonly",
  ],
  gcal: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ],
  youtube: [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
  ],
};

export function GoogleAdapter(service: "gmail" | "gcal" | "youtube"): OAuthAdapter {
  return {
    service,
    authorize({ state, redirectUri }) {
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: SCOPES_BY_SERVICE[service].join(" "),
        access_type: "offline",
        prompt: "consent",
        state,
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    },
    async exchange({ code, redirectUri }) {
      const r = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      if (!r.ok) throw new Error(`Google token exchange failed: ${r.status} ${await r.text()}`);
      const json = (await r.json()) as { access_token: string; refresh_token?: string; expires_in: number; scope: string };
      return {
        access_token: json.access_token,
        refresh_token: json.refresh_token,
        expires_at: new Date(Date.now() + json.expires_in * 1000).toISOString(),
        scopes: json.scope?.split(" ") || [],
      };
    },
  };
}
