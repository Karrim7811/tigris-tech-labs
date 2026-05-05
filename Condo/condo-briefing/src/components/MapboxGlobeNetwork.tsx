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
  CircleLayerSpecification,
  LineLayerSpecification,
} from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/* ─────────── Hub data ─────────── */

interface Hub {
  id: string;
  city: string;
  region: string;
  brokers?: string;
  lat: number;
  lng: number;
  isLead?: boolean;
}

const HUBS: Hub[] = [
  { id: "nyc",    city: "New York",  region: "U.S. lead hub",  brokers: "125+ U.S. brokers",  lat: 40.7128,  lng: -74.0060, isLead: true },
  { id: "chi",    city: "Chicago",   region: "Property HQ",                                    lat: 41.8781,  lng: -87.6298 },
  { id: "lax",    city: "Los Angeles", region: "West Coast",                                   lat: 34.0522,  lng: -118.2437 },
  { id: "ldn",    city: "London",    region: "Lloyd's market", brokers: "60+ London brokers",  lat: 51.5074,  lng: -0.1278 },
  { id: "ber",    city: "Bermuda",   region: "Reinsurance",    brokers: "15+ Bermuda brokers", lat: 32.3078,  lng: -64.7505 },
  { id: "zur",    city: "Zurich",    region: "EU continental",                                 lat: 47.3769,  lng: 8.5417 },
  { id: "sgp",    city: "Singapore", region: "APAC",                                           lat: 1.3521,   lng: 103.8198 },
  { id: "syd",    city: "Sydney",    region: "Pacific",                                        lat: -33.8688, lng: 151.2093 },
  { id: "tok",    city: "Tokyo",     region: "Tokio Marine",                                   lat: 35.6762,  lng: 139.6503 },
  { id: "tor",    city: "Toronto",   region: "Canada",                                         lat: 43.6532,  lng: -79.3832 },
  { id: "dub",    city: "Dubai",     region: "MENA",                                           lat: 25.2048,  lng: 55.2708 },
  { id: "joh",    city: "Johannesburg", region: "Africa",                                      lat: -26.2041, lng: 28.0473 },
];

/* Tertiary "client country" dots — purely visual signal of "120+ countries". */
const CLIENT_DOTS: [number, number][] = [
  [55.7, 37.6], [19.4, -99.1], [-23.5, -46.6], [28.6, 77.2], [-34.6, -58.4],
  [-1.3, 36.8], [13.7, 100.5], [22.3, 114.2], [37.6, 127.0], [60.2, 24.9],
  [50.1, 14.4], [52.5, 13.4], [48.9, 2.4], [41.9, 12.5], [40.4, -3.7],
  [55.8, -4.3], [4.7, -74.1], [10.5, -66.9], [25.0, 121.6], [12.0, 8.6],
  [30.0, 31.2], [33.9, -6.8], [9.5, -13.7], [-37.8, 144.9], [-41.3, 174.8],
  [21.0, 105.8], [3.1, 101.7], [29.4, 47.9], [24.7, 46.7], [42.7, 23.3],
  [35.7, 51.4], [33.5, 36.3], [-12.0, -77.0], [3.4, -76.5], [13.5, -16.6],
  [-22.6, 17.0], [-1.3, 36.8], [-29.0, 27.0], [38.7, -9.1], [59.3, 18.0],
  [64.1, -21.9], [37.0, 35.3], [44.8, 20.5], [44.4, 26.1], [50.4, 30.5],
  [53.3, -6.3], [56.9, 24.1], [-15.8, -47.9], [9.0, 38.7], [25.3, 51.5],
];

/* ─────────── Great-circle interpolation ─────────── */

/** Slerp between two lat/lng points along a great circle.
 *  Returns n+1 points (inclusive of endpoints). */
