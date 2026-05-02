"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Newspaper } from "lucide-react";
import { AccordionSection } from "./AccordionSection";

interface NewsItem {
  id: string;
  category: string;
  severity: "info" | "watch" | "act" | string;
  title: string;
  summary?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  surfaced_at?: string | null;
  related_listing_id?: string | null;
  related_zip?: string | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  market: "Market",
  listing: "Listing",
  farm_zone: "Farm",
  sphere: "Sphere",
  competitor: "Competitor",
  regulatory: "Regulatory",
  mortgage_rates: "Rates",
  pre_construction: "Pre-Con",
};

const SEVERITY_BG: Record<string, string> = {
  act: "#B03A2E",
  watch: "#C4875A",
  info: "#3A3730",
};

function relativeTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  const ms = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const ALL_CATEGORIES = ["all", "market", "listing", "farm_zone", "regulatory", "mortgage_rates", "competitor", "pre_construction"] as const;

export function NewsFeedWidget({ items, defaultOpen = true }: { items: NewsItem[]; defaultOpen?: boolean }) {
  const [filter, setFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  const visible =
    filter === "all" ? items : items.filter((i) => i.category === filter);

  async function refresh() {
    setRefreshing(true);
    try {
      await fetch("/api/news/scan", { method: "POST" });
      window.location.reload();
    } catch {
      setRefreshing(false);
    }
  }

  const actCount = items.filter((i) => i.severity === "act").length;

  return (
    <AccordionSection
      id="news-intel"
      title="News & Intel"
      count={items.length}
      pulse={actCount > 0}
      defaultOpen={defaultOpen}
      right={
        <button
          onClick={refresh}
          disabled={refreshing}
          className="font-mono text-[9px] uppercase tracking-[0.18em] text-indigo hover:text-indigo-deep disabled:opacity-50"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {refreshing ? "Scanning…" : "REFRESH →"}
        </button>
      }
    >
      {/* Category filter row */}
      <div className="flex flex-wrap gap-1.5 px-6 py-3 border-b border-mist bg-bone/30">
        {ALL_CATEGORIES.map((cat) => {
          const label = cat === "all" ? "All" : CATEGORY_LABEL[cat] ?? cat;
          const count =
            cat === "all" ? items.length : items.filter((i) => i.category === cat).length;
          const active = filter === cat;
          if (cat !== "all" && count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] border transition-colors"
              style={{
                background: active ? "#1A1915" : "transparent",
                color: active ? "#FAFAF8" : "#5A5750",
                borderColor: active ? "#1A1915" : "#E8E5E0",
                fontFamily: "'Jost', sans-serif",
              }}
            >
              {label}
              <span className="ml-1.5 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* News grid (3 columns desktop, 1 mobile) */}
      {visible.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Newspaper className="w-5 h-5 text-stone mx-auto mb-3" strokeWidth={1.2} />
          <p className="text-sm text-stone mb-1">No alerts in this category yet.</p>
          <p className="text-xs text-stone">Scan runs at 7am + 5pm ET — or hit refresh.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {visible.slice(0, 12).map((n, i) => (
            <article
              key={n.id}
              className="px-5 py-4 transition-colors hover:bg-bone/40"
              style={{
                borderRight: i % 3 < 2 ? "1px solid var(--color-mist)" : undefined,
                borderBottom: "1px solid var(--color-mist)",
              }}
            >
              {/* Tag + headline */}
              <div className="flex items-start gap-2 mb-2.5">
                <span
                  className="text-[8px] uppercase tracking-[0.15em] text-parchment px-1.5 py-0.5 rounded-sm flex-shrink-0 mt-0.5"
                  style={{
                    background: SEVERITY_BG[n.severity] ?? SEVERITY_BG.info,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {(n.severity || "info").toUpperCase()}
                </span>
                <p className="text-[13px] text-ink leading-snug font-medium">{n.title}</p>
              </div>

              {/* Summary */}
              {n.summary && (
                <p className="text-[12px] text-smoke leading-relaxed mb-2.5 line-clamp-3">
                  {n.summary}
                </p>
              )}

              {/* Footer: category + source + time */}
              <div className="flex items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="text-[9px] uppercase tracking-[0.18em] text-indigo"
                    style={{ fontFamily: "'Jost', sans-serif" }}
                  >
                    {CATEGORY_LABEL[n.category] ?? n.category}
                  </span>
                  {n.source_url && (
                    <a
                      href={n.source_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-stone hover:text-indigo inline-flex items-center gap-0.5 truncate"
                    >
                      <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">{n.source_name ?? "Source"}</span>
                    </a>
                  )}
                </div>
                <span className="text-[9px] font-mono text-stone flex-shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {relativeTime(n.surfaced_at)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {visible.length > 12 && (
        <div className="px-6 py-3 border-t border-mist text-center">
          <Link
            href="/news"
            className="text-[10px] uppercase tracking-[0.22em] text-indigo hover:text-indigo-deep"
          >
            View all {visible.length} alerts →
          </Link>
        </div>
      )}
    </AccordionSection>
  );
}
