# Homepage: directory at the surface, descent as the story — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Sounding 01 homepage render its products from one data file, put the directory at the surface, reorder the descent so plain content comes first and the name story closes it, add the river and founder beats, make wayfinding literal, add a read-as-one-page mode, and remove the overture — with the engine measuring layout instead of assuming it.

**Architecture:** `index.html` stops being hand-edited and becomes the output of `tools/build.py`, which stamps `products.json` into `index.template.html` at six marked points (surface rows, deep rows, bore panels, index overlay, JS `PRODUCTS` array, no-JS fallback). The page's inline engine (`class Instrument`) gains a sequential layout pass — each stratum's `top` is computed from the previous stratum's measured bottom plus a designed gap — so the descent grows with the product list, and depth labels, rail, HUD strata and `maxD` are all derived. Tests drive the built page headlessly through a `window.__tigris` probe.

**Tech Stack:** Static HTML + inline JS (no framework, no bundler). Python 3.13 stdlib for the build. pytest + Playwright (Chromium) for tests and verification. Already installed: `pytest 9.1.1`, `playwright`, `pillow`.

**Spec:** `docs/superpowers/specs/2026-09-05-homepage-directory-and-descent-design.md`

## Global Constraints

- The instrument does not change: canvas, geology, inertia, wheel/drag/keys, bore panels, colour stops. Copy, order, data and layout arithmetic change (spec D1).
- Nothing may assume a product count: no literal "four", no `CANAL 04` in the template, no fixed `BORE_D` (spec D2).
- Every new text node that must survive the light inversion is a `<p>` — the engine recolours `p, [data-goto], [data-cue] span` only (spec §8).
- The name story copy is byte-identical to `master` (spec D6). Data / language / liability bodies are verbatim (spec D10).
- Surface shows ≤ 6 rows; beyond that `All N canals →` (spec §4).
- `status` absent → nothing renders (spec §10).
- No placeholder imagery; `panel.screen` optional (spec §10).
- `index.html` stays committed and byte-identical to a fresh build (spec §12, §15.9).
- Commits end with:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Q6qRJSdMnaugGqp4BQx6s9
  ```
- Work on branch `copy-pass`. Never push. Never `--force`.
- Repo root for every path below: `C:\dev\TigrisTechLabs\Tigris\tigris-tech-labs`. Run commands from there. `PYTHONIOENCODING=utf-8` for any script that prints the page's copy (em dashes, arrows).

---

## File structure

| Path | Responsibility |
|---|---|
| `products.json` | The one product list. Order = `canal`. |
| `index.template.html` | The page, with six stamp markers. Hand-edited. |
| `index.html` | Generated. Deployed. Committed. |
| `tools/build.py` | `render_*` functions + `build()`; `python tools/build.py` writes `index.html`. |
| `tools/verify.py` | Drift check (rebuild == committed), overlap check at 3 viewports, contrast check. Exit non-zero on failure. |
| `tools/README.md` | Pipeline docs (replace the port-tool text). |
| `tests/conftest.py` | `site` factory (build a products file into a temp dir and serve it), `page`, `goto()`, `probe()`. |
| `tests/fixtures/products_8.json` | Eight products, for scaling tests. |
| `tests/test_build.py` | Renderers and `build()`. |
| `tests/test_surface.py` | First paint, rows, cap, overlay, status, screens. |
| `tests/test_layout.py` | Sequential layout, labels, rail, HUD, no overlap, no overture. |
| `tests/test_docmode.py` | Read as one page. |

---

### Task 1: Test harness and engine probe

**Files:**
- Modify: `index.html` (bootstrap `boot()`, ~line 1036)
- Create: `tests/conftest.py`, `tests/test_smoke.py`, `pytest.ini`

**Interfaces:**
- Produces: `window.__tigris` = the `Instrument` instance, plus `window.__tigris_colorAt(d) -> [r,g,b]`.
- Produces (tests): fixture `site(products_path=None) -> str url`; fixture `browser`; helper `open_page(browser, url, w, h) -> page`; `goto(page, depth)`; `probe(page, js_expr)`.

- [ ] **Step 1: Write the failing smoke test**

`pytest.ini`:
```ini
[pytest]
testpaths = tests
addopts = -q
```

`tests/conftest.py`:
```python
import json, os, shutil, socket, subprocess, sys, tempfile, time
from pathlib import Path
import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))


def _free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p


def _serve(directory):
    port = _free_port()
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1",
                             "-d", str(directory)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        try:
            socket.create_connection(("127.0.0.1", port), timeout=0.2).close(); break
        except OSError:
            time.sleep(0.1)
    return proc, f"http://127.0.0.1:{port}/"


@pytest.fixture(scope="session")
def browser():
    with sync_playwright() as p:
        b = p.chromium.launch()
        yield b
        b.close()


@pytest.fixture(scope="session")
def site():
    """site() serves the committed repo root. site(products_path) builds that
    products file against index.template.html into a temp dir and serves it.
    (Until Task 2 lands, only the no-argument form works.)"""
    procs, dirs = [], []

    def make(products_path=None):
        if products_path is None:
            directory = ROOT
        else:
            import build  # tools/build.py
            directory = Path(tempfile.mkdtemp(prefix="tigris-site-"))
            dirs.append(directory)
            for f in ROOT.glob("*.svg"):
                shutil.copy(f, directory / f.name)
            html = build.build(Path(products_path), ROOT / "index.template.html")
            (directory / "index.html").write_text(html, encoding="utf-8", newline="\n")
        proc, url = _serve(directory)
        procs.append(proc)
        return url

    yield make
    for p in procs:
        p.terminate()
    for d in dirs:
        shutil.rmtree(d, ignore_errors=True)


def open_page(browser, url, w=1440, h=900):
    page = browser.new_page(viewport={"width": w, "height": h})
    page.errors = []
    page.on("pageerror", lambda e: page.errors.append(str(e)))
    page.goto(url)
    page.wait_for_function("() => window.__tigris && window.__tigris.strataEls")
    page.wait_for_timeout(600)  # fonts + first paint
    return page


def goto(page, depth):
    page.evaluate("""d => { const a = window.__tigris;
        a.target = d; a.depth = d; a.clamp(); a.lastDrawn = -999; a.frame(); }""", depth)
    page.wait_for_timeout(250)


def probe(page, expr):
    return page.evaluate(f"() => {{ const a = window.__tigris; return ({expr}); }}")
```

`tests/test_smoke.py`:
```python
from conftest import open_page, probe

def test_page_boots_and_exposes_probe(browser, site):
    page = open_page(browser, site())
    assert page.errors == []
    assert probe(page, "typeof a.mount") == "function"
    assert probe(page, "a.strataEls.length") >= 10
    assert page.evaluate("window.__tigris_colorAt(0)") == [242, 239, 231]
