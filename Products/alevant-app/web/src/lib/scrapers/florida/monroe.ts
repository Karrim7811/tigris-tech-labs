// Monroe County (Florida Keys) Property Appraiser adapter.
// Source: https://qpublic.schneidercorp.com/Application.aspx?AppID=605&LayerID=9946
//
// Monroe uses the qPublic (Schneider Geospatial) platform — same as many smaller
// Florida counties. Driven by Playwright; parcel-detail rendered client-side.

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

export async function fetchMonroePropertyByAddress(
  address: string
): Promise<PropertyRecord | null> {
  try {
    return await withBrowser(async ({ context }) => {
      const page = await context.newPage();
      await page.goto(
        "https://qpublic.schneidercorp.com/Application.aspx?AppID=605&LayerID=9946&PageTypeID=2&PageID=4625",
        { waitUntil: "networkidle", timeout: 45_000 }
      );

      const agree = page.locator(
        'input[type="submit"][value*="Agree" i], button:has-text("Agree")'
      );
      if (await agree.count()) await agree.first().click().catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

      const input = page.locator('input[id*="Address" i], input[placeholder*="Address" i]');
      if (!(await input.count())) return null;
      await input.first().fill(address);
      await page.keyboard.press("Enter");
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

      const firstResult = page.locator("table tbody tr a").first();
      if (await firstResult.count()) await firstResult.click();
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

      const grab = async (label: string): Promise<string> => {
        const el = page.locator(
          `xpath=//th[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${label.toLowerCase()}')]/following-sibling::td[1] | //*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${label.toLowerCase()}')]/following-sibling::*[1]`
        );
        if (await el.count()) return (await el.first().textContent())?.trim() ?? "";
        return "";
      };

      const folio = (await grab("Parcel ID")) || (await grab("Parcel Number"));
      if (!folio) return null;
      const ownerName = await grab("Owner");
      const mailing = await grab("Mailing Address");
      const beds = parseNum(await grab("Bedrooms"));
      const baths = parseNum(await grab("Baths"));
      const sqft = parseNum(await grab("Heated SF"));
      const lot = parseNum(await grab("Lot Size"));
      const yearBuilt = parseNum(await grab("Year Built"));
      const marketValue = parseMoney(await grab("Just Value"));
      const assessedValue = parseMoney(await grab("Assessed Value"));
      const lastSaleDate = await grab("Sale Date");
      const lastSalePrice = parseMoney(await grab("Sale Price"));
      const homestead = /homestead/i.test(await grab("Exemptions"));

      const siteAddress = (await grab("Location Address")) || (await grab("Site Address")) || address;
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
        county: "Monroe",
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
        source_url: "https://qpublic.schneidercorp.com/Application.aspx?AppID=605&LayerID=9946",
      };
    });
  } catch {
    return null;
  }
}
