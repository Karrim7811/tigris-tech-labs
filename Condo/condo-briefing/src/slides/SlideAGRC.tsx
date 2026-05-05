"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Calculator,
  Briefcase,
  ClipboardList,
  Building2,
} from "lucide-react";
import Slide from "@/components/Slide";
import CountUp from "@/components/CountUp";

interface Pillar {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
  services: string[];
}

const pillars: Pillar[] = [
  {
    icon: ShieldCheck,
    title: "Risk Control",
    body: "Pre-loss engineering across property, casualty, and emerging risk.",
    services: [
      "Property & casualty risk control",
      "Business & supply-chain risk",
      "Cyber risk assessment",
      "Ergonomics",
    ],
  },
  {
    icon: Calculator,
    title: "Actuarial Services",
    body: "The quantitative backbone behind every retention and limit decision.",
    services: [
      "Loss forecasting & pricing",
      "Risk financing analytics (RFDP)",
      "Capital modelling",
      "Asset & BI valuations",
      "Program design",
    ],
  },
  {
    icon: Briefcase,
    title: "Risk Management Outsourcing",
    body: "Operational support that runs alongside or replaces your in-house team.",
    services: [
      "(Re)insurance outsourcing",
      "Solvency II advisory",
      "Business continuity",
      "Rapid Response",
      "Training",
    ],
  },
  {
    icon: Building2,
    title: "Captive & Insurance Mgmt.",
    body: "Alternative-risk vehicles, structured and managed end-to-end.",
    services: [
      "Captive management",
      "Insurance-linked securities",
      "Protected & incorporated cells",
    ],
  },
  {
    icon: ClipboardList,
    title: "Claims Consulting",
    body: "Recovery support that turns a covered loss into dollars in hand.",
    services: [
      "Reserving",
      "Claims preparation",
      "Casualty claims consulting",
      "Aon Claim Closure Services",
    ],
  },
];

export default function SlideAGRC() {
  return (
    <Slide variant="dark" sectionLabel="Aon Global Risk Consulting (AGRC)" sectionNumber="—">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(40,175,195,0.18),transparent_55%),radial-gradient(circle_at_20%_80%,rgba(167,0,112,0.14),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(6,11,38,0.85)_98%)]" />

      <div className="relative z-10 h-full flex flex-col justify-center px-16 py-12 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-cyan mb-4 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-cyan" />
          A consulting bench inside the broker
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-2xl xl:text-4xl font-medium tracking-tight leading-[1.05] text-white max-w-4xl mb-3"
        >
          The risk consulting practice{" "}
          <span className="text-aon-red">behind your placement</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-sm xl:text-base text-white/75 max-w-3xl leading-relaxed mb-5"
        >
          AGRC is Aon's global risk-management consulting practice — the team that
          quantifies your exposure, engineers it down, and stays with you through
          the claim. Pre-loss and post-loss, on the same platform.
        </motion.p>

        {/* Headline stats */}
        <div className="grid grid-cols-3 gap-10 mb-5">
          <Stat value={1300} suffix="" label="Pre & post-loss consultants" sub="One bench, deployed against your renewal." delay={0.45} format="comma" />
          <Stat value={50} suffix="" label="Countries of operation" sub="Wherever your portfolio sits." delay={0.6} />
          <Stat value={150} suffix="+" label="Services delivered" sub="From COPE walks to captive feasibility." delay={0.75} />
        </div>

        {/* Pillars grid */}
        <div className="grid grid-cols-5 gap-4 items-stretch">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: 0.9 + i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ scale: 1.4, zIndex: 20, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
                className="relative bg-white/[0.04] border border-white/10 rounded-sm p-4 backdrop-blur-sm hover:bg-white/[0.07] hover:border-aon-cyan/40 transition-colors flex flex-col h-full"
              >
                <div className="grid h-10 w-10 place-items-center rounded-sm bg-aon-cyan/15 text-aon-cyan mb-3 shrink-0">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-[14px] font-semibold text-white mb-2 leading-tight">
                  {p.title}
                </h3>
                <p className="text-[11px] text-white/65 leading-snug mb-3">{p.body}</p>
                <ul className="space-y-1 text-[11px] text-white/75 leading-snug">
                  {p.services.map((s) => (
                    <li key={s} className="flex gap-2">
                      <span className="text-aon-cyan/70 shrink-0">·</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Slide>
  );
}

function Stat({
  value,
  prefix = "",
  suffix,
  label,
  sub,
  delay,
  decimals,
  format,
}: {
  value: number;
  prefix?: string;
  suffix: string;
  label: string;
  sub: string;
  delay: number;
  decimals?: number;
  format?: "comma";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay }}
      className="border-t-2 border-white/15 pt-3"
    >
      <div className="text-3xl xl:text-5xl font-medium tracking-tight text-white leading-none">
        <CountUp
          to={value}
          prefix={prefix}
          suffix={suffix}
          delay={delay + 0.2}
          duration={1.4}
          decimals={decimals}
          format={format}
        />
      </div>
      <div className="mt-3 text-[13px] text-white/85 font-semibold leading-tight">
        {label}
      </div>
      <div className="text-[11px] text-white/50 mt-1 leading-relaxed">{sub}</div>
    </motion.div>
  );
}
