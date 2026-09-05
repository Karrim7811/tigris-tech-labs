import json
import re
import subprocess
import sys
from pathlib import Path

import build

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS = ROOT / "products.json"
TEMPLATE = ROOT / "index.template.html"


def test_load_products_sorted_by_canal(tmp_path):
    p = tmp_path / "p.json"
    blank = {"panel": {"intro": "", "data": "", "language": "", "liability": ""}}
    p.write_text(
        json.dumps(
            [
                {"id": "b", "canal": 2, "name": "B", "industry": "x", "colour": "#000", "colour_dark": "#fff", "lead": "", **blank},
                {"id": "a", "canal": 1, "name": "A", "industry": "y", "colour": "#000", "colour_dark": "#fff", "lead": "", **blank},
            ]
        ),
        encoding="utf-8",
    )
    assert [x["id"] for x in build.load_products(p)] == ["a", "b"]


def test_deep_rows_carry_canal_number_name_industry_lead():
    html = build.render_deep_rows(build.load_products(PRODUCTS))
    products = build.load_products(PRODUCTS)
    for pr in products:
        assert f'data-bore="{pr["id"]}"' in html, pr["id"]
        assert f'CANAL {pr["canal"]:02d}' in html, pr["id"]
        assert pr["name"] in html and pr["industry"] in html and pr["lead"] in html
    assert "data-row" in html
    assert html.rstrip().endswith("</div>")
    last = products[-1]["id"]
    assert "border-bottom:1px solid" in html.split(f'data-bore="{last}"')[1], "last row needs the closing rule"


def test_panels_one_per_product_with_three_cells_and_link():
    """Order lives in products.json, so this asserts per product, not by position."""
    products = build.load_products(PRODUCTS)
    html = build.render_panels(products)
    assert html.count("data-panel=") == len(products)
    for pr in products:
        chunk = html.split(f'data-panel="{pr["id"]}"')[1].split("data-panel=")[0]
        for cell in ("Data", "Language", "Liability"):
            assert f">{cell}</div>" in chunk, (pr["id"], cell)
        if pr["url"]:
            assert f'href="{pr["url"]}"' in chunk, pr["id"]
        else:
            assert "href=" not in chunk, f'{pr["id"]} has no url but rendered a link'


def test_noscript_lists_every_product_with_its_canal_number():
    products = build.load_products(PRODUCTS)
    html = build.render_noscript(products)
    for pr in products:
        assert pr["name"] in html, pr["name"]
        assert f'CANAL {pr["canal"]:02d} · {pr["industry"].upper()}' in html, pr["id"]


def test_products_js_is_valid_json_array_in_a_const():
    html = build.render_products_js(build.load_products(PRODUCTS))
    m = re.match(r"const PRODUCTS=(\[.*\]);$", html.strip(), re.S)
    assert m, html[:80]
    arr = json.loads(m.group(1))
    expected = [x["id"] for x in build.load_products(PRODUCTS)]
    assert [x["id"] for x in arr] == expected
    assert [x["canal"] for x in arr] == sorted(x["canal"] for x in arr), "must be canal order"


def test_build_fills_every_marker_and_is_idempotent():
    out = build.build(PRODUCTS, TEMPLATE)
    for marker in build.MARKERS.values():
        assert marker not in out, marker
    assert "@@" not in out
    assert out == build.build(PRODUCTS, TEMPLATE)


def test_committed_index_matches_fresh_build():
    assert (ROOT / "index.html").read_text(encoding="utf-8") == build.build(PRODUCTS, TEMPLATE)


def test_verify_passes_on_committed_site():
    r = subprocess.run([sys.executable, "tools/verify.py"], cwd=ROOT, capture_output=True, text=True)
    assert r.returncode == 0, r.stdout + r.stderr


def test_verify_fails_on_drift(tmp_path):
    drift = (ROOT / "index.html").read_text(encoding="utf-8").replace("Tigris Tech Labs", "Tigris Tech Lab", 1)
    p = tmp_path / "index.html"
    p.write_text(drift, encoding="utf-8")
    r = subprocess.run(
        [sys.executable, "tools/verify.py", "--index", str(p), "--no-browser"], cwd=ROOT, capture_output=True, text=True
    )
    assert r.returncode == 1 and "out of date" in r.stdout
