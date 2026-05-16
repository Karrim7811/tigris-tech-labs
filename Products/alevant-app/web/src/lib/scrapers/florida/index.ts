// Florida public-records + multimodal orchestrator.
// Given an address (or folio), fan out to every signal source and produce a fused
// signal shaped for the Grid scoring engine.
//
// v1.5: adds permits, sunbiz business filings, voter-roll diff, rate-gap, StreetView
// visual diff, NCOA mail-forward, DMF death index. Every additional source degrades
// gracefully via .catch(() => undefined); a missing visual diff doesn't kill a scan.

import { fetchMiamiDadePropertyByAddress } from "./miami-dade";
import { fetchBrowardPropertyByAddress } from "./broward";
import { fetchPalmBeachPropertyByAddress } from "./palm-beach";
import { fetchMonroePropertyByAddress } from "./monroe";
import { fetchAllCourtFilings } from "./clerk-of-court";
import { fetchTaxRecord } from "./tax-collector";
import { fetchCodeEnforcementRecords } from "./code-enforcement";
import { fetchPermits, detectFlipPattern, detectStayPattern } from "./permits";
import { fetchBusinessFilingByEntity, isRecentDissolution } from "./sunbiz";
import { detectRecentVoterDrop } from "./voter-roll";
import { estimateRateGap } from "./rate-gap";
import { fetchVisualDiff } from "../visual/streetview-diff";
import { fetchNCOA, isRecentForward } from "../usps/ncoa";
import { fetchDMF, isRecentDeath } from "../dmf/death-master-file";
import { fetchSTRMarket } from "../airdna";
import type { FusedSignal } from "./types";

export type FloridaCounty = "Miami-Dade" | "Broward" | "Palm Beach" | "Monroe";

