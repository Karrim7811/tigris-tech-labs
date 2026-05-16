// Florida building / renovation permit adapter (multimodal Phase 1).
//
// Why this signal: permits separate the two halves of the "is the owner about to sell"
// question. A new kitchen / addition / pool *almost always* signals staying-and-investing
// (negative seller signal). A roof + paint + landscaping permit cluster within 6 months
// signals pre-listing prep (strong seller signal). Sub-classification via Claude.
//
// Sources (start with the three highest-density Miami jurisdictions):
//   - Miami:        https://eplan.miami-florida.gov/
//   - Miami Beach:  https://www.miamibeachfl.gov/city-hall/building/
//   - Coral Gables: https://www.coralgables.com/building
//   - Broward:      https://www.broward.org/Building/Pages/PermitsSearch.aspx
//   - Palm Beach:   https://discover.pbcgov.org/pzb/building/

import type { PermitRecord } from "./types";
import { withBrowser } from "../playwright";
import { getSupabaseService } from "@/lib/supabase/server";
import { runClaudeJSON } from "@/lib/anthropic";

const PERMIT_CACHE_HOURS = 24 * 7;

export interface PermitSearchOptions {
  jurisdiction: "miami" | "miami-beach" | "coral-gables" | "broward" | "palm-beach" | string;
  property_address: string;
  /** Only include permits issued within the last N days. Default 540 (~18mo). */
  window_days?: number;
}

async function readCache(jurisdiction: string, address: string): Promise<PermitRecord[] | null> {
  const svc = getSupabaseService();
  const cutoff = new Date(Date.now() - PERMIT_CACHE_HOURS * 3600_000).toISOString();
  const { data } = await svc
    .from("florida_permits")
    .select("permit_number, permit_type, permit_class, issue_date, property_address, declared_value, status, source_url, fetched_at")
    .eq("jurisdiction", jurisdiction)
    .ilike("property_address", `%${address}%`)
    .gte("fetched_at", cutoff);
  if (!data?.length) return null;
  return data.map((r) => ({
    jurisdiction,
    permit_number: r.permit_number,
    permit_type: r.permit_type ?? "",
    permit_class: (r.permit_class as PermitRecord["permit_class"]) ?? "unknown",
    issue_date: r.issue_date ?? "",
    property_address: r.property_address,
    declared_value: r.declared_value ?? undefined,
    status: r.status ?? undefined,
    source_url: r.source_url ?? undefined,
  }));
}

async function writeCache(jurisdiction: string, records: PermitRecord[]) {
  if (!records.length) return;
  const svc = getSupabaseService();
  await svc.from("florida_permits").upsert(
    records.map((r) => ({
      jurisdiction,
      permit_number: r.permit_number,
      permit_type: r.permit_type,
      permit_class: r.permit_class ?? "unknown",
      issue_date: r.issue_date,
      property_address: r.property_address,
      declared_value: r.declared_value ?? null,
      status: r.status ?? null,
      source_url: r.source_url ?? null,
    })),
    { onConflict: "jurisdiction,permit_number" }
  );
}

// ============================================================================
// Permit-class classification via Claude (cheap Haiku call)
// ============================================================================

/**
 * Classify a permit description into "stay" (renovation reflecting ongoing residence)
 * vs "flip" (pre-sale prep) vs "unknown." Uses a single batched Claude call per
 * property's set of permits.
 */
async function classifyPermits(records: PermitRecord[]): Promise<PermitRecord[]> {
  if (!records.length) return records;
  try {
    const payload = records.map((r) => ({
      n: r.permit_number,
      type: r.permit_type,
      value: r.declared_value,
      date: r.issue_date,
    }));
    const result = await runClaudeJSON<{ classifications: Array<{ n: string; klass: "stay" | "flip" | "unknown" }> }>({
      tier: "fast",
      system:
        "You classify residential building permits into one of three categories based on the homeowner's likely intent.\n\n" +
        "STAY: kitchen remodels, primary-bath remodels, room additions, pool installations, hurricane shutters, generators, " +
        "long-lead structural work. These reflect ongoing residency.\n\n" +
        "FLIP: roof replacement, exterior paint, landscaping refresh, single-bath cosmetic, deck staining, " +
        "popcorn-ceiling removal, electrical-panel cosmetic updates. These are pre-listing prep.\n\n" +
        "UNKNOWN: cannot determine from the data provided.\n\n" +
        "Sometimes a property has MULTIPLE permits — that PATTERN matters. Roof + paint + landscape within 6 months = flip even if any one alone is ambiguous.",
      user: JSON.stringify({
        permits: payload,
        instruction:
          "Return a JSON object: {\"classifications\":[{\"n\":\"<permit_number>\",\"klass\":\"stay|flip|unknown\"}]}.",
      }),
      maxTokens: 400,
    });
    const map = new Map(result.classifications?.map((c) => [c.n, c.klass]) ?? []);
    return records.map((r) => ({ ...r, permit_class: map.get(r.permit_number) ?? "unknown" }));
  } catch {
    return records;
  }
}

