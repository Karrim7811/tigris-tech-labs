// Florida county tax-collector adapter — flags tax delinquency.
//
// Real sources:
//   - Miami-Dade Tax Collector: https://www.miamidade.gov/taxcollector/property-tax-search.asp
//   - Broward Tax Collector:    https://county-taxes.net/broward/
//   - Palm Beach Tax Collector: https://pbctax.gov/
//
// Many Florida counties expose property-tax search by folio with a JSON endpoint
// behind a session cookie; the production implementation uses Playwright to seed
// the cookie then issues direct fetches. V1 returns a structured stub so the
// orchestrator's flag-fusion logic exercises end-to-end.

import type { TaxRecord } from "./types";

export async function fetchTaxRecord(folio: string, county: string): Promise<TaxRecord | null> {
  // TODO: implement per-county. Pattern:
  //   1. Playwright opens search URL → sets ASP.NET session cookie
  //   2. Issue parameterized POST with folio
  //   3. Parse delinquency block from HTML
  //   4. Cache result for 24 hours (Supabase Storage)
  return null;
}

/** Cross-reference helper: given a folio, return whether last 3 years had any delinquent year. */
export async function hasRecentTaxDelinquency(folio: string, county: string): Promise<boolean> {
  const rec = await fetchTaxRecord(folio, county);
  return !!rec?.is_delinquent;
}
