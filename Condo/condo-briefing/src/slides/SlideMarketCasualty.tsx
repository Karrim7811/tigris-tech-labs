"use client";

import { motion } from "framer-motion";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import Slide from "@/components/Slide";
import CountUp from "@/components/CountUp";

const dnoData = [
  { year: "2020", index: 100 },
  { year: "2021", index: 108 },
  { year: "2022", index: 121 },
  { year: "2023", index: 138 },
  { year: "2024", index: 152 },
  { year: "2025", index: 168 },
  { year: "2026", index: 182 },
];

export default function SlideMarketCasualty() {
  return (
    <Slide variant="light" sectionLabel="FL Market Update — Casualty & D&O" sectionNumber="II of III">
      <div className="bg-grid-light absolute inset-0 opacity-40" />

      <div className="relative z-10 h-full flex flex-col justify-center px-20 pt-24 pb-12 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-stone mb-6 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-red" />
          Florida casualty &amp; D&amp;O — 2026 view
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl xl:text-6xl font-medium tracking-tight leading-[1.05] text-aon-ink"
        >
          Property got the headlines.
          <br />
          <span className="text-aon-red">Litigation</span> is taking over.
        </motion.h1>

        <div className="grid grid-cols-12 gap-12 mt-16">
          {/* Casualty column */}
          <div className="col-span-4">
            <div className="text-xs tracking-[0.3em] uppercase text-aon-navy mb-5 flex items-center gap-2">
              <span className="h-px w-6 bg-aon-navy" />
              Casualty
            </div>
            <div className="space-y-7">
              {[
                { prefix: "+", value: 12, suffix: "%", label: "FL GL rate change avg, condo schedules" },
                { prefix: "", value: 3, suffix: "x", label: "Increase in nuclear verdict frequency since 2018" },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + i * 0.15 }}
                  className="border-t-2 border-aon-fog pt-4"
                >
                  <div className="text-4xl xl:text-5xl font-medium tracking-tight text-aon-navy leading-none">
                    <CountUp
                      to={s.value}
                      prefix={s.prefix}
                      suffix={s.suffix}
                      delay={0.8 + i * 0.15}
                      duration={1.3}
                    />
                  </div>
                  <div className="mt-3 text-sm text-aon-graphite leading-relaxed">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* D&O chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="col-span-8"
          >
            <div className="flex items-end justify-between mb-4">
              <div className="text-xs tracking-[0.25em] uppercase text-aon-stone">
                D&amp;O claim severity index — Florida HOAs (2020 = 100)
              </div>
              <div className="text-xs text-aon-magenta font-semibold">+82% since 2020</div>
            </div>
            <div className="bg-white rounded-sm border border-aon-fog/60 p-6 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dnoData} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
                  <XAxis
                    dataKey="year"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#5D6D78", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#5D6D78", fontSize: 12 }}
                    domain={[80, 200]}
                  />
                  <Tooltip
                    cursor={{ stroke: "#ACC0C3", strokeDasharray: "3 3" }}
                    contentStyle={{
                      background: "#FFFFFF",
                      border: "1px solid #ACC0C3",
                      borderRadius: 4,
                      fontSize: 12,
                      color: "#262836",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="index"
                    stroke="#A70070"
                    strokeWidth={3}
                    dot={{ fill: "#A70070", r: 5, strokeWidth: 0 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-[11px] text-aon-stone tracking-wide">
              Source: Aon Financial Services Group benchmarking · industry-blended index of FL HOA D&amp;O claim severity.
            </div>
          </motion.div>
        </div>
      </div>
    </Slide>
  );
}
