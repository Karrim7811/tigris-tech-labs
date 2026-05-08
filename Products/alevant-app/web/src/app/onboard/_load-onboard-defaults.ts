import { redirect } from "next/navigation";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

/**
 * Server-side loader: builds default values for every onboarding stage by
 * reading the user's workspace + native config tables (agents, brokerages,
 * brand_kits, sofia_configs, vesper_configs) PLUS any prior progress saved
 * into workspaces.metadata.onboarding_state.
 *
 * Returns a record keyed by stage number (1..9). Stage values use the same
 * field names as the form `<input name="...">` attributes.
 */
export interface OnboardContext {
  userId: string;
  workspaceId: string;
  defaults: Record<number, Record<string, any>>;
  counts: { listings: number; buyers: number; rentals: number; investorDeals: number; transactions: number; contacts: number };
  connections: Record<string, { connected: boolean; queued: boolean }>;
  acks: Record<string, boolean>;
}

export async function loadOnboardContext(): Promise<OnboardContext> {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const svc = getSupabaseService();

  // Resolve the user's workspace (owner first, then membership)
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
  if (!workspaceId) {
    // First-time user with no workspace — let the existing /api/onboard/save
    // logic create a placeholder. Return blank defaults.
    return {
      userId: user.id,
      workspaceId: "",
      defaults: {},
      counts: { listings: 0, buyers: 0, rentals: 0, investorDeals: 0, transactions: 0, contacts: 0 },
      connections: {},
      acks: {},
    };
  }

  // Load every native row + counts + saved metadata in parallel
  const [
    { data: ws },
    { data: agent },
    { count: listingsCount },
    { count: buyersCount },
    { count: rentalsCount },
    { count: investorCount },
    { count: txCount },
    { count: contactsCount },
    { data: ackRows },
  ] = await Promise.all([
    svc
      .from("workspaces")
      .select("id, slug, name, brokerage_id, brand_kit_id, sofia_config_id, vesper_config_id, status, metadata, brokerage:brokerages(*), brand_kit:brand_kits(*), sofia_config:sofia_configs(*), vesper_config:vesper_configs(*)")
      .eq("id", workspaceId)
      .maybeSingle(),
    svc.from("agents").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: true }).limit(1).maybeSingle(),
    svc.from("listings").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "active"),
    svc.from("buyers").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    svc.from("rentals").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    svc.from("investor_deals").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    svc.from("transactions").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "active"),
    svc.from("contacts").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    svc.from("compliance_acknowledgments").select("type").eq("workspace_id", workspaceId).eq("user_id", user.id),
  ]);

  const meta = ((ws as any)?.metadata as Record<string, any>) || {};
  const state = (meta.onboarding_state as Record<string, Record<string, any>>) || {};
  const brokerage = (ws as any)?.brokerage;
  const brand = (ws as any)?.brand_kit;
  const sofia = (ws as any)?.sofia_config;
  const vesper = (ws as any)?.vesper_config;

  const fullName = (agent?.full_name as string) || "";
  const [first, ...rest] = fullName.split(" ");
  const last = rest.join(" ");

  const acksMap: Record<string, boolean> = {};
  (ackRows ?? []).forEach((r: any) => { acksMap[r.type] = true; });

  // Connection state lives in onboarding_state[4] as { gmail: { queued: true/connected: true }, ... }
  const connState = (state["4"]?.connections as Record<string, any>) || {};

  return {
    userId: user.id,
    workspaceId: workspaceId!,
    counts: {
      listings: listingsCount ?? 0,
      buyers: buyersCount ?? 0,
      rentals: rentalsCount ?? 0,
      investorDeals: investorCount ?? 0,
      transactions: txCount ?? 0,
      contacts: contactsCount ?? 0,
    },
    connections: connState,
    acks: acksMap,
    defaults: {
      1: {
        legal_first_name: state["1"]?.legal_first_name ?? first ?? "",
        legal_last_name: state["1"]?.legal_last_name ?? last ?? "",
        preferred_name: state["1"]?.preferred_name ?? agent?.preferred_name ?? "",
        title: state["1"]?.title ?? agent?.title ?? "",
        cell_phone: state["1"]?.cell_phone ?? agent?.cell_phone ?? "",
        year_started: state["1"]?.year_started ?? "",
        specialties: state["1"]?.specialties ?? (agent?.specialties as string[] | null)?.join(", ") ?? "",
        languages: state["1"]?.languages ?? mapLanguageCodes(agent?.languages),
        awards: state["1"]?.awards ?? agent?.awards ?? "",
        bio_text: state["1"]?.bio_text ?? agent?.bio_text ?? "",
        email: state["1"]?.email ?? agent?.email ?? "",
      },
      2: {
        brokerage_name: state["2"]?.brokerage_name ?? brokerage?.name ?? "",
        brokerage_phone: state["2"]?.brokerage_phone ?? brokerage?.phone ?? "",
        brokerage_address: state["2"]?.brokerage_address ?? brokerage?.address ?? "",
        license_number: state["2"]?.license_number ?? agent?.license_number ?? "",
        license_states: state["2"]?.license_states ?? brokerage?.license_state ?? "",
        mls_memberships: state["2"]?.mls_memberships ?? (brokerage?.mls_memberships as string[] | null)?.join(", ") ?? "",
        team_name: state["2"]?.team_name ?? "",
        team_phone: state["2"]?.team_phone ?? "",
        compliance_email: state["2"]?.compliance_email ?? "",
        kw_command_username: state["2"]?.kw_command_username ?? "",
      },
      3: {
        wordmark_text: state["3"]?.wordmark_text ?? brand?.wordmark_text ?? "",
        tagline: state["3"]?.tagline ?? brand?.tagline ?? "",
        primary_color: state["3"]?.primary_color ?? brand?.primary_color ?? "#0E5560",
        secondary_color: state["3"]?.secondary_color ?? brand?.secondary_color ?? "#E8DCC4",
        accent_color: state["3"]?.accent_color ?? brand?.accent_color ?? "#B5853E",
        ink_color: state["3"]?.ink_color ?? brand?.ink_color ?? "#1A1915",
        display_font: state["3"]?.display_font ?? brand?.display_font ?? "Cormorant Garamond",
        body_font: state["3"]?.body_font ?? brand?.body_font ?? "Jost",
        voice_preset: state["3"]?.voice_preset ?? brand?.voice_preset ?? "insider",
        prohibit_stock: state["3"]?.prohibit_stock ?? brand?.prohibit_stock ?? true,
        heygen_consent: state["3"]?.heygen_consent ?? false,
        social_video_urls: state["3"]?.social_video_urls ?? "",
        social_instagram: state["3"]?.social_urls?.instagram ?? "",
        social_facebook: state["3"]?.social_urls?.facebook ?? "",
        social_youtube: state["3"]?.social_urls?.youtube ?? "",
        social_linkedin: state["3"]?.social_urls?.linkedin ?? "",
        social_website: state["3"]?.social_urls?.website ?? "",
      },
      5: {
        sofia_name: state["5"]?.sofia_name ?? sofia?.name ?? "Sofia",
        languages: state["5"]?.languages ?? mapLanguageCodes(sofia?.languages_enabled) ?? "English",
        live_hours: state["5"]?.live_hours ?? "Mon–Sat 8:30am – 6:00pm",
        qualification_threshold: state["5"]?.qualification_threshold ?? sofia?.qualification_threshold ?? 70,
        voice_id: state["5"]?.voice_id ?? sofia?.voice_id ?? "warm-authority-en",
        area_code: state["5"]?.area_code ?? "305",
        ai_disclosure: state["5"]?.ai_disclosure ?? sofia?.ai_disclosure_enabled ?? true,
        recording_consent: state["5"]?.recording_consent ?? sofia?.recording_consent_enabled ?? true,
      },
      6: {
        ...(state["6"] ?? {}),
      },
      7: {
        listings_count: state["7"]?.listings_count ?? listingsCount ?? 0,
        buyers_count: state["7"]?.buyers_count ?? buyersCount ?? 0,
        rentals_count: state["7"]?.rentals_count ?? rentalsCount ?? 0,
        investor_deals_count: state["7"]?.investor_deals_count ?? investorCount ?? 0,
        listing_url: state["7"]?.listing_url ?? "",
        grid_zips: state["7"]?.grid_zips ?? "33131, 33132, 33134, 33139, 33141",
      },
      8: {
        approval_mode: state["8"]?.approval_mode ?? vesper?.approval_mode ?? "gated",
        posts_per_day: state["8"]?.posts_per_day ?? vesper?.cadence_json?.posts_per_day ?? 1,
        approval_window: state["8"]?.approval_window ?? vesper?.approval_window_minutes ?? 240,
        channels: state["8"]?.channels ?? vesper?.channel_priorities ?? ["instagram", "facebook", "x", "tiktok", "linkedin", "email"],
        fair_housing_strict: state["8"]?.fair_housing_strict ?? vesper?.fair_housing_strict ?? true,
        auto_campaign_trigger: state["8"]?.auto_campaign_trigger ?? true,
      },
      9: {
        // Compliance — never prefilled. The user must affirmatively check each box.
      },
    },
  };
}

function mapLanguageCodes(codes: string[] | null | undefined): string {
  if (!codes || codes.length === 0) return "";
  const map: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", fr: "French", it: "Italian", de: "German", ru: "Russian", zh: "Chinese" };
  return codes.map((c) => map[c] ?? c).join(", ");
}