```

- [ ] **Step 2: Run to verify it fails**

Run: `python -m pytest tests/test_smoke.py -v`
Expected: FAIL — `wait_for_function` times out (`window.__tigris` undefined).

- [ ] **Step 3: Expose the probe in `boot()`**

In `index.html`, inside `function boot(){` after `app.mount();` add:

```js
  // probe for headless tests and tools/verify.py — not used by the page itself
  window.__tigris = app;
  window.__tigris_colorAt = d => colorAt(d).map(v => v | 0);
```

- [ ] **Step 4: Run to verify it passes**

Run: `python -m pytest tests/test_smoke.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pytest.ini tests/conftest.py tests/test_smoke.py index.html
git commit -m "test(www): headless harness + window.__tigris probe" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01Q6qRJSdMnaugGqp4BQx6s9"
```

---

### Task 2: `products.json`, the template, and `tools/build.py` (pure refactor — output unchanged in content)

**Files:**
- Create: `products.json`, `index.template.html` (from `index.html`), `tools/build.py`, `tests/test_build.py`
- Modify: `index.html` (becomes generated output)

**Interfaces:**
- Produces: `build.load_products(path) -> list[dict]` (sorted by `canal`); `build.render_deep_rows(products) -> str`; `build.render_panels(products) -> str`; `build.render_noscript(products) -> str`; `build.render_products_js(products) -> str`; `build.render_surface_rows(products) -> str` (Task 3 fills it; here returns `""`); `build.render_index_panel(products) -> str` (Task 4; here returns `""`); `build.build(products_path, template_path) -> str`; `build.MARKERS` dict.
- Template markers (exact): `<!--@@surface-rows@@-->`, `<!--@@deep-rows@@-->`, `<!--@@panels@@-->`, `<!--@@index-panel@@-->`, `<!--@@products-js@@-->`, `<!--@@noscript-products@@-->`.

- [ ] **Step 1: Write `products.json` from today's content**

```json
[
  {
    "id": "cortex", "canal": 1, "name": "Cortex", "industry": "Peptide research",
    "url": "https://peptidecortex.com", "colour": "#1A8A9E", "colour_dark": "#1A8A9E",
    "lead": "An educational reference for peptide research — compounds, evidence grades, and how a protocol fits together.",
    "panel": {
      "intro": "An educational intelligence platform for peptide research. Cortex helps people explore compounds, compare the research behind them, understand the important considerations, and see how the pieces of a protocol connect.",
      "data": "92 compounds across 12 goal categories, each carrying its own evidence grade and cardiovascular rating.",
      "language": "Four depths instead of a menu. You do not navigate pages — you zoom, and zooming out is back.",
      "liability": "Educational reference for adults 18+, quoted verbatim. Where the record is unestablished, Cortex says so instead of paraphrasing."
    }
  },
  {
    "id": "alevant", "canal": 2, "name": "Alevant", "industry": "Luxury real estate",
    "url": "https://alevant.ai", "colour": "#C4875A", "colour_dark": "#E2B581",
    "lead": "An AI platform for luxury real-estate professionals — inquiries, follow-up, market intelligence, and a campaign built around each listing.",
    "panel": {
      "intro": "An AI platform for luxury real-estate professionals. Alevant handles new inquiries, client follow-up and market intelligence, and builds a campaign around each listing — so every client feels remembered and every property gets attention.",
      "data": "Live comps and market intelligence on demand, per listing and per submarket.",
      "language": "An AI ISA across voice, SMS and DMs — answering in the register a luxury client expects, 24/7.",
      "liability": "Cinematic marketing campaigns built per listing, and an agent's name on every one of them."
    }
  },
  {
    "id": "praix", "canal": 3, "name": "PRAIX", "industry": "Commercial insurance",
    "url": "https://praix.ai", "colour": "#C4875A", "colour_dark": "#E2B581",
    "lead": "An AI-native CRM for commercial insurance producers — finds the right prospects, prepares the strategy, and hands over the next move.",
    "panel": {
      "intro": "An AI-native CRM and growth platform for commercial insurance. PRAIX helps producers find the right opportunities, understand a prospect before the first call, and manage the path from first signal to open quote. The intelligence work happens before the meeting, so the producer arrives with something worth saying.",
      "data": "A property portfolio assembled from scattered record — loss runs, statements of value, and the flood and wind exposure under every address.",
      "language": "SOV, TIV, x-date, hard market. The vocabulary a producer is judged by on the first call.",
      "liability": "Invitation only, one book at a time. The agents do the intelligence work; the producer gets the action plan and signs it."
    }
  },
  {
    "id": "vitreon", "canal": 4, "name": "Vitreon", "industry": "Local business",
    "url": null, "colour": "#6B4C9A", "colour_dark": "#A98BD6",
    "lead": "Vertical SaaS for local businesses — runs the website and marketing, reads real sales, and gives the owner a short daily queue to approve.",
    "panel": {
      "intro": "Vertical SaaS for local businesses. Vitreon is installed for a single business and handed over: it runs their website and marketing, reads their real sales to close the loop, and gives the owner a short daily queue to approve. Staff get operations screens; Tigris runs the console behind it.",
      "data": "Bookings, walk-ins, returning customers and real sales — records most local businesses keep in a calendar, a phone, and one person's memory.",
      "language": "A regular is not a customer. The owner already knows the name, the fit, and the last visit — the product has to as well.",
      "liability": "The owner's name is on the door. Nothing goes out without their approval, and a bad week is felt the same week."
    }
  }
]
```

- [ ] **Step 2: Write the failing build tests**

`tests/test_build.py`:
```python
import json, re
from pathlib import Path
import build

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS = ROOT / "products.json"
TEMPLATE = ROOT / "index.template.html"


def test_load_products_sorted_by_canal(tmp_path):
    p = tmp_path / "p.json"
    p.write_text(json.dumps([{"id": "b", "canal": 2, "name": "B", "industry": "x", "colour": "#000", "colour_dark": "#fff", "lead": "", "panel": {"intro": "", "data": "", "language": "", "liability": ""}},
                             {"id": "a", "canal": 1, "name": "A", "industry": "y", "colour": "#000", "colour_dark": "#fff", "lead": "", "panel": {"intro": "", "data": "", "language": "", "liability": ""}}]), encoding="utf-8")
    assert [x["id"] for x in build.load_products(p)] == ["a", "b"]


def test_deep_rows_carry_canal_number_name_industry_lead():
    html = build.render_deep_rows(build.load_products(PRODUCTS))
    assert 'data-bore="praix"' in html and "CANAL 03" in html
    assert "PRAIX" in html and "Commercial insurance" in html
    assert "finds the right prospects" in html
    assert 'data-row' in html
    # the last row also carries the bottom border, as today
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
    assert "hello@tigristechlabs.com" in html


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
```

- [ ] **Step 3: Run to verify they fail**

Run: `python -m pytest tests/test_build.py -v`
Expected: FAIL — `ModuleNotFoundError: build`.

- [ ] **Step 4: Create the template by cutting the product markup out of `index.html`**

```bash
cp index.html index.template.html
```

Then in `index.template.html` make these six replacements (each region is replaced by one marker line; keep surrounding markup):

a. **Deep rows.** Inside the stratum at `top:3060px`, replace the four `<div data-bore=... data-row ...>…</div>` blocks (everything between `<div style="max-width:860px;">` and its closing `</div>`) with:
```html
      <div style="max-width:860px;">
<!--@@deep-rows@@-->
      </div>
```

b. **Panels.** Inside `<div data-ref="boreRef" …>`, after the `Close · esc ✕` div, replace the four `<div data-panel="…">…</div>` blocks with:
```html
<!--@@panels@@-->
<!--@@index-panel@@-->
```

c. **No-JS products.** Inside `<noscript>`, replace the `<div style="display:flex;flex-direction:column;">…</div>` that holds the four canal blocks with:
```html
<!--@@noscript-products@@-->
```

d. **Products array.** Immediately after `const BORE_D=[3060,3130,3200,3270];` insert:
```html
<!--@@products-js@@-->
```
and change `const BORE_D=[3060,3130,3200,3270];` to `const BORE_D=[];` (it is rebuilt in `resize()` from the rows already).

e. **Surface rows.** In the title stratum, immediately after the intro `<p …>An AI-native product holding company…</p>` insert:
```html
<!--@@surface-rows@@-->
```

f. Delete `index.html` from the working tree for now (it will be regenerated in Step 6).

- [ ] **Step 5: Write `tools/build.py`**

```python
#!/usr/bin/env python
"""
build.py — stamp products.json into index.template.html and write index.html.

    python tools/build.py                 # products.json + index.template.html -> index.html
    python tools/build.py --check         # exit 1 if index.html differs from a fresh build

Stdlib only. The template carries six markers; each is replaced by markup
rendered from the product list, so every product surface is generated from
one file and none of them can drift.
"""
import argparse, json, sys
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MONO = "font-family:'JetBrains Mono',monospace;"
MARKERS = {
    "surface": "<!--@@surface-rows@@-->",
    "deep": "<!--@@deep-rows@@-->",
    "panels": "<!--@@panels@@-->",
    "index": "<!--@@index-panel@@-->",
    "js": "<!--@@products-js@@-->",
    "noscript": "<!--@@noscript-products@@-->",
}
SURFACE_CAP = 6
STATUS_WORD = {"live": "live", "building": "in build", "planned": "planned"}


def load_products(path):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    return sorted(data, key=lambda p: p["canal"])


def canal(p):
    return f"CANAL {p['canal']:02d}"


def e(s):
    return escape(s or "", quote=True)


def status_word(p):
    if not p.get("status"):
        return ""
    w = STATUS_WORD[p["status"]]
    if p.get("status_note"):
        w += " · " + p["status_note"]
    return w


def glyph(p, colour):
    """A status mark in the product colour. Filled = live, half = building,
    dashed ring = planned. Empty string when status is unset."""
    s = p.get("status")
    if not s:
        return ""
    base = "display:inline-block;width:7px;height:7px;border-radius:50%;box-sizing:border-box;vertical-align:middle;margin-right:8px;"
    if s == "live":
        st = f"background:{colour};"
    elif s == "building":
        st = f"border:1.5px solid {colour};background:linear-gradient(90deg,{colour} 50%,transparent 50%);"
    else:
        st = f"border:1px dashed {colour};"
    return f'<span data-status="{s}" style="{base}{st}"></span>'


def render_deep_rows(products):
    rows = []
    n = len(products)
    for i, p in enumerate(products):
        border = "border-top:1px solid;" + ("border-bottom:1px solid;" if i == n - 1 else "")
        sw = status_word(p)
        st = f'<span style="{MONO}font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:#6B6558;margin-left:14px;">{e(sw)}</span>' if sw else ""
        rows.append(
            f'        <div data-bore="{e(p["id"])}" data-row style="{border}padding:20px 0;display:flex;align-items:baseline;gap:26px;cursor:pointer;">\n'
            f'          <span style="{MONO}font-size:10px;letter-spacing:.24em;color:{e(p["colour"])};min-width:74px;">{glyph(p, p["colour"])}{canal(p)}</span>\n'
            f'          <div style="flex:1;"><div style="font-weight:300;font-size:clamp(26px,3.2vw,40px);">{e(p["name"])}</div>'
            f'<p style="max-width:520px;font-size:14px;line-height:1.55;margin-top:6px;">{e(p["lead"])}</p></div>\n'
            f'          <span style="{MONO}font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#6B6558;">{e(p["industry"])}{st}</span>\n'
            f'          <span style="{MONO}font-size:12px;color:#6B6558;">→</span>\n'
            f'        </div>'
        )
    return "\n".join(rows)


def render_surface_rows(products):
    return ""  # Task 3


def _cell(colour, title, text):
    return (f'        <div style="background:#100F0D;padding:22px;"><div style="{MONO}font-size:9.5px;letter-spacing:.24em;'
            f'text-transform:uppercase;color:{colour};margin-bottom:11px;">{title}</div>'
            f'<p style="font-size:14px;line-height:1.7;opacity:.68;">{e(text)}</p></div>')


def render_panels(products):
    out = []
    for p in products:
        c = e(p["colour_dark"]); pn = p["panel"]
        link = (f'      <a href="{e(p["url"])}" target="_blank" rel="noopener" style="align-self:flex-start;margin-top:38px;white-space:nowrap;'
                f'display:inline-flex;align-items:center;gap:12px;{MONO}font-size:11px;letter-spacing:.2em;text-transform:uppercase;'
                f'color:{c};border:1px solid {c};padding:14px 22px;text-decoration:none;">{e(p["url"].replace("https://", ""))} →</a>\n') if p.get("url") else ""
        screen = (f'      <img src="{e(pn["screen"])}" alt="{e(p["name"])} — product screen" '
                  f'style="display:block;max-width:880px;width:100%;margin-top:30px;border:1px solid rgba(242,239,231,.14);">\n') if pn.get("screen") else ""
        out.append(
            f'    <div data-panel="{e(p["id"])}" style="position:absolute;inset:0;display:none;flex-direction:column;justify-content:center;padding:clamp(28px,7vw,104px);overflow:auto;">\n'
            f'      <div style="{MONO}font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:{c};margin-bottom:24px;">{canal(p).title()} · {e(p["industry"].lower())}</div>\n'
            f'      <h2 style="font-weight:200;font-size:clamp(42px,7.4vw,108px);line-height:.92;margin-bottom:24px;">{e(p["name"])}</h2>\n'
            f'      <p style="max-width:520px;font-size:16px;line-height:1.8;opacity:.72;margin-bottom:42px;">{e(pn["intro"])}</p>\n'
            f'      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1px;background:rgba(242,239,231,.14);max-width:880px;">\n'
            + _cell(c, "Data", pn["data"]) + "\n" + _cell(c, "Language", pn["language"]) + "\n" + _cell(c, "Liability", pn["liability"]) + "\n"
            f'      </div>\n{screen}{link}    </div>'
        )
    return "\n".join(out)


def render_index_panel(products):
    return ""  # Task 4


def render_noscript(products):
    n = len(products); blocks = []
    for i, p in enumerate(products):
        border = "border-top:1px solid rgba(20,18,15,.2);" + ("border-bottom:1px solid rgba(20,18,15,.2);" if i == n - 1 else "")
        link = (f'          <a href="{e(p["url"])}" style="font-family:monospace;font-size:11px;letter-spacing:.1em;color:{e(p["colour"])};">'
                f'{e(p["url"].replace("https://", ""))} →</a>\n') if p.get("url") else ""
        blocks.append(
            f'        <div style="{border}padding:20px 0;">\n'
            f'          <div style="font-family:monospace;font-size:10px;letter-spacing:.2em;color:{e(p["colour"])};margin-bottom:8px;">{canal(p)} · {e(p["industry"].upper())}</div>\n'
            f'          <h3 style="font-family:Georgia,serif;font-weight:300;font-size:22px;margin-bottom:8px;">{e(p["name"])}</h3>\n'
            f'          <p style="font-size:14.5px;line-height:1.65;color:#3A362E;margin-bottom:10px;">{e(p["lead"])}</p>\n'
            f'{link}        </div>'
        )
    return '      <div style="display:flex;flex-direction:column;">\n' + "\n".join(blocks) + "\n      </div>"


def render_products_js(products):
    slim = [{k: p.get(k) for k in ("id", "canal", "name", "industry", "url", "colour", "status", "status_note", "lead")} for p in products]
    return "const PRODUCTS=" + json.dumps(slim, ensure_ascii=False, separators=(",", ":")) + ";"


RENDERERS = {
    "surface": render_surface_rows, "deep": render_deep_rows, "panels": render_panels,
    "index": render_index_panel, "js": render_products_js, "noscript": render_noscript,
}


def build(products_path, template_path):
    products = load_products(products_path)
    html = Path(template_path).read_text(encoding="utf-8")
    for key, marker in MARKERS.items():
        if marker not in html:
            sys.exit(f"build: marker {marker} missing from {template_path}")
        html = html.replace(marker, RENDERERS[key](products))
    return html


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--products", default=ROOT / "products.json")
    ap.add_argument("--template", default=ROOT / "index.template.html")
    ap.add_argument("--out", default=ROOT / "index.html")
    a = ap.parse_args(argv)
    fresh = build(a.products, a.template)
    out = Path(a.out)
    if a.check:
        current = out.read_text(encoding="utf-8") if out.exists() else None
        if current != fresh:
            print("index.html is out of date — run: python tools/build.py"); return 1
        print("index.html matches a fresh build"); return 0
    out.write_text(fresh, encoding="utf-8", newline="\n")
    print(f"wrote {out} ({len(fresh):,} bytes)"); return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 6: Build, then run the build tests**

Run: `python tools/build.py && python -m pytest tests/test_build.py tests/test_smoke.py -v`
Expected: all PASS.

- [ ] **Step 7: Prove the rendered page is unchanged in content**

Run: `git stash -q -- index.html 2>/dev/null; git show master:index.html > /tmp_master.html` is not needed — compare visible text instead:

```bash
PYTHONIOENCODING=utf-8 python - <<'PY'
import re,subprocess
def text(s): return re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',s))
new=open('index.html',encoding='utf-8').read()
old=subprocess.check_output(['git','show','HEAD:index.html']).decode('utf-8')
for needle in ["CANAL 01","CANAL 04","Local business","finds the right prospects","hello@tigristechlabs.com","Educational reference for adults 18+"]:
    assert needle in text(new), needle
print("PRODUCT TEXT PRESENT; rows/panels/noscript regenerated")
PY
```
Expected: `PRODUCT TEXT PRESENT…`. (Attribute order and whitespace differ from the hand-written version; text does not.)

- [ ] **Step 8: Commit**

```bash
git add products.json index.template.html index.html tools/build.py tests/test_build.py
git commit -m "build(www): products.json + index.template.html; index.html is now generated" -m "One list renders the deep rows, the bore panels, the no-JS fallback and a JS PRODUCTS array. Content unchanged; BORE_D is already rebuilt from the rows at runtime." -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01Q6qRJSdMnaugGqp4BQx6s9"
```

---

### Task 3: Surface rows (the directory at 0 m), with the 6-row cap

**Files:**
- Modify: `tools/build.py` (`render_surface_rows`), `index.template.html` (title stratum: pattern paragraph, footer line)
- Create: `tests/fixtures/products_8.json`, `tests/test_surface.py`

**Interfaces:**
- Produces: surface rows markup with `data-bore="<id>"` on each row, `data-surface-rows` on the container, `data-open-index` on the "All N canals →" row when `len(products) > SURFACE_CAP`.

- [ ] **Step 1: Write the 8-product fixture**

`tests/fixtures/products_8.json` — copy `products.json` and append four entries:
```json
  {"id":"p5","canal":5,"name":"Fifth","industry":"Industry five","url":"https://five.example","colour":"#556B2F","colour_dark":"#9DB86A","lead":"Lead five.","panel":{"intro":"Intro five.","data":"d","language":"l","liability":"x"}},
  {"id":"p6","canal":6,"name":"Sixth","industry":"Industry six","url":null,"colour":"#7A4B2A","colour_dark":"#C89A6A","lead":"Lead six.","panel":{"intro":"Intro six.","data":"d","language":"l","liability":"x"}},
  {"id":"p7","canal":7,"name":"Seventh","industry":"Industry seven","url":null,"colour":"#2A5A7A","colour_dark":"#6AA0C8","lead":"Lead seven.","panel":{"intro":"Intro seven.","data":"d","language":"l","liability":"x"}},
  {"id":"p8","canal":8,"name":"Eighth","industry":"Industry eight","url":null,"colour":"#5A2A7A","colour_dark":"#A06AC8","lead":"Lead eight.","panel":{"intro":"Intro eight.","data":"d","language":"l","liability":"x"}}
```
(Keep the JSON a single valid array.)

- [ ] **Step 2: Write the failing tests**

`tests/test_surface.py`:
```python
from pathlib import Path
import build
from conftest import open_page, probe

ROOT = Path(__file__).resolve().parents[1]
FX8 = ROOT / "tests" / "fixtures" / "products_8.json"


def test_render_surface_rows_lists_all_when_under_cap():
    html = build.render_surface_rows(build.load_products(ROOT / "products.json"))
    assert html.count("data-bore=") == 4 and "data-open-index" not in html
    assert "CANAL 01" in html and "Peptide research" in html


def test_render_surface_rows_caps_at_six_and_offers_all():
    html = build.render_surface_rows(build.load_products(FX8))
    assert html.count('data-bore="') == 6
    assert "All 8 canals" in html and "data-open-index" in html


def test_first_paint_shows_directory_without_scrolling(browser, site):
    page = open_page(browser, site(), 1280, 800)
    assert page.errors == []
    for sel in ['[data-surface-rows] [data-bore="cortex"]', '[data-surface-rows] [data-bore="vitreon"]',
                '[data-surface-contact]', '[data-cue]']:
        box = page.locator(sel).first.bounding_box()
        assert box and 0 <= box["y"] and box["y"] + box["height"] <= 800, sel
    assert probe(page, "a.depth") == 0


def test_surface_row_opens_the_products_bore_panel(browser, site):
    page = open_page(browser, site())
    page.evaluate("""() => document.querySelector('[data-surface-rows] [data-bore="praix"]')
        .dispatchEvent(new MouseEvent('click', {bubbles: true}))""")
    page.wait_for_timeout(500)
    assert probe(page, "a.boreOpen") == "praix"
    assert page.locator('[data-panel="praix"]').evaluate("el => getComputedStyle(el).display") == "flex"
```

- [ ] **Step 3: Run to verify they fail**

Run: `python -m pytest tests/test_surface.py -v`
Expected: first two FAIL (`render_surface_rows` returns `""`), the browser tests FAIL on missing `[data-surface-rows]`.

- [ ] **Step 4: Implement `render_surface_rows`**

Replace the stub in `tools/build.py`:
```python
def render_surface_rows(products):
    shown = products[:SURFACE_CAP]
    rows = []
    for p in shown:
        sw = status_word(p)
        st = f'<span style="{MONO}font-size:8.5px;letter-spacing:.16em;text-transform:uppercase;color:#6B6558;margin-left:12px;">{e(sw)}</span>' if sw else ""
        rows.append(
            f'          <div data-bore="{e(p["id"])}" data-row style="border-top:1px solid;padding:11px 0;display:flex;align-items:baseline;gap:18px;cursor:pointer;">\n'
            f'            <span style="{MONO}font-size:8.5px;letter-spacing:.24em;min-width:56px;color:{e(p["colour"])};">{glyph(p, p["colour"])}{canal(p)}</span>\n'
            f'            <span style="font-weight:300;font-size:22px;flex:1;line-height:1;">{e(p["name"])}</span>\n'
            f'            <span style="{MONO}font-size:8.5px;letter-spacing:.18em;text-transform:uppercase;color:#6B6558;">{e(p["industry"])}{st}</span>\n'
            f'            <span style="{MONO}font-size:10px;color:#6B6558;">→</span>\n'
            f'          </div>'
        )
    if len(products) > SURFACE_CAP:
        rows.append(
            f'          <div data-open-index data-row style="border-top:1px solid;padding:11px 0;display:flex;align-items:baseline;gap:18px;cursor:pointer;">\n'
            f'            <span style="{MONO}font-size:8.5px;letter-spacing:.24em;min-width:56px;color:#6B6558;">+{len(products) - SURFACE_CAP:02d}</span>\n'
            f'            <span style="font-weight:300;font-size:22px;flex:1;line-height:1;">All {len(products)} canals</span>\n'
            f'            <span style="{MONO}font-size:10px;color:#6B6558;">→</span>\n'
            f'          </div>'
        )
    return ('        <div data-surface-rows style="max-width:620px;margin-top:22px;border-bottom:1px solid;">\n'
            + "\n".join(rows) + "\n        </div>")
```

Note `data-row` on the container's children: the engine already colours `[data-row]` borders through the inversion (`rowEls`), so the surface rows inherit that for free. The container's own `border-bottom` needs `data-row` too — add `data-row` to the container div in the string above (`<div data-surface-rows data-row …>`).

- [ ] **Step 5: Template — the pattern paragraph and the footer line**

In `index.template.html`, title stratum: replace the intro paragraph text with the pattern paragraph (no names, no count):

```html
        <p style="max-width:520px;font-size:17px;line-height:1.75;color:#3A362E;">An AI-native product holding company, named for the plain that two rivers built. We build products for single industries and go deeper into each one instead of wider across more. There is only how far down you are willing to go.</p>
<!--@@surface-rows@@-->
        <p data-surface-contact style="display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;max-width:620px;margin-top:14px;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.2em;text-transform:uppercase;"><span>Open a canal to read its record</span><a href="mailto:hello@tigristechlabs.com" data-cta style="border:0;padding:0;color:inherit;text-decoration:none;border-bottom:1px solid currentColor;">hello@tigristechlabs.com →</a></p>
```

Make the same paragraph change in the `<noscript>` intro `<p>`.

The title stratum's `max-width:820px` wrapper already fits 620px rows.

- [ ] **Step 6: Build and run**

Run: `python tools/build.py && python -m pytest tests/test_surface.py tests/test_build.py -v`
Expected: PASS. If `test_first_paint_shows_directory_without_scrolling` fails on the cue's `y`, reduce the title stratum's internal margins (`.cue` `margin-top`, `data-rule` margins) until the cue's bottom ≤ 800 at 1280×800 — do not shrink row padding below 9px.

- [ ] **Step 7: Commit**

```bash
git add tools/build.py index.template.html index.html tests/fixtures/products_8.json tests/test_surface.py
git commit -m "feat(www): the directory at the surface — canal rows at 0 m, capped at six" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01Q6qRJSdMnaugGqp4BQx6s9"
```

---

### Task 4: The index overlay (`All N canals →`)

**Files:**
- Modify: `tools/build.py` (`render_index_panel`), `index.template.html` (`onShaftClick`), `tests/test_surface.py`

**Interfaces:**
- Produces: `data-panel="index"` in the bore layer; `[data-open-index]` click → `openBore('index')`.

- [ ] **Step 1: Write the failing tests** (append to `tests/test_surface.py`)

```python
def test_render_index_panel_lists_every_product():
    html = build.render_index_panel(build.load_products(FX8))
    assert 'data-panel="index"' in html
    assert html.count("data-index-row") == 8
    assert "Lead eight." in html and 'href="https://five.example"' in html


def test_all_canals_row_opens_index_overlay(browser, site):
    page = open_page(browser, site(FX8))
    page.evaluate("""() => document.querySelector('[data-open-index]')
        .dispatchEvent(new MouseEvent('click', {bubbles: true}))""")
    page.wait_for_timeout(500)
    assert probe(page, "a.boreOpen") == "index"
    assert page.locator('[data-panel="index"] [data-index-row]').count() == 8
    page.keyboard.press("Escape"); page.wait_for_timeout(300)
    assert probe(page, "a.boreOpen") is None
```

- [ ] **Step 2: Run to verify they fail**

Run: `python -m pytest tests/test_surface.py -k index -v`
Expected: FAIL.

- [ ] **Step 3: Implement `render_index_panel`**

```python
def render_index_panel(products):
    rows = []
    for p in products:
        sw = status_word(p)
        st = f' <span style="opacity:.6">· {e(sw)}</span>' if sw else ""
        link = f'<a href="{e(p["url"])}" target="_blank" rel="noopener" style="color:{e(p["colour_dark"])};text-decoration:none;">{e(p["url"].replace("https://", ""))} →</a>' if p.get("url") else '<span style="opacity:.5">—</span>'
        rows.append(
            f'        <div data-index-row style="display:grid;grid-template-columns:76px 1fr auto;gap:8px 22px;align-items:baseline;padding:16px 0;border-top:1px solid rgba(242,239,231,.16);">\n'
            f'          <span style="{MONO}font-size:9.5px;letter-spacing:.24em;color:{e(p["colour_dark"])};">{canal(p)}</span>\n'
            f'          <div><div style="font-weight:300;font-size:clamp(22px,2.6vw,32px);line-height:1.05;">{e(p["name"])} <span style="{MONO}font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;opacity:.6;margin-left:10px;">{e(p["industry"])}{st}</span></div>'
            f'<p style="max-width:640px;font-size:14.5px;line-height:1.6;opacity:.72;margin-top:6px;">{e(p["lead"])}</p></div>\n'
            f'          <span style="{MONO}font-size:10.5px;letter-spacing:.14em;">{link}</span>\n'
            f'        </div>'
        )
    return (
        '    <div data-panel="index" style="position:absolute;inset:0;display:none;flex-direction:column;padding:clamp(28px,7vw,104px);overflow:auto;">\n'
        f'      <div style="{MONO}font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:#A98BD6;margin-bottom:24px;">The canals · {len(products)} products, one industry each</div>\n'
        '      <div style="max-width:980px;border-bottom:1px solid rgba(242,239,231,.16);">\n' + "\n".join(rows) + "\n      </div>\n    </div>"
    )
```

- [ ] **Step 4: Wire the click in the engine**

In `index.template.html`, `onShaftClick`, before `const b=e.target.closest('[data-bore]');` add:
```js
    if(e.target.closest('[data-open-index]')){ this.openBore('index'); return; }
```

- [ ] **Step 5: Build and run**

Run: `python tools/build.py && python -m pytest tests/test_surface.py tests/test_build.py -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tools/build.py index.template.html index.html tests/test_surface.py
git commit -m "feat(www): index overlay for the seventh canal and beyond" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01Q6qRJSdMnaugGqp4BQx6s9"
```

---

### Task 5: Reorder the descent and add the two new beats (template only)

**Files:**
- Modify: `index.template.html` (strata markup, rail labels)
- Create: `tests/test_layout.py` (order + verbatim-copy tests only; layout arithmetic comes in Task 6)

**Interfaces:**
- Produces: every stratum carries `data-stratum data-id="<id>" data-gap="<px>" data-hud="<HUD NAME>" data-pattern="<geology>"` and, where it has a label, `<div data-accent data-depth-label data-label="<lower-case label>">`. Rail entries carry `data-goto-block="<id>"`. Order of `data-id`: `company, learn-data, learn-language, learn-liability, thesis, change, products, rows, river, holding, founder, name, end`.

- [ ] **Step 1: Write the failing tests**

`tests/test_layout.py`:
```python
import re, subprocess
from pathlib import Path
import build
from conftest import open_page, probe

ROOT = Path(__file__).resolve().parents[1]
ORDER = ["company", "learn-data", "learn-language", "learn-liability", "thesis", "change",
         "products", "rows", "river", "holding", "founder", "name", "end"]


def _tmpl():
    return (ROOT / "index.template.html").read_text(encoding="utf-8")


def test_strata_order_matches_spec():
    ids = re.findall(r'data-stratum data-id="([^"]+)"', _tmpl())
    assert ids == ORDER


def test_name_story_is_verbatim_from_master():
    master = subprocess.check_output(["git", "show", "master:index.html"]).decode("utf-8")
    def paras(s, start):
        blk = s[s.index(start):]
        return re.findall(r"<p[^>]*>(.*?)</p>", blk[:blk.index("</div>\n    </div>")], re.S)[:2]
    assert paras(_tmpl(), 'data-id="name"') == paras(master, "0640 m — the name")


def test_data_language_liability_verbatim():
    t = _tmpl()
    for needle in ("Not a benchmark set. The messy, partial, contradictory record an industry actually keeps — and the reasons it keeps it that way.",
                   "Every trade has a private vocabulary where one word carries a decade of precedent. Get it wrong and the product is instantly recognisable as an outsider.",
                   "Who signs. Who is exposed when the answer is wrong. This is the constraint that decides whether software is adopted or merely admired."):
        assert needle in t


def test_no_silt_stratum_and_no_count_words():
    t = _tmpl()
    assert 'data-id="silt"' not in t
    assert "Four products" not in t and "four cuts" not in t
    assert "CANAL 0" not in t  # rows are generated


def test_rail_uses_literal_words_and_block_ids():
    t = _tmpl()
    for label in ("The company", "What we learn", "Thesis", "The products", "The river", "Holding company", "The founder", "The name", "First record"):
        assert f">{label}</div>" in t, label
    for word in ("Silt", "Confluence", "Constraints", "Philosophy"):
        assert f">{word}</div>" not in t, word
    assert t.count("data-goto-block=") >= 9
```

- [ ] **Step 2: Run to verify they fail**

Run: `python -m pytest tests/test_layout.py -v`
Expected: FAIL on order (current strata have no `data-id`).

- [ ] **Step 3: Rewrite the strata region of `index.template.html`**

Replace everything from the first `<div data-stratum style="opacity:0;position:absolute;top:360px;…">` (silt) through the end of the first-record stratum (the one containing `↑ Return to surface`) with the blocks below, **in this order**. The title stratum (`data-anchor="center"`) stays above them and gains `data-id="surface"`. Keep each block's inner `<div style="max-width:…">` wrapper style from the section it came from. `style` on each stratum is now just `opacity:0;position:absolute;left:0;width:100%;` — no `top`.

Common label form (the engine writes the depth prefix):
```html
<div data-accent data-depth-label data-label="the company" style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.26em;text-transform:uppercase;margin-bottom:22px;">the company</div>
```

1. **company** — `data-id="company" data-gap="120" data-hud="THE COMPANY" data-pattern="hatch"`. Label `the company`. H2 *An AI-native product `<em>holding company</em>`.* Two body `<p>`s from the current 1200 m block. Then the gloss `<p style="max-width:540px;font-size:15px;line-height:1.7;font-style:italic;opacity:.62;margin-top:12px;">Loose silt. Nothing here has been under pressure long enough to hold anything up.</p>`. Then the contact `<p data-accent …><a …>If you know an industry from the inside — hello@tigristechlabs.com →</a></p>` from the current block.
2. **learn-data** — `data-id="learn-data" data-gap="120" data-hud="WHAT WE LEARN · DATA" data-pattern="hatch"`. Label `what we learn first · I`. H3 *Its data*. Body verbatim.
3. **learn-language** — `data-gap="90" data-hud="WHAT WE LEARN · LANGUAGE" data-pattern="hatch"`. Label `what we learn first · II`. Verbatim. Keep `padding-left:clamp(0px,6vw,110px)`.
4. **learn-liability** — `data-gap="90" data-hud="WHAT WE LEARN · LIABILITY" data-pattern="cross"`. Label `what we learn first · III`. Verbatim. Keep `padding-left:clamp(0px,12vw,220px)`.
5. **thesis** — `data-gap="140" data-hud="THESIS" data-pattern="cross"`. No label (it has the rule). Current *Depth is the strategy* block unchanged.
6. **change** — `data-id="change" data-gap="60" data-pattern="massive"` (no `data-hud`). Content: `<div data-accent data-depth-label data-label="stratum change · the silt ends · entering the tablet beds" …>…</div>`.
7. **products** — `data-gap="100" data-hud="THE PRODUCTS" data-pattern="dense"`. Label `the products · one industry each`. H2 *One product per industry.* Body: *Each product enters a single industry and stays close to the people it serves. Open one to read how it meets that industry's data, its language, and its liability.* Gloss unchanged (*Four canals cut from the same river…* — this is the one place "four" survives, as poetry inside a gloss; change it to *Canals cut from the same river. Each carries the water in its own direction.* so the constraint holds).
8. **rows** — `data-id="rows" data-gap="60" data-pattern="dense"` (no `data-hud`; no label). Contains `<div style="max-width:860px;">` + `<!--@@deep-rows@@-->`.
9. **river** — `data-gap="160" data-hud="THE RIVER" data-pattern="dense"`. Label `the river · what the canals are cut from`. H2 *One river. `<em>Many canals.</em>`* Body and gloss per spec §6.1. Then a grid identical in markup to the philosophy grid with cells `01 — intelligence` / `02 — memory` / `03 — evaluation & security` and the spec's three sentences.
10. **holding** — `data-gap="140" data-hud="HOLDING COMPANY" data-pattern="dense"`. Label `why a holding company`. Current philosophy block unchanged (H2, intro `<p>`, grid).
11. **founder** — `data-gap="140" data-hud="THE FOUNDER" data-pattern="dense"`. Label `the founder`. H2 *Built from the inside.* Body per spec §6.2 as one `<p>`.
12. **name** — `data-gap="160" data-hud="THE NAME · TWO RIVERS" data-pattern="wedge"`. Label `the name · the first record`. H2 and both `<p>`s **copied byte-for-byte** from the current 0640 m block (including `<em>keeping count</em>`), then the existing `Three wedges, cut into the disc of the valley — the mark` line.
13. **end** — `data-gap="160" data-hud="THE FIRST RECORD" data-pattern="wedge"`. Label `the first record · end of section`. Current first-record block unchanged (H2, invitation `<p>`, `<a data-cta>`, footer row).

Also: the HUD `STRATA` array at the top of the script becomes just the surface entry — replace the whole literal with:
```js
const STRATA=[{d:0,n:'SURFACE',p:'dot'}];  // the rest is rebuilt from [data-stratum][data-hud] at layout
```

- [ ] **Step 4: Rewrite the rail**

Replace the nine `<div data-goto="…" …>` vertical labels with these (same inline style as today, but no `top`/`height`; the engine sets both):

```html
    <div data-goto-block="surface"          style="position:absolute;left:118px;writing-mode:vertical-rl;font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.3em;text-transform:uppercase;opacity:.45;cursor:pointer;">Surface</div>
    <div data-goto-block="company"          style="…same…">The company</div>
    <div data-goto-block="learn-data"       style="…same…">What we learn</div>
    <div data-goto-block="thesis"           style="…same…">Thesis</div>
    <div data-goto-block="products"         style="…same…">The products</div>
    <div data-goto-block="river"            style="…same…">The river</div>
    <div data-goto-block="holding"          style="…same…">Holding company</div>
    <div data-goto-block="founder"          style="…same…">The founder</div>
    <div data-goto-block="name"             style="…same…">The name</div>
    <div data-goto-block="end"              style="…same…">First record</div>
```
(Write the style out in full on each line — `…same…` is shorthand here only.) Keep `<span data-goto="0" …>↑ Return to surface</span>` in the end block as is; numeric `data-goto` remains supported.

Engine selectors that must still match: `this.bodyEls` selector is `p, [data-goto], [data-cue] span` — change it to `p, [data-goto], [data-goto-block], [data-cue] span`; `this.railEls` filter is `[data-goto]` + `writingMode` — change the query to `[data-goto],[data-goto-block]`. In `resize()`, the loop that hides rails when narrow uses `[data-goto]` — change to `[data-goto],[data-goto-block]`.

- [ ] **Step 5: Build, run the template tests**

Run: `python tools/build.py && python -m pytest tests/test_layout.py tests/test_build.py -v`
Expected: `test_layout.py` PASS (these are template tests). The page will not lay out correctly yet (no `top` values) — that is Task 6. `tests/test_surface.py::test_first_paint…` may fail until Task 6; that is expected.

- [ ] **Step 6: Commit**

```bash
git add index.template.html index.html tests/test_layout.py
git commit -m "feat(www): reorder the descent; add the river and the founder; literal rail" -m "Company first, name story last (verbatim). Silt becomes the company's gloss. Strata carry data-id/data-gap/data-hud so the engine can lay them out (next commit)." -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01Q6qRJSdMnaugGqp4BQx6s9"
```

---

### Task 6: Sequential layout in the engine (measure, don't assume)

**Files:**
- Modify: `index.template.html` (`resize()`, `onShaftClick`, `atBlock`, shaft height)
- Modify: `tests/test_layout.py`

**Interfaces:**
- Produces: `Instrument.layout()` (called from `resize()`); every stratum has `_top/_bot/_mid` and `_id`; `Instrument.blockById(id) -> el`; `STRATA` rebuilt; rail positioned; `[data-depth-label]` text written as `NNNN m — <label>`; shaft height = last bottom + viewport height.

- [ ] **Step 1: Write the failing tests** (append to `tests/test_layout.py`)

```python
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


def test_depth_labels_are_written_from_layout(browser, site):
    page = open_page(browser, site())
    labels = page.evaluate("() => [...document.querySelectorAll('[data-depth-label]')].map(e => e.textContent)")
    assert all(re.match(r"^\d{4} m — ", t) for t in labels), labels
    company_top = probe(page, "a.blockById('company')._top")
    assert labels[0].startswith(f"{round(company_top):04d} m — the company")


def test_adding_products_pushes_everything_below_the_rows(browser, site):
    four = open_page(browser, site()); eight = open_page(browser, site(ROOT / "tests/fixtures/products_8.json"))
    r4 = {r[0]: r for r in _rects(four)}; r8 = {r[0]: r for r in _rects(eight)}
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
    page.evaluate("""() => document.querySelector('[data-goto-block="founder"]')
        .dispatchEvent(new MouseEvent('click', {bubbles: true}))""")
    page.wait_for_timeout(1500)
    mid = probe(page, "a.blockById('founder')._mid")
    assert abs(probe(page, "a.depth") - mid) < 30
```

- [ ] **Step 2: Run to verify they fail**

Run: `python -m pytest tests/test_layout.py -v`
Expected: FAIL — `blockById` undefined, order/overlap assertions fail.

- [ ] **Step 3: Implement `layout()` and call it from `resize()`**

In `index.template.html`, inside `resize = () => {`, replace the block that begins `this.strataEls.forEach(el=>{` and ends after `this.maxD=Math.max(...)` (up to but not including `this.clamp();`) with:

```js
    const px=this.narrow?30:200, pr=this.narrow?24:56;
    this.strataEls.forEach(el=>{
      el.style.paddingLeft=px+'px'; el.style.paddingRight=pr+'px';
      el.style.maxHeight=Math.max(380,this.h-this.hudH-24)+'px';
    });
    this.layout();
    Array.from(this.shaftRef.current.querySelectorAll('[data-goto],[data-goto-block]')).forEach(el=>{
      if(el.style.writingMode) el.style.display=this.narrow?'none':'block';
    });
    // register each bore tick to its actual canal row centre (1px = 1m)
    const rowsBlk=this.blockById('rows');
    const rows=rowsBlk?Array.from(rowsBlk.querySelectorAll('[data-row][data-bore]')):[];
    BORE_D.length=0;
    rows.forEach(r=>BORE_D.push(Math.round(rowsBlk._top+r.offsetTop+r.offsetHeight/2)));
    this.maxD=Math.max(...this.strataEls.map(e=>e._mid));
```

Add these methods to the class (after `resize`):

```js
  blockById(id){ return this.strataEls.find(e=>e.dataset.id===id); }

  /* Sequential layout: each stratum sits a designed gap (data-gap, px = m)
     below the measured bottom of the one before it. Nothing about the page
     assumes how many products there are or how tall a block renders. */
  layout(){
    const H=el=>Math.max(el.offsetHeight,el.scrollHeight);
    let prevBot=null;
    for(const el of this.strataEls){
      el._id=el.dataset.id;
      const eh=H(el);
      if(el.getAttribute('data-anchor')==='center'){
        el.style.top=Math.round(-eh/2)+'px';
      }else{
        const gap=parseFloat(el.dataset.gap||'120');
        el.style.top=Math.round(prevBot+gap)+'px';
      }
      el._top=parseFloat(el.style.top); el._bot=el._top+eh; el._mid=el._top+eh/2;
      prevBot=el._bot;
      const lab=el.querySelector('[data-depth-label]');
      if(lab) lab.textContent=String(Math.round(Math.max(0,el._top))).padStart(4,'0')+' m — '+lab.dataset.label;
    }
    // the shaft must be at least as deep as the last block plus one screen
    this.shaftRef.current.style.height=Math.round(prevBot+this.h)+'px';
    // HUD strata: surface, then one per block that names itself
    STRATA.length=0; STRATA.push({d:0,n:'SURFACE',p:'dot'});
    for(const el of this.strataEls) if(el.dataset.hud) STRATA.push({d:el._top,n:el.dataset.hud,p:el.dataset.pattern||'dense'});
    // rail: each label spans its block (min 200 m so short blocks stay clickable)
    for(const r of this.shaftRef.current.querySelectorAll('[data-goto-block]')){
      const b=this.blockById(r.dataset.gotoBlock); if(!b) continue;
      const top=Math.max(0,b._top), span=Math.max(200,b._bot-top);
      r.style.top=Math.round(top)+'px'; r.style.height=Math.round(span)+'px';
    }
  }
```

In `onShaftClick`, before the `[data-goto]` line add:
```js
    const gb=e.target.closest('[data-goto-block]');
    if(gb){ const b=this.blockById(gb.dataset.gotoBlock); if(b){ this.target=b._mid; this.clamp(); this.jump(); } return; }
```

Also in `mount()`: the `resize()` call runs before fonts load, so add after `this.start();`:
```js
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>this.resize());
```

Geology bands: `draw()` iterates `STRATA[i].d` — it now reads the rebuilt array; no change needed.

- [ ] **Step 4: Build and run everything**

Run: `python tools/build.py && python -m pytest -v`
Expected: PASS, including `tests/test_surface.py::test_first_paint_shows_directory_without_scrolling`. If a section pair overlaps at one viewport, raise that block's `data-gap` in the template (values are design parameters; the test is the contract).

- [ ] **Step 5: Look at it**

Run: `python -m http.server 8830 --bind 127.0.0.1` then open `http://127.0.0.1:8830/`. Descend with `n`. Check: labels read `0nnn m — the company` etc.; the rail lines up with its blocks; rows at depth; river, holding, founder, name, first record in order; nothing overlaps.

- [ ] **Step 6: Commit**

```bash
git add index.template.html index.html tests/test_layout.py
git commit -m "feat(www): sequential layout — the descent grows with the product list" -m "Each stratum sits data-gap below the measured bottom of the one before it. Depth labels, rail, HUD strata, shaft height and maxD are derived. Adding a product adds one row and shifts everything below it." -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01Q6qRJSdMnaugGqp4BQx6s9"
```

---

### Task 7: Remove the overture (first paint is the surface)

**Files:**
- Modify: `index.template.html` (`INSTRUMENT_PROPS`, `overture()`), `tests/test_layout.py`

**Interfaces:**
- Produces: `showConfluence:false`; `overture()` renders the parked state when `!this.confluence`.

- [ ] **Step 1: Write the failing tests** (append to `tests/test_layout.py`)

```python
def test_no_overture_first_paint_is_the_surface(browser, site):
    page = open_page(browser, site(), 1280, 800)
    assert probe(page, "a.minD") == 0 and probe(page, "a.depth") == 0
    assert probe(page, "a.veil") in (1, None)  # ground not veiled
    assert page.locator('[data-ref="hudDepthRef"]').inner_text().startswith("DEPTH 0000")
    # the mark is parked in the masthead slot, not centred on screen
    slot = page.locator("[data-markslot]").bounding_box(); logo = page.locator('[data-ref="logoRef"]').bounding_box()
    assert abs((slot["x"] + slot["width"] / 2) - (logo["x"] + logo["width"] / 2)) < 40
    assert float(page.locator('[data-ref="eyebrowRef"]').evaluate("el => getComputedStyle(el).opacity")) == 0
    op = float(page.locator('[data-stratum][data-id="surface"]').evaluate("el => getComputedStyle(el).opacity"))
    assert op > 0.9
```

- [ ] **Step 2: Run to verify it fails**

Run: `python -m pytest tests/test_layout.py -k overture -v`
Expected: FAIL (`minD == -1150`).

- [ ] **Step 3: Flip the prop and park the overture**

In `INSTRUMENT_PROPS` set `showConfluence: false`.

In `overture(d,h)`, replace
```js
    const span=-(this.minD||-560);
    const u=cl((d-(this.minD||0))/span,0,1);
```
with
```js
    // with no overture the page opens already resolved: u=1 is the parked state
    // (mark in the masthead slot, arcs faded, veil lifted) that the animation
    // would otherwise reach at 0 m
    const span=-(this.minD||-560);
    const u=this.confluence?cl((d-(this.minD||0))/span,0,1):1;
```

`drawConfluence` already returns at `fade<=0.01` for `u=1`; `tick()`'s `live` is already gated on `this.confluence`. Leave both.

- [ ] **Step 4: Build and run**

Run: `python tools/build.py && python -m pytest -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.template.html index.html tests/test_layout.py
git commit -m "feat(www): no overture — first paint is the surface" -m "showConfluence:false; overture() renders its parked state so the mark sits in the masthead slot from the first frame." -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01Q6qRJSdMnaugGqp4BQx6s9"
```

---

### Task 8: HUD exits — `Products ↑` and `Read as one page` (document mode)

**Files:**
- Modify: `index.template.html` (HUD markup, `<style>`, engine: `toggleDoc`, `toSurface`, `onKey`), `tools/build.py` (doc-mode product tables rendered from `PRODUCTS` at toggle — no build change), `tests/test_docmode.py` (create)

**Interfaces:**
- Produces: `Instrument.toggleDoc()`, `Instrument.toSurface()`; `body[data-mode="doc"]`; `#doc` container; HUD buttons `[data-hud-products]`, `[data-hud-doc]`; key `D`.

- [ ] **Step 1: Write the failing tests**

`tests/test_docmode.py`:
```python
from pathlib import Path
from conftest import open_page, probe, goto
from test_layout import ORDER

ROOT = Path(__file__).resolve().parents[1]


def test_read_as_one_page_shows_every_section_once_in_order(browser, site):
    page = open_page(browser, site())
    goto(page, 1500)
    page.click("[data-hud-doc]"); page.wait_for_timeout(500)
    assert page.evaluate("document.body.dataset.mode") == "doc"
    ids = page.evaluate("() => [...document.querySelectorAll('#doc [data-stratum]')].map(e => e.dataset.id)")
    assert ids == ["surface"] + ORDER
    assert page.locator("#doc [data-stratum]").count() == len(ORDER) + 1
    # product tables follow the rows, one per product, with the three cells
    assert page.locator("#doc [data-doc-product]").count() == 4
    assert page.locator('#doc [data-doc-product="praix"] td').count() >= 3
    # nothing from section mode is visible
    assert page.locator('[data-ref="rootRef"]').evaluate("el => getComputedStyle(el).display") == "none"
    assert page.evaluate("document.body.scrollHeight") > 3000


def test_toggle_back_restores_section_mode_at_same_depth(browser, site):
    page = open_page(browser, site())
    goto(page, 2200); d0 = probe(page, "a.depth")
    page.keyboard.press("d"); page.wait_for_timeout(400)
    assert page.evaluate("document.body.dataset.mode") == "doc"
    page.keyboard.press("d"); page.wait_for_timeout(600)
    assert page.evaluate("document.body.dataset.mode") == "section"
    assert abs(probe(page, "a.depth") - d0) < 5
    assert page.locator("#doc [data-stratum]").count() == 0
    assert probe(page, "a.strataEls.every(e => e.parentNode === a.shaftRef.current)")
    assert page.errors == []


def test_products_up_returns_to_the_surface_rows(browser, site):
    page = open_page(browser, site())
    goto(page, 4000)
    page.click("[data-hud-products]"); page.wait_for_timeout(1600)
    assert probe(page, "a.depth") < 20
```

- [ ] **Step 2: Run to verify they fail**

Run: `python -m pytest tests/test_docmode.py -v`
Expected: FAIL — `[data-hud-doc]` not found.

- [ ] **Step 3: HUD markup**

In `index.template.html`, replace the `hudRef` div's children with:
```html
    <span data-ref="hudDepthRef" data-accent>Depth 0000</span>
    <span data-ref="hudLithRef" style="opacity:.55;">Surface</span>
    <button type="button" data-hud-products data-on-click="toSurface" style="pointer-events:auto;background:none;border:0;padding:0;color:inherit;font:inherit;letter-spacing:inherit;text-transform:inherit;cursor:pointer;opacity:.85;">Products ↑</button>
    <button type="button" data-hud-doc data-on-click="toggleDoc" aria-pressed="false" style="pointer-events:auto;background:none;border:0;padding:0;color:inherit;font:inherit;letter-spacing:inherit;text-transform:inherit;cursor:pointer;opacity:.85;">Read as one page</button>
    <span style="opacity:.4;">N / P · step stratum</span>
```
Add `<main id="doc" hidden></main>` immediately after the `rootRef` div's closing tag (before `<script>`).

- [ ] **Step 4: Document-mode CSS** (in the page's `<style>` block)

```css
  body[data-mode="doc"]{overflow:auto;height:auto;background:#F2EFE7;color:#14120F;}
  html[data-mode="doc"]{overflow:auto;height:auto;}
  body[data-mode="doc"] [data-ref="rootRef"]{display:none;}
  #doc{max-width:72ch;margin:0 auto;padding:64px 24px 120px;font-family:'Newsreader',Georgia,serif;font-weight:300;}
  #doc [data-stratum]{position:static!important;opacity:1!important;transform:none!important;pointer-events:auto!important;max-height:none!important;padding:0!important;margin:0 0 72px;border-bottom:1px solid rgba(20,18,15,.18);padding-bottom:56px!important;}
  #doc [data-stratum] p{color:#3A362E!important;}
  #doc [data-accent]{color:#14120F!important;}
  #doc [data-goto],#doc [data-cue],#doc [data-markslot]{display:none!important;}
  #doc [data-row]{border-color:rgba(20,18,15,.2)!important;}
  #doc .doc-products{margin:0 0 72px;}
  #doc .doc-products table{width:100%;border-collapse:collapse;font-size:14.5px;line-height:1.6;margin:18px 0 40px;}
  #doc .doc-products th{text-align:left;font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:#6B6558;padding:10px 12px 10px 0;vertical-align:top;width:11ch;}
  #doc .doc-products td{padding:10px 0;border-top:1px solid rgba(20,18,15,.14);vertical-align:top;color:#3A362E;}
  #doc .doc-products h3{font-weight:300;font-size:28px;margin:0 0 4px;}
  #doc .doc-hud{position:fixed;right:24px;top:20px;font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;}
```

- [ ] **Step 5: Engine methods**

Add to the class:

```js
  toSurface = () => {
    if(document.body.dataset.mode==='doc'){ window.scrollTo(0,0); return; }
    this.closeBore(); this.target=0; this.clamp(); this.jump();
  };

  /* Read as one page: the same nodes, moved (never copied) into a flowing
     document, plus one table per product from PRODUCTS. Toggling back hands
     the nodes to the shaft again and lands at the depth the reader left. */
  toggleDoc = () => {
    const doc=document.getElementById('doc'), body=document.body, html=document.documentElement;
    const btn=this.hudRef.current.querySelector('[data-hud-doc]');
    if(body.dataset.mode==='doc'){
      for(const el of this.strataEls) this.shaftRef.current.appendChild(el);
      doc.innerHTML=''; doc.hidden=true;
      body.dataset.mode='section'; html.dataset.mode='section';
      btn.setAttribute('aria-pressed','false'); btn.textContent='Read as one page';
      this.unbind(); this.bind(); this.resize(); this.lastDrawn=-999; this.frame(); this.start();
      return;
    }
    this.closeBore();
    body.dataset.mode='doc'; html.dataset.mode='doc';
    btn.setAttribute('aria-pressed','true'); btn.textContent='Read as section';
    const rowsIdx=this.strataEls.findIndex(e=>e.dataset.id==='rows');
    this.strataEls.forEach((el,i)=>{
      doc.appendChild(el);
      if(i===rowsIdx) doc.appendChild(this.docProducts());
    });
    const hud=document.createElement('div'); hud.className='doc-hud';
    const back=document.createElement('button'); back.type='button'; back.textContent='Read as section';
    back.style.cssText='background:none;border:1px solid currentColor;padding:8px 12px;color:inherit;font:inherit;letter-spacing:inherit;text-transform:inherit;cursor:pointer;';
    back.addEventListener('click',this.toggleDoc); hud.appendChild(back); doc.appendChild(hud);
    doc.hidden=false; window.scrollTo(0,0);
  };
  docProducts(){
    const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const wrap=document.createElement('div'); wrap.className='doc-products';
    const panelText=(id,title)=>{
      const p=this.boreRef.current.querySelector(`[data-panel="${id}"]`); if(!p) return '';
      const cell=[...p.querySelectorAll('div > div')].find(d=>d.textContent.trim()===title);
      return cell?cell.nextElementSibling.textContent:'';
    };
    wrap.innerHTML=PRODUCTS.map(p=>`
      <section data-doc-product="${esc(p.id)}">
        <h3>${esc(p.name)} <span style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#6B6558;margin-left:10px;">${esc(p.industry)}${p.status?' · '+esc(p.status):''}</span></h3>
        <p>${esc(p.lead)}</p>
        <table>
          <tr><th>Data</th><td>${esc(panelText(p.id,'Data'))}</td></tr>
          <tr><th>Language</th><td>${esc(panelText(p.id,'Language'))}</td></tr>
          <tr><th>Liability</th><td>${esc(panelText(p.id,'Liability'))}</td></tr>
          ${p.url?`<tr><th></th><td><a href="${esc(p.url)}">${esc(p.url.replace('https://',''))} →</a></td></tr>`:''}
        </table>
      </section>`).join('');
    return wrap;
  }
```

In `onKey`, first line, add:
```js
    if(e.key==='d'||e.key==='D'){ e.preventDefault(); this.toggleDoc(); return; }
    if(document.body.dataset.mode==='doc') return;
```

In `onWheel`, `onDown`: add `if(document.body.dataset.mode==='doc') return;` as the first line of each (so the page scrolls normally in doc mode).

The `boot()` loop that binds `data-on-click` already wires the two HUD buttons.

- [ ] **Step 6: Build and run**

Run: `python tools/build.py && python -m pytest -v`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add index.template.html index.html tests/test_docmode.py
git commit -m "feat(www): two exits at every depth — Products ↑ and Read as one page" -m "Document mode moves the strata into a flowing #doc (never duplicates them), adds one table per product from PRODUCTS, and hands everything back at the same depth." -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01Q6qRJSdMnaugGqp4BQx6s9"
```

---

### Task 9: Status glyphs and optional product screens

**Files:**
- Modify: `tests/test_surface.py`, `tests/test_build.py` (renderers already support both; this task proves them end-to-end and fixes anything missing)
- Create: `tests/fixtures/products_status.json`

- [ ] **Step 1: Fixture**

`tests/fixtures/products_status.json` — copy `products.json`; on PRAIX add `"status": "live", "status_note": "invitation"` and `"panel": {…, "screen": "assets/praix-screen.png"}`; on Vitreon add `"status": "building"`. Also create `assets/praix-screen.png` in the fixture's served dir — the `site()` fixture only copies `*.svg`; extend `conftest.make()` to also copy `ROOT/"assets"` if it exists, and for this test write a 2×2 PNG into the temp dir:

In `tests/conftest.py`, inside `make()` after the svg copy:
```python
            assets = directory / "assets"; assets.mkdir(exist_ok=True)
            from PIL import Image
            Image.new("RGB", (2, 2), (16, 15, 13)).save(assets / "praix-screen.png")
```

- [ ] **Step 2: Write the failing tests** (append to `tests/test_surface.py`)

```python
FXS = ROOT / "tests" / "fixtures" / "products_status.json"

def test_status_renders_glyph_and_word_only_where_set(browser, site):
    page = open_page(browser, site(FXS))
    rows = page.locator("[data-surface-rows] [data-bore]")
    assert rows.locator('[data-status="live"]').count() == 1
    assert rows.locator('[data-status="building"]').count() == 1
    assert rows.locator("[data-status]").count() == 2
    praix = page.locator('[data-surface-rows] [data-bore="praix"]').inner_text()
    assert "LIVE · INVITATION" in praix.upper()
    assert "LIVE" not in page.locator('[data-surface-rows] [data-bore="cortex"]').inner_text().upper()
    # deep rows and overlay/panels agree
    assert page.locator('[data-id="rows"] [data-bore="praix"] [data-status="live"]').count() == 1


def test_screen_image_only_where_provided(browser, site):
    page = open_page(browser, site(FXS))
    assert page.locator('[data-panel="praix"] img').count() == 1
    assert page.locator('[data-panel="alevant"] img').count() == 0
    assert page.locator('[data-panel="praix"] img').get_attribute("src") == "assets/praix-screen.png"


def test_default_products_have_no_status_markup(browser, site):
    page = open_page(browser, site())
    assert page.locator("[data-status]").count() == 0
```

- [ ] **Step 3: Run to verify**

Run: `python -m pytest tests/test_surface.py -k "status or screen" -v`
Expected: PASS if Task 2's renderers were written as above; if any assertion fails, fix the renderer in `tools/build.py` (not the test), rebuild, rerun.

- [ ] **Step 4: Commit**

```bash
git add tests/conftest.py tests/fixtures/products_status.json tests/test_surface.py tools/build.py index.html
git commit -m "test(www): status glyphs and optional screens, end to end" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01Q6qRJSdMnaugGqp4BQx6s9"
```

---

### Task 10: `tools/verify.py` — drift, overlap, contrast; docs

**Files:**
- Create: `tools/verify.py`
- Modify: `tools/README.md`, `tests/test_build.py`

**Interfaces:**
- Produces: `python tools/verify.py` → exit 0 when: `index.html` == fresh build; no stratum overlap at 1280×800 / 1440×900 / 1920×1080; every `p`, `[data-depth-label]`, `[data-surface-rows] span`, HUD button has composited contrast ≥ 4.5:1 against `colorAt(depth)` at its own block's mid depth; no page errors.

- [ ] **Step 1: Write the failing test** (append to `tests/test_build.py`)

```python
import subprocess, sys

def test_verify_passes_on_committed_site():
    r = subprocess.run([sys.executable, "tools/verify.py"], cwd=ROOT, capture_output=True, text=True)
    assert r.returncode == 0, r.stdout + r.stderr


def test_verify_fails_on_drift(tmp_path):
    drift = (ROOT / "index.html").read_text(encoding="utf-8").replace("Tigris Tech Labs", "Tigris Tech Lab", 1)
    p = tmp_path / "index.html"; p.write_text(drift, encoding="utf-8")
    r = subprocess.run([sys.executable, "tools/verify.py", "--index", str(p), "--no-browser"], cwd=ROOT, capture_output=True, text=True)
    assert r.returncode == 1 and "out of date" in r.stdout
```

- [ ] **Step 2: Run to verify it fails**

Run: `python -m pytest tests/test_build.py -k verify -v`
Expected: FAIL (no `tools/verify.py`).

- [ ] **Step 3: Write `tools/verify.py`**

```python
#!/usr/bin/env python
"""
verify.py — gate a push of the homepage.

  1. index.html must equal a fresh build of products.json + index.template.html.
  2. No two strata may overlap at 1280x800, 1440x900, 1920x1080.
  3. Every body/label/row/HUD text node must read at >= 4.5:1 against the
     ground colour at its own depth (composited alpha included).
  4. No page errors.

    python tools/verify.py            # all checks
    python tools/verify.py --no-browser   # drift check only
"""
import argparse, socket, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import build  # noqa: E402

VIEWPORTS = [(1280, 800), (1440, 900), (1920, 1080)]
TEXT_SELECTOR = "[data-stratum] p, [data-depth-label], [data-surface-rows] span, [data-ref='hudRef'] button, [data-ref='hudRef'] span"

CONTRAST_JS = r"""
(sel) => {
  const a = window.__tigris;
  const L = c => { const s = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
                   return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2]; };
  const eff = el => { let o = 1, n = el; while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
      o *= parseFloat(cs.opacity || '1'); n = n.parentElement; } return o; };
  const out = [];
  for (const el of document.querySelectorAll(sel)) {
    if (!el.textContent.trim()) continue;
    const blk = el.closest('[data-stratum]');
    const depth = blk ? blk._mid : a.depth;
    // paint the block fully lit so its computed colours are the lit ones
    if (blk) { a.target = depth; a.depth = depth; a.lastDrawn = -999; a.frame(); }
    const o = eff(el); if (o < 0.05) continue;
    const fg = getComputedStyle(el).color.match(/[0-9.]+/g).map(Number).slice(0, 3);
    const bg = window.__tigris_colorAt(depth);
    const comp = fg.map((c, i) => c * o + bg[i] * (1 - o));
    const l1 = L(comp), l2 = L(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    out.push({ text: el.textContent.trim().slice(0, 40), depth: Math.round(depth), ratio: +ratio.toFixed(2) });
  }
  return out;
}
"""


def free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--index", default=ROOT / "index.html")
    ap.add_argument("--no-browser", action="store_true")
    a = ap.parse_args(argv)
    fails = []

    fresh = build.build(ROOT / "products.json", ROOT / "index.template.html")
    if Path(a.index).read_text(encoding="utf-8") != fresh:
        print("FAIL drift: index.html is out of date — run python tools/build.py"); fails.append("drift")
    else:
        print("ok   drift: index.html matches a fresh build")
    if a.no_browser:
        return 1 if fails else 0

    from playwright.sync_api import sync_playwright
    port = free_port()
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "-d", str(ROOT)],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.8)
    try:
        with sync_playwright() as p:
            b = p.chromium.launch()
            for w, h in VIEWPORTS:
                page = b.new_page(viewport={"width": w, "height": h}); errs = []
                page.on("pageerror", lambda e: errs.append(str(e)))
                page.goto(f"http://127.0.0.1:{port}/index.html")
                page.wait_for_function("() => window.__tigris && window.__tigris.strataEls"); page.wait_for_timeout(700)
                rects = page.evaluate("() => window.__tigris.strataEls.map(e => [e.dataset.id, e._top, e._bot])")
                rs = sorted(rects, key=lambda r: r[1])
                for (ia, ta, ba), (ib, tb, bb) in zip(rs, rs[1:]):
                    if ba > tb:
                        print(f"FAIL overlap {w}x{h}: {ia} ({ta:.0f}-{ba:.0f}) into {ib} ({tb:.0f}-{bb:.0f})"); fails.append("overlap")
                low = [r for r in page.evaluate(CONTRAST_JS, TEXT_SELECTOR) if r["ratio"] < 4.5]
                for r in low:
                    print(f"FAIL contrast {w}x{h}: {r['ratio']}:1 at {r['depth']} m — {r['text']!r}"); fails.append("contrast")
                if errs:
                    print(f"FAIL errors {w}x{h}: {errs}"); fails.append("errors")
                if not low and not errs:
                    print(f"ok   {w}x{h}: no overlap, contrast >= 4.5, no errors")
                page.close()
            b.close()
    finally:
        srv.terminate()
    print("PASS" if not fails else f"FAILED: {sorted(set(fails))}")
    return 0 if not fails else 1


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Run**

