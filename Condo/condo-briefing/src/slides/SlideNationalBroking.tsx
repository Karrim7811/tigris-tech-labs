"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Slide from "@/components/Slide";
import CountUp from "@/components/CountUp";

const MapboxGlobeNetwork = dynamic(
  () => import("@/components/MapboxGlobeNetwork"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 grid place-items-center bg-aon-midnight">
        <div className="text-aon-cyan/80 text-xs tracking-[0.3em] uppercase animate-pulse">
          Loading globe…
        </div>
      </div>
    ),
  }
);

interface Stat {
  prefix: string;
  value: number;
  suffix: string;
  label: string;
  sub: string;
}

const stats: Stat[] = [
  {
    prefix: "$",
    value: 13,
    suffix: "B",
    label: "Global property premium placed annually",
    sub: "World's leading property and terrorism broker.",
  },
  {
    prefix: "$",
    value: 8,
    suffix: "T",
    label: "Total coverage limits in force",
    sub: "Capacity that scales to the largest portfolios.",
  },
  {
    prefix: "",
    value: 200,
    suffix: "+",
    label: "Property brokers in unison",
    sub: "U.S. · London · Bermuda — one team, one credit profile.",
  },
];

export default function SlideNationalBroking() {
  return (
    <Slide variant="dark" sectionLabel="National property broking" sectionNumber="—" className="!bg-aon-midnight">
      {/* Globe fills full slide */}
      <MapboxGlobeNetwork />

      {/* Top-vignette so the title reads on the globe */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[260px] bg-gradient-to-b from-aon-midnight/95 via-aon-midnight/65 to-transparent z-10" />

      {/* Bottom-left vignette for the stats panel */}
      <div className="pointer-events-none absolute left-0 bottom-0 w-[520px] h-[420px] bg-gradient-to-tr from-aon-midnight/95 via-aon-midnight/65 to-transparent z-10" />

      {/* Title block */}
      <div className="relative z-20 px-16 pt-24 max-w-[1700px]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-[11px] tracking-[0.35em] uppercase text-aon-cyan mb-3 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-cyan" />
          The largest property broker in the world
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-3xl xl:text-5xl font-medium tracking-tight leading-[1.05] text-white max-w-3xl"
          style={{ textShadow: "0 2px 12px rgba(6,11,38,0.6)" }}
        >
          We don't place coverage —{" "}
          <span className="text-aon-red">we aggregate capacity</span>.
        </motion.h1>
      </div>

      {/* Stats panel — bottom-left over vignette */}
      <div className="absolute z-20 bottom-12 left-16 w-[440px]">
        <div className="space-y-5">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 1.2 + i * 0.18 }}
              className="border-l-2 border-aon-red pl-5"
            >
              <div className="text-3xl xl:text-5xl font-medium tracking-tight text-white leading-none">
                <CountUp
                  to={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  delay={1.6 + i * 0.18}
                  duration={1.4}
                />
              </div>
              <div className="mt-2 text-[13px] text-white/95 font-semibold leading-tight">
                {stat.label}
              </div>
              <div className="text-[11px] text-white/55 mt-0.5 leading-snug">
                {stat.sub}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom-right caption */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 4.5 }}
        className="absolute bottom-16 right-16 z-20 text-right max-w-xs"
      >
        <div className="text-[10px] tracking-[0.3em] uppercase text-aon-cyan/85 mb-1">
          Client reach
        </div>
        <div className="text-2xl font-medium text-white leading-tight">
          120<span className="text-aon-red">+</span> countries
        </div>
        <div className="text-[11px] text-white/55 mt-1 leading-snug">
          Aon clients in every market on the globe.
        </div>
      </motion.div>
    </Slide>
  );
}
