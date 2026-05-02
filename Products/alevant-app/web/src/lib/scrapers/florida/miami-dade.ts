// Miami-Dade County Property Appraiser adapter.
// Source: https://www.miamidade.gov/Apps/PA/PApublicservicesproxy/PaServicesProxy.ashx
// This is a publicly documented services proxy used by the official PA search UI.
// Responses are JSON; structure is stable across the production endpoints.

import type { PropertyRecord } from "./types";

const PA_BASE = "https://www.miamidade.gov/Apps/PA/PApublicservicesproxy/PaServicesProxy.ashx";

const ua = "ALEVANT/1.0 (real-estate-research; +https://alevant.ai/contact)";

interface PASearchHit {
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

interface PASaleHistory {
  DateOfSale: string;
  SalePrice: number;
}

/** Search Miami-Dade by free-form address text. Returns up to N hits. */
export async function searchMiamiDadeByAddress(address: string, limit = 5): Promise<PASearchHit[]> {
  const url = new URL(PA_BASE);
  url.searchParams.set("Operation", "GetPropertySearchByAddress");
  url.searchParams.set("clientAppName", "PropertySearch");
  url.searchParams.set("from", "1");
  url.searchParams.set("to", String(limit));
  url.searchParams.set("searchText", address);

  const r = await fetch(url, { headers: { "user-agent": ua, accept: "application/json" } });
  if (!r.ok) return [];
  const json = (await r.json().catch(() => null)) as { MinimumPropertyInfos?: PASearchHit[] } | null;
  return json?.MinimumPropertyInfos || [];
}

export async function searchMiamiDadeByFolio(folio: string): Promise<PASearchHit | null> {
  const url = new URL(PA_BASE);
  url.searchParams.set("Operation", "GetPropertyByFolio");
  url.searchParams.set("clientAppName", "PropertySearch");
  url.searchParams.set("folioNumber", folio);
  const r = await fetch(url, { headers: { "user-agent": ua, accept: "application/json" } });
  if (!r.ok) return null;
  return (await r.json().catch(() => null)) as PASearchHit | null;
}

export async function getMiamiDadeSaleHistory(folio: string): Promise<PASaleHistory[]> {
  const url = new URL(PA_BASE);
  url.searchParams.set("Operation", "GetSaleHistoryByFolio");
  url.searchParams.set("clientAppName", "PropertySearch");
  url.searchParams.set("folioNumber", folio);
  const r = await fetch(url, { headers: { "user-agent": ua, accept: "application/json" } });
  if (!r.ok) return [];
  const json = (await r.json().catch(() => null)) as { SaleHistory?: PASaleHistory[] } | null;
  return json?.SaleHistory || [];
}

/** Normalize a Miami-Dade PA hit into our universal PropertyRecord shape. */
export function normalizeMiamiDade(hit: PASearchHit, sales: PASaleHistory[] = []): PropertyRecord {
  const lastSale = sales[0];
  const yearsOwned = lastSale
    ? Math.max(0, new Date().getFullYear() - new Date(lastSale.DateOfSale).getFullYear())
    : undefined;

  // Absentee = mailing address ZIP differs from property ZIP, or out-of-state.
  const mailing = hit.MailingAddress || "";
  const isAbsentee = mailing.length > 0 && !mailing.includes(hit.Zip);

  return {
    folio: hit.Folio,
    county: "Miami-Dade",
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
    source_url: `https://www.miamidade.gov/Apps/PA/PropertySearch/#/?folio=${hit.Folio}`,
  };
}

export async function fetchMiamiDadePropertyByAddress(
  address: string
): Promise<PropertyRecord | null> {
  const hits = await searchMiamiDadeByAddress(address, 1);
  if (!hits.length) return null;
  const hit = hits[0];
  const sales = await getMiamiDadeSaleHistory(hit.Folio).catch(() => []);
  return normalizeMiamiDade(hit, sales);
}
