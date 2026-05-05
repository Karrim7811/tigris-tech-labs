"""
Parse NOAA HURDAT2 best-track file → compact JSON of storms passing
within MIAMI_RADIUS_KM of Miami-Dade (centered on Brickell), 1950→present.

Run:
    python scripts/process-hurdat2.py
Writes:
    src/data/noaa/storms.json  (used by SlideStormHistory)
"""
from __future__ import annotations
import json, math, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "data" / "noaa" / "hurdat2.txt"
OUT = ROOT / "src" / "data" / "noaa" / "storms.json"

# Miami-Dade reference point (Brickell core) and inclusion radius.
MIAMI_LAT, MIAMI_LON = 25.768, -80.188
RADIUS_KM = 250  # ~155 miles — captures landfall + close passes
START_YEAR = 1950


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def parse_lat(s: str) -> float:
    s = s.strip()
    v = float(s[:-1])
    return v if s[-1] == "N" else -v


def parse_lon(s: str) -> float:
    s = s.strip()
    v = float(s[:-1])
    return v if s[-1] == "E" else -v


def saffir_simpson(wind_kts: int) -> int:
    """0=TS/TD, 1..5 = hurricane category. -1 if unknown."""
    if wind_kts is None or wind_kts < 0:
        return -1
    if wind_kts < 64:
        return 0
    if wind_kts < 83:
        return 1
    if wind_kts < 96:
        return 2
    if wind_kts < 113:
        return 3
    if wind_kts < 137:
        return 4
    return 5


def main() -> None:
    text = SRC.read_text(encoding="utf-8", errors="ignore")
    lines = [ln.rstrip() for ln in text.splitlines() if ln.strip()]

    storms = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Header line: "AL011851, UNNAMED, 14,"
        if re.match(r"^[A-Z]{2}\d{6},", line):
            parts = [p.strip() for p in line.split(",")]
            storm_id = parts[0]
            name = parts[1] or "UNNAMED"
            n_records = int(parts[2])
            year = int(storm_id[-4:])
            i += 1
            track = []
            for _ in range(n_records):
                dl = lines[i]
                i += 1
                f = [p.strip() for p in dl.split(",")]
                date = f[0]            # YYYYMMDD
                time = f[1]            # HHMM
                status = f[3]          # HU / TS / TD / EX / ...
                lat = parse_lat(f[4])
                lon = parse_lon(f[5])
                wind = int(f[6]) if f[6] not in ("", "-999") else -1
                pressure = int(f[7]) if f[7] not in ("", "-999") else -1
                track.append({
                    "d": date, "t": time, "s": status,
                    "lat": lat, "lon": lon, "w": wind, "p": pressure,
                })

            if year < START_YEAR:
                continue

            # Filter: did any track point pass within RADIUS_KM of Miami?
            min_dist_km = min(
                haversine_km(MIAMI_LAT, MIAMI_LON, pt["lat"], pt["lon"])
                for pt in track
            )
            if min_dist_km > RADIUS_KM:
                continue

            # Peak intensity over the storm's life
            peak_wind = max((pt["w"] for pt in track if pt["w"] > 0), default=-1)
            peak_cat = saffir_simpson(peak_wind)

            # Closest approach point
            closest = min(
                track,
                key=lambda pt: haversine_km(MIAMI_LAT, MIAMI_LON, pt["lat"], pt["lon"]),
            )
            closest_dist_km = haversine_km(MIAMI_LAT, MIAMI_LON, closest["lat"], closest["lon"])

            # Compact track: trim to points within ~600km of Miami
            # to keep payload small while preserving the visual approach
            compact = [
                [pt["lat"], pt["lon"], pt["w"], saffir_simpson(pt["w"])]
                for pt in track
                if haversine_km(MIAMI_LAT, MIAMI_LON, pt["lat"], pt["lon"]) < 600
            ]
            if not compact:
                continue

            storms.append({
                "id": storm_id,
                "name": name,
                "year": year,
                "peakWind": peak_wind,
                "peakCat": peak_cat,
                "closestKm": round(closest_dist_km, 1),
                "track": compact,
            })
        else:
            i += 1

    storms.sort(key=lambda s: (s["year"], s["id"]))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({
            "miamiLat": MIAMI_LAT,
            "miamiLon": MIAMI_LON,
            "radiusKm": RADIUS_KM,
            "startYear": START_YEAR,
            "endYear": max(s["year"] for s in storms),
            "count": len(storms),
            "storms": storms,
        }, separators=(",", ":")),
        encoding="utf-8",
    )

    # Brief stdout summary
    by_cat = {}
    for s in storms:
        by_cat[s["peakCat"]] = by_cat.get(s["peakCat"], 0) + 1
    print(f"Wrote {len(storms)} storms ({START_YEAR}-{max(s['year'] for s in storms)}) -> {OUT}")
    print(f"  By peak category: {dict(sorted(by_cat.items()))}")
    print(f"  File size: {OUT.stat().st_size/1024:.1f} KB")


if __name__ == "__main__":
    main()
