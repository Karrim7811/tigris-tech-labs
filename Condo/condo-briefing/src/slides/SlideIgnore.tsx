"use client";

import FrameworkSlide from "@/components/FrameworkSlide";

const items = [
  {
    title: "Building age alone",
    body: "1985 vs 2005 matters less than you'd think. Maintenance evidence beats the year of construction.",
  },
  {
    title: "Cosmetic upgrades",
    body: "New lobby, new amenities, fresh paint. Beautiful — but not underwriting data.",
  },
  {
    title: "HOA awards & accolades",
    body: "Industry recognition is great PR. It does not move loss ratios or rate.",
  },
  {
    title: "Long broker relationships",
    body: "Markets price the risk, not the producer. Loyalty earns conversation, not capacity.",
  },
  {
    title: "Marketing materials",
    body: "Glossy brochures, drone footage, lifestyle photos. Underwriters want SOVs and loss runs.",
  },
];

export default function SlideIgnore() {
  return (
    <FrameworkSlide
      mode="ignore"
      sectionLabel="The framework — III of III"
      sectionNumber="05"
      kicker="What carriers ignore"
      titlePrefix="What underwriters"
      titleAccent="ignore."
      items={items}
    />
  );
}
