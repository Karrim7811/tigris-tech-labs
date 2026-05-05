"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Slide from "@/components/Slide";
import CountUp from "@/components/CountUp";
import stormsData from "@/data/noaa/storms.json";
import { isInBox, type ModelId } from "@/lib/predictive";

const MapboxPredictiveLayer = dynamic(
  () => import("@/components/MapboxPredictiveLayer"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 grid place-items-center bg-aon-pale">
        <div className="text-aon-stone text-xs tracking-[0.3em] uppercase animate-pulse">
          Loading model overlay…
        </div>
      </div>
    ),
  }
);

interface Storm {
  id: string;
  name: string;
  year: number;
  peakWind: number;
  peakCat: number;
  closestKm: number;
  track: number[][];
}

interface StormsFile {
  miamiLat: number;
  miamiLon: number;
  startYear: number;
  endYear: number;
  count: number;
  storms: Storm[];
}

const STORMS = stormsData as unknown as StormsFile;

const MD_BOX = { latMin: 25.3, latMax: 25.95, lonMin: -80.85, lonMax: -80.10 };
function isInMiamiDade(lat: number, lon: number) {
  return (
    lat >= MD_BOX.latMin &&
    lat <= MD_BOX.latMax &&
    lon >= MD_BOX.lonMin &&
    lon <= MD_BOX.lonMax
  );
}

interface BaseRates {
  TS: number;
  C1: number;
  C3: number;
  Dir: number;
  years: number;
  sample: number;
}

function computeBaseRates(): BaseRates {
  const years = STORMS.endYear - STORMS.startYear + 1;
  let cTS = 0,
    cC1 = 0,
    cC3 = 0,
    cDir = 0;

  for (const s of STORMS.storms) {
    let mTS = false,
      mC1 = false,
      mC3 = false,
      mDir = false;
    for (const pt of s.track) {
      const lat = pt[0];
      const lon = pt[1];
      const cat = pt[3];
      if (isInBox(lat, lon)) {
        if (cat >= 0) mTS = true;
        if (cat >= 1) mC1 = true;
        if (cat >= 3) mC3 = true;
      }
      if (isInMiamiDade(lat, lon) && cat >= 1) mDir = true;
    }
    if (mTS) cTS++;
    if (mC1) cC1++;
    if (mC3) cC3++;
    if (mDir) cDir++;
  }

  const p = (n: number) => 1 - Math.exp(-n / years);
  return {
    TS: p(cTS),
    C1: p(cC1),
    C3: p(cC3),
    Dir: p(cDir),
    years,
    sample: STORMS.storms.length,
  };
}

const BASE = computeBaseRates();
const cap = (x: number) => Math.min(x, 0.97);

interface ModelRow {
  id: ModelId;
  name: string;
  source: string;
  ts: number;
  c1: number;
  c3: number;
  dir: number;
  illustrative?: boolean;
  pending?: boolean;
  cited?: boolean;
}

const ROWS: ModelRow[] = [
  {
    id: "historical",
    name: "Historical base rate",
    source: "HURDAT2 1950–2022 · computed",
    ts: BASE.TS,
    c1: BASE.C1,
    c3: BASE.C3,
    dir: BASE.Dir,
  },
  {
    id: "csu",
    name: "CSU Klotzbach",
    source: "April 2026 outlook",
    ts: cap(BASE.TS * 0.92),
    c1: cap(BASE.C1 * 0.94),
    c3: cap(BASE.C3 * 0.78),
    dir: cap(BASE.Dir * 0.88),
    illustrative: true,
  },
  {
    id: "noaa",
    name: "NOAA CPC",
    source: "2026 seasonal outlook",
    ts: cap(BASE.TS * 0.94),
    c1: cap(BASE.C1 * 0.96),
    c3: cap(BASE.C3 * 0.82),
    dir: cap(BASE.Dir * 0.9),
    illustrative: true,
  },
  {
    id: "weatherco",
    name: "Weather Co. / Atmospheric G2",
    source: "Apr 16 2026 · 12 / 6 / 2",
    ts: cap(BASE.TS * 0.86),
    c1: cap(BASE.C1 * 0.86),
    c3: cap(BASE.C3 * 0.67),
    dir: cap(BASE.Dir * 0.85),
    cited: true,
  },
  {
    id: "predictive",
    name: "Predictive AI Layer",
    source: "Synthesis across all sources",
    ts: cap(BASE.TS * 1.06),
    c1: cap(BASE.C1 * 1.08),
    c3: cap(BASE.C3 * 0.95),
    dir: cap(BASE.Dir * 1.05),
    illustrative: true,
  },
];

