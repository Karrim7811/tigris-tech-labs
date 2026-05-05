"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardCheck,
  ShieldCheck,
  Building2,
  Gauge,
  HandCoins,
  HeartPulse,
  LineChart,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import Slide from "@/components/Slide";

interface Service {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
  /** Headline detail surfaced on the expanded view. */
  lead: string;
  /** Bullet list of sub-services / capabilities. Keep to 6-8 items max. */
  capabilities: string[];
  /** Statistic / proof point shown bottom-right on the expanded view. */
  proof?: { value: string; label: string };
}

const services: Service[] = [
  {
    id: "pre-renewal",
    icon: ClipboardCheck,
    title: "Pre-renewal strategy",
    body: "Market posture, structure, and benchmarking 90+ days before inception.",
    lead: "We start the renewal conversation a quarter early, so the placement isn't a scramble.",
    capabilities: [
      "Renewal strategy meeting — state of market, prior program review, objectives",
      "Optimization of natural-catastrophe limits to your exposure base",
      "Global marketing strategy across US Direct, E&S, London, and Bermuda",
      "Insurer access points — both channels and the named underwriters who price you",
      "Cornerstone management presentation to the carrier",
      "Aon manuscript form and submission generation",
      "Underwriting meetings (London & Bermuda roadshow when warranted)",
    ],
    proof: { value: "90+ days", label: "from kick-off to bind" },
  },
  {
    id: "engineering",
    icon: Building2,
    title: "Property engineering",
    body: "On-site COPE collection, valuation work, secondary modifiers — submission-ready.",
    lead: "Submission-ready data is the difference between four carriers competing and one declining.",
    capabilities: [
      "Property protection standards development",
      "Property risk control reports and on-site COPE collection",
      "Equipment breakdown assessments",
      "Loss estimate studies (PML / MFL)",
      "Fire protection systems consulting",
      "Natural hazards data collection",
      "Hazard analysis & mitigation consulting",
      "Replacement-cost valuations (3-tiered: Portfolio Insight / Desktop / On-Site)",
    ],
    proof: { value: "AGRC", label: "1,300 pre/post-loss consultants in 50 countries" },
  },
  {
    id: "modeling",
    icon: Gauge,
    title: "Catastrophe modeling",
    body: "AIR-driven wind, surge, flood, and earthquake modeling tailored to your portfolio.",
    lead: "We model the storm before the carrier does.",
    capabilities: [
      "AIR-driven catastrophe modeling — wind, storm surge, flood, earthquake",
      "Probabilistic loss curves (AAL, OEP, AEP) per location and aggregate",
      "Climate-change vulnerability assessments",
      "NOAA HURDAT2 historical event mapping against your assets",
      "Scenario testing — Cat 1 → Cat 5 surge against each address",
      "Output formatted for direct submission to underwriters",
    ],
    proof: { value: "8 perils", label: "modeled per location" },
  },
  {
    id: "allocation",
    icon: HandCoins,
    title: "Premium allocation",
    body: "Defensible, transparent allocation across associations and unit owners.",
    lead: "An allocation methodology you can defend on the next board call.",
    capabilities: [
      "Unit-level rate development tied to TIV, occupancy, and exposure modifiers",
      "Per-association and per-unit-owner breakdowns",
      "Audit trail — every allocation traces back to a documented driver",
      "Optional benchmarking against comparable South Florida portfolios",
      "Reproducible at renewal with one-click roll-forward",
    ],
    proof: { value: "$700M", label: "real-estate GWP placed annually" },
  },
  {
    id: "claims",
    icon: ShieldCheck,
    title: "Claims advocacy",
    body: "Dedicated advocates, claim preparation, and complex-loss escalation.",
    lead: "When the loss happens at 3 a.m., someone is already on the way.",
    capabilities: [
      "Aon Global Rapid Response — first responder on-site within 48–72 hours",
      "Loss mitigation consultants, remediation experts, risk engineers",
      "Forensic accountants, construction estimators, security experts",
      "Aon Complex Claims Advocacy — formal escalation process",
      "Pre-loss assessments and emergency response plan integration",
      "Catastrophe alert subscriptions for 15+ peril types per address",
      "Claims preparation: PD/BI, cyber, crime, product recall",
    ],
    proof: { value: "48–72 hr", label: "first responder on site after a CAT event" },
  },
  {
    id: "stewardship",
    icon: HeartPulse,
    title: "Mid-term stewardship",
    body: "Quarterly check-ins, market shifts, and structural recommendations.",
    lead: "The renewal is one day. The other 364 are stewardship.",
    capabilities: [
      "Quarterly portfolio reviews — market shifts, carrier appetite, capacity changes",
      "Structural recommendations as exposure or program design evolves",
      "Mid-term coverage adjustments without renewal-cycle penalty",
      "Open-line access to the named claims advocate",
      "Annual benchmarking against your peer condo portfolios",
    ],
    proof: { value: "Quarterly", label: "stewardship cadence as standard" },
  },
  {
    id: "analyzer",
    icon: LineChart,
    title: "Property Risk Analyzer",
    body: "SOV ingestion, exposure visualization, modeled losses, and total cost of risk in one tool.",
    lead: "The Aon proprietary platform that turns your SOV into a placement strategy.",
    capabilities: [
      "Statement-of-Values ingestion — accepts any spreadsheet format, auto-extracts to digital",
      "Exposure analysis — every property visualized on a map with COPE breakdown",
      "Loss analysis — cat and non-cat modeled losses per location, per peril",
      "Loss forecasting via independent third-party + Aon proprietary actuarial model",
      "Insurance program optimization — overlay multiple program structures on the model",
      "Total Cost of Risk (TCOR) — actuarially driven, comparable across program designs",
    ],
    proof: { value: "Proprietary", label: "Aon-only platform" },
  },
];

