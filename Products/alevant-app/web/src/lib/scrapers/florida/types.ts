// Shared shapes for Florida county adapters.
// Each adapter normalizes to these structures so the orchestrator can fuse them.

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
  assessed_value?: number;
  market_value?: number;
  homestead_exemption?: boolean;
  last_sale_date?: string;
  last_sale_price?: number;
  years_owned?: number;
  source_url?: string;
}

export interface TaxRecord {
  folio?: string;
  current_year_tax?: number;
  is_delinquent: boolean;
  delinquent_amount?: number;
  delinquent_years?: number[];
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

/** Composite normalized record after all sources fuse. */
export interface FusedSignal {
  property: PropertyRecord;
  tax?: TaxRecord;
  court_filings: CourtFiling[];
  code_enforcement: CodeEnforcementRecord[];
  vacancy?: VacancyRecord;
  str_market?: STRMarketRecord;
  fetched_at: string;
}
