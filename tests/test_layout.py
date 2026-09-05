import re
import subprocess
from pathlib import Path

from conftest import open_page, probe

ROOT = Path(__file__).resolve().parents[1]
ORDER = [
    "company",
    "learn-data",
    "learn-language",
    "learn-liability",
    "thesis",
    "change",
    "products",
    "rows",
    "river",
    "holding",
    "founder",
    "name",
    "end",
]


def _tmpl():
    return (ROOT / "index.template.html").read_text(encoding="utf-8")


def test_strata_order_matches_spec():
    ids = re.findall(r'data-stratum data-id="([^"]+)"', _tmpl())
    assert ids == ["surface"] + ORDER


def test_name_story_is_verbatim_from_master():
    master = subprocess.check_output(["git", "show", "master:index.html"], cwd=ROOT).decode("utf-8")
    for needle in (
        "The Tigris and the Euphrates made this plain fertile enough to be worth arguing over. Out of the argument came the first writing — not poetry: counts of grain, terms of trade, obligations that outlived the people who made them.",
        "Accounting, contracts and written law were all cut into wet clay within sight of this water, and are still legible four thousand years later. That is the standard a record is held to.",
    ):
        assert needle in master, "needle not in master — test is wrong"
        assert needle in _tmpl(), needle[:50]


def test_data_language_liability_verbatim():
    t = _tmpl()
    for needle in (
        "Not a benchmark set. The messy, partial, contradictory record an industry actually keeps — and the reasons it keeps it that way.",
        "Every trade has a private vocabulary where one word carries a decade of precedent. Get it wrong and the product is instantly recognisable as an outsider.",
        "Who signs. Who is exposed when the answer is wrong. This is the constraint that decides whether software is adopted or merely admired.",
    ):
        assert needle in t


def test_no_silt_stratum_and_no_count_words():
    t = _tmpl()
    assert 'data-id="silt"' not in t
    assert "Four products" not in t and "four cuts" not in t
    assert "Four canals" not in t
    assert "CANAL 0" not in t  # rows are generated


def test_rail_uses_literal_words_and_block_ids():
    t = _tmpl()
    for lbl in (
        "Surface",
        "The company",
        "What we learn",
        "Thesis",
        "The products",
        "The river",
        "Holding company",
        "The founder",
        "The name",
        "First record",
    ):
        assert f">{lbl}</div>" in t, lbl
    for word in ("Silt", "Confluence", "Constraints", "Philosophy", "The canals"):
        assert f">{word}</div>" not in t, word
    assert t.count("data-goto-block=") >= 10


def _rects(page):
    return probe(page, "a.strataEls.map(e => [e.dataset.id, e._top, e._bot])")


def _assert_no_overlap(rects):
    rs = sorted(rects, key=lambda r: r[1])
    for (ida, ta, ba), (idb, tb, bb) in zip(rs, rs[1:]):
        assert ba <= tb, f"{ida} ({ta}-{ba}) overlaps {idb} ({tb}-{bb})"


def test_sections_in_order_never_overlap_at_three_viewports(browser, site):
    url = site()
    for w, h in ((1280, 800), (1440, 900), (1920, 1080)):
        page = open_page(browser, url, w, h)
        rects = _rects(page)
        assert [r[0] for r in rects] == ["surface"] + ORDER
        _assert_no_overlap(rects)
        assert page.errors == [], page.errors
        page.close()


def test_depth_labels_are_written_from_layout(browser, site):
    page = open_page(browser, site())
    labels = page.evaluate("() => [...document.querySelectorAll('[data-depth-label]')].map(e => e.textContent)")
    assert all(re.match(r"^\d{4} m — ", t) for t in labels), labels
    company_top = probe(page, "a.blockById('company')._top")
    assert labels[0].startswith(f"{round(company_top):04d} m — the company")


def test_adding_products_pushes_everything_below_the_rows(browser, site):
    four = open_page(browser, site())
    eight = open_page(browser, site(ROOT / "tests/fixtures/products_8.json"))
    r4 = {r[0]: r for r in _rects(four)}
    r8 = {r[0]: r for r in _rects(eight)}
    assert r8["rows"][2] - r8["rows"][1] > r4["rows"][2] - r4["rows"][1] + 300
    for sid in ("river", "holding", "founder", "name", "end"):
        assert r8[sid][1] > r4[sid][1] + 300, sid
    _assert_no_overlap(list(r8.values()))
    assert probe(eight, "a.maxD") > probe(four, "a.maxD") + 300
    assert probe(eight, "parseFloat(a.shaftRef.current.style.height)") > probe(eight, "a.blockById('end')._bot")


def test_hud_strata_follow_layout(browser, site):
    page = open_page(browser, site())
    names = probe(page, "STRATA.map(s => s.n)")
    assert names[:2] == ["SURFACE", "THE COMPANY"] and "THE RIVER" in names and "THE FOUNDER" in names
    assert "SILT" not in names and "PHILOSOPHY" not in names
    river_top = probe(page, "a.blockById('river')._top")
    assert probe(page, "STRATA.find(s => s.n === 'THE RIVER').d") == river_top


def test_rail_click_lands_on_its_block(browser, site):
    page = open_page(browser, site())
    page.evaluate(
        """() => document.querySelector('[data-goto-block="founder"]')
        .dispatchEvent(new MouseEvent('click', {bubbles: true}))"""
    )
    page.wait_for_timeout(1500)
    mid = probe(page, "a.blockById('founder')._mid")
    assert abs(probe(page, "a.depth") - mid) < 30


def test_no_overture_first_paint_is_the_surface(browser, site):
    page = open_page(browser, site(), 1280, 800)
    assert probe(page, "a.minD") == 0 and probe(page, "a.depth") == 0
    assert page.locator('[data-ref="hudDepthRef"]').inner_text().startswith("DEPTH 0000")
    slot = page.locator("[data-markslot]").bounding_box()
    logo = page.locator('[data-ref="logoRef"]').bounding_box()
    assert abs((slot["x"] + slot["width"] / 2) - (logo["x"] + logo["width"] / 2)) < 40
    assert float(page.locator('[data-ref="eyebrowRef"]').evaluate("el => getComputedStyle(el).opacity")) == 0
    op = float(page.locator('[data-stratum][data-id="surface"]').evaluate("el => getComputedStyle(el).opacity"))
    assert op > 0.9


def test_mobile_390_loads_without_errors_and_rows_stack(browser, site):
    page = open_page(browser, site(), 390, 844)
    assert page.errors == []
    row = page.locator('[data-surface-rows] [data-bore="cortex"]')
    assert row.bounding_box()["width"] <= 390
    _assert_no_overlap(_rects(page))


def test_reduced_motion_path_lands_at_surface(browser, site):
    ctx = browser.new_context(viewport={"width": 1280, "height": 800}, reduced_motion="reduce")
    page = ctx.new_page()
    page.goto(site())
    page.wait_for_function("() => window.__tigris && window.__tigris.strataEls")
    page.wait_for_timeout(500)
    assert page.evaluate("window.__tigris.depth") == 0
    ctx.close()
