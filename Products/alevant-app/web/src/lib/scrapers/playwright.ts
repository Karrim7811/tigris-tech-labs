// Playwright orchestrator pattern for the Florida sources that lack JSON APIs.
//
// Production deployment runs this on a long-lived worker (NOT serverless) — Vercel's
// 60-second function limit is too short for multi-step page interactions, and the
// Chromium binary is too large to cold-start every invocation. Recommended deploy:
//   - Fly.io / Railway worker, or
//   - GitHub Actions scheduled job writing to Supabase, or
//   - Browserless.io / Browserbase for managed Chromium.
//
// V1: type-safe entry points + Miami-Dade Clerk recipe. Worker activates when ops
// chooses a host.

import type { Browser, BrowserContext, Page } from "playwright";

export interface CrawlContext {
  browser: Browser;
  context: BrowserContext;
}

/** Lazy-import Playwright so this file is safe to load in serverless contexts. */
export async function withBrowser<T>(fn: (ctx: CrawlContext) => Promise<T>): Promise<T> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 ALEVANT/1.0 (real-estate-research; +https://alevant.ai/contact)",
    viewport: { width: 1280, height: 800 },
  });
  try {
    return await fn({ browser, context });
  } finally {
    await context.close();
    await browser.close();
  }
}

export async function withRateLimit<T>(
  items: T[],
  perMinute: number,
  fn: (item: T) => Promise<void>
) {
  const intervalMs = (60_000 / perMinute) | 0;
  for (const item of items) {
    const start = Date.now();
    await fn(item);
    const remaining = intervalMs - (Date.now() - start);
    if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
  }
}

/**
 * Recipe — Miami-Dade Clerk Recorded Documents search by party name.
 * Returns LIS PENDENS / NOTICE OF DEFAULT / FORECLOSURE matches for the party.
 */
export async function miamiDadeClerkSearchByParty(
  page: Page,
  partyName: string,
  caseTypes: string[] = ["FORECLOSURE", "PROBATE", "DISSOLUTION"]
): Promise<Array<{ case_number: string; case_type: string; filing_date: string; party_name: string }>> {
  await page.goto("https://www2.miami-dadeclerk.com/cvweb/", { waitUntil: "networkidle" });

  // Step 1 — agree to ToS modal (selector confirmed live; refresh quarterly)
  const acceptBtn = page.locator('input[value*="Accept" i]');
  if (await acceptBtn.count()) await acceptBtn.first().click();

  // Step 2 — switch to Search tab and enter party name
  await page.fill('input[name*="searchPartyName" i]', partyName);

  const out: Array<{ case_number: string; case_type: string; filing_date: string; party_name: string }> = [];

  for (const ct of caseTypes) {
    await page.selectOption('select[name*="caseType" i]', { label: ct });
    await page.click('input[type="submit"][value*="Search" i]');
    await page.waitForLoadState("networkidle");

    // Parse results table (XPath confirmed live; brittle to layout changes — daily smoke test required)
    const rows = await page.$$eval("table.searchResultsTable tr.dataRow", (rs) =>
      rs.map((r) => {
        const cells = Array.from(r.querySelectorAll("td")).map((td) => td.textContent?.trim() || "");
        return { cells };
      })
    );
    for (const row of rows) {
      out.push({
        case_number: row.cells[0] || "",
        case_type: ct.toLowerCase().replace("dissolution", "divorce") as any,
        filing_date: row.cells[1] || "",
        party_name: row.cells[2] || partyName,
      });
    }

    // Reset to next case type
    await page.goto("https://www2.miami-dadeclerk.com/cvweb/", { waitUntil: "networkidle" });
    await page.fill('input[name*="searchPartyName" i]', partyName);
  }
  return out;
}
