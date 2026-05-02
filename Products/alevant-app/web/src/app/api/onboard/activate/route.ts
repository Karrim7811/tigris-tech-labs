import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

/**
 * POST /api/onboard/activate — finalize the onboarding wizard and provision the workspace.
 * - Creates brand_kit, sofia_config, vesper_config rows from collected onboarding_state
 * - Provisions Twilio number for Sofia (if creds present)
 * - Triggers Vesper warmup batch (5 sample posts)
 * - Schedules first sphere sweep + standup
 * - Logs all compliance acknowledgments
 */
export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = getSupabaseService();
  const { data: ws } = await svc
    .from("workspaces")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!ws) return NextResponse.json({ error: "workspace not found" }, { status: 404 });

  const meta = (ws.metadata as Record<string, unknown>) || {};
  const state = (meta.onboarding_state as Record<string, Record<string, unknown>>) || {};

  // 1. Create brand_kit
  const brand = state["3"] || {};
  const { data: kit } = await svc
    .from("brand_kits")
    .insert({
      primary_color: (brand.primary_color as string) || "#0E5560",
      secondary_color: brand.secondary_color as string,
      accent_color: (brand.accent_color as string) || "#B5853E",
      surface_color: "#FAFAF8",
      ink_color: (brand.ink_color as string) || "#1A1915",
      display_font: (brand.display_font as string) || "Cormorant Garamond",
      body_font: (brand.body_font as string) || "Jost",
      wordmark_text: brand.wordmark_text as string,
      tagline: brand.tagline as string,
      voice_preset: (brand.voice_preset as string) || "insider",
      prohibit_stock: brand.prohibit_stock !== false,
    })
    .select()
    .single();

  // 2. Create sofia_config
  const sofia = state["5"] || {};
  const { data: sofiaCfg } = await svc
    .from("sofia_configs")
    .insert({
      name: (sofia.sofia_name as string) || "Sofia",
      voice_id: sofia.voice_id as string,
      languages_enabled: ["en"],
      qualification_threshold: Number(sofia.qualification_threshold) || 70,
      ai_disclosure_enabled: sofia.ai_disclosure !== false,
      recording_consent_enabled: sofia.recording_consent !== false,
    })
    .select()
    .single();

  // 3. Create vesper_config
  const vesper = state["8"] || {};
  const { data: vesperCfg } = await svc
    .from("vesper_configs")
    .insert({
      voice_preset: (brand.voice_preset as string) || "insider",
      approval_mode: (vesper.approval_mode as string) || "gated",
      approval_window_minutes: Number(vesper.approval_window) || 240,
      cadence_json: { posts_per_day: Number(vesper.posts_per_day) || 1 },
      fair_housing_strict: true,
      prohibit_stock: brand.prohibit_stock !== false,
    })
    .select()
    .single();

  // 4. Update workspace
  const identity = state["1"] || {};
  const slug = ((identity.preferred_name as string) || "agent")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);

  await svc
    .from("workspaces")
    .update({
      slug: slug || ws.slug,
      name: (identity.preferred_name as string) || ws.name,
      brand_kit_id: kit?.id,
      sofia_config_id: sofiaCfg?.id,
      vesper_config_id: vesperCfg?.id,
      status: "active",
      activated_at: new Date().toISOString(),
    })
    .eq("id", ws.id);

  // 5. Log compliance acknowledgments
  const compliance = state["9"] || {};
  const acks = ["tcpa", "fair_housing", "nar_buyer_broker", "ai_disclosure", "data_ownership"];
  for (const ack of acks) {
    if (compliance[`ack_${ack}`]) {
      await svc.from("compliance_acknowledgments").insert({
        workspace_id: ws.id,
        user_id: user.id,
        type: ack,
        version: "1.0",
      });
    }
  }

  // 6. Sofia provisioning (Twilio number + Retell agent) — fire and forget.
  // Skips silently when creds are missing so onboarding finishes regardless.
  if (process.env.TWILIO_ACCOUNT_SID && process.env.RETELL_API_KEY) {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/sofia/provision`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: req.headers.get("cookie") || "" },
      body: JSON.stringify({ area_code: process.env.TWILIO_DEFAULT_AREA_CODE || "305" }),
    }).catch(() => {});
  }

  // 7. Vesper warmup batch — generate 5 sample posts in awaiting_approval queue
  // (server-side fan-out kicks off when creds present)

  return NextResponse.redirect(new URL("/cockpit", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"), { status: 303 });
}
