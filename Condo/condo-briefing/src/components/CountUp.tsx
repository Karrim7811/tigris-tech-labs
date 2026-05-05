"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

interface CountUpProps {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  /** Delay before counting starts (seconds). */
  delay?: number;
  /** "comma" → thousand-separator (1,800). Default: no separator. */
  format?: "comma";
}

export default function CountUp({
  to,
  prefix = "",
  suffix = "",
  duration = 1.8,
  decimals = 0,
  delay = 0,
  format,
}: CountUpProps) {
  const value = useMotionValue(0);
  const rounded = useTransform(value, (v) => {
    const n = decimals > 0 ? Number(v.toFixed(decimals)) : Math.round(v);
    if (format === "comma") {
      return n.toLocaleString("en-US", {
        minimumFractionDigits: decimals ?? 0,
        maximumFractionDigits: decimals ?? 0,
      });
    }
    return decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString();
  });

  useEffect(() => {
    const ctrl = animate(value, to, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => ctrl.stop();
  }, [to, duration, delay, value]);

  return (
    <span className="tabular inline-flex items-baseline">
      {prefix && <span>{prefix}</span>}
      <motion.span>{rounded}</motion.span>
      {suffix && <span>{suffix}</span>}
    </span>
  );
}
