"use client";

import { motion } from "framer-motion";
import Slide from "@/components/Slide";

export type FrameworkMode = "reward" | "penalize" | "ignore";

export interface FrameworkItem {
  title: string;
  body: string;
}

interface FrameworkSlideProps {
  mode: FrameworkMode;
  sectionLabel: string;
  sectionNumber: string;
  kicker: string;
  titlePrefix: string;
  titleAccent: string;
  items: FrameworkItem[];
  hideWordmark?: boolean;
}

const accentByMode: Record<FrameworkMode, { text: string; bg: string; ring: string; rule: string }> = {
  reward: {
    text: "text-aon-teal",
    bg: "bg-aon-teal/10",
    ring: "ring-aon-teal/20",
    rule: "bg-aon-teal",
  },
  penalize: {
    text: "text-aon-red",
    bg: "bg-aon-red/10",
    ring: "ring-aon-red/20",
    rule: "bg-aon-red",
  },
  ignore: {
    text: "text-aon-stone",
    bg: "bg-aon-stone/10",
    ring: "ring-aon-stone/25",
    rule: "bg-aon-stone",
  },
};

export default function FrameworkSlide({
  mode,
  sectionLabel,
  sectionNumber,
  kicker,
  titlePrefix,
  titleAccent,
  items,
  hideWordmark,
}: FrameworkSlideProps) {
  const accent = accentByMode[mode];

  return (
    <Slide variant="light" sectionLabel={sectionLabel} sectionNumber={sectionNumber} hideWordmark={hideWordmark}>
      <div className="bg-grid-light absolute inset-0 opacity-40" />

      <div className="relative z-10 h-full flex flex-col justify-center px-20 pt-24 pb-12 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`text-xs tracking-[0.35em] uppercase mb-6 flex items-center gap-3 ${accent.text}`}
        >
          <span className={`h-px w-8 ${accent.rule}`} />
          {kicker}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl xl:text-7xl font-medium tracking-tight leading-[1.02] text-aon-ink"
        >
          {titlePrefix}{" "}
          <span className={accent.text}>{titleAccent}</span>
        </motion.h1>

        <div className="grid grid-cols-5 gap-5 mt-20">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.45 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.4, zIndex: 20, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
              className={`relative rounded-sm border-t-2 pt-6 px-5 pb-6 ${accent.bg} ring-1 ${accent.ring}`}
              style={{ borderTopColor: "currentColor" }}
            >
              <div className={`${accent.text} mb-4`}>
                <span className="text-3xl font-medium tabular tracking-tight">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="text-lg xl:text-xl font-semibold text-aon-ink leading-tight mb-3">
                {item.title}
              </h3>
              <p className="text-sm text-aon-graphite leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Slide>
  );
}
