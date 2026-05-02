import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { renderBrochureBuffer } from "@/lib/brochure/render";

export const maxDuration = 60;

/**
 * POST /api/vesper/brochure — render a magazine-tier listing brochure PDF.
 * Body: { listing_id, asset_id? }   (asset_id pulls outline copy from vesper_assets row)
 * Returns: { url } pointing to Supabase Storage object.
 *   OR streams PDF directly when ?inline=1.
 */
export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.listing_id) return NextResponse.json({ error: "listing_id required" }, { status: 400 });

  const svc = getSupabaseService();
  const { data: listing } = await svc
    .from("listings")
    .select("*, workspaces(*, brand_kits(*), brokerages(*))")
    .eq("id", body.listing_id)
    .maybeSingle();
  if (!listing) return NextResponse.json({ error: "listing not found" }, { status: 404 });

  const ws = (listing as any).workspaces;
  const brand = ws?.brand_kits;
  const brokerage_name = ws?.brokerages?.name || "Keller Williams Capital Realty";

  // Pull primary agent for this workspace
  const { data: agent } = await svc
    .from("agents")
    .select("full_name, title, cell_phone, email, headshot_url")
    .eq("workspace_id", ws.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Pull outline from approved/awaiting brochure asset for this listing
  let outline: any = null;
  if (body.asset_id) {
    const { data: asset } = await svc.from("vesper_assets").select("content").eq("id", body.asset_id).maybeSingle();
    outline = asset?.content;
  }
  if (!outline) {
    const { data: asset } = await svc
      .from("vesper_assets")
      .select("content")
      .eq("listing_id", listing.id)
      .eq("asset_type", "brochure")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    outline = asset?.content;
  }
  if (!outline) {
    return NextResponse.json({ error: "no brochure outline — generate Vesper campaign first" }, { status: 400 });
  }

  const photos = ((listing.photos as any[]) || []).map((p) => p.url).filter(Boolean);
  const buffer = await renderBrochureBuffer({
    listing: listing as any,
    brand: brand || {
      primary_color: "#0E5560",
      accent_color: "#B5853E",
      surface_color: "#FAFAF8",
      ink_color: "#1A1915",
      display_font: "Cormorant Garamond",
      body_font: "Jost",
      voice_preset: "insider",
      prohibit_stock: true,
      id: "fallback",
    } as any,
    brokerage_name,
    agent: {
      full_name: agent?.full_name || ws?.name || "Listing Agent",
      title: agent?.title || "Realtor®",
      phone: agent?.cell_phone || "",
      email: agent?.email || "",
      headshot_url: agent?.headshot_url,
    },
    hero_image_url: photos[0],
    gallery_image_urls: photos,
    outline,
  });

  // Upload to Supabase Storage
  const objectKey = `brochures/${ws.id}/${listing.id}-${Date.now()}.pdf`;
  const { error: upErr } = await svc.storage.from("vesper").upload(objectKey, buffer, {
    contentType: "application/pdf",
    cacheControl: "3600",
    upsert: true,
  });
  if (upErr) {
    // Inline fallback when storage bucket missing
    return new NextResponse(buffer, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${listing.address.replace(/[^a-z0-9]+/gi, "-")}.pdf"`,
      },
    });
  }
  const { data: signed } = await svc.storage.from("vesper").createSignedUrl(objectKey, 60 * 60 * 24 * 365);

  // Persist URL on the most-recent brochure asset
  await svc
    .from("vesper_assets")
    .update({ visual_urls: [signed?.signedUrl] })
    .eq("listing_id", listing.id)
    .eq("asset_type", "brochure");

  return NextResponse.json({ url: signed?.signedUrl, key: objectKey });
}
