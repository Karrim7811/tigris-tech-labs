// Monroe County Property Appraiser adapter.
// Source: https://www.monroepa.org/
// 
// The Florida Keys PA site is currently best served via a browser-backed crawl because the
// public UI does not expose a stable JSON search endpoint. This adapter is a placeholder that
// preserves the South Florida pipeline contract for Monroe County.

import type { PropertyRecord } from "./types";

export async function fetchMonroePropertyByAddress(address: string): Promise<PropertyRecord | null> {
  // TODO: implement Monroe PA search via Playwright or a public lookup gateway.
  // Example workflow:
  //   1) navigate to https://www.monroepa.org/
  //   2) submit address search fields for street and city
  //   3) parse the first result's parcel details into PropertyRecord
  return null;
}
