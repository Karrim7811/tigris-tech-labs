// Rate-gap signal — "is this owner rate-locked into staying."
//
// If the owner refinanced or purchased at 3.0% in 2021 and the current 30-yr fixed
// is 7.0%, the implied moving cost (interest delta on a new mortgage) creates a
// strong NEGATIVE seller signal — these owners almost never sell at current rates.
//
// We estimate the owner's effective rate from:
//   - last_sale_date  (or refi date from public records when available)
//   - the historical 30-yr fixed at that date (FRED MORTGAGE30US series)
//
// Then compare to today's rate. Gap >= 250bps = tight rate-lock.

import type { RateGapEstimate } from "./types";

/**
 * Historical 30-year fixed rate from FRED's MORTGAGE30US weekly series.
 * In production this is a daily-cached fetch; for V1 we ship a piecewise table that
 * covers the relevant tenure window (2010 → present), updated quarterly.
 */
const HIST_30YR: Array<{ year: number; rate: number }> = [
  { year: 2010, rate: 4.69 },
  { year: 2011, rate: 4.45 },
  { year: 2012, rate: 3.65 },
  { year: 2013, rate: 3.98 },
  { year: 2014, rate: 4.17 },
  { year: 2015, rate: 3.85 },
  { year: 2016, rate: 3.65 },
  { year: 2017, rate: 3.99 },
  { year: 2018, rate: 4.54 },
  { year: 2019, rate: 3.94 },
  { year: 2020, rate: 3.11 },
  { year: 2021, rate: 2.96 },
  { year: 2022, rate: 5.34 },
  { year: 2023, rate: 6.81 },
  { year: 2024, rate: 6.72 },
  { year: 2025, rate: 6.42 },
  { year: 2026, rate: 6.15 },
];

/** Look up the 30-year fixed rate for a given year. Linearly interpolate near year boundaries. */
function historicalRate(year: number): number {
  const hit = HIST_30YR.find((h) => h.year === year);
  if (hit) return hit.rate;
  if (year < HIST_30YR[0].year) return HIST_30YR[0].rate;
  if (year > HIST_30YR[HIST_30YR.length - 1].year) return HIST_30YR[HIST_30YR.length - 1].rate;
  // Fallback: nearest neighbor
  return HIST_30YR.reduce(
    (best, h) => (Math.abs(h.year - year) < Math.abs(best.year - year) ? h : best),
    HIST_30YR[0]
  ).rate;
}

const CURRENT_30YR = HIST_30YR[HIST_30YR.length - 1].rate; // refreshed quarterly

export function estimateRateGap(opts: {
  last_sale_date?: string;
  /** If a later refinance is detected via public-records mortgage records, prefer it. */
  last_refi_date?: string;
}): RateGapEstimate | null {
  const refDate = opts.last_refi_date ?? opts.last_sale_date;
  if (!refDate) return null;
  const t = new Date(refDate).getTime();
  if (!isFinite(t)) return null;
  const refYear = new Date(t).getFullYear();
  const ownerRate = historicalRate(refYear);
  const gap_bps = Math.round((CURRENT_30YR - ownerRate) * 100);
  let strength: RateGapEstimate["strength"] = "loose";
  if (gap_bps >= 250) strength = "tight";
  else if (gap_bps >= 100) strength = "moderate";
  return {
    current_30yr_rate: CURRENT_30YR,
    estimated_owner_rate: ownerRate,
    gap_bps,
    strength,
  };
}