Run: `python tools/verify.py && python -m pytest tests/test_build.py -k verify -v`
Expected: `PASS`, tests PASS. If a contrast failure appears for a gloss (`opacity:.62`), raise that gloss's opacity to `.7` in the template, rebuild, rerun — the check is the contract.

- [ ] **Step 5: Rewrite `tools/README.md`**

Replace the file's contents with:

````markdown
# tools

The homepage is a single static `index.html`, **generated** from two sources:

- `products.json` — the one product list (order = `canal`; `status` optional).
- `index.template.html` — the page, with six stamp markers.

```
python tools/build.py          # -> index.html
python tools/verify.py         # drift + overlap + contrast + errors; gates a push
python -m pytest               # the same checks as unit/browser tests, plus scaling fixtures
```

## Adding a product

1. Append an entry to `products.json` (copy an existing one; set `canal` to its
   position; `url` may be `null`; `status` may be omitted).
2. `python tools/build.py`
3. `python tools/verify.py`
4. Commit `products.json` **and** `index.html`. Vercel deploys `master`.

The surface shows up to six rows and then `All N canals →`. The descent shows
every row and grows to fit; everything below the rows is positioned from their
measured height at load, so nothing needs re-numbering.

## Editing copy

Edit `index.template.html`, never `index.html`. Every stratum is
`<div data-stratum data-id=… data-gap=… data-hud=… data-pattern=…>`; `data-gap`
is the space (px = m) below the previous block; the depth in each label is
written at load. Product copy lives in `products.json`.

