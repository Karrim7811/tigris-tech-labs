// Grid v1.5 — signal TTL and decay
//
// Every signal class has a natural half-life. A foreclosure NOD is hot for 60-90 days;
// a probate filing is hot for 18 months; a code violation is hot for 30 days.
// Without decay, the model treats a 2024 foreclosure flag identically to one filed yesterday.
//
// This module is the single source of truth for signal-class TTL.

export type SignalClass =
  | "pre_foreclosure"
  | "probate"
  | "divorce"
  | "tax_delinquent"
  | "code_violation"
  | "absentee_owner"
  | "vacant"
  | "long_tenure"
  | "high_equity"
  | "permit_flip_indicator"
  | "permit_stay_indicator"
  | "llc_dissolution"
  | "voter_drop"
  | "ncoa_forward"
  | "visual_deterioration"
  | "visual_renovation"
  | "owner_death";

export const SIGNAL_TTL_DAYS: Record<SignalClass, number> = {
  // Distress (rapid)
  pre_foreclosure: 90,
  tax_delinquent: 180,
  code_violation: 60,
  // Life event (medium)
  probate: 540,
  divorce: 365,
  owner_death: 365,
  // Behavioral (medium)
  voter_drop: 270,
  ncoa_forward: 270,
  // Permits / visual
  permit_flip_indicator: 270,
  permit_stay_indicator: 540,
  visual_deterioration: 365,
  visual_renovation: 540,
  // Status (slow-moving / structural)
  absentee_owner: 365,
  vacant: 180,
  long_tenure: 730,
  high_equity: 730,
  // LLC / corporate
  llc_dissolution: 365,
};

/**
 * Compute the soonest expiry across a set of active signal classes given each one's
 * effective_at date. The earliest expiry wins because we want to *refresh* the bundle
 * before the most-recent-and-decaying signal goes stale.
 */
export function computeExpiresAt(
  signals: Partial<Record<SignalClass, Date | string | undefined>>,
  fallbackDays = 180
): Date {
  const expiries: number[] = [];
  for (const [cls, effective] of Object.entries(signals) as [SignalClass, Date | string | undefined][]) {
    if (!effective) continue;
    const eff = typeof effective === "string" ? new Date(effective) : effective;
    if (isNaN(eff.getTime())) continue;
    const ttl = SIGNAL_TTL_DAYS[cls];
    if (!ttl) continue;
    expiries.push(eff.getTime() + ttl * 86_400_000);
  }
  if (!expiries.length) {
    return new Date(Date.now() + fallbackDays * 86_400_000);
  }
  return new Date(Math.min(...expiries));
}

/**
 * Linear-decay recency multiplier in [0, 1]. Returns 1.0 at effective_at, 0.0 at expiry.
 * Used by scoreGridSignal when an "asof" parameter is provided.
 */
export function recencyMultiplier(
  effective_at: Date | string | undefined,
  signal_class: SignalClass,
  asof: Date = new Date()
): number {
  if (!effective_at) return 1;
  const eff = typeof effective_at === "string" ? new Date(effective_at) : effective_at;
  if (isNaN(eff.getTime())) return 1;
  const ttlMs = SIGNAL_TTL_DAYS[signal_class] * 86_400_000;
  const ageMs = asof.getTime() - eff.getTime();
  if (ageMs <= 0) return 1;
  if (ageMs >= ttlMs) return 0;
  return 1 - ageMs / ttlMs;
}

/** Convenience: is this signal class still inside its TTL window? */
export function isFresh(
  effective_at: Date | string | undefined,
  signal_class: SignalClass,
  asof: Date = new Date()
): boolean {
  return recencyMultiplier(effective_at, signal_class, asof) > 0;
}