// ============================================================================
// Per-jurisdiction Playwright recipes
// ============================================================================

async function scrapeGenericPermitPortal(
  url: string,
  jurisdiction: string,
  address: string
): Promise<PermitRecord[]> {
  try {
    return await withBrowser(async ({ context }) => {
      const page = await context.newPage();
      await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
      const input = page.locator(
        'input[name*="address" i], input[id*="address" i], input[placeholder*="Address" i]'
      );
      if (!(await input.count())) return [];
      await input.first().fill(address);
      await page
        .click('button:has-text("Search"), input[type="submit"][value*="Search" i]')
        .catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
      const rows = await page.$$eval("table tbody tr", (rs) =>
        rs.map((r) => Array.from(r.querySelectorAll("td")).map((t) => t.textContent?.trim() ?? ""))
      );
      const recs: PermitRecord[] = [];
      for (const cells of rows) {
        if (cells.length < 3) continue;
        const numberMatch = cells.find((c) => /^[A-Z0-9-]+$/.test(c)) ?? cells[0];
        const dateMatch =
          cells.find((c) => /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(c)) ?? cells[1] ?? "";
        const typeText =
          cells.find((c) =>
            /(roof|kitchen|bath|pool|addition|paint|deck|shutter|generator|landscape|electrical|hvac|plumb)/i.test(c)
          ) ?? cells[2] ?? "";
        const valueMatch = cells.find((c) => /\$[\d,]+/.test(c));
        const declared = valueMatch
          ? parseFloat(valueMatch.replace(/[$,]/g, "")) || undefined
          : undefined;
        recs.push({
          jurisdiction,
          permit_number: numberMatch,
          permit_type: typeText,
          issue_date: dateMatch,
          property_address: address,
          declared_value: declared,
          source_url: url,
        });
      }
      return recs;
    });
  } catch {
    return [];
  }
}

// ============================================================================
// Public API
// ============================================================================

export async function fetchPermits(opts: PermitSearchOptions): Promise<PermitRecord[]> {
  const cached = await readCache(opts.jurisdiction, opts.property_address);
  if (cached) return filterWindow(cached, opts.window_days);

  let portalUrl: string;
  switch (opts.jurisdiction) {
    case "miami":
      portalUrl = "https://eplan.miami-florida.gov/CitizenAccess/";
      break;
    case "miami-beach":
      portalUrl = "https://www.miamibeachfl.gov/city-hall/building/";
      break;
    case "coral-gables":
      portalUrl = "https://www.coralgables.com/building";
      break;
    case "broward":
      portalUrl = "https://www.broward.org/Building/Pages/PermitsSearch.aspx";
      break;
    case "palm-beach":
      portalUrl = "https://discover.pbcgov.org/pzb/building/";
      break;
    default:
      return [];
  }

  const raw = await scrapeGenericPermitPortal(portalUrl, opts.jurisdiction, opts.property_address);
  const classified = await classifyPermits(raw);
  await writeCache(opts.jurisdiction, classified);
  return filterWindow(classified, opts.window_days);
}

function filterWindow(records: PermitRecord[], windowDays?: number): PermitRecord[] {
  if (!windowDays) return records;
  const cutoff = Date.now() - windowDays * 86_400_000;
  return records.filter((r) => {
    const d = new Date(r.issue_date).getTime();
    return isFinite(d) && d >= cutoff;
  });
}

/** Aggregate convenience: did the property show pre-listing flip-prep recently? */
export function detectFlipPattern(records: PermitRecord[], windowDays = 180): boolean {
  const cutoff = Date.now() - windowDays * 86_400_000;
  const flips = records.filter(
    (r) =>
      r.permit_class === "flip" &&
      isFinite(new Date(r.issue_date).getTime()) &&
      new Date(r.issue_date).getTime() >= cutoff
  );
  // Two or more flip-class permits in the window = strong pattern.
  return flips.length >= 2;
}

/** Aggregate convenience: stay-class permits suggest the owner is NOT selling. */
export function detectStayPattern(records: PermitRecord[], windowDays = 365): boolean {
  const cutoff = Date.now() - windowDays * 86_400_000;
  return records.some(
    (r) =>
      r.permit_class === "stay" &&
      (r.declared_value ?? 0) >= 30_000 &&
      isFinite(new Date(r.issue_date).getTime()) &&
      new Date(r.issue_date).getTime() >= cutoff
  );
}