## Legacy

`port-design-bundle.mjs` / `verify-port.py` ported the original Claude Design
export. The page is no longer re-ported; they are kept for history only.
````

- [ ] **Step 6: Commit**

```bash
git add tools/verify.py tools/README.md tests/test_build.py
git commit -m "tools(www): verify.py — drift, overlap, contrast, errors; pipeline docs" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01Q6qRJSdMnaugGqp4BQx6s9"
```

---

### Task 11: Definition-of-done pass and mobile check

**Files:**
- Modify: `tests/test_layout.py`, `docs/superpowers/specs/2026-09-05-homepage-directory-and-descent-design.md` (status line)

- [ ] **Step 1: Write the remaining spec §15 tests** (append to `tests/test_layout.py`)

```python
def test_mobile_390_loads_without_errors_and_rows_stack(browser, site):
    page = open_page(browser, site(), 390, 844)
    assert page.errors == []
    row = page.locator('[data-surface-rows] [data-bore="cortex"]')
    assert row.bounding_box()["width"] <= 390
    _assert_no_overlap(_rects(page))


def test_reduced_motion_path_lands_at_surface(browser, site):
    ctx = browser.new_context(viewport={"width": 1280, "height": 800}, reduced_motion="reduce")
    page = ctx.new_page(); page.goto(site())
    page.wait_for_function("() => window.__tigris && window.__tigris.strataEls"); page.wait_for_timeout(500)
    assert page.evaluate("window.__tigris.depth") == 0
    ctx.close()
```

