// Underwriter prompts — Residential CMA + Investor MF / STR.

export const CMA_SYSTEM = `You are a residential Comparative Market Analysis engine.
You receive a subject property and a comp set. You return a structured CMA with:
- suggested list price
- low / high confidence interval
- selected comps with similarity scores
- 30-day and 90-day market trend percentages
- median days-on-market
- absorption rate (months of inventory)
- a 2-3 sentence narrative justification

Anchor your suggested price to recent sold comps within 0.5 miles, weighted by similarity in beds, baths, sqft, year built, and condition. Account for active competing listings. Return only JSON.`;

export const INVESTOR_SYSTEM = `You are an investor underwriting engine for residential and small-multifamily real estate.
You receive a subject property and assumptions and return:
- NOI, cap rate, cash-on-cash, GRM, DSCR
- BRRRR projection (ARV, rehab cost, refinance loan, cash remaining)
- STR projection if applicable (ADR, occupancy, RevPAR, annual revenue)
- FIRPTA flag if foreign seller
- 1031 exchange window if applicable
- sensitivity table (rate ±100bps, occupancy ±10%, expenses ±20%)
- a 2-3 sentence investor narrative

Use industry-standard assumptions where inputs are missing (e.g., 3% vacancy residential, 35-40% expense ratio, 25-year amortization). Be transparent about assumptions in the narrative. Return only JSON.`;

export interface CMAUserInput {
  subject: { address: string; beds: number; baths: number; sqft: number; year_built: number; lot_sqft?: number; property_type: string };
  comps: Array<{
    address: string;
    sold_price: number;
    sold_date: string;
    beds: number;
    baths: number;
    sqft: number;
    year_built: number;
    distance_miles: number;
  }>;
  market_state: { median_dom?: number; absorption_months?: number };
}

export function cmaUserPrompt(input: CMAUserInput): string {
  return `Subject:
${JSON.stringify(input.subject, null, 2)}

Comps:
${JSON.stringify(input.comps, null, 2)}

Market state:
${JSON.stringify(input.market_state, null, 2)}

Return JSON with shape:
{
  "subject_address": "...",
  "suggested_price": 0,
  "confidence_low": 0,
  "confidence_high": 0,
  "comp_set": [{"address":"...","sold_price":0,"sold_date":"...","sqft":0,"price_per_sqft":0,"distance_miles":0,"similarity_score":0}],
  "market_trend_30d_pct": 0,
  "market_trend_90d_pct": 0,
  "days_on_market_median": 0,
  "absorption_rate_months": 0,
  "narrative": "..."
}`;
}

export interface InvestorUserInput {
  subject: { address: string; price: number; units: number; sqft: number; year_built: number; property_type: string };
  rent_assumptions?: { gross_monthly_rent: number; vacancy_pct?: number; expense_ratio_pct?: number };
  financing?: { down_payment_pct: number; rate_pct: number; amortization_years: number };
  rehab?: { budget: number; timeline_months: number };
  str_market?: { adr: number; occupancy_pct: number };
  is_foreign_seller?: boolean;
  is_1031_active?: boolean;
}

export function investorUserPrompt(input: InvestorUserInput): string {
  return `Underwrite this acquisition. Return JSON only.
${JSON.stringify(input, null, 2)}

Shape:
{
  "subject_address": "...",
  "acquisition_price": 0,
  "noi": 0,
  "cap_rate_pct": 0,
  "cash_on_cash_pct": 0,
  "grm": 0,
  "dscr": 0,
  "brrrr": {"arv":0,"rehab_cost":0,"refinance_loan":0,"cash_remaining":0},
  "str_projection": {"adr":0,"occupancy_pct":0,"monthly_revpar":0,"annual_revenue":0},
  "firpta_flag": false,
  "exchange_1031_window_days": 0,
  "sensitivity": [{"variable":"...","delta":"...","result_delta":0}],
  "narrative": "..."
}`;
}
