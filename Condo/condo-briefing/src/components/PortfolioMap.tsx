"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building,
  RiskTier,
  TIER_COLORS,
  TIER_LABELS,
  TIER_DESCRIPTIONS,
} from "@/data/portfolio";
import { buildingSvgMarkup } from "./BuildingIllustration";

interface Props {
  properties: Building[];
  onSelectBuilding: (id: string) => void;
}

export default function PortfolioMap({ properties, onSelectBuilding }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zoneCirclesRef = useRef<any[]>([]);

  const [layers, setLayers] = useState({ wind: false, flood: false });
  const [ready, setReady] = useState(false);

  const located = useMemo(
    () => properties.filter((p) => p.lat && p.lng),
    [properties]
  );

  const analytics = useMemo(() => {
    const tierCounts: Record<RiskTier, number> = { 1: 0, 2: 0, 3: 0 };
    let totalUnits = 0;
    let totalDistance = 0;
    properties.forEach((p) => {
      tierCounts[p.risk.overall_tier]++;
      totalUnits += p.units || 0;
      totalDistance += p.risk.distance_to_water_m;
    });
    const avgDistance =
      properties.length > 0 ? Math.round(totalDistance / properties.length) : 0;
    return {
      tierCounts,
      totalUnits,
      avgDistance,
      locatedCount: located.length,
    };
  }, [properties, located]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      const cssId = "leaflet-css";
      if (!document.getElementById(cssId)) {
        const link = document.createElement("link");
        link.id = cssId;
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      if (cancelled || !mapRef.current) return;
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
      }).setView([25.78, -80.19], 12);
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        { maxZoom: 19, subdomains: "abcd" }
      ).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapInstance.current = map;
      setReady(true);
      drawMarkers(L, map);
    })();
    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw markers when properties change
  useEffect(() => {
    if (!mapInstance.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapInstance.current) return;
      drawMarkers(L, mapInstance.current);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties]);

  // Update zone overlay circles when layer toggles change
  useEffect(() => {
    if (!mapInstance.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapInstance.current) return;
      const map = mapInstance.current;
      zoneCirclesRef.current.forEach((c) => map.removeLayer(c));
      zoneCirclesRef.current = [];

      const palette = { wind: "#EB0017", flood: "#28AFC3" };
      located.forEach((p) => {
        const wind =
          layers.wind &&
          p.named_windstorm_zone &&
          !/non-cat|none/i.test(p.named_windstorm_zone);
        const flood =
          layers.flood &&
          p.flood_zone &&
          !/^(none|x|minimal)$/i.test(p.flood_zone);

        const zones = [
          wind && { color: palette.wind, radius: 700 },
          flood && { color: palette.flood, radius: 450 },
        ].filter(Boolean) as { color: string; radius: number }[];

        zones.forEach((z) => {
          const circle = L.circle([p.lat, p.lng], {
            radius: z.radius,
            color: z.color,
            weight: 1.5,
            opacity: 0.55,
            fillColor: z.color,
            fillOpacity: 0.07,
          }).addTo(map);
          zoneCirclesRef.current.push(circle);
        });
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [layers, located]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function drawMarkers(L: typeof import("leaflet"), map: any) {
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const ICON_H = 64;
    const ICON_W = 90;

    located.forEach((p) => {
      const tier = p.risk.overall_tier;
      const tierColor = TIER_COLORS[tier];
      const svg = buildingSvgMarkup(p.illustration, { shadow: true });

      const html = `
        <div class="building-marker" style="
          height:${ICON_H}px;width:${ICON_W}px;
          display:flex;align-items:flex-end;justify-content:center;
          cursor:pointer;position:relative;
          transition:transform 160ms cubic-bezier(0.22,1,0.36,1);
        ">
          <div style="
            position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);
            width:6px;height:6px;border-radius:50%;background:${tierColor};
            box-shadow:0 0 0 2px white,0 2px 6px rgba(6,11,38,0.35);
          "></div>
          <div style="
            position:absolute;top:-3px;left:50%;transform:translateX(-50%);
            background:${tierColor};color:white;
            font-size:9px;font-weight:600;letter-spacing:0.08em;
            padding:1.5px 5px;border-radius:2px;
            box-shadow:0 1px 3px rgba(6,11,38,0.3);
            font-family:Inter,system-ui,sans-serif;
            white-space:nowrap;
          ">T${tier}</div>
          <div style="height:100%;filter:drop-shadow(0 4px 8px rgba(6,11,38,0.25))">
            ${svg.replace("<svg ", `<svg style=\"height:100%;width:auto\" `)}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html,
        className: "",
        iconSize: [ICON_W, ICON_H],
        iconAnchor: [ICON_W / 2, ICON_H - 2],
      });

      const marker = L.marker([p.lat, p.lng], { icon })
        .on("click", () => onSelectBuilding(p.id))
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (located.length > 0) {
      const bounds = L.latLngBounds(located.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 13 });
    }
  }

  return (
    <div ref={wrapRef} className="relative w-full h-full">
      <div ref={mapRef} className="absolute inset-0 bg-aon-pale" />

      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-aon-pale">
          <div className="text-aon-stone text-sm tracking-[0.2em] uppercase animate-pulse">
            Loading portfolio…
          </div>
        </div>
      )}

      {/* Layer toggles — top-left */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2">
        <span className="text-[10px] tracking-[0.25em] uppercase text-aon-stone bg-white/95 backdrop-blur px-3 py-1.5 rounded-sm border border-aon-fog/60">
          Layers
        </span>
        <button
          onClick={() => setLayers((s) => ({ ...s, wind: !s.wind }))}
          className={`text-xs px-3 py-1.5 rounded-sm border transition ${
            layers.wind
              ? "bg-aon-red text-white border-aon-red"
              : "bg-white/95 text-aon-graphite border-aon-fog/60 hover:border-aon-red"
          }`}
        >
          Wind
        </button>
        <button
          onClick={() => setLayers((s) => ({ ...s, flood: !s.flood }))}
          className={`text-xs px-3 py-1.5 rounded-sm border transition ${
            layers.flood
              ? "bg-aon-cyan text-white border-aon-cyan"
              : "bg-white/95 text-aon-graphite border-aon-fog/60 hover:border-aon-cyan"
          }`}
        >
          Flood
        </button>
      </div>

      {/* Tier legend — bottom-left */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur rounded-sm border border-aon-fog/60 px-4 py-3 shadow-sm">
        <div className="text-[10px] tracking-[0.25em] uppercase text-aon-stone mb-2">
          Risk Tier
        </div>
        {([1, 2, 3] as RiskTier[]).map((tier) => (
          <div key={tier} className="flex items-center gap-2 mb-1.5 last:mb-0">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white"
              style={{ background: TIER_COLORS[tier] }}
            />
            <span className="text-xs text-aon-graphite">
              {TIER_LABELS[tier]} — {TIER_DESCRIPTIONS[tier]}
            </span>
          </div>
        ))}
      </div>

      {/* Side panel — right */}
      <aside className="absolute top-0 right-0 bottom-0 w-[320px] z-[1000] bg-white border-l border-aon-fog/60 overflow-y-auto">
        <div className="p-6">
          <div className="text-[10px] tracking-[0.3em] uppercase text-aon-stone mb-4">
            Portfolio summary
          </div>

          <div className="grid grid-cols-2 gap-4 mb-7">
            <div>
              <div className="text-3xl font-medium tabular text-aon-ink leading-none">
                {properties.length}
              </div>
              <div className="text-[11px] text-aon-stone mt-1.5">Buildings</div>
            </div>
            <div>
              <div className="text-3xl font-medium tabular text-aon-ink leading-none">
                {analytics.totalUnits.toLocaleString()}
              </div>
              <div className="text-[11px] text-aon-stone mt-1.5">Units</div>
            </div>
          </div>

          <div className="text-[10px] tracking-[0.3em] uppercase text-aon-stone mb-3">
            Risk tier distribution
          </div>

          {([1, 2, 3] as RiskTier[]).map((tier) => {
            const count = analytics.tierCounts[tier];
            const pct =
              properties.length > 0 ? (count / properties.length) * 100 : 0;
            return (
              <div key={tier} className="mb-3.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: TIER_COLORS[tier] }}
                    />
                    <span className="text-xs text-aon-graphite">
                      {TIER_LABELS[tier]}
                    </span>
                  </div>
                  <span className="text-xs text-aon-ink font-semibold tabular">
                    {count} / {properties.length}
                  </span>
                </div>
                <div className="h-1 bg-aon-fog/40 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: TIER_COLORS[tier] }}
                  />
                </div>
                <div className="text-[10px] text-aon-stone mt-1">
                  {TIER_DESCRIPTIONS[tier]}
                </div>
              </div>
            );
          })}

          <div className="mt-6 pt-4 border-t border-aon-fog/60">
            <div className="text-[10px] tracking-[0.3em] uppercase text-aon-stone mb-2">
              Avg. distance to water
            </div>
            <div className="text-2xl font-medium tabular text-aon-navy leading-none">
              {analytics.avgDistance < 1000
                ? `${analytics.avgDistance} m`
                : `${(analytics.avgDistance / 1000).toFixed(2)} km`}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-aon-fog/60 text-[11px] text-aon-stone tracking-wide leading-relaxed">
            <span className="text-aon-red font-semibold">→</span> Click any
            building to see its full risk profile.
          </div>
        </div>
      </aside>
    </div>
  );
}
