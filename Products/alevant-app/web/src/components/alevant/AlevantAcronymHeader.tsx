"use client";

import Link from "next/link";
import { useState } from "react";
import { Wordmark } from "./wordmark";

// ── ALEVANT acronym ──────────────────────────────────────────
// Each letter = a stage in the agent's deal lifecycle, mapped to a module.
// This is the brand DNA — surfaced on the cockpit hero so the agent
// internalizes what ALEVANT *is* every time they log in.

interface AcronymLetter {
  letter: string;
  word: string;
  href: string;
  blurb: string;
}

const ACRONYM: AcronymLetter[] = [
  { letter: "A", word: "Acquire",  href: "/inbox",        blurb: "Lead Inbox · Sofia · The Grid" },
  { letter: "L", word: "Listing",  href: "/listings",     blurb: "Listings · Microsites · Vesper" },
  { letter: "E", word: "Engage",   href: "/sphere",       blurb: "Sphere · Sofia · outreach" },
  { letter: "V", word: "Validate", href: "/underwriter",  blurb: "Underwriter · qualification" },
  { letter: "A", word: "Automate", href: "/sofia",        blurb: "Sofia · Vesper · cron" },
  { letter: "N", word: "Negotiate",href: "/sphere",       blurb: "Live coaching · comp authority" },
  { letter: "T", word: "Transact", href: "/transactions", blurb: "Transaction Brain · DocuSign" },
];

const ACCENT = "#1A8A9E";

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
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  return (
    <header
      className="mb-12 border border-mist bg-parchment relative overflow-hidden"
      style={{
        boxShadow: "0 1px 0 rgba(26,138,158,0.04)",
      }}
    >
      {/* Brand band */}
      <div
        className="px-10 pt-10 pb-6 relative"
        style={{
          background:
            "linear-gradient(180deg, rgba(26,138,158,0.04) 0%, rgba(26,138,158,0.00) 100%)",
        }}
      >
        <div className="flex items-start justify-between gap-8 mb-8">
          <div className="flex items-baseline gap-4 min-w-0">
            <Wordmark size="lg" className="text-ink" />
            <span
              className="text-[10px] uppercase tracking-[0.32em]"
              style={{ color: ACCENT, fontFamily: "'Jost', sans-serif" }}
            >
              · AI Operating System for Real Estate
            </span>
          </div>
        </div>

        {/* Acronym row — each letter clickable, hover to highlight */}
        <div className="grid grid-cols-7 gap-2">
          {ACRONYM.map((a, i) => {
            const active = hoverIndex === i;
            return (
              <Link
                key={i}
                href={a.href}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                className="block group transition-colors"
                style={{
                  borderTop: `1px solid ${active ? ACCENT : "var(--color-mist)"}`,
                  paddingTop: 14,
                }}
              >
                <div
                  className="serif-display text-center transition-all"
                  style={{
                    fontSize: "clamp(40px, 5vw, 72px)",
                    fontStyle: "italic",
                    fontWeight: 300,
                    lineHeight: 1,
                    letterSpacing: "-0.01em",
                    color: active ? ACCENT : "var(--color-ink)",
                  }}
                >
                  {a.letter}
                </div>
                <div
                  className="text-center mt-2"
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: active ? ACCENT : "var(--color-ink)",
                    transition: "color 0.15s",
                  }}
                >
                  {a.word}
                </div>
                <div
                  className="text-center mt-1 px-1"
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: 9.5,
                    letterSpacing: "0.04em",
                    color: "var(--color-stone)",
                    minHeight: 14,
                  }}
                >
                  {a.blurb}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-mist" />

      {/* Greeting band */}
      <div className="px-10 py-7 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="eyebrow !text-indigo mb-2">Cockpit</p>
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
    </header>
  );
}