const COUNTY_BY_ZIP: Record<string, FloridaCounty> = {
  // Miami-Dade (partial — extend over time)
  "33101": "Miami-Dade","33125": "Miami-Dade","33126": "Miami-Dade","33127": "Miami-Dade",
  "33128": "Miami-Dade","33129": "Miami-Dade","33130": "Miami-Dade","33131": "Miami-Dade",
  "33132": "Miami-Dade","33133": "Miami-Dade","33134": "Miami-Dade","33135": "Miami-Dade",
  "33136": "Miami-Dade","33137": "Miami-Dade","33138": "Miami-Dade","33139": "Miami-Dade",
  "33140": "Miami-Dade","33141": "Miami-Dade","33142": "Miami-Dade","33143": "Miami-Dade",
  "33144": "Miami-Dade","33145": "Miami-Dade","33146": "Miami-Dade","33147": "Miami-Dade",
  "33149": "Miami-Dade","33150": "Miami-Dade","33155": "Miami-Dade","33156": "Miami-Dade",
  "33157": "Miami-Dade","33158": "Miami-Dade","33161": "Miami-Dade","33162": "Miami-Dade",
  "33165": "Miami-Dade","33166": "Miami-Dade","33167": "Miami-Dade","33168": "Miami-Dade",
  "33169": "Miami-Dade","33170": "Miami-Dade","33172": "Miami-Dade","33173": "Miami-Dade",
  "33174": "Miami-Dade","33175": "Miami-Dade","33176": "Miami-Dade","33177": "Miami-Dade",
  "33178": "Miami-Dade","33179": "Miami-Dade","33180": "Miami-Dade","33181": "Miami-Dade",
  "33182": "Miami-Dade","33183": "Miami-Dade","33184": "Miami-Dade","33185": "Miami-Dade",
  "33186": "Miami-Dade","33187": "Miami-Dade","33189": "Miami-Dade","33190": "Miami-Dade",
  "33193": "Miami-Dade","33194": "Miami-Dade","33196": "Miami-Dade",
  // Broward
  "33004": "Broward","33009": "Broward","33019": "Broward","33020": "Broward","33021": "Broward",
  "33023": "Broward","33024": "Broward","33025": "Broward","33026": "Broward","33027": "Broward",
  "33060": "Broward","33062": "Broward","33063": "Broward","33064": "Broward","33065": "Broward",
  "33066": "Broward","33067": "Broward","33068": "Broward","33069": "Broward","33071": "Broward",
  "33301": "Broward","33304": "Broward","33305": "Broward","33306": "Broward","33308": "Broward",
  "33309": "Broward","33311": "Broward","33312": "Broward","33314": "Broward","33316": "Broward",
  "33317": "Broward","33319": "Broward","33321": "Broward","33322": "Broward","33323": "Broward",
  "33324": "Broward","33325": "Broward","33326": "Broward","33327": "Broward","33328": "Broward",
  "33330": "Broward","33331": "Broward","33332": "Broward","33334": "Broward","33351": "Broward",
  "33359": "Broward","33388": "Broward","33394": "Broward",
  // Palm Beach
  "33401":"Palm Beach","33403":"Palm Beach","33404":"Palm Beach","33405":"Palm Beach","33406":"Palm Beach",
  "33407":"Palm Beach","33408":"Palm Beach","33409":"Palm Beach","33410":"Palm Beach","33411":"Palm Beach",
  "33412":"Palm Beach","33413":"Palm Beach","33414":"Palm Beach","33415":"Palm Beach","33417":"Palm Beach",
  "33418":"Palm Beach","33426":"Palm Beach","33428":"Palm Beach","33430":"Palm Beach","33431":"Palm Beach",
  "33432":"Palm Beach","33433":"Palm Beach","33434":"Palm Beach","33435":"Palm Beach","33436":"Palm Beach",
  "33437":"Palm Beach","33440":"Palm Beach","33441":"Palm Beach","33442":"Palm Beach","33444":"Palm Beach",
  "33445":"Palm Beach","33446":"Palm Beach","33447":"Palm Beach","33448":"Palm Beach","33449":"Palm Beach",
  "33458":"Palm Beach","33460":"Palm Beach","33461":"Palm Beach","33462":"Palm Beach","33463":"Palm Beach",
  "33467":"Palm Beach","33469":"Palm Beach","33470":"Palm Beach","33471":"Palm Beach","33472":"Palm Beach",
  "33473":"Palm Beach","33474":"Palm Beach","33475":"Palm Beach","33476":"Palm Beach","33477":"Palm Beach",
  "33478":"Palm Beach","33480":"Palm Beach","33481":"Palm Beach","33482":"Palm Beach","33483":"Palm Beach",
  "33484":"Palm Beach","33486":"Palm Beach","33487":"Palm Beach","33488":"Palm Beach","33493":"Palm Beach",
  "33496":"Palm Beach","33498":"Palm Beach",
  // Monroe (Keys)
  "33036":"Monroe","33037":"Monroe","33040":"Monroe","33041":"Monroe","33042":"Monroe",
  "33045":"Monroe","33050":"Monroe","33051":"Monroe","33070":"Monroe","33090":"Monroe",
};

export function countyForZip(zip: string): FloridaCounty | null {
  return COUNTY_BY_ZIP[zip] || null;
}

export interface FuseAddressOptions {
  address: string;
  zip?: string;
  county?: FloridaCounty;
  include_str_market?: boolean;
  include_visual?: boolean;
  include_ncoa?: boolean;
  include_dmf?: boolean;
}