function greatCircle(
  a: [number, number],
  b: [number, number],
  n = 64
): [number, number][] {
  // Convert to unit vectors on the sphere
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const ll2v = ([lng, lat]: [number, number]) => {
    const φ = toRad(lat), λ = toRad(lng);
    return [Math.cos(φ) * Math.cos(λ), Math.cos(φ) * Math.sin(λ), Math.sin(φ)];
  };
  const v2ll = (v: number[]): [number, number] => {
    const lat = toDeg(Math.asin(v[2]));
    const lng = toDeg(Math.atan2(v[1], v[0]));
    return [lng, lat];
  };
  const va = ll2v(a);
  const vb = ll2v(b);
  const dot = va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2];
  const omega = Math.acos(Math.max(-1, Math.min(1, dot)));
  const sinO = Math.sin(omega);
  if (sinO < 1e-9) return [a, b];
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const A = Math.sin((1 - t) * omega) / sinO;
    const B = Math.sin(t * omega) / sinO;
    const v = [A * va[0] + B * vb[0], A * va[1] + B * vb[1], A * va[2] + B * vb[2]];
    out.push(v2ll(v));
  }
  return out;
}

/* ─────────── Layer specs ─────────── */

const ARC_LAYER: LineLayerSpecification = {
  id: "arcs",
  type: "line",
  source: "arcs",
  layout: { "line-cap": "round", "line-join": "round" },
  paint: {
    "line-color": "#EB0017",
    "line-width": ["interpolate", ["linear"], ["zoom"], 0, 1.2, 4, 2.0],
    "line-opacity": 0,         // animated externally
    "line-blur": 1,
  },
};

const ARC_GLOW_LAYER: LineLayerSpecification = {
  id: "arcs-glow",
  type: "line",
  source: "arcs",
  layout: { "line-cap": "round", "line-join": "round" },
  paint: {
    "line-color": "#EB0017",
    "line-width": 8,
    "line-opacity": 0,
    "line-blur": 8,
  },
};

const CLIENT_DOT_LAYER: CircleLayerSpecification = {
  id: "client-dots",
  type: "circle",
  source: "clients",
  paint: {
    "circle-radius": 2.5,
    "circle-color": "#28AFC3",
    "circle-opacity": 0,
    "circle-blur": 0.5,
  },
};

const CLIENT_DOT_GLOW: CircleLayerSpecification = {
  id: "client-dots-glow",
  type: "circle",
  source: "clients",
  paint: {
    "circle-radius": 6,
    "circle-color": "#28AFC3",
    "circle-opacity": 0,
    "circle-blur": 1.2,
  },
};

/* ─────────── Component ─────────── */

