// Florida public-records orchestrator.
// Given an address (or folio), fan out to county adapters and produce a fused signal
// shaped for the Grid scoring engine.

import { fetchMiamiDadePropertyByAddress } from "./miami-dade";
import { fetchBrowardPropertyByAddress } from "./broward";
import { fetchPalmBeachPropertyByAddress } from "./palm-beach";
import { fetchMonroePropertyByAddress } from "./monroe";
import { fetchAllCourtFilings } from "./clerk-of-court";
import { fetchTaxRecord } from "./tax-collector";
import { fetchCodeEnforcementRecords } from "./code-enforcement";
import type { FusedSignal } from "./types";
import { fetchSTRMarket } from "../airdna";

export type FloridaCounty = "Miami-Dade" | "Broward" | "Palm Beach" | "Monroe";

const COUNTY_BY_ZIP: Record<string, FloridaCounty> = {
  // Miami-Dade (partial — extend over time)
  "33101": "Miami-Dade",
  "33125": "Miami-Dade",
  "33126": "Miami-Dade",
  "33127": "Miami-Dade",
  "33128": "Miami-Dade",
  "33129": "Miami-Dade",
  "33130": "Miami-Dade",
  "33131": "Miami-Dade",
  "33132": "Miami-Dade",
  "33133": "Miami-Dade",
  "33134": "Miami-Dade",
  "33135": "Miami-Dade",
  "33136": "Miami-Dade",
  "33137": "Miami-Dade",
  "33138": "Miami-Dade",
  "33139": "Miami-Dade",
  "33140": "Miami-Dade",
  "33141": "Miami-Dade",
  "33142": "Miami-Dade",
  "33143": "Miami-Dade",
  "33144": "Miami-Dade",
  "33145": "Miami-Dade",
  "33146": "Miami-Dade",
  "33147": "Miami-Dade",
  "33149": "Miami-Dade",
  "33150": "Miami-Dade",
  "33155": "Miami-Dade",
  "33156": "Miami-Dade",
  "33157": "Miami-Dade",
  "33158": "Miami-Dade",
  "33161": "Miami-Dade",
  "33162": "Miami-Dade",
  "33165": "Miami-Dade",
  "33166": "Miami-Dade",
  "33167": "Miami-Dade",
  "33168": "Miami-Dade",
  "33169": "Miami-Dade",
  "33170": "Miami-Dade",
  "33172": "Miami-Dade",
  "33173": "Miami-Dade",
  "33174": "Miami-Dade",
  "33175": "Miami-Dade",
  "33176": "Miami-Dade",
  "33177": "Miami-Dade",
  "33178": "Miami-Dade",
  "33179": "Miami-Dade",
  "33180": "Miami-Dade",
  "33181": "Miami-Dade",
  "33182": "Miami-Dade",
  "33183": "Miami-Dade",
  "33184": "Miami-Dade",
  "33185": "Miami-Dade",
  "33186": "Miami-Dade",
  "33187": "Miami-Dade",
  "33189": "Miami-Dade",
  "33190": "Miami-Dade",
  "33193": "Miami-Dade",
  "33194": "Miami-Dade",
  "33196": "Miami-Dade",
  // Broward County (partial — extend over time)
  "33004": "Broward",
  "33009": "Broward",
  "33019": "Broward",
  "33020": "Broward",
  "33021": "Broward",
  "33023": "Broward",
  "33024": "Broward",
  "33025": "Broward",
  "33026": "Broward",
  "33027": "Broward",
  "33060": "Broward",
  "33062": "Broward",
  "33063": "Broward",
  "33064": "Broward",
  "33065": "Broward",
  "33066": "Broward",
  "33067": "Broward",
  "33068": "Broward",
  "33069": "Broward",
  "33071": "Broward",
  "33301": "Broward",
  "33304": "Broward",
  "33305": "Broward",
  "33306": "Broward",
  "33308": "Broward",
  "33309": "Broward",
  "33311": "Broward",
  "33312": "Broward",
  "33314": "Broward",
  "33316": "Broward",
  "33317": "Broward",
  "33319": "Broward",
  "33321": "Broward",
  "33322": "Broward",
  "33323": "Broward",
  "33324": "Broward",
  "33325": "Broward",
  "33326": "Broward",
  "33327": "Broward",
  "33328": "Broward",
  "33330": "Broward",
  "33331": "Broward",
  "33332": "Broward",
  "33334": "Broward",
  "33351": "Broward",
  "33359": "Broward",
  "33388": "Broward",
  "33394": "Broward",
  // Palm Beach County (partial — extend over time)
  "33401": "Palm Beach",
  "33403": "Palm Beach",
  "33404": "Palm Beach",
  "33405": "Palm Beach",
  "33406": "Palm Beach",
  "33407": "Palm Beach",
  "33408": "Palm Beach",
  "33409": "Palm Beach",
  "33410": "Palm Beach",
  "33411": "Palm Beach",
  "33412": "Palm Beach",
  "33413": "Palm Beach",
  "33414": "Palm Beach",
  "33415": "Palm Beach",
  "33417": "Palm Beach",
  "33418": "Palm Beach",
  "33426": "Palm Beach",
  "33428": "Palm Beach",
  "33430": "Palm Beach",
  "33431": "Palm Beach",
  "33432": "Palm Beach",
  "33433": "Palm Beach",
  "33434": "Palm Beach",
  "33435": "Palm Beach",
  "33436": "Palm Beach",
  "33437": "Palm Beach",
  "33440": "Palm Beach",
  "33441": "Palm Beach",
  "33442": "Palm Beach",
  "33444": "Palm Beach",
  "33445": "Palm Beach",
  "33446": "Palm Beach",
  "33447": "Palm Beach",
  "33448": "Palm Beach",
  "33449": "Palm Beach",
  "33458": "Palm Beach",
  "33460": "Palm Beach",
  "33461": "Palm Beach",
  "33462": "Palm Beach",
  "33463": "Palm Beach",
  "33467": "Palm Beach",
  "33469": "Palm Beach",
  "33470": "Palm Beach",
  "33471": "Palm Beach",
  "33472": "Palm Beach",
  "33473": "Palm Beach",
  "33474": "Palm Beach",
  "33475": "Palm Beach",
  "33476": "Palm Beach",
  "33477": "Palm Beach",
  "33478": "Palm Beach",
  "33480": "Palm Beach",
  "33481": "Palm Beach",
  "33482": "Palm Beach",
  "33483": "Palm Beach",
  "33484": "Palm Beach",
  "33486": "Palm Beach",
  "33487": "Palm Beach",
  "33488": "Palm Beach",
  "33493": "Palm Beach",
  "33496": "Palm Beach",
  "33498": "Palm Beach",
  // Monroe County (Key West / Florida Keys)
  "33036": "Monroe",
  "33037": "Monroe",
  "33040": "Monroe",
  "33041": "Monroe",
  "33042": "Monroe",
  "33045": "Monroe",
  "33050": "Monroe",
  "33051": "Monroe",
  "33070": "Monroe",
  "33090": "Monroe",
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
    county || (zip ? countyForZip(zip) : null) || countyFromAddress(address) || "Miami-Dade";

  // 1. Property record (per-county adapter)
  let property = null;
  if (resolvedCounty === "Miami-Dade") {
    property = await fetchMiamiDadePropertyByAddress(address);
  } else if (resolvedCounty === "Broward") {
    property = await fetchBrowardPropertyByAddress(address);
  } else if (resolvedCounty === "Palm Beach") {
    property = await fetchPalmBeachPropertyByAddress(address);
  } else if (resolvedCounty === "Monroe") {
    property = await fetchMonroePropertyByAddress(address);
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
  if (c.includes("fort lauderdale") || c.includes("hollywood") || c.includes("pompano") || c.includes("davie") || c.includes("coral springs") || c.includes("sunrise") || c.includes("plantation") || c.includes("deerfield") || c.includes("lauderhill")) {
    return "broward";
  }
  if (c.includes("west palm") || c.includes("lake worth") || c.includes("boynton") || c.includes("delray") || c.includes("jupiter") || c.includes("royal palm") || c.includes("lake worth beach")) {
    return "palm-beach";
  }
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
    property_neighborhood: p.neighborhood,
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
    data_sources: [
      resolvedCounty === "Miami-Dade"
        ? "miami_dade_pa"
        : resolvedCounty === "Broward"
        ? "broward_pa"
        : resolvedCounty === "Palm Beach"
        ? "palm_beach_pa"
        : resolvedCounty === "Monroe"
        ? "monroe_pa"
        : "florida_public_records",
    ],
  };
}

function countyFromAddress(address: string): FloridaCounty | null {
  const normalized = address.toLowerCase();
  if (normalized.includes("key west") || normalized.includes("marathon") || normalized.includes("islamorada") || normalized.includes("key largo") || normalized.includes("florida keys")) {
    return "Monroe";
  }
  if (normalized.includes("palm beach") || normalized.includes("west palm") || normalized.includes("lake worth") || normalized.includes("boynton") || normalized.includes("delray") || normalized.includes("jupiter") || normalized.includes("royal palm")) {
    return "Palm Beach";
  }
  if (normalized.includes("fort lauderdale") || normalized.includes("hollywood") || normalized.includes("pompano") || normalized.includes("davie") || normalized.includes("coral springs") || normalized.includes("sunrise") || normalized.includes("plantation") || normalized.includes("deerfield") || normalized.includes("sunny isles") || normalized.includes("lauderhill")) {
    return "Broward";
  }
  if (normalized.includes("miami") || normalized.includes("miami beach") || normalized.includes("coral gables") || normalized.includes("homestead") || normalized.includes("hialeah") || normalized.includes("kendall") || normalized.includes("south miami") || normalized.includes("westchester")) {
    return "Miami-Dade";
  }
  return null;
}
