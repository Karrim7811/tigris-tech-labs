import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { createAvatarVideo } from "@/lib/heygen";

/**
 * POST /api/vesper/avatar-video — generate a HeyGen avatar video for a Vesper film script.
 * Body: { asset_id }   (asset_type must be 'film_script')
 *
 * Returns: { video_id, status }   (video_url backfilled by polling /api/vesper/avatar-video/status)
 */
export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { asset_id } = await req.json();
  const svc = getSupabaseService();

  const { data: asset } = await svc
    .from("vesper_assets")
    .select("*, workspaces(*, brand_kits(*))")
    .eq("id", asset_id)
    .maybeSingle();
  if (!asset || asset.asset_type !== "film_script") {
    return NextResponse.json({ error: "asset must be film_script" }, { status: 400 });
  }

  // Avatar id + voice id are stored on workspace metadata after HeyGen training
  const meta = ((asset as any).workspaces?.metadata as any)?.heygen;
  if (!meta?.avatar_id || !meta?.voice_id) {
    return NextResponse.json({ error: "HeyGen avatar not trained — run training flow first" }, { status: 412 });
  }

  const script = (asset.content as any)?.voiceover_script || (asset.content as any)?.script;
  if (!script) return NextResponse.json({ error: "no script in asset content" }, { status: 400 });

  const result = await createAvatarVideo({
    avatar_id: meta.avatar_id,
    voice_id: meta.voice_id,
    script,
    dimension: { width: 1080, height: 1920 }, // Reels / TikTok vertical
  });

  await svc
    .from("vesper_assets")
    .update({
      content: { ...(asset.content as any), heygen_video_id: result.video_id, heygen_status: "processing" },
    })
    .eq("id", asset_id);

  return NextResponse.json(result);
}
