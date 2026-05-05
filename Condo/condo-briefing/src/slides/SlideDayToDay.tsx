"use client";

import { motion } from "framer-motion";
import {
  FileCheck,
  Inbox,
  Users,
  Compass,
  type LucideIcon,
} from "lucide-react";
import Slide from "@/components/Slide";

interface DailyService {
  id: string;
  icon: LucideIcon;
  title: string;
  /** Formal / executive-language description (one tight sentence) */
  formal: string;
  /** Plain-English "what it means for you" framing */
  plain: string;
  /** Service-level commitment shown beneath the title */
  sla?: string;
}

const services: DailyService[] = [
  {
    id: "coi",
    icon: FileCheck,
    title: "Certificate Center",
    formal:
      "COI issuance, vendor compliance tracking, and pre-built endorsement language — self-service for routine, named-team handling for complex.",
    plain:
      "Your pool guy starts Monday — you click, not email. We watch your vendors' insurance expirations so you don't have to.",
    sla: "Same-day standard · 2 business days complex",
  },
  {
    id: "ops",
    icon: Inbox,
    title: "Daily Operations",
    formal:
      "Endorsements, mid-term policy changes, premium audits, loss runs, and coverage interpretation — with continuity protocols when your primary contact is out.",
    plain:
      "The paperwork pile that grows every week — handled. Loss run for next week's board? Done. Adding a unit, switching a vendor? Done.",
    sla: "Continuity protocols — never a dead inbox",
  },
  {
    id: "team",
    icon: Users,
    title: "Dedicated Account Team",
    formal:
      "One named day-to-day contact, backed by a defined service bench — Account Executive, Account Manager, Claims Advocate, Risk Engineer — and AGRC on demand.",
    plain:
      "One person who knows your property and answers your call. Behind them, the full bench. You're never bounced between strangers.",
    sla: "Named contact · full bench on demand",
  },
  {
    id: "agrc",
    icon: Compass,
    title: "AGRC — Beyond Placement",
    formal:
      "Aon Global Risk Consulting embedded in the daily relationship — replacement-cost valuations, vendor-contract risk-transfer review, life-safety engineering.",
    plain:
      "When you need expertise — a valuation for your reserve study, a review of a contractor's insurance language, a board summary — it's already in the relationship.",
    sla: "Pre-loss · placement · post-loss",
  },
];

export default function SlideDayToDay() {
  return (
    <Slide variant="light" sectionLabel="Your day-to-day" sectionNumber="—">
      <div className="bg-grid-light absolute inset-0 opacity-40" />

      <div className="relative z-10 h-full flex flex-col px-16 pt-20 pb-12 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-stone mb-4 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-red" />
          Where insurance becomes invisible
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-3xl xl:text-5xl font-medium tracking-tight leading-[1.05] text-aon-ink mb-3"
        >
          Background service,{" "}
          <span className="text-aon-red">not a daily headache</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-sm xl:text-base text-aon-graphite max-w-3xl leading-relaxed mb-8"
        >
          The systems and people that absorb the daily insurance work property
          managers don't have time for — certificates, endorsements, board
          reporting, vendor compliance.
        </motion.p>

        {/* Column headers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="grid grid-cols-[1fr_1.3fr_1.1fr] gap-8 mb-3 px-1"
        >
          <div />
          <div className="text-[10px] tracking-[0.3em] uppercase text-aon-stone">
            What it is
          </div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-aon-red">
            What it means for you
          </div>
        </motion.div>

        {/* Rows */}
        <div className="flex flex-col divide-y divide-aon-fog/60 border-y border-aon-fog/60 flex-1 min-h-0">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: 0.5 + i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="grid grid-cols-[1fr_1.3fr_1.1fr] gap-8 py-6 items-start"
              >
                {/* Icon + title + SLA */}
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-sm bg-aon-pale text-aon-navy shrink-0">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="pt-0.5">
                    <h3 className="text-base xl:text-lg font-semibold text-aon-ink leading-tight">
                      {s.title}
                    </h3>
                    {s.sla && (
                      <div className="mt-2 text-[10px] tracking-[0.15em] uppercase text-aon-red/85 leading-snug">
                        {s.sla}
                      </div>
                    )}
                  </div>
                </div>

                {/* Formal */}
                <div>
                  <p className="text-sm xl:text-[15px] text-aon-ink leading-relaxed">
                    {s.formal}
                  </p>
                </div>

                {/* Plain English */}
                <div className="border-l-2 border-aon-red/70 pl-5">
                  <p className="text-sm xl:text-[15px] text-aon-ink leading-relaxed italic">
                    {s.plain}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.4 }}
          className="mt-6 text-[13px] text-aon-stone italic text-center"
        >
          The goal: insurance feels like a background service, not a daily headache.
        </motion.div>
      </div>
    </Slide>
  );
}