export async function fuseAddressSignals({
  address,
  zip,
  county,
  include_str_market = false,
  include_visual = false,
  include_ncoa = false,
  include_dmf = false,
}: FuseAddressOptions): Promise<FusedSignal | null> {
  const resolvedCounty: FloridaCounty =
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

  const jurisdiction = jurisdictionForAddress(property.address.city);

  // 2-N. Parallel fan-out for every signal source.
  const [
    court_filings,
    tax,
    code_enforcement,
    permits,
    business_filing,
    voter_diff,
    str_market,
    visual_diff,
    ncoa,
    dmf,
  ] = await Promise.all([
    fetchAllCourtFilings({
      county: resolvedCounty,
      property_address: address,
      party_name: property.owner_name,
    }).catch(() => []),
    property.folio
      ? fetchTaxRecord(property.folio, resolvedCounty).catch(() => null)
      : Promise.resolve(null),
    fetchCodeEnforcementRecords({
      jurisdiction,
      property_address: address,
      status: "open",
    }).catch(() => []),
    fetchPermits({
      jurisdiction,
      property_address: address,
      window_days: 540,
    }).catch(() => []),
    property.is_entity_owner && property.owner_name
      ? fetchBusinessFilingByEntity(property.owner_name).catch(() => null)
      : Promise.resolve(null),
    detectRecentVoterDrop(resolvedCounty, address).catch(
      () => ({ recent_drop: false, latest: undefined } as { recent_drop: boolean; latest: undefined })
    ),
    include_str_market && property.address.zip
      ? fetchSTRMarket(property.address.zip).catch(() => null)
      : Promise.resolve(null),
    include_visual
      ? fetchVisualDiff(address, property.address.zip).catch(() => null)
      : Promise.resolve(null),
    include_ncoa
      ? fetchNCOA(property.owner_mailing_address ?? address, property.owner_name).catch(() => null)
      : Promise.resolve(null),
    include_dmf && property.owner_name
      ? fetchDMF(property.owner_name, "FL").catch(() => null)
      : Promise.resolve(null),
  ]);

  // Compute rate gap from sale/refi date (synchronous, no I/O)
  const rate_gap = estimateRateGap({
    last_sale_date: property.last_sale_date,
  }) || undefined;

  // Annotate voter snapshot with the diff result
  const voter_snapshot = voter_diff.latest
    ? { ...voter_diff.latest, recent_drop: voter_diff.recent_drop }
    : undefined;

  return {
    property,
    tax: tax || undefined,
    court_filings,
    code_enforcement,
    permits: permits.length ? permits : undefined,
    business_filings: business_filing ? [business_filing] : undefined,
    voter_snapshot,
    rate_gap,
    str_market: str_market || undefined,
    visual_diff: visual_diff || undefined,
    ncoa: ncoa || undefined,
    dmf: dmf || undefined,
    fetched_at: new Date().toISOString(),
  };
}

function jurisdictionForAddress(city: string): string {
  const c = (city || "").toLowerCase();
  if (c.includes("miami beach")) return "miami-beach";
  if (c.includes("coral gables")) return "coral-gables";
  if (
    c.includes("fort lauderdale") ||
    c.includes("hollywood") ||
    c.includes("pompano") ||
    c.includes("davie") ||
    c.includes("coral springs") ||
    c.includes("sunrise") ||
    c.includes("plantation") ||
    c.includes("deerfield") ||
    c.includes("lauderhill")
  )
    return "broward";
  if (
    c.includes("west palm") ||
    c.includes("lake worth") ||
    c.includes("boynton") ||
    c.includes("delray") ||
    c.includes("jupiter") ||
    c.includes("royal palm") ||
    c.includes("lake worth beach")
  )
    return "palm-beach";
  if (c.includes("miami")) return "miami";
  return "miami-dade-unincorporated";
}

