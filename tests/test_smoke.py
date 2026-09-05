from conftest import open_page, probe


def test_page_boots_and_exposes_probe(browser, site):
    page = open_page(browser, site())
    assert page.errors == []
    assert probe(page, "typeof a.mount") == "function"
    assert probe(page, "a.strataEls.length") >= 10
    assert page.evaluate("window.__tigris_colorAt(0)") == [242, 239, 231]
