// The Grid — Predictive Seller Lead Engine
// Composite motivation scoring 0-100 with weighted components.
// v1.5 — adds signal recency / decay, engine versioning, and a hazard-model bridge.
//
// Phase 1: heuristic scoring with public-records inputs (THIS FILE).
// Phase 2: hazard-model probabilities (web/ml/hazard_model — Python). When v2 is in
// production and a workspace is flagged, the scoring path is bypassed and only the
// hazard model is used. v1.5 remains as fallback and for shadow comparison.

import { recencyMultiplier, type SignalClass } from "./grid-decay";

export const GRID_ENGINE_VERSION = "v1.5";

export interface GridSignalInputs {
  // Tenure
  years_owned?: number;
  // Equity
  estimated_value?: number;
  estimated_mortgage_balance?: number;
  estimated_equity?: number;
  // Distress (with optional effective_at for decay)
  is_pre_foreclosure?: boolean;
  pre_foreclosure_at?: Date | string;
  is_tax_delinquent?: boolean;
  tax_delinquent_at?: Date | string;
  has_code_violations?: boolean;
  code_violation_at?: Date | string;
  has_hoa_delinquency?: boolean;
  is_vacant?: boolean;
  is_absentee_owner?: boolean;
  // Life event
  is_probate?: boolean;
  probate_filing_at?: Date | string;
  is_divorce?: boolean;
  divorce_filing_at?: Date | string;
  is_senior_owner?: boolean;
  owner_death_at?: Date | string;
  // Multimodal v2
  permit_recent_renovation?: boolean;
  permit_class?: "stay" | "flip" | "unknown";
  visual_diff?: "deterioration" | "renovation" | "no_change" | "not_comparable";
  ncoa_mail_forward?: boolean;
  voter_dropped?: boolean;
  llc_dissolved?: boolean;
  rate_lock_strength?: "tight" | "moderate" | "loose"; // tight = unlikely to sell at current rates
  // Location
  property_neighborhood?: string;
  // Market
  neighborhood_absorption_rate?: number; // months of inventory; lower = sellers' market
  // Computation time (defaults to now)
  asof?: Date;
}

export interface GridScoreResult {
  motivation_score: number;
  tenure_score: number;
  equity_score: number;
  distress_score: number;
  life_event_score: number;
  market_score: number;
  // v1.5 transparency
  applied_decay: Record<string, number>; // per-class multiplier actually applied
  rate_lock_penalty: number; // points subtracted for tight rate-lock
  engine_version: string;
}

// Weights sum to 100
const W = {
  tenure: 15,
  equity: 25,
  distress: 30,
  life_event: 20,
  market: 10,
};

function clamp01_100(v: number): number {
  return Math.max(0, Math.min(100, v));
}

