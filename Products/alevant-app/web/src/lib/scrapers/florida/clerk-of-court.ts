// Florida Clerk of Court adapter — pre-foreclosure (NOD), probate, and divorce filings.
//
// V1: stubs documenting real source endpoints. These public portals do not expose
// stable JSON APIs; production crawls require a headless browser (Playwright) with
// CAPTCHA handling and ToS review per county. PRAIX's permit-pull pattern fits here.
//
// Real production sources (per county):
//   - Miami-Dade Clerk:    https://www2.miami-dadeclerk.com/cvweb/
//   - Broward Clerk:        https://www.browardclerk.org/
//   - Palm Beach Clerk:     https://applications.mypalmbeachclerk.com/RecordSearch/
//   - Orange Clerk:         https://or.occompt.com/recorder/web/
//
// Foreclosure filings appear as "LIS PENDENS" or "NOTICE OF DEFAULT" or case-type
// "FORECLOSURE - RES & COMM HOMESTEAD". Probate appears under case-type "PROBATE".
// Divorce appears as "DISSOLUTION OF MARRIAGE".

import type { CourtFiling } from "./types";

export interface ClerkSearchOptions {
  county: "Miami-Dade" | "Broward" | "Palm Beach" | "Orange" | string;
  property_address?: string;
  party_name?: string;
  filing_date_from?: string; // ISO date
  filing_date_to?: string;
}

/**
 * Pre-foreclosure / Notice-of-Default filings.
 * Filed under "LIS PENDENS" or case-type "FORECLOSURE".
 */
export async function fetchForeclosureFilings(opts: ClerkSearchOptions): Promise<CourtFiling[]> {
  // TODO: implement per-county Playwright crawler with rate-limited queue.
  // For now, return empty — orchestrator handles partial signal gracefully.
  return [];
}

/** Probate filings — owner death triggers heirs to sell. High-value seller signal. */
export async function fetchProbateFilings(opts: ClerkSearchOptions): Promise<CourtFiling[]> {
  // TODO: Playwright crawl of probate division (case-type filter).
  return [];
}

/** Divorce / dissolution of marriage — high-frequency seller motivation. */
export async function fetchDivorceFilings(opts: ClerkSearchOptions): Promise<CourtFiling[]> {
  // TODO: Playwright crawl of family division.
  return [];
}

/** Single fan-out call. */
export async function fetchAllCourtFilings(opts: ClerkSearchOptions): Promise<CourtFiling[]> {
  const [foreclosure, probate, divorce] = await Promise.all([
    fetchForeclosureFilings(opts).catch(() => []),
    fetchProbateFilings(opts).catch(() => []),
    fetchDivorceFilings(opts).catch(() => []),
  ]);
  return [...foreclosure, ...probate, ...divorce];
}
