// Meta (Instagram + Facebook) publisher.
// Docs: https://developers.facebook.com/docs/instagram-platform/content-publishing
//
// Two-step IG publish:
//   1. POST /{ig-user-id}/media → returns creation_id
//   2. POST /{ig-user-id}/media_publish?creation_id=...
// FB Page publish is single-step: POST /{page-id}/feed or /{page-id}/photos.

import type { PublishInput, PublishResult, PublisherIntegration, SocialPublisher } from "./types";

const GRAPH_BASE = "https://graph.facebook.com/v21.0";

async function fetchJSON(url: string, init: RequestInit) {
  const r = await fetch(url, init);
  const json = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`Meta Graph ${url} failed: ${r.status} ${JSON.stringify(json)}`);
  return json;
}

async function igPublish(input: PublishInput, integration: PublisherIntegration): Promise<PublishResult> {
  const igUserId = integration.metadata?.ig_user_id;
  const accessToken = integration.metadata?.access_token;
  if (!igUserId || !accessToken) {
    return { ok: false, error: "ig_user_id or access_token missing in integration metadata" };
  }

  const caption = renderCaption(input);
  const imageUrl = input.visual_urls?.[0];
  if (!imageUrl) return { ok: false, error: "no visual asset for IG post" };

  // Step 1 — create media container
  const create = await fetchJSON(
    `${GRAPH_BASE}/${igUserId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`,
    { method: "POST" }
  );

  // Step 2 — publish
  const publish = await fetchJSON(
    `${GRAPH_BASE}/${igUserId}/media_publish?creation_id=${create.id}&access_token=${accessToken}`,
    { method: "POST" }
  );

  return {
    ok: true,
    remote_id: publish.id,
    remote_url: `https://www.instagram.com/p/${publish.id}`,
  };
}

async function fbPagePublish(input: PublishInput, integration: PublisherIntegration): Promise<PublishResult> {
  const pageId = integration.metadata?.fb_page_id;
  const pageToken = integration.metadata?.fb_page_access_token;
  if (!pageId || !pageToken) return { ok: false, error: "fb_page_id missing" };

  const message = renderCaption(input);
  const imageUrl = input.visual_urls?.[0];

  if (imageUrl) {
    const r = await fetchJSON(
      `${GRAPH_BASE}/${pageId}/photos`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: imageUrl, message, access_token: pageToken }),
      }
    );
    return { ok: true, remote_id: r.post_id, remote_url: `https://www.facebook.com/${r.post_id}` };
  }

  const r = await fetchJSON(
    `${GRAPH_BASE}/${pageId}/feed`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, access_token: pageToken }),
    }
  );
  return { ok: true, remote_id: r.id };
}

function renderCaption(input: PublishInput): string {
  const c = input.content || {};
  const lines = [c.copy, c.caption, c.body, c.script].filter(Boolean);
  return lines.join("\n\n").slice(0, 2200);
}

export const InstagramPublisher: SocialPublisher = {
  channel: "instagram",
  publish: igPublish,
};

export const FacebookPublisher: SocialPublisher = {
  channel: "instagram", // FB Pages publish via same module; routed by metadata.platform
  publish: fbPagePublish,
};
