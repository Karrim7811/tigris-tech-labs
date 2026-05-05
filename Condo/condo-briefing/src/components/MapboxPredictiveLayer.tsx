"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Layer,
  Source,
  Marker,
  AttributionControl,
  type MapRef,
} from "react-map-gl/mapbox";
import type {
  LineLayerSpecification,
  CircleLayerSpecification,
} from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import stormsData from "@/data/noaa/storms.json";
import {
  ENSEMBLE_TRACKS,
  TRACK_IDS_BY_MODEL,
  type ModelId,
} from "@/lib/predictive";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface Storm {
  id: string;
  name: string;
  year: number;
  peakWind: number;
  peakCat: number;
  closestKm: number;
  track: number[][];
}

interface StormsFile {
  miamiLat: number;
  miamiLon: number;
  startYear: number;
  endYear: number;
  count: number;
  storms: Storm[];
}

const STORMS = stormsData as unknown as StormsFile;

function buildHistoricalTracks(): GeoJSON.FeatureCollection {
  const cutoff = STORMS.endYear - 25;
  const features: GeoJSON.Feature[] = STORMS.storms
    .filter((s) => s.year >= cutoff && s.peakCat >= 1)
    .map((s) => ({
      type: "Feature",
      properties: { peakCat: s.peakCat, year: s.year },
      geometry: {
        type: "LineString",
        coordinates: s.track.map(([lat, lon]) => [lon, lat]),
      },
    }));
  return { type: "FeatureCollection", features };
}

function trackSliceCoords(
  path: [number, number][],
  p: number
): [number, number][] {
  const n = path.length;
  if (p <= 0) return [path[0], path[0]];
  if (p >= 1) return path.slice();
  const exactIdx = p * (n - 1);
  const lastIdx = Math.floor(exactIdx);
  const frac = exactIdx - lastIdx;
  const coords: [number, number][] = path.slice(0, lastIdx + 1) as [
    number,
    number
  ][];
  if (lastIdx + 1 < n && frac > 0) {
    const a = path[lastIdx];
    const b = path[lastIdx + 1];
    coords.push([a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac]);
  }
  if (coords.length < 2) coords.push(coords[0]);
  return coords;
}

function pointAtProgress(
  path: [number, number][],
  p: number
): [number, number] {
  const n = path.length;
  if (p <= 0) return path[0];
  if (p >= 1) return path[n - 1];
  const exactIdx = p * (n - 1);
  const lastIdx = Math.floor(exactIdx);
  const frac = exactIdx - lastIdx;
  const a = path[lastIdx];
  const b = path[Math.min(lastIdx + 1, n - 1)];
  return [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac];
}

const tracksLayer: LineLayerSpecification = {
  id: "historical-tracks",
  type: "line",
  source: "tracks",
  layout: { "line-cap": "round", "line-join": "round" },
  paint: {
    "line-color": "#5D6D78",
    "line-width": 0.6,
    "line-opacity": 0.22,
  },
};

// Comet-trail line: dim grey at the start, bright red at the leading edge.
const forecastLineLayer: LineLayerSpecification = {
  id: "forecast-line",
  type: "line",
  source: "forecast",
  layout: { "line-cap": "round", "line-join": "round" },
  paint: {
    "line-width": 2.2,
    "line-opacity": ["get", "opacity"],
    "line-blur": 0.8,
    "line-gradient": [
      "interpolate",
      ["linear"],
      ["line-progress"],
      0,
      "rgba(150,160,170,0.0)",
      0.45,
      "rgba(180,90,90,0.75)",
      0.85,
      "rgba(235,0,23,0.95)",
      1,
      "rgba(255,90,90,1)",
    ],
  },
};

const forecastGlowLayer: LineLayerSpecification = {
  id: "forecast-glow",
  type: "line",
  source: "forecast",
  layout: { "line-cap": "round", "line-join": "round" },
  paint: {
    "line-color": "#EB0017",
    "line-width": 7,
    "line-opacity": ["*", ["get", "opacity"], 0.35],
    "line-blur": 8,
  },
};

const headHaloLayer: CircleLayerSpecification = {
  id: "head-halo",
  type: "circle",
  source: "heads",
  paint: {
    "circle-color": "#EB0017",
    "circle-radius": 16,
    "circle-blur": 1.0,
    "circle-opacity": ["*", ["get", "opacity"], 0.35],
  },
};

const headCoreLayer: CircleLayerSpecification = {
  id: "head-core",
  type: "circle",
  source: "heads",
  paint: {
    "circle-color": "#EB0017",
    "circle-radius": 4.5,
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 1.5,
    "circle-opacity": ["get", "opacity"],
    "circle-stroke-opacity": ["get", "opacity"],
  },
};

const portfolioGlowLayer: CircleLayerSpecification = {
  id: "portfolio-glow",
  type: "circle",
  source: "portfolio-glow",
  paint: {
    "circle-color": "#EB0017",
    "circle-radius": 60,
    "circle-blur": 1.0,
    "circle-opacity": 0.18,
  },
};

interface Props {
  activeModelId: ModelId;
}

interface AnimatedFrame {
  forecast: GeoJSON.FeatureCollection;
  heads: GeoJSON.FeatureCollection;
}

const EMPTY_FRAME: AnimatedFrame = {
  forecast: { type: "FeatureCollection", features: [] },
  heads: { type: "FeatureCollection", features: [] },
};

