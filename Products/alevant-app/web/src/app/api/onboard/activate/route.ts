import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

/**
 * POST /api/onboard/activate — finalize the onboarding wizard.
 *
 * Idempotent — UPDATEs existing brand_kit / sofia_config / vesper_config rows
 * if the workspace already has them (the typical case when a workspace was
 * pre-seeded), otherwise INSERTs fresh rows. Always:
 *   - logs compliance acknowledgments (idempotent on type)
 *   - sets workspace_memberships.onboarded_at = now() for this user
 *   - sets workspaces.status = 'active' / activated_at if not already
 *
 * Returns JSON (no redirect) so the client form can router.push("/dashboard").
 */
export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Accept compliance acks from the request body and merge them into onboarding_state[9]
  const body = await req.json().catch(() => ({} as any));
  const ackData = (body?.data && typeof body.data === "object") ? body.data : {};

  const svc = getSupabaseService();

  // Find user's workspace via owner OR membership
  const { data: ownedWs } = await svc
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  let workspaceId = ownedWs?.id as string | undefined;
  if (!workspaceId) {
    const { data: mem } = await svc
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("user_id", user.id)
      .maybeSingle();
    workspaceId = (mem as any)?.workspace_id;
  }
  if (!workspaceId) return NextResponse.json({ error: "workspace not found" }, { status: 404 });

  const { data: ws } = await svc
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!ws) return NextResponse.json({ error: "workspace not found" }, { status: 404 });

  // Merge final-stage data into metadata.onboarding_state["9"]
  const meta = (ws.metadata as Record<string, any>) || {};
  const state = (meta.onboarding_state as Record<string, Record<string, any>>) || {};
  const stage9 = { ...(state["9"] ?? {}), ...ackData };
  state["9"] = stage9;

  // ── Stage data sources ──────────────────────────────────────────────
  const identity = state["1"] ?? {};
  const brokerageData = state["2"] ?? {};
  const brand = state["3"] ?? {};
  const sofia = state["5"] ?? {};
  const vesper = state["8"] ?? {};

  // Helper — derive social_urls JSON from form fields
  const social_urls: Record<string, string> = {};
  if (brand.social_instagram) social_urls.instagram = String(brand.social_instagram);
  if (brand.social_facebook) social_urls.facebook = String(brand.social_facebook);
  if (brand.social_linkedin) social_urls.linkedin = String(brand.social_linkedin);
  if (brand.social_youtube) social_urls.youtube = String(brand.social_youtube);
  if (brand.social_website) social_urls.website = String(brand.social_website);

  // ── 1. brand_kit (UPDATE if linked, else INSERT + link) ─────────────
  let brandKitId = ws.brand_kit_id as string | null;
  const brandPayload = {
    primary_color: brand.primary_color || "#0E5560",
    secondary_color: brand.secondary_color || "#E8DCC4",
    accent_color: brand.accent_color || "#B5853E",
    surface_color: "#FAFAF8",
    ink_color: brand.ink_color || "#1A1915",
    display_font: brand.display_font || "Cormorant Garamond",
    body_font: brand.body_font || "Jost",
    wordmark_text: brand.wordmark_text || ws.name,
    tagline: brand.tagline,
    voice_preset: brand.voice_preset || "insider",
    prohibit_stock: brand.prohibit_stock !== false && brand.prohibit_stock !== "false",
  };
  if (brandKitId) {
    await svc.from("brand_kits").update(brandPayload).eq("id", brandKitId);
  } else {
    const { data: created } = await svc.from("brand_kits").insert(brandPayload).select("id").single();
    brandKitId = created?.id ?? null;
  }

  // ── 2. sofia_config ────────────────────────────────────────────────
  let sofiaCfgId = ws.sofia_config_id as string | null;
  const sofiaPayload = {
    name: sofia.sofia_name || "Sofia",
    voice_id: sofia.voice_id || null,
    languages_enabled: ["en"],
    qualification_threshold: Number(sofia.qualification_threshold) || 70,
    ai_disclosure_enabled: sofia.ai_disclosure !== false && sofia.ai_disclosure !== "false",
    recording_consent_enabled: sofia.recording_consent !== false && sofia.recording_consent !== "false",
  };
  if (sofiaCfgId) {
    await svc.from("sofia_configs").update(sofiaPayload).eq("id", sofiaCfgId);
  } else {
    const { data: created } = await svc.from("sofia_configs").insert(sofiaPayload).select("id").single();
    sofiaCfgId = created?.id ?? null;
  }

  // ── 3. vesper_config ───────────────────────────────────────────────
  let vesperCfgId = ws.vesper_config_id as string | null;
  const channels = Array.isArray(vesper.channels) ? vesper.channels : (vesper.channels ? [vesper.channels] : ["instagram", "facebook", "x", "tiktok", "linkedin", "email"]);
  const vesperPayload = {
    voice_preset: brand.voice_preset || "insider",
    channel_priorities: channels,
    cadence_json: { posts_per_day: Number(vesper.posts_per_day) || 1 },
    approval_mode: vesper.approval_mode || "gated",
    approval_window_minutes: Number(vesper.approval_window) || 240,
    fair_housing_strict: true,
    prohibit_stock: brand.prohibit_stock !== false && brand.prohibit_stock !== "false",
  };
  if (vesperCfgId) {
    await svc.from("vesper_configs").update(vesperPayload).eq("id", vesperCfgId);
  } else {
    const { data: created } = await svc.from("vesper_configs").insert(vesperPayload).select("id").single();
    vesperCfgId = created?.id ?? null;
  }

  // ── 4. brokerage (UPDATE if linked) ────────────────────────────────
  if (ws.brokerage_id) {
    const mlsArr = String(brokerageData.mls_memberships || "")
      .split(",").map((s: string) => s.trim()).filter(Boolean);
    await svc
      .from("brokerages")
      .update({
        name: brokerageData.brokerage_name || undefined,
        address: brokerageData.brokerage_address || undefined,
        phone: brokerageData.brokerage_phone || undefined,
        license_state: brokerageData.license_states || undefined,
        mls_memberships: mlsArr.length ? mlsArr : undefined,
      })
      .eq("id", ws.brokerage_id);
  }

  // ── 5. agent (UPDATE the workspace's agent row from identity) ──────
  const langArr = String(identity.languages || "")
    .split(",").map((s: string) => s.trim()).filter(Boolean)
    .map((l: string) => {
      const lower = l.toLowerCase();
      if (lower.startsWith("en")) return "en";
      if (lower.startsWith("es")) return "es";
      if (lower.startsWith("po") || lower.startsWith("pt")) return "pt";
      if (lower.startsWith("fr")) return "fr";
      if (lower.startsWith("it")) return "it";
      return lower.slice(0, 2);
    });
  const specArr = String(identity.specialties || "")
    .split(",").map((s: string) => s.trim()).filter(Boolean);
  const fullName = `${identity.legal_first_name || ""} ${identity.legal_last_name || ""}`.trim();

  await svc
    .from("agents")
    .update({
      full_name: fullName || undefined,
      preferred_name: identity.preferred_name || undefined,
      title: identity.title || undefined,
      cell_phone: identity.cell_phone || undefined,
      email: identity.email || undefined,
      license_number: brokerageData.license_number || undefined,
      languages: langArr.length ? langArr : undefined,
      specialties: specArr.length ? specArr : undefined,
      awards: identity.awards || undefined,
      bio_text: identity.bio_text || undefined,
    })
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id);

  // ── 6. workspace metadata + status ─────────────────────────────────
  // Persist social_urls within onboarding_state[3] for the microsite to read
  if (Object.keys(social_urls).length > 0) {
    state["3"] = { ...(state["3"] ?? {}), social_urls };
  }
  await svc
    .from("workspaces")
    .update({
      brand_kit_id: brandKitId ?? undefined,
      sofia_config_id: sofiaCfgId ?? undefined,
      vesper_config_id: vesperCfgId ?? undefined,
      status: "active",
      activated_at: ws.activated_at || new Date().toISOString(),
      metadata: { ...meta, onboarding_state: state },
    })
    .eq("id", workspaceId);

  // ── 7. compliance_acknowledgments (idempotent on (workspace,user,type)) ──
  const ackTypes = ["tcpa", "fair_housing", "nar_buyer_broker", "ai_disclosure", "data_ownership"];
  for (const t of ackTypes) {
    if (stage9[`ack_${t}`] === true || stage9[`ack_${t}`] === "on" || stage9[`ack_${t}`] === "true") {
      const { data: existing } = await svc
        .from("compliance_acknowledgments")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .eq("type", t)
        .maybeSingle();
      if (!existing) {
        await svc.from("compliance_acknowledgments").insert({
          workspace_id: workspaceId,
          user_id: user.id,
          type: t,
          version: "1.0",
        });
      }
    }
  }

  // ── 8. workspace_membership.onboarded_at — the gate that lets the user into the dashboard ──
  await svc
    .from("workspace_memberships")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id);

  // ── 9. Sofia provisioning (Twilio + Retell) — fire and forget ──────
  if (process.env.TWILIO_ACCOUNT_SID && process.env.RETELL_API_KEY) {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/sofia/provision`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: req.headers.get("cookie") || "" },
      body: JSON.stringify({ area_code: sofia.area_code || "305" }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, workspace_id: workspaceId });
}
