"use client";

import { motion } from "framer-motion";
import Slide from "@/components/Slide";

interface Step {
  step: number;
  when: string;
  title: string;
  detail: string;
  /** Phase grouping for visual rhythm. */
  phase: "prep" | "market" | "decide" | "bind";
}

const steps: Step[] = [
  { step: 1,  when: "Early January", title: "Renewal strategy meeting", detail: "State of the market, prior program review, renewal objectives.", phase: "prep" },
  { step: 2,  when: "January",       title: "Finalize exposures",       detail: "Update other units of insurance — contents, BI, etc.",            phase: "prep" },
  { step: 3,  when: "January",       title: "Remodel exposures",        detail: "Obtain final modelled details (AIR / Risk Analyzer).",           phase: "prep" },
  { step: 4,  when: "February",      title: "Finalize submission",      detail: "Final submission review before release.",                        phase: "market" },
  { step: 5,  when: "February",      title: "Release to market",        detail: "Full submission released to insurers globally.",                 phase: "market" },
  { step: 6,  when: "March",         title: "Insurer roadshow",         detail: "Underwriter meetings in London & Bermuda.",                      phase: "market" },
  { step: 7,  when: "End of March",  title: "Quotations due",           detail: "Comparative analyses; review terms and pricing.",                phase: "decide" },
  { step: 8,  when: "April",         title: "Proposal",                 detail: "Detailed coverage summary, recommendations against objectives.", phase: "decide" },
  { step: 9,  when: "Mid April",     title: "Order to bind",            detail: "Certificate process started; invoices collected for billing.",   phase: "bind" },
  { step: 10, when: "April 30",      title: "Inception",                detail: "Program renews with the master program in force.",               phase: "bind" },
  { step: 11, when: "May",           title: "Post-bind meeting",        detail: "Confirm execution; set the stewardship cadence.",                phase: "bind" },
];

const phaseColors: Record<Step["phase"], string> = {
  prep:   "#28AFC3", // cyan
  market: "#FFA600", // gold
  decide: "#A70070", // magenta
  bind:   "#EB0017", // Aon red
};

const phaseLabels: Record<Step["phase"], string> = {
  prep: "Preparation",
  market: "Marketing",
  decide: "Decision",
  bind: "Bind & inception",
};

export default function SlideRenewalTimeline() {
  return (
    <Slide variant="light" sectionLabel="Renewal timeline" sectionNumber="—">
      <div className="bg-grid-light absolute inset-0 opacity-40" />

      <div className="relative z-10 h-full flex flex-col justify-center px-16 pt-24 pb-12 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-stone mb-5 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-red" />
          120 days, 11 steps
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-3xl xl:text-5xl font-medium tracking-tight leading-[1.05] text-aon-ink mb-8"
        >
          The work that happens{" "}
          <span className="text-aon-red">before your renewal</span>.
        </motion.h1>

        {/* Phase legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center gap-6 mb-8 text-[11px] tracking-[0.2em] uppercase text-aon-stone"
        >
          {(["prep", "market", "decide", "bind"] as const).map((p) => (
            <span key={p} className="inline-flex items-center gap-2">
              <span className="block h-2 w-6 rounded-[1px]" style={{ background: phaseColors[p] }} />
              {phaseLabels[p]}
            </span>
          ))}
        </motion.div>

        {/* Horizontal timeline rail */}
        <div className="relative flex-1 min-h-0 flex items-center">
          {/* Background rail */}
          <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-aon-fog/60 -translate-y-1/2" />

          {/* Animated red rail */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 top-1/2 h-[2px] bg-aon-red origin-left -translate-y-1/2"
          />

          <div className="relative w-full grid grid-cols-11 gap-0">
            {steps.map((s, i) => {
              const isAbove = i % 2 === 0;
              return (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: isAbove ? 12 : -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.55,
                    delay: 0.6 + i * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="relative flex flex-col items-center"
                >
                  {/* Card above or below the rail */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 w-[150px] ${
                      isAbove ? "bottom-[calc(50%+22px)]" : "top-[calc(50%+22px)]"
                    }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.4, zIndex: 20, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
                      className="relative bg-white border border-aon-fog/60 rounded-sm p-3 shadow-sm hover:shadow-lg transition-shadow"
                    >
                      <div
                        className="text-[9px] tracking-[0.18em] uppercase font-semibold mb-1"
                        style={{ color: phaseColors[s.phase] }}
                      >
                        Step {s.step} · {s.when}
                      </div>
                      <div className="text-[12px] font-semibold text-aon-ink leading-tight mb-1">
                        {s.title}
                      </div>
                      <div className="text-[10px] text-aon-stone leading-snug">
                        {s.detail}
                      </div>
                    </motion.div>
                    {/* Connector */}
                    <div
                      className={`absolute left-1/2 -translate-x-1/2 w-px h-[18px] bg-aon-fog/80 ${
                        isAbove ? "top-full" : "bottom-full"
                      }`}
                    />
                  </div>

                  {/* Dot on the rail */}
                  <div className="relative z-10">
                    <span
                      className="block h-3.5 w-3.5 rounded-full ring-4 ring-white shadow"
                      style={{ background: phaseColors[s.phase] }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 2.6 }}
          className="mt-6 text-[12px] text-aon-stone tracking-[0.18em] uppercase text-center"
        >
          What looks like one day in your calendar is four months on ours.
        </motion.div>
      </div>
    </Slide>
  );
}
