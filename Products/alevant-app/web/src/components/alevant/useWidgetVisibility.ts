"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "alevant-cockpit-widgets";

export interface WidgetVisibility {
  actions: boolean;
  momentum: boolean;
  grid: boolean;
  news: boolean;
  today: boolean;
  vesper: boolean;
  sphere: boolean;
  prioritized: boolean;
}

const DEFAULT_VISIBILITY: WidgetVisibility = {
  actions: true,
  momentum: true,
  grid: true,
  news: true,
  today: true,
  vesper: true,
  sphere: true,
  prioritized: true,
};

export const WIDGET_LABELS: Record<keyof WidgetVisibility, string> = {
  actions: "Today's Actions",
  momentum: "Deal Momentum",
  grid: "The Grid",
  news: "News & Intel",
  today: "Today's Tasks",
  vesper: "Vesper Queue",
  sphere: "Sphere Right Calls",
  prioritized: "Prioritized Leads",
};

export function useWidgetVisibility(): [
  WidgetVisibility,
  (key: keyof WidgetVisibility, on: boolean) => void,
  () => void
] {
  const [vis, setVis] = useState<WidgetVisibility>(DEFAULT_VISIBILITY);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setVis({ ...DEFAULT_VISIBILITY, ...JSON.parse(saved) });
    } catch {}
  }, []);

  function toggle(key: keyof WidgetVisibility, on: boolean) {
    setVis((v) => {
      const next = { ...v, [key]: on };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function reset() {
    setVis(DEFAULT_VISIBILITY);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  return [vis, toggle, reset];
}
