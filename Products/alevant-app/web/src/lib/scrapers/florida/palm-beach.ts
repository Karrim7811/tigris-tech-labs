// Palm Beach County Property Appraiser (PAPA) adapter.
// Source: https://www.pbcgov.com/papa/
//
// PAPA offers a JSON parcel-detail endpoint behind their public REST gateway.
// V1: stub with documented endpoint.

import type { PropertyRecord } from "./types";
import { withBrowser } from "../playwright";

interface PAPASearchResult {
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

interface PAPASaleHistory {
  DateOfSale: string;
  SalePrice: number;
}

export async function searchPalmBeachByAddress(address: string, limit = 5): Promise<PAPASearchResult[]> {
  return await withBrowser(async ({ page }) => {
    await page.goto("https://www.pbcgov.com/papa/property-search", { waitUntil: "networkidle" });

    // Fill address search form
    await page.fill('input[name="propertyAddress"]', address);
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");

    // Parse results table
    const results = await page.$$eval("table.propertySearchResults tr.dataRow", (rows) =>
      rows.slice(0, limit).map((row) => {
        const cells = Array.from(row.querySelectorAll("td")).map((td) => td.textContent?.trim() || "");
        return {
          Folio: cells[0] || "",
          Address: cells[1] || "",
          City: cells[2] || "",
          Zip: cells[3] || "",
          Owner1: cells[4] || "",
          Owner2: cells[5] || "",
          MailingAddress: cells[6] || "",
          TrueMarketValue: parseFloat(cells[7]?.replace(/[$,]/g, "") || "0") || undefined,
          AssessedValue: parseFloat(cells[8]?.replace(/[$,]/g, "") || "0") || undefined,
          YearBuilt: parseInt(cells[9] || "0") || undefined,
          Bedroom: parseInt(cells[10] || "0") || undefined,
          Bath: parseFloat(cells[11] || "0") || undefined,
          AdjustedSqFt: parseFloat(cells[12]?.replace(/[$,]/g, "") || "0") || undefined,
          LotSize: parseFloat(cells[13]?.replace(/[$,]/g, "") || "0") || undefined,
          DOR_Code: cells[14] || undefined,
          HomesteadExemption: cells[15]?.toLowerCase().includes("yes") || false,
        };
      })
    );

    return results;
  });
}

export async function getPalmBeachSaleHistory(folio: string): Promise<PAPASaleHistory[]> {
  return await withBrowser(async ({ page }) => {
    await page.goto(`https://www.pbcgov.com/papa/property-detail/${folio}`, { waitUntil: "networkidle" });

    // Parse sale history table
    const sales = await page.$$eval("table.saleHistoryTable tr.dataRow", (rows) =>
      rows.map((row) => {
        const cells = Array.from(row.querySelectorAll("td")).map((td) => td.textContent?.trim() || "");
        return {
          DateOfSale: cells[0] || "",
          SalePrice: parseFloat(cells[1]?.replace(/[$,]/g, "") || "0") || 0,
        };
      })
    );

    return sales;
  });
}

export function normalizePalmBeach(hit: PAPASearchResult, sales: PAPASaleHistory[] = []): PropertyRecord {
  const lastSale = sales[0];
  const yearsOwned = lastSale
    ? Math.max(0, new Date().getFullYear() - new Date(lastSale.DateOfSale).getFullYear())
    : undefined;

  // Absentee = mailing address ZIP differs from property ZIP, or out-of-state.
  const mailing = hit.MailingAddress || "";
  const isAbsentee = mailing.length > 0 && !mailing.includes(hit.Zip);

  return {
    folio: hit.Folio,
    county: "Palm Beach",
    address: {
      line1: hit.Address,
      city: hit.City,
      state: "FL",
      zip: hit.Zip,
    },
    owner_name: [hit.Owner1, hit.Owner2].filter(Boolean).join(" & "),
    owner_mailing_address: mailing,
    is_absentee_owner: isAbsentee,
    beds: hit.Bedroom,
    baths: hit.Bath,
    sqft: hit.AdjustedSqFt,
    lot_sqft: hit.LotSize,
    year_built: hit.YearBuilt,
    use_code: hit.DOR_Code,
    market_value: hit.TrueMarketValue,
    assessed_value: hit.AssessedValue,
    homestead_exemption: hit.HomesteadExemption,
    last_sale_date: lastSale?.DateOfSale,
    last_sale_price: lastSale?.SalePrice,
    years_owned: yearsOwned,
    source_url: `https://www.pbcgov.com/papa/property-detail/${hit.Folio}`,
  };
}

export async function fetchPalmBeachPropertyByAddress(address: string): Promise<PropertyRecord | null> {
  try {
    const hits = await searchPalmBeachByAddress(address, 1);
    if (!hits.length) return null;
    const hit = hits[0];
    const sales = await getPalmBeachSaleHistory(hit.Folio).catch(() => []);
    return normalizePalmBeach(hit, sales);
  } catch (error) {
    console.error("Palm Beach PA search failed:", error);
    return null;
  }
}
