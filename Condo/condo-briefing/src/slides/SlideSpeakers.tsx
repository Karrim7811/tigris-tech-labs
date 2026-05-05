"use client";

import { motion } from "framer-motion";
import Slide from "@/components/Slide";

interface Speaker {
  /** Lane / what they own — leads each row visually. */
  lane: string;
  name: string;
  location: string;
  /** One-liner: what this person solves for the audience. */
  oneLiner: string;
  /** Optional secondary title (shown beside the location). */
  title?: string;
  /** Marks the presenter — gets the red accent + LEAD tag. */
  isLead?: boolean;
}

const speakers: Speaker[] = [
  {
    lane: "Florida property",
    name: "Kali Mullen",
    location: "Aon — Tampa",
    oneLiner: "Sees every FL wind line in the state.",
  },
  {
    lane: "Real estate",
    name: "Karim Nasser",
    location: "Aon — Miami",
    title: "SVP · Senior Real Estate Advisor",
    oneLiner: "Condominium & multifamily playbook. Leading the session today.",
    isLead: true,
  },
  {
    lane: "Casualty & D&O",
    name: "Norbert Fernandez",
    location: "Aon — Miami",
    oneLiner: "Middle Market practice leader. Boards and liability live here.",
  },
  {
    lane: "Your day-to-day",
    name: "Sam Eder",
    location: "Aon — Miami",
    title: "Senior Account Executive · Real Estate",
    oneLiner: "Runs your account 364 days a year. The Tuesday phone call.",
  },
];

export default function SlideSpeakers() {
  return (
    <Slide variant="light" sectionLabel="Your Aon team" sectionNumber="—" hideWordmark={false}>
      <div className="bg-grid-light absolute inset-0 opacity-40" />

      <div className="relative z-10 h-full flex flex-col px-20 pt-24 pb-12 max-w-[1500px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-stone mb-6 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-red" />
          The specialists in the room
        </motion.div>

        <div className="flex items-end justify-between mb-12 gap-10">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl xl:text-6xl font-medium tracking-tight leading-[1.05] text-aon-ink max-w-3xl"
          >
            Four lanes of risk.
            <br />
            <span className="text-aon-red">One team.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-right shrink-0"
          >
            <div className="text-[10px] tracking-[0.3em] uppercase text-aon-stone mb-1">
              Specialists in the room
            </div>
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-4xl xl:text-5xl font-medium text-aon-ink tabular leading-none">
                4
              </span>
              <span className="text-base text-aon-graphite font-semibold">
                names
              </span>
            </div>
          </motion.div>
        </div>

        {/* Editorial roster — numbered rows */}
        <ul className="flex flex-col flex-1 min-h-0 border-t border-aon-fog/60">
          {speakers.map((s, i) => (
            <motion.li
              key={s.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.5 + i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`border-b border-aon-fog/60 flex-1 min-h-0 transition-colors ${
                s.isLead ? "bg-aon-red/[0.04]" : ""
              }`}
            >
              <div className="h-full flex items-center gap-8 py-4 px-2 -mx-2">
                {/* Numeral */}
                <div
                  className={`text-5xl xl:text-7xl font-medium tabular leading-none w-24 shrink-0 ${
                    s.isLead ? "text-aon-red" : "text-aon-fog"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>

                {/* Lane (kicker) — fixed width column */}
                <div className="w-[230px] shrink-0">
                  <div
                    className={`text-[10px] tracking-[0.3em] uppercase font-semibold mb-1 ${
                      s.isLead ? "text-aon-red" : "text-aon-stone"
                    }`}
                  >
                    {s.lane}
                  </div>
                  <div className="text-xl xl:text-2xl font-semibold text-aon-ink leading-tight tracking-tight">
                    {s.name}
                  </div>
                  <div className="text-[11px] tracking-[0.18em] uppercase text-aon-stone mt-1">
                    {s.location}
                  </div>
                  {s.title && (
                    <div className="text-[12px] text-aon-graphite mt-1 leading-snug">
                      {s.title}
                    </div>
                  )}
                </div>

                {/* One-liner — flex */}
                <div className="flex-1 min-w-0 border-l-2 border-aon-fog/60 pl-8">
                  <p className="text-base xl:text-lg text-aon-ink leading-snug">
                    {s.oneLiner}
                  </p>
                </div>

                {/* Lead tag */}
                {s.isLead && (
                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-2 bg-aon-red text-white text-[10px] tracking-[0.2em] uppercase font-bold px-3 py-1.5 rounded-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      Lead · presenting today
                    </span>
                  </div>
                )}
              </div>
            </motion.li>
          ))}
        </ul>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.7 }}
          className="mt-6 text-[11px] tracking-[0.3em] uppercase text-aon-stone flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-stone/40" />
          When something goes wrong, you want the specialist — not the generalist
        </motion.div>
      </div>
    </Slide>
  );
}
