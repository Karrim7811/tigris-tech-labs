"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Slide from "@/components/Slide";
import CountUp from "@/components/CountUp";

type Tab = "snapshot" | "peril" | "program" | "outlook";

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: "snapshot", label: "Snapshot",  sub: "Q1 2026 in one view" },
  { id: "peril",    label: "By Peril",  sub: "Wind · EQ · CAT · Non-CAT" },
  { id: "program",  label: "By Program", sub: "Shared/layered vs single" },
  { id: "outlook",  label: "Q2 Outlook", sub: "What's coming" },
];

export default function SlideMarketReport() {
  const [active, setActive] = useState<Tab>("snapshot");

  return (
    <Slide
      variant="light"
      sectionLabel="Aon Q1 2026 Property Update"
      sectionNumber="—"
    >
      <div className="bg-grid-light absolute inset-0 opacity-40" />

      <div className="relative z-10 h-full flex flex-col px-12 pt-20 pb-6 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-stone mb-3 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-red" />
          U.S. National Property — Aon Insights · Q1 2026
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-2xl xl:text-4xl font-medium tracking-tight leading-[1.05] text-aon-ink mb-5"
        >
          The 8th straight quarter of{" "}
          <span className="text-aon-red">rate decline</span>.
        </motion.h1>

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex gap-1 mb-4 border-b border-aon-fog"
        >
          {TABS.map((t) => {
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`relative px-5 py-3 text-left transition ${
                  isActive ? "text-aon-ink" : "text-aon-stone hover:text-aon-graphite"
                }`}
              >
                <div className={`text-sm font-semibold ${isActive ? "text-aon-ink" : ""}`}>
                  {t.label}
                </div>
                <div className="text-[11px] text-aon-stone mt-0.5">{t.sub}</div>
                {isActive && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute -bottom-px left-0 right-0 h-[2px] bg-aon-red"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </motion.div>

        {/* Tab content */}
        <div className="flex-1 relative min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              {active === "snapshot" && <SnapshotTab />}
              {active === "peril" && <PerilTab />}
              {active === "program" && <ProgramTab />}
              {active === "outlook" && <OutlookTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Slide>
  );
}

/* ─────────────────── SNAPSHOT TAB ─────────────────── */

function SnapshotTab() {
  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Hero stat */}
      <div className="col-span-4 flex flex-col gap-5">
        <div className="bg-aon-midnight rounded-sm p-7 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(40,175,195,0.18),transparent_60%)]" />
          <div className="relative">
            <div className="text-[10px] tracking-[0.3em] uppercase text-aon-cyan mb-2">
              Headline
            </div>
            <div className="text-6xl xl:text-7xl font-medium tracking-tight leading-none text-white tabular">
              <CountUp to={-15.1} prefix="" suffix="%" delay={0.3} duration={1.5} decimals={1} />
            </div>
            <div className="mt-3 text-sm text-white/85 font-semibold">
              Average property rate change
            </div>
            <div className="text-[12px] text-white/55 mt-1 leading-snug">
              Q1 2026 vs &minus;17.9% in Q4 2025 — the 8th consecutive quarter of negative rate change.
            </div>
          </div>
        </div>

        <MiniStat
          value={2.8}
          decimals={1}
          suffix="%"
          color="#A70070"
          label="Average exposure change"
          sub="Up from 1.2% in Q4 2025."
        />
      </div>

      {/* Quarterly trend chart */}
      <div className="col-span-8 flex flex-col">
        <div className="text-[11px] tracking-[0.25em] uppercase text-aon-stone mb-3">
          Quarterly average property rate change · 2024 → Q1 2026
        </div>
        <div className="bg-white rounded-sm border border-aon-fog/60 p-5 flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quarterlyRates} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
              <XAxis
                dataKey="q"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#5D6D78", fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}%`}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#5D6D78", fontSize: 12 }}
                domain={[-22, 8]}
              />
              <Tooltip
                cursor={{ fill: "rgba(38,40,54,0.04)" }}
                contentStyle={{
                  background: "#FFFFFF",
                  border: "1px solid #ACC0C3",
                  borderRadius: 4,
                  fontSize: 12,
                }}
                formatter={(v) => [`${(v as number) > 0 ? "+" : ""}${v}%`, "Rate change"]}
              />
              <Bar dataKey="rate" radius={[2, 2, 0, 0]}>
                {quarterlyRates.map((d, i) => (
                  <Cell key={i} fill={d.rate >= 0 ? "#A70070" : d.q === "Q1 '26" ? "#EB0017" : "#28AFC3"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <KPI
            label="Maintained deductibles"
            value="94.7%"
            sub="vs 90.7% in Q4 2025"
            color="#28AFC3"
          />
          <KPI
            label="Increased limits"
            value="17.5%"
            sub="76.3% held; 6.1% decreased"
            color="#A70070"
          />
          <KPI
            label="Q1 2026 global insured CAT losses"
            value="$20B"
            sub="Below 21st-century average of $64B"
            color="#EB0017"
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── BY PERIL TAB ─────────────────── */

function PerilTab() {
  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      <div className="col-span-5 flex flex-col">
        <div className="text-[11px] tracking-[0.25em] uppercase text-aon-stone mb-3">
          Average rate change by peril · Q1 2026
        </div>
        <div className="bg-white rounded-sm border border-aon-fog/60 p-5 flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={perilRates}
              layout="vertical"
              margin={{ top: 8, right: 30, bottom: 8, left: 0 }}
            >
              <XAxis
                type="number"
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#5D6D78", fontSize: 12 }}
                domain={[-22, 0]}
              />
              <YAxis
                type="category"
                dataKey="peril"
                axisLine={false}
                tickLine={false}
                width={110}
                tick={{ fill: "#262836", fontSize: 13 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(38,40,54,0.04)" }}
                contentStyle={{
                  background: "#FFFFFF",
                  border: "1px solid #ACC0C3",
                  borderRadius: 4,
                  fontSize: 12,
                }}
                formatter={(v) => [`${v}%`, "Rate change"]}
              />
              <Bar dataKey="rate" radius={[0, 3, 3, 0]}>
                {perilRates.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-7 flex flex-col gap-3">
        <div className="text-[11px] tracking-[0.25em] uppercase text-aon-stone mb-1">
          What's driving each peril
        </div>
        <PerilNote
          peril="Tier I Wind"
          rate="−18.10%"
          color="#28AFC3"
          body="Florida windstorm capacity returning, supported by benign 2025 hurricane season and growing 3rd-party capital."
          watch="Capacity for FL windstorm still challenged for high-hazard coastal exposures."
        />
        <PerilNote
          peril="CA EQ"
          rate="−18.67%"
          color="#A70070"
          body="Capacity becoming more readily available, helping moderate pricing across the line."
          watch="DIC capacity expanding as new carriers and select wholesalers enter growth mode."
        />
        <PerilNote
          peril="All CAT (combined)"
          rate="−18.87%"
          color="#EB0017"
          body="Record reinsurance capital + favorable Jan. 1 treaty outcomes pulled rates down across CAT-exposed accounts."
          watch="Western U.S. wildfire is the next industry focus, especially given limited Rocky Mountain snowpack."
        />
        <PerilNote
          peril="Non-CAT"
          rate="−13.01%"
          color="#5D6D78"
          body="Carriers competing for clean, lower-hazard occupancies. Stable risks see the deepest reductions."
          watch="Less-desirable occupancies will see smaller reductions or hold flat in Q2."
        />
      </div>
    </div>
  );
}

/* ─────────────────── BY PROGRAM TAB ─────────────────── */

function ProgramTab() {
  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      <div className="col-span-7 flex flex-col">
        <div className="text-[11px] tracking-[0.25em] uppercase text-aon-stone mb-3">
          Quarterly rate change by program structure
        </div>
        <div className="bg-white rounded-sm border border-aon-fog/60 p-5 flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={programRates} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
              <XAxis
                dataKey="q"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#5D6D78", fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#5D6D78", fontSize: 12 }}
                domain={[-25, 0]}
              />
              <Tooltip
                cursor={{ fill: "rgba(38,40,54,0.04)" }}
                contentStyle={{
                  background: "#FFFFFF",
                  border: "1px solid #ACC0C3",
                  borderRadius: 4,
                  fontSize: 12,
                }}
                formatter={(v, name) => [`${v}%`, name === "shared" ? "Shared & Layered" : "Single Carrier"]}
              />
              <Bar dataKey="shared" fill="#EB0017" radius={[2, 2, 0, 0]} />
              <Bar dataKey="single" fill="#A70070" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-6 mt-3 text-[11px]">
          <span className="flex items-center gap-2 text-aon-graphite">
            <span className="block h-2.5 w-2.5 rounded-sm bg-aon-red" />
            Shared & Layered
          </span>
          <span className="flex items-center gap-2 text-aon-graphite">
            <span className="block h-2.5 w-2.5 rounded-sm bg-aon-magenta" />
            Single Carrier
          </span>
        </div>
      </div>

      <div className="col-span-5 flex flex-col gap-4">
        <div className="bg-white border border-aon-fog/60 rounded-sm p-5">
          <div className="flex items-baseline justify-between mb-1">
            <div className="text-[10px] tracking-[0.25em] uppercase text-aon-red">
              Shared & Layered
            </div>
            <div className="text-3xl font-medium text-aon-red tabular leading-none">−20.0%</div>
          </div>
          <div className="text-[12px] text-aon-graphite mt-2 leading-relaxed">
            Aggressive underwriting for desirable occupancies with profitable historic loss
            ratios — even with heavy NatCat exposures. The deepest reductions sit here.
          </div>
        </div>

        <div className="bg-white border border-aon-fog/60 rounded-sm p-5">
          <div className="flex items-baseline justify-between mb-1">
            <div className="text-[10px] tracking-[0.25em] uppercase text-aon-magenta">
              Single Carrier
            </div>
            <div className="text-3xl font-medium text-aon-magenta tabular leading-none">−8.8%</div>
          </div>
          <div className="text-[12px] text-aon-graphite mt-2 leading-relaxed">
            6th consecutive quarter of negative change. Sustainable, moderate moves —
            single-carrier paper isn't competing against itself the way the layered market is.
          </div>
        </div>

        <div className="bg-aon-pale/60 border-l-4 border-aon-red px-5 py-4 mt-auto">
          <div className="text-[10px] tracking-[0.25em] uppercase text-aon-stone mb-1">
            What this means for you
          </div>
          <div className="text-[13px] text-aon-graphite leading-snug">
            Layered placements are where the market gives the most ground today.
            For a condo program of size, the upside lives in restructuring vs. holding form.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── OUTLOOK TAB ─────────────────── */

function OutlookTab() {
  const items = [
    {
      kicker: "Property pricing",
      title: "Continuation of Q1 trend into Q2",
      body: "Driven by increased competition, benign 2025 NatCat losses, and favorable treaty outcomes. Less-desirable occupancies will see lower reductions; loss-challenged accounts continue to be underwritten for profitability.",
      color: "#28AFC3",
    },
    {
      kicker: "Capacity",
      title: "Ample, with persistent pockets of pressure",
      body: "Florida Wind, Severe Convective Storm, and Wildfire still challenged. CA EQ improving. DIC capacity expanding. New carriers and wholesalers in growth mode supporting capacity, easing pricing.",
      color: "#A70070",
    },
    {
      kicker: "Coverage",
      title: "Pricing/capacity moderation through Q2",
      body: "Aggressive underwriting expected for shared/layered programs with desirable occupancy and profitable history. Secondary perils — SCS, Flood, Wildfire — will continue to be scrutinized.",
      color: "#101E7F",
    },
    {
      kicker: "2026 Hurricane Season",
      title: "TSR forecast: ~40% below 1991-2020 climatology",
      body: "12 named storms · 5 hurricanes · 1 major. Weak La Niña likely transitioning to El Niño at peak — possibly a moderate/strong (\"super\") El Niño.",
      color: "#EB0017",
    },
  ];

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      <div className="col-span-7 flex flex-col">
        <div className="text-[11px] tracking-[0.3em] uppercase text-aon-stone mb-3 flex items-center gap-3">
          <span className="h-px w-8 bg-aon-red" />
          What we expect for Q2 2026
        </div>

        <div className="space-y-2.5 flex-1">
          {items.map((it, i) => (
            <motion.div
              key={it.kicker}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.1 + i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="bg-white border border-aon-fog/60 rounded-sm p-4 flex gap-5"
            >
              <span className="text-2xl font-light tabular tracking-tight text-aon-fog w-10 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <div
                  className="text-[10px] tracking-[0.25em] uppercase font-semibold mb-0.5"
                  style={{ color: it.color }}
                >
                  {it.kicker}
                </div>
                <h3 className="text-[15px] font-semibold text-aon-ink leading-tight mb-0.5">
                  {it.title}
                </h3>
                <p className="text-[12px] text-aon-graphite leading-snug">{it.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="col-span-5 flex flex-col gap-4">
        <div className="bg-aon-midnight rounded-sm p-6 flex-1 flex flex-col justify-center text-white">
          <div className="text-[10px] tracking-[0.3em] uppercase text-aon-cyan mb-3">
            One bullet to remember
          </div>
          <div className="text-xl xl:text-2xl font-medium leading-snug tracking-tight mb-4">
            Record reinsurance capital + a benign 2025 + Jan. 1 treaty outcomes ={" "}
            <span className="text-aon-red">a buyer's market for clean property risk</span>.
          </div>
          <div className="text-[12px] text-white/55 leading-snug">
            But it's loss-sensitive. A meaningful 2026 cat event could end the run.
          </div>
        </div>

        <div className="bg-white border border-aon-fog/60 rounded-sm p-5">
          <div className="text-[10px] tracking-[0.3em] uppercase text-aon-stone mb-2">
            Sources
          </div>
          <ul className="space-y-1 text-[11px] text-aon-graphite leading-relaxed">
            <li>· Aon — Q1 2026 U.S. National Property Insurance Market Overview</li>
            <li>· Aon Cat Analytics — Global Catastrophe Recap, Q1 2026</li>
            <li>· Tropical Storm Risk (TSR) — April 2026 forecast update</li>
            <li>· Colorado State University — 2026 Atlantic Basin Hurricane Outlook</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── HELPER COMPONENTS ─────────────────── */

function MiniStat({
  value, decimals = 0, suffix, color, label, sub,
}: {
  value: number; decimals?: number; suffix: string; color: string; label: string; sub: string;
}) {
  return (
    <div className="bg-white border border-aon-fog/60 rounded-sm p-5 border-l-4" style={{ borderLeftColor: color }}>
      <div className="text-3xl xl:text-4xl font-medium tracking-tight tabular leading-none" style={{ color }}>
        <CountUp to={value} suffix={suffix} delay={0.5} duration={1.4} decimals={decimals} />
      </div>
      <div className="mt-2 text-sm font-semibold text-aon-ink">{label}</div>
      <div className="text-[11px] text-aon-stone mt-0.5 leading-snug">{sub}</div>
    </div>
  );
}

function KPI({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-white border border-aon-fog/60 rounded-sm p-3 border-t-2" style={{ borderTopColor: color }}>
      <div className="text-[9px] tracking-[0.2em] uppercase text-aon-stone mb-1">{label}</div>
      <div className="text-xl font-semibold text-aon-ink tabular leading-tight">{value}</div>
      <div className="text-[10px] text-aon-stone mt-0.5 leading-snug">{sub}</div>
    </div>
  );
}

function PerilNote({
  peril, rate, color, body, watch,
}: {
  peril: string; rate: string; color: string; body: string; watch: string;
}) {
  return (
    <div className="bg-white border border-aon-fog/60 rounded-sm p-4 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="text-[11px] tracking-[0.18em] uppercase font-semibold" style={{ color }}>
          {peril}
        </div>
        <div className="text-xl font-medium tabular tracking-tight" style={{ color }}>
          {rate}
        </div>
      </div>
      <div className="text-[12px] text-aon-graphite leading-snug mb-1.5">{body}</div>
      <div className="text-[11px] text-aon-stone italic leading-snug">↳ Watch: {watch}</div>
    </div>
  );
}

/* ─────────────────── DATA ─────────────────── */

// Quarterly all-account rate (recent quarters trending negative)
const quarterlyRates = [
  { q: "Q1 '24", rate: 4.5 },
  { q: "Q2 '24", rate: 1.8 },
  { q: "Q3 '24", rate: -2.1 },
  { q: "Q4 '24", rate: -6.4 },
  { q: "Q1 '25", rate: -10.2 },
  { q: "Q2 '25", rate: -13.5 },
  { q: "Q3 '25", rate: -16.0 },
  { q: "Q4 '25", rate: -17.9 },
  { q: "Q1 '26", rate: -15.1 },
];

const perilRates = [
  { peril: "Non-CAT",     rate: -13.01, color: "#5D6D78" },
  { peril: "Tier I Wind", rate: -18.10, color: "#28AFC3" },
  { peril: "CA EQ",       rate: -18.67, color: "#A70070" },
  { peril: "All CAT",     rate: -18.87, color: "#EB0017" },
];

// Quarterly rate by program type
const programRates = [
  { q: "Q2 '25", shared: -16.5, single: -7.8 },
  { q: "Q3 '25", shared: -18.7, single: -8.1 },
  { q: "Q4 '25", shared: -22.4, single: -10.5 },
  { q: "Q1 '26", shared: -20.0, single: -8.8 },
];
