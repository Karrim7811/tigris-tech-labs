"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { X, ExternalLink, ArrowRight } from "lucide-react";

export interface PulseItem {
  id: string;
  source: "news" | "grid" | "sphere" | "transaction";
  tag: string;            // displayed in badge — e.g., "MARKET", "GRID", "RISK"
  message: string;        // headline text
  href: string;           // open destination
  detail?: string;        // long text for modal
  source_url?: string;    // external link
  source_name?: string;
  timestamp?: string;
  severity?: "act" | "watch" | "info";
}

const SOURCE_STYLE: Record<PulseItem["source"], { bg: string; label: string; dot: string }> = {
  news:        { bg: "#3D4F8C", label: "MARKET",     dot: "#60A5FA" },
  grid:        { bg: "#B5853E", label: "GRID",       dot: "#FBBF24" },
  sphere:      { bg: "#1A8A9E", label: "SPHERE",     dot: "#2DD4BF" },
  transaction: { bg: "#B03A2E", label: "RISK",       dot: "#F87171" },
};

const SEVERITY_LABEL: Record<NonNullable<PulseItem["severity"]>, { bg: string; text: string }> = {
  act:   { bg: "rgba(176,58,46,0.14)",   text: "#B03A2E" },
  watch: { bg: "rgba(196,135,90,0.14)",  text: "#C4875A" },
  info:  { bg: "rgba(58,55,48,0.10)",    text: "#3A3730" },
};

function relativeTime(iso?: string): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function PulseTicker({ items }: { items: PulseItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState<PulseItem | null>(null);

  // Clone items once so the marquee loops seamlessly
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (track.dataset.cloned === "1") return;
    const originals = Array.from(track.children) as HTMLElement[];
    originals.forEach((el) => {
      const clone = el.cloneNode(true) as HTMLElement;
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });
    track.dataset.cloned = "1";
  }, [items]);

  // ── Empty state — show placeholder strip so layout never jumps ──
  if (items.length === 0) {
    return (
      <div
        className="border border-mist bg-bone overflow-hidden mb-10"
        style={{ height: 44 }}
      >
        <div className="h-full flex items-center px-6">
          <span
            className="text-[10px] uppercase tracking-[0.3em] text-stone"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            Live signal
          </span>
          <span
            className="ml-4 text-xs italic text-stone"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            No live signals — next news scan at 7:00am ET. Grid sweep every 24h.
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="border border-mist bg-parchment overflow-hidden mb-10 relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{ height: 44 }}
      >
        {/* Left label badge */}
        <div
          className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-2 px-4 border-r border-mist"
          style={{
            background:
              "linear-gradient(90deg, var(--color-parchment) 0%, var(--color-parchment) 80%, rgba(250,250,248,0) 100%)",
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{
              background: "#1A8A9E",
              boxShadow: "0 0 8px rgba(26,138,158,0.6)",
              animation: "alevantTickerPulse 2s ease-in-out infinite",
            }}
          />
          <span
            className="text-[10px] uppercase tracking-[0.3em] text-ink"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500 }}
          >
            Live · {items.length}
          </span>
        </div>

        {/* Right fade */}
        <div
          className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(270deg, var(--color-parchment) 0%, rgba(250,250,248,0) 100%)",
          }}
        />

        {/* Scrolling track */}
        <div
          ref={trackRef}
          className="flex items-center gap-8 h-full whitespace-nowrap"
          style={{
            paddingLeft: 140,
            animation: `alevantTickerScroll ${Math.max(40, items.length * 6)}s linear infinite`,
            animationPlayState: paused ? "paused" : "running",
            willChange: "transform",
          }}
        >
          {items.map((it) => {
            const s = SOURCE_STYLE[it.source];
            return (
              <button
                key={it.id}
                onClick={() => setSelected(it)}
                className="inline-flex items-center gap-2 text-[12.5px] hover:opacity-80 transition-opacity"
                style={{ fontFamily: "'Jost', sans-serif" }}
              >
                <span
                  className="text-[9px] uppercase tracking-[0.18em] text-parchment px-1.5 py-0.5 rounded-sm font-medium"
                  style={{
                    background: s.bg,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  }}
                >
                  {it.tag}
                </span>
                <span className="text-ink">{it.message}</span>
                {it.severity && (
                  <span
                    className="text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded-sm"
                    style={{
                      background: SEVERITY_LABEL[it.severity].bg,
                      color: SEVERITY_LABEL[it.severity].text,
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    }}
                  >
                    {it.severity}
                  </span>
                )}
                {it.timestamp && (
                  <span className="text-[10px] text-stone font-mono" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
                    · {relativeTime(it.timestamp)}
                  </span>
                )}
                <span className="w-1 h-1 rounded-full bg-mist mx-2" />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Detail modal ───────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-parchment border border-mist max-w-2xl w-full overflow-hidden"
            style={{ boxShadow: "0 24px 80px rgba(26,25,21,0.18)" }}
          >
            <header className="px-6 py-4 border-b border-mist flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="text-[9px] uppercase tracking-[0.22em] text-parchment px-2 py-1 rounded-sm"
                  style={{
                    background: SOURCE_STYLE[selected.source].bg,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  }}
                >
                  {selected.tag}
                </span>
                {selected.severity && (
                  <span
                    className="text-[9px] uppercase tracking-[0.22em] px-2 py-1 rounded-sm"
                    style={{
                      background: SEVERITY_LABEL[selected.severity].bg,
                      color: SEVERITY_LABEL[selected.severity].text,
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    }}
                  >
                    {selected.severity}
                  </span>
                )}
                <span
                  className="text-[10px] uppercase tracking-[0.18em] text-stone"
                  style={{ fontFamily: "'Jost', sans-serif" }}
                >
                  {relativeTime(selected.timestamp)}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-stone hover:text-ink p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </header>
            <div className="px-6 py-6">
              <h3 className="serif-display text-ink text-2xl mb-3 leading-snug">
                {selected.message}
              </h3>
              {selected.detail && (
                <p className="text-sm text-smoke leading-relaxed mb-6 whitespace-pre-wrap">
                  {selected.detail}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Link
                  href={selected.href}
                  className="btn-base bg-indigo text-parchment hover:bg-indigo-deep"
                  onClick={() => setSelected(null)}
                >
                  Open <ArrowRight className="w-3 h-3 ml-2" />
                </Link>
                {selected.source_url && (
                  <a
                    href={selected.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-base bg-bone text-ink border border-mist hover:bg-mist"
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    {selected.source_name || "External source"}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes alevantTickerScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes alevantTickerPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(26,138,158,0.4); transform: scale(1); }
          50%      { box-shadow: 0 0 0 6px rgba(26,138,158,0);   transform: scale(1.2); }
        }
      `}</style>
    </>
  );
}
