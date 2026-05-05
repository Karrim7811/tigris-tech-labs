"use client";

import { useRef, useEffect, useState } from "react";
import Map, {
  Layer,
  Marker,
  AttributionControl,
  NavigationControl,
  type MapRef,
} from "react-map-gl/mapbox";
import type { FillExtrusionLayerSpecification } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Building, TIER_COLORS, RiskTier } from "@/data/portfolio";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/** 3D buildings layer config — uses Mapbox's composite source which has
 *  global building footprint data with real heights. */
const buildingsLayer: FillExtrusionLayerSpecification = {
  id: "3d-buildings",
  source: "composite",
  "source-layer": "building",
  filter: ["==", ["get", "extrude"], "true"],
  type: "fill-extrusion",
  minzoom: 13,
  paint: {
    "fill-extrusion-color": [
      "interpolate",
      ["linear"],
      ["get", "height"],
      0,
      "#e7ecf2",
      40,
      "#d6dde6",
      120,
      "#c7d0db",
      250,
      "#b8c3d0",
    ],
    "fill-extrusion-height": [
      "interpolate",
      ["linear"],
      ["zoom"],
      13,
      0,
      13.6,
      ["get", "height"],
    ],
    "fill-extrusion-base": [
      "interpolate",
      ["linear"],
      ["zoom"],
      13,
      0,
      13.6,
      ["get", "min_height"],
    ],
    "fill-extrusion-opacity": 0.95,
  },
};

interface Props {
  properties: Building[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export default function MapboxPortfolioMap({
  properties,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Fly to hovered/selected building
  useEffect(() => {
    const target = selectedId || hoveredId;
    if (!target || !mapRef.current) return;
    const p = properties.find((x) => x.id === target);
    if (!p) return;
    mapRef.current.flyTo({
      center: [p.lng, p.lat],
      zoom: 16,
      pitch: 62,
      duration: 1100,
      essential: true,
    });
  }, [selectedId, hoveredId, properties]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-aon-pale px-8">
        <div className="max-w-md text-center">
          <div className="text-aon-red text-[10px] font-semibold tracking-[0.3em] uppercase mb-2">
            Map unavailable
          </div>
          <div className="text-aon-ink text-sm font-medium mb-1">
            NEXT_PUBLIC_MAPBOX_TOKEN is not set
          </div>
          <div className="text-aon-stone text-xs leading-relaxed">
            Add it to <code className="font-mono">.env.local</code> and restart{" "}
            <code className="font-mono">next dev</code>, or set it in Vercel
            project settings and redeploy.
          </div>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-aon-pale px-8">
        <div className="max-w-md text-center">
          <div className="text-aon-red text-[10px] font-semibold tracking-[0.3em] uppercase mb-2">
            Mapbox rejected the request
          </div>
          <div className="text-aon-ink text-sm font-medium mb-1">
            The token is set, but Mapbox returned an error.
          </div>
          <div className="text-aon-stone text-xs leading-relaxed mb-2">
            Check the token is valid, not expired, and that this domain is
            allowed in the token's URL restrictions.
          </div>
          <div className="text-aon-stone text-[11px] font-mono break-words">
            {mapError}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: -80.188,
        latitude: 25.768,
        zoom: 15.2,
        pitch: 64,
        bearing: -28,
      }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      attributionControl={false}
      reuseMaps
      onError={(e) => {
        const msg = e?.error?.message ?? "Unknown Mapbox error";
        setMapError(msg);
      }}
      style={{ width: "100%", height: "100%" }}
    >
      <Layer {...buildingsLayer} />
      <NavigationControl position="bottom-right" visualizePitch showCompass />
      <AttributionControl
        position="bottom-left"
        compact
        customAttribution="© Mapbox · © OpenStreetMap"
      />

      {properties.map((p) => {
        const isActive = selectedId === p.id || hoveredId === p.id;
        return (
          <Marker
            key={p.id}
            longitude={p.lng}
            latitude={p.lat}
            anchor="bottom"
            style={{ zIndex: isActive ? 20 : 10 }}
          >
            <BuildingPin
              tier={p.risk.overall_tier}
              label={p.location_name}
              stories={p.illustration.stories}
              active={isActive}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(p.id);
              }}
              onMouseEnter={() => onHover(p.id)}
              onMouseLeave={() => onHover(null)}
            />
          </Marker>
        );
      })}
    </Map>
  );
}

function BuildingPin({
  tier,
  label,
  stories,
  active,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  tier: RiskTier;
  label: string;
  stories: number;
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const color = TIER_COLORS[tier];
  const beamH = 56 + Math.min(stories * 1.4, 80);

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "relative",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: beamH + 36,
        userSelect: "none",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Floating badge */}
      <div
        style={{
          position: "relative",
          padding: active ? "5px 14px" : "4px 11px",
          background: color,
          color: "white",
          fontSize: active ? 13 : 11,
          fontWeight: 600,
          letterSpacing: "0.03em",
          borderRadius: 4,
          boxShadow: active
            ? `0 6px 20px ${color}66, 0 0 0 2px white, 0 1px 0 rgba(255,255,255,0.4) inset`
            : "0 4px 12px rgba(6,11,38,0.3), 0 1px 0 rgba(255,255,255,0.4) inset",
          whiteSpace: "nowrap",
          transition: "all 160ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {label}
        <div
          style={{
            position: "absolute",
            bottom: -5,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: `5px solid ${color}`,
          }}
        />
      </div>

      {/* Vertical beam */}
      <div
        style={{
          width: active ? 3 : 2,
          flex: 1,
          background: `linear-gradient(to bottom, ${color}, ${color}AA, ${color}33)`,
          marginTop: 6,
          transition: "width 160ms ease",
          boxShadow: active ? `0 0 8px ${color}80` : "none",
        }}
      />

      {/* Pulse ring */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: color,
          opacity: 0.35,
          transform: "translateX(-50%)",
          animation: "marker-pulse 2.2s cubic-bezier(0.4,0,0.6,1) infinite",
          pointerEvents: "none",
        }}
      />

      {/* Ground dot */}
      <div
        style={{
          width: active ? 16 : 13,
          height: active ? 16 : 13,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 0 3px white, 0 4px 10px rgba(6,11,38,0.4)`,
          flexShrink: 0,
          transition: "all 160ms ease",
          position: "relative",
          zIndex: 1,
        }}
      />
    </div>
  );
}
