"use client";

import { motion } from "framer-motion";
import Slide from "@/components/Slide";
import CountUp from "@/components/CountUp";

const stats = [
  {
    prefix: "$",
    value: 300,
    suffix: "B",
    label: "Real estate insured values",
    sub: "Total across Aon's commercial and residential RE clients.",
  },
  {
    prefix: "",
    value: 30,
    suffix: "%",
    label: "Of the largest US RE owners",
    sub: "Have Aon as their broker of record.",
  },
  {
    prefix: "",
    value: 300,
    suffix: "+",
    label: "Real estate property clients",
    sub: "Nationwide — multi-family, hospitality, mixed-use, residential.",
  },
  {
    prefix: "$",
    value: 700,
    suffix: "M",
    label: "Real estate GWP placed",
    sub: "Globally, annually — $900M in the U.S. alone.",
  },
  {
    prefix: "",
    value: 40,
    suffix: "",
    label: "Property specialists",
    sub: "Industry-aligned to commercial & residential real estate.",
  },
  {
    prefix: "$",
    value: 33,
    suffix: "B",
    label: "Real estate coverage limits",
    sub: "Total program limits placed across the practice.",
  },
];

export default function SlideQualified() {
  return (
    <Slide variant="light" sectionLabel="Why we&apos;re qualified" sectionNumber="02" hideWordmark={false}>
      <div className="bg-grid-light absolute inset-0 opacity-40" />

      <div className="relative z-10 h-full flex flex-col justify-center px-20 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-stone mb-6"
        >
          The credibility we bring
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-3xl xl:text-5xl font-medium tracking-tight leading-[1.05] text-aon-ink max-w-5xl"
        >
          Aon represents <span className="text-aon-red">the largest</span> commercial
          real estate portfolios in the U.S.
        </motion.h1>

        <div className="grid grid-cols-3 gap-x-12 gap-y-10 mt-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 + i * 0.12 }}
              className="border-t-2 border-aon-fog pt-5"
            >
              <div className="text-5xl xl:text-6xl font-medium tracking-tight text-aon-navy leading-none">
                <CountUp
                  to={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  delay={0.8 + i * 0.12}
                  duration={1.4}
                />
              </div>
              <div className="mt-5 text-[15px] text-aon-ink font-semibold leading-tight">
                {stat.label}
              </div>
              <div className="text-[13px] text-aon-stone mt-1.5 leading-relaxed">
                {stat.sub}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </Slide>
  );
}
