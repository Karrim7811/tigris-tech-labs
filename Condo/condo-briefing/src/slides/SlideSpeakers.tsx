"use client";

import { motion } from "framer-motion";
import Slide from "@/components/Slide";

interface Speaker {
  name: string;
  title?: string;
  location: string;
  specialty: string;
}

const speakers: Speaker[] = [
  {
    name: "Karim Nasser",
    location: "Aon — Miami",
    specialty: "Senior Real Estate Advisor · Condominium and Multifamily Industry",
  },
  {
    name: "Kali Mullen",
    location: "Aon — Tampa",
    specialty: "Florida property practice lead",
  },
  {
    name: "Norbert Fernandez",
    location: "Aon — Miami",
    specialty: "Middle Market practice leader",
  },
  {
    name: "Sam Eder",
    title: "Senior Account Executive",
    location: "Aon — Miami",
    specialty: "Real Estate",
  },
];

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export default function SlideSpeakers() {
  return (
    <Slide variant="light" sectionLabel="Your Aon team" sectionNumber="—">
      <div className="bg-grid-light absolute inset-0 opacity-40" />

      <div className="relative z-10 h-full flex flex-col px-20 pt-24 pb-16 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-stone mb-6 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-red" />
          Industry specialists in the room
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl xl:text-6xl font-medium tracking-tight leading-[1.05] text-aon-ink mb-16 max-w-4xl"
        >
          Four specialists, <span className="text-aon-red">one mission</span> —
          <br />
          to translate the market for you.
        </motion.h1>

        {/* Editorial 4-column grid — equal treatment */}
        <div className="grid grid-cols-4 gap-x-12 flex-1 min-h-0 content-start">
          {speakers.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.45 + i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex flex-col"
            >
              {/* Initials disc — uniform navy for all */}
              <div
                className="grid h-20 w-20 place-items-center rounded-full text-white text-[18px] font-semibold tracking-[0.04em] mb-7"
                style={{
                  background:
                    "linear-gradient(135deg, #101E7F 0%, #060B26 100%)",
                  boxShadow: "0 8px 22px rgba(10, 19, 70, 0.18)",
                }}
              >
                {initials(s.name)}
              </div>

              {/* Hairline rule */}
              <div className="h-px w-10 bg-aon-red mb-3" />

              {/* Name in display type */}
              <h3 className="text-xl xl:text-2xl font-semibold text-aon-ink leading-tight mb-2 tracking-tight">
                {s.name}
              </h3>

              {/* Title + location stack */}
              {s.title && (
                <div className="text-[13px] text-aon-graphite font-medium leading-snug">
                  {s.title}
                </div>
              )}
              <div className={`text-[11px] tracking-[0.18em] uppercase text-aon-stone ${s.title ? "mt-1.5" : ""}`}>
                {s.location}
              </div>

              {/* Specialty */}
              <div className="mt-4 text-[12.5px] text-aon-graphite leading-relaxed">
                {s.specialty}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Slide>
  );
}
