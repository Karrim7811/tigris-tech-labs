"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Maximize2, ChevronUp } from "lucide-react";

// ── ALEVANT acronym ──────────────────────────────────────────
// Each letter = a stage in the agent's deal lifecycle, mapped to a module.

interface AcronymLetter {
  letter: string;
  word: string;
  href: string;
  blurb: string;
}

const ACRONYM: AcronymLetter[] = [
  { letter: "A", word: "Acquire",   href: "/inbox",        blurb: "Lead Inbox · Sofia · The Grid" },
  { letter: "L", word: "Listing",   href: "/listings",     blurb: "Listings · Microsites · Vesper" },
  { letter: "E", word: "Engage",    href: "/sphere",       blurb: "Sphere · Sofia · outreach" },
  { letter: "V", word: "Validate",  href: "/underwriter",  blurb: "Underwriter · qualification" },
  { letter: "A", word: "Automate",  href: "/sofia",        blurb: "Sofia · Vesper · cron" },
  { letter: "N", word: "Negotiate", href: "/sphere",       blurb: "Live coaching · comp authority" },
  { letter: "T", word: "Transact",  href: "/transactions", blurb: "Transaction Brain · DocuSign · Dotloop" },
];

const ACCENT = "#1A8A9E";
const SESSION_KEY = "alevant-acronym-collapsed-v3";  // bump to force re-anim
const COLLAPSE_AFTER_MS = 5000;
const TRANSITION = "cubic-bezier(0.65, 0, 0.35, 1) 850ms";

interface Props {
  agentName: string;
  greeting: string;
  dateLabel: string;
  rightSlot?: React.ReactNode;
}

