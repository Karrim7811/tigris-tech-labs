"use client";

import { motion } from "framer-motion";
import Slide from "@/components/Slide";
import CountUp from "@/components/CountUp";

interface Column {
  kicker: string;
  title: string;
  stat: { prefix: string; value: number; suffix: string; label: string; decimals?: number };
  q2: string;
  bullets: string[];
  accent: "navy" | "teal" | "magenta";
}

const columns: Column[] = [
  {
    kicker: "General Liability",
    title: "Slight relief, but uneven",
    stat: {
      prefix: "−",
      value: 0.4,
      suffix: "%",
      label: "Q1 2026 rate change · Aon Middle Market",
      decimals: 1,
    },
    q2: "Q2 2026 outlook: −1% to +5%",
    bullets: [
      "54% of insureds still saw rate increases in Q1 — the average masks the spread.",
      "Strong-loss accounts saw low single-digit moves; loss-challenged risks took above-average hikes.",
      "Florida litigation funding & legal-system abuse continue to reshape claims math.",
    ],
    accent: "navy",
  },
  {
    kicker: "Umbrella / Excess",
    title: "Pricing still climbing",
    stat: {
      prefix: "+",
      value: 3.4,
      suffix: "%",
      label: "Q1 2026 rate · +7.3% on accounts ≥ $250K premium",
      decimals: 1,
    },
    q2: "Q2 2026 outlook: +5% to +15%",
    bullets: [
      "Carriers anticipate 8-10% growth in excess loss reserves — pressure persists.",
      "Single-plaintiff outcomes now average $5M+; nuclear awards keep climbing.",
      "Lead capacity shrinking; structured / captive solutions filling the attachment gap.",
    ],
    accent: "teal",
  },
  {
    kicker: "D&O for boards",
    title: "The board's exposure",
    stat: {
      prefix: "$",
      value: 4,
      suffix: "B",
      label: "In management liability recoveries (5 years)",
    },
    q2: "Q2 2026 outlook: stable to modest increases",
    bullets: [
      "Special assessment fights are a top-3 D&O claim driver for condo boards.",
      "Construction-defect spillover into board claims continues to rise.",
      "Aon places D&O for 26% of the Fortune 100 — same playbook scales down.",
    ],
    accent: "magenta",
  },
];

const accentClasses: Record<Column["accent"], { rule: string; text: string; ring: string }> = {
  navy: { rule: "bg-aon-navy", text: "text-aon-navy", ring: "ring-aon-navy/15" },
  teal: { rule: "bg-aon-teal", text: "text-aon-teal", ring: "ring-aon-teal/15" },
  magenta: { rule: "bg-aon-magenta", text: "text-aon-magenta", ring: "ring-aon-magenta/15" },
};

export default function SlideCasualtyDO() {
  return (
    <Slide variant="light" sectionLabel="Casualty & D&O" sectionNumber="—">
      <div className="bg-grid-light absolute inset-0 opacity-40" />

      <div className="relative z-10 h-full flex flex-col px-20 pt-20 pb-8 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-stone mb-4 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-red" />
          The non-property side, in short · Aon Middle Market Q1 2026
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-2xl xl:text-4xl font-medium tracking-tight leading-[1.05] text-aon-ink mb-7"
        >
          Property is the headline —{" "}
          <span className="text-aon-red">casualty and D&amp;O</span> are the long tail.
        </motion.h1>

        <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
          {columns.map((c, i) => {
            const a = accentClasses[c.accent];
            return (
              <motion.div
                key={c.kicker}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.4 + i * 0.13, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white border border-aon-fog/60 rounded-sm p-6 ring-1 ring-transparent hover:ring-aon-red/20 transition flex flex-col"
              >
                <div className={`text-[10px] tracking-[0.3em] uppercase ${a.text} mb-2 flex items-center gap-2`}>
                  <span className={`h-px w-6 ${a.rule}`} />
                  {c.kicker}
                </div>
                <h3 className="text-lg xl:text-xl font-semibold text-aon-ink leading-tight mb-4">
                  {c.title}
                </h3>
                <div className="border-t border-b border-aon-fog/60 py-6 my-4 flex flex-col items-center text-center">
                  <div className={`text-6xl xl:text-8xl font-medium tracking-tight ${a.text} leading-none tabular`}>
                    <CountUp
                      to={c.stat.value}
                      prefix={c.stat.prefix}
                      suffix={c.stat.suffix}
                      delay={0.9 + i * 0.13}
                      duration={1.4}
                      decimals={c.stat.decimals}
                    />
                  </div>
                  <div className="text-[11px] text-aon-stone mt-3 leading-snug max-w-[20ch]">{c.stat.label}</div>
                </div>
                <ul className="space-y-2 flex-1">
                  {c.bullets.map((b) => (
                    <li key={b} className="text-[12px] text-aon-graphite leading-snug flex gap-2">
                      <span className={`mt-1.5 h-1 w-1 rounded-full ${a.rule} shrink-0`} />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className={`mt-4 pt-3 border-t border-aon-fog/60 text-[10px] tracking-[0.18em] uppercase font-semibold ${a.text}`}>
                  {c.q2}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.4 }}
          className="mt-5 flex items-center gap-4 text-[11px] text-aon-stone"
        >
          <span className="h-px w-10 bg-aon-stone/40" />
          <span>
            Source: Aon Middle Market Q1 2026 Casualty & Property Market Overview.
            Average rate change shown — outcomes vary materially by class, loss history, and structure.
          </span>
        </motion.div>
      </div>
    </Slide>
  );
}
