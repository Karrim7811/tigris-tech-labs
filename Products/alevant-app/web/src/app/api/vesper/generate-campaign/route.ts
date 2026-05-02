import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { runClaudeJSON } from "@/lib/anthropic";
import { vesperSystemPrompt, VESPER_LISTING_CAMPAIGN_USER } from "@/lib/prompts/vesper";
import { lintFairHousing } from "@/lib/fair-housing";
import type { VoicePreset } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.listing_id) return NextResponse.json({ error: "listing_id required" }, { status: 400 });

  const svc = getSupabaseService();
  const { data: listing } = await svc
    .from("listings")
    .select("*, workspaces(*, brand_kits(*), vesper_configs(*), brokerages(*))")
    .eq("id", body.listing_id)
    .maybeSingle();
  if (!listing) return NextResponse.json({ error: "listing not found" }, { status: 404 });

  const ws = (listing as any).workspaces;
  const kit = ws?.brand_kits;
  const brokerage = ws?.brokerages?.name || "your brokerage";

  // Create campaign row
  const { data: campaign } = await svc
    .from("vesper_campaigns")
    .insert({
      workspace_id: ws.id,
      listing_id: listing.id,
      campaign_type: "per_listing",
      status: "generating",
    })
    .select()
    .single();

  // Generate
  const generated = await runClaudeJSON<Record<string, any>>({
    tier: "creative",
    system: vesperSystemPrompt({
      agentName: ws?.name || "the agent",
      brokerage,
      market: `${listing.city || ""}, ${listing.state || "FL"}`,
      voicePreset: (kit?.voice_preset as VoicePreset) || "insider",
      brandTagline: kit?.tagline,
      prohibitStock: kit?.prohibit_stock !== false,
      fairHousingStrict: ws?.vesper_configs?.fair_housing_strict !== false,
    }),
    user: VESPER_LISTING_CAMPAIGN_USER({
      address: listing.address,
      city: listing.city || "",
      state: listing.state || "FL",
      price: Number(listing.price) || 0,
      beds: Number(listing.beds) || 0,
      baths: Number(listing.baths) || 0,
      sqft: Number(listing.sqft) || 0,
      property_type: listing.property_type || "condo",
      description: listing.description,
    }),
    maxTokens: 6000,
  });

  // Fair Housing lint everything
  const allCopy = [
    generated.mls_description,
    generated.microsite?.hero_copy,
    ...(generated.microsite?.narrative_paragraphs || []),
    generated.sphere_email?.subject,
    generated.sphere_email?.body_html,
    generated.buyer_match_message,
    generated.open_house_invite?.headline,
    generated.open_house_invite?.body,
    generated.whisper_preview?.subject,
    generated.whisper_preview?.body,
    generated.press_pitch?.pitch_text,
  ].filter(Boolean).join("\n\n");
  const lint = lintFairHousing(allCopy);
  await svc.from("fair_housing_lint_log").insert({
    workspace_id: ws.id,
    passed: lint.passed,
    findings: lint.findings,
    original_text: allCopy.slice(0, 8000),
    flagged_terms: lint.flagged_terms,
  });

  // Persist as 12 vesper_assets rows, all in awaiting_approval
  const assetTypes = [
    "film_script", "photo_brief", "microsite", "brochure", "social_post:instagram",
    "social_post:x", "social_post:tiktok", "social_post:linkedin",
    "mls_description", "email_blast:sphere", "open_house_invite",
    "whisper_preview", "press_pitch",
  ];

  for (const type of assetTypes) {
    const [asset_type, channel] = type.includes(":") ? type.split(":") : [type, undefined];
    let content: any = null;
    switch (asset_type) {
      case "film_script": content = generated.film_script; break;
      case "photo_brief": content = generated.photo_brief; break;
      case "microsite": content = generated.microsite; break;
      case "brochure": content = generated.brochure_outline; break;
      case "social_post":
        if (channel) content = generated.social_campaign?.[channel];
        break;
      case "mls_description": content = { text: generated.mls_description }; break;
      case "email_blast": content = generated.sphere_email; break;
      case "open_house_invite": content = generated.open_house_invite; break;
      case "whisper_preview": content = generated.whisper_preview; break;
      case "press_pitch": content = generated.press_pitch; break;
    }
    if (!content) continue;
    await svc.from("vesper_assets").insert({
      workspace_id: ws.id,
      listing_id: listing.id,
      campaign_id: campaign?.id,
      asset_type,
      channel,
      content,
      status: "awaiting_approval",
      fair_housing_lint_passed: lint.passed,
    });
  }

  // Update listing
  await svc
    .from("listings")
    .update({ vesper_campaign_status: "awaiting_approval" })
    .eq("id", listing.id);

  await svc
    .from("vesper_campaigns")
    .update({ status: "ready_for_review", asset_count: assetTypes.length })
    .eq("id", campaign!.id);

  return NextResponse.json({ campaign_id: campaign?.id, lint_passed: lint.passed });
}
