"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Slide from "@/components/Slide";

const MapboxStormHistory = dynamic(
  () => import("@/components/MapboxStormHistory"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 grid place-items-center bg-aon-midnight">
        <div className="text-aon-cyan/80 text-xs tracking-[0.3em] uppercase animate-pulse">
          Loading 70 years of storms…
        </div>
      </div>
    ),
  }
);

export default function SlideStormHistory() {
  return (
    <Slide variant="dark" sectionLabel="Why your basin matters" sectionNumber="—" className="!bg-aon-midnight" hideWordmark>
      {/* Map fills the slide */}
      <div className="absolute inset-0">
        <MapboxStormHistory />
      </div>

      {/* Title overlay — top-center, above HUD */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 z-30 text-center"
      >
        <div className="text-[11px] tracking-[0.4em] uppercase text-aon-cyan/85 mb-1.5 flex items-center gap-3 justify-center">
          <span className="h-px w-8 bg-aon-cyan/60" />
          NOAA HURDAT2 · 1950 → 2022
          <span className="h-px w-8 bg-aon-cyan/60" />
        </div>
        <h1 className="text-3xl xl:text-5xl font-medium tracking-tight text-white leading-[1.05]">
          70 years of storms.{" "}
          <span className="text-aon-red">One basin.</span>
        </h1>
      </motion.div>

      {/* Bottom kicker line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 25 }}
        className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 z-30 text-center max-w-2xl px-6"
      >
        <p className="text-sm xl:text-base text-white/85 leading-relaxed">
          12 Cat-5–strength events in the basin. Your buildings sit inside the
          surge zones the County evacuates first.{" "}
          <span className="text-aon-red font-semibold">
            This is the map your underwriter sees.
          </span>
        </p>
      </motion.div>
    </Slide>
  );
}
