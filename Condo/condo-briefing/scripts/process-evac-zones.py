"""
Page through Miami-Dade Hurricane Evacuation Zone FeatureServer (2,147 features),
dissolve by surge category, simplify, and write a compact GeoJSON used by
SlideStormHistory.

Run:
    python scripts/process-evac-zones.py
Writes:
    src/data/noaa/surge-zones.json
"""
from __future__ import annotations
import json, urllib.request, urllib.parse
from pathlib import Path
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data" / "noaa" / "surge-zones.json"

SERVICE = (
    "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/"
    "HurricaneEvacZone_gdb/FeatureServer/0/query"
)
PAGE_SIZE = 2000
TOTAL = 2147

# Tiny but lossless-enough simplification (degrees). ~30m at Miami latitude.
SIMPLIFY_TOLERANCE = 0.0003
COORD_PRECISION = 4  # decimal places — ~11m accuracy


def fetch_page(offset: int) -> dict:
    params = {
        "where": "1=1",
        "outFields": "CATEGORY",
        "f": "geojson",
        "outSR": "4326",
        "resultOffset": str(offset),
        "resultRecordCount": str(PAGE_SIZE),
    }
    url = SERVICE + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=60) as r:
        return json.loads(r.read())


def round_coords(geom, n=COORD_PRECISION):
    """Recursively round coordinates of a GeoJSON geometry to n decimals."""
    def r(v):
        if isinstance(v, (int, float)):
            return round(v, n)
        return [r(x) for x in v]
    geom["coordinates"] = r(geom["coordinates"])
    return geom


def main() -> None:
    print(f"Fetching {TOTAL} features in pages of {PAGE_SIZE}...")
    all_features = []
    for offset in range(0, TOTAL, PAGE_SIZE):
        page = fetch_page(offset)
        all_features.extend(page.get("features", []))
        print(f"  offset={offset}: +{len(page.get('features', []))} -> {len(all_features)}")

    # Group by surge category (1=worst, evacuates first; 5=Cat-5 only)
    by_cat: dict[int, list] = {}
    for f in all_features:
        cat = f["properties"].get("CATEGORY")
        if cat is None:
            continue
        try:
            cat = int(cat)
        except (TypeError, ValueError):
            continue
        if cat < 1 or cat > 5:
            continue
        try:
            geom = shape(f["geometry"])
            if not geom.is_valid:
                geom = geom.buffer(0)
            by_cat.setdefault(cat, []).append(geom)
        except Exception as e:
            print(f"  skip feature: {e}")

    # Dissolve + simplify each category
    print("\nDissolving + simplifying per category...")
    out_features = []
    for cat in sorted(by_cat):
        merged = unary_union(by_cat[cat])
        merged = merged.simplify(SIMPLIFY_TOLERANCE, preserve_topology=True)
        geom = round_coords(mapping(merged))
        out_features.append({
            "type": "Feature",
            "properties": {
                "category": cat,
                "label": f"Zone {chr(64+cat)}",  # 1->A, 2->B, ...
                "trigger": f"Cat {cat}+ surge",
            },
            "geometry": geom,
        })
        print(f"  cat {cat}: source polygons={len(by_cat[cat])}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {"type": "FeatureCollection", "features": out_features},
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )
    print(f"\nWrote {OUT}  ({OUT.stat().st_size/1024:.1f} KB)")


if __name__ == "__main__":
    main()
