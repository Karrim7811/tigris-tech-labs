"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import {
  Building,
  RISK_DIMENSIONS,
  RiskTier,
  TIER_COLORS,
  TIER_DESCRIPTIONS,
  TIER_LABELS,
  fmtDistance,
} from "@/data/portfolio";
import BuildingIllustration from "./BuildingIllustration";

interface Props {
  building: Building;
  onBack: () => void;
}

export default function BuildingDetail({ building: b, onBack }: Props) {
  return (
    <motion.div
      key={`detail-${b.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 bg-aon-bone overflow-hidden"
    >
      {/* Atmospheric backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_60%,rgba(40,175,195,0.07),transparent_50%),radial-gradient(circle_at_75%_25%,rgba(235,0,23,0.07),transparent_50%)]" />
      <div className="bg-grid-light absolute inset-0 opacity-30" />

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        onClick={onBack}
        className="absolute top-6 left-44 z-50 flex items-center gap-2 px-4 py-2 text-sm text-aon-graphite hover:text-aon-red transition group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition" />
        <span className="tracking-[0.15em] uppercase text-xs font-medium">
          Back to portfolio
        </span>
      </motion.button>

      <div className="relative z-10 h-full flex items-stretch px-16 pt-20 pb-8">
        <div className="grid grid-cols-12 gap-10 w-full max-w-[1700px] mx-auto">
          {/* LEFT — building hero */}
          <div className="col-span-5 flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xs tracking-[0.35em] uppercase text-aon-stone mb-3 flex items-center gap-3"
            >
              <span className="h-px w-8 bg-aon-red" />
              Asset profile
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="text-4xl xl:text-5xl font-medium tracking-tight leading-[1.05] text-aon-ink mb-2"
            >
              {b.location_name}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-sm text-aon-graphite"
            >
              {b.address} · {b.city}, {b.state} {b.zip}
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-xs text-aon-stone mt-1"
            >
              Managed by{" "}
              <span className="text-aon-graphite font-medium">{b.manager_name}</span>
            </motion.div>

            {/* Building stage */}
            <div className="relative flex-1 flex items-end justify-center mt-6 min-h-[420px] rounded-sm overflow-hidden">
              {/* Sky gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#0F1830] via-[#1A2A4A] to-[#3C5878]" />

              {/* Stylized atmosphere */}
              <svg
                className="absolute inset-0 w-full h-full opacity-40 mix-blend-screen"
                viewBox="0 0 100 60"
                preserveAspectRatio="none"
              >
                <defs>
                  <radialGradient id={`cloud-${b.id}`} cx="50%" cy="50%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <ellipse cx="22" cy="18" rx="28" ry="9" fill={`url(#cloud-${b.id})`} />
                <ellipse cx="78" cy="32" rx="32" ry="11" fill={`url(#cloud-${b.id})`} />
                <ellipse cx="50" cy="52" rx="46" ry="7" fill={`url(#cloud-${b.id})`} />
              </svg>

              {/* Distant city silhouette */}
              <svg
                className="absolute bottom-0 left-0 right-0 w-full h-[70px] opacity-25"
                viewBox="0 0 1000 70"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,70 L0,55 L40,55 L40,40 L80,40 L80,30 L100,30 L100,45 L130,45 L130,25 L160,25 L160,52 L200,52 L200,38 L240,38 L240,48 L290,48 L290,32 L330,32 L330,42 L380,42 L380,28 L420,28 L420,46 L460,46 L460,35 L510,35 L510,50 L555,50 L555,40 L600,40 L600,22 L640,22 L640,44 L680,44 L680,30 L730,30 L730,48 L780,48 L780,38 L830,38 L830,52 L880,52 L880,42 L920,42 L920,32 L960,32 L960,50 L1000,50 L1000,70 Z"
                  fill="#0a1346"
                />
              </svg>

              {/* Ground line + accent */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-aon-ink" />
              <div className="absolute bottom-1 left-0 right-0 h-px bg-aon-red/50" />

              {/* The building — photo if available, else SVG illustration */}
              {b.photo ? (
                <motion.div
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 z-0"
                >
                  <Image
                    src={b.photo}
                    alt={b.location_name}
                    fill
                    sizes="40vw"
                    className="object-cover"
                    priority
                  />
                  {/* Cinematic darkening for legibility of overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/30" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-10 mb-1"
                >
                  <BuildingIllustration config={b.illustration} height={420} shadow />
                </motion.div>
              )}

              {/* Top-left signature label */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="absolute top-4 left-5 z-20"
              >
                <div className="text-[10px] text-white/55 tracking-[0.3em] uppercase">
                  {b.illustration.stories} stories · built {b.year_built}
                </div>
                <div className="text-[11px] text-white/75 mt-0.5 italic">
                  {b.illustration.signature}
                </div>
              </motion.div>

              {/* Bottom strip — units + sqft */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.85 }}
                className="absolute bottom-4 left-5 right-5 z-20 flex items-end justify-between text-white"
              >
                <div className="text-xs">
                  <span className="text-base font-medium tabular">
                    {b.units}
                  </span>
                  <span className="text-white/55"> units · </span>
                  <span className="text-base font-medium tabular">
                    {(b.area_sqft / 1000).toFixed(0)}K
                  </span>
                  <span className="text-white/55"> sqft</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* RIGHT — risk profile */}
          <div className="col-span-7 flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-end justify-between mb-7"
            >
              <div>
                <div className="text-xs tracking-[0.35em] uppercase text-aon-stone mb-2">
                  Overall exposure
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center px-3 py-1.5 rounded-sm text-white text-sm font-semibold tracking-wide tabular shadow-sm"
                    style={{ background: TIER_COLORS[b.risk.overall_tier] }}
                  >
                    {TIER_LABELS[b.risk.overall_tier]}
                  </span>
                  <span className="text-sm text-aon-graphite">
                    — {TIER_DESCRIPTIONS[b.risk.overall_tier]}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs tracking-[0.35em] uppercase text-aon-stone mb-1">
                  Distance to water
                </div>
                <div className="text-3xl font-medium tabular text-aon-ink leading-none">
                  {fmtDistance(b.risk.distance_to_water_m)}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="text-xs tracking-[0.35em] uppercase text-aon-stone mb-3 flex items-center gap-3"
            >
              <span className="h-px w-8 bg-aon-red" />
              Risk profile — eight dimensions
            </motion.div>

            <div className="grid grid-cols-2 gap-3.5">
              {RISK_DIMENSIONS.map((dim, i) => {
                const tier = b.risk[
                  dim.key as keyof typeof b.risk
                ] as unknown as RiskTier;
                return (
                  <RiskCard
                    key={dim.key}
                    label={dim.label}
                    sub={dim.sub}
                    tier={tier}
                    index={i}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RiskCard({
  label,
  sub,
  tier,
  index,
}: {
  label: string;
  sub: string;
  tier: RiskTier;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.45 + index * 0.06 }}
      className="bg-white border border-aon-fog/60 rounded-sm p-4 flex items-start gap-4"
    >
      {/* Tier indicator — segmented bar of 3 */}
      <div className="flex flex-col gap-1 mt-0.5 shrink-0">
        {[1, 2, 3].map((t) => (
          <span
            key={t}
            className="block w-1 h-3 rounded-sm transition"
            style={{
              background:
                t === tier
                  ? TIER_COLORS[tier]
                  : "rgba(38,40,54,0.08)",
            }}
          />
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-[10px] uppercase tracking-[0.2em] font-semibold"
          style={{ color: TIER_COLORS[tier] }}
        >
          {TIER_LABELS[tier]}
        </div>
        <div className="text-sm xl:text-base font-semibold text-aon-ink leading-tight mt-1">
          {label}
        </div>
        <div className="text-xs text-aon-stone mt-0.5 leading-relaxed">{sub}</div>
      </div>
    </motion.div>
  );
}
