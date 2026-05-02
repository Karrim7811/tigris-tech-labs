// Social-publisher shared types.

import type { VesperChannel } from "@/lib/types";

export interface PublisherIntegration {
  service: string;
  oauth_access_token_encrypted?: string | null;
  oauth_refresh_token_encrypted?: string | null;
  metadata?: Record<string, any> | null;
  expires_at?: string | null;
}

export interface PublishInput {
  asset_id: string;
  channel: VesperChannel;
  content: any;
  visual_urls?: string[];
  workspace_id: string;
  brand: { wordmark_text?: string; primary_color: string; accent_color: string };
}

export interface PublishResult {
  ok: boolean;
  remote_id?: string;
  remote_url?: string;
  error?: string;
}

export interface SocialPublisher {
  channel: VesperChannel;
  publish: (input: PublishInput, integration: PublisherIntegration) => Promise<PublishResult>;
}
