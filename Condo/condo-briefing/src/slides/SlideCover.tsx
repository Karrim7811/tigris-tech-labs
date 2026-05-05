"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Slide from "@/components/Slide";
import CondoBlueprint from "@/components/CondoBlueprint";
import PerilLayer from "@/components/PerilLayer";
import { meeting } from "@/lib/brand";

export default function SlideCover() {
  return (
    <Slide variant="dark" hideWordmark={false}>
      {/* Slow-zooming grid backdrop */}
      <motion.div
        className="absolute inset-0 bg-grid"
        initial={{ scale: 1.0 }}
        animate={{ scale: 1.08 }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
      />

      {/* Atmospheric color washes */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(40,175,195,0.22),transparent_55%),radial-gradient(circle_at_75%_75%,rgba(235,0,23,0.14),transparent_60%)]" />

      {/* Peril FX — hurricane spiral, wind, rain, flood, lightning */}
      <PerilLayer />

      {/* Vignette — sits over peril layer to keep edges dark */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(6,11,38,0.85)_95%)]" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-aon-cyan/40"
            style={{
              left: `${(i * 8.3 + 7) % 100}%`,
              top: `${(i * 13.7 + 11) % 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.7, 0.2],
            }}
            transition={{
              duration: 6 + (i % 4),
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Architectural blueprint tower — right side, animated build-out */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.0, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-y-0 right-0 w-[46%] z-[5] pointer-events-none flex items-center justify-center pr-6"
      >
        <div className="h-[88%] w-full">
          <CondoBlueprint />
        </div>
        {/* Soft ground reflection */}
        <div
          className="absolute inset-x-8 bottom-[6%] h-[4px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(115,226,216,0.35), transparent 70%)",
            filter: "blur(2px)",
          }}
        />
      </motion.div>

      <div className="relative z-10 h-full flex flex-col justify-center pl-20 pr-20 max-w-[58%]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-10 flex items-center gap-5"
        >
          <div className="bg-white/95 rounded-sm px-5 py-2.5 shadow-lg ring-1 ring-white/20">
            <Image
              src="/images/firstservice.png"
              alt="FirstService Residential"
              width={240}
              height={52}
              priority
              style={{ height: 44, width: "auto" }}
            />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-6xl xl:text-8xl font-medium tracking-tight leading-[1.02] text-white"
        >
          The Florida
          <br />
          Condo Market
          <br />
          <span className="text-aon-red">in 2026</span>
          <span className="text-white">.</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="mt-14 flex items-center gap-6 text-aon-fog"
        >
          <div className="h-px w-12 bg-aon-red" />
          <span className="text-sm tracking-[0.25em] uppercase">{meeting.date}</span>
          <span className="text-aon-mist/40">·</span>
          <span className="text-sm tracking-[0.25em] uppercase">{meeting.location}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.7 }}
          className="mt-3 text-aon-mist text-sm"
        >
          Presented by {meeting.presenter}
        </motion.div>
      </div>
    </Slide>
  );
}