export default function MapboxPredictiveLayer({ activeModelId }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [mapReady, setMapReady] = useState(false);
  const [frame, setFrame] = useState<AnimatedFrame>(EMPTY_FRAME);

  const tracks = useMemo(buildHistoricalTracks, []);

  const portfolioGlow = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [STORMS.miamiLon, STORMS.miamiLat],
          },
        },
      ],
    }),
    []
  );

  const activeTracks = useMemo(() => {
    const ids = TRACK_IDS_BY_MODEL[activeModelId] ?? [];
    return ids
      .map((id) => ENSEMBLE_TRACKS.find((t) => t.id === id))
      .filter((t): t is (typeof ENSEMBLE_TRACKS)[number] => Boolean(t));
  }, [activeModelId]);

  const startRef = useRef<number | null>(null);
  useEffect(() => {
    startRef.current = null;
  }, [activeModelId]);

  useEffect(() => {
    if (!mapReady) return;
    if (activeTracks.length === 0) {
      setFrame(EMPTY_FRAME);
      return;
    }

    let raf = 0;
    const cycleSec = 8.0;
    const drawFrac = 0.62; // 0..0.62 of cycle = drawing
    const holdFrac = 0.18; // 0.62..0.80 = held bright
    // 0.80..1.0 = fade

    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const elapsedSec = (t - startRef.current) / 1000;
      const baseProgress = (elapsedSec % cycleSec) / cycleSec;

      const forecastFeatures: GeoJSON.Feature[] = [];
      const headFeatures: GeoJSON.Feature[] = [];

      activeTracks.forEach((track, i) => {
        const stagger = i / activeTracks.length;
        const phase = (baseProgress + stagger) % 1;
        let progress: number;
        let opacity: number;
        if (phase < drawFrac) {
          const u = phase / drawFrac;
          progress = 1 - Math.pow(1 - u, 2.2);
          opacity = 0.95;
        } else if (phase < drawFrac + holdFrac) {
          progress = 1;
          opacity = 0.95;
        } else {
          const u = (phase - drawFrac - holdFrac) / (1 - drawFrac - holdFrac);
          progress = 1;
          opacity = 0.95 * Math.max(0, 1 - u);
        }

        const drawn = trackSliceCoords(track.path, progress);
        const headPos = pointAtProgress(track.path, progress);

        forecastFeatures.push({
          type: "Feature",
          properties: { opacity, trackId: track.id },
          geometry: { type: "LineString", coordinates: drawn },
        });
        headFeatures.push({
          type: "Feature",
          properties: { opacity, trackId: track.id },
          geometry: { type: "Point", coordinates: headPos },
        });
      });

      setFrame({
        forecast: { type: "FeatureCollection", features: forecastFeatures },
        heads: { type: "FeatureCollection", features: headFeatures },
      });

      // Pulse the head halos and portfolio glow synchronously
      const m = mapRef.current?.getMap();
      if (m) {
        try {
          const pulseHead =
            14 + 6 * ((Math.sin(elapsedSec * 2.4) + 1) / 2);
          m.setPaintProperty("head-halo", "circle-radius", pulseHead);
          const pulseGlow =
            54 + 14 * ((Math.sin(elapsedSec * 0.9) + 1) / 2);
          m.setPaintProperty("portfolio-glow", "circle-radius", pulseGlow);
          const glowOpacity =
            0.14 + 0.08 * ((Math.sin(elapsedSec * 0.9) + 1) / 2);
          m.setPaintProperty("portfolio-glow", "circle-opacity", glowOpacity);
        } catch {
          /* ignore */
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mapReady, activeTracks]);

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
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: -81.5,
        latitude: 27.6,
        zoom: 5.7,
        pitch: 0,
        bearing: 0,
      }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      attributionControl={false}
      reuseMaps
      interactive
      dragRotate={false}
      pitchWithRotate={false}
      minZoom={4}
      maxZoom={9}
      onLoad={() => setMapReady(true)}
      style={{ width: "100%", height: "100%" }}
    >
      <Source id="tracks" type="geojson" data={tracks}>
        <Layer {...tracksLayer} />
      </Source>
      <Source
        id="portfolio-glow"
        type="geojson"
        data={portfolioGlow}
      >
        <Layer {...portfolioGlowLayer} />
      </Source>
      <Source id="forecast" type="geojson" data={frame.forecast} lineMetrics>
        <Layer {...forecastGlowLayer} />
        <Layer {...forecastLineLayer} />
      </Source>
      <Source id="heads" type="geojson" data={frame.heads}>
        <Layer {...headHaloLayer} />
        <Layer {...headCoreLayer} />
      </Source>
      <Marker longitude={STORMS.miamiLon} latitude={STORMS.miamiLat}>
        <div className="relative">
          <div className="absolute inset-[-16px] rounded-full bg-aon-red/35 animate-ping" />
          <div className="absolute inset-[-7px] rounded-full bg-aon-red/30" />
          <div className="relative h-3 w-3 bg-aon-red rounded-full ring-2 ring-white shadow-lg" />
        </div>
      </Marker>
      <AttributionControl
        position="bottom-left"
        compact
        customAttribution="© Mapbox · NOAA HURDAT2 · ArcGIS Living Atlas (style ref.)"
      />
    </Map>
  );
}
