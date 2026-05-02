import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";
import { publishToChannel, serviceForChannel } from "@/lib/social";
import type { VesperChannel } from "@/lib/types";

/**
 * POST /api/vesper/publish/[asset_id] — publish an approved Vesper asset to its channel.
 * Steps:
 *   1. Verify asset is in 'approved' state.
 *   2. Resolve workspace_integrations row for the channel's service.
 *   3. Route to channel-specific publisher.
 *   4. On success, mark asset 'published' with remote_id + url.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ asset_id: string }> }) {
  const { asset_id } = await params;
  const svc = getSupabaseService();

  const { data: asset } = await svc
    .from("vesper_assets")
    .select("*, workspaces(brand_kits(*))")
    .eq("id", asset_id)
    .maybeSingle();
  if (!asset) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (asset.status !== "approved") {
    return NextResponse.json({ error: "asset not approved" }, { status: 400 });
  }
  const channel = asset.channel as VesperChannel | undefined;
  if (!channel) return NextResponse.json({ error: "asset has no channel" }, { status: 400 });

  const service = serviceForChannel(channel);
  if (!service) return NextResponse.json({ error: `channel ${channel} has no publisher` }, { status: 400 });

  const { data: integration } = await svc
    .from("workspace_integrations")
    .select("*")
    .eq("workspace_id", asset.workspace_id)
    .eq("service", service)
    .maybeSingle();
  if (!integration) {
    return NextResponse.json({ error: `${service} integration not connected` }, { status: 412 });
  }

  const brand = (asset as any).workspaces?.brand_kits || {
    primary_color: "#3D4F8C",
    accent_color: "#B5853E",
  };

  const result = await publishToChannel(
    {
      asset_id,
      channel,
      content: asset.content,
      visual_urls: asset.visual_urls || [],
      workspace_id: asset.workspace_id,
      brand,
    },
    integration as any
  );

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  await svc
    .from("vesper_assets")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      content: { ...(asset.content as any), remote_id: result.remote_id, remote_url: result.remote_url },
    })
    .eq("id", asset_id);

  return NextResponse.json({ ok: true, remote_id: result.remote_id, remote_url: result.remote_url });
}
