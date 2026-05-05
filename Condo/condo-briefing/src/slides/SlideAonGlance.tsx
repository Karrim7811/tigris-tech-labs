"use client";

import { motion } from "framer-motion";
import Slide from "@/components/Slide";
import CountUp from "@/components/CountUp";

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
    label: "Global property premium placed",
    sub: "World's leading property and terrorism broker.",
  },
  {
    prefix: "$",
    value: 8,
    suffix: "T",
    label: "Total coverage limits placed",
    sub: "Capacity that scales to the largest portfolios.",
  },
  {
    prefix: "",
    value: 200,
    suffix: "+",
    label: "Property brokers",
    sub: "125+ in the U.S., 75+ in London & Bermuda — one team.",
  },
];

export default function SlideAonGlance() {
  return (
    <Slide variant="dark" sectionLabel="Aon at a glance" sectionNumber="—">
      {/* Atmospheric backdrop */}
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(40,175,195,0.18),transparent_55%),radial-gradient(circle_at_20%_85%,rgba(167,0,112,0.15),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(6,11,38,0.85)_95%)]" />

      <div className="relative z-10 h-full flex flex-col justify-center px-20 pt-24 pb-12 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-cyan mb-6 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-cyan" />
          The firm behind this room
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl xl:text-6xl font-medium tracking-tight leading-[1.05] text-white max-w-5xl"
        >
          The world's leading{" "}
          <span className="text-aon-red">property broker</span>.
        </motion.h1>

        <div className="grid grid-cols-3 gap-12 mt-24">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 + i * 0.18 }}
              className="border-t border-white/15 pt-6"
            >
              <div className="text-7xl xl:text-9xl font-medium tracking-tight text-white leading-none">
                <CountUp
                  to={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  delay={0.9 + i * 0.18}
                  duration={1.6}
                />
              </div>
              <div className="mt-7 text-base text-white/85 font-semibold">
                {stat.label}
              </div>
              <div className="text-sm text-white/55 mt-2 leading-relaxed">
                {stat.sub}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="mt-20 text-sm text-white/45 max-w-3xl"
        >
          Aon plc (NYSE: AON) · 50,000 colleagues across 120+ countries · Source: Aon corporate disclosures.
        </motion.div>
      </div>
    </Slide>
  );
}
