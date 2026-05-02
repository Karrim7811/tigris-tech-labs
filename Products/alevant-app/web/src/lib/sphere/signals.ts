// Sphere Brain — external signal sources.
//
// V1 sources (live):
//   - Anniversary detection (calendar-based on closed transactions)
//   - Birthday detection (when contact has DOB on file)
//   - Equity-position alerts (cross-ref Florida property appraiser data)
//
// V2 sources (scaffolded):
//   - LinkedIn job-change polling (requires partner-tier access; V2)
//   - Florida deed transfers (Clerk of Court ROD index → contact match)
//   - Public records life events (probate / divorce / marriage)
//
// Sphere signals dedupe by (workspace_id, contact_id, signal_type, day-bucket).

import { differenceInDays, format } from "date-fns";

export interface AnniversarySource {
  contact_id: string;
  closing_date: string;
  property_address: string;
}

export function detectAnniversaries(
  sources: AnniversarySource[],
  windowDays = 14
): Array<{ contact_id: string; signal_type: "close_anniversary"; signal_data: any; confidence: number }> {
  const now = new Date();
  const out = [];
  for (const s of sources) {
    const d = new Date(s.closing_date);
    const annThisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    const days = Math.abs(differenceInDays(annThisYear, now));
    if (days <= windowDays) {
      const years = now.getFullYear() - d.getFullYear();
      out.push({
        contact_id: s.contact_id,
        signal_type: "close_anniversary" as const,
        signal_data: {
          years,
          property_address: s.property_address,
          anniversary_date: format(annThisYear, "yyyy-MM-dd"),
          days_until: differenceInDays(annThisYear, now),
        },
        confidence: 95,
      });
    }
  }
  return out;
}

// LinkedIn job-change detection — requires LinkedIn partner-tier or paid third-party
// (e.g. People Data Labs, RocketReach). This stub documents the production interface.
export interface LinkedInJobChange {
  contact_id: string;
  previous_employer: string;
  new_employer: string;
  new_title: string;
  detected_at: string;
}

export async function pollLinkedInJobChanges(_contactIds: string[]): Promise<LinkedInJobChange[]> {
  // TODO: Production wiring once partner access acquired.
  // Pattern: cron job fans out batched lookups, dedupes against last_known_employer
  // stored in contacts.metadata.linkedin_employer.
  return [];
}

// Florida deed-transfer signals — when a sphere contact buys/sells, we want to know.
// Cross-references Florida Clerk of Court Recorded Documents index by party name.
export interface DeedSignal {
  contact_id: string;
  document_type: "warranty_deed" | "quitclaim_deed";
  recorded_date: string;
  property_address?: string;
  county: string;
}

export async function pollFloridaDeeds(_contactNames: string[]): Promise<DeedSignal[]> {
  // TODO: Per-county clerk-of-court ROD search. Same Playwright path as
  // foreclosure/probate adapters; party name → matched filings.
  return [];
}

/**
 * Equity-position alert — when a past client's home has appreciated significantly.
 * Trigger: appraised value rose >15% since their purchase or last alert.
 */
export function detectEquityAlerts(
  inputs: Array<{ contact_id: string; property_address: string; purchase_price: number; current_value: number; last_alerted_at?: string | null }>
): Array<{ contact_id: string; signal_type: "equity_position"; signal_data: any; confidence: number }> {
  const out = [];
  for (const i of inputs) {
    const appreciation = (i.current_value - i.purchase_price) / i.purchase_price;
    if (appreciation < 0.15) continue;
    if (i.last_alerted_at && differenceInDays(new Date(), new Date(i.last_alerted_at)) < 90) continue;
    out.push({
      contact_id: i.contact_id,
      signal_type: "equity_position" as const,
      signal_data: {
        property_address: i.property_address,
        purchase_price: i.purchase_price,
        current_value: i.current_value,
        appreciation_pct: Math.round(appreciation * 100),
      },
      confidence: 80,
    });
  }
  return out;
}
