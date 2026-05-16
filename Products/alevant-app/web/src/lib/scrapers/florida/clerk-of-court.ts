// Florida Clerk of Court — foreclosure (NOD / lis pendens), probate, divorce filings.
//
// Real production sources per county:
//   - Miami-Dade Clerk:    https://www2.miami-dadeclerk.com/cvweb/
//   - Broward Clerk:        https://www.browardclerk.org/
//   - Palm Beach Clerk:     https://applications.mypalmbeachclerk.com/RecordSearch/
//   - Monroe Clerk:         https://monroe-clerk.com/
//
// Strategy:
//   1. Per-county Playwright recipe; sessions are reused across the batch.
//   2. Hits cached to florida_court_filings (unique on county,case_number) so subsequent
//      lookups skip the portal entirely.
//   3. Cache is honored if `fetched_at` is within COURT_CACHE_HOURS (default 48h).
//   4. Always degrade to [] on any failure — orchestrator handles partial signal.
//
// Legal: Florida court records are public per F.S. § 28.222. Throttled scraping of
// public records is permissible; site-specific ToS still apply (no captcha bypass,
// no DoS-style query volume). Each portal is rate-limited to ≤1 query / 4s.

import type { CourtFiling } from "./types";
import { withBrowser, miamiDadeClerkSearchByParty } from "../playwright";
import { getSupabaseService } from "@/lib/supabase/server";

const COURT_CACHE_HOURS = 48;

export interface ClerkSearchOptions {
  county: "Miami-Dade" | "Broward" | "Palm Beach" | "Monroe" | string;
  property_address?: string;
  party_name?: string;
  filing_date_from?: string;
  filing_date_to?: string;
  /** When true, bypass cache and force a live scrape. */
  refresh?: boolean;
}

function normalizeCaseType(raw: string): CourtFiling["case_type"] {
  const r = raw.toLowerCase();
  if (r.includes("foreclosure") || r.includes("lis pendens")) return "foreclosure";
  if (r.includes("probate") || r.includes("estate")) return "probate";
  if (r.includes("dissolution") || r.includes("divorce")) return "divorce";
  return "other";
}

async function readCache(
  county: string,
  partyName: string,
  caseType?: string
): Promise<CourtFiling[] | null> {
  const svc = getSupabaseService();
  const cutoff = new Date(Date.now() - COURT_CACHE_HOURS * 3600_000).toISOString();
  let q = svc
    .from("florida_court_filings")
    .select("case_number, case_type, filing_date, party_name, property_address, source_url, fetched_at")
    .eq("county", county)
    .ilike("party_name", partyName)
    .gte("fetched_at", cutoff);
  if (caseType) q = q.eq("case_type", caseType);
  const { data, error } = await q;
  if (error || !data?.length) return null;
  return data.map((r) => ({
    case_number: r.case_number,
    case_type: r.case_type as CourtFiling["case_type"],
    filing_date: r.filing_date,
    party_name: r.party_name,
    property_address: r.property_address ?? undefined,
    source_url: r.source_url ?? undefined,
  }));
}

async function writeCache(county: string, filings: CourtFiling[]) {
  if (!filings.length) return;
  const svc = getSupabaseService();
  await svc.from("florida_court_filings").upsert(
    filings.map((f) => ({
      county,
      case_number: f.case_number,
      case_type: f.case_type,
      filing_date: f.filing_date,
      party_name: f.party_name,
      property_address: f.property_address ?? null,
      source_url: f.source_url ?? null,
    })),
    { onConflict: "county,case_number" }
  );
}

// ============================================================================
// Per-county Playwright recipes
// ============================================================================

async function scrapeMiamiDade(partyName: string): Promise<CourtFiling[]> {
  try {
    return await withBrowser(async ({ context }) => {
      const page = await context.newPage();
      const raw = await miamiDadeClerkSearchByParty(page, partyName);
      return raw.map((r) => ({
        case_number: r.case_number,
        case_type: normalizeCaseType(r.case_type),
        filing_date: r.filing_date,
        party_name: r.party_name,
        source_url: `https://www2.miami-dadeclerk.com/cvweb/?caseNo=${encodeURIComponent(r.case_number)}`,
      }));
    });
  } catch {
    return [];
  }
}

async function scrapeBroward(partyName: string): Promise<CourtFiling[]> {
  try {
    return await withBrowser(async ({ context }) => {
      const page = await context.newPage();
      await page.goto("https://www.browardclerk.org/Web2/CaseSearch/CaseSearchByName", {
        waitUntil: "networkidle",
      });
      // Accept ToS modal if present
      const accept = page.locator('button:has-text("Accept"), input[value*="Accept" i]');
      if (await accept.count()) await accept.first().click().catch(() => {});

      // Party-name search
      await page.fill('input[name*="Last" i], input[id*="LastName" i]', partyName.split(" ")[0] ?? partyName);
      const restName = partyName.split(" ").slice(1).join(" ");
      if (restName) {
        await page.fill('input[name*="First" i], input[id*="FirstName" i]', restName).catch(() => {});
      }
      await page.click('input[type="submit"][value*="Search" i], button:has-text("Search")');
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

      // Parse result rows. Broward's table varies; we look for any row with a case-number link.
      const rows = await page.$$eval("table tr", (rs) =>
        rs
          .map((r) => {
            const tds = Array.from(r.querySelectorAll("td")).map((t) => t.textContent?.trim() ?? "");
            return { cells: tds };
          })
          .filter((r) => r.cells.length >= 4 && /\d{2}-\d{6}/.test(r.cells[0] ?? ""))
      );
      return rows.map((r) => ({
        case_number: r.cells[0],
        case_type: normalizeCaseType(r.cells[2] || r.cells[3] || ""),
        filing_date: r.cells[1] ?? "",
        party_name: partyName,
        source_url: "https://www.browardclerk.org/",
      }));
    });
  } catch {
    return [];
  }
}

