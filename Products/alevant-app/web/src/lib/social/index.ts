// Unified social publisher router.

import type { VesperChannel } from "@/lib/types";
import type { PublishInput, PublishResult, PublisherIntegration, SocialPublisher } from "./types";
import { InstagramPublisher } from "./meta";
import { XPublisher } from "./x";
import { TikTokPublisher } from "./tiktok";
import { LinkedInPublisher } from "./linkedin";

const PUBLISHERS: Record<VesperChannel, SocialPublisher | null> = {
  instagram: InstagramPublisher,
  x: XPublisher,
  tiktok: TikTokPublisher,
  linkedin: LinkedInPublisher,
  youtube: null,
  email: null,
  print: null,
  web: null,
};

const SERVICE_BY_CHANNEL: Partial<Record<VesperChannel, string>> = {
  instagram: "instagram",
  x: "x",
  tiktok: "tiktok",
  linkedin: "linkedin",
};

export async function publishToChannel(
  input: PublishInput,
  integration: PublisherIntegration
): Promise<PublishResult> {
  const pub = PUBLISHERS[input.channel];
  if (!pub) return { ok: false, error: `No publisher for channel ${input.channel}` };
  return pub.publish(input, integration);
}

export function serviceForChannel(channel: VesperChannel): string | null {
  return SERVICE_BY_CHANNEL[channel] ?? null;
}
