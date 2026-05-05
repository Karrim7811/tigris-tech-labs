"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Layer,
  Marker,
  Source,
  AttributionControl,
  type MapRef,
} from "react-map-gl/mapbox";
import type {
  FillLayerSpecification,
  LineLayerSpecification,
} from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import stormsData from "@/data/noaa/storms.json";
import surgeZonesData from "@/data/noaa/surge-zones.json";
import { portfolio, TIER_COLORS } from "@/data/portfolio";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/* ─────────── Types ─────────── */

type Storm = {
  id: string;
  name: string;
  year: number;
  peakWind: number;
  peakCat: number;     // -1 unknown, 0 TS/TD, 1..5 hurricane
  closestKm: number;
  track: number[][];   // [lat, lon, wind, cat] — JSON-loaded so number[]
};

type StormsFile = {
  miamiLat: number;
  miamiLon: number;
  startYear: number;
  endYear: number;
  count: number;
  storms: Storm[];
};

const STORMS = stormsData as unknown as StormsFile;
const SURGE = surgeZonesData as GeoJSON.FeatureCollection;

/* ─────────── Color scheme ─────────── */

// Saffir-Simpson color ramp tuned for dark map background
const CAT_COLORS: Record<number, string> = {
  [-1]: "#5b6473",
  0: "#6FB7D9",     // TS/TD — pale blue
  1: "#FFD66B",     // Cat 1 — gold
  2: "#FFA640",     // Cat 2 — orange
  3: "#FF6B3B",     // Cat 3 — red-orange
  4: "#E5283A",     // Cat 4 — red
  5: "#B3008B",     // Cat 5 — magenta
};

// Surge zone colors (A = closest to coast, evacuates first)
const SURGE_COLORS: Record<number, string> = {
  1: "#EB0017",  // A — Cat 1+ floods — Aon red
  2: "#F47E2A",
  3: "#F2C744",
  4: "#A8C7E8",
  5: "#5B82B0",  // E — Cat 5 only
};

const SURGE_LABELS: Record<number, string> = {
  1: "Zone A — Cat 1+ surge",
  2: "Zone B — Cat 2+ surge",
  3: "Zone C — Cat 3+ surge",
  4: "Zone D — Cat 4+ surge",
  5: "Zone E — Cat 5 only",
};

/* ─────────── Build GeoJSON for storm tracks ─────────── */

function buildTracksGeoJSON(): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = STORMS.storms.map((s) => ({
    type: "Feature",
    properties: {
      id: s.id,
      name: s.name,
      year: s.year,
      peakCat: s.peakCat < 0 ? 0 : s.peakCat,
      peakWind: s.peakWind,
    },
    geometry: {
      type: "LineString",
      coordinates: s.track.map(([lat, lon]) => [lon, lat]),
    },
  }));
  return { type: "FeatureCollection", features };
}

/* ─────────── Mapbox layer specs ─────────── */

const tracksLayer: LineLayerSpecification = {
  id: "storm-tracks",
  type: "line",
  source: "storms",
  layout: { "line-cap": "round", "line-join": "round" },
  paint: {
    "line-color": [
      "match",
      ["get", "peakCat"],
      0, CAT_COLORS[0],
      1, CAT_COLORS[1],
      2, CAT_COLORS[2],
      3, CAT_COLORS[3],
      4, CAT_COLORS[4],
      5, CAT_COLORS[5],
      CAT_COLORS[0],
    ],
    "line-width": [
      "interpolate", ["linear"], ["get", "peakCat"],
      0, 1.0,
      3, 2.0,
      5, 3.0,
    ],
    "line-opacity": 0,  // driven by setPaintProperty per-frame
    "line-blur": 0.4,
  },
};

const surgeFillLayer: FillLayerSpecification = {
  id: "surge-fill",
  type: "fill",
  source: "surge",
  paint: {
    "fill-color": [
      "match",
      ["get", "category"],
      1, SURGE_COLORS[1],
      2, SURGE_COLORS[2],
      3, SURGE_COLORS[3],
      4, SURGE_COLORS[4],
      5, SURGE_COLORS[5],
      "#888",
    ],
    "fill-opacity": 0,  // driven by surgeAlpha
  },
};

const surgeLineLayer: LineLayerSpecification = {
  id: "surge-outline",
  type: "line",
  source: "surge",
  paint: {
    "line-color": [
      "match",
      ["get", "category"],
      1, SURGE_COLORS[1],
      2, SURGE_COLORS[2],
      3, SURGE_COLORS[3],
      4, SURGE_COLORS[4],
      5, SURGE_COLORS[5],
      "#888",
    ],
    "line-width": 0.6,
    "line-opacity": 0,
  },
};