export function AlevantAcronymHeader({
  agentName,
  greeting,
  dateLabel,
  rightSlot,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      setCollapsed(stored === "1");
    } catch {}
  }, []);

  // ── Single layout, all sizing driven by `collapsed` flag ──
  // Smooth shrink via CSS transitions on font-size, padding, max-height.

  const letterSize = collapsed ? "22px" : "clamp(48px, 6vw, 80px)";
  const wordSize = collapsed ? "9px" : "11px";
  const wordTracking = collapsed ? "0.18em" : "0.20em";
  const blurbMaxH = collapsed ? "0" : "32px";
  const blurbOpacity = collapsed ? 0 : 1;
  const heroPadY = collapsed ? "8px" : "20px";
  const greetingLargeOpacity = collapsed ? 0 : 1;
  const greetingLargeMaxH = collapsed ? "0" : "200px";
  const greetingCompactOpacity = collapsed ? 1 : 0;
  const greetingCompactMaxH = collapsed ? "44px" : "0";
  const dividerMaxH = collapsed ? "0" : "1px";
  const greetBandPad = collapsed ? "0" : "24px 40px";

  return (
    <header
      className="border border-mist bg-parchment relative overflow-hidden"
      style={{
        boxShadow: "0 1px 0 rgba(26,138,158,0.04)",
      }}
    >
      {/* Brand band — letters live here */}
      <div
        className="px-10 relative"
        style={{
          paddingTop: heroPadY,
          paddingBottom: heroPadY,
          background:
            "linear-gradient(180deg, rgba(26,138,158,0.04) 0%, rgba(26,138,158,0.00) 100%)",
          transition: `padding ${TRANSITION}`,
        }}
      >
        {/* Collapse trigger — top-right of brand band */}
        <button
          onClick={() => {
            const next = !collapsed;
            setCollapsed(next);
            try {
              sessionStorage.setItem(SESSION_KEY, next ? "1" : "0");
            } catch {}
          }}
          className="absolute top-2 right-3 text-stone hover:text-indigo transition-colors p-1.5 flex-shrink-0 z-10"
          title={collapsed ? "Expand brand" : "Collapse brand"}
          aria-label={collapsed ? "Expand brand" : "Collapse brand"}
        >
          {collapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {/* Acronym row — letters shrink in place, blurbs collapse */}
        <div className="grid grid-cols-7 gap-2">
          {ACRONYM.map((a, i) => {
            const active = hoverIndex === i;
            return (
              <Link
                key={i}
                href={a.href}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                className="block group"
                style={{
                  borderTop: `1px solid ${active ? ACCENT : "var(--color-mist)"}`,
                  paddingTop: collapsed ? 6 : 14,
                  transition: `border-color 150ms, padding ${TRANSITION}`,
                  // Stagger fade-in on first mount (intro animation)
                  animation: hasMounted
                    ? `alevantLetterIn 700ms cubic-bezier(0.4,0,0.2,1) ${100 + i * 80}ms both`
                    : undefined,
                }}
              >
                <div
                  className="serif-display text-center"
                  data-alevant-letter={i}
                  style={{
                    fontSize: letterSize,
                    fontStyle: "italic",
                    fontWeight: 300,
                    lineHeight: 1,
                    letterSpacing: "-0.01em",
                    color: active ? ACCENT : "var(--color-ink)",
                    transition: `font-size ${TRANSITION}, color 150ms`,
                  }}
                >
                  {a.letter}
                </div>
                <div
                  className="text-center"
                  style={{
                    marginTop: collapsed ? 4 : 8,
                    fontFamily: "'Jost', sans-serif",
                    fontSize: wordSize,
                    letterSpacing: wordTracking,
                    textTransform: "uppercase",
                    color: active ? ACCENT : "var(--color-ink)",
                    transition: `color 150ms, font-size ${TRANSITION}, margin ${TRANSITION}`,
                  }}
                >
                  {a.word}
                </div>
                <div
                  className="text-center px-1 overflow-hidden"
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: 9.5,
                    letterSpacing: "0.04em",
                    color: "var(--color-stone)",
                    maxHeight: blurbMaxH,
                    opacity: blurbOpacity,
                    marginTop: collapsed ? 0 : 4,
                    transition: `max-height ${TRANSITION}, opacity ${TRANSITION}, margin ${TRANSITION}`,
                  }}
                >
                  {a.blurb}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Divider — collapses to 0 height in compact mode */}
      <div
        className="bg-mist overflow-hidden"
        style={{
          maxHeight: dividerMaxH,
          transition: `max-height ${TRANSITION}`,
        }}
      />

      {/* Greeting band — large version */}
      <div
        className="overflow-hidden"
        style={{
          maxHeight: greetingLargeMaxH,
          opacity: greetingLargeOpacity,
          padding: greetBandPad,
          transition: `max-height ${TRANSITION}, opacity ${TRANSITION}, padding ${TRANSITION}`,
        }}
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="eyebrow !text-indigo mb-2">Dashboard</p>
            <h1
              className="serif-display leading-[1.05]"
              style={{ fontSize: "clamp(32px, 3.6vw, 52px)", color: "var(--color-ink)" }}
            >
              {greeting}, {agentName}.
            </h1>
            <p className="serif-italic text-stone text-base mt-1.5">{dateLabel}</p>
          </div>
          {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
        </div>
      </div>

      {/* Greeting band — compact version (visible only when collapsed) */}
      <div
        className="overflow-hidden border-t border-mist"
        style={{
          maxHeight: greetingCompactMaxH,
          opacity: greetingCompactOpacity,
          transition: `max-height ${TRANSITION}, opacity ${TRANSITION}`,
        }}
      >
        <div className="px-10 py-3 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <p className="eyebrow !text-indigo flex-shrink-0">Dashboard</p>
            <span className="text-mist flex-shrink-0">·</span>
            <span
              className="serif-italic text-ink truncate"
              style={{ fontSize: 18 }}
            >
              {greeting}, {agentName}
            </span>
            <span className="text-mist hidden md:inline flex-shrink-0">·</span>
            <span
              className="text-[10px] uppercase tracking-[0.18em] text-stone hidden md:inline truncate"
              style={{ fontFamily: "'Jost', sans-serif" }}
            >
              {dateLabel}
            </span>
          </div>
          {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
        </div>
      </div>

      <style>{`
        @keyframes alevantLetterIn {
          from { opacity: 0; transform: translateY(20px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </header>
  );
}
