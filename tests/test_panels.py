"""A product panel is a place you can leave the way you expect to."""
from conftest import goto, open_page, probe


def _open(page, pid="cortex"):
    page.evaluate(
        f"""() => document.querySelector('[data-surface-rows] [data-bore="{pid}"]')
        .dispatchEvent(new MouseEvent('click', {{bubbles: true}}))"""
    )
    page.wait_for_timeout(400)


def test_rows_link_straight_to_each_product_site(browser, site):
    page = open_page(browser, site())
    goto(page, 0)
    import json as _json
    from pathlib import Path as _Path

    products = _json.loads((_Path(__file__).resolve().parents[1] / "products.json").read_text(encoding="utf-8"))
    expected = [p["url"] for p in sorted(products, key=lambda p: p["canal"]) if p["url"]]
    hrefs = page.eval_on_selector_all(
        "[data-surface-rows] a[data-out]", "els => els.map(e => e.getAttribute('href'))"
    )
    assert hrefs == expected
    deep = page.eval_on_selector_all('[data-id="rows"] a[data-out]', "els => els.map(e => e.getAttribute('href'))")
    assert deep == hrefs
    for a in page.locator("[data-surface-rows] a[data-out]").all():
        assert a.get_attribute("target") == "_blank"
        assert "noopener" in (a.get_attribute("rel") or "")


def test_a_product_without_a_site_gets_no_link(browser, site):
    """products_8.json carries entries with url:null — they show the bare arrow."""
    from pathlib import Path as _Path

    page = open_page(browser, site(_Path(__file__).resolve().parents[1] / "tests/fixtures/products_8.json"))
    goto(page, 0)
    assert page.locator('[data-id="rows"] [data-bore="p6"] a').count() == 0
    assert page.locator('[data-id="rows"] [data-bore="p5"] a[data-out]').count() == 1


def test_clicking_a_row_link_does_not_open_the_panel(browser, site):
    page = open_page(browser, site())
    goto(page, 0)
    # strip href/target so the click exercises the guard without navigating away
    page.evaluate(
        """() => { const a = document.querySelector('[data-surface-rows] [data-bore="praix"] a[data-out]');
        a.removeAttribute('href'); a.removeAttribute('target');
        a.dispatchEvent(new MouseEvent('click', {bubbles: true})); }"""
    )
    page.wait_for_timeout(400)
    assert probe(page, "a.boreOpen") is None, "the link opened the panel instead of the site"


def test_back_closes_the_panel_instead_of_leaving_the_site(browser, site):
    page = open_page(browser, site())
    goto(page, 0)
    url = page.url
    _open(page, "cortex")
    assert probe(page, "a.boreOpen") == "cortex"
    page.go_back()
    page.wait_for_timeout(500)
    assert page.url == url, "Back left the site"
    assert probe(page, "a.boreOpen") is None, "Back did not close the panel"
    assert page.errors == []


def test_close_button_leaves_history_level(browser, site):
    """Open and close twice; Back must still not walk off the site."""
    page = open_page(browser, site())
    goto(page, 0)
    url = page.url
    for pid in ("cortex", "praix"):
        _open(page, pid)
        page.evaluate("""() => document.querySelector('[data-on-click="closeBore"]').click()""")
        page.wait_for_timeout(400)
        assert probe(page, "a.boreOpen") is None
    assert page.url == url


def test_escape_still_closes(browser, site):
    page = open_page(browser, site())
    goto(page, 0)
    _open(page, "alevant")
    page.keyboard.press("Escape")
    page.wait_for_timeout(400)
    assert probe(page, "a.boreOpen") is None


def test_panel_carries_its_own_link(browser, site):
    page = open_page(browser, site())
    goto(page, 0)
    _open(page, "praix")
    link = page.locator('[data-panel="praix"] a')
    assert link.count() == 1
    assert link.get_attribute("href") == "https://praix.ai"
