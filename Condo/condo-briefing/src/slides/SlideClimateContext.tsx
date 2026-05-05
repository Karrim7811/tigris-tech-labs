"use client";

import { motion } from "framer-motion";
import {
  Wind,
  ThermometerSun,
  Waves,
  type LucideIcon,
} from "lucide-react";
import Slide from "@/components/Slide";
import CountUp from "@/components/CountUp";

interface ForecastStat {
  label: string;
  forecast: number;
  avg: number;
}

const wcStats: ForecastStat[] = [
  { label: "Named storms", forecast: 12, avg: 14 },
  { label: "Hurricanes", forecast: 6, avg: 7 },
  { label: "Major (Cat 3+)", forecast: 2, avg: 3 },
];

interface Driver {
  icon: LucideIcon;
  title: string;
  body: string;
}

const drivers: Driver[] = [
  {
    icon: ThermometerSun,
    title: "El Niño returning",
    body: "Equatorial Pacific warming — potentially reaching super El Niño levels by late summer.",
  },
  {
    icon: Wind,
    title: "Elevated wind shear",
    body: "El Niño years deliver upper-level winds that tear storms apart before they organize.",
  },
  {
    icon: Waves,
    title: "Cooler Atlantic SSTs",
    body: "Sea-surface temperatures cooler than 2024 — less fuel for major hurricane development.",
  },
];

export default function SlideClimateContext() {
  return (
    <Slide
      variant="dark"
      sectionLabel="2026 Atlantic outlook"
      sectionNumber="—"
    >
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(40,175,195,0.18),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(167,0,112,0.12),transparent_55%)]" />

      <div className="relative z-10 h-full flex flex-col px-16 pt-16 pb-6 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-cyan mb-4 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-cyan" />
          What the meteorologists are calling for
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-3xl xl:text-5xl font-medium tracking-tight leading-[1.05] text-white mb-3"
        >
          2026 looks{" "}
          <span className="text-aon-red">slightly below average</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-base text-white/70 max-w-3xl leading-relaxed mb-7"
        >
          The Weather Company / Atmospheric G2 April 16 2026 outlook calls
          for a quieter season — driven by a returning El Niño and cooler
          Atlantic SSTs. CSU Klotzbach and NOAA CPC converge.
        </motion.p>

        {/* Hero forecast vs climatology stats */}
        <div className="grid grid-cols-3 gap-6 mb-7">
          {wcStats.map((s, i) => {
            const delta = Math.round(((s.forecast - s.avg) / s.avg) * 100);
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + i * 0.12 }}
                className="bg-white/[0.04] border border-white/10 rounded-sm p-6"
              >
                <div className="text-[10px] tracking-[0.3em] uppercase text-aon-cyan/85 mb-4">
                  {s.label}
                </div>
                <div className="flex items-baseline gap-4 mb-3">
                  <div className="text-6xl xl:text-7xl font-medium text-white tabular leading-none">
                    <CountUp
                      to={s.forecast}
                      delay={0.6 + i * 0.12}
                      duration={1.4}
                    />
                  </div>
                  <div className="text-[11px] text-white/50 leading-tight">
                    vs avg<br />
                    <span className="text-white/80 tabular text-base font-semibold">
                      {s.avg}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-aon-red font-semibold tabular">
                  {delta}% below climatology
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* El Niño driver explainer */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.95 }}
          className="bg-aon-cyan/8 border border-aon-cyan/25 rounded-sm p-5 mb-4"
        >
          <div className="text-[10px] tracking-[0.3em] uppercase text-aon-cyan font-bold mb-4">
            Why · the three climate drivers
          </div>
          <div className="grid grid-cols-3 gap-6">
            {drivers.map((d, i) => {
              const Icon = d.icon;
              return (
                <motion.div
                  key={d.title}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.55, delay: 1.1 + i * 0.1 }}
                  className="flex gap-3"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-sm bg-aon-cyan/15 text-aon-cyan shrink-0">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-white mb-1 leading-tight">
                      {d.title}
                    </div>
                    <div className="text-[11px] text-white/65 leading-snug">
                      {d.body}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* But — transition to next page */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="bg-aon-red/15 border border-aon-red/40 rounded-sm px-5 py-3 flex items-center gap-4"
        >
          <span className="text-aon-red text-[10px] tracking-[0.3em] uppercase font-bold shrink-0">
            But —
          </span>
          <span className="h-4 w-px bg-aon-red/40" />
          <span className="text-[14px] text-white leading-tight">
            it only takes{" "}
            <span className="text-aon-red font-semibold">one landfall</span> to
            reset every assumption above.{" "}
            <span className="text-white/65 italic">
              Next page: what that means for your portfolio.
            </span>
          </span>
        </motion.div>

        <div className="mt-2 text-[9px] text-white/40 leading-snug">
          Sources: The Weather Company / Atmospheric G2 (Apr 16 2026), CSU
          Tropical Meteorology Project (Klotzbach, April 2026), NOAA Climate
          Prediction Center seasonal outlook. Climatological averages reflect
          1991–2020 normals.
        </div>
      </div>
    </Slide>
  );
}
