// Florida public-records orchestrator.
// Given an address (or folio), fan out to county adapters and produce a fused signal
// shaped for the Grid scoring engine.

import { fetchMiamiDadePropertyByAddress } from "./miami-dade";
import { fetchBrowardPropertyByAddress } from "./broward";
import { fetchPalmBeachPropertyByAddress } from "./palm-beach";
import { fetchAllCourtFilings } from "./clerk-of-court";
import { fetchTaxRecord } from "./tax-collector";
import { fetchCodeEnforcementRecords } from "./code-enforcement";
import type { FusedSignal } from "./types";
import { fetchSTRMarket } from "../airdna";

export type FloridaCounty = "Miami-Dade" | "Broward" | "Palm Beach" | "Orange";

const COUNTY_BY_ZIP: Record<string, FloridaCounty> = {
  // Miami-Dade (partial — extend over time)
  "33101": "Miami-Dade", "33125": "Miami-Dade", "33126": "Miami-Dade", "33127": "Miami-Dade",
  "33128": "Miami-Dade", "33129": "Miami-Dade", "33130": "Miami-Dade", "33131": "Miami-Dade",
  "33132": "Miami-Dade", "33133": "Miami-Dade", "33134": "Miami-Dade", "33135": "Miami-Dade",
  "33136": "Miami-Dade", "33137": "Miami-Dade", "33138": "Miami-Dade", "33139": "Miami-Dade",
  "33140": "Miami-Dade", "33141": "Miami-Dade", "33142": "Miami-Dade", "33143": "Miami-Dade",
  "33144": "Miami-Dade", "33145": "Miami-Dade", "33146": "Miami-Dade", "33147": "Miami-Dade",
  "33149": "Miami-Dade", "33150": "Miami-Dade", "33155": "Miami-Dade", "33156": "Miami-Dade",
  "33157": "Miami-Dade", "33158": "Miami-Dade", "33161": "Miami-Dade", "33162": "Miami-Dade",
  "33165": "Miami-Dade", "33166": "Miami-Dade", "33167": "Miami-Dade", "33168": "Miami-Dade",
  "33169": "Miami-Dade", "33170": "Miami-Dade", "33172": "Miami-Dade", "33173": "Miami-Dade",
  "33174": "Miami-Dade", "33175": "Miami-Dade", "33176": "Miami-Dade", "33177": "Miami-Dade",
  "33178": "Miami-Dade", "33179": "Miami-Dade", "33180": "Miami-Dade", "33181": "Miami-Dade",
  "33182": "Miami-Dade", "33183": "Miami-Dade", "33184": "Miami-Dade", "33185": "Miami-Dade",
  "33186": "Miami-Dade", "33187": "Miami-Dade", "33189": "Miami-Dade", "33190": "Miami-Dade",
  "33193": "Miami-Dade", "33194": "Miami-Dade", "33196": "Miami-Dade",
};

export function countyForZip(zip: string): FloridaCounty | null {
  return COUNTY_BY_ZIP[zip] || null;
}

export interface FuseAddressOptions {
  address: string;
  zip?: string;
  county?: FloridaCounty;
  include_str_market?: boolean;
}

export async function fuseAddressSignals({
  address,
  zip,
  county,
  include_str_market = false,
}: FuseAddressOptions): Promise<FusedSignal | null> {
  const resolvedCounty: FloridaCounty | null =
    county || (zip ? countyForZip(zip) : null) || "Miami-Dade";

  // 1. Property record (per-county adapter)
  let property = null;
  if (resolvedCounty === "Miami-Dade") {
    property = await fetchMiamiDadePropertyByAddress(address);
  } else if (resolvedCounty === "Broward") {
    property = await fetchBrowardPropertyByAddress(address);
  } else if (resolvedCounty === "Palm Beach") {
    property = await fetchPalmBeachPropertyByAddress(address);
  }
  if (!property) return null;

  // 2-4. Parallel fan-out for filings / tax / code enforcement
  const [court_filings, tax, code_enforcement, str_market] = await Promise.all([
    fetchAllCourtFilings({
      county: resolvedCounty,
      property_address: address,
      party_name: property.owner_name,
    }).catch(() => []),
    property.folio
      ? fetchTaxRecord(property.folio, resolvedCounty).catch(() => null)
      : Promise.resolve(null),
    fetchCodeEnforcementRecords({
      jurisdiction: jurisdictionForAddress(property.address.city),
      property_address: address,
      status: "open",
    }).catch(() => []),
    include_str_market && property.address.zip
      ? fetchSTRMarket(property.address.zip).catch(() => null)
      : Promise.resolve(null),
  ]);

  return {
    property,
    tax: tax || undefined,
    court_filings,
    code_enforcement,
    str_market: str_market || undefined,
    fetched_at: new Date().toISOString(),
  };
}

function jurisdictionForAddress(city: string): string {
  const c = (city || "").toLowerCase();
  if (c.includes("miami beach")) return "miami-beach";
  if (c.includes("coral gables")) return "coral-gables";
  if (c.includes("miami")) return "miami";
  return "miami-dade-unincorporated";
}

/** Convert a fused signal into the input shape consumed by the Grid scoring engine. */
export function fusedToGridInputs(fused: FusedSignal) {
  const p = fused.property;
  const hasForeclosure = fused.court_filings.some((c) => c.case_type === "foreclosure");
  const hasProbate = fused.court_filings.some((c) => c.case_type === "probate");
  const hasDivorce = fused.court_filings.some((c) => c.case_type === "divorce");

  // Equity heuristic: assume 70% LTV at last sale; appreciation reduces LTV proportionally.
  const value = p.market_value || p.assessed_value || 0;
  const lastSalePrice = p.last_sale_price || 0;
  const yearsOwned = p.years_owned || 0;
  const estimatedMortgage = lastSalePrice
    ? Math.max(0, lastSalePrice * 0.7 * Math.max(0, 1 - yearsOwned * 0.04))
    : 0;
  const estimatedEquity = Math.max(0, value - estimatedMortgage);

  return {
    property_address: `${p.address.line1}, ${p.address.city}, ${p.address.state} ${p.address.zip}`,
    property_city: p.address.city,
    property_state: p.address.state,
    property_zip: p.address.zip,
    owner_name: p.owner_name,
    owner_mailing_address: p.owner_mailing_address,
    estimated_value: value,
    estimated_mortgage_balance: estimatedMortgage,
    estimated_equity: estimatedEquity,
    years_owned: yearsOwned,
    is_pre_foreclosure: hasForeclosure,
    is_tax_delinquent: !!fused.tax?.is_delinquent,
    has_code_violations: fused.code_enforcement.some((c) => c.status === "open"),
    is_absentee_owner: !!p.is_absentee_owner,
    is_probate: hasProbate,
    is_divorce: hasDivorce,
    is_senior_owner: false, // TODO: cross-ref voter rolls / age proxies
    has_hoa_delinquency: false, // TODO: HOA-specific adapter (per-association)
    is_vacant: false, // TODO: USPS NCOA when licensed
    data_sources: ["miami_dade_pa"],
  };
}
