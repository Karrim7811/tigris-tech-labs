"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import Slide from "@/components/Slide";
import BuildingDetail from "@/components/BuildingDetail";
import {
  portfolio,
  TIER_COLORS,
  TIER_LABELS,
  fmtDistance,
} from "@/data/portfolio";

type ViewMode = "manager" | "underwriter";

const MapboxPortfolioMap = dynamic(
  () => import("@/components/MapboxPortfolioMap"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 grid place-items-center bg-aon-pale">
        <div className="text-aon-stone text-sm tracking-[0.2em] uppercase animate-pulse">
          Loading 3D Miami…
        </div>
      </div>
    ),
  }
);

export default function SlidePortfolioMap() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("manager");
  const selected = selectedId ? portfolio.find((p) => p.id === selectedId) : null;

  return (
    <Slide
      variant="light"
      sectionLabel={selected ? "Asset profile" : "Your building"}
      sectionNumber="—"
      className="!bg-white"
      hideWordmark={!!selected}
      hideSectionMark={!!selected}
    >
      <AnimatePresence mode="wait">
        {selected ? (
          <BuildingDetail
            key={`detail-${selected.id}`}
            building={selected}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <motion.div
            key="map-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col px-10 pt-24 pb-6"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xs tracking-[0.35em] uppercase text-aon-stone mb-3 flex items-center gap-3"
            >
              <span className="h-px w-8 bg-aon-red" />
              Your building, in this market
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-2xl xl:text-4xl font-medium tracking-tight leading-[1.05] text-aon-ink mb-5 max-w-4xl"
            >
              <span className="text-aon-red">Find yours</span> on the Miami skyline.
            </motion.h1>

            {/* Map + roster split */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative flex-1 flex gap-5 min-h-0"
            >
              {/* Map area */}
              <div className="relative flex-1 rounded-sm border border-aon-fog/60 overflow-hidden bg-aon-pale">
                <MapboxPortfolioMap
                  properties={portfolio}
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  onSelect={setSelectedId}
                  onHover={setHoveredId}
                />
              </div>

              {/* Roster panel */}
              <aside className="w-[380px] shrink-0 bg-white border border-aon-fog/60 rounded-sm overflow-y-auto flex flex-col">
                <div className="p-5 border-b border-aon-fog/60">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-aon-stone mb-1">
                    The seven buildings in this room
                  </div>
                  <div className="text-sm text-aon-graphite mb-3">
                    {view === "manager"
                      ? "Click yours — or any other — to see its full risk profile."
                      : "The same buildings, scored the way a carrier underwrites them."}
                  </div>

                  {/* View toggle */}
                  <div className="flex rounded-sm border border-aon-fog/60 p-0.5 bg-aon-pale/50">
                    <button
                      onClick={() => setView("manager")}
                      className={`flex-1 px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase rounded-[2px] transition-colors ${
                        view === "manager"
                          ? "bg-white text-aon-ink shadow-sm font-semibold"
                          : "text-aon-stone hover:text-aon-graphite"
                      }`}
                    >
                      Manager view
                    </button>
                    <button
                      onClick={() => setView("underwriter")}
                      className={`flex-1 px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase rounded-[2px] transition-colors ${
                        view === "underwriter"
                          ? "bg-aon-red text-white shadow-sm font-semibold"
                          : "text-aon-stone hover:text-aon-graphite"
                      }`}
                    >
                      Underwriter view
                    </button>
                  </div>
                </div>

                <ul className="flex-1">
                  {portfolio.map((p, i) => {
                    const isHovered = hoveredId === p.id;
                    const tierColor = TIER_COLORS[p.risk.overall_tier];
                    return (
                      <motion.li
                        key={p.id}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.45,
                          delay: 0.5 + i * 0.06,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        onMouseEnter={() => setHoveredId(p.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => setSelectedId(p.id)}
                        className={`group cursor-pointer px-5 py-3.5 border-b border-aon-fog/40 last:border-b-0 transition ${
                          isHovered
                            ? "bg-aon-pale/70"
                            : "hover:bg-aon-pale/40"
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="flex flex-col items-center pt-1.5 shrink-0">
                            <span
                              className="block rounded-full ring-2 ring-white transition-all"
                              style={{
                                width: isHovered ? 12 : 10,
                                height: isHovered ? 12 : 10,
                                background: tierColor,
                                boxShadow: isHovered
                                  ? `0 0 0 4px ${tierColor}33`
                                  : "none",
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2">
                              <h3 className="text-sm font-semibold text-aon-ink leading-tight truncate">
                                {p.location_name}
                              </h3>
                              <span
                                className="text-[10px] font-semibold tracking-[0.1em] uppercase tabular shrink-0"
                                style={{ color: tierColor }}
                              >
                                {TIER_LABELS[p.risk.overall_tier]}
                              </span>
                            </div>
                            {view === "manager" ? (
                              <ManagerRow p={p} />
                            ) : (
                              <UnderwriterRow p={p} />
                            )}
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>

                <div className="p-4 border-t border-aon-fog/60 text-[11px] text-aon-stone leading-relaxed">
                  {view === "manager" ? (
                    <>
                      <span className="text-aon-red font-semibold">↳</span> Hover a
                      row to fly the map to that building.
                    </>
                  ) : (
                    <>
                      <span className="text-aon-red font-semibold">↳</span> Each
                      column is a factor a property carrier prices on.
                    </>
                  )}
                </div>
              </aside>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Slide>
  );
}

/* ─────────── Roster row variants ─────────── */

import type { Building } from "@/data/portfolio";

function ManagerRow({ p }: { p: Building }) {
  return (
    <>
      <div className="text-xs text-aon-graphite mt-0.5">{p.manager_name}</div>
      <div className="text-[11px] text-aon-stone mt-0.5 flex items-center gap-2">
        <span>{p.illustration.stories} stories</span>
        <span className="text-aon-fog">·</span>
        <span>{p.units} units</span>
        <span className="text-aon-fog">·</span>
        <span>{fmtDistance(p.risk.distance_to_water_m)} to water</span>
      </div>
    </>
  );
}

/* The five factors a property underwriter actually prices on. Pulled from the
   building's existing risk profile, surfaced in the language a carrier uses. */
function UnderwriterRow({ p }: { p: Building }) {
  const lossLabel = p.risk.loss_frequency === 1
    ? "High"
    : p.risk.loss_frequency === 2 ? "Moderate" : "Low";
  const lossColor = p.risk.loss_frequency === 1
    ? "text-aon-red"
    : p.risk.loss_frequency === 2 ? "text-amber-500" : "text-emerald-600";
  const ageYrs = 2026 - p.year_built;
  const ageBucket = ageYrs <= 8 ? "New build" : ageYrs <= 15 ? "Mid-cycle" : "Mature";

  return (
    <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
      <Cell label="FEMA zone" value={p.flood_zone} bad={p.flood_zone === "AE" || p.flood_zone === "VE"} />
      <Cell label="Distance to water" value={fmtDistance(p.risk.distance_to_water_m)} bad={p.risk.distance_to_water_m < 100} />
      <Cell label="Year built" value={`${p.year_built} (${ageBucket})`} />
      <Cell label="Loss frequency" value={lossLabel} valueClass={lossColor} />
    </div>
  );
}

function Cell({
  label, value, bad, valueClass,
}: {
  label: string; value: string; bad?: boolean; valueClass?: string;
}) {
  return (
    <div>
      <div className="text-[9px] tracking-[0.15em] uppercase text-aon-stone/80">{label}</div>
      <div className={`text-[12px] font-semibold ${valueClass ?? (bad ? "text-aon-red" : "text-aon-ink")}`}>
        {value}
      </div>
    </div>
  );
}