/* ─────────── Component ─────────── */

interface Props {
  /** Animation total runtime in ms for the storm sweep (default 28s). */
  durationMs?: number;
  /** Auto-start on mount. */
  autoPlay?: boolean;
}

export default function MapboxStormHistory({
  durationMs = 28_000,
  autoPlay = true,
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const [progress, setProgress] = useState(0); // 0..1.3 (1=storms done, >1 = surge phase)
  const [playing, setPlaying] = useState(autoPlay);
  const [mapReady, setMapReady] = useState(false);

  const tracks = useMemo(buildTracksGeoJSON, []);

  /* Phases ─────────────────────────
     0 → 1.0   : storms paint in
     1.0 → 1.2 : surge zones fade in
     1.2 → 1.3 : buildings drop in (handled by displayedYear/buildingsVisible)
  */
  const stormFraction = Math.min(progress, 1);
  const displayedYear = Math.round(
    STORMS.startYear + (STORMS.endYear - STORMS.startYear) * stormFraction
  );
  const surgeAlpha = Math.max(0, Math.min(1, (progress - 1.0) / 0.2));
  const buildingsVisible = progress >= 1.18;

  // Stats up to displayedYear
  const stats = useMemo(() => {
    const shown = STORMS.storms.filter((s) => s.year <= displayedYear);
    let cat5 = 0, cat34 = 0, hurricanes = 0;
    for (const s of shown) {
      if (s.peakCat >= 1) hurricanes += 1;
      if (s.peakCat === 5) cat5 += 1;
      if (s.peakCat >= 3 && s.peakCat <= 4) cat34 += 1;
    }
    return { total: shown.length, hurricanes, cat34, cat5 };
  }, [displayedYear]);

  /* ─── Animation loop ─── */
  useEffect(() => {
    if (!playing) return;
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now - progress * durationMs;
      const elapsed = now - startRef.current;
      // Map elapsed to 0..1.3 (storms 0-1, then surge 1-1.2, then dwell 1.2-1.3)
      const totalSpan = durationMs * 1.3;
      const next = Math.min(1.3, elapsed / durationMs);
      setProgress(next);
      if (elapsed < totalSpan && next < 1.3) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPlaying(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  /* ─── Drive paint properties per-frame (cheap; no new sources) ─── */
  useEffect(() => {
    const m = mapRef.current?.getMap();
    if (!m || !mapReady) return;

    // Storm tracks: each line's opacity = function of (displayedYear - year)
    // Older storms fully opaque; new arrivals 0.95; just-revealed pop in.
    const yearExpr: mapboxgl.ExpressionSpecification = [
      "case",
      [">", ["get", "year"], displayedYear], 0,
      [">", ["get", "year"], displayedYear - 1], 0.95,
      0.85,
    ];
    try {
      m.setPaintProperty("storm-tracks", "line-opacity", yearExpr);
    } catch {}

    // Surge layer alpha
    try {
      m.setPaintProperty("surge-fill", "fill-opacity", surgeAlpha * 0.45);
      m.setPaintProperty("surge-outline", "line-opacity", surgeAlpha * 0.85);
    } catch {}
  }, [displayedYear, surgeAlpha, mapReady]);

  /* ─── Replay handler ─── */
  const replay = () => {
    startRef.current = null;
    setProgress(0);
    setPlaying(true);
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-aon-pale">
        <div className="text-aon-stone text-xs tracking-[0.2em] uppercase">
          Missing NEXT_PUBLIC_MAPBOX_TOKEN
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: -80.05,
          latitude: 25.7,
          zoom: 7.6,
          pitch: 0,
          bearing: 0,
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
        reuseMaps
        onLoad={() => setMapReady(true)}
        style={{ width: "100%", height: "100%" }}
      >
        <AttributionControl
          position="bottom-left"
          compact
          customAttribution="© Mapbox · NOAA HURDAT2 · Miami-Dade SLOSH"
        />

        <Source id="storms" type="geojson" data={tracks}>
          <Layer {...tracksLayer} />
        </Source>

        <Source id="surge" type="geojson" data={SURGE}>
          <Layer {...surgeFillLayer} />
          <Layer {...surgeLineLayer} />
        </Source>

        {buildingsVisible &&
          portfolio.map((p) => (
            <Marker
              key={p.id}
              longitude={p.lng}
              latitude={p.lat}
              anchor="center"
            >
              <BuildingPin tier={p.risk.overall_tier} label={p.location_name} />
            </Marker>
          ))}
      </Map>

      {/* HUD overlay */}
      <div className="pointer-events-none absolute inset-0">
        {/* Year ticker, top-left (Aon wordmark hidden on this slide) */}
        <div className="absolute top-6 left-6 pointer-events-auto">
          <div className="rounded-sm bg-aon-midnight/85 backdrop-blur px-5 py-3 ring-1 ring-white/10 shadow-xl">
            <div className="text-[10px] tracking-[0.3em] uppercase text-aon-cyan/80 mb-1">
              Year
            </div>
            <div className="text-5xl font-medium text-white tabular leading-none">
              {displayedYear}
            </div>
          </div>
        </div>

        {/* Cumulative stats, top-right */}
        <div className="absolute top-6 right-6 pointer-events-auto">
          <div className="rounded-sm bg-aon-midnight/85 backdrop-blur px-5 py-3 ring-1 ring-white/10 shadow-xl space-y-2 min-w-[220px]">
            <StatRow label="Storms passing Miami" value={stats.total} accent="white" />
            <StatRow label="Hurricanes (Cat 1+)" value={stats.hurricanes} accent="#FFD66B" />
            <StatRow label="Major (Cat 3-4)" value={stats.cat34} accent="#FF6B3B" />
            <StatRow label="Cat 5 events" value={stats.cat5} accent="#B3008B" />
          </div>
        </div>

        {/* Surge zone legend (only after surge phase) */}
        {surgeAlpha > 0.05 && (
          <div className="absolute bottom-12 right-6 pointer-events-auto"
               style={{ opacity: Math.min(1, surgeAlpha * 1.2) }}>
            <div className="rounded-sm bg-aon-midnight/85 backdrop-blur px-4 py-3 ring-1 ring-white/10 shadow-xl">
              <div className="text-[9px] tracking-[0.3em] uppercase text-white/50 mb-2">
                SLOSH evacuation zones
              </div>
              <ul className="space-y-1.5">
                {[1, 2, 3, 4, 5].map((c) => (
                  <li key={c} className="flex items-center gap-2.5 text-[11px] text-white/85">
                    <span
                      className="block h-2.5 w-4 rounded-[1px]"
                      style={{ background: SURGE_COLORS[c] }}
                    />
                    {SURGE_LABELS[c]}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Saffir-Simpson legend, bottom-left */}
        <div className="absolute bottom-12 left-6 pointer-events-auto">
          <div className="rounded-sm bg-aon-midnight/85 backdrop-blur px-4 py-3 ring-1 ring-white/10 shadow-xl">
            <div className="text-[9px] tracking-[0.3em] uppercase text-white/50 mb-2">
              Storm intensity
            </div>
            <ul className="space-y-1.5">
              {[
                [0, "Tropical storm"],
                [1, "Cat 1 hurricane"],
                [2, "Cat 2"],
                [3, "Cat 3 (major)"],
                [4, "Cat 4"],
                [5, "Cat 5"],
              ].map(([cat, label]) => (
                <li key={cat as number} className="flex items-center gap-2.5 text-[11px] text-white/85">
                  <span
                    className="block h-1 w-5 rounded-[1px]"
                    style={{ background: CAT_COLORS[cat as number] }}
                  />
                  {label as string}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Replay control, bottom-center */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            onClick={replay}
            className="px-4 py-1.5 rounded-sm bg-aon-red text-white text-xs tracking-[0.2em] uppercase hover:bg-aon-red/90 shadow-lg ring-1 ring-white/15 transition-colors"
          >
            {progress >= 1.3 ? "Replay" : playing ? "Playing…" : "Resume"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Sub-components ─────────── */

function StatRow({
  label, value, accent,
}: {
  label: string; value: number; accent: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[10px] tracking-[0.18em] uppercase text-white/55">{label}</span>
      <span className="text-xl font-semibold tabular" style={{ color: accent }}>
        {value}
      </span>
    </div>
  );
}

function BuildingPin({ tier, label }: { tier: 1 | 2 | 3; label: string }) {
  const color = TIER_COLORS[tier];
  return (
    <div className="flex flex-col items-center" style={{ pointerEvents: "none" }}>
      <div
        className="px-2 py-0.5 rounded-sm text-[10px] font-semibold whitespace-nowrap shadow-md"
        style={{ background: color, color: "white", letterSpacing: "0.02em" }}
      >
        {label}
      </div>
      <div
        className="mt-0.5 h-3 w-3 rounded-full ring-2 ring-white"
        style={{ background: color, boxShadow: `0 0 0 4px ${color}33` }}
      />
    </div>
  );
}
