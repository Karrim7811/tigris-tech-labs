// Broward County Property Appraiser (BCPA) adapter.
// Source: https://web.bcpa.net/
//
// BCPA exposes ASMX-style services and a JSON property-search endpoint. Production
// implementation uses Playwright to seed session + scrape the parcel detail page.
// V1: stub with documented endpoint. Activates when full implementation lands.

import type { PropertyRecord } from "./types";

export async function fetchBrowardPropertyByAddress(address: string): Promise<PropertyRecord | null> {
  // TODO: Playwright crawl of https://web.bcpa.net/RecAddr.asp
  return null;
}
