// AirDNA adapter — short-term rental market data per ZIP.
// Phase 1: dashboard scrape (cached weekly).
// Phase 2: official API (~$129/mo entry tier).
// https://apidocs.airdna.co/

import type { STRMarketRecord } from "./florida/types";

export async function fetchSTRMarket(zip: string): Promise<STRMarketRecord | null> {
  const apiKey = process.env.AIRDNA_API_KEY;
  if (!apiKey) {
    // V1: dashboard-derived fixtures keyed by Bichi farm zips.
    return STATIC_FIXTURES[zip] ?? null;
  }

  // V2: real API call
  const url = `https://api.airdna.co/v1/market/${zip}/summary`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!r.ok) return null;
  const json = await r.json();
  return {
    zip,
    adr_p50: json.adr_p50,
    adr_p75: json.adr_p75,
    occupancy_pct: json.occupancy_pct,
    revpar: json.revpar,
    active_listings_count: json.active_listings,
    source: "airdna",
  };
}

// Bichi farm-zone seed values (manually pulled from AirDNA dashboard, refresh quarterly).
const STATIC_FIXTURES: Record<string, STRMarketRecord> = {
  "33131": { zip: "33131", adr_p50: 285, adr_p75: 410, occupancy_pct: 71, revpar: 202, active_listings_count: 1243, source: "scraped" },
  "33139": { zip: "33139", adr_p50: 345, adr_p75: 510, occupancy_pct: 74, revpar: 255, active_listings_count: 2871, source: "scraped" },
  "33141": { zip: "33141", adr_p50: 230, adr_p75: 340, occupancy_pct: 68, revpar: 156, active_listings_count: 884, source: "scraped" },
  "33143": { zip: "33143", adr_p50: 195, adr_p75: 270, occupancy_pct: 63, revpar: 123, active_listings_count: 412, source: "scraped" },
  "33134": { zip: "33134", adr_p50: 220, adr_p75: 310, occupancy_pct: 65, revpar: 143, active_listings_count: 567, source: "scraped" },
  "33132": { zip: "33132", adr_p50: 265, adr_p75: 395, occupancy_pct: 70, revpar: 186, active_listings_count: 980, source: "scraped" },
};
