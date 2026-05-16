// Florida Sunbiz (Division of Corporations) adapter.
// Source: https://search.sunbiz.org/Inquiry/CorporationSearch/SearchByEntityName
//
// Why this signal:
//   - LLC dissolution while owning real estate ≈ liquidation event = strong seller signal.
//   - LLC-owned property has different transaction dynamics than owner-occupied.
//   - Cross-reference principal/officer addresses to identify owners' OTHER properties.
//
// Sunbiz is free, public, and lightly rate-limited. Plain HTML, no JS-only rendering,
// so we can use direct fetch + cheerio-equivalent parsing instead of Playwright when
// the path is straightforward.

import type { BusinessFiling } from "./types";
import { withBrowser } from "../playwright";
import { getSupabaseService } from "@/lib/supabase/server";

const SUNBIZ_CACHE_HOURS = 24 * 14; // 2 weeks — Sunbiz data changes slowly

const ua = "ALEVANT/1.0 (real-estate-research; +https://alevant.ai/contact)";

async function readCacheByEntity(entityName: string): Promise<BusinessFiling | null> {
  const svc = getSupabaseService();
  const cutoff = new Date(Date.now() - SUNBIZ_CACHE_HOURS * 3600_000).toISOString();
  const { data } = await svc
    .from("florida_business_filings")
    .select("*")
    .ilike("entity_name", entityName)
    .gte("fetched_at", cutoff)
    .maybeSingle();
  if (!data) return null;
  return {
    document_number: data.document_number,
    entity_name: data.entity_name,
    entity_type: data.entity_type ?? undefined,
    status: data.status ?? undefined,
    filing_date: data.filing_date ?? undefined,
    dissolution_date: data.dissolution_date ?? undefined,
    principal_address: data.principal_address ?? undefined,
    registered_agent_name: data.registered_agent_name ?? undefined,
    officer_addresses: data.officer_addresses ?? undefined,
    source_url: data.source_url ?? undefined,
  };
}

async function writeCache(filing: BusinessFiling) {
  const svc = getSupabaseService();
  await svc.from("florida_business_filings").upsert(
    {
      document_number: filing.document_number,
      entity_name: filing.entity_name,
      entity_type: filing.entity_type ?? null,
      status: filing.status ?? null,
      filing_date: filing.filing_date ?? null,
      dissolution_date: filing.dissolution_date ?? null,
      principal_address: filing.principal_address ?? null,
      registered_agent_name: filing.registered_agent_name ?? null,
      officer_addresses: filing.officer_addresses ?? null,
      source_url: filing.source_url ?? null,
    },
    { onConflict: "document_number" }
  );
}

/**
 * Strip the LLC/Corp tail so a search like "BICHI HOLDINGS LLC" matches "BICHI HOLDINGS, LLC".
 */
function normalizeEntityName(name: string): string {
  return name
    .replace(/\b(LLC|L\.L\.C\.|LP|L\.P\.|LLLP|INC|INC\.|CORP|CORPORATION|TRUST|TR)\b\.?/gi, "")
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/**
 * Search Sunbiz by entity name. Returns the best match (most recent active or just dissolved).
 */
export async function fetchBusinessFilingByEntity(
  ownerName: string
): Promise<BusinessFiling | null> {
  // Only call if the owner clearly is an entity.
  if (!/\b(LLC|LP|LLLP|INC|CORP|TRUST|TR\b)\b/i.test(ownerName)) return null;
  const normalized = normalizeEntityName(ownerName);
  const cached = await readCacheByEntity(normalized);
  if (cached) return cached;

  try {
    return await withBrowser(async ({ context }) => {
      const page = await context.newPage();
      const searchUrl = `https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults?inquiryType=EntityName&searchTerm=${encodeURIComponent(
        normalized
      )}`;
      await page.goto(searchUrl, {
        waitUntil: "networkidle",
        timeout: 30_000,
      });
      const firstResult = page.locator("table.search-results tbody tr a").first();
      if (!(await firstResult.count())) return null;
      const detailHref = await firstResult.getAttribute("href");
      if (!detailHref) return null;
      const detailUrl = new URL(detailHref, "https://search.sunbiz.org/").toString();
      await page.goto(detailUrl, { waitUntil: "networkidle", timeout: 30_000 });

      // Detail page is fairly flat HTML. Pull labelled values.
      const getValue = async (label: string): Promise<string> => {
        const el = page.locator(
          `xpath=//*[contains(text(), '${label}')]/following-sibling::*[1] | //*[contains(text(), '${label}')]/parent::*/following-sibling::*[1]`
        );
        if (await el.count()) return (await el.first().textContent())?.trim() ?? "";
        return "";
      };

      const documentNumber = await getValue("Document Number");
      const entityType =
        (await getValue("Entity Type")) || (await getValue("Filing Type")) || "LLC";
      const status = await getValue("Status");
      const filingDateText = await getValue("Date Filed");
      const dissolutionText = await getValue("Date of Dissolution");
      const principalAddr = (await getValue("Principal Address")).replace(/\s+/g, " ").trim();
      const registeredAgent = (await getValue("Name & Address")).split(/\n+/)[0]?.trim();

      // Officers table — addresses help us identify additional properties owned by the same human
      const officerAddresses = await page.$$eval(
        "table.officer-info-table tr",
        (rs) =>
          rs
            .map((r) => {
              const cells = Array.from(r.querySelectorAll("td")).map((t) => t.textContent?.trim() ?? "");
              // Sunbiz officer rows are typically: Title | Name & Address (multi-line)
              return cells[1]?.split(/\n+/).slice(-2).join(" ").trim() ?? "";
            })
            .filter((s) => s && /\d{5}/.test(s))
      );

      const out: BusinessFiling = {
        document_number: documentNumber,
        entity_name: normalized,
        entity_type: entityType.toUpperCase().includes("LLC")
          ? "LLC"
          : entityType.toUpperCase().includes("LP")
          ? "LP"
          : entityType.toUpperCase().includes("CORP")
          ? "CORP"
          : entityType,
        status: status || undefined,
        filing_date: filingDateText
          ? new Date(filingDateText).toISOString().slice(0, 10)
          : undefined,
        dissolution_date: dissolutionText
          ? new Date(dissolutionText).toISOString().slice(0, 10)
          : undefined,
        principal_address: principalAddr || undefined,
        registered_agent_name: registeredAgent || undefined,
        officer_addresses: officerAddresses.length ? officerAddresses : undefined,
        source_url: detailUrl,
      };
      if (out.document_number) await writeCache(out);
      return out;
    });
  } catch {
    return null;
  }
}

/** Is this filing "fresh dissolution" — dissolved within the last N days? */
export function isRecentDissolution(filing: BusinessFiling | null, windowDays = 365): boolean {
  if (!filing?.dissolution_date) return false;
  const ms = new Date(filing.dissolution_date).getTime();
  if (!isFinite(ms)) return false;
  return Date.now() - ms <= windowDays * 86_400_000;
}