- [ ] **Step 2: Run the whole suite and verify**

Run: `python tools/build.py && python -m pytest -v && python tools/verify.py`
Expected: all PASS; `PASS`.

- [ ] **Step 3: Walk the spec's definition of done (§15) by hand**

Open `python -m http.server 8830 --bind 127.0.0.1` → `http://127.0.0.1:8830/` at 1280×800:
1. Without scrolling: wordmark, paragraph, all rows, contact, cue visible; no overture.
2. Descend with `n` through every section; read each depth label.
3. Press `d` → the page as prose, in order, each once; `d` again → same depth.
4. From the bottom, click `Products ↑` → surface rows.
5. Click a surface row → panel; `Esc`.
Note anything wrong as a follow-up; do not fix here.

- [ ] **Step 4: Mark the spec implemented**

In the spec, change the `**Status:**` line to `**Status:** implemented on branch \`copy-pass\` (see plan 2026-09-05-homepage-directory-and-descent.md). Owner facts in §13 still default.`

- [ ] **Step 5: Commit**

```bash
git add tests/test_layout.py docs/superpowers/specs/2026-09-05-homepage-directory-and-descent-design.md
git commit -m "test(www): mobile + reduced-motion; spec marked implemented" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01Q6qRJSdMnaugGqp4BQx6s9"
```