export function scoreGridSignal(s: GridSignalInputs): GridScoreResult {
  const asof = s.asof ?? new Date();
  const applied_decay: Record<string, number> = {};

  // ── Tenure: peak score at 13+ years (US median tenure)
  const yo = s.years_owned ?? 0;
  const tenure_score = clamp01_100(
    yo >= 13 ? 90 : yo >= 8 ? 65 : yo >= 5 ? 35 : 10
  );

  // ── Equity: higher equity ratio = more freedom to sell
  let equity_score = 0;
  if (s.estimated_value && s.estimated_value > 0) {
    const equity = s.estimated_equity ?? (s.estimated_value - (s.estimated_mortgage_balance ?? 0));
    const ratio = equity / s.estimated_value;
    equity_score = clamp01_100(Math.round(ratio * 110));
  } else if (s.estimated_equity != null) {
    equity_score = s.estimated_equity > 0 ? 60 : 0;
  }

  // ── Distress: decay-weighted accumulation
  let distress_score = 0;
  if (s.is_pre_foreclosure) {
    const m = recencyMultiplier(s.pre_foreclosure_at, "pre_foreclosure", asof);
    applied_decay.pre_foreclosure = m;
    distress_score += 70 * m;
  }
  if (s.is_tax_delinquent) {
    const m = recencyMultiplier(s.tax_delinquent_at, "tax_delinquent", asof);
    applied_decay.tax_delinquent = m;
    distress_score += 35 * m;
  }
  if (s.has_code_violations) {
    const m = recencyMultiplier(s.code_violation_at, "code_violation", asof);
    applied_decay.code_violation = m;
    distress_score += 20 * m;
  }
  if (s.has_hoa_delinquency) distress_score += 25; // no date yet — full weight
  if (s.is_vacant) distress_score += 20;
  if (s.is_absentee_owner) distress_score += 15;
  if (s.visual_diff === "deterioration") distress_score += 15;
  distress_score = clamp01_100(Math.round(distress_score));

  // ── Life event
  let life_event_score = 0;
  if (s.is_probate) {
    const m = recencyMultiplier(s.probate_filing_at, "probate", asof);
    applied_decay.probate = m;
    life_event_score += 65 * m;
  }
  if (s.is_divorce) {
    const m = recencyMultiplier(s.divorce_filing_at, "divorce", asof);
    applied_decay.divorce = m;
    life_event_score += 50 * m;
  }
  if (s.is_senior_owner) life_event_score += 25;
  if (s.owner_death_at) {
    const m = recencyMultiplier(s.owner_death_at, "owner_death", asof);
    applied_decay.owner_death = m;
    life_event_score += 55 * m;
  }
  if (s.ncoa_mail_forward) life_event_score += 25;
  if (s.voter_dropped) life_event_score += 20;
  if (s.llc_dissolved) life_event_score += 30;
  if (s.permit_class === "flip") life_event_score += 20;
  life_event_score = clamp01_100(Math.round(life_event_score));

  // ── Market: lower absorption = stronger sellers' market
  let market_score = 50;
  if (s.neighborhood_absorption_rate != null) {
    const abs = s.neighborhood_absorption_rate;
    if (abs <= 2) market_score = 95;
    else if (abs <= 4) market_score = 75;
    else if (abs <= 6) market_score = 55;
    else if (abs <= 9) market_score = 35;
    else market_score = 15;
  }

  // ── Rate-lock penalty (multimodal v2): tight rate-lock owners are unlikely to sell
  // even when other signals are strong. Penalize the equity component (proxy for
  // financial freedom-to-sell) rather than zero out the score.
  let rate_lock_penalty = 0;
  if (s.rate_lock_strength === "tight") rate_lock_penalty = 15;
  else if (s.rate_lock_strength === "moderate") rate_lock_penalty = 6;
  const adjusted_equity = Math.max(0, equity_score - rate_lock_penalty);

  // ── Permit-stay also dampens motivation (homeowner just invested in staying)
  let stay_penalty = 0;
  if (s.permit_class === "stay") stay_penalty = 8;
  if (s.visual_diff === "renovation" && s.permit_class !== "flip") stay_penalty += 4;

  const motivation_score = Math.round(
    (tenure_score * W.tenure +
      adjusted_equity * W.equity +
      distress_score * W.distress +
      life_event_score * W.life_event +
      market_score * W.market) /
      100
  ) - stay_penalty;

  return {
    motivation_score: clamp01_100(motivation_score),
    tenure_score,
    equity_score,
    distress_score,
    life_event_score,
    market_score,
    applied_decay,
    rate_lock_penalty,
    engine_version: GRID_ENGINE_VERSION,
  };
}

export function bandFromMotivationScore(score: number): "blazing" | "hot" | "warm" | "watch" {
  if (score >= 80) return "blazing";
  if (score >= 65) return "hot";
  if (score >= 45) return "warm";
  return "watch";
}

/** Per-class effective_at dates an orchestrator can pass to computeExpiresAt(). */
export function effectiveDatesFromInputs(s: GridSignalInputs): Partial<Record<SignalClass, Date | string | undefined>> {
  const out: Partial<Record<SignalClass, Date | string | undefined>> = {};
  if (s.is_pre_foreclosure) out.pre_foreclosure = s.pre_foreclosure_at;
  if (s.is_tax_delinquent) out.tax_delinquent = s.tax_delinquent_at;
  if (s.has_code_violations) out.code_violation = s.code_violation_at;
  if (s.is_probate) out.probate = s.probate_filing_at;
  if (s.is_divorce) out.divorce = s.divorce_filing_at;
  if (s.owner_death_at) out.owner_death = s.owner_death_at;
  if (s.is_absentee_owner) out.absentee_owner = new Date();
  if (s.is_vacant) out.vacant = new Date();
  if ((s.years_owned ?? 0) >= 13) out.long_tenure = new Date();
  if ((s.estimated_equity ?? 0) > 0 && (s.estimated_value ?? 0) > 0) {
    if ((s.estimated_equity ?? 0) / (s.estimated_value ?? 1) >= 0.5) out.high_equity = new Date();
  }
  if (s.permit_class === "flip") out.permit_flip_indicator = new Date();
  if (s.permit_class === "stay") out.permit_stay_indicator = new Date();
  if (s.visual_diff === "deterioration") out.visual_deterioration = new Date();
  if (s.visual_diff === "renovation") out.visual_renovation = new Date();
  if (s.ncoa_mail_forward) out.ncoa_forward = new Date();
  if (s.voter_dropped) out.voter_drop = new Date();
  if (s.llc_dissolved) out.llc_dissolution = new Date();
  return out;
}
