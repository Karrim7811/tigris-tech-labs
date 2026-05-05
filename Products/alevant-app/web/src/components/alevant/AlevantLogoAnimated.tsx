"use client";

import { useEffect, useRef, useState } from "react";
import { useLogoAnimation } from "@/hooks/useLogoAnimation";

const ACCENT = "#1A8A9E";

interface AnimatedLetterConfig {
  letter: string;
  wordIndex: number;
  startDelay: number;
  duration: number;
}

const LETTERS: AnimatedLetterConfig[] = [
  { letter: "A", wordIndex: 0, startDelay: 0, duration: 600 },      // ACQUIRE
  { letter: "L", wordIndex: 1, startDelay: 150, duration: 550 },    // LISTING
  { letter: "E", wordIndex: 2, startDelay: 300, duration: 500 },    // ENGAGE
  { letter: "V", wordIndex: 3, startDelay: 450, duration: 450 },    // VALIDATE
  { letter: "A", wordIndex: 4, startDelay: 600, duration: 400 },    // AUTOMATE
  { letter: "N", wordIndex: 5, startDelay: 750, duration: 350 },    // NEGOTIATE
  { letter: "T", wordIndex: 6, startDelay: 900, duration: 300 },    // TRANSACT
];

export function AlevantLogoAnimated() {
  const shouldAnimate = useLogoAnimation();
  const [animatingIndices, setAnimatingIndices] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const headerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shouldAnimate) {
      setIsComplete(true);
      return;
    }

    // Start animations
    const animationPromises = LETTERS.map((config) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setAnimatingIndices((prev) => new Set(prev).add(config.wordIndex));

          setTimeout(() => {
            setAnimatingIndices((prev) => {
              const next = new Set(prev);
              next.delete(config.wordIndex);
              return next;
            });
            resolve();
          }, config.duration);
        }, config.startDelay);
      });
    });

    Promise.all(animationPromises).then(() => {
      setIsComplete(true);
    });
  }, [shouldAnimate]);

  return (
    <>
      {/* Inject keyframe animations for each letter */}
      <style>{`
        ${LETTERS.map((config, idx) => {
          return `
            @keyframes flyDownLetter${idx} {
              0% {
                transform: translate(0, 0) scale(1);
                opacity: 0;
              }
              5% {
                opacity: 1;
              }
              95% {
                opacity: 1;
              }
              100% {
                transform: translate(-120px, 160px) scale(0.6);
                opacity: 0;
              }
            }
          `;
        }).join("")}
      `}</style>

      {/* Hidden header reference to measure positions */}
      <div ref={headerContainerRef} style={{ position: "relative" }} />

      {/* Animated letters - rendered as portals near the header */}
      {shouldAnimate && LETTERS.map((config, idx) => {
        const isAnimating = animatingIndices.has(config.wordIndex);
        if (!isAnimating) return null;

        return (
          <div
            key={idx}
            style={{
              position: "fixed",
              top: "60px",
              left: "100px",
              fontSize: "20px",
              fontWeight: "700",
              color: ACCENT,
              fontFamily: "'Jost', sans-serif",
              pointerEvents: "none",
              zIndex: 1000,
              animation: `flyDownLetter${idx} ${config.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            }}
          >
            {config.letter}
          </div>
        );
      })}

      {/* Static logo that fades in after animation */}
      <div
        ref={logoRef}
        style={{
          opacity: isComplete ? 1 : shouldAnimate ? 0 : 1,
          transition: shouldAnimate ? "opacity 600ms ease-in 950ms" : "none",
        }}
      >
        <div
          className="font-light text-[30px] leading-none italic relative inline-block text-parchment"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.01em" }}
        >
          alevan
          <span style={{ color: ACCENT }}>t</span>
          {/* TTL signature dot above first 'a' */}
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
