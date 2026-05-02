"use client";

import { useState, useEffect } from "react";

// ── Theme contract — same shape as PRAIX for portability ──
export interface DashboardTheme {
  bg: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  fontSize: number;     // multiplier 0.85–1.5
  fontBold: boolean;
  fontItalic: boolean;
}

// ── Curated presets — ALEVANT in TTL palette family ──
export const DASH_PRESETS: Record<string, { label: string; theme: DashboardTheme }> = {
  editorial: {
    label: "Editorial",
    theme: {
      bg: "#FAFAF8",
      card: "#FFFFFF",
      border: "#E8E5E0",
      text: "#1A1915",
      muted: "#B0AAA0",
      accent: "#1A8A9E",
      fontSize: 1,
      fontBold: false,
      fontItalic: false,
    },
  },
  parchment: {
    label: "Parchment",
    theme: {
      bg: "#F2F0ED",
      card: "#FAFAF8",
      border: "#E8E5E0",
      text: "#1A1915",
      muted: "#B0AAA0",
      accent: "#B5853E",
      fontSize: 1,
      fontBold: false,
      fontItalic: false,
    },
  },
  ink: {
    label: "Ink",
    theme: {
      bg: "#0F0F0F",
      card: "#1A1A1A",
      border: "#2A2A2A",
      text: "#E8E5E0",
      muted: "#666666",
      accent: "#1A8A9E",
      fontSize: 1,
      fontBold: false,
      fontItalic: false,
    },
  },
  midnight: {
    label: "Midnight",
    theme: {
      bg: "#0A0E1A",
      card: "#111827",
      border: "#1F2937",
      text: "#F3F4F6",
      muted: "#6B7280",
      accent: "#60A5FA",
      fontSize: 1,
      fontBold: false,
      fontItalic: false,
    },
  },
  terra: {
    label: "Terra",
    theme: {
      bg: "#FAFAF8",
      card: "#FFFFFF",
      border: "#E8E5E0",
      text: "#1A1915",
      muted: "#B0AAA0",
      accent: "#C4875A",
      fontSize: 1,
      fontBold: false,
      fontItalic: false,
    },
  },
};

const STORAGE_PREFIX = "alevant-dash-theme-";

export function useDashboardTheme(
  dashboardId: string
): [DashboardTheme, (t: DashboardTheme) => void, () => void] {
  const [theme, setThemeState] = useState<DashboardTheme>(DASH_PRESETS.editorial.theme);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + dashboardId);
      if (saved) setThemeState(JSON.parse(saved));
    } catch {}
  }, [dashboardId]);

  function setTheme(t: DashboardTheme) {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_PREFIX + dashboardId, JSON.stringify(t));
    } catch {}
  }

  function reset() {
    setThemeState(DASH_PRESETS.editorial.theme);
    try {
      localStorage.removeItem(STORAGE_PREFIX + dashboardId);
    } catch {}
  }

  return [theme, setTheme, reset];
}

// CSS variables to inject on the dashboard container so child components can read them.
export function themeToCssVars(t: DashboardTheme): React.CSSProperties {
  return {
    ["--dash-bg" as any]: t.bg,
    ["--dash-card" as any]: t.card,
    ["--dash-border" as any]: t.border,
    ["--dash-text" as any]: t.text,
    ["--dash-muted" as any]: t.muted,
    ["--dash-accent" as any]: t.accent,
    fontSize: `${Math.round(t.fontSize * 100)}%`,
    fontWeight: t.fontBold ? 500 : 300,
    fontStyle: t.fontItalic ? "italic" : "normal",
  } as React.CSSProperties;
}
