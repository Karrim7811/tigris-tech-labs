// HeyGen avatar wrapper.
// Docs: https://docs.heygen.com/reference/

const HEYGEN_BASE = "https://api.heygen.com/v2";

function authHeaders() {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) throw new Error("HEYGEN_API_KEY missing");
  return { "X-Api-Key": key, "content-type": "application/json" };
}

export interface AvatarVideoOptions {
  avatar_id: string;       // workspace's trained avatar
  voice_id: string;
  script: string;
  background_url?: string;
  dimension?: { width: number; height: number };
}

export async function createAvatarVideo(opts: AvatarVideoOptions): Promise<{ video_id: string }> {
  const r = await fetch(`${HEYGEN_BASE}/video/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      video_inputs: [
        {
          character: { type: "avatar", avatar_id: opts.avatar_id, avatar_style: "normal" },
          voice: { type: "text", input_text: opts.script, voice_id: opts.voice_id },
          background: opts.background_url ? { type: "image", url: opts.background_url } : { type: "color", value: "#FAFAF8" },
        },
      ],
      dimension: opts.dimension || { width: 1080, height: 1920 },
    }),
  });
  if (!r.ok) throw new Error(`HeyGen generate failed: ${r.status} ${await r.text()}`);
  const json = (await r.json()) as { data: { video_id: string } };
  return { video_id: json.data.video_id };
}

export async function getVideoStatus(videoId: string): Promise<{ status: "processing" | "completed" | "failed"; video_url?: string }> {
  const r = await fetch(`${HEYGEN_BASE}/video_status.get?video_id=${videoId}`, {
    headers: { "X-Api-Key": process.env.HEYGEN_API_KEY! },
  });
  if (!r.ok) throw new Error(`HeyGen status failed: ${r.status}`);
  const json = (await r.json()) as { data: { status: string; video_url?: string } };
  return { status: json.data.status as any, video_url: json.data.video_url };
}
