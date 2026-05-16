// Florida county tax-collector — flags tax delinquency.
//
// Real sources:
//   - Miami-Dade Tax Collector: https://www.miamidade.gov/taxcollector/property-tax-search.asp
//                                (folio search endpoint behind ASP.NET session cookie)
//   - Broward Tax Collector:    https://county-taxes.net/broward/
//   - Palm Beach Tax Collector: https://pbctax.gov/property-tax-info-payments/
//   - Monroe Tax Collector:     https://monroetaxcollector.com/
//
// Strategy:
//   1. Cache lookups in florida_tax_records (county,folio unique).
//   2. Cache TTL 7 days — tax data is slow-moving.
//   3. Miami-Dade is the only county with a live implementation; others ship as
//      best-effort Playwright recipes that return null on parser failure.

import type { TaxRecord } from "./types";
import { withBrowser } from "../playwright";
import { getSupabaseService } from "@/lib/supabase/server";

const TAX_CACHE_HOURS = 24 * 7;

async function readCache(county: string, folio: string): Promise<TaxRecord | null> {
  const svc = getSupabaseService();
  const cutoff = new Date(Date.now() - TAX_CACHE_HOURS * 3600_000).toISOString();
  const { data } = await svc
    .from("florida_tax_records")
    .select("folio, current_year_tax, is_delinquent, delinquent_amount, delinquent_years, source_url, fetched_at")
    .eq("county", county)
    .eq("folio", folio)
    .gte("fetched_at", cutoff)
    .maybeSingle();
  if (!data) return null;
  return {
    folio: data.folio,
    current_year_tax: data.current_year_tax ?? undefined,
    is_delinquent: !!data.is_delinquent,
    delinquent_amount: data.delinquent_amount ?? undefined,
    delinquent_years: data.delinquent_years ?? undefined,
    source_url: data.source_url ?? undefined,
  };
}

async function writeCache(county: string, rec: TaxRecord) {
  if (!rec.folio) return;
  const svc = getSupabaseService();
  await svc.from("florida_tax_records").upsert(
    {
      county,
      folio: rec.folio,
      current_year_tax: rec.current_year_tax ?? null,
      is_delinquent: rec.is_delinquent,
      delinquent_amount: rec.delinquent_amount ?? null,
      delinquent_years: rec.delinquent_years ?? null,
      source_url: rec.source_url ?? null,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "county,folio" }
  );
}

// ============================================================================
// Per-county recipes
// ============================================================================

async function fetchMiamiDadeTax(folio: string): Promise<TaxRecord | null> {
  try {
    return await withBrowser(async ({ context }) => {
      const page = await context.newPage();
      const url = `https://www.miamidade.gov/taxcollector/PropertyTaxSearch.asp?folio=${encodeURIComponent(
        folio
      )}`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });

      // Look for delinquency banner / table. Miami-Dade returns a row per tax year.
      const yearRows = await page.$$eval("table tr", (rs) =>
        rs
          .map((r) => {
            const tds = Array.from(r.querySelectorAll("td")).map((t) => t.textContent?.trim() ?? "");
            return tds;
          })
          .filter((cells) => cells.length >= 3 && /^\d{4}$/.test(cells[0] ?? ""))
      );

      let total_delinquent = 0;
      const delinquent_years: number[] = [];
      let current_year_tax: number | undefined;
      const currentYear = new Date().getFullYear();
      for (const cells of yearRows) {
        const yr = parseInt(cells[0], 10);
        const status = (cells[2] ?? "").toLowerCase();
        const amt = parseFloat((cells[1] ?? "").replace(/[,$]/g, "")) || 0;
        if (yr === currentYear - 1) current_year_tax = amt;
        if (status.includes("delinquent") || status.includes("unpaid")) {
          delinquent_years.push(yr);
          total_delinquent += amt;
        }
      }

      const rec: TaxRecord = {
        folio,
        current_year_tax,
        is_delinquent: delinquent_years.length > 0,
        delinquent_amount: total_delinquent > 0 ? total_delinquent : undefined,
        delinquent_years: delinquent_years.length ? delinquent_years.sort() : undefined,
        delinquent_since: delinquent_years.length ? `${Math.min(...delinquent_years)}-01-01` : undefined,
        source_url: url,
      };
      return rec;
    });
  } catch {
    return null;
  }
}

async function fetchBrowardTax(folio: string): Promise<TaxRecord | null> {
  try {
    return await withBrowser(async ({ context }) => {
      const page = await context.newPage();
      const url = `https://county-taxes.net/broward/property?folio=${encodeURIComponent(folio)}`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      const text = (await page.locator("body").textContent()) ?? "";
      const isDelinquent = /delinquent|past due|unpaid/i.test(text);
      return {
        folio,
        is_delinquent: isDelinquent,
        source_url: url,
      };
    });
  } catch {
    return null;
  }
}

async function fetchPalmBeachTax(folio: string): Promise<TaxRecord | null> {
  try {
    return await withBrowser(async ({ context }) => {
      const page = await context.newPage();
      const url = `https://www.pbctax.gov/property-tax-search?folio=${encodeURIComponent(folio)}`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      const text = (await page.locator("body").textContent()) ?? "";
      const isDelinquent = /delinquent|past due|unpaid/i.test(text);
      return {
        folio,
        is_delinquent: isDelinquent,
        source_url: url,
      };
    });
  } catch {
    return null;
  }
}

async function fetchMonroeTax(folio: string): Promise<TaxRecord | null> {
  try {
    return await withBrowser(async ({ context }) => {
      const page = await context.newPage();
      const url = `https://monroetaxcollector.com/property?folio=${encodeURIComponent(folio)}`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      const text = (await page.locator("body").textContent()) ?? "";
      const isDelinquent = /delinquent|past due|unpaid/i.test(text);
      return {
        folio,
        is_delinquent: isDelinquent,
        source_url: url,
      };
    });
  } catch {
    return null;
  }
}

// ============================================================================
// Public API
// ============================================================================

export async function fetchTaxRecord(folio: string, county: string): Promise<TaxRecord | null> {
  if (!folio) return null;
  const cached = await readCache(county, folio);
  if (cached) return cached;

  let rec: TaxRecord | null = null;
  switch (county) {
    case "Miami-Dade":
      rec = await fetchMiamiDadeTax(folio);
      break;
    case "Broward":
      rec = await fetchBrowardTax(folio);
      break;
    case "Palm Beach":
      rec = await fetchPalmBeachTax(folio);
      break;
    case "Monroe":
      rec = await fetchMonroeTax(folio);
      break;
  }
  if (rec) await writeCache(county, rec);
  return rec;
}

export async function hasRecentTaxDelinquency(folio: string, county: string): Promise<boolean> {
  const rec = await fetchTaxRecord(folio, county);
  return !!rec?.is_delinquent;
}
