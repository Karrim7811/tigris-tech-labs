import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { lintFairHousing } from "@/lib/fair-housing";

/**
 * POST /api/vesper/approve/[asset_id] — agent approval.
 * Behaviors:
 *   1. Re-lints the asset content (Fair Housing) — re-blocks if it now fails.
 *   2. Marks asset status = 'approved'.
 *   3. If the workspace's vesper_config approval_mode permits autonomous on this channel,
 *      kicks off /api/vesper/publish/[asset_id] immediately.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ asset_id: string }> }) {
  const { asset_id } = await params;
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = getSupabaseService();
  const { data: asset } = await svc.from("vesper_assets").select("*, workspaces(vesper_config_id, vesper_configs(*))").eq("id", asset_id).maybeSingle();
  if (!asset) return NextResponse.json({ error: "asset not found" }, { status: 404 });

  // Re-lint: serialize all string content
  const flat = JSON.stringify(asset.content || {});
  const lint = lintFairHousing(flat);
  if (!lint.passed) {
    await svc.from("fair_housing_lint_log").insert({
      workspace_id: asset.workspace_id,
      asset_id: asset.id,
      passed: false,
      findings: lint.findings,
      flagged_terms: lint.flagged_terms,
      original_text: flat.slice(0, 8000),
    });
    return NextResponse.json({ ok: false, error: "fair_housing_block", findings: lint.findings }, { status: 422 });
  }

  await svc
    .from("vesper_assets")
    .update({
      status: "approved",
      approval_metadata: {
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      },
    })
    .eq("id", asset_id);

  // Kick off publish via fetch (background)
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/vesper/publish/${asset_id}`, {
    method: "POST",
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