async function scrapePalmBeach(partyName: string): Promise<CourtFiling[]> {
  try {
    return await withBrowser(async ({ context }) => {
      const page = await context.newPage();
      await page.goto("https://applications.mypalmbeachclerk.com/RecordSearch/", {
        waitUntil: "networkidle",
      });
      // Accept ToS
      const accept = page.locator('button:has-text("Accept"), input[value*="Accept" i]');
      if (await accept.count()) await accept.first().click().catch(() => {});

      await page.fill('input[name*="party" i], input[id*="party" i]', partyName).catch(() => {});
      await page.click('button:has-text("Search"), input[type="submit"][value*="Search" i]').catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

      const rows = await page.$$eval("table tbody tr", (rs) =>
        rs.map((r) => {
          const tds = Array.from(r.querySelectorAll("td")).map((t) => t.textContent?.trim() ?? "");
          return { cells: tds };
        })
      );
      return rows
        .filter((r) => r.cells.length >= 3)
        .map((r) => ({
          case_number: r.cells[0] ?? "",
          case_type: normalizeCaseType(r.cells[1] ?? ""),
          filing_date: r.cells[2] ?? "",
          party_name: partyName,
          source_url: "https://applications.mypalmbeachclerk.com/RecordSearch/",
        }));
    });
  } catch {
    return [];
  }
}

async function scrapeMonroe(partyName: string): Promise<CourtFiling[]> {
  // Monroe's clerk site uses a different platform; treat as best-effort for v1.5.
  try {
    return await withBrowser(async ({ context }) => {
      const page = await context.newPage();
      await page.goto("https://monroe-clerk.com/court-records/", { waitUntil: "networkidle" });
      const accept = page.locator('button:has-text("Accept"), input[value*="Accept" i]');
      if (await accept.count()) await accept.first().click().catch(() => {});

      // Many Monroe filings flow through a sub-portal; if no usable search field exists,
      // return empty rather than throwing.
      const partyInput = page.locator('input[name*="party" i], input[id*="party" i]');
      if (!(await partyInput.count())) return [];

      await partyInput.first().fill(partyName);
      await page.click('button:has-text("Search"), input[type="submit"][value*="Search" i]').catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

      const rows = await page.$$eval("table tbody tr", (rs) =>
        rs.map((r) => {
          const tds = Array.from(r.querySelectorAll("td")).map((t) => t.textContent?.trim() ?? "");
          return { cells: tds };
        })
      );
      return rows
        .filter((r) => r.cells.length >= 3)
        .map((r) => ({
          case_number: r.cells[0] ?? "",
          case_type: normalizeCaseType(r.cells[1] ?? ""),
          filing_date: r.cells[2] ?? "",
          party_name: partyName,
          source_url: "https://monroe-clerk.com/",
        }));
    });
  } catch {
    return [];
  }
}

async function fetchCountyFilings(
  county: ClerkSearchOptions["county"],
  partyName: string
): Promise<CourtFiling[]> {
  switch (county) {
    case "Miami-Dade":
      return scrapeMiamiDade(partyName);
    case "Broward":
      return scrapeBroward(partyName);
    case "Palm Beach":
      return scrapePalmBeach(partyName);
    case "Monroe":
      return scrapeMonroe(partyName);
    default:
      return [];
  }
}

// ============================================================================
// Public API (preserves the v1.0 signatures)
// ============================================================================

export async function fetchForeclosureFilings(opts: ClerkSearchOptions): Promise<CourtFiling[]> {
  if (!opts.party_name) return [];
  if (!opts.refresh) {
    const cached = await readCache(opts.county, opts.party_name, "foreclosure");
    if (cached) return cached;
  }
  const all = await fetchCountyFilings(opts.county, opts.party_name);
  await writeCache(opts.county, all);
  return all.filter((f) => f.case_type === "foreclosure");
}

export async function fetchProbateFilings(opts: ClerkSearchOptions): Promise<CourtFiling[]> {
  if (!opts.party_name) return [];
  if (!opts.refresh) {
    const cached = await readCache(opts.county, opts.party_name, "probate");
    if (cached) return cached;
  }
  const all = await fetchCountyFilings(opts.county, opts.party_name);
  await writeCache(opts.county, all);
  return all.filter((f) => f.case_type === "probate");
}

export async function fetchDivorceFilings(opts: ClerkSearchOptions): Promise<CourtFiling[]> {
  if (!opts.party_name) return [];
  if (!opts.refresh) {
    const cached = await readCache(opts.county, opts.party_name, "divorce");
    if (cached) return cached;
  }
  const all = await fetchCountyFilings(opts.county, opts.party_name);
  await writeCache(opts.county, all);
  return all.filter((f) => f.case_type === "divorce");
}

/** Single fan-out call that returns ALL filings for the party across case types. */
export async function fetchAllCourtFilings(opts: ClerkSearchOptions): Promise<CourtFiling[]> {
  if (!opts.party_name) return [];
  if (!opts.refresh) {
    const cached = await readCache(opts.county, opts.party_name);
    if (cached?.length) return cached;
  }
  const all = await fetchCountyFilings(opts.county, opts.party_name);
  await writeCache(opts.county, all);
  return all;
}