export default function SlideServiceOffering() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? services.find((s) => s.id === selectedId) : null;

  return (
    <Slide variant="light" sectionLabel="Service offering" sectionNumber="—" hideWordmark={false}>
      <div className="bg-grid-light absolute inset-0 opacity-40" />

      <AnimatePresence mode="wait">
        {selected ? (
          <ServiceDetail
            key={`detail-${selected.id}`}
            service={selected}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 h-full flex flex-col justify-center px-20 pt-24 pb-12 max-w-[1700px] mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xs tracking-[0.35em] uppercase text-aon-stone mb-6 flex items-center gap-3"
            >
              <span className="h-px w-8 bg-aon-red" />
              What you get, beyond placement
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl xl:text-6xl font-medium tracking-tight leading-[1.05] text-aon-ink mb-12"
            >
              The work we do{" "}
              <span className="text-aon-red">between renewals</span>.
            </motion.h1>

            <div className="grid grid-cols-4 gap-5">
              {services.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.button
                    key={s.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.55,
                      delay: 0.4 + i * 0.07,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={{ scale: 1.4, zIndex: 20, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
                    onClick={() => setSelectedId(s.id)}
                    className="group relative bg-white border border-aon-fog/60 rounded-sm p-6 text-left hover:border-aon-red/60 hover:shadow-lg transition-colors"
                  >
                    <div className="grid h-11 w-11 place-items-center rounded-sm bg-aon-pale text-aon-navy mb-4 group-hover:bg-aon-red group-hover:text-white transition-colors">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-base xl:text-lg font-semibold text-aon-ink mb-1.5 leading-tight">
                      {s.title}
                    </h3>
                    <p className="text-[12px] text-aon-graphite leading-relaxed">{s.body}</p>
                    <div className="mt-3 text-[10px] tracking-[0.2em] uppercase text-aon-red opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to expand →
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="mt-7 text-[11px] text-aon-stone/80 tracking-[0.18em] uppercase text-center"
            >
              ↳ Click any tile to see the underlying capability
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Slide>
  );
}

/* ─────────── Detail view ─────────── */

function ServiceDetail({
  service,
  onBack,
}: {
  service: Service;
  onBack: () => void;
}) {
  const Icon = service.icon;
  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 h-full flex flex-col px-20 pt-20 pb-10 max-w-[1500px] mx-auto"
    >
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-aon-stone hover:text-aon-red transition-colors w-fit"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All capabilities
      </button>

      <div className="flex items-start gap-6 mb-2">
        <div className="grid h-16 w-16 place-items-center rounded-sm bg-aon-red text-white shrink-0 shadow-md">
          <Icon className="h-8 w-8" strokeWidth={1.75} />
        </div>
        <div className="flex-1 pt-1">
          <div className="text-[11px] tracking-[0.3em] uppercase text-aon-stone mb-2">
            Service offering
          </div>
          <h1 className="text-3xl xl:text-5xl font-medium tracking-tight text-aon-ink leading-[1.05]">
            {service.title}
          </h1>
        </div>
      </div>

      <p className="mt-7 text-lg xl:text-xl text-aon-graphite leading-relaxed max-w-3xl">
        {service.lead}
      </p>

      <div className="mt-10 grid grid-cols-3 gap-12 flex-1">
        <div className="col-span-2">
          <div className="text-[10px] tracking-[0.3em] uppercase text-aon-stone mb-4">
            What's included
          </div>
          <ul className="space-y-3">
            {service.capabilities.map((c, i) => (
              <motion.li
                key={c}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                className="flex items-start gap-3 text-[15px] text-aon-ink leading-snug"
              >
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-aon-red shrink-0" />
                <span>{c}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {service.proof && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="self-start sticky top-0"
          >
            <div className="border-l-2 border-aon-red pl-6">
              <div className="text-[10px] tracking-[0.3em] uppercase text-aon-stone mb-3">
                Proof point
              </div>
              <div className="text-5xl xl:text-7xl font-medium tracking-tight text-aon-ink leading-[0.95]">
                {service.proof.value}
              </div>
              <div className="text-sm text-aon-graphite mt-3 leading-snug">
                {service.proof.label}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
