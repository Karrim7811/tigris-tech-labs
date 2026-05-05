"use client";

import { motion } from "framer-motion";
import { TrendingDown, ShieldAlert, Scale, Compass, Users } from "lucide-react";
import Slide from "@/components/Slide";

const takeaways = [
  {
    icon: TrendingDown,
    title: "Property rates are stabilizing — not falling",
    body: "Plan for single-digit increases through 2026. Anyone forecasting decreases is selling something.",
  },
  {
    icon: ShieldAlert,
    title: "Capacity is back, but selective",
    body: "Carriers re-entering FL are picky. Buildings with strong COPE and recent valuations get capacity first.",
  },
  {
    icon: Scale,
    title: "D&O is the next pressure point",
    body: "Construction defect spillover and special-assessment litigation are reshaping condo board exposure.",
  },
  {
    icon: Compass,
    title: "Underwriters reward preparation",
    body: "The submission gap between best-prepared and average is now worth 200-400 bps of rate.",
  },
  {
    icon: Users,
    title: "The board's role is bigger than ever",
    body: "Documented decisions, consistent governance, and defensible reserves are now insurance variables.",
  },
];

export default function SlideMarketSummary() {
  return (
    <Slide variant="light" sectionLabel="FL Market Update — What this means" sectionNumber="III of III">
      <div className="bg-grid-light absolute inset-0 opacity-40" />

      <div className="relative z-10 h-full flex flex-col justify-center px-20 pt-24 pb-12 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-stone mb-6 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-red" />
          Five takeaways for the rest of 2026
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl xl:text-6xl font-medium tracking-tight leading-[1.05] text-aon-ink mb-14"
        >
          What this <span className="text-aon-red">actually means</span>
          <br />
          for your buildings.
        </motion.h1>

        <div className="space-y-5">
          {takeaways.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={t.title}
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, delay: 0.4 + i * 0.11, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start gap-6 border-t border-aon-fog/60 pt-5"
              >
                <span className="text-3xl font-light tabular text-aon-fog tracking-tight w-12">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="grid h-11 w-11 place-items-center rounded-sm bg-aon-pale text-aon-red shrink-0">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="flex-1">
                  <h3 className="text-lg xl:text-xl font-semibold text-aon-ink mb-1">
                    {t.title}
                  </h3>
                  <p className="text-sm xl:text-base text-aon-graphite leading-relaxed">
                    {t.body}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Slide>
  );
}
