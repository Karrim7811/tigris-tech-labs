"use client";

import { motion } from "framer-motion";
import Slide from "@/components/Slide";

const speakers = [
  {
    initials: "KN",
    name: "Karim Nasser",
    title: "SVP · Senior Real Estate Advisor",
    location: "Aon — Miami",
    isLead: true,
  },
  {
    initials: "KM",
    name: "Kali Mullen",
    title: "SVP · Florida Property Lead",
    location: "Aon — Tampa",
  },
  {
    initials: "NF",
    name: "Norbert Fernandez",
    title: "SVP · Middle Market",
    location: "Aon — Miami",
  },
  {
    initials: "SE",
    name: "Sam Eder",
    title: "Senior Account Executive · Real Estate",
    location: "Aon — Miami",
  },
];

export default function SlideQA() {
  return (
    <Slide variant="dark" hideSectionMark className="!bg-aon-midnight">
      <div className="absolute inset-0 bg-grid opacity-25" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(40,175,195,0.18),transparent_55%),radial-gradient(circle_at_75%_85%,rgba(235,0,23,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(6,11,38,0.85)_95%)]" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-aon-cyan/35"
            style={{
              left: `${(i * 9.7 + 11) % 100}%`,
              top: `${(i * 17.3 + 13) % 100}%`,
            }}
            animate={{
              y: [0, -28, 0],
              opacity: [0.2, 0.7, 0.2],
            }}
            transition={{
              duration: 7 + (i % 3),
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 h-full flex flex-col justify-between px-16 pt-24 pb-12 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-xs tracking-[0.4em] uppercase text-aon-cyan flex items-center gap-3"
        >
          <span className="h-px w-10 bg-aon-cyan" />
          The floor is yours
        </motion.div>

        {/* Hero block */}
        <div className="flex flex-col">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-[120px] xl:text-[180px] font-medium tracking-tight leading-[0.9] text-white"
          >
            Q<span className="text-aon-red">&amp;</span>A
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-xl xl:text-2xl text-white/75 max-w-3xl leading-snug mt-6"
          >
            What we didn&apos;t cover. What you&apos;re skeptical of.{" "}
            <span className="text-aon-red font-semibold">
              What&apos;s nagging at the back of the room.
            </span>
          </motion.p>
        </div>

        {/* Speakers row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="grid grid-cols-4 gap-5 border-t border-white/15 pt-8"
        >
          {speakers.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 1.3 + i * 0.1 }}
              className="flex items-center gap-4"
            >
              <div
                className={`grid h-14 w-14 place-items-center rounded-full text-[14px] font-semibold tracking-wide ring-2 shrink-0 ${
                  s.isLead
                    ? "bg-gradient-to-br from-aon-red to-aon-red-dark text-white ring-aon-red/40"
                    : "bg-aon-navy text-white ring-aon-navy/40"
                }`}
              >
                {s.initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-[15px] font-semibold text-white truncate">
                    {s.name}
                  </div>
                  {s.isLead && (
                    <span className="text-[9px] tracking-[0.2em] uppercase text-aon-red font-bold">
                      Lead
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-white/70 leading-snug mt-0.5">
                  {s.title}
                </div>
                <div className="text-[10px] tracking-[0.15em] uppercase text-aon-cyan/75 mt-0.5">
                  {s.location}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Slide>
  );
}
