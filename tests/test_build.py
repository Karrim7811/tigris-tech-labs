import json
import re
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
    assert 'data-bore="praix"' in html and "CANAL 03" in html
    assert "PRAIX" in html and "Commercial insurance" in html
    assert "finds the right prospects" in html
    assert "data-row" in html
    assert html.rstrip().endswith("</div>")
    assert "border-bottom:1px solid" in html.split('data-bore="vitreon"')[1]


def test_panels_one_per_product_with_three_cells_and_link():
    html = build.render_panels(build.load_products(PRODUCTS))
    assert html.count("data-panel=") == 4
    praix = html.split('data-panel="praix"')[1].split("data-panel=")[0]
    for cell in ("Data", "Language", "Liability"):
        assert f">{cell}</div>" in praix
    assert 'href="https://praix.ai"' in praix
    vitreon = html.split('data-panel="vitreon"')[1]
    assert "href=" not in vitreon  # no url -> no link


def test_noscript_lists_every_product_and_email():
    html = build.render_noscript(build.load_products(PRODUCTS))
    for name in ("Cortex", "Alevant", "PRAIX", "Vitreon"):
        assert name in html
    assert "CANAL 04 · LOCAL BUSINESS" in html


def test_products_js_is_valid_json_array_in_a_const():
    html = build.render_products_js(build.load_products(PRODUCTS))
    m = re.match(r"const PRODUCTS=(\[.*\]);$", html.strip(), re.S)
    assert m, html[:80]
    arr = json.loads(m.group(1))
    assert [x["id"] for x in arr] == ["cortex", "alevant", "praix", "vitreon"]


def test_build_fills_every_marker_and_is_idempotent():
    out = build.build(PRODUCTS, TEMPLATE)
    for marker in build.MARKERS.values():
        assert marker not in out, marker
    assert "@@" not in out
    assert out == build.build(PRODUCTS, TEMPLATE)


def test_committed_index_matches_fresh_build():
    assert (ROOT / "index.html").read_text(encoding="utf-8") == build.build(PRODUCTS, TEMPLATE)