export default function MapboxGlobeNetwork() {
  const mapRef = useRef<MapRef>(null);
  const [mapReady, setMapReady] = useState(false);
  const [phase, setPhase] = useState(0);
  // 0 = init, 1 = hubs visible, 2 = arcs drawing, 3 = arcs done + clients fading in
  const [pulses, setPulses] = useState<{ id: number; arcIdx: number; t: number }[]>([]);

  const lead = HUBS.find((h) => h.isLead)!;

  /* Build arcs as GeoJSON + cache the raw coordinate arrays for pulse interpolation */
  const others = useMemo(() => HUBS.filter((h) => !h.isLead), []);
  const arcCoords = useMemo<[number, number][][]>(
    () =>
      others.map((h) =>
        greatCircle([lead.lng, lead.lat], [h.lng, h.lat], 96)
      ),
    [others, lead.lng, lead.lat]
  );

  const arcsGeo: GeoJSON.FeatureCollection = useMemo(
    () => ({
      type: "FeatureCollection",
      features: others.map((h, i) => ({
        type: "Feature",
        properties: { to: h.id },
        geometry: { type: "LineString", coordinates: arcCoords[i] },
      })),
    }),
    [others, arcCoords]
  );

  const clientsGeo: GeoJSON.FeatureCollection = useMemo(() => ({
    type: "FeatureCollection",
    features: CLIENT_DOTS.map(([lat, lng], i) => ({
      type: "Feature",
      properties: { idx: i },
      geometry: { type: "Point", coordinates: [lng, lat] },
    })),
  }), []);

  /* ─── Phase ticker ─── */
  useEffect(() => {
    if (!mapReady) return;
    const t1 = setTimeout(() => setPhase(1), 600);   // hubs visible
    const t2 = setTimeout(() => setPhase(2), 1700);  // arcs draw
    const t3 = setTimeout(() => setPhase(3), 4500);  // client dots
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [mapReady]);

  /* ─── Globe spin ─── */
  useEffect(() => {
    const m = mapRef.current?.getMap();
    if (!m || !mapReady) return;
    let raf = 0;
    let last = performance.now();
    const spin = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const center = m.getCenter();
      m.setCenter([center.lng - dt * 3, center.lat] as [number, number]);
      raf = requestAnimationFrame(spin);
    };
    raf = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(raf);
  }, [mapReady]);

  /* ─── Animate paint properties per phase ─── */
  useEffect(() => {
    const m = mapRef.current?.getMap();
    if (!m || !mapReady) return;

    try {
      // Arcs: opacity ramps from 0 → 0.95 during phase 2; animated dash for "draw-in" feel
      if (phase >= 2) {
        m.setPaintProperty("arcs", "line-opacity", 0.92);
        m.setPaintProperty("arcs-glow", "line-opacity", 0.5);

        // Animate line-dasharray — creates the "energy travelling along the arc" effect
        const startedAt = performance.now();
        let raf = 0;
        const animateDash = (t: number) => {
          const dt = ((t - startedAt) / 1000) % 1.6;
          const offset = (dt / 1.6) * 8;
          try {
            m.setPaintProperty("arcs", "line-dasharray", [3, 3] as unknown as number[]);
            m.setPaintProperty("arcs", "line-translate", [offset, 0] as unknown as [number, number]);
          } catch { /* mapbox sometimes errors mid-tick */ }
          raf = requestAnimationFrame(animateDash);
        };
        raf = requestAnimationFrame(animateDash);
        return () => cancelAnimationFrame(raf);
      }

      // Client dots fade in during phase 3
      if (phase >= 3) {
        m.setPaintProperty("client-dots", "circle-opacity", 0.85);
        m.setPaintProperty("client-dots-glow", "circle-opacity", 0.4);
      }
    } catch {
      /* ignore */
    }
  }, [phase, mapReady]);

  /* ─── Reveal client dots when entering phase 3 (separate effect for clarity) ─── */
  useEffect(() => {
    const m = mapRef.current?.getMap();
    if (!m || !mapReady || phase < 3) return;
    try {
      m.setPaintProperty("client-dots", "circle-opacity", 0.85);
      m.setPaintProperty("client-dots-glow", "circle-opacity", 0.4);
    } catch {}
  }, [phase, mapReady]);

  /* ─── Traveling pulses: red dots flowing along arcs from NYC to each hub ─── */
  useEffect(() => {
    if (!mapReady || phase < 2) return;
    const PULSE_DURATION = 4500; // ms for a pulse to traverse an arc
    const SPAWN_INTERVAL = 700;  // ms between pulse spawns
    let lastSpawn = performance.now();
    let nextId = 0;
    let raf = 0;
    let lastFrame = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastFrame) / PULSE_DURATION;
      lastFrame = now;

      setPulses((prev) => {
        const advanced = prev
          .map((p) => ({ ...p, t: p.t + dt }))
          .filter((p) => p.t < 1);

        // Spawn a new pulse every SPAWN_INTERVAL ms, cycling through arcs
        if (now - lastSpawn >= SPAWN_INTERVAL) {
          lastSpawn = now;
          const arcIdx = nextId % arcCoords.length;
          advanced.push({ id: nextId++, arcIdx, t: 0 });
        }
        return advanced;
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mapReady, phase, arcCoords.length]);

  /* Resolve each pulse to a current lat/lng on its arc */
  const pulsePositions = pulses.map((p) => {
    const coords = arcCoords[p.arcIdx];
    const idx = Math.min(coords.length - 1, Math.floor(p.t * (coords.length - 1)));
    const [lng, lat] = coords[idx];
    return { id: p.id, lng, lat, t: p.t };
  });

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-aon-midnight">
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
          longitude: -45,
          latitude: 28,
          zoom: 1.6,
          pitch: 0,
          bearing: 0,
        }}
        projection={{ name: "globe" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
        reuseMaps
        interactive={false}
        onLoad={(e) => {
          // Set fog for a more cinematic globe atmosphere
          const m = e.target;
          try {
            m.setFog({
              color: "rgb(186, 210, 235)",
              "high-color": "rgb(36, 92, 223)",
              "horizon-blend": 0.02,
              "space-color": "rgb(11, 18, 50)",
              "star-intensity": 0.6,
            });
          } catch {}
          setMapReady(true);
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <AttributionControl
          position="bottom-left"
          compact
          customAttribution="© Mapbox"
        />

        <Source id="clients" type="geojson" data={clientsGeo}>
          <Layer {...CLIENT_DOT_GLOW} />
          <Layer {...CLIENT_DOT_LAYER} />
        </Source>

        <Source id="arcs" type="geojson" data={arcsGeo}>
          <Layer {...ARC_GLOW_LAYER} />
          <Layer {...ARC_LAYER} />
        </Source>

        {phase >= 1 &&
          HUBS.map((h, i) => (
            <Marker key={h.id} longitude={h.lng} latitude={h.lat} anchor="center">
              <HubPin hub={h} delay={i * 0.08} />
            </Marker>
          ))}

        {/* Traveling pulses — red dots flowing along arcs */}
        {pulsePositions.map((p) => (
          <Marker key={p.id} longitude={p.lng} latitude={p.lat} anchor="center">
            <PulseDot t={p.t} />
          </Marker>
        ))}
      </Map>
    </div>
  );
}

/* ─────────── Traveling pulse dot ─────────── */

function PulseDot({ t }: { t: number }) {
  // Fade in during first 12% of journey, fade out during last 12%
  const opacity =
    t < 0.12 ? t / 0.12 :
    t > 0.88 ? (1 - t) / 0.12 :
    1;
  return (
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: "#EB0017",
        boxShadow: `0 0 12px rgba(235,0,23,0.95), 0 0 24px rgba(235,0,23,0.55)`,
        opacity,
        pointerEvents: "none",
      }}
    />
  );
}

