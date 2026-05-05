"use client";

import FrameworkSlide from "@/components/FrameworkSlide";

const items = [
  {
    title: "Updated COPE data",
    body: "Current construction, occupancy, protection, and exposure detail on every location — submitted in advance.",
  },
  {
    title: "Recent valuations",
    body: "A third-party appraisal in the last 24 months. Replacement cost that reflects today's construction inflation.",
  },
  {
    title: "Documented loss control",
    body: "Water mitigation, fire suppression upgrades, roof maintenance — paired with photos and dates.",
  },
  {
    title: "Stable governance",
    body: "Long-tenured property managers. Boards that make consistent, documented decisions.",
  },
  {
    title: "Risk transfer maturity",
    body: "A willingness to take meaningful retentions. Boards that already understand the trade-off.",
  },
];

export default function SlideReward() {
  return (
    <FrameworkSlide
      mode="reward"
      sectionLabel="The framework — I of III"
      sectionNumber="03"
      kicker="What carriers reward"
      titlePrefix="What underwriters"
      titleAccent="reward."
      items={items}
    />
  );
}
