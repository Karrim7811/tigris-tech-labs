// Florida municipal code-enforcement adapter.
// Open code violations are a strong distress signal (especially in Miami's vacation rental enforcement).
//
// Real sources (V1 priority):
//   - City of Miami: https://www.miamigov.com/Government/Departments-Organizations/Code-Compliance/Code-Compliance-Records-Search
//   - Miami Beach:   https://www.miamibeachfl.gov/city-hall/code-compliance/
//   - Coral Gables:  https://www.coralgables.com/code-enforcement
//
// All three offer public lookup but no documented API. Production crawl:
// Playwright per-jurisdiction with daily refresh; results normalized.

import type { CodeEnforcementRecord } from "./types";

export interface CodeEnforcementSearchOptions {
  jurisdiction: "miami" | "miami-beach" | "coral-gables" | "miami-dade-unincorporated" | string;
  property_address?: string;
  status?: "open" | "any";
}

export async function fetchCodeEnforcementRecords(
  opts: CodeEnforcementSearchOptions
): Promise<CodeEnforcementRecord[]> {
  // TODO: Playwright crawl per jurisdiction.
  return [];
}
