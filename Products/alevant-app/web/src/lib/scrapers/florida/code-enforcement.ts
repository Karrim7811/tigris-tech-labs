// Florida municipal code enforcement — open code violations.
//
// Open violations are a strong distress signal — especially Miami Beach STR
// enforcement and Miami's unsafe-structures program.
//
// Real sources (V1 priority):
//   - City of Miami:  https://miami.gov/Government/Departments-Organizations/Code-Compliance/Code-Compliance-Records-Search
//   - Miami Beach:    https://www.miamibeachfl.gov/code/   (public search)
//   - Coral Gables:   https://www.coralgables.com/code-enforcement
//   - Broward County (uninc.):  https://www.broward.org/PermittingLicensingConsumer/Pages/CodeEnforcement.aspx
//   - Palm Beach County:        https://discover.pbcgov.org/pzb/code/
//
// Cache TTL = 24h (status changes more often than tax).

import type { CodeEnforcementRecord } from "./types";
import { withBrowser } from "../playwright";
import { getSupabaseService } from "@/lib/supabase/server";

const CODE_CACHE_HOURS = 24;

export interface CodeEnforcementSearchOptions {
  jurisdiction:
    | "miami"
    | "miami-beach"
    | "coral-gables"
    | "miami-dade-unincorporated"
    | "broward"
    | "palm-beach"
    | string;
  property_address?: string;
  status?: "open" | "any";
}

async function readCache(
  jurisdiction: string,
  property_address: string,
  status: "open" | "any"
): Promise<CodeEnforcementRecord[] | null> {
  const svc = getSupabaseService();
  const cutoff = new Date(Date.now() - CODE_CACHE_HOURS * 3600_000).toISOString();
  let q = svc
    .from("florida_code_enforcement")
    .select("case_number, filing_date, status, property_address, violation_type, source_url, fetched_at")
    .eq("jurisdiction", jurisdiction)
    .ilike("property_address", `%${property_address}%`)
    .gte("fetched_at", cutoff);
  if (status === "open") q = q.eq("status", "open");
  const { data } = await q;
  if (!data?.length) return null;
  return data.map((r) => ({
    case_number: r.case_number,
    filing_date: r.filing_date,
    status: r.status as CodeEnforcementRecord["status"],
    property_address: r.property_address,
    violation_type: r.violation_type ?? undefined,
    source_url: r.source_url ?? undefined,
  }));
}

async function writeCache(jurisdiction: string, records: CodeEnforcementRecord[]) {
  if (!records.length) return;
  const svc = getSupabaseService();
  await svc.from("florida_code_enforcement").upsert(
    records.map((r) => ({
      jurisdiction,
      case_number: r.case_number,
      status: r.status,
      filing_date: r.filing_date,
      property_address: r.property_address,
      violation_type: r.violation_type ?? null,
      source_url: r.source_url ?? null,
    })),
    { onConflict: "jurisdiction,case_number" }
  );
}

// ============================================================================
// Per-jurisdiction Playwright recipes
// ============================================================================

async function scrapeMiami(address: string): Promise<CodeEnforcementRecord[]> {
  try {
    return await withBrowser(async ({ context }) => {
      const page = await context.newPage();
      await page.goto(
        "https://miami.gov/Government/Departments-Organizations/Code-Compliance/Code-Compliance-Records-Search",
        { waitUntil: "networkidle", timeout: 30_000 }
      );
      const input = page.locator('input[name*="address" i], input[id*="Address" i]');
      if (!(await input.count())) return [];
      await input.first().fill(address);
      await page.click('button:has-text("Search"), input[type="submit"][value*="Search" i]').catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
      const rows = await page.$$eval("table tbody tr", (rs) =>
        rs.map((r) => {
          const tds = Array.from(r.querySelectorAll("td")).map((t) => t.textContent?.trim() ?? "");
          return tds;
        })
      );
      return rows
        .filter((cells) => cells.length >= 4)
        .map((cells) => ({
          case_number: cells[0],
          filing_date: cells[1],
          status: (cells[2] || "").toLowerCase().includes("open")
            ? "open"
            : (cells[2] || "").toLowerCase().includes("compliance")
            ? "in_compliance"
            : "closed",
          property_address: address,
          violation_type: cells[3] || undefined,
          source_url:
            "https://miami.gov/Government/Departments-Organizations/Code-Compliance/Code-Compliance-Records-Search",
        })) as CodeEnforcementRecord[];
    });
  } catch {
    return [];
  }
}