/** Convert a fused signal into the input shape consumed by the Grid scoring engine. */
export function fusedToGridInputs(fused: FusedSignal) {
  const p = fused.property;

  // Court-filing flags + dates
  const foreclosure = fused.court_filings.find((c) => c.case_type === "foreclosure");
  const probate = fused.court_filings.find((c) => c.case_type === "probate");
  const divorce = fused.court_filings.find((c) => c.case_type === "divorce");

  // Equity heuristic: assume 70% LTV at last sale; appreciation reduces LTV proportionally.
  const value = p.market_value || p.assessed_value || 0;
  const lastSalePrice = p.last_sale_price || 0;
  const yearsOwned = p.years_owned || 0;
  const estimatedMortgage = lastSalePrice
    ? Math.max(0, lastSalePrice * 0.7 * Math.max(0, 1 - yearsOwned * 0.04))
    : 0;
  const estimatedEquity = Math.max(0, value - estimatedMortgage);

  // Code enforcement most-recent open violation
  const codeOpen = fused.code_enforcement
    .filter((c) => c.status === "open")
    .sort((a, b) => (b.filing_date || "").localeCompare(a.filing_date || ""))[0];

  // Permits — classify the pattern
  const permit_flip = fused.permits ? detectFlipPattern(fused.permits, 180) : false;
  const permit_stay = fused.permits ? detectStayPattern(fused.permits, 365) : false;
  const permit_class = permit_flip ? "flip" : permit_stay ? "stay" : "unknown";
  const permit_recent_renovation =
    !!fused.permits?.length && fused.permits.some((p) => p.declared_value && p.declared_value >= 5000);

  // Business filing — dissolution flag
  const llc_dissolved =
    fused.business_filings?.some((b) => isRecentDissolution(b, 365)) ?? false;

  // NCOA / voter / DMF / visual flags
  const ncoa_mail_forward = fused.ncoa ? isRecentForward(fused.ncoa, 270) : false;
  const voter_dropped = !!fused.voter_snapshot?.recent_drop;
  const owner_death_at = fused.dmf?.date_of_death;

  const propertyCounty = p.county;
  const sources: string[] = [];
  switch (propertyCounty) {
    case "Miami-Dade": sources.push("miami_dade_pa"); break;
    case "Broward": sources.push("broward_pa"); break;
    case "Palm Beach": sources.push("palm_beach_pa"); break;
    case "Monroe": sources.push("monroe_pa"); break;
    default: sources.push("florida_public_records");
  }
  if (fused.tax) sources.push("tax_collector");
  if (fused.court_filings.length) sources.push("clerk_of_court");
  if (fused.code_enforcement.length) sources.push("code_enforcement");
  if (fused.permits?.length) sources.push("building_permits");
  if (fused.business_filings?.length) sources.push("sunbiz");
  if (fused.voter_snapshot) sources.push("voter_roll");
  if (fused.rate_gap) sources.push("rate_gap");
  if (fused.str_market) sources.push("str_market");
  if (fused.visual_diff) sources.push("streetview_visual");
  if (fused.ncoa) sources.push("usps_ncoa");
  if (fused.dmf) sources.push("ssa_dmf");

  return {
    apn: p.folio,
    county: p.county,
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
    // Distress flags + dates (engine consumes for decay)
    is_pre_foreclosure: !!foreclosure,
    pre_foreclosure_at: foreclosure?.filing_date,
    is_tax_delinquent: !!fused.tax?.is_delinquent,
    tax_delinquent_at: fused.tax?.delinquent_since,
    has_code_violations: !!codeOpen,
    code_violation_at: codeOpen?.filing_date,
    has_hoa_delinquency: false, // TODO: HOA adapter
    is_absentee_owner: !!p.is_absentee_owner,
    // Life event flags + dates
    is_probate: !!probate,
    probate_filing_at: probate?.filing_date,
    is_divorce: !!divorce,
    divorce_filing_at: divorce?.filing_date,
    is_senior_owner: false, // TODO: voter rolls / age proxies
    owner_death_at,
    // Multimodal
    permit_recent_renovation,
    permit_class,
    visual_diff: fused.visual_diff?.rating,
    ncoa_mail_forward,
    voter_dropped,
    llc_dissolved,
    rate_lock_strength: fused.rate_gap?.strength,
    // Vacancy: prefer NCOA over guess
    is_vacant: ncoa_mail_forward, // mail forwarded ≈ resident moved out
    data_sources: Array.from(new Set(sources)),
  };
}

function countyFromAddress(address: string): FloridaCounty | null {
  const normalized = address.toLowerCase();
  if (
    normalized.includes("key west") ||
    normalized.includes("marathon") ||
    normalized.includes("islamorada") ||
    normalized.includes("key largo") ||
    normalized.includes("florida keys")
  )
    return "Monroe";
  if (
    normalized.includes("palm beach") ||
    normalized.includes("west palm") ||
    normalized.includes("lake worth") ||
    normalized.includes("boynton") ||
    normalized.includes("delray") ||
    normalized.includes("jupiter") ||
    normalized.includes("royal palm")
  )
    return "Palm Beach";
  if (
    normalized.includes("fort lauderdale") ||
    normalized.includes("hollywood") ||
    normalized.includes("pompano") ||
    normalized.includes("davie") ||
    normalized.includes("coral springs") ||
    normalized.includes("sunrise") ||
    normalized.includes("plantation") ||
    normalized.includes("deerfield") ||
    normalized.includes("sunny isles") ||
    normalized.includes("lauderhill")
  )
    return "Broward";
  if (
    normalized.includes("miami") ||
    normalized.includes("miami beach") ||
    normalized.includes("coral gables") ||
    normalized.includes("homestead") ||
    normalized.includes("hialeah") ||
    normalized.includes("kendall") ||
    normalized.includes("south miami") ||
    normalized.includes("westchester")
  )
    return "Miami-Dade";
  return null;
}
