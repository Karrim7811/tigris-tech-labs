// TikTok Business publisher.
// Docs: https://developers.tiktok.com/doc/content-posting-api-get-started
//
// TikTok requires the "Content Posting API" with approval. Production flow:
//   1. POST /v2/post/publish/inbox/video/init/ → upload URL
//   2. PUT video bytes → upload URL
//   3. Poll /v2/post/publish/status/fetch/ for completion
//
// V1: scaffolded with the right endpoint shapes; activates when API approval lands.

import type { PublishInput, PublishResult, PublisherIntegration, SocialPublisher } from "./types";

async function publishTikTok(input: PublishInput, integration: PublisherIntegration): Promise<PublishResult> {
  const token = integration.metadata?.access_token;
  if (!token) return { ok: false, error: "TikTok access token missing" };

  const videoUrl = input.visual_urls?.[0];
  if (!videoUrl) return { ok: false, error: "TikTok requires a video asset" };

  const r = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
    }),
  });
  const json: any = await r.json().catch(() => null);
  if (!r.ok) return { ok: false, error: `TikTok init failed: ${r.status} ${JSON.stringify(json)}` };
  return {
    ok: true,
    remote_id: json?.data?.publish_id,
  };
}

export const TikTokPublisher: SocialPublisher = {
  channel: "tiktok",
  publish: publishTikTok,
};