async function scrapeMiamiBeach(address: string): Promise<CodeEnforcementRecord[]> {
  try {
    return await withBrowser(async ({ context }) => {
      const page = await context.newPage();
      await page.goto("https://www.miamibeachfl.gov/code/", {
        waitUntil: "networkidle",
        timeout: 30_000,
      });
      const input = page.locator('input[name*="address" i], input[id*="Address" i]');
      if (!(await input.count())) return [];
      await input.first().fill(address);
      await page.click('button:has-text("Search"), input[type="submit"][value*="Search" i]').catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
      const rows = await page.$$eval("table tbody tr", (rs) =>
        rs.map((r) => Array.from(r.querySelectorAll("td")).map((t) => t.textContent?.trim() ?? ""))
      );
      return rows
        .filter((cells) => cells.length >= 4)
        .map((cells) => ({
          case_number: cells[0],
          filing_date: cells[1],
          status: ((cells[2] || "").toLowerCase().includes("open")
            ? "open"
            : "closed") as CodeEnforcementRecord["status"],
          property_address: address,
          violation_type: cells[3] || undefined,
          source_url: "https://www.miamibeachfl.gov/code/",
        }));
    });
  } catch {
    return [];
  }
}

async function scrapeCoralGables(address: string): Promise<CodeEnforcementRecord[]> {
  try {
    return await withBrowser(async ({ context }) => {
      const page = await context.newPage();
      await page.goto("https://www.coralgables.com/code-enforcement", {
        waitUntil: "networkidle",
        timeout: 30_000,
      });
      const input = page.locator('input[name*="address" i], input[id*="Address" i]');
      if (!(await input.count())) return [];
      await input.first().fill(address);
      await page.click('button:has-text("Search"), input[type="submit"][value*="Search" i]').catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
      const rows = await page.$$eval("table tbody tr", (rs) =>
        rs.map((r) => Array.from(r.querySelectorAll("td")).map((t) => t.textContent?.trim() ?? ""))
      );
      return rows
        .filter((cells) => cells.length >= 4)
        .map((cells) => ({
          case_number: cells[0],
          filing_date: cells[1],
          status: ((cells[2] || "").toLowerCase().includes("open")
            ? "open"
            : "closed") as CodeEnforcementRecord["status"],
          property_address: address,
          violation_type: cells[3] || undefined,
          source_url: "https://www.coralgables.com/code-enforcement",
        }));
    });
  } catch {
    return [];
  }
}

// ============================================================================
// Public API
// ============================================================================

export async function fetchCodeEnforcementRecords(
  opts: CodeEnforcementSearchOptions
): Promise<CodeEnforcementRecord[]> {
  if (!opts.property_address) return [];
  const status = opts.status ?? "open";
  const cached = await readCache(opts.jurisdiction, opts.property_address, status);
  if (cached) return cached;

  let records: CodeEnforcementRecord[] = [];
  switch (opts.jurisdiction) {
    case "miami":
      records = await scrapeMiami(opts.property_address);
      break;
    case "miami-beach":
      records = await scrapeMiamiBeach(opts.property_address);
      break;
    case "coral-gables":
      records = await scrapeCoralGables(opts.property_address);
      break;
    default:
      // Other jurisdictions are placeholders for V1.5; they return empty rather than throw.
      records = [];
  }

  if (records.length) await writeCache(opts.jurisdiction, records);
  return status === "open" ? records.filter((r) => r.status === "open") : records;
}
