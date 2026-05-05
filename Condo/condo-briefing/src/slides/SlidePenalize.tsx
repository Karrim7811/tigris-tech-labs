"use client";

import FrameworkSlide from "@/components/FrameworkSlide";

const items = [
  {
    title: "Stale or partial COPE",
    body: "Missing roof age, outdated plumbing, no fire system data. Carriers assume the worst when info is absent.",
  },
  {
    title: "Replacement cost gaps",
    body: "Values that haven't moved with construction inflation. Underinsurance is the #1 reason for declinations.",
  },
  {
    title: "High-frequency small claims",
    body: "Multiple water or slip claims, even when severity is low. Frequency signals operational issues.",
  },
  {
    title: "Litigation-prone history",
    body: "Past assessments fights, board lawsuits, contractor disputes. D&O underwriters weight this heavily.",
  },
  {
    title: "Last-minute submissions",
    body: "Full data three weeks before renewal. Underwriters price uncertainty when they don't have time to underwrite.",
  },
];

export default function SlidePenalize() {
  return (
    <FrameworkSlide
      mode="penalize"
      sectionLabel="The framework — II of III"
      sectionNumber="04"
      kicker="What carriers penalize"
      titlePrefix="What underwriters"
      titleAccent="penalize."
      items={items}
    />
  );
}
