/**
 * Create Karim's own workspace with sample data — bypasses the onboarding wizard.
 * Idempotent: re-runnable, won't duplicate if it already exists.
 *
 * Usage: tsx --env-file=.env.local scripts/seed-karim-workspace.ts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const TARGET_EMAIL = "karimnasser@me.com";
const SLUG = "karim";

async function main() {
  // Find user
  const { data: { users } } = await sb.auth.admin.listUsers();
  const user = users?.find((u) => u.email === TARGET_EMAIL);
  if (!user) {
    console.error(`User not found: ${TARGET_EMAIL}`);
    process.exit(1);
  }

  // Idempotent — if workspace already exists, skip seed
  const { data: existing } = await sb
    .from("workspaces")
    .select("id")
    .eq("slug", SLUG)
    .maybeSingle();
  if (existing) {
    console.log(`✓ Workspace ${SLUG} already exists (${existing.id}), ensuring membership...`);
    await sb.from("workspaces").update({ owner_user_id: user.id }).eq("id", existing.id);
    await sb
      .from("workspace_memberships")
      .upsert(
        { workspace_id: existing.id, user_id: user.id, role: "owner" },
        { onConflict: "workspace_id,user_id" }
      );
    console.log(`Done. Log in at https://alevant.ai/login`);
    return;
  }

  // Create brokerage
  const { data: brokerage } = await sb
    .from("brokerages")
    .insert({
      name: "Tigris Tech Labs",
      address: "Miami, FL",
      license_state: "FL",
      mls_memberships: ["Miami MLS"],
    })
    .select()
    .single();

  // Brand kit (ALEVANT defaults — they can edit later)
  const { data: kit } = await sb
    .from("brand_kits")
    .insert({
      primary_color: "#3D4F8C",
      accent_color: "#B5853E",
      surface_color: "#FAFAF8",
      ink_color: "#1A1915",
      display_font: "Cormorant Garamond",
      body_font: "Jost",
      wordmark_text: "Karim Nasser",
      tagline: "Real Estate, Elevated.",
      voice_preset: "insider",
      prohibit_stock: true,
    })
    .select()
    .single();

  // Sofia config
  const { data: sofia } = await sb
    .from("sofia_configs")
    .insert({
      name: "Sofia",
      languages_enabled: ["en"],
      qualification_threshold: 70,
      ai_disclosure_enabled: true,
      recording_consent_enabled: true,
    })
    .select()
    .single();

  // Vesper config
  const { data: vesper } = await sb
    .from("vesper_configs")
    .insert({
      voice_preset: "insider",
      channel_priorities: ["instagram", "linkedin", "x", "tiktok"],
      cadence_json: { posts_per_day: 1 },
      approval_mode: "gated",
      fair_housing_strict: true,
      prohibit_stock: true,
    })
    .select()
    .single();

  // Workspace
  const { data: ws } = await sb
    .from("workspaces")
    .insert({
      slug: SLUG,
      name: "Karim Nasser",
      owner_user_id: user.id,
      brokerage_id: brokerage!.id,
      brand_kit_id: kit!.id,
      sofia_config_id: sofia!.id,
      vesper_config_id: vesper!.id,
      plan: "pilot",
      status: "active",
      activated_at: new Date().toISOString(),
    })
    .select()
    .single();

  // Membership
  await sb
    .from("workspace_memberships")
    .insert({ workspace_id: ws!.id, user_id: user.id, role: "owner" });

  // Agent record (so cockpit greets you)
  await sb.from("agents").insert({
    workspace_id: ws!.id,
    user_id: user.id,
    full_name: "Karim Nasser",
    preferred_name: "Karim",
    title: "Founder",
    languages: ["en"],
    specialties: ["Founder"],
    email: TARGET_EMAIL,
  });

  // ── Sample data so the cockpit isn't empty ──
  // 3 sample listings (Miami)
  const listings = [
    { address: "1450 Brickell Bay Dr #2902", city: "Miami", state: "FL", zip: "33131", price: 1675000, property_type: "condo", beds: 2, baths: 2.5, sqft: 1690, year_built: 2008, status: "active", listing_date: new Date(Date.now() - 12 * 86400000).toISOString().split("T")[0], microsite_slug: "1450-brickell-bay-2902", description: "Bay-front 2BR with floor-to-ceiling water views." },
    { address: "330 Sunset Dr", city: "Coral Gables", state: "FL", zip: "33143", price: 1850000, property_type: "sfh", beds: 4, baths: 3, sqft: 2940, year_built: 1962, status: "active", listing_date: new Date(Date.now() - 35 * 86400000).toISOString().split("T")[0], microsite_slug: "330-sunset-dr" },
    { address: "780 NW 12th Ave", city: "Miami", state: "FL", zip: "33136", price: 1190000, property_type: "mf2_4", beds: 8, baths: 4, sqft: 3760, year_built: 1975, status: "active", listing_date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0], microsite_slug: "780-nw-12th-ave" },
  ];
  for (const l of listings) await sb.from("listings").insert({ workspace_id: ws!.id, ...l });

  // Sample contacts
  const contacts = [
    { full_name: "Carlos Mendes", emails: ["cmendes@example.com"], phones: ["+5511987654321"], category: "lead", relationship_score: 88, source: "sofia_voice", language: "pt", last_touch_at: new Date(Date.now() - 3 * 3600000).toISOString() },
    { full_name: "Andrea Castillo", emails: ["andrea@example.com"], phones: ["+13055551001"], category: "lead", relationship_score: 76, source: "ig_dm", language: "es", last_touch_at: new Date(Date.now() - 86400000 * 2).toISOString() },
    { full_name: "Marcus Webb", emails: ["mwebb@example.com"], phones: ["+13055551002"], category: "lead", relationship_score: 62, source: "web_form", language: "en", last_touch_at: new Date(Date.now() - 86400000 * 9).toISOString() },
    { full_name: "Maria Delgado", emails: ["maria@example.com"], category: "past_client", relationship_score: 90, source: "manual", language: "en", last_touch_at: new Date(Date.now() - 86400000 * 28).toISOString() },
    { full_name: "Renato Torres", emails: ["renato@example.com"], category: "active_client", relationship_score: 85, source: "manual", language: "pt", last_touch_at: new Date(Date.now() - 86400000 * 4).toISOString() },
  ];
  for (const c of contacts) await sb.from("contacts").insert({ workspace_id: ws!.id, ...c });

  // Grid farm zone
  await sb.from("grid_farm_zones").insert({
    workspace_id: ws!.id,
    zone_label: "Brickell + South of Fifth",
    zip_codes: ["33131", "33132", "33134", "33139", "33141", "33143"],
    city: "Miami",
    state: "FL",
    weekly_lead_quota: 50,
  });

  // 3 sample Grid signals
  const grid = [
    { property_address: "1287 SW 12th Ave", property_city: "Miami", property_zip: "33135", motivation_score: 92, tenure_score: 90, equity_score: 84, distress_score: 0, life_event_score: 65, market_score: 80, years_owned: 18, estimated_value: 720000, estimated_equity: 605000, is_probate: true, long_tenure_flag: true, reasons_summary: "18-year tenure · est. equity 84% · probate filing 11 days ago.", reasons: ["18 years owned", "Estimated equity 84%", "Probate filing 11 days ago"] },
    { property_address: "560 NW 33rd St", property_city: "Miami", property_zip: "33127", motivation_score: 88, tenure_score: 65, equity_score: 71, distress_score: 70, life_event_score: 0, market_score: 85, years_owned: 14, estimated_value: 845000, estimated_equity: 600000, is_pre_foreclosure: true, is_absentee_owner: true, long_tenure_flag: true, reasons_summary: "14-year tenure · pre-foreclosure NOD · absentee owner.", reasons: ["14 years owned", "Pre-foreclosure NOD filed", "Absentee owner"] },
    { property_address: "1100 Alhambra Cir", property_city: "Coral Gables", property_zip: "33134", motivation_score: 73, tenure_score: 90, equity_score: 78, distress_score: 60, life_event_score: 0, market_score: 75, years_owned: 16, estimated_value: 1890000, estimated_equity: 1474000, is_tax_delinquent: true, has_code_violations: true, long_tenure_flag: true, reasons_summary: "16-year tenure · tax delinquent · code violation cleared 30 days ago.", reasons: ["16 years owned", "Tax delinquent 6 mo", "Code violation"] },
  ];
  for (const g of grid) await sb.from("grid_signals").insert({ workspace_id: ws!.id, property_state: "FL", ...g });

  // 1 active transaction with risk flag
  await sb.from("transactions").insert({
    workspace_id: ws!.id,
    side: "buyer",
    property_address: "448 Coconut Grove Dr",
    contract_date: new Date(Date.now() - 21 * 86400000).toISOString().split("T")[0],
    expected_close: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
    contract_price: 925000,
    status: "active",
    risk_flags: [
      { type: "lender_silence", severity: "high", reason: "5 days no lender response", suggested_action: "Call lender today" },
    ],
  });

  console.log("✓ Karim's workspace seeded.");
  console.log(`  Workspace: ${ws!.id}`);
  console.log(`  Owner: ${user.email}`);
  console.log(`  Subdomain: karim.alevant.ai`);
  console.log(`\nLog in at https://alevant.ai/login`);
  console.log("Cockpit will show: 3 listings, 5 contacts (3 leads, 1 past client, 1 active client), 3 Grid signals, 1 active transaction with risk flag.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
