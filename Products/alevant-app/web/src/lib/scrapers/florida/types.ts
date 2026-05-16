// Shared shapes for Florida county adapters and multimodal signal sources.
// Each adapter normalizes to these structures so the orchestrator can fuse them.
// v1.5: extended for permits, business filings, voter-roll, visual diff, NCOA, DMF.

export interface PropertyRecord {
  folio?: string;
  apn?: string;
  county: string;
  address: {
    line1: string;
    city: string;
    state: "FL";
    zip: string;
  };
  legal_description?: string;
  owner_name?: string;
  owner_mailing_address?: string;
  is_absentee_owner?: boolean;
  beds?: number;
  baths?: number;
  sqft?: number;
  lot_sqft?: number;
  year_built?: number;
  property_type?: string;
  use_code?: string;
  neighborhood?: string;
  assessed_value?: number;
  market_value?: number;
  homestead_exemption?: boolean;
  last_sale_date?: string;
  last_sale_price?: number;
  years_owned?: number;
  source_url?: string;
  /** True when the recorded owner is an LLC / corp / trust. Triggers Sunbiz enrichment. */
  is_entity_owner?: boolean;
}

export interface TaxRecord {
  folio?: string;
  current_year_tax?: number;
  is_delinquent: boolean;
  delinquent_amount?: number;
  delinquent_years?: number[];
  delinquent_since?: string; // ISO date — earliest delinquent year start
  source_url?: string;
}

export interface CourtFiling {
  case_number: string;
  case_type: "foreclosure" | "probate" | "divorce" | "other";
  filing_date: string;
  party_name: string;
  property_address?: string;
  source_url?: string;
}

export interface CodeEnforcementRecord {
  case_number: string;
  filing_date: string;
  status: "open" | "closed" | "in_compliance";
  property_address: string;
  violation_type?: string;
  source_url?: string;
}

export interface VacancyRecord {
  is_vacant: boolean;
  signal: "mail_forward" | "no_active_utilities" | "manual" | "usps_ncoa";
  detected_at?: string;
}

export interface STRMarketRecord {
  zip: string;
  adr_p50: number;
  adr_p75: number;
  occupancy_pct: number;
  revpar: number;
  active_listings_count: number;
  source: "airdna" | "scraped";
}

// ===========================================================================
// Multimodal Phase 1 signals
// ===========================================================================

export interface PermitRecord {
  jurisdiction: string;
  permit_number: string;
  permit_type: string;
  permit_class?: "stay" | "flip" | "unknown";
  issue_date: string;
  property_address: string;
  declared_value?: number;
  status?: string;
  source_url?: string;
}

export interface BusinessFiling {
  document_number: string;
  entity_name: string;
  entity_type?: string;
  status?: string; // ACTIVE | INACTIVE | DISSOLVED
  filing_date?: string;
  dissolution_date?: string;
  principal_address?: string;
  registered_agent_name?: string;
  officer_addresses?: string[];
  source_url?: string;
}

export interface VoterRollSnapshot {
  county: string;
  residence_address: string;
  snapshot_date: string;
  active_voter_count: number;
  total_voter_count: number;
  most_recent_registration?: string;
  // Computed by the diff helper, not the scrape itself:
  recent_drop?: boolean;
}

export interface RateGapEstimate {
  current_30yr_rate: number;
  estimated_owner_rate: number;
  gap_bps: number;
  /** tight: owner locked far below current; loose: minimal lock-in */
  strength: "tight" | "moderate" | "loose";
}

// ===========================================================================
// Multimodal Phase 2 signals
// ===========================================================================

export interface VisualDiff {
  current_image_date?: string;
  prior_image_date?: string;
  rating: "deterioration" | "renovation" | "no_change" | "not_comparable";
  confidence: number;
  vision_notes: string;
  model_version: string;
}

export interface NCOARecord {
  resident_name?: string;
  from_address: string;
  to_address?: string;
  forward_type?: "individual" | "family" | "business" | "none";
  effective_date?: string;
  source?: string;
}

export interface DMFRecord {
  full_name: string;
  date_of_birth?: string;
  date_of_death: string;
  state_of_residence?: string;
}

// ===========================================================================
// Fused output
// ===========================================================================

export interface FusedSignal {
  property: PropertyRecord;
  tax?: TaxRecord;
  court_filings: CourtFiling[];
  code_enforcement: CodeEnforcementRecord[];
  vacancy?: VacancyRecord;
  str_market?: STRMarketRecord;
  // multimodal phase 1
  permits?: PermitRecord[];
  business_filings?: BusinessFiling[];
  voter_snapshot?: VoterRollSnapshot;
  rate_gap?: RateGapEstimate;
  // multimodal phase 2
  visual_diff?: VisualDiff;
  ncoa?: NCOARecord;
  dmf?: DMFRecord;
  fetched_at: string;
}