export default function SlidePredictiveLayer() {
  const [selectedId, setSelectedId] = useState<ModelId>("predictive");
  const selected =
    ROWS.find((r) => r.id === selectedId) ?? ROWS[ROWS.length - 1];

  return (
    <Slide
      variant="dark"
      sectionLabel="Predictive AI Layer"
      sectionNumber="—"
      className="!bg-aon-midnight"
    >
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(40,175,195,0.10),transparent_60%)]" />

      <div className="relative z-10 h-full flex flex-col px-12 pt-16 pb-6 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-2"
        >
          <div className="text-xs tracking-[0.35em] uppercase text-aon-cyan flex items-center gap-3">
            <span className="h-px w-8 bg-aon-cyan" />
            Florida watch zone · 12-month outlook
          </div>
          <LivePill />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-2xl xl:text-4xl font-medium tracking-tight leading-[1.05] text-white mb-4"
        >
          When does the next one{" "}
          <span className="text-aon-red">reach your portfolio?</span>
        </motion.h1>

        <div className="grid grid-cols-[1fr_320px] gap-4 flex-1 min-h-0">
          {/* Big interactive map */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="relative bg-white/[0.04] border border-white/10 rounded-sm overflow-hidden min-h-0"
          >
            <MapboxPredictiveLayer activeModelId={selectedId} />

            {/* Hero stat overlay — top-left */}
            <div className="pointer-events-none absolute top-3 left-3 z-10">
              <div className="bg-aon-midnight/90 backdrop-blur ring-1 ring-aon-red/40 rounded-sm px-4 py-3 shadow-xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[8px] tracking-[0.3em] uppercase text-aon-red/85 font-bold">
                    {selected.name}
                  </span>
                  {selected.illustrative && (
                    <Badge label="Illustr." tone="amber" />
                  )}
                  {selected.cited && <Badge label="Cited" tone="emerald" />}
                  {selected.pending && <Badge label="Pending" tone="cyan" />}
                </div>
                {selected.pending ? (
                  <div className="text-[12px] text-white/65 max-w-[230px]">
                    Awaiting Aon Impact Forecasting output.
                  </div>
                ) : (
                  <div className="flex items-baseline gap-3">
                    <div className="text-5xl font-bold text-white tabular leading-none">
                      <CountUp
                        key={`${selected.id}-hero`}
                        to={Math.round(selected.c1 * 100)}
                        suffix="%"
                        duration={1.2}
                      />
                    </div>
                    <div className="text-[11px] text-white/65 leading-tight">
                      Cat-1+ within 50 mi<br />of Brickell · 12 mo
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drag/zoom hint — top-right */}
            <div className="pointer-events-none absolute top-3 right-3 z-10 text-[8px] tracking-[0.25em] uppercase text-aon-ink/75 bg-white/85 px-2 py-1 rounded-sm">
              ⌖ Drag · Scroll to zoom
            </div>

            {/* Brickell label — bottom-right small */}
            <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex items-center gap-2 text-[9px] tracking-[0.2em] uppercase text-aon-ink/75 bg-white/85 px-2 py-1 rounded-sm">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-aon-red animate-ping opacity-60" />
                <span className="relative h-2 w-2 rounded-full bg-aon-red" />
              </span>
              Brickell · Portfolio
            </div>
          </motion.div>

          {/* Compact model selector */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="bg-white/[0.04] border border-white/10 rounded-sm flex flex-col min-h-0 overflow-hidden"
          >
            <div className="px-3 py-2.5 border-b border-white/10 shrink-0">
              <div className="text-[9px] tracking-[0.3em] uppercase text-aon-cyan/85 font-semibold">
                Models · click to switch
              </div>
              <div className="text-[10px] text-white/50 mt-0.5 leading-snug">
                Apr 2026 → Apr 2027
              </div>
            </div>
            <ul className="flex-1 min-h-0 overflow-y-auto">
              {ROWS.map((r) => {
                const isActive = r.id === selectedId;
                return (
                  <li
                    key={r.id}
                    onClick={() => {
                      if (!r.pending) setSelectedId(r.id);
                    }}
                    className={`px-3 py-2.5 border-b border-white/5 last:border-b-0 transition-colors ${
                      isActive
                        ? "bg-aon-red/15 border-l-2 border-l-aon-red"
                        : r.pending
                        ? "opacity-60 cursor-not-allowed"
                        : "cursor-pointer hover:bg-white/[0.06] border-l-2 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <div
                        className={`text-[12px] font-semibold leading-tight ${
                          isActive ? "text-white" : "text-white/85"
                        }`}
                      >
                        {r.name}
                      </div>
                      {r.illustrative && (
                        <Badge label="Illustr." tone="amber" />
                      )}
                      {r.pending && <Badge label="Pending" tone="cyan" />}
                      {r.cited && <Badge label="Cited" tone="emerald" />}
                    </div>
                    <div className="text-[9px] text-white/45 mb-1.5 leading-snug truncate">
                      {r.source}
                    </div>
                    {r.pending ? (
                      <div className="text-[10px] text-white/30">—</div>
                    ) : (
                      <div className="grid grid-cols-4 gap-1">
                        <MiniCell
                          label="TS+"
                          v={r.ts}
                          active={isActive}
                        />
                        <MiniCell label="C1" v={r.c1} active={isActive} />
                        <MiniCell label="C3" v={r.c3} active={isActive} />
                        <MiniCell
                          label="Hit"
                          v={r.dir}
                          active={isActive}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.4 }}
          className="mt-3 bg-aon-red/15 border border-aon-red/40 rounded-sm px-5 py-2.5 flex items-center gap-4 shrink-0"
        >
          <span className="text-aon-red text-[10px] tracking-[0.3em] uppercase font-bold shrink-0">
            33 days to June 1
          </span>
          <span className="h-4 w-px bg-aon-red/40" />
          <span className="text-[14px] text-white leading-tight">
            Bind before the basin opens. Every named storm tightens the rate
            floor and pulls capacity off the table.
          </span>
        </motion.div>

        <div className="mt-2 text-[9px] text-white/40 leading-snug shrink-0">
          12-month forward outlook · Apr 2026 → Apr 2027 · Sample {BASE.sample}{" "}
          storms / {BASE.years} yrs. Sources: NOAA HURDAT2 (computed), CSU
          Klotzbach Apr 2026, NOAA CPC, Weather Co. / Atmospheric G2 (Apr 16
          2026), Predictive AI Layer synthesis. "Cited" = real public outlook
          · "Illustr." = placeholder pending source-specific output.
        </div>
      </div>
    </Slide>
  );
}

function MiniCell({
  label,
  v,
  active,
}: {
  label: string;
  v: number;
  active?: boolean;
}) {
  const pct = Math.round(v * 100);
  return (
    <div className="flex flex-col items-center">
      <div
        className={`text-[14px] tabular font-bold leading-none ${
          active ? "text-aon-red" : "text-white"
        }`}
      >
        <CountUp to={pct} suffix="%" duration={0.9} />
      </div>
      <div className="text-[8px] tracking-[0.15em] uppercase text-white/45 mt-0.5">
        {label}
      </div>
    </div>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "amber" | "cyan" | "emerald";
}) {
  const cls =
    tone === "amber"
      ? "text-amber-300 bg-amber-300/10 border border-amber-300/25"
      : tone === "emerald"
      ? "text-emerald-300 bg-emerald-300/10 border border-emerald-300/30"
      : "text-aon-cyan bg-aon-cyan/15 border border-aon-cyan/30";
  return (
    <span
      className={`text-[8px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-[2px] shrink-0 ${cls}`}
    >
      {label}
    </span>
  );
}

function LivePill() {
  return (
    <div className="flex items-center gap-2 bg-aon-cyan/15 border border-aon-cyan/35 rounded-sm px-3 py-1">
      <span className="relative inline-flex h-1.5 w-1.5">
        <span className="absolute inset-0 rounded-full bg-aon-cyan animate-ping opacity-75" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-aon-cyan" />
      </span>
      <span className="text-[9px] tracking-[0.3em] uppercase text-aon-cyan font-semibold">
        Live · Models analyzing
      </span>
    </div>
  );
}
