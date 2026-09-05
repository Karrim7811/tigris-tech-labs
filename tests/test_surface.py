from pathlib import Path

import build
from conftest import goto, open_page, probe

ROOT = Path(__file__).resolve().parents[1]
FX8 = ROOT / "tests" / "fixtures" / "products_8.json"
FXS = ROOT / "tests" / "fixtures" / "products_status.json"


def test_render_surface_rows_lists_all_when_under_cap():
    html = build.render_surface_rows(build.load_products(ROOT / "products.json"))
    assert html.count("data-bore=") == 4 and "data-open-index" not in html
    assert "CANAL 01" in html and "Peptide research" in html


def test_render_surface_rows_caps_at_six_and_offers_all():
    html = build.render_surface_rows(build.load_products(FX8))
    assert html.count('data-bore="') == 6
    assert "All 8 canals" in html and "data-open-index" in html


def test_surface_shows_the_whole_directory_without_scrolling(browser, site):
    """Once the overture has resolved at 0 m, the surface holds the wordmark,
    the paragraph, every canal row, the contact line and the cue in one screen."""
    page = open_page(browser, site(), 1280, 800)
    goto(page, 0)
    page.wait_for_timeout(300)
    assert page.errors == []
    for sel in [
        '[data-surface-rows] [data-bore="cortex"]',
        '[data-surface-rows] [data-bore="vitreon"]',
        "[data-surface-contact]",
        "[data-cue]",
    ]:
        box = page.locator(sel).first.bounding_box()
        assert box and 0 <= box["y"] and box["y"] + box["height"] <= 800, sel


def test_surface_row_opens_the_products_bore_panel(browser, site):
    page = open_page(browser, site())
    goto(page, 0)
    page.evaluate(
        """() => document.querySelector('[data-surface-rows] [data-bore="praix"]')
        .dispatchEvent(new MouseEvent('click', {bubbles: true}))"""
    )
    page.wait_for_timeout(500)
    assert probe(page, "a.boreOpen") == "praix"
    assert page.locator('[data-panel="praix"]').evaluate("el => getComputedStyle(el).display") == "flex"


def test_render_index_panel_lists_every_product():
    html = build.render_index_panel(build.load_products(FX8))
    assert 'data-panel="index"' in html
    assert html.count("data-index-row") == 8
    assert "Lead eight." in html and 'href="https://five.example"' in html


def test_all_canals_row_opens_index_overlay(browser, site):
    page = open_page(browser, site(FX8))
    goto(page, 0)
    page.evaluate(
        """() => document.querySelector('[data-open-index]')
        .dispatchEvent(new MouseEvent('click', {bubbles: true}))"""
    )
    page.wait_for_timeout(500)
    assert probe(page, "a.boreOpen") == "index"
    assert page.locator('[data-panel="index"] [data-index-row]').count() == 8
    page.keyboard.press("Escape")
    page.wait_for_timeout(300)
    assert probe(page, "a.boreOpen") is None


def test_status_renders_glyph_and_word_only_where_set(browser, site):
    page = open_page(browser, site(FXS))
    goto(page, 0)
    rows = page.locator("[data-surface-rows] [data-bore]")
    assert rows.locator('[data-status="live"]').count() == 1
    assert rows.locator('[data-status="building"]').count() == 1
    assert rows.locator("[data-status]").count() == 2
    praix = page.locator('[data-surface-rows] [data-bore="praix"]').inner_text()
    assert "LIVE · INVITATION" in praix.upper()
    assert "LIVE" not in page.locator('[data-surface-rows] [data-bore="cortex"]').inner_text().upper()
    assert page.locator('[data-id="rows"] [data-bore="praix"] [data-status="live"]').count() == 1


def test_screen_image_only_where_provided(browser, site):
    page = open_page(browser, site(FXS))
    goto(page, 0)
    assert page.locator('[data-panel="praix"] img').count() == 1
    assert page.locator('[data-panel="alevant"] img').count() == 0
    assert page.locator('[data-panel="praix"] img').get_attribute("src") == "assets/praix-screen.png"


def test_default_products_have_no_status_markup(browser, site):
    page = open_page(browser, site())
    goto(page, 0)
    assert page.locator("[data-status]").count() == 0
