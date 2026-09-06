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
    hrefs = page.eval_on_selector_all(
        "[data-surface-rows] a[data-out]", "els => els.map(e => e.getAttribute('href'))"
    )
    assert hrefs == ["https://praix.ai", "https://alevant.ai", "https://peptidecortex.com"]
    deep = page.eval_on_selector_all('[data-id="rows"] a[data-out]', "els => els.map(e => e.getAttribute('href'))")
    assert deep == hrefs
    for a in page.locator("[data-surface-rows] a[data-out]").all():
        assert a.get_attribute("target") == "_blank"
        assert "noopener" in (a.get_attribute("rel") or "")
    # Vitreon has no site yet, so it gets no link
    assert page.locator('[data-surface-rows] [data-bore="vitreon"] a').count() == 0


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
