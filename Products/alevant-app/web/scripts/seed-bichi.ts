/**
 * Seed Bichi tenant workspace with sample data.
 *
 * Usage: pnpm tsx scripts/seed-bichi.ts
 * Requires: SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in .env
 */

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  console.log("Seeding Bichi workspace…");

  // 1. Brokerage
  const { data: brokerage } = await sb
    .from("brokerages")
    .insert({
      name: "Keller Williams Capital Realty",
      address: "550 Biltmore Way #PH2, Coral Gables, FL 33134",
      phone: "(305) 442-7900",
      license_state: "FL",
      mls_memberships: ["Miami MLS"],
    })
    .select()
    .single();

  // 2. Brand kit
  const { data: kit } = await sb
    .from("brand_kits")
    .insert({
      primary_color: "#0E5560",
      secondary_color: "#E8DCC4",
      accent_color: "#B5853E",
      surface_color: "#FAFAF8",
      ink_color: "#1A1915",
      display_font: "Cormorant Garamond",
      body_font: "Jost",
      wordmark_text: "Bichi",
      tagline: "Invest Miami. Live Miami.",
      voice_preset: "insider",
      prohibit_stock: true,
    })
    .select()
    .single();

  // 3. Sofia config
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

  // 4. Vesper config
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

  // 5. Workspace
  const { data: ws } = await sb
    .from("workspaces")
    .insert({
      slug: "bichi",
      name: "Bichi",
      brokerage_id: brokerage!.id,
      brand_kit_id: kit!.id,
      sofia_config_id: sofia!.id,
      vesper_config_id: vesper!.id,
      plan: "pilot",
      status: "active",
      custom_domain: "bichi.miami",
      activated_at: new Date().toISOString(),
    })
    .select()
    .single();

  // 6. Agent
  await sb.from("agents").insert({
    workspace_id: ws!.id,
    full_name: "Thomas Bichi",
    preferred_name: "Thomas",
    title: "Realtor® / Team Lead",
    cell_phone: "(305) 608-6357",
    languages: ["en", "es", "pt"],
    specialties: ["Residential", "Investor", "Multifamily", "Pre-Construction", "Foreign Buyers", "1031"],
    bio_text:
      "Thomas Bichi has been a top-producing Keller Williams agent since 2016, specializing in the Miami Beach SoFi market with a particular focus on international and investor clientele.",
  });

  // 7. Sample listings
  const sampleListings = [
    { address: "2150 Ocean Drive #PH4", city: "Miami Beach", state: "FL", zip: "33139", price: 1395000, property_type: "condo", beds: 2, baths: 2, sqft: 1480, year_built: 2008, status: "active", microsite_slug: "2150-ocean-drive-ph4", description: "Penthouse overlooking the Atlantic. Two bedrooms, two and a half baths, private rooftop terrace." },
    { address: "1287 Coral Way", city: "Coral Gables", state: "FL", zip: "33134", price: 1850000, property_type: "sfh", beds: 4, baths: 3, sqft: 2940, year_built: 1962, status: "active", microsite_slug: "1287-coral-way" },
    { address: "780 NW 12th Ave", city: "Miami", state: "FL", zip: "33136", price: 1190000, property_type: "mf2_4", beds: 8, baths: 4, sqft: 3760, year_built: 1975, status: "active", microsite_slug: "780-nw-12th-ave" },
  ];
  for (const l of sampleListings) {
    await sb.from("listings").insert({ workspace_id: ws!.id, ...l });
  }

  // 8. Grid farm zones (Bichi farms)
  await sb.from("grid_farm_zones").insert({
    workspace_id: ws!.id,
    zone_label: "Brickell + South of Fifth",
    zip_codes: ["33131", "33132", "33134", "33139", "33141", "33143"],
    city: "Miami",
    state: "FL",
    weekly_lead_quota: 50,
  });

  // 9. Sample grid signals (the Predictive Seller Engine output)
  const gridSamples = [
    { property_address: "1287 SW 12th Ave", property_city: "Miami", property_zip: "33135", motivation_score: 92, tenure_score: 90, equity_score: 84, distress_score: 0, life_event_score: 65, market_score: 80, years_owned: 18, estimated_value: 720000, estimated_equity: 605000, is_probate: true, long_tenure_flag: true, reasons_summary: "18-year tenure · est. equity 84% · probate filing 11 days ago.", reasons: ["18 years owned (long-tenure signal)", "Estimated equity 84%", "Probate filing 11 days ago"] },
    { property_address: "560 NW 33rd St", property_city: "Miami", property_zip: "33127", motivation_score: 88, tenure_score: 65, equity_score: 71, distress_score: 70, life_event_score: 0, market_score: 85, years_owned: 14, estimated_value: 845000, estimated_equity: 600000, is_pre_foreclosure: true, is_absentee_owner: true, long_tenure_flag: true, reasons_summary: "14-year tenure · pre-foreclosure NOD · absentee owner.", reasons: ["14 years owned", "Pre-foreclosure NOD filed", "Absentee owner (out of state)"] },
    { property_address: "330 Sunset Dr", property_city: "Coral Gables", property_zip: "33143", motivation_score: 85, tenure_score: 90, equity_score: 92, distress_score: 0, life_event_score: 25, market_score: 75, years_owned: 22, estimated_value: 1450000, estimated_equity: 1334000, is_senior_owner: true, long_tenure_flag: true, reasons_summary: "22-year tenure · senior owner · est. equity 92%.", reasons: ["22 years owned", "Senior-owner age signal", "Est. equity 92%"] },
  ];
  for (const g of gridSamples) {
    await sb.from("grid_signals").insert({ workspace_id: ws!.id, property_state: "FL", ...g });
  }

  console.log("✓ Bichi workspace seeded.");
  console.log(`  Workspace ID: ${ws!.id}`);
  console.log(`  Custom domain: bichi.miami`);
  console.log(`  Subdomain: bichi.alevant.ai`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
