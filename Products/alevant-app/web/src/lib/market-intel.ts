import { formatCurrency } from "./utils";

export type MarketSignalRow = {
  id: string;
  property_address?: string | null;
  property_city?: string | null;
  property_state?: string | null;
  property_zip?: string | null;
  county?: string | null;
  property_neighborhood?: string | null;
  motivation_score: number | string | null;
  estimated_value?: number | string | null;
  estimated_equity?: number | string | null;
  years_owned?: number | string | null;
  reasons_summary?: string | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  owner_email?: string | null;
};

export type MarketGroupLevel = "state" | "county" | "city" | "zip" | "neighborhood";

export interface MarketGroupSummary {
  level: MarketGroupLevel;
  key: string;
  count: number;
  avg_motivation: number;
  avg_value: number | null;
  avg_equity_pct: number | null;
  hot_share: number;
  top_signal?: {
    id: string;
    address: string;
    motivation_score: number;
    reasons_summary?: string | null;
  };
}

export interface MarketRecommendation extends MarketGroupSummary {
  recommendation_score: number;
}

export interface MarketOverview {
  total_signals: number;
  blazing: number;
  hot: number;
  warm: number;
  watch: number;
  average_motivation: number;
  top_states: MarketGroupSummary[];
  top_counties: MarketGroupSummary[];
  top_cities: MarketGroupSummary[];
  top_zips: MarketGroupSummary[];
  top_neighborhoods: MarketGroupSummary[];
}

function parseNumber(value?: number | string | null): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function safeText(value?: string | null): string {
  return value?.trim() || "Unknown";
}

const LEVEL_KEY: Record<MarketGroupLevel, keyof MarketSignalRow> = {
  state: "property_state",
  county: "county",
  city: "property_city",
  zip: "property_zip",
  neighborhood: "property_neighborhood",
};

function buildGroup(rows: MarketSignalRow[], level: MarketGroupLevel): MarketGroupSummary[] {
  const groups = new Map<string, {
    count: number;
    motivationSum: number;
    valueSum: number;
    valueCount: number;
    equityPctSum: number;
    equityPctCount: number;
    hotCount: number;
    topSignal?: MarketGroupSummary["top_signal"];
  }>();

  const keyName = LEVEL_KEY[level];

  rows.forEach((row) => {
    const key = safeText(row[keyName] as string | null);
    const motivation = parseNumber(row.motivation_score) ?? 0;
    const estimatedValue = parseNumber(row.estimated_value);
    const estimatedEquity = parseNumber(row.estimated_equity);

    let equityPct: number | null = null;
    if (estimatedValue != null && estimatedValue > 0 && estimatedEquity != null) {
      equityPct = (estimatedEquity / estimatedValue) * 100;
    }

    const group = groups.get(key) ?? {
      count: 0,
      motivationSum: 0,
      valueSum: 0,
      valueCount: 0,
      equityPctSum: 0,
      equityPctCount: 0,
      hotCount: 0,
      topSignal: undefined,
    };

    group.count += 1;
    group.motivationSum += motivation;
    if (estimatedValue != null) {
      group.valueSum += estimatedValue;
      group.valueCount += 1;
    }
    if (equityPct != null) {
      group.equityPctSum += equityPct;
      group.equityPctCount += 1;
    }
    if (motivation >= 65) {
      group.hotCount += 1;
    }

    const signalAddress = safeText(row.property_address || row.owner_name || "Unknown address");
    if (!group.topSignal || motivation > group.topSignal.motivation_score) {
      group.topSignal = {
        id: row.id,
        address: signalAddress,
        motivation_score: motivation,
        reasons_summary: row.reasons_summary,
      };
    }

    groups.set(key, group);
  });

  return Array.from(groups.entries())
    .map(([key, group]) => ({
      level,
      key,
      count: group.count,
      avg_motivation: group.count ? Math.round((group.motivationSum / group.count) * 10) / 10 : 0,
      avg_value: group.valueCount ? Math.round(group.valueSum / group.valueCount) : null,
      avg_equity_pct: group.equityPctCount ? Math.round((group.equityPctSum / group.equityPctCount) * 10) / 10 : null,
      hot_share: group.count ? Math.round((group.hotCount / group.count) * 100) : 0,
      top_signal: group.topSignal,
    }))
    .sort((a, b) => {
      if (b.avg_motivation !== a.avg_motivation) return b.avg_motivation - a.avg_motivation;
      return b.count - a.count;
    });
}

function computeRecommendationScore(group: MarketGroupSummary): number {
  return Math.round(
    group.avg_motivation * 1.4 +
    group.hot_share * 0.55 +
    Math.min(group.count, 40) * 0.25
  );
}

export function recommendMarketGroups(
  rows: MarketSignalRow[],
  level: MarketGroupLevel,
  limit = 5
): MarketRecommendation[] {
  return buildGroup(rows, level)
    .map((group) => ({
      ...group,
      recommendation_score: computeRecommendationScore(group),
    }))
    .filter((group) => group.key !== "Unknown" && group.count > 0)
    .sort((a, b) => b.recommendation_score - a.recommendation_score)
    .slice(0, limit);
}

export function summarizeGridSignals(rows: MarketSignalRow[]): MarketOverview {
  const total_signals = rows.length;
  let blazing = 0;
  let hot = 0;
  let warm = 0;
  let watch = 0;
  let motivationSum = 0;

  rows.forEach((row) => {
    const motivation = parseNumber(row.motivation_score) ?? 0;
    motivationSum += motivation;
    if (motivation >= 80) blazing += 1;
    else if (motivation >= 65) hot += 1;
    else if (motivation >= 45) warm += 1;
    else watch += 1;
  });

  return {
    total_signals,
    blazing,
    hot,
    warm,
    watch,
    average_motivation: total_signals ? Math.round((motivationSum / total_signals) * 10) / 10 : 0,
    top_states: buildGroup(rows, "state"),
    top_counties: buildGroup(rows, "county"),
    top_cities: buildGroup(rows, "city"),
    top_zips: buildGroup(rows, "zip"),
    top_neighborhoods: buildGroup(rows, "neighborhood"),
  };
}

export function formatMarketValue(value: number | null) {
  if (value == null) return "—";
  return formatCurrency(value, { compact: true });
}