/* ─────────── Hub pin ─────────── */

function HubPin({ hub, delay }: { hub: Hub; delay: number }) {
  return (
    <div
      className="relative flex flex-col items-center"
      style={{
        animation: `globe-pin-in 0.6s ${delay}s both cubic-bezier(0.22,1,0.36,1)`,
        pointerEvents: "none",
      }}
    >
      <style jsx>{`
        @keyframes globe-pin-in {
          from { opacity: 0; transform: scale(0.4); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes globe-pulse {
          0%   { transform: scale(1);   opacity: 0.55; }
          70%  { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(2.4); opacity: 0; }
        }
      `}</style>

      {/* Pulse ring (lead only) */}
      {hub.isLead && (
        <span
          className="absolute h-3 w-3 rounded-full bg-aon-red"
          style={{ animation: "globe-pulse 2.2s ease-out infinite" }}
        />
      )}

      <span
        className={`block rounded-full ring-2 ring-white/90 shadow-md ${
          hub.isLead ? "h-3 w-3 bg-aon-red" : "h-2 w-2 bg-white"
        }`}
      />

      {/* Label — only for the named hubs (lead + brokered) */}
      {(hub.isLead || hub.brokers) && (
        <div
          className="mt-1 text-[10px] tracking-[0.12em] uppercase font-semibold text-white whitespace-nowrap"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.85)" }}
        >
          {hub.city}
        </div>
      )}
    </div>
  );
}
