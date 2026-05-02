// Shared types + helpers for the Cockpit (page.tsx + CockpitClient.tsx).
// Lives here because Next.js page files only allow specific named exports
// (default + metadata + revalidate, etc.).

export interface CockpitAction {
  type: string;
  priority: number;
  title: string;
  detail: string;
  href: string;
  badge: string;
  badgeTone: "hot" | "warm" | "cold" | "indigo" | "brass" | "neutral";
}

export function fmtP(v: number): string {
  if (!v) return "";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v}`;
}
