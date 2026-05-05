"use client";

import { motion } from "framer-motion";

/**
 * Atmospheric peril FX layered behind/around the cover blueprint.
 *
 * Layers, back to front:
 *  - hurricane spiral (slow rotating swirl in the background)
 *  - wind streaks  (horizontal speed lines drifting right→left)
 *  - rain          (angled cyan streaks falling)
 *  - flood line    (a low cyan water plane with morphing wave)
 *  - lightning     (very-rare full-bleed flash)
 *
 * Everything is `pointer-events-none` and color-keyed to brand cyan
 * so the cover still reads as architectural / serious.
 */
export default function PerilLayer() {
  // Deterministic params keep server/client renders stable
  const winds = Array.from({ length: 14 }, (_, i) => ({
    top: ((i * 11.3) + 4) % 95,
    width: 28 + ((i * 17) % 50),
    duration: 4.2 + (i % 4) * 0.6,
    delay: (i * 0.45) % 5,
    opacity: 0.18 + ((i * 7) % 5) * 0.05,
  }));

  const rain = Array.from({ length: 70 }, (_, i) => ({
    left: ((i * 13.7) + 3) % 100,
    duration: 0.85 + ((i * 5) % 6) * 0.08,
    delay: ((i * 0.07) + (i % 7) * 0.13) % 3,
    height: 14 + (i % 5) * 4,
    opacity: 0.35 + ((i * 3) % 5) * 0.08,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* HURRICANE SPIRAL — back of stack */}
      <motion.div
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          width: "180vmax",
          height: "180vmax",
          marginLeft: "-90vmax",
          marginTop: "-90vmax",
        }}
        initial={{ rotate: 0, opacity: 0 }}
        animate={{ rotate: 360, opacity: 1 }}
        transition={{
          rotate: { duration: 90, repeat: Infinity, ease: "linear" },
          opacity: { duration: 3.5, delay: 0.5 },
        }}
      >
        <svg viewBox="-100 -100 200 200" className="w-full h-full" fill="none">
          <defs>
            <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#73E2D8" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#28AFC3" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#28AFC3" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Eye of the storm */}
          <circle cx="0" cy="0" r="6" fill="url(#eyeGlow)" />

          {/* Spiral arms — logarithmic swirl */}
          {[0, 60, 120, 180, 240, 300].map((rot) => (
            <g key={rot} transform={`rotate(${rot})`}>
              <path
                d={spiralPath(2, 95, 1.18, 0.6)}
                stroke="#73E2D8"
                strokeOpacity={0.07}
                strokeWidth={0.6}
                fill="none"
              />
              <path
                d={spiralPath(3, 95, 1.16, 0.7)}
                stroke="#73E2D8"
                strokeOpacity={0.04}
                strokeWidth={1.2}
                fill="none"
              />
            </g>
          ))}
        </svg>
      </motion.div>

      {/* WIND STREAKS */}
      {winds.map((w, i) => (
        <motion.div
          key={`wind-${i}`}
          className="absolute h-px"
          style={{
            top: `${w.top}%`,
            width: `${w.width}%`,
            background: `linear-gradient(90deg, transparent, rgba(115,226,216,${w.opacity}), transparent)`,
            transform: "rotate(-2deg)",
          }}
          initial={{ x: "120vw" }}
          animate={{ x: "-120vw" }}
          transition={{
            duration: w.duration,
            delay: w.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* RAIN — angled cyan streaks */}
      <div
        className="absolute inset-0"
        style={{ transform: "skewX(-12deg)", transformOrigin: "top center" }}
      >
        {rain.map((r, i) => (
          <motion.div
            key={`rain-${i}`}
            className="absolute"
            style={{
              left: `${r.left}%`,
              width: "1px",
              height: `${r.height}px`,
              top: "-40px",
              background: `linear-gradient(180deg, transparent, rgba(115,226,216,${r.opacity}))`,
            }}
            initial={{ y: "-10vh" }}
            animate={{ y: "115vh" }}
            transition={{
              duration: r.duration,
              delay: r.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* FLOOD PLANE — rising water at the base */}
      <motion.div
        className="absolute inset-x-0 bottom-0"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "14%", opacity: 1 }}
        transition={{ duration: 4, delay: 2.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background:
            "linear-gradient(180deg, rgba(40,175,195,0.0) 0%, rgba(40,175,195,0.08) 40%, rgba(6,11,38,0.55) 100%)",
        }}
      >
        {/* Wave silhouette on top of the flood */}
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          className="absolute -top-[10px] left-0 w-full h-[24px]"
        >
          <motion.path
            initial={{ d: wavePath(0) }}
            animate={{
              d: [wavePath(0), wavePath(0.5), wavePath(1), wavePath(0.5), wavePath(0)],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            fill="rgba(40,175,195,0.18)"
            stroke="rgba(115,226,216,0.55)"
            strokeWidth={1}
          />
          <motion.path
            initial={{ d: wavePath(0.3, 6, 130) }}
            animate={{
              d: [
                wavePath(0.3, 6, 130),
                wavePath(0.8, 6, 130),
                wavePath(1.3, 6, 130),
                wavePath(0.8, 6, 130),
                wavePath(0.3, 6, 130),
              ],
            }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            fill="none"
            stroke="rgba(115,226,216,0.35)"
            strokeWidth={0.8}
          />
        </svg>
      </motion.div>

      {/* LIGHTNING — rare full-bleed flash */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 70% 30%, rgba(220,240,255,0.8), rgba(115,226,216,0.4) 30%, transparent 65%)",
          mixBlendMode: "screen",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.85, 0, 0.5, 0, 0] }}
        transition={{
          duration: 0.9,
          times: [0, 0.05, 0.1, 0.18, 0.22, 0.28, 1],
          delay: 7,
          repeat: Infinity,
          repeatDelay: 14,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 25% 40%, rgba(220,240,255,0.7), rgba(115,226,216,0.3) 25%, transparent 55%)",
          mixBlendMode: "screen",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.7, 0, 0] }}
        transition={{
          duration: 0.7,
          times: [0, 0.1, 0.18, 0.28, 1],
          delay: 18,
          repeat: Infinity,
          repeatDelay: 19,
          ease: "linear",
        }}
      />
    </div>
  );
}

/** Build a logarithmic spiral path centered at origin (SVG path string). */
function spiralPath(
  rStart: number,
  rEnd: number,
  growth: number,
  density: number
): string {
  const steps = 240;
  const totalTurns = 4.5;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * totalTurns * Math.PI * 2;
    // Logarithmic radius
    const r =
      rStart * Math.pow(growth, t * 12 * density) * (1 + t * (rEnd / rStart) * 0.04);
    const rr = Math.min(r, rEnd);
    const x = Math.cos(angle) * rr;
    const y = Math.sin(angle) * rr;
    d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

/** Build a sine-wave path for the flood top edge. */
function wavePath(phase: number, amp = 8, period = 180): string {
  const w = 1440;
  const baseY = 28;
  const points: string[] = [];
  for (let x = 0; x <= w; x += 12) {
    const y = baseY + Math.sin((x / period) * Math.PI * 2 + phase * Math.PI * 2) * amp;
    points.push(`${x === 0 ? "M" : "L"} ${x} ${y.toFixed(1)}`);
  }
  return `${points.join(" ")} L ${w} 80 L 0 80 Z`;
}
