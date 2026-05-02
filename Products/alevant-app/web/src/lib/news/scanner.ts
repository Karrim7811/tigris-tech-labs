// News & Intel scanner — fans out across 7 categories per workspace,
// fuses Perplexity output through Claude for severity classification, persists
// as news_alerts rows.

import { pplxQuery } from "@/lib/perplexity";
import { runClaudeJSON } from "@/lib/anthropic";

export type NewsCategory =
  | "market"
  | "listing"
  | "farm_zone"
  | "sphere"
  | "competitor"
  | "regulatory"
  | "mortgage_rates"
  | "pre_construction";

export interface NewsItem {
  category: NewsCategory;
  title: string;
  summary: string;
  source_name?: string;
  source_url?: string;
  severity: "info" | "watch" | "act";
  related_listing_id?: string;
  related_contact_id?: string;
  related_zip?: string;
  related_market?: string;
}

export interface ScanContext {
  workspace_id: string;
  market: string;                 // 'Miami'
  farm_zips: string[];
  active_listings: { id: string; address: string; price: number; zip?: string }[];
  agent_name: string;
  brokerage: string;
  competitor_brokerages?: string[];
}

const CLASSIFY_SYS = `You are a real-estate news triage editor.
Given a fetched news brief and the agent's context, output up to 6 distinct news items in JSON.
Each item must include: title (under 80 chars, headline-style), summary (under 200 chars, fact-anchored), severity ('info' | 'watch' | 'act').
'act' = something the agent should action this week (a listing they should call about, a regulatory change that affects an active deal, a comp that resets pricing).
'watch' = worth knowing, monitor.
'info' = background context.
Never invent facts. Only use facts present in the brief.
Return JSON: { items: [{ title, summary, severity, source_name?, source_url? }] }.`;

async function classify(brief: string): Promise<Pick<NewsItem, "title" | "summary" | "severity" | "source_name" | "source_url">[]> {
  try {
    const res = await runClaudeJSON<{ items: Pick<NewsItem, "title" | "summary" | "severity" | "source_name" | "source_url">[] }>({
      tier: "fast",
      system: CLASSIFY_SYS,
      user: brief,
      maxTokens: 1500,
    });
    return res.items || [];
  } catch {
    return [];
  }
}

export async function scanMarket(ctx: ScanContext): Promise<NewsItem[]> {
  const q = `${ctx.market} residential real-estate market this week. Median price changes, days on market, inventory, new construction announcements, mortgage rate impact. 3-5 specific developments with sources.`;
  const { text } = await pplxQuery(q, { recency: "week", max_tokens: 800 });
  const items = await classify(text);
  return items.map((i) => ({ ...i, category: "market" as const, related_market: ctx.market }));
}

export async function scanFarmZones(ctx: ScanContext): Promise<NewsItem[]> {
  if (!ctx.farm_zips.length) return [];
  const zipList = ctx.farm_zips.join(", ");
  const q = `Real-estate news in ${ctx.market} ZIP codes ${zipList}: new construction permits, large transactions, neighborhood developments, building openings. Last 7 days.`;
  const { text } = await pplxQuery(q, { recency: "week", max_tokens: 800 });
  const items = await classify(text);
  return items.map((i) => ({ ...i, category: "farm_zone" as const }));
}

export async function scanRegulatory(ctx: ScanContext): Promise<NewsItem[]> {
  const q = `Real-estate regulatory news this week affecting Florida agents: NAR settlement updates, TCPA enforcement, Fair Housing rulings, AI bot disclosure laws, MLS rule changes. Cite specific agencies.`;
  const { text } = await pplxQuery(q, { recency: "week", max_tokens: 600 });
  const items = await classify(text);
  return items.map((i) => ({ ...i, category: "regulatory" as const }));
}

export async function scanMortgageRates(): Promise<NewsItem[]> {
  const q = `30-year fixed mortgage rate this week — current rate, weekly change, Fed signals, jumbo rate divergence. Cite Freddie Mac PMMS or MBA.`;
  const { text } = await pplxQuery(q, { recency: "day", max_tokens: 400 });
  const items = await classify(text);
  return items.map((i) => ({ ...i, category: "mortgage_rates" as const }));
}

export async function scanPreConstruction(ctx: ScanContext): Promise<NewsItem[]> {
  const q = `${ctx.market} pre-construction condo / multifamily news: new tower launches, deposit milestone announcements, developer reputation changes, delivery delays. Cite specific projects and developers.`;
  const { text } = await pplxQuery(q, { recency: "week", max_tokens: 600 });
  const items = await classify(text);
  return items.map((i) => ({ ...i, category: "pre_construction" as const }));
}

export async function scanCompetitors(ctx: ScanContext): Promise<NewsItem[]> {
  const competitors = ctx.competitor_brokerages?.length
    ? ctx.competitor_brokerages.join(", ")
    : "Compass, Douglas Elliman, The Agency, Coldwell Banker";
  const q = `Top ${ctx.market} real-estate agents this week from ${competitors}: notable listings, record-price closings, new market entries. Specific addresses and prices.`;
  const { text } = await pplxQuery(q, { recency: "week", max_tokens: 600 });
  const items = await classify(text);
  return items.map((i) => ({ ...i, category: "competitor" as const }));
}

export async function scanListings(ctx: ScanContext): Promise<NewsItem[]> {
  if (!ctx.active_listings.length) return [];
  // Per-listing comp scan — focus on top 3 by price
  const top = [...ctx.active_listings].sort((a, b) => b.price - a.price).slice(0, 3);
  const items: NewsItem[] = [];
  for (const l of top) {
    const q = `Real-estate market activity within 0.5 miles of ${l.address} this week: new listings, recent sales, price drops, days-on-market trends. Cite addresses + prices.`;
    const { text } = await pplxQuery(q, { recency: "week", max_tokens: 500 });
    const classified = await classify(text);
    for (const c of classified) {
      items.push({ ...c, category: "listing", related_listing_id: l.id, related_zip: l.zip });
    }
  }
  return items;
}

export async function scanAll(ctx: ScanContext): Promise<NewsItem[]> {
  const [m, f, r, rates, p, c, l] = await Promise.all([
    scanMarket(ctx).catch(() => []),
    scanFarmZones(ctx).catch(() => []),
    scanRegulatory(ctx).catch(() => []),
    scanMortgageRates().catch(() => []),
    scanPreConstruction(ctx).catch(() => []),
    scanCompetitors(ctx).catch(() => []),
    scanListings(ctx).catch(() => []),
  ]);
  return [...m, ...f, ...r, ...rates, ...p, ...c, ...l];
}
