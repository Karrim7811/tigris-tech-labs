"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLogoAnimation } from "@/hooks/useLogoAnimation";

const ACCENT = "#1A8A9E";

interface LetterMotion {
  index: number;
  letter: string;
  startLeft: number;
  startTop: number;
  width: number;
  height: number;
  deltaX: number;
  deltaY: number;
  delay: number;
  duration: number;
  finished: boolean;
}

const LETTER_CONFIG = [
  { letter: "A", delay: 0, duration: 650 },
  { letter: "L", delay: 150, duration: 600 },
  { letter: "E", delay: 300, duration: 550 },
  { letter: "V", delay: 450, duration: 500 },
  { letter: "A", delay: 600, duration: 450 },
  { letter: "N", delay: 750, duration: 400 },
  { letter: "T", delay: 900, duration: 350 },
];

export function AlevantLogoAnimated() {
  const shouldAnimate = useLogoAnimation();
  const [letterMotions, setLetterMotions] = useState<LetterMotion[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shouldAnimate) {
      setIsComplete(true);
      return;
    }

    const targetElement = targetRef.current;
    const sourceElements = Array.from(document.querySelectorAll<HTMLElement>("[data-alevant-letter]"));
    if (!targetElement || sourceElements.length !== LETTER_CONFIG.length) {
      setIsComplete(true);
      return;
    }

    const targetRect = targetElement.getBoundingClientRect();
    const motions: LetterMotion[] = LETTER_CONFIG.map((cfg, index) => {
      const source = sourceElements[index];
      const sourceRect = source.getBoundingClientRect();
      const endLeft = targetRect.left + targetRect.width / 2 - sourceRect.width / 2;
      const endTop = targetRect.top + targetRect.height / 2 - sourceRect.height / 2;

      return {
        index,
        letter: cfg.letter,
        startLeft: sourceRect.left,
        startTop: sourceRect.top,
        width: sourceRect.width,
        height: sourceRect.height,
        deltaX: endLeft - sourceRect.left,
        deltaY: endTop - sourceRect.top,
        delay: cfg.delay,
        duration: cfg.duration,
        finished: false,
      };
    });

    setLetterMotions(motions);

    const timers = motions.map((motion) =>
      window.setTimeout(() => {
        setLetterMotions((prev) =>
          prev.map((item) =>
            item.index === motion.index ? { ...item, finished: true } : item
          )
        );
      }, motion.delay + motion.duration)
    );

    const completeTimer = window.setTimeout(() => {
      setIsComplete(true);
    }, Math.max(...motions.map((motion) => motion.delay + motion.duration)) + 100);

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(completeTimer);
    };
  }, [shouldAnimate]);

  const keyframes = useMemo(
    () =>
      letterMotions
        .map(
          (motion) => `
            @keyframes flyLetter${motion.index} {
              0% {
                transform: translate(0, 0) scale(1);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              85% {
                opacity: 1;
              }
              100% {
                transform: translate(${motion.deltaX}px, ${motion.deltaY}px) scale(0.65);
                opacity: 0;
              }
            }
          `
        )
        .join(""),
    [letterMotions]
  );

  return (
    <>
      <style>{keyframes}</style>

      {letterMotions.map((motion) =>
        !motion.finished ? (
          <div
            key={motion.index}
            style={{
              position: "fixed",
              left: motion.startLeft,
              top: motion.startTop,
              width: motion.width,
              height: motion.height,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "clamp(24px, 2vw, 32px)",
              fontWeight: 700,
              color: ACCENT,
              fontFamily: "'Jost', sans-serif",
              pointerEvents: "none",
              zIndex: 1100,
              animation: `flyLetter${motion.index} ${motion.duration}ms cubic-bezier(0.3, 0.0, 0.2, 1) ${motion.delay}ms forwards`,
            }}
          >
            {motion.letter}
          </div>
        ) : null
      )}

      <div
        ref={targetRef}
        style={{
          opacity: isComplete ? 1 : shouldAnimate ? 0 : 1,
          transition: shouldAnimate ? "opacity 600ms ease-in 0ms" : "none",
        }}
      >
        <div
          className="font-light text-[30px] leading-none italic relative inline-block text-parchment"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.01em" }}
        >
          alevan
          <span style={{ color: ACCENT }}>t</span>
          <span
            className="absolute"
            style={{
              top: 4,
              left: 2,
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: ACCENT,
            }}
          />
        </div>
        <div
          className="text-[9px] uppercase mt-2"
          style={{
            letterSpacing: "0.32em",
            color: ACCENT,
            fontFamily: "'Jost', sans-serif",
          }}
        >
          AI Operating System
        </div>
        <div
          className="text-[8px] uppercase mt-1"
          style={{
            letterSpacing: "0.28em",
            color: "#5A5750",
            fontFamily: "'Jost', sans-serif",
          }}
        >
          A Tigris Tech Labs Product
        </div>
      </div>
    </>
  );
}
