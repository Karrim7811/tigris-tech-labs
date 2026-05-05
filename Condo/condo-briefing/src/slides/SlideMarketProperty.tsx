"use client";

import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import Slide from "@/components/Slide";
import CountUp from "@/components/CountUp";

const rateData = [
  { year: "2018", rate: 4 },
  { year: "2019", rate: 7 },
  { year: "2020", rate: 12 },
  { year: "2021", rate: 18 },
  { year: "2022", rate: 26 },
  { year: "2023", rate: 32 },
  { year: "2024", rate: 24 },
  { year: "2025", rate: 14 },
  { year: "2026", rate: 9 },
];

const peakColor = "#EB0017";
const stableColor = "#28AFC3";

export default function SlideMarketProperty() {
  return (
    <Slide variant="light" sectionLabel="FL Market Update — Property" sectionNumber="I of III">
      <div className="bg-grid-light absolute inset-0 opacity-40" />

      <div className="relative z-10 h-full flex flex-col justify-center px-20 pt-24 pb-12 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-stone mb-6 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-red" />
          Florida property — 2026 view
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl xl:text-6xl font-medium tracking-tight leading-[1.05] text-aon-ink"
        >
          The peak is behind us.
          <br />
          The <span className="text-aon-red">new normal</span> is not.
        </motion.h1>

        <div className="grid grid-cols-12 gap-12 mt-16">
          {/* Stats column */}
          <div className="col-span-4 flex flex-col gap-8">
            {[
              { prefix: "+", value: 9, suffix: "%", label: "Avg FL condo property rate change Q1 2026" },
              { prefix: "", value: 30, suffix: "%", label: "Capacity reduction from 2017 peak (carriers active)" },
              { prefix: "$", value: 50, suffix: "B+", label: "Insured FL hurricane losses 2022-2024" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.15 }}
                className="border-t-2 border-aon-fog pt-4"
              >
                <div className="text-4xl xl:text-5xl font-medium tracking-tight text-aon-navy leading-none">
                  <CountUp
                    to={s.value}
                    prefix={s.prefix}
                    suffix={s.suffix}
                    delay={0.9 + i * 0.15}
                    duration={1.4}
                  />
                </div>
                <div className="mt-3 text-sm text-aon-graphite font-medium leading-relaxed">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="col-span-8"
          >
            <div className="text-xs tracking-[0.25em] uppercase text-aon-stone mb-4">
              Florida condo property — avg rate change YoY
            </div>
            <div className="bg-white rounded-sm border border-aon-fog/60 p-6 h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rateData} margin={{ top: 12, right: 8, bottom: 8, left: 0 }}>
                  <XAxis
                    dataKey="year"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#5D6D78", fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(v) => `+${v}%`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#5D6D78", fontSize: 12 }}
                    domain={[0, 35]}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(38, 40, 54, 0.04)" }}
                    contentStyle={{
                      background: "#FFFFFF",
                      border: "1px solid #ACC0C3",
                      borderRadius: 4,
                      fontSize: 12,
                      color: "#262836",
                    }}
                    formatter={(v) => [`+${v as number}%`, "Rate change"]}
                  />
                  <Bar dataKey="rate" radius={[2, 2, 0, 0]}>
                    {rateData.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.rate >= 24 ? peakColor : d.rate >= 14 ? "#A70070" : stableColor}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-[11px] text-aon-stone tracking-wide">
              Source: Aon Q1 2026 Property Market Insights · S&amp;P Global · FLOIR rate filings.
              Estimates for FL condo schedule renewals.
            </div>
          </motion.div>
        </div>
      </div>
    </Slide>
  );
}
