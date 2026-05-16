// Palm Beach County Property Appraiser (PAPA) adapter.
// Source: https://www.pbcgov.org/papa/
//
// PAPA has an ASP.NET-rendered search at /Asps/PropertySearch/PropertySearch.aspx
// and a parcel-detail page at /Asps/PropertyDetail/PropertyDetail.aspx. There is
// no documented JSON API, so we Playwright-drive both pages and parse labelled
// fields.

import type { PropertyRecord } from "./types";
import { withBrowser } from "../playwright";

// Legacy shapes kept for backward compatibility with lib/valuation.ts.
// The v1.5 entry point is fetchPalmBeachPropertyByAddress() below.
export interface PAPASearchResult {
  Folio: string;
  Address: string;
  City: string;
  Zip: string;
  Owner1: string;
  Owner2?: string;
  MailingAddress: string;
  TrueMarketValue?: number;
  AssessedValue?: number;
  YearBuilt?: number;
  Bedroom?: number;
  Bath?: number;
  AdjustedSqFt?: number;
  LotSize?: number;
  DOR_Code?: string;
  HomesteadExemption?: boolean;
}

export interface PAPASaleHistory {
  DateOfSale: string;
  SalePrice: number;
}

/**
 * Legacy comp-search export consumed by valuation.ts. The historical stub
 * returned empty data; the new Playwright-driven parcel-detail flow returns a
 * single best-match record. Until we wire a multi-result helper, this shim
 * returns at most one hit so valuation.ts continues to compile and degrades
 * gracefully.
 */
export async function searchPalmBeachByAddress(
  address: string,
  _limit = 5
): Promise<PAPASearchResult[]> {
  const rec = await fetchPalmBeachPropertyByAddress(address);
  if (!rec) return [];
  return [
    {
      Folio: rec.folio ?? "",
      Address: rec.address.line1,
      City: rec.address.city,
      Zip: rec.address.zip,
      Owner1: rec.owner_name ?? "",
      MailingAddress: rec.owner_mailing_address ?? "",
      TrueMarketValue: rec.market_value,
      AssessedValue: rec.assessed_value,
      YearBuilt: rec.year_built,
      Bedroom: rec.beds,
      Bath: rec.baths,
      AdjustedSqFt: rec.sqft,
      LotSize: rec.lot_sqft,
      HomesteadExemption: rec.homestead_exemption,
    },
  ];
}

/**
 * Legacy sale-history export consumed by valuation.ts. We only have the most
 * recent sale exposed via the parcel-detail page; richer history requires the
 * Palm Beach Clerk recorded-documents portal (separate sprint).
 */
export async function getPalmBeachSaleHistory(_folio: string): Promise<PAPASaleHistory[]> {
  return [];
}

function parseMoney(v: string | null | undefined): number | undefined {
  if (!v) return undefined;
  const n = parseFloat(v.replace(/[$,]/g, ""));
  return isNaN(n) ? undefined : n;
}

function parseNum(v: string | null | undefined): number | undefined {
  if (!v) return undefined;
  const n = parseFloat(v.replace(/[,]/g, ""));
  return isNaN(n) ? undefined : n;
}

export async function fetchPalmBeachPropertyByAddress(
  address: string
): Promise<PropertyRecord | null> {
  try {
    return await withBrowser(async ({ context }) => {
      const page = await context.newPage();
      await page.goto("https://www.pbcgov.org/papa/Asps/PropertySearch/PropertySearch.aspx", {
        waitUntil: "networkidle",
        timeout: 45_000,
      });
      const input = page.locator('input[id*="txtAddress" i], input[name*="Address" i]');
      if (!(await input.count())) return null;
      await input.first().fill(address);
      await page
        .click('input[type="submit"][value*="Search" i], button:has-text("Search")')
        .catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

      const firstResult = page.locator("a[href*='PropertyDetail']").first();
      if (await firstResult.count()) await firstResult.click();
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

      const grab = async (label: string): Promise<string> => {
        const el = page.locator(
          `xpath=//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${label.toLowerCase()}')]/following-sibling::*[1]`
        );
        if (await el.count()) return (await el.first().textContent())?.trim() ?? "";
        return "";
      };

      const folio = await grab("Parcel Control Number");
      if (!folio) return null;
      const ownerName = await grab("Owner");
      const mailing = await grab("Mailing Address");
      const beds = parseNum(await grab("Bedrooms"));
      const baths = parseNum(await grab("Full Baths"));
      const sqft = parseNum(await grab("Total Square Feet"));
      const lot = parseNum(await grab("Acres"));
      const yearBuilt = parseNum(await grab("Year Built"));
      const marketValue = parseMoney(await grab("Market Value"));
      const assessedValue = parseMoney(await grab("Assessed Value"));
      const lastSaleDate = await grab("Sales Date");
      const lastSalePrice = parseMoney(await grab("Sales Price"));
      const homestead = /homestead/i.test(await grab("Exemptions"));

      const siteAddress = (await grab("Location Address")) || address;
      const m = siteAddress.match(/^(.*?),?\s+([A-Z .]+),\s+FL\s+(\d{5})/i);
      const line1 = m?.[1]?.trim() ?? address;
      const city = m?.[2]?.trim() ?? "";
      const zip = m?.[3]?.trim() ?? "";

      const lastSaleDateIso = lastSaleDate ? new Date(lastSaleDate).toISOString() : undefined;
      const yearsOwned = lastSaleDateIso
        ? Math.max(0, new Date().getFullYear() - new Date(lastSaleDateIso).getFullYear())
        : undefined;

      const mailingZipMatch = mailing.match(/(\d{5})/);
      const isAbsentee = !!(mailingZipMatch && zip && mailingZipMatch[1] !== zip);
      const isEntity = /\b(LLC|LP|LLP|INC|CORP|TRUST|TR\b)\b/i.test(ownerName ?? "");

      return {
        folio,
        county: "Palm Beach",
        address: { line1, city, state: "FL", zip },
        owner_name: ownerName,
        owner_mailing_address: mailing,
        is_absentee_owner: isAbsentee,
        is_entity_owner: isEntity,
        beds,
        baths,
        sqft,
        lot_sqft: lot ? Math.round(lot * 43560) : undefined,
        year_built: yearBuilt,
        market_value: marketValue,
        assessed_value: assessedValue,
        homestead_exemption: homestead,
        last_sale_date: lastSaleDateIso,
        last_sale_price: lastSalePrice,
        years_owned: yearsOwned,
        source_url: `https://www.pbcgov.org/papa/Asps/PropertyDetail/PropertyDetail.aspx?parcel=${encodeURIComponent(
          folio
        )}`,
      };
    });
  } catch {
    return null;
  }
}
