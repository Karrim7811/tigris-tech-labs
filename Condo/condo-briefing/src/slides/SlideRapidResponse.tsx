"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Plane,
  Shield,
  ClipboardCheck,
  Users,
  CheckCircle2,
} from "lucide-react";
import Slide from "@/components/Slide";

interface Phase {
  when: string;
  hours: string;
  icon: typeof Bell;
  title: string;
  body: string;
}

const phases: Phase[] = [
  {
    when: "Before the storm",
    hours: "Always-on",
    icon: ClipboardCheck,
    title: "Pre-loss assessments",
    body: "Aon partners with your risk team to map business structure, emergency response plans, and resilience baselines for every address.",
  },
  {
    when: "Storm forms",
    hours: "T - 5 days",
    icon: Bell,
    title: "Catastrophe alerts",
    body: "Automated alerts based on your SOV cover 15+ peril types — wind, surge, hail, wildfire, EQ, freeze. Sent to any number of colleagues, customizable by exposure threshold.",
  },
  {
    when: "Storm hits",
    hours: "T + 0",
    icon: Plane,
    title: "Rapid Response activates",
    body: "The Aon Global Rapid Response coordinator triggers — first responders mobilized to your sites within hours.",
  },
  {
    when: "First 48-72 hours",
    hours: "T + 48-72 hr",
    icon: Users,
    title: "Experts on site",
    body: "Loss mitigation consultants, remediation experts, risk engineers, forensic accountants, construction estimators, and security experts on the ground — together.",
  },
  {
    when: "First 30 days",
    hours: "T + 30 days",
    icon: Shield,
    title: "Stabilize & document",
    body: "Stabilize income streams, protect remaining assets, document the loss, build the foundation that wins reserve and interim payments.",
  },
  {
    when: "Ongoing",
    hours: "T + ∞",
    icon: CheckCircle2,
    title: "Complex Claims Advocacy",
    body: "Aon's formal escalation process for complex losses — dedicated advocates, claim preparation, and direct carrier escalation paths.",
  },
];

export default function SlideRapidResponse() {
  return (
    <Slide variant="dark" sectionLabel="Aon Rapid Response" sectionNumber="—">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(235,0,23,0.18),transparent_55%),radial-gradient(circle_at_75%_80%,rgba(40,175,195,0.10),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(6,11,38,0.85)_98%)]" />

      <div className="relative z-10 h-full flex flex-col px-16 pt-20 pb-8 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-red mb-5 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-red" />
          When the loss happens
        </motion.div>

        <div className="grid grid-cols-[1fr_auto] gap-12 items-end mb-6">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-2xl xl:text-4xl font-medium tracking-tight leading-[1.05] text-white max-w-3xl"
          >
            On site within{" "}
            <span className="text-aon-red">48–72 hours</span>.
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-right shrink-0"
          >
            <div className="text-[10px] tracking-[0.3em] uppercase text-aon-cyan/85 mb-1">
              Aon Global Rapid Response
            </div>
            <div className="text-xs text-white/55 max-w-xs">
              Loss-solutions team mobilized worldwide, on standby year-round.
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-3 grid-rows-2 auto-rows-fr gap-4 flex-1 min-h-0">
          {phases.map((p, i) => {
            const Icon = p.icon;
            const isHot = i >= 2 && i <= 3; // the 48-72 window
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: 0.4 + i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ scale: 1.4, zIndex: 20, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
                className={`relative bg-white/[0.04] border rounded-sm p-4 backdrop-blur-sm flex flex-col min-h-0 ${
                  isHot
                    ? "border-aon-red/50 ring-1 ring-aon-red/20 bg-aon-red/[0.06]"
                    : "border-white/10"
                }`}
                style={{
                  boxShadow: isHot ? "0 0 30px rgba(235,0,23,0.20)" : undefined,
                }}
              >
                {/* Storm-front sweep — animated gradient that pulses across hot cards */}
                {isHot && (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(110deg, transparent 0%, transparent 30%, rgba(235,0,23,0.18) 50%, transparent 70%, transparent 100%)",
                      backgroundSize: "220% 100%",
                      animation: "rapid-sweep 3.5s ease-in-out infinite",
                    }}
                  />
                )}
                <style jsx>{`
                  @keyframes rapid-sweep {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -100% 0; }
                  }
                  @keyframes rapid-pulse-icon {
                    0%, 100% { transform: scale(1);   box-shadow: 0 0 0 0 rgba(235,0,23,0.6); }
                    50%      { transform: scale(1.06); box-shadow: 0 0 0 10px rgba(235,0,23,0); }
                  }
                `}</style>

                <div className="relative flex items-start justify-between mb-3">
                  <div
                    className={`grid h-11 w-11 place-items-center rounded-sm ${
                      isHot ? "bg-aon-red text-white" : "bg-white/10 text-aon-cyan"
                    }`}
                    style={{
                      animation: isHot ? "rapid-pulse-icon 2.4s ease-in-out infinite" : undefined,
                    }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-[9px] tracking-[0.2em] uppercase ${
                        isHot ? "text-aon-red" : "text-white/50"
                      }`}
                    >
                      {p.when}
                    </div>
                    <div className="text-[10px] text-white/45 tabular mt-0.5">
                      {p.hours}
                    </div>
                  </div>
                </div>
                <h3 className="relative text-[15px] font-semibold text-white mb-2 leading-tight">
                  {p.title}
                </h3>
                <p className="relative text-[12px] text-white/70 leading-snug">{p.body}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.4 }}
          className="mt-7 text-[12px] text-white/60 italic text-center"
        >
          The morning after a hurricane is not when you want to be hiring an adjuster.
        </motion.div>
      </div>
    </Slide>
  );
}
