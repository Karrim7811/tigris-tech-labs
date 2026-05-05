// The Grid — Predictive Seller Lead Engine
// Composite motivation scoring 0-100 with weighted components.
// Phase 1: heuristic scoring with public-records inputs.
// Phase 2: ML-trained model on closed-listing outcomes.

export interface GridSignalInputs {
  // Tenure
  years_owned?: number;
  // Equity
  estimated_value?: number;
  estimated_mortgage_balance?: number;
  estimated_equity?: number;
  // Distress
  is_pre_foreclosure?: boolean;
  is_tax_delinquent?: boolean;
  has_code_violations?: boolean;
  has_hoa_delinquency?: boolean;
  is_vacant?: boolean;
  is_absentee_owner?: boolean;
  // Life event
  is_probate?: boolean;
  is_divorce?: boolean;
  is_senior_owner?: boolean;
  // Location
  property_neighborhood?: string;
  // Market
  neighborhood_absorption_rate?: number; // months of inventory; lower = sellers' market
}

export interface GridScoreResult {
  motivation_score: number;
  tenure_score: number;
  equity_score: number;
  distress_score: number;
  life_event_score: number;
  market_score: number;
}

// Weights sum to 100
const W = {
  tenure: 15,
  equity: 25,
  distress: 30,
  life_event: 20,
  market: 10,
};

export function scoreGridSignal(s: GridSignalInputs): GridScoreResult {
  // Tenure: peak score at 13+ years (US median tenure)
  const yo = s.years_owned ?? 0;
  const tenure_score = Math.max(0, Math.min(100, yo >= 13 ? 90 : yo >= 8 ? 65 : yo >= 5 ? 35 : 10));

  // Equity: higher equity ratio = more freedom to sell
  let equity_score = 0;
  if (s.estimated_value && s.estimated_value > 0) {
    const equity = s.estimated_equity ?? (s.estimated_value - (s.estimated_mortgage_balance ?? 0));
    const ratio = equity / s.estimated_value;
    equity_score = Math.max(0, Math.min(100, Math.round(ratio * 110)));
  } else if (s.estimated_equity != null) {
    equity_score = s.estimated_equity > 0 ? 60 : 0;
  }

  // Distress: any of these is a strong signal
  let distress_score = 0;
  if (s.is_pre_foreclosure) distress_score += 70;
  if (s.is_tax_delinquent) distress_score += 35;
  if (s.has_code_violations) distress_score += 20;
  if (s.has_hoa_delinquency) distress_score += 25;
  if (s.is_vacant) distress_score += 20;
  if (s.is_absentee_owner) distress_score += 15;
  distress_score = Math.min(100, distress_score);

  // Life event
  let life_event_score = 0;
  if (s.is_probate) life_event_score += 65;
  if (s.is_divorce) life_event_score += 50;
  if (s.is_senior_owner) life_event_score += 25;
  life_event_score = Math.min(100, life_event_score);

  // Market: lower absorption = stronger sellers' market
  let market_score = 50;
  if (s.neighborhood_absorption_rate != null) {
    const abs = s.neighborhood_absorption_rate;
    if (abs <= 2) market_score = 95;
    else if (abs <= 4) market_score = 75;
    else if (abs <= 6) market_score = 55;
    else if (abs <= 9) market_score = 35;
    else market_score = 15;
  }

  const motivation_score = Math.round(
    (tenure_score * W.tenure +
      equity_score * W.equity +
      distress_score * W.distress +
      life_event_score * W.life_event +
      market_score * W.market) /
      100
  );

  return {
    motivation_score,
    tenure_score,
    equity_score,
    distress_score,
    life_event_score,
    market_score,
  };
}

export function bandFromMotivationScore(score: number): "blazing" | "hot" | "warm" | "watch" {
  if (score >= 80) return "blazing";
  if (score >= 65) return "hot";
  if (score >= 45) return "warm";
  return "watch";
}
