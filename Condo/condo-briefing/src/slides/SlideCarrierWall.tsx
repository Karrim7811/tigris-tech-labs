"use client";

import { motion } from "framer-motion";
import Slide from "@/components/Slide";

interface Region {
  label: string;
  sub: string;
  carriers: string[];
  /** Tailwind ring color for chips in this region. */
  accent: string;
}

const regions: Region[] = [
  {
    label: "U.S. Direct",
    sub: "Admitted carriers",
    accent: "#28AFC3",
    carriers: [
      "AIG", "Allianz", "AWAC", "AXA XL", "Beazley", "Berkshire Hathaway",
      "Canopius", "CNA", "Chubb", "Everest", "FM Global", "HDI",
      "Hudson Specialty", "Ironshore", "Liberty Mutual", "Markel",
      "Mitsui", "Munich Re", "QBE", "Sompo", "Starr Indemnity",
      "Swiss Re", "Tokio Marine", "Zurich",
    ],
  },
  {
    label: "U.S. E&S",
    sub: "Excess & Surplus",
    accent: "#FFA600",
    carriers: [
      "Arrowhead", "Arch", "Aspen", "Axis", "Core Specialty", "CNA",
      "SRU / Oracle", "Kemah", "Paragon", "RSUI", "Starstone",
      "Velocity", "Westchester", "Westfield",
    ],
  },
  {
    label: "London / Europe",
    sub: "International capacity",
    accent: "#A70070",
    carriers: [
      "Aon ACT", "Ark", "Aviva", "Beazley", "Convex", "Hannover Re",
      "HDI", "Helvetia", "Inigo", "Lloyd's of London", "Partner Re",
    ],
  },
  {
    label: "Bermuda",
    sub: "Reinsurance market",
    accent: "#EB0017",
    carriers: ["Alcor", "Argo", "AWAC", "Fidelis", "Liberty", "Helix", "Chubb"],
  },
];

const totalCarriers = regions.reduce((n, r) => n + r.carriers.length, 0);

export default function SlideCarrierWall() {
  return (
    <Slide variant="dark" sectionLabel="Markets we touch" sectionNumber="—">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(40,175,195,0.15),transparent_55%),radial-gradient(circle_at_75%_80%,rgba(235,0,23,0.10),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(6,11,38,0.85)_98%)]" />

      <div className="relative z-10 h-full flex flex-col justify-center px-16 py-16 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-[11px] tracking-[0.35em] uppercase text-aon-cyan mb-4 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-cyan" />
          Global underwriting approach
        </motion.div>

        <div className="flex items-end justify-between mb-8 gap-10">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl xl:text-5xl font-medium tracking-tight leading-[1.05] text-white max-w-3xl"
          >
            Every market{" "}
            <span className="text-aon-red">that prices your buildings</span>.
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-right shrink-0"
          >
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/55 mb-1">
              Carrier panel
            </div>
            <div className="text-5xl xl:text-7xl font-medium text-white leading-none tabular">
              {totalCarriers}
            </div>
            <div className="text-[11px] text-white/55 mt-1">
              named markets · 4 regions
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-4 gap-4 items-stretch">
          {regions.map((region, ri) => (
            <motion.div
              key={region.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                delay: 0.4 + ri * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative flex flex-col bg-white/[0.03] border border-white/10 rounded-sm p-4 backdrop-blur-sm h-full"
            >
              <div className="flex items-baseline justify-between border-b border-white/10 pb-2.5 mb-3 shrink-0">
                <div>
                  <div
                    className="text-[9px] tracking-[0.25em] uppercase font-semibold"
                    style={{ color: region.accent }}
                  >
                    {region.sub}
                  </div>
                  <div className="text-base font-semibold text-white mt-0.5 tracking-tight leading-tight">
                    {region.label}
                  </div>
                </div>
                <div className="text-[18px] font-medium text-white/90 tabular leading-none">
                  {region.carriers.length}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 content-start">
                {region.carriers.map((c, i) => (
                  <motion.span
                    key={c + i}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.7 + ri * 0.1 + i * 0.025,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="inline-block text-[11px] text-white/90 font-medium px-2 py-1 rounded-[2px] border bg-white/[0.04] leading-none whitespace-nowrap"
                    style={{ borderColor: `${region.accent}40` }}
                  >
                    {c}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Slide>
  );
}
