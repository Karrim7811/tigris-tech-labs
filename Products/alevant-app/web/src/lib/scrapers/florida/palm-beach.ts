// Palm Beach County Property Appraiser (PAPA) adapter.
// Source: https://www.pbcgov.com/papa/
//
// PAPA offers a JSON parcel-detail endpoint behind their public REST gateway.
// V1: stub with documented endpoint.

import type { PropertyRecord } from "./types";

export async function fetchPalmBeachPropertyByAddress(address: string): Promise<PropertyRecord | null> {
  // TODO: PAPA REST gateway parcel lookup.
  return null;
}
