// Meta OAuth (Instagram + Facebook Business).

import type { OAuthAdapter } from "./index";

const SCOPES_BY_SERVICE: Record<string, string[]> = {
  instagram: ["instagram_basic", "instagram_content_publish", "instagram_manage_messages", "instagram_manage_insights", "pages_show_list", "business_management"],
  facebook: ["pages_show_list", "pages_manage_posts", "pages_read_engagement", "pages_manage_engagement", "leads_retrieval"],
};

export function MetaAdapter(service: "instagram" | "facebook"): OAuthAdapter {
  return {
    service,
    authorize({ state, redirectUri }) {
      const params = new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        redirect_uri: redirectUri,
        scope: SCOPES_BY_SERVICE[service].join(","),
        response_type: "code",
        state,
      });
      return `https://www.facebook.com/v21.0/dialog/oauth?${params}`;
    },
    async exchange({ code, redirectUri }) {
      // Step 1 — short-lived token
      const short = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?` +
          new URLSearchParams({
            client_id: process.env.META_APP_ID!,
            client_secret: process.env.META_APP_SECRET!,
            redirect_uri: redirectUri,
            code,
          })
      );
      if (!short.ok) throw new Error(`Meta token exchange failed: ${short.status}`);
      const shortJson = (await short.json()) as { access_token: string };

      // Step 2 — exchange for long-lived (60-day) token
      const long = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?` +
          new URLSearchParams({
            grant_type: "fb_exchange_token",
            client_id: process.env.META_APP_ID!,
            client_secret: process.env.META_APP_SECRET!,
            fb_exchange_token: shortJson.access_token,
          })
      );
      if (!long.ok) throw new Error(`Meta long-lived exchange failed: ${long.status}`);
      const longJson = (await long.json()) as { access_token: string; expires_in: number };

      // Step 3 — fetch IG/FB business metadata (page id, ig user id)
      const meRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${longJson.access_token}`);
      const meJson = (await meRes.json()) as { data: Array<{ id: string; name: string; access_token: string; instagram_business_account?: { id: string } }> };
      const firstPage = meJson.data?.[0];

      const metadata: Record<string, any> = {
        access_token: longJson.access_token,
      };
      if (firstPage) {
        metadata.fb_page_id = firstPage.id;
        metadata.fb_page_name = firstPage.name;
        metadata.fb_page_access_token = firstPage.access_token;
        if (firstPage.instagram_business_account) {
          metadata.ig_user_id = firstPage.instagram_business_account.id;
        }
      }

      return {
        access_token: longJson.access_token,
        expires_at: new Date(Date.now() + longJson.expires_in * 1000).toISOString(),
        scopes: SCOPES_BY_SERVICE[service],
        metadata,
      };
    },
  };
}
