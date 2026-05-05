"use client";

import { motion } from "framer-motion";
import {
  Database,
  Camera,
  Plane,
  Smartphone,
  Activity,
  Satellite,
  Box,
} from "lucide-react";
import Slide from "@/components/Slide";

interface Tool {
  icon: typeof Database;
  title: string;
  body: string;
  partner?: string;
}

const tools: Tool[] = [
  {
    icon: Database,
    title: "Digital Risk Database",
    body: "Aon's proprietary repository — every COPE field, valuation, inspection, and loss for your portfolio in one place.",
  },
  {
    icon: Plane,
    title: "Drone surveys",
    body: "Aerial roof, facade, and surrounding-grade imagery — what an underwriter wants to see before quoting.",
  },
  {
    icon: Camera,
    title: "360° cameras",
    body: "Walkthrough captures of common areas, mechanical rooms, and life-safety equipment.",
  },
  {
    icon: Activity,
    title: "Safehub seismic sensors",
    body: "Real-time vibration and structural movement data — IoT partner integration.",
    partner: "IoT partner: Safehub",
  },
  {
    icon: Box,
    title: "Hailios hail sensors",
    body: "Ground-truth hail-impact data the moment it happens, validated against carrier loss models.",
    partner: "IoT partner: Hailios",
  },
  {
    icon: Smartphone,
    title: "Mobile inspection forms",
    body: "Field-ready forms that flow straight into the Risk Database — no paper, no rekeying.",
  },
  {
    icon: Satellite,
    title: "Satellite imagery",
    body: "Pre- and post-event satellite passes for condition documentation and CAT-event response.",
  },
];

export default function SlideDigitalProperty() {
  return (
    <Slide variant="dark" sectionLabel="Digital Property Profile" sectionNumber="—">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(40,175,195,0.18),transparent_55%),radial-gradient(circle_at_80%_75%,rgba(167,0,112,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(6,11,38,0.85)_98%)]" />

      <div className="relative z-10 h-full flex flex-col px-16 pt-16 pb-6 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-cyan mb-4 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-cyan" />
          Property Risk Consulting
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-2xl xl:text-4xl font-medium tracking-tight leading-[1.05] text-white max-w-4xl mb-3"
        >
          Your buildings, in{" "}
          <span className="text-aon-red">data the carrier trusts</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-sm xl:text-base text-white/75 max-w-3xl leading-relaxed mb-5"
        >
          The Digital Property Profile combines Aon's proprietary database with
          IoT, aerial, and satellite technology — feeding pre- and post-loss
          workflows on the same platform.
        </motion.p>

        <div className="grid grid-cols-4 grid-rows-2 auto-rows-fr gap-5 flex-1 min-h-0">
          {tools.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={t.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: 0.5 + i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ scale: 1.4, zIndex: 20, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
                className="relative bg-white/[0.04] border border-white/10 rounded-sm p-5 backdrop-blur-sm hover:bg-white/[0.07] hover:border-aon-cyan/40 transition-colors flex flex-col min-h-0 overflow-hidden"
              >
                <div className="grid h-11 w-11 place-items-center rounded-sm bg-aon-cyan/15 text-aon-cyan mb-4 shrink-0">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2 leading-tight">
                  {t.title}
                </h3>
                <p className="text-[11.5px] text-white/65 leading-relaxed">{t.body}</p>
                {t.partner && (
                  <div className="mt-auto pt-3 border-t border-white/10 text-[9px] tracking-[0.2em] uppercase text-aon-cyan/85">
                    {t.partner}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.4 }}
          className="mt-4 flex items-center gap-4 text-[12px] text-white/55 shrink-0"
        >
          <span className="h-px w-10 bg-white/30" />
          <span>
            One platform. Pre-loss inspection feeds post-loss claim. The carrier sees the same data we do.
          </span>
        </motion.div>
      </div>
    </Slide>
  );
}
