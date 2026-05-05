"use client";

import { motion } from "framer-motion";

/**
 * Animated architectural blueprint of a Miami-style condo tower.
 *
 * The tower constructs itself: foundation → outline → floor plates (bottom-up) →
 * mullions → window-light wave → crown/antenna. After the build, an aviation
 * beacon pulses on a 1.4s loop and a vertical scan of "caustic" light passes
 * across the windows every ~10s.
 */
export default function CondoBlueprint() {
  // Tower geometry (SVG units)
  const FLOORS = 22;
  const FLOOR_H = 18;
  const TOWER_X = 120;
  const TOWER_W = 180;
  const TOWER_TOP = 60;
  const TOWER_BOTTOM = TOWER_TOP + FLOORS * FLOOR_H;

  // Tower outline as a path (so we can animate pathLength)
  const towerOutline = `M ${TOWER_X} ${TOWER_BOTTOM} L ${TOWER_X} ${TOWER_TOP} L ${
    TOWER_X + TOWER_W
  } ${TOWER_TOP} L ${TOWER_X + TOWER_W} ${TOWER_BOTTOM}`;

  const crownPath = `M ${TOWER_X + TOWER_W * 0.25} ${TOWER_TOP} L ${
    TOWER_X + TOWER_W * 0.25
  } ${TOWER_TOP - 22} L ${TOWER_X + TOWER_W * 0.75} ${TOWER_TOP - 22} L ${
    TOWER_X + TOWER_W * 0.75
  } ${TOWER_TOP}`;

  // Background skyline (deterministic)
  const skyline = [
    { x: 22,  w: 28, h: 160 },
    { x: 55,  w: 22, h: 110 },
    { x: 82,  w: 30, h: 200 },
    { x: 318, w: 26, h: 145 },
    { x: 348, w: 32, h: 210 },
    { x: 386, w: 22, h: 130 },
  ];

  return (
    <svg
      viewBox="0 0 420 580"
      className="h-full w-full"
      fill="none"
      stroke="white"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="winGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#73E2D8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#73E2D8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="towerFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="35%" stopColor="white" stopOpacity="0.95" />
          <stop offset="100%" stopColor="white" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#73E2D8" stopOpacity="0" />
          <stop offset="50%" stopColor="#73E2D8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#73E2D8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="beaconHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EB0017" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#EB0017" stopOpacity="0" />
        </linearGradient>
        <clipPath id="towerClip">
          <rect
            x={TOWER_X}
            y={TOWER_TOP - 22}
            width={TOWER_W}
            height={FLOORS * FLOOR_H + 22}
          />
        </clipPath>
      </defs>

      {/* Faint construction guidelines */}
      <g stroke="white" strokeOpacity={0.08} strokeWidth={0.5} strokeDasharray="2 4">
        <line x1={0} y1={TOWER_BOTTOM} x2={420} y2={TOWER_BOTTOM} />
        <line x1={TOWER_X} y1={0} x2={TOWER_X} y2={580} />
        <line x1={TOWER_X + TOWER_W} y1={0} x2={TOWER_X + TOWER_W} y2={580} />
        <line x1={TOWER_X + TOWER_W / 2} y1={0} x2={TOWER_X + TOWER_W / 2} y2={580} />
      </g>

      {/* Background skyline silhouettes */}
      <motion.g
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        {skyline.map((b, i) => (
          <rect
            key={`sky-${i}`}
            x={b.x}
            y={TOWER_BOTTOM - b.h}
            width={b.w}
            height={b.h}
            fill="white"
            fillOpacity={0.025}
            stroke="white"
            strokeOpacity={0.18}
          />
        ))}
        {/* Skyline floor ticks for texture */}
        {skyline.map((b, i) =>
          Array.from({ length: Math.floor(b.h / 14) }).map((_, j) => (
            <line
              key={`sky-floor-${i}-${j}`}
              x1={b.x}
              y1={TOWER_BOTTOM - b.h + j * 14}
              x2={b.x + b.w}
              y2={TOWER_BOTTOM - b.h + j * 14}
              strokeOpacity={0.07}
            />
          ))
        )}
      </motion.g>

      {/* Horizon line — far ground plane */}
      <motion.line
        x1={0}
        y1={TOWER_BOTTOM + 14}
        x2={420}
        y2={TOWER_BOTTOM + 14}
        strokeOpacity={0.3}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.0, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Foundation slab */}
      <motion.rect
        x={TOWER_X - 24}
        y={TOWER_BOTTOM}
        width={TOWER_W + 48}
        height={10}
        stroke="url(#towerFade)"
        strokeOpacity={0.7}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.5 }}
      />

      {/* Tower outline — draws bottom-up */}
      <motion.path
        d={towerOutline}
        stroke="url(#towerFade)"
        strokeOpacity={0.9}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Floor plates — sequential bottom-up */}
      {Array.from({ length: FLOORS - 1 }).map((_, i) => {
        const floorIdx = FLOORS - 2 - i; // bottom-up build order
        const y = TOWER_TOP + (floorIdx + 1) * FLOOR_H;
        const opacity = 0.14 + (floorIdx / FLOORS) * 0.18;
        return (
          <motion.line
            key={`floor-${i}`}
            x1={TOWER_X}
            y1={y}
            x2={TOWER_X + TOWER_W}
            y2={y}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1, opacity }}
            transition={{
              duration: 0.4,
              delay: 1.6 + i * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
            strokeOpacity={opacity}
          />
        );
      })}

      {/* Vertical mullions */}
      {[0.25, 0.5, 0.75].map((p, i) => (
        <motion.line
          key={`mull-${i}`}
          x1={TOWER_X + TOWER_W * p}
          y1={TOWER_TOP}
          x2={TOWER_X + TOWER_W * p}
          y2={TOWER_BOTTOM}
          strokeOpacity={0.2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.0, delay: 2.4 + i * 0.08 }}
        />
      ))}

      {/* Crown — mechanical penthouse */}
      <motion.path
        d={crownPath}
        strokeOpacity={0.75}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, delay: 2.6 }}
      />

      {/* Antenna */}
      <motion.line
        x1={TOWER_X + TOWER_W * 0.42}
        y1={TOWER_TOP - 22}
        x2={TOWER_X + TOWER_W * 0.42}
        y2={TOWER_TOP - 70}
        strokeOpacity={0.55}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 3.0 }}
      />

      {/* Lit windows — power-on wave from top-down (like floors filling at dusk) */}
      {Array.from({ length: FLOORS }).flatMap((_, floor) => {
        const y = TOWER_TOP + floor * FLOOR_H + FLOOR_H / 2;
        return [0, 1, 2, 3].map((col) => {
          const seed = (floor * 7 + col * 13) % 11;
          if (seed < 6) return null;
          const x = TOWER_X + TOWER_W * (0.125 + col * 0.25);
          // Subtle flicker on a long loop after power-on
          const flickerDelay = 6 + ((floor + col * 3) % 7);
          return (
            <motion.circle
              key={`win-${floor}-${col}`}
              cx={x}
              cy={y}
              fill="url(#winGlow)"
              stroke="none"
              initial={{ r: 0, opacity: 0 }}
              animate={{
                r: [0, 5.2, 3.8, 3.8, 4.4, 3.8],
                opacity: [0, 0.95, 0.85, 0.85, 1, 0.85],
              }}
              transition={{
                times: [0, 0.12, 0.25, 0.85, 0.92, 1],
                duration: flickerDelay,
                delay: 3.2 + floor * 0.06 + col * 0.04,
                repeat: Infinity,
                repeatDelay: 0,
                ease: "easeInOut",
              }}
            />
          );
        });
      })}

      {/* Diagonal "caustic" light scan — sweeps across the tower periodically */}
      <g clipPath="url(#towerClip)">
        <motion.rect
          x={TOWER_X - 60}
          y={TOWER_TOP - 22}
          width={42}
          height={FLOORS * FLOOR_H + 22}
          fill="url(#sweepGrad)"
          stroke="none"
          initial={{ x: TOWER_X - 80 }}
          animate={{ x: TOWER_X + TOWER_W + 40 }}
          transition={{
            duration: 3.2,
            delay: 6,
            repeat: Infinity,
            repeatDelay: 7.5,
            ease: "easeInOut",
          }}
          style={{ mixBlendMode: "screen" }}
        />
      </g>

      {/* Aviation beacon — halo pulse */}
      <motion.circle
        cx={TOWER_X + TOWER_W * 0.42}
        cy={TOWER_TOP - 72}
        fill="url(#beaconHalo)"
        stroke="none"
        initial={{ r: 0, opacity: 0 }}
        animate={{
          r: [3, 16],
          opacity: [0.7, 0],
        }}
        transition={{
          duration: 1.6,
          delay: 3.3,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
      {/* Aviation beacon — core dot */}
      <motion.circle
        cx={TOWER_X + TOWER_W * 0.42}
        cy={TOWER_TOP - 72}
        fill="#EB0017"
        stroke="none"
        initial={{ r: 0 }}
        animate={{ r: [2.4, 3.6, 2.4] }}
        transition={{
          duration: 1.6,
          delay: 3.3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Dimension tick marks */}
      <motion.g
        stroke="white"
        strokeOpacity={0.3}
        strokeWidth={0.5}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 3.6 }}
      >
        <line x1={TOWER_X - 18} y1={TOWER_TOP} x2={TOWER_X - 6} y2={TOWER_TOP} />
        <line x1={TOWER_X - 18} y1={TOWER_BOTTOM} x2={TOWER_X - 6} y2={TOWER_BOTTOM} />
        <line
          x1={TOWER_X - 12}
          y1={TOWER_TOP}
          x2={TOWER_X - 12}
          y2={TOWER_BOTTOM}
          strokeDasharray="2 3"
        />
        {/* "260 ft" annotation */}
        <text
          x={TOWER_X - 16}
          y={TOWER_TOP + (TOWER_BOTTOM - TOWER_TOP) / 2}
          fill="white"
          fillOpacity={0.45}
          fontSize="8"
          fontFamily="monospace"
          textAnchor="end"
          stroke="none"
          transform={`rotate(-90 ${TOWER_X - 16} ${
            TOWER_TOP + (TOWER_BOTTOM - TOWER_TOP) / 2
          })`}
        >
          22 FLOORS · ±260 FT
        </text>
      </motion.g>
    </svg>
  );
}
