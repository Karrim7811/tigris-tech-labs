"use client";

import { motion } from "framer-motion";
import { FileText, ShieldHalf, Wind, DollarSign, UserCheck } from "lucide-react";
import Slide from "@/components/Slide";

interface Advantage {
  icon: typeof FileText;
  title: string;
  carrier: string;
  aon: string;
  why: string;
}

const advantages: Advantage[] = [
  {
    icon: ShieldHalf,
    title: "Tailored sublimits",
    carrier: "Carrier policy: standard sublimit grid applied across the book.",
    aon: "Aon Manuscript: sublimits sized to your actual exposure base.",
    why: "Means every dollar of premium is buying limit you can actually use.",
  },
  {
    icon: Wind,
    title: "Named windstorm coverage",
    carrier: "Carrier policy: wind, surge, hail, rain triggered separately — gaps possible.",
    aon: "Aon Manuscript: one trigger covers wind, gusts, surge, tornadoes, hail, and ensuing rain from a Named Storm.",
    why: "No coverage finger-pointing the morning after the storm.",
  },
  {
    icon: DollarSign,
    title: "Valuation flexibility",
    carrier: "Carrier policy: replacement-cost only if you actually replace the property in kind.",
    aon: "Aon Manuscript: replacement-cost basis even if proceeds go to other capital expenditures within 2 years.",
    why: "Lets the board redirect post-loss dollars to where the building most needs them.",
  },
  {
    icon: UserCheck,
    title: "Loss adjuster choice",
    carrier: "Carrier policy: insurer assigns the adjuster.",
    aon: "Aon Manuscript: Named Insured names the adjuster.",
    why: "The person sizing your claim works for you, not the insurance company.",
  },
];

export default function SlideManuscriptForm() {
  return (
    <Slide variant="light" sectionLabel="Aon Manuscript Form" sectionNumber="—">
      <div className="bg-grid-light absolute inset-0 opacity-40" />

      <div className="relative z-10 h-full flex flex-col justify-center px-16 py-12 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-stone mb-4 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-red" />
          The policy form, rewritten
        </motion.div>

        <div className="grid grid-cols-[1fr_auto] gap-12 items-end mb-5">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-2xl xl:text-4xl font-medium tracking-tight leading-[1.05] text-aon-ink max-w-3xl"
          >
            Same premium.{" "}
            <span className="text-aon-red">Broader policy.</span>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-right shrink-0"
          >
            <FileText className="h-10 w-10 text-aon-red ml-auto" strokeWidth={1.5} />
            <div className="text-[10px] tracking-[0.25em] uppercase text-aon-stone mt-2">
              Aon proprietary form
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-5 items-start">
          {advantages.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: 0.4 + i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ scale: 1.4, zIndex: 20, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
                className="relative bg-white border border-aon-fog/60 rounded-sm p-5 flex gap-4 hover:border-aon-red/50 hover:shadow-lg transition-colors"
              >
                <div className="grid h-11 w-11 place-items-center rounded-sm bg-aon-pale text-aon-navy shrink-0">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <h3 className="text-base xl:text-lg font-semibold text-aon-ink mb-2 leading-tight">
                    {a.title}
                  </h3>
                  <div className="space-y-1.5 text-[12px] leading-snug">
                    <div className="flex gap-2">
                      <span className="text-[9px] tracking-[0.2em] uppercase text-aon-stone shrink-0 w-12 pt-0.5">Carrier</span>
                      <span className="text-aon-graphite">{a.carrier}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[9px] tracking-[0.2em] uppercase text-aon-red font-semibold shrink-0 w-12 pt-0.5">Aon</span>
                      <span className="text-aon-ink font-medium">{a.aon}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-aon-fog/40 text-[11px] text-aon-stone italic leading-snug">
                    {a.why}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Slide>
  );
}
