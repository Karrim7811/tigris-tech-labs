/**
 * FirstService Residential — Miami / South FL portfolio snapshot for the
 * May 6, 2026 briefing. Data model mirrors Praix-v3's PropertyMap so the
 * underlying schema (CAT zones, year built) matches what property managers
 * see in Praix. TIV figures are estimates — verify before May 6.
 *
 * Risk model: each building scored Tier 1 / 2 / 3 across 8 dimensions:
 *   1. Named windstorm        5. Wind-driven rain & debris
 *   2. Storm surge            6. Construction defect / age cohort
 *   3. Flood zone (FEMA)      7. Loss-frequency (water / GL claim density)
 *   4. Sea-level rise         8. Distance from body of water
 *
 * Tier 1 = critical exposure | Tier 2 = elevated, manageable | Tier 3 = low
 */

export type RiskTier = 1 | 2 | 3;

export interface BuildingRisk {
  named_windstorm: RiskTier;
  storm_surge: RiskTier;
  flood_zone: RiskTier;
  sea_level_rise: RiskTier;
  wind_driven_rain: RiskTier;
  construction_defect: RiskTier;
  loss_frequency: RiskTier;
  /** Approx meters from the nearest body of water (Atlantic / Biscayne Bay). */
  distance_to_water_m: number;
  distance_to_water_tier: RiskTier;
  /** Computed overall tier (lowest number wins — i.e., max severity). */
  overall_tier: RiskTier;
}

export interface BuildingIllustrationConfig {
  /** Number of stories — drives height. */
  stories: number;
  /** Visual width of the silhouette. */
  width: "narrow" | "regular" | "wide";
  /** Top treatment of the tower. */
  crown: "flat" | "tapered" | "curved" | "stepped" | "mast";
  /** Primary body color. */
  baseColor: string;
  /** Glass / window strip color. */
  glassColor: string;
  /** Optional accent (vertical stripe, crown highlight). */
  accentColor?: string;
  /** Window pattern. */
  windowPattern: "strips" | "grid" | "ribbons";
  /** Optional human-readable detail to show in the detail card. */
  signature?: string;
}

export interface Building {
  id: string;
  location_name: string;
  manager_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  year_built: number;
  units: number;
  area_sqft: number;
  asset_class: string;
  named_windstorm_zone: string;
  wind_hail_zone: string;
  earthquake_zone: string;
  flood_zone: string;
  /** Optional photo path under /public — used in the detail view stage. */
  photo?: string;
  risk: BuildingRisk;
  illustration: BuildingIllustrationConfig;
}

/* ── Risk dimension labels (used in the detail view) ── */

export const RISK_DIMENSIONS = [
  {
    key: "named_windstorm",
    label: "Named windstorm",
    sub: "Hurricane wind exposure",
  },
  {
    key: "storm_surge",
    label: "Storm surge",
    sub: "Cat-3-and-up inundation",
  },
  {
    key: "flood_zone",
    label: "Flood zone",
    sub: "FEMA designation",
  },
  {
    key: "sea_level_rise",
    label: "Sea-level rise",
    sub: "NOAA 2050 exposure",
  },
  {
    key: "wind_driven_rain",
    label: "Wind-driven rain & debris",
    sub: "Glazing & opening exposure",
  },
  {
    key: "construction_defect",
    label: "Construction defect",
    sub: "Year-built × FL silica/concrete cohort",
  },
  {
    key: "loss_frequency",
    label: "Loss frequency",
    sub: "Water & GL claim density",
  },
  {
    key: "distance_to_water_tier",
    label: "Proximity to water",
    sub: "Distance to ocean / bay",
  },
] as const;

export type RiskDimensionKey = (typeof RISK_DIMENSIONS)[number]["key"];

/* ── Tier styling ── */

export const TIER_COLORS: Record<RiskTier, string> = {
  1: "#EB0017", // Aon red — critical
  2: "#F59E0B", // Amber — elevated
  3: "#27AE60", // Green — managed / lower
};

export const TIER_LABELS: Record<RiskTier, string> = {
  1: "Tier 1",
  2: "Tier 2",
  3: "Tier 3",
};

export const TIER_DESCRIPTIONS: Record<RiskTier, string> = {
  1: "Critical exposure",
  2: "Elevated, manageable",
  3: "Lower / well-controlled",
};

export function getRiskTier(p: Building): RiskTier {
  return p.risk.overall_tier;
}

/* ── Portfolio ── */