---

## Self-review

**Spec coverage.** D1 instrument untouched — Tasks 6/7/8 change layout arithmetic, HUD and modes only. D2 — Tasks 2–4, 6; `test_no_silt_stratum_and_no_count_words`, `test_adding_products_pushes_everything_below_the_rows`. D3 — Task 3. D4 — Task 6 (unbounded rows). D5 — Task 5 (glosses, literal rail) + Task 6 (HUD names). D6 — Task 5 + `test_name_story_is_verbatim_from_master`. D7 — Task 7. D8 — Task 5. D9 — `products.json`. D10 — Task 5 + `test_data_language_liability_verbatim`. D11 — Task 8. D12 — Task 2 + Task 10. §4 surface — Task 3; contact line `[data-surface-contact]`. §9 overlay — Task 4. §10 status/screen — Tasks 2, 9. §11 doc mode — Task 8. §12 build/verify/noscript — Tasks 2, 10. §13 defaults — `products.json` has no `status`, today's order. §15: 1 (Task 3/7 tests), 2 (Task 6/10), 3 (Task 6), 4 (Task 4), 5 (Task 9), 6 (Task 8), 7 (Task 8), 8 (Task 11), 9 (Task 10), 10 (Task 10). Gap found and closed: `bodyEls`/`railEls` selectors needed `[data-goto-block]` — added in Task 5 Step 4.

**Placeholders.** Task 5 Step 4 uses `…same…` as an explicit shorthand for repeating one inline style — flagged as such in the step. No TBDs.

**Type consistency.** `build.build(products_path, template_path) -> str` used identically in conftest, tests, verify. `render_surface_rows / render_index_panel` stubbed in Task 2, filled in Tasks 3/4 with the same names. `blockById`, `layout`, `toggleDoc`, `toSurface` names match between engine and tests. `data-goto-block` in template, engine (`dataset.gotoBlock`) and tests. `STRATA` rebuilt in `layout()` and read in `draw()` and tests. Fixture names `FX8`, `FXS` consistent within `test_surface.py`.
