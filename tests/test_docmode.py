from conftest import goto, open_page, probe
from test_layout import ORDER


def test_read_as_one_page_shows_every_section_once_in_order(browser, site):
    page = open_page(browser, site())
    goto(page, 1500)
    page.click("[data-hud-doc]")
    page.wait_for_timeout(500)
    assert page.evaluate("document.body.dataset.mode") == "doc"
    ids = page.evaluate("() => [...document.querySelectorAll('#doc [data-stratum]')].map(e => e.dataset.id)")
    assert ids == ["surface"] + ORDER
    assert page.locator("#doc [data-stratum]").count() == len(ORDER) + 1
    assert page.locator("#doc [data-doc-product]").count() == 4
    assert page.locator('#doc [data-doc-product="praix"] td').count() >= 3
    assert page.locator('[data-ref="rootRef"]').evaluate("el => getComputedStyle(el).display") == "none"
    assert page.evaluate("document.body.scrollHeight") > 3000


def test_toggle_back_restores_section_mode_at_same_depth(browser, site):
    page = open_page(browser, site())
    goto(page, 2200)
    d0 = probe(page, "a.depth")
    page.keyboard.press("d")
    page.wait_for_timeout(400)
    assert page.evaluate("document.body.dataset.mode") == "doc"
    page.keyboard.press("d")
    page.wait_for_timeout(600)
    assert page.evaluate("document.body.dataset.mode") == "section"
    assert abs(probe(page, "a.depth") - d0) < 5
    assert page.locator("#doc [data-stratum]").count() == 0
    assert probe(page, "a.strataEls.every(e => e.parentNode === a.shaftRef.current)")
    assert page.errors == []


def test_products_up_returns_to_the_surface_rows(browser, site):
    page = open_page(browser, site())
    goto(page, 4000)
    page.click("[data-hud-products]")
    page.wait_for_timeout(1600)
    assert probe(page, "a.depth") < 20