export const portfolio: Building[] = [
  {
    id: "one-ocean",
    location_name: "One Ocean",
    manager_name: "John Porter",
    address: "1 Collins Ave",
    city: "Miami Beach",
    state: "FL",
    zip: "33139",
    lat: 25.7682,
    lng: -80.1326,
    year_built: 2017,
    units: 46,
    area_sqft: 110_000,
    asset_class: "High-rise condo · oceanfront",
    named_windstorm_zone: "Tier 1 — Tri County FL",
    wind_hail_zone: "Non-CAT",
    earthquake_zone: "Non-CAT",
    flood_zone: "AE",
    photo: undefined, // not in zip — using SVG fallback
    risk: {
      named_windstorm: 1,
      storm_surge: 1,
      flood_zone: 1,
      sea_level_rise: 1,
      wind_driven_rain: 2,
      construction_defect: 3,
      loss_frequency: 2,
      distance_to_water_m: 35,
      distance_to_water_tier: 1,
      overall_tier: 1,
    },
    illustration: {
      stories: 10,
      width: "wide",
      crown: "flat",
      baseColor: "#D7DEE3",
      glassColor: "#7BB6CC",
      accentColor: "#101E7F",
      windowPattern: "ribbons",
      signature: "Boutique oceanfront, glass facade",
    },
  },
  {
    id: "millecento",
    location_name: "Millecento Residences",
    manager_name: "Lex Baluja",
    address: "1100 S Miami Ave",
    city: "Miami",
    state: "FL",
    zip: "33130",
    lat: 25.7621,
    lng: -80.1928,
    year_built: 2014,
    units: 382,
    area_sqft: 370_000,
    asset_class: "High-rise condo · Brickell",
    named_windstorm_zone: "Tier 1 — Tri County FL",
    wind_hail_zone: "Non-CAT",
    earthquake_zone: "Non-CAT",
    flood_zone: "X",
    photo: "/buildings/millecento.webp",
    risk: {
      named_windstorm: 1,
      storm_surge: 2,
      flood_zone: 3,
      sea_level_rise: 2,
      wind_driven_rain: 2,
      construction_defect: 3,
      loss_frequency: 2,
      distance_to_water_m: 600,
      distance_to_water_tier: 2,
      overall_tier: 2,
    },
    illustration: {
      stories: 43,
      width: "narrow",
      crown: "curved",
      baseColor: "#3F4754",
      glassColor: "#8B9DAB",
      accentColor: "#A70070",
      windowPattern: "strips",
      signature: "Pininfarina-designed, sculpted profile",
    },
  },
  {
    id: "1300-s-miami",
    location_name: "1300 S. Miami",
    manager_name: "Beatriz Galiana",
    address: "1300 S Miami Ave",
    city: "Miami",
    state: "FL",
    zip: "33130",
    lat: 25.7600,
    lng: -80.1934,
    year_built: 2008,
    units: 282,
    area_sqft: 280_000,
    asset_class: "High-rise condo · Brickell",
    named_windstorm_zone: "Tier 1 — Tri County FL",
    wind_hail_zone: "Non-CAT",
    earthquake_zone: "Non-CAT",
    flood_zone: "X",
    photo: "/buildings/1300-s-miami.jpg",
    risk: {
      named_windstorm: 1,
      storm_surge: 2,
      flood_zone: 3,
      sea_level_rise: 2,
      wind_driven_rain: 2,
      construction_defect: 2,
      loss_frequency: 2,
      distance_to_water_m: 360,
      distance_to_water_tier: 2,
      overall_tier: 2,
    },
    illustration: {
      stories: 21,
      width: "regular",
      crown: "stepped",
      baseColor: "#C9BFA8",
      glassColor: "#6E8AA1",
      windowPattern: "grid",
      signature: "Twin-tower Brickell mid-rise",
    },
  },
  {
    id: "901-brickell",
    location_name: "951 Brickell",
    manager_name: "Luis Lopez",
    address: "951 Brickell Ave",
    city: "Miami",
    state: "FL",
    zip: "33131",
    lat: 25.7656,
    lng: -80.1929,
    year_built: 2008,
    units: 234,
    area_sqft: 370_000,
    asset_class: "High-rise condo · Brickell waterfront",
    named_windstorm_zone: "Tier 1 — Tri County FL",
    wind_hail_zone: "Non-CAT",
    earthquake_zone: "Non-CAT",
    flood_zone: "AE",
    photo: "/buildings/901-brickell.jpg",
    risk: {
      named_windstorm: 1,
      storm_surge: 1,
      flood_zone: 1,
      sea_level_rise: 1,
      wind_driven_rain: 2,
      construction_defect: 2,
      loss_frequency: 1,
      distance_to_water_m: 50,
      distance_to_water_tier: 1,
      overall_tier: 1,
    },
    illustration: {
      stories: 50,
      width: "regular",
      crown: "tapered",
      baseColor: "#1E2738",
      glassColor: "#5BA8C2",
      accentColor: "#28AFC3",
      windowPattern: "ribbons",
      signature: "Bayfront tower with crown",
    },
  },
  {
    id: "marea",
    location_name: "Marea",
    manager_name: "Oswaldo Anglero",
    address: "801 South Pointe Dr",
    city: "Miami Beach",
    state: "FL",
    zip: "33139",
    lat: 25.7681,
    lng: -80.1349,
    year_built: 2013,
    units: 30,
    area_sqft: 64_000,
    asset_class: "Mid-rise condo · oceanfront",
    named_windstorm_zone: "Tier 1 — Tri County FL",
    wind_hail_zone: "Non-CAT",
    earthquake_zone: "Non-CAT",
    flood_zone: "AE",
    photo: "/buildings/marea.jpg",
    risk: {
      named_windstorm: 1,
      storm_surge: 1,
      flood_zone: 1,
      sea_level_rise: 1,
      wind_driven_rain: 2,
      construction_defect: 3,
      loss_frequency: 2,
      distance_to_water_m: 30,
      distance_to_water_tier: 1,
      overall_tier: 1,
    },
    illustration: {
      stories: 8,
      width: "wide",
      crown: "flat",
      baseColor: "#F0EBE3",
      glassColor: "#9CB5C5",
      accentColor: "#C4875A",
      windowPattern: "grid",
      signature: "Boutique South Pointe oceanfront",
    },
  },
  {
    id: "baltus-house",
    location_name: "Baltus House",
    manager_name: "Maria L. Luna",
    address: "4250 Biscayne Blvd",
    city: "Miami",
    state: "FL",
    zip: "33137",
    lat: 25.8155,
    lng: -80.1880,
    year_built: 2016,
    units: 167,
    area_sqft: 175_000,
    asset_class: "Mid-rise condo · Design District",
    named_windstorm_zone: "Tier 1 — Tri County FL",
    wind_hail_zone: "Non-CAT",
    earthquake_zone: "Non-CAT",
    flood_zone: "X",
    photo: "/buildings/baltus-house.webp",
    risk: {
      named_windstorm: 1,
      storm_surge: 3,
      flood_zone: 3,
      sea_level_rise: 3,
      wind_driven_rain: 2,
      construction_defect: 3,
      loss_frequency: 3,
      distance_to_water_m: 720,
      distance_to_water_tier: 3,
      overall_tier: 2,
    },
    illustration: {
      stories: 21,
      width: "regular",
      crown: "flat",
      baseColor: "#FAFAF8",
      glassColor: "#3F4754",
      accentColor: "#EB0017",
      windowPattern: "grid",
      signature: "Modern minimalist, Design District",
    },
  },
  {
    id: "my-brickell",
    location_name: "My Brickell",
    manager_name: "Jose Corbo",
    address: "31 SE 6th St",
    city: "Miami",
    state: "FL",
    zip: "33131",
    lat: 25.7708,
    lng: -80.1908,
    year_built: 2013,
    units: 192,
    area_sqft: 175_000,
    asset_class: "High-rise condo · Brickell",
    named_windstorm_zone: "Tier 1 — Tri County FL",
    wind_hail_zone: "Non-CAT",
    earthquake_zone: "Non-CAT",
    flood_zone: "X",
    photo: "/buildings/my-brickell.jpg",
    risk: {
      named_windstorm: 1,
      storm_surge: 2,
      flood_zone: 3,
      sea_level_rise: 2,
      wind_driven_rain: 2,
      construction_defect: 3,
      loss_frequency: 2,
      distance_to_water_m: 510,
      distance_to_water_tier: 2,
      overall_tier: 2,
    },
    illustration: {
      stories: 30,
      width: "narrow",
      crown: "stepped",
      baseColor: "#3F4754",
      glassColor: "#5D6D78",
      accentColor: "#FFA600",
      windowPattern: "strips",
      signature: "Karim Rashid–designed, signature accent",
    },
  },
];

/* ── Display helpers ── */

export function fmtDistance(m: number): string {
  if (m < 1000) return `${Math.round(m / 5) * 5} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

export function tierClass(t: RiskTier): string {
  return t === 1 ? "text-aon-red" : t === 2 ? "text-amber-500" : "text-emerald-600";
}
