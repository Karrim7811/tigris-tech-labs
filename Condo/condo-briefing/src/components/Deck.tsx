"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { slides } from "@/slides";

function readHashIndex(total: number): number {
  if (typeof window === "undefined") return 0;
  const raw = window.location.hash.replace("#", "");
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(Math.max(n - 1, 0), total - 1);
}

export default function Deck() {
  const [index, setIndex] = useState<number>(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const total = slides.length;

  useEffect(() => {
    setIndex(readHashIndex(total));
    const onHash = () => setIndex(readHashIndex(total));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [total]);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, 0), total - 1);
      if (clamped === index) return;
      setDirection(clamped > index ? 1 : -1);
      window.location.hash = String(clamped + 1);
    },
    [index, total]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault();
          goTo(index + 1);
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          goTo(index - 1);
          break;
        case "Home":
          e.preventDefault();
          goTo(0);
          break;
        case "End":
          e.preventDefault();
          goTo(total - 1);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index, total]);

  const Current = slides[index].component;

  return (
    <div className="deck-root">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          initial={{ opacity: 0, x: direction === 1 ? 40 : -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction === 1 ? -40 : 40 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Current />
        </motion.div>
      </AnimatePresence>

      {/* Back button — hidden on first slide */}
      {index > 0 && (
        <button
          onClick={() => goTo(index - 1)}
          aria-label="Previous slide"
          className="absolute bottom-3 left-4 z-50 px-3 py-1.5 text-[10px] tracking-[0.25em] uppercase font-semibold mix-blend-difference text-white/70 hover:text-white border border-white/30 hover:border-white/60 rounded-sm transition-colors flex items-center gap-2"
        >
          <span aria-hidden>‹</span>
          <span>Back</span>
        </button>
      )}

      {/* Bottom-right meta: confidentiality + slide counter, compact */}
      <div className="absolute bottom-3 right-4 z-50 pointer-events-none flex items-center gap-2 text-[8px] tracking-[0.25em] uppercase mix-blend-difference text-white/50 tabular whitespace-nowrap">
        <span>Proprietary · Confidential</span>
        <span className="opacity-30">·</span>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <span className="opacity-30">/</span>
        <span>{String(total).padStart(2, "0")}</span>
      </div>

      {/* Subtle nav hint (only on first slide) */}
      {index === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1.2 }}
          className="absolute bottom-6 left-8 z-50 text-xs tracking-[0.2em] uppercase text-white/40"
        >
          Press → to begin
        </motion.div>
      )}
    </div>
  );
}
