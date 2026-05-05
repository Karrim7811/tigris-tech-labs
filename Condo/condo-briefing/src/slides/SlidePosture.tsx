"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Slide from "@/components/Slide";

interface AgendaItem {
  title: string;
  description: string;
  /** Slide number this chapter jumps to (1-indexed). */
  jumpTo: number;
}

const agenda: AgendaItem[] = [
  {
    title: "Welcome + your Aon team",
    description: "Why we asked you here. The specialists in the room.",
    jumpTo: 2,
  },
  {
    title: "Aon's scale & service for condos",
    description: "Global broker vs. placement broker — when it matters.",
    jumpTo: 4,
  },
  {
    title: "Florida market 2026 — Property, Casualty, D&O",
    description: "Rates, capacity, what underwriters watch and why.",
    jumpTo: 14,
  },
  {
    title: "Your portfolio in this market",
    description: "Seven of your buildings on a live risk map.",
    jumpTo: 17,
  },
  {
    title: "What carriers reward, penalize, ignore",
    description: "The framework you can use with your boards tomorrow.",
    jumpTo: 21,
  },
  {
    title: "Open Q&A",
    description: "Off-record, on-record, technical, or strategic.",
    jumpTo: 25,
  },
  {
    title: "Close",
    description: "Where we go from here. And what we're not asking for.",
    jumpTo: 26,
  },
];

export default function SlidePosture() {
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);

  const handleJump = (i: number, slide: number) => {
    if (clickedIndex !== null) return;
    setClickedIndex(i);
    // Brief flash / scale on the row, then navigate
    window.setTimeout(() => {
      window.location.hash = String(slide);
    }, 320);
  };

  return (
    <Slide variant="light" sectionLabel="Today's runway" sectionNumber="01">
      <div className="bg-grid-light absolute inset-0 opacity-40" />

      <div className="relative z-10 h-full flex flex-col px-20 pt-24 pb-16 max-w-[1500px] mx-auto">
        <div className="flex items-end justify-between mb-12 gap-10">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl xl:text-5xl font-medium tracking-tight leading-[1.05] text-aon-ink"
          >
            Today&apos;s <span className="text-aon-red">agenda</span>.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-right shrink-0"
          >
            <div className="text-[10px] tracking-[0.3em] uppercase text-aon-stone mb-1">
              Tap any line to jump
            </div>
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-4xl xl:text-5xl font-medium text-aon-ink tabular leading-none">
                7
              </span>
              <span className="text-base text-aon-graphite font-semibold">
                acts
              </span>
            </div>
          </motion.div>
        </div>

        {/* Editorial TOC */}
        <ul className="flex flex-col flex-1 min-h-0 border-t border-aon-fog/60">
          {agenda.map((item, i) => {
            const isClicked = clickedIndex === i;
            return (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: 0.5 + i * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="border-b border-aon-fog/60 flex-1 min-h-0"
              >
                <button
                  onClick={() => handleJump(i, item.jumpTo)}
                  className={`group w-full h-full flex items-center gap-10 py-4 px-2 -mx-2 rounded-sm text-left transition-all ${
                    isClicked
                      ? "bg-aon-red/15"
                      : "hover:bg-aon-pale/60"
                  }`}
                >
                  {/* Numeral */}
                  <motion.div
                    animate={
                      isClicked
                        ? { scale: 1.15, color: "#EB0017" }
                        : { scale: 1 }
                    }
                    transition={{ duration: 0.32 }}
                    className={`text-5xl xl:text-7xl font-medium tabular leading-none w-24 shrink-0 transition-colors ${
                      isClicked
                        ? "text-aon-red"
                        : "text-aon-fog group-hover:text-aon-red"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </motion.div>

                  {/* Title + description */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-xl xl:text-2xl font-semibold leading-tight transition-colors ${
                        isClicked
                          ? "text-aon-red"
                          : "text-aon-ink group-hover:text-aon-red"
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p className="text-[13px] xl:text-[14px] text-aon-graphite mt-1 leading-snug">
                      {item.description}
                    </p>
                  </div>

                  {/* Jump arrow */}
                  <motion.div
                    animate={
                      isClicked ? { x: 8, opacity: 1 } : { x: 0, opacity: 0.4 }
                    }
                    className="text-2xl xl:text-3xl text-aon-red font-light w-10 shrink-0 text-right transition-opacity group-hover:opacity-100"
                  >
                    →
                  </motion.div>
                </button>
              </motion.li>
            );
          })}
        </ul>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-6 text-[11px] tracking-[0.3em] uppercase text-aon-stone flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-stone/40" />
          Begins when you&apos;re ready · Press → or tap a line above
        </motion.div>
      </div>
    </Slide>
  );
}
