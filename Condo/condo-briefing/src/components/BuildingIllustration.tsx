"use client";

import type { BuildingIllustrationConfig } from "@/data/portfolio";

/**
 * Renders an SVG silhouette of a condo tower based on a parametric config.
 * Same source of truth (`buildingSvgMarkup`) is used both as a React
 * component (here) and as a raw HTML string in the Leaflet map's divIcon.
 */

export interface BuildingSvgOpts {
  /** Glow / shadow under the building. */
  shadow?: boolean;
  /** Override accent stripe visibility. */
  accent?: boolean;
}

export function buildingSvgMarkup(
  cfg: BuildingIllustrationConfig,
  opts: BuildingSvgOpts = {}
): string {
  const { shadow = false, accent = true } = opts;
  const {
    stories,
    width,
    crown,
    baseColor,
    glassColor,
    accentColor,
    windowPattern,
  } = cfg;

  // Geometry
  const W = width === "narrow" ? 30 : width === "wide" ? 78 : 50;
  const STORY_H = 5;
  const bodyH = stories * STORY_H;
  const baseH = 6;
  const crownH =
    crown === "flat"
      ? 4
      : crown === "tapered"
      ? 14
      : crown === "curved"
      ? 12
      : crown === "stepped"
      ? 16
      : crown === "mast"
      ? 22
      : 4;

  const PAD_X = 4;
  const PAD_TOP = 2;
  const totalW = W + PAD_X * 2;
  const totalH = crownH + bodyH + baseH + PAD_TOP + 2;

  const bodyTop = PAD_TOP + crownH;
  const bodyBottom = bodyTop + bodyH;
  const baseTop = bodyBottom;

  /* ── Building body ── */
  const bodyRect = `<rect x="${PAD_X}" y="${bodyTop}" width="${W}" height="${bodyH}" fill="${baseColor}" />`;

  /* ── Crown ── */
  let crownEl = "";
  if (crown === "flat") {
    crownEl = `<rect x="${PAD_X}" y="${bodyTop - 4}" width="${W}" height="4" fill="${baseColor}" />`;
  } else if (crown === "tapered") {
    crownEl = `<polygon points="${PAD_X},${bodyTop} ${PAD_X + 6},${PAD_TOP} ${PAD_X + W - 6},${PAD_TOP} ${PAD_X + W},${bodyTop}" fill="${baseColor}" />`;
  } else if (crown === "curved") {
    crownEl = `<path d="M ${PAD_X},${bodyTop} Q ${PAD_X + W / 2},${PAD_TOP - 2} ${PAD_X + W},${bodyTop} Z" fill="${baseColor}" />`;
  } else if (crown === "stepped") {
    crownEl = `
      <rect x="${PAD_X}" y="${bodyTop - 4}" width="${W}" height="4" fill="${baseColor}" />
      <rect x="${PAD_X + W * 0.18}" y="${PAD_TOP + 4}" width="${W * 0.64}" height="${crownH - 8}" fill="${baseColor}" />
      <rect x="${PAD_X + W * 0.36}" y="${PAD_TOP}" width="${W * 0.28}" height="4" fill="${baseColor}" />`;
  } else if (crown === "mast") {
    crownEl = `
      <rect x="${PAD_X}" y="${bodyTop - 5}" width="${W}" height="5" fill="${baseColor}" />
      <rect x="${PAD_X + W / 2 - 0.75}" y="${PAD_TOP}" width="1.5" height="${crownH - 5}" fill="${baseColor}" />`;
  }

  /* ── Windows ── */
  let windows = "";
  if (windowPattern === "strips") {
    for (let i = 0; i < stories; i++) {
      const y = bodyTop + i * STORY_H + 1.5;
      windows += `<rect x="${PAD_X + 2}" y="${y}" width="${W - 4}" height="${STORY_H * 0.4}" fill="${glassColor}" opacity="0.85" />`;
    }
  } else if (windowPattern === "ribbons") {
    for (let i = 0; i < stories; i++) {
      const y = bodyTop + i * STORY_H + 1;
      windows += `<rect x="${PAD_X + 1}" y="${y}" width="${W - 2}" height="${STORY_H * 0.55}" fill="${glassColor}" opacity="0.7" />`;
    }
  } else {
    // grid
    const cols = Math.max(3, Math.round(W / 14));
    const colW = (W - 4 - cols * 1.4) / cols;
    const winH = STORY_H * 0.55;
    for (let i = 0; i < stories; i++) {
      for (let j = 0; j < cols; j++) {
        const x = PAD_X + 2 + j * (colW + 1.4);
        const y = bodyTop + i * STORY_H + 1.2;
        windows += `<rect x="${x}" y="${y}" width="${colW}" height="${winH}" fill="${glassColor}" opacity="0.85" />`;
      }
    }
  }

  /* ── Accent stripe ── */
  const accentEl =
    accent && accentColor
      ? `<rect x="${PAD_X}" y="${bodyTop}" width="2.5" height="${bodyH}" fill="${accentColor}" />`
      : "";

  /* ── Base ── */
  const baseEl = `
    <rect x="${PAD_X - 1}" y="${baseTop}" width="${W + 2}" height="${baseH}" fill="${baseColor}" opacity="0.9" />
    <rect x="0" y="${baseTop + baseH - 1}" width="${totalW}" height="1" fill="${accentColor || baseColor}" opacity="0.5" />`;

  /* ── Shadow ── */
  const shadowEl = shadow
    ? `<ellipse cx="${totalW / 2}" cy="${baseTop + baseH + 1.5}" rx="${W / 2 + 2}" ry="1.6" fill="rgba(6,11,38,0.25)" />`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" preserveAspectRatio="xMidYMax meet" style="display:block">
    ${shadowEl}
    ${crownEl}
    ${bodyRect}
    ${windows}
    ${accentEl}
    ${baseEl}
  </svg>`;
}

interface Props {
  config: BuildingIllustrationConfig;
  height?: number;
  className?: string;
  shadow?: boolean;
}

export default function BuildingIllustration({
  config,
  height = 200,
  className = "",
  shadow = true,
}: Props) {
  return (
    <div
      className={className}
      style={{ height, display: "flex", alignItems: "flex-end" }}
      dangerouslySetInnerHTML={{
        __html: buildingSvgMarkup(config, { shadow }).replace(
          "<svg ",
          `<svg style="height:100%;width:auto" `
        ),
      }}
    />
  );
}
