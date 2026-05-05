"use client";

import { motion } from "framer-motion";
import Slide from "@/components/Slide";
import CountUp from "@/components/CountUp";

interface ACTRow {
  carrier: string;
  share: string;
  shareNum: number;
  badge?: "new";
}

const carriers: ACTRow[] = [
  { carrier: "QBE", share: "7.50%", shareNum: 7.5 },
  { carrier: "Liberty", share: "3.50%", shareNum: 3.5 },
  { carrier: "Beazley", share: "3.25%", shareNum: 3.25 },
  { carrier: "Canopius", share: "3.00%", shareNum: 3.0 },
  { carrier: "Arch", share: "2.25%", shareNum: 2.25 },
  { carrier: "AWAC", share: "2.00%", shareNum: 2.0 },
  { carrier: "Tokio Marine Kiln", share: "2.00%", shareNum: 2.0 },
  { carrier: "Axis", share: "1.75%", shareNum: 1.75, badge: "new" },
  { carrier: "Markel", share: "1.25%", shareNum: 1.25, badge: "new" },
  { carrier: "Ren Re", share: "1.00%", shareNum: 1.0 },
  { carrier: "MS Amlin", share: "1.00%", shareNum: 1.0, badge: "new" },
];

export default function SlideACT() {
  return (
    <Slide variant="dark" sectionLabel="Aon Client Treaty (ACT)" sectionNumber="—">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(40,175,195,0.18),transparent_55%),radial-gradient(circle_at_25%_85%,rgba(167,0,112,0.14),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(6,11,38,0.85)_98%)]" />

      <div className="relative z-10 h-full flex flex-col justify-center px-16 py-12 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-cyan mb-4 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-cyan" />
          A facility only Aon can offer
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-2xl xl:text-4xl font-medium tracking-tight leading-[1.05] text-white max-w-4xl mb-5"
        >
          <span className="text-aon-red">28.5%</span> of every London line —
          pre-secured for our clients.
        </motion.h1>

        {/* Headline stat row */}
        <div className="grid grid-cols-4 gap-10 mb-5">
          <Stat value={2.125} prefix="$" suffix="B" label="GWP placed since inception" sub="Across the facility's history." delay={0.45} />
          <Stat value={1800} suffix="" label="Clients in 2024" sub="Active on the treaty in the last year." delay={0.6} format="comma" />
          <Stat value={200} suffix="" label="Client countries in 2024" sub="Single-carrier paper, global reach." delay={0.75} />
          <Stat value={28.5} suffix="%" label="Dedicated capacity" sub="Pre-placed on every eligible London line." delay={0.9} decimals={1} />
        </div>

        <div className="grid grid-cols-2 gap-12 items-start">
          {/* Carrier table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.0 }}
            className="bg-white/[0.04] border border-white/10 rounded-sm p-4 flex flex-col"
          >
            <div className="text-[10px] tracking-[0.3em] uppercase text-aon-cyan/85 mb-1">
              ACT carrier panel — final share of order
            </div>
            <div className="text-[11px] text-white/50 mb-2">
              Lloyd's-only insurer panel · S&P AA- · AM Best A+
            </div>
            <ul className="flex flex-col">
              {carriers.map((c, i) => (
                <motion.li
                  key={c.carrier}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 1.2 + i * 0.04 }}
                  className="py-1.5 flex items-center justify-between text-[12px] text-white/85 border-b border-white/5 last:border-b-0"
                >
                  <span className="flex items-center gap-2">
                    {c.carrier}
                    {c.badge === "new" && (
                      <span className="text-[8px] tracking-[0.2em] uppercase text-aon-red bg-aon-red/15 px-1.5 py-0.5 rounded-[2px]">
                        New
                      </span>
                    )}
                  </span>
                  <span className="tabular text-white font-semibold">{c.share}</span>
                </motion.li>
              ))}
              <li className="flex items-center justify-between text-[13px] text-white pt-1.5 mt-1 border-t border-white/15 shrink-0">
                <span className="font-semibold">Total dedicated capacity</span>
                <span className="tabular text-aon-red font-bold text-sm">28.50%</span>
              </li>
            </ul>
          </motion.div>

          {/* Why it matters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2 }}
            className="flex flex-col"
          >
            <div className="text-[10px] tracking-[0.3em] uppercase text-aon-cyan/85 mb-3">
              Why it matters for your placement
            </div>
            <ul className="space-y-2.5 text-[13px] text-white/90 leading-snug">
              <Bullet>
                <span className="text-white font-semibold">Price stability</span>
                {" — "}28.5% of your London capacity is locked in before the rest of the market quotes.
              </Bullet>
              <Bullet>
                <span className="text-white font-semibold">Pre-secured capacity</span>
                {" — "}ring-fenced across major product lines, including property cat.
              </Bullet>
              <Bullet>
                <span className="text-white font-semibold">Criteria-based underwriting</span>
                {" — "}simplified placement; expands the capacity behind in-scope quotes.
              </Bullet>
              <Bullet>
                <span className="text-white font-semibold">Single-carrier claims service</span>
                {" — "}the Lloyd's claims scheme, with global licensing and tax-payment capability.
              </Bullet>
              <Bullet>
                <span className="text-white font-semibold">Multi-year commitment</span>
                {" — "}ACT insurers have committed capacity through 2027.
              </Bullet>
            </ul>

            <div className="mt-6 pt-4 text-xs text-white/45 border-t border-white/10">
              No other broker can offer this. ACT is exclusive to Aon clients.
            </div>
          </motion.div>
        </div>
      </div>
    </Slide>
  );
}

function Stat({
  value, prefix = "", suffix, label, sub, delay, decimals, format,
}: {
  value: number; prefix?: string; suffix: string;
  label: string; sub: string; delay: number;
  decimals?: number; format?: "comma";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay }}
      className="border-t-2 border-white/15 pt-3"
    >
      <div className="text-3xl xl:text-5xl font-medium tracking-tight text-white leading-none">
        <CountUp
          to={value}
          prefix={prefix}
          suffix={suffix}
          delay={delay + 0.2}
          duration={1.4}
          decimals={decimals}
          format={format}
        />
      </div>
      <div className="mt-3 text-[13px] text-white/85 font-semibold leading-tight">
        {label}
      </div>
      <div className="text-[11px] text-white/50 mt-1 leading-relaxed">
        {sub}
      </div>
    </motion.div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-aon-red shrink-0" />
      <span>{children}</span>
    </li>
  );
}
