"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import Slide from "@/components/Slide";

const youControl = [
  "Submission quality & timing — 90 to 120 days out, complete data",
  "Documented loss control — water mitigation, fire systems, training logs",
  "Board governance — minutes, decisions, reserve studies",
  "Property valuations — third-party appraisal every 24 months",
  "Vendor & contractor due diligence — COIs, training, oversight",
  "Data shared with your broker — proactively, not reactively",
];

const youDont = [
  "Hurricane season severity",
  "Reinsurance treaty pricing every January 1st",
  "Carrier appetite shifts and exits",
  "Florida statute and SB 4-D changes",
  "Jury verdicts in Miami-Dade litigation",
  "Macro inflation and replacement-cost trajectories",
];

export default function SlideControl() {
  return (
    <Slide
      variant="light"
      sectionLabel="What you can influence"
      sectionNumber="—"
    >
      <div className="bg-grid-light absolute inset-0 opacity-40" />

      <div className="relative z-10 h-full flex flex-col justify-center px-20 pt-24 pb-12 max-w-[1500px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-stone mb-6 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-red" />
          Where to spend your energy
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl xl:text-6xl font-medium tracking-tight leading-[1.05] text-aon-ink max-w-4xl mb-16"
        >
          Stop fighting the market.
          <br />
          <span className="text-aon-red">Run your half of it.</span>
        </motion.h1>

        <div className="grid grid-cols-2 gap-20">
          {/* You control */}
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-xs tracking-[0.3em] uppercase text-aon-teal mb-6 flex items-center gap-3"
            >
              <span className="h-px w-8 bg-aon-teal" />
              What you control
            </motion.div>
            <ul className="space-y-3.5">
              {youControl.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.55 + i * 0.08 }}
                  className="flex items-start gap-3 text-base xl:text-lg text-aon-ink font-medium"
                >
                  <span className="mt-1.5 grid h-5 w-5 place-items-center rounded-full bg-aon-teal/15 shrink-0">
                    <Check className="h-3 w-3 text-aon-teal" strokeWidth={3} />
                  </span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* You don't */}
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.05 }}
              className="text-xs tracking-[0.3em] uppercase text-aon-stone mb-6 flex items-center gap-3"
            >
              <span className="h-px w-8 bg-aon-stone" />
              What you don&apos;t
            </motion.div>
            <ul className="space-y-3.5">
              {youDont.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.2 + i * 0.08 }}
                  className="flex items-start gap-3 text-base xl:text-lg text-aon-stone"
                >
                  <span className="mt-1.5 grid h-5 w-5 place-items-center rounded-full bg-aon-stone/10 shrink-0">
                    <X className="h-3 w-3 text-aon-stone" strokeWidth={3} />
                  </span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.9 }}
          className="mt-14 text-sm xl:text-base text-aon-graphite italic max-w-3xl"
        >
          Boards that obsess over the right column burn energy.
          <br />
          Boards that <span className="text-aon-red font-semibold not-italic">execute the left column</span> get better outcomes — every renewal.
        </motion.div>
      </div>
    </Slide>
  );
}
