// X (formerly Twitter) publisher — API v2.
// Docs: https://docs.x.com/x-api/posts/creation-of-a-post
//
// Auth: OAuth 2.0 user-context token (per workspace integration).
// Post: POST /2/tweets with text + optional media_ids.

import type { PublishInput, PublishResult, PublisherIntegration, SocialPublisher } from "./types";

async function publishX(input: PublishInput, integration: PublisherIntegration): Promise<PublishResult> {
  const token = integration.metadata?.access_token;
  if (!token) return { ok: false, error: "X access token missing" };

  const text = renderText(input);

  // Media upload (if visual present) — uses v1.1 media endpoint, then v2 attaches.
  let media_ids: string[] = [];
  if (input.visual_urls?.[0]) {
    try {
      // Fetch image bytes
      const imgRes = await fetch(input.visual_urls[0]);
      const buf = Buffer.from(await imgRes.arrayBuffer());
      // v1.1 media/upload (still required for v2 tweet attachments)
      const form = new FormData();
      form.append("media", new Blob([buf]));
      const uploadRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const uploadJson: any = await uploadRes.json();
      if (uploadJson?.media_id_string) media_ids.push(uploadJson.media_id_string);
    } catch {
      // proceed without media
    }
  }

  const r = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text: text.slice(0, 280),
      ...(media_ids.length ? { media: { media_ids } } : {}),
    }),
  });
  const json: any = await r.json().catch(() => null);
  if (!r.ok) return { ok: false, error: `X create-tweet failed: ${r.status} ${JSON.stringify(json)}` };
  return {
    ok: true,
    remote_id: json?.data?.id,
    remote_url: json?.data?.id ? `https://x.com/i/web/status/${json.data.id}` : undefined,
  };
}

function renderText(input: PublishInput): string {
  const c = input.content || {};
  return (c.copy || c.body || "").trim();
}

export const XPublisher: SocialPublisher = {
  channel: "x",
  publish: publishX,
};
