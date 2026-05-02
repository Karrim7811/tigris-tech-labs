// LinkedIn publisher — UGC posts API.
// Docs: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api

import type { PublishInput, PublishResult, PublisherIntegration, SocialPublisher } from "./types";

async function publishLinkedIn(input: PublishInput, integration: PublisherIntegration): Promise<PublishResult> {
  const token = integration.metadata?.access_token;
  const personUrn = integration.metadata?.person_urn; // 'urn:li:person:xxx' or 'urn:li:organization:xxx'
  if (!token || !personUrn) return { ok: false, error: "LinkedIn token or URN missing" };

  const text = (input.content?.copy || input.content?.body || "").slice(0, 3000);

  const r = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: personUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  const json: any = await r.json().catch(() => null);
  if (!r.ok) return { ok: false, error: `LinkedIn UGC failed: ${r.status} ${JSON.stringify(json)}` };
  return {
    ok: true,
    remote_id: json?.id,
    remote_url: json?.id ? `https://www.linkedin.com/feed/update/${json.id}` : undefined,
  };
}

export const LinkedInPublisher: SocialPublisher = {
  channel: "linkedin",
  publish: publishLinkedIn,
};
