// Broward County Property Appraiser (BCPA) adapter.
// Source: https://web.bcpa.net/
//
// BCPA exposes a public address-search UI at /BcpaClient/#/Record-Search and an
// asmx-style services backend. There's no documented JSON API, so we use Playwright
// to drive the search UI and parse the rendered parcel-detail page.
//
// Cache: lookups are cheap to repeat, but BCPA throttles aggressive scrapers.
// Default to one request per 4s.

import type { PropertyRecord } from "./types";
import { withBrowser } from "../playwright";

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

export async function fetchBrowardPropertyByAddress(
  address: string
): Promise<PropertyRecord | null> {
  try {
    return await withBrowser(async ({ context }) => {
      const page = await context.newPage();
      await page.goto("https://web.bcpa.net/BcpaClient/#/Record-Search", {
        waitUntil: "networkidle",
        timeout: 45_000,
      });

      // Address-search input
      const input = page.locator('input[placeholder*="Address" i], input[id*="situs" i]');
      if (!(await input.count())) return null;
      await input.first().fill(address);
      await page.keyboard.press("Enter");
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

      // Click first result row if results are listed
      const firstResult = page.locator("a[href*='Record/']").first();
      if (await firstResult.count()) await firstResult.click();
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

      // BCPA parcel-detail page presents data in labelled sections; scrape by label.
      const grab = async (label: string): Promise<string> => {
        const el = page.locator(
          `xpath=//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${label.toLowerCase()}')]/following-sibling::*[1]`
        );
        if (await el.count()) return (await el.first().textContent())?.trim() ?? "";
        return "";
      };

      const folio = await grab("Folio");
      if (!folio) return null;
      const ownerName = await grab("Owner");
      const mailing = await grab("Mailing Address");
      const beds = parseNum(await grab("Bedrooms"));
      const baths = parseNum(await grab("Bathrooms"));
      const sqft = parseNum(await grab("Adjusted Building"));
      const lot = parseNum(await grab("Land Size"));
      const yearBuilt = parseNum(await grab("Effective Year"));
      const marketValue = parseMoney(await grab("Just / Market Value"));
      const assessedValue = parseMoney(await grab("Assessed"));
      const lastSaleDate = await grab("Date / Sale Price");
      const homestead = /homestead/i.test(await grab("Exemptions"));

      // Address breakdown
      const lineFull = (await grab("Site Address")) || address;
      const m = lineFull.match(/^(.*?),?\s+([A-Z .]+),\s+FL\s+(\d{5})/i);
      const line1 = m?.[1]?.trim() ?? address;
      const city = m?.[2]?.trim() ?? "";
      const zip = m?.[3]?.trim() ?? "";

      const lastSaleMatch = lastSaleDate.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})\s*\$?([\d,]+)?/);
      const lastSaleDateIso = lastSaleMatch?.[1] ? new Date(lastSaleMatch[1]).toISOString() : undefined;
      const lastSalePrice = parseMoney(lastSaleMatch?.[2]);

      const yearsOwned = lastSaleDateIso
        ? Math.max(0, new Date().getFullYear() - new Date(lastSaleDateIso).getFullYear())
        : undefined;

      const mailingZipMatch = mailing.match(/(\d{5})/);
      const isAbsentee = !!(mailingZipMatch && zip && mailingZipMatch[1] !== zip);

      const isEntity = /\b(LLC|LP|LLP|INC|CORP|TRUST|TR\b)\b/i.test(ownerName ?? "");

      return {
        folio,
        county: "Broward",
        address: { line1, city, state: "FL", zip },
        owner_name: ownerName,
        owner_mailing_address: mailing,
        is_absentee_owner: isAbsentee,
        is_entity_owner: isEntity,
        beds,
        baths,
        sqft,
        lot_sqft: lot,
        year_built: yearBuilt,
        market_value: marketValue,
        assessed_value: assessedValue,
        homestead_exemption: homestead,
        last_sale_date: lastSaleDateIso,
        last_sale_price: lastSalePrice,
        years_owned: yearsOwned,
        source_url: `https://web.bcpa.net/BcpaClient/#/Record/${encodeURIComponent(folio)}`,
      };
    });
  } catch {
    return null;
  }
}
