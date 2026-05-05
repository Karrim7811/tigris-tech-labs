/**
 * Shared geometry + ensemble for the Predictive AI Layer slide.
 * Box covers the South Florida watch area (Tampa → Keys, Gulf coast → Atlantic).
 */

export const SOFL_BOX = {
  latMin: 24.5,
  latMax: 27.5,
  lonMin: -82.5,
  lonMax: -80.0,
};

/**
 * Eight illustrative ensemble approach tracks — one from every major angle
 * around South Florida. Each is a simplified path of [lon, lat] points
 * starting outside the box and ending inside it. Replace with real Aon
 * Impact Forecasting ensemble paths when available.
 */
export interface ApproachTrack {
  id: string;
  /** Compass approach direction relative to South Florida. */
  bearing: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
  /** Producer-friendly analog name. */
  analog: string;
  path: [number, number][];
}

export const ENSEMBLE_TRACKS: ApproachTrack[] = [
  {
    id: "ne-bermuda",
    bearing: "NE",
    analog: "Bermuda recurve",
    path: [
      [-72, 32],
      [-73, 31],
      [-74.5, 30],
      [-76, 29],
      [-77.5, 28],
      [-79, 27],
      [-80, 26],
      [-80.6, 25.5],
    ],
  },
  {
    id: "e-direct",
    bearing: "E",
    analog: "Bahamas direct",
    path: [
      [-74, 25.5],
      [-75, 25.6],
      [-76, 25.6],
      [-77, 25.7],
      [-78, 25.7],
      [-79, 25.7],
      [-80.2, 25.8],
      [-80.6, 25.85],
    ],
  },
  {
    id: "se-helene",
    bearing: "SE",
    analog: "Helene-analog",
    path: [
      [-75, 19],
      [-76, 20.5],
      [-77, 21.5],
      [-78, 22.5],
      [-79, 23.5],
      [-79.7, 24.3],
      [-80.2, 25],
      [-80.5, 25.6],
    ],
  },
  {
    id: "s-cuba",
    bearing: "S",
    analog: "Cuba straight-north",
    path: [
      [-81, 21],
      [-81, 22],
      [-81, 23],
      [-81.1, 24],
      [-81.2, 25],
      [-81.3, 26],
      [-81.4, 26.8],
    ],
  },
  {
    id: "sw-yucatan",
    bearing: "SW",
    analog: "Yucatan / Wilma",
    path: [
      [-87, 21],
      [-86, 22],
      [-85, 23],
      [-84, 23.7],
      [-83, 24.4],
      [-82, 25],
      [-81.3, 25.5],
      [-80.8, 25.9],
    ],
  },
  {
    id: "w-gulf",
    bearing: "W",
    analog: "Gulf direct",
    path: [
      [-90, 26],
      [-88.5, 26.2],
      [-87, 26.3],
      [-85.5, 26.4],
      [-84, 26.5],
      [-82.5, 26.5],
      [-81, 26.5],
      [-80.5, 26.4],
    ],
  },
  {
    id: "nw-recurve",
    bearing: "NW",
    analog: "Northern Gulf recurve",
    path: [
      [-90, 30],
      [-88, 29.5],
      [-86, 28.5],
      [-84.5, 27.8],
      [-83, 27.3],
      [-82, 27],
      [-81.2, 26.5],
    ],
  },
  {
    id: "n-retrograde",
    bearing: "N",
    analog: "Retrograde / rare",
    path: [
      [-81, 31],
      [-81, 30],
      [-81, 29],
      [-81, 28.2],
      [-81, 27.5],
      [-81.1, 26.8],
      [-81.2, 26.2],
    ],
  },
];

export type ModelId =
  | "historical"
  | "csu"
  | "noaa"
  | "weatherco"
  | "aon"
  | "predictive";

/**
 * Each model gets a different subset of tracks, reflecting how that model
 * weights approach climatology. The Predictive AI Layer (synthesis) shows
 * the broadest envelope — every direction — because climate-warmed SSTs
 * support storms forming and recurving from non-traditional angles.
 */
export const TRACK_IDS_BY_MODEL: Record<ModelId, string[]> = {
  historical: [
    "se-helene",
    "e-direct",
    "s-cuba",
    "sw-yucatan",
    "ne-bermuda",
    "w-gulf",
    "nw-recurve",
    "n-retrograde",
  ],
  csu: ["se-helene", "e-direct", "s-cuba", "sw-yucatan", "ne-bermuda"],
  noaa: ["se-helene", "e-direct", "s-cuba", "sw-yucatan", "w-gulf"],
  // Weather Co. forecasts a slightly below-average season — fewer ensemble paths.
  weatherco: ["se-helene", "e-direct", "s-cuba", "ne-bermuda"],
  aon: [], // pending — no tracks shown
  predictive: [
    "se-helene",
    "e-direct",
    "s-cuba",
    "sw-yucatan",
    "ne-bermuda",
    "w-gulf",
    "nw-recurve",
    "n-retrograde",
  ],
};

export function isInBox(lat: number, lon: number) {
  return (
    lat >= SOFL_BOX.latMin &&
    lat <= SOFL_BOX.latMax &&
    lon >= SOFL_BOX.lonMin &&
    lon <= SOFL_BOX.lonMax
  );
}
