"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import Slide from "@/components/Slide";

interface Speaker {
  /** Lane / what they own — leads each row visually. */
  lane: string;
  name: string;
  location: string;
  /** Title (e.g. Senior Vice President). */
  title: string;
  /** Path to portrait, e.g. "/images/speakers/karim.jpg". When absent, initials disc renders. */
  photo?: string;
}

const speakers: Speaker[] = [
  {
    lane: "Commercial Risk",
    name: "Karim Nasser",
    location: "Aon — Miami",
    title: "Senior Vice President",
    photo: "/images/speakers/karim.jpg",
  },
  {
    lane: "Florida Property Leader",
    name: "Kali Mullen",
    location: "Aon — Tampa",
    title: "Senior Vice President",
    photo: "/images/speakers/kali.jpg",
  },
  {
    lane: "Florida Middle Market Leader",
    name: "Norbert Fernandez",
    location: "Aon — Miami",
    title: "Senior Vice President",
    photo: "/images/speakers/norbert.jpg",
  },
  {
    lane: "Real Estate",
    name: "Sam Eder",
    location: "Aon — Tampa",
    title: "Senior Account Executive",
  },
];

const WAVE_BARS = [0.35, 0.7, 1, 0.55, 0.85, 0.4, 0.95, 0.5, 0.75, 0.3, 0.6, 0.45];

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

        {/* Editorial roster — portrait + lane + one-liner */}
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
              className="border-b border-aon-fog/60 flex-1 min-h-0 transition-colors"
            >
              <div className="h-full flex items-center gap-7 py-4 px-2 -mx-2">
                {/* Portrait — photo if available, initials disc otherwise */}
                <div className="relative shrink-0">
                  {s.photo ? (
                    <div
                      className="relative h-20 w-20 rounded-full overflow-hidden ring-2 ring-aon-fog/70"
                      style={{ boxShadow: "0 6px 18px rgba(10, 19, 70, 0.18)" }}
                    >
                      <Image
                        src={s.photo}
                        alt={s.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="grid h-20 w-20 place-items-center rounded-full text-white text-[20px] font-semibold tracking-[0.04em] ring-2 ring-aon-fog/70"
                      style={{
                        background:
                          "linear-gradient(135deg, #101E7F 0%, #060B26 100%)",
                        boxShadow: "0 6px 18px rgba(10, 19, 70, 0.18)",
                      }}
                    >
                      {initials(s.name)}
                    </div>
                  )}

                  {/* Mic badge — every speaker takes the floor */}
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.7 + i * 0.08,
                      type: "spring",
                      stiffness: 320,
                      damping: 18,
                    }}
                    className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-md bg-aon-red text-white ring-2 ring-white"
                    style={{ boxShadow: "0 4px 14px rgba(235, 0, 23, 0.45)" }}
                    aria-label="Speaks in this session"
                  >
                    <Mic className="h-[15px] w-[15px]" strokeWidth={2.5} />
                  </motion.div>
                </div>

                {/* Numeral */}
                <div className="text-3xl xl:text-5xl font-medium tabular leading-none w-16 shrink-0 text-aon-fog">
                  {String(i + 1).padStart(2, "0")}
                </div>

                {/* Lane (kicker) — fixed width column */}
                <div className="w-[260px] shrink-0">
                  <div className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-1 text-aon-stone">
                    {s.lane}
                  </div>
                  <div className="text-xl xl:text-2xl font-semibold text-aon-ink leading-tight tracking-tight">
                    {s.name}
                  </div>
                  <div className="text-[11px] tracking-[0.18em] uppercase text-aon-stone mt-1">
                    {s.location}
                  </div>
                  <div className="text-[12px] text-aon-graphite mt-1 leading-snug font-medium">
                    {s.title}
                  </div>
                </div>

                {/* Speaks-now cue — minimalist waveform + tracked label */}
                <div className="flex-1 min-w-0 border-l-2 border-aon-fog/60 pl-7 flex items-center justify-between gap-6">
                  <div
                    className="flex items-end gap-[3px] h-7"
                    aria-hidden
                  >
                    {WAVE_BARS.map((h, b) => (
                      <motion.span
                        key={b}
                        initial={{ scaleY: 0.2, opacity: 0 }}
                        animate={{
                          scaleY: [0.25, h, 0.45, h * 0.9, h],
                          opacity: 1,
                        }}
                        transition={{
                          delay: 0.9 + i * 0.08 + b * 0.03,
                          duration: 1.6,
                          repeat: Infinity,
                          repeatType: "mirror",
                          ease: "easeInOut",
                        }}
                        className="w-[3px] origin-bottom rounded-full bg-aon-red/55"
                        style={{ height: `${h * 100}%` }}
                      />
                    ))}
                  </div>

                  <div className="text-[10px] tracking-[0.32em] uppercase text-aon-stone shrink-0 flex items-center gap-3">
                    <span className="h-px w-6 bg-aon-stone/40" />
                    Introduces themselves
                  </div>
                </div>

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
