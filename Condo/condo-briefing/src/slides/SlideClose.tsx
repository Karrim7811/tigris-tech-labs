"use client";

import { motion } from "framer-motion";
import { Calendar, BookOpen, Compass } from "lucide-react";
import Slide from "@/components/Slide";
import { meeting } from "@/lib/brand";

const offers = [
  {
    icon: Compass,
    title: "Quarterly market updates",
    body: "30-minute briefings the week the next P&C report drops. No commitment.",
  },
  {
    icon: BookOpen,
    title: "Board education sessions",
    body: "We come to your board meeting and translate the renewal for them — anytime.",
  },
  {
    icon: Calendar,
    title: "Renewal readiness review",
    body: "When you're 90 days out from inception. Submission strategy, not pitch.",
  },
];

export default function SlideClose() {
  return (
    <Slide variant="dark" sectionLabel="Close" sectionNumber="—" hideWordmark={false}>
      {/* Atmospheric backdrop — echoes the cover slide */}
      <motion.div
        className="absolute inset-0 bg-grid"
        initial={{ scale: 1.0 }}
        animate={{ scale: 1.06 }}
        transition={{
          duration: 30,
          ease: "linear",
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(40,175,195,0.18),transparent_55%),radial-gradient(circle_at_80%_75%,rgba(235,0,23,0.14),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(6,11,38,0.85)_95%)]" />

      <div className="relative z-10 h-full flex flex-col justify-center px-20 pt-24 pb-12 max-w-[1700px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-xs tracking-[0.35em] uppercase text-aon-cyan mb-8 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-aon-red" />
          Where we go from here
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.15 }}
          className="text-5xl xl:text-7xl font-medium tracking-tight leading-[1.04] text-white max-w-5xl"
        >
          The market will keep evolving.
          <br />
          Our job is to help you{" "}
          <span className="text-aon-red">stay ahead</span>
          <br />— not react.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="text-sm tracking-[0.25em] uppercase text-white/45 mt-14 mb-5"
        >
          Three things we offer — no commitment today
        </motion.div>

        <div className="grid grid-cols-3 gap-6 mb-20">
          {offers.map((o, i) => {
            const Icon = o.icon;
            return (
              <motion.div
                key={o.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: 0.75 + i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-sm p-7 hover:border-aon-red/40 transition"
              >
                <div className="grid h-11 w-11 place-items-center rounded-sm bg-aon-red/15 text-aon-red mb-5">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg xl:text-xl font-semibold text-white leading-tight mb-2">
                  {o.title}
                </h3>
                <p className="text-sm text-white/65 leading-relaxed">{o.body}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.4 }}
          className="border-t border-white/15 pt-6 flex items-center justify-between"
        >
          <div className="text-xs tracking-[0.4em] uppercase text-white/45">
            Thank you
          </div>
          <div className="text-xs tracking-[0.4em] uppercase text-white/35">
            {meeting.date} · {meeting.location}
          </div>
        </motion.div>
      </div>
    </Slide>
  );
}
