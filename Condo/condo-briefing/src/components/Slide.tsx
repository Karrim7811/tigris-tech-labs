"use client";

import { ReactNode } from "react";
import Image from "next/image";

type Variant = "dark" | "light";

interface SlideProps {
  children: ReactNode;
  variant?: Variant;
  /** Section number shown top-right (e.g. "01", "02"). Omit to hide. */
  sectionNumber?: string;
  /** Section label shown top-right above the number. */
  sectionLabel?: string;
  /** Override className on the root container. */
  className?: string;
  /** Hide the persistent Aon wordmark for this slide (e.g. detail views). */
  hideWordmark?: boolean;
  /** Hide the section label/number block for this slide. */
  hideSectionMark?: boolean;
}

export default function Slide({
  children,
  variant = "light",
  sectionNumber,
  sectionLabel,
  className = "",
  hideWordmark = true,
  hideSectionMark = false,
}: SlideProps) {
  const isDark = variant === "dark";
  const base = isDark
    ? "bg-aon-midnight text-aon-bone"
    : "bg-aon-bone text-aon-ink";

  return (
    <div className={`absolute inset-0 ${base} ${className}`}>
      {/* Section marker */}
      {!hideSectionMark && (sectionLabel || sectionNumber) && (
        <div
          className={`absolute top-6 right-8 z-40 flex flex-col items-end text-xs tracking-[0.2em] uppercase tabular ${
            isDark ? "text-white/40" : "text-aon-stone/70"
          }`}
        >
          {sectionLabel && <span>{sectionLabel}</span>}
          {sectionNumber && (
            <span
              className={`mt-1 text-3xl font-light tabular ${
                isDark ? "text-white/30" : "text-aon-fog"
              }`}
            >
              {sectionNumber}
            </span>
          )}
        </div>
      )}

      {/* Aon wordmark (top-left, all slides) — official Aon Signature Red SVG.
          Click jumps back to the cover slide. */}
      {!hideWordmark && (
        <a
          href="#1"
          aria-label="Back to start"
          className="absolute top-6 left-8 z-40 cursor-pointer transition-opacity hover:opacity-75"
        >
          <Image
            src="/images/aon-wordmark.svg"
            alt="Aon"
            width={92}
            height={36}
            priority
            style={{ height: 32, width: "auto" }}
          />
        </a>
      )}

      {children}
    </div>
  );
}
