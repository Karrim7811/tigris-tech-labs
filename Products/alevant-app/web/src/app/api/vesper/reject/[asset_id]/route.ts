import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

export async function POST(req: Request, { params }: { params: Promise<{ asset_id: string }> }) {
  const { asset_id } = await params;
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const svc = getSupabaseService();

  await svc
    .from("vesper_assets")
    .update({
      status: "rejected",
      approval_metadata: {
        rejected_by: user.id,
        rejected_at: new Date().toISOString(),
        reason: body.reason || "agent rejected",
      },
    })
    .eq("id", asset_id);

  return NextResponse.json({ ok: true });
}
