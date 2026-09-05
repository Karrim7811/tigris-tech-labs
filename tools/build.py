#!/usr/bin/env python
"""
build.py — stamp products.json into index.template.html and write index.html.

    python tools/build.py                 # products.json + index.template.html -> index.html
    python tools/build.py --check         # exit 1 if index.html differs from a fresh build

Stdlib only. The template carries six markers; each is replaced by markup
rendered from the product list, so every product surface is generated from
one file and none of them can drift.
"""
import argparse
import json
import sys
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
    base = (
        "display:inline-block;width:7px;height:7px;border-radius:50%;"
        "box-sizing:border-box;vertical-align:middle;margin-right:8px;"
    )
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
        st = (
            f'<span style="{MONO}font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;'
            f'color:#6B6558;margin-left:14px;">{e(sw)}</span>'
            if sw
            else ""
        )
        rows.append(
            f'        <div data-bore="{e(p["id"])}" data-row style="{border}padding:20px 0;display:flex;align-items:baseline;gap:26px;cursor:pointer;">\n'
            f'          <span style="{MONO}font-size:10px;letter-spacing:.24em;color:{e(p["colour"])};min-width:74px;">{glyph(p, p["colour"])}{canal(p)}</span>\n'
            f'          <div style="flex:1;"><div style="font-weight:300;font-size:clamp(26px,3.2vw,40px);">{e(p["name"])}</div>'
            f'<p style="max-width:520px;font-size:14px;line-height:1.55;margin-top:6px;">{e(p["lead"])}</p></div>\n'
            f'          <span style="{MONO}font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#6B6558;">{e(p["industry"])}{st}</span>\n'
            f'          <span style="{MONO}font-size:12px;color:#6B6558;">→</span>\n'
            f"        </div>"
        )
    return "\n".join(rows)


def render_surface_rows(products):
    shown = products[:SURFACE_CAP]
    rows = []
    for p in shown:
        sw = status_word(p)
        st = (
            f'<span style="{MONO}font-size:8.5px;letter-spacing:.16em;text-transform:uppercase;'
            f'color:#6B6558;margin-left:12px;">{e(sw)}</span>'
            if sw
            else ""
        )
        rows.append(
            f'          <div data-bore="{e(p["id"])}" data-row style="border-top:1px solid;padding:11px 0;display:flex;align-items:baseline;gap:18px;cursor:pointer;">\n'
            f'            <span style="{MONO}font-size:8.5px;letter-spacing:.24em;min-width:56px;color:{e(p["colour"])};">{glyph(p, p["colour"])}{canal(p)}</span>\n'
            f'            <span style="font-weight:300;font-size:22px;flex:1;line-height:1;">{e(p["name"])}</span>\n'
            f'            <span style="{MONO}font-size:8.5px;letter-spacing:.18em;text-transform:uppercase;color:#6B6558;">{e(p["industry"])}{st}</span>\n'
            f'            <span style="{MONO}font-size:10px;color:#6B6558;">→</span>\n'
            f"          </div>"
        )
    if len(products) > SURFACE_CAP:
        rows.append(
            f'          <div data-open-index data-row style="border-top:1px solid;padding:11px 0;display:flex;align-items:baseline;gap:18px;cursor:pointer;">\n'
            f'            <span style="{MONO}font-size:8.5px;letter-spacing:.24em;min-width:56px;color:#6B6558;">+{len(products) - SURFACE_CAP:02d}</span>\n'
            f'            <span style="font-weight:300;font-size:22px;flex:1;line-height:1;">All {len(products)} canals</span>\n'
            f'            <span style="{MONO}font-size:10px;color:#6B6558;">→</span>\n'
            f"          </div>"
        )
    return (
        '        <div data-surface-rows data-row style="max-width:620px;margin-top:22px;border-bottom:1px solid;">\n'
        + "\n".join(rows)
        + "\n        </div>"
    )


def _cell(colour, title, text):
    return (
        f'        <div style="background:#100F0D;padding:22px;"><div style="{MONO}font-size:9.5px;letter-spacing:.24em;'
        f'text-transform:uppercase;color:{colour};margin-bottom:11px;">{title}</div>'
        f'<p style="font-size:14px;line-height:1.7;opacity:.68;">{e(text)}</p></div>'
    )


def render_panels(products):
    out = []
    for p in products:
        c = e(p["colour_dark"])
        pn = p["panel"]
        link = (
            f'      <a href="{e(p["url"])}" target="_blank" rel="noopener" style="align-self:flex-start;margin-top:38px;white-space:nowrap;'
            f"display:inline-flex;align-items:center;gap:12px;{MONO}font-size:11px;letter-spacing:.2em;text-transform:uppercase;"
            f'color:{c};border:1px solid {c};padding:14px 22px;text-decoration:none;">{e(p["url"].replace("https://", ""))} →</a>\n'
            if p.get("url")
            else ""
        )
        screen = (
            f'      <img src="{e(pn["screen"])}" alt="{e(p["name"])} — product screen" '
            f'style="display:block;max-width:880px;width:100%;margin-top:30px;border:1px solid rgba(242,239,231,.14);">\n'
            if pn.get("screen")
            else ""
        )
        out.append(
            f'    <div data-panel="{e(p["id"])}" style="position:absolute;inset:0;display:none;flex-direction:column;justify-content:center;padding:clamp(28px,7vw,104px);overflow:auto;">\n'
            f'      <div style="{MONO}font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:{c};margin-bottom:24px;">{canal(p).title()} · {e(p["industry"].lower())}</div>\n'
            f'      <h2 style="font-weight:200;font-size:clamp(42px,7.4vw,108px);line-height:.92;margin-bottom:24px;">{e(p["name"])}</h2>\n'
            f'      <p style="max-width:520px;font-size:16px;line-height:1.8;opacity:.72;margin-bottom:42px;">{e(pn["intro"])}</p>\n'
            f'      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1px;background:rgba(242,239,231,.14);max-width:880px;">\n'
            + _cell(c, "Data", pn["data"])
            + "\n"
            + _cell(c, "Language", pn["language"])
            + "\n"
            + _cell(c, "Liability", pn["liability"])
            + "\n"
            f"      </div>\n{screen}{link}    </div>"
        )
    return "\n".join(out)


def render_index_panel(products):
    rows = []
    for p in products:
        sw = status_word(p)
        st = f' <span style="opacity:.6">· {e(sw)}</span>' if sw else ""
        link = (
            f'<a href="{e(p["url"])}" target="_blank" rel="noopener" style="color:{e(p["colour_dark"])};text-decoration:none;">{e(p["url"].replace("https://", ""))} →</a>'
            if p.get("url")
            else '<span style="opacity:.5">—</span>'
        )
        rows.append(
            f'        <div data-index-row style="display:grid;grid-template-columns:76px minmax(0, 1fr) auto;gap:8px 22px;align-items:baseline;padding:16px 0;border-top:1px solid rgba(242,239,231,.16);">\n'
            f'          <span style="{MONO}font-size:9.5px;letter-spacing:.24em;color:{e(p["colour_dark"])};">{canal(p)}</span>\n'
            f'          <div><div style="font-weight:300;font-size:clamp(22px,2.6vw,32px);line-height:1.05;">{e(p["name"])} <span style="{MONO}font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;opacity:.6;margin-left:10px;">{e(p["industry"])}{st}</span></div>'
            f'<p style="max-width:640px;font-size:14.5px;line-height:1.6;opacity:.72;margin-top:6px;">{e(p["lead"])}</p></div>\n'
            f'          <span style="{MONO}font-size:10.5px;letter-spacing:.14em;">{link}</span>\n'
            f"        </div>"
        )
    return (
        '    <div data-panel="index" style="position:absolute;inset:0;display:none;flex-direction:column;padding:clamp(28px,7vw,104px);overflow:auto;">\n'
        f'      <div style="{MONO}font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:#A98BD6;margin-bottom:24px;">The canals · {len(products)} products, one industry each</div>\n'
        '      <div style="max-width:980px;border-bottom:1px solid rgba(242,239,231,.16);">\n'
        + "\n".join(rows)
        + "\n      </div>\n    </div>"
    )


def render_noscript(products):
    n = len(products)
    blocks = []
    for i, p in enumerate(products):
        border = "border-top:1px solid rgba(20,18,15,.2);" + (
            "border-bottom:1px solid rgba(20,18,15,.2);" if i == n - 1 else ""
        )
        link = (
            f'          <a href="{e(p["url"])}" style="font-family:monospace;font-size:11px;letter-spacing:.1em;color:{e(p["colour"])};">'
            f'{e(p["url"].replace("https://", ""))} →</a>\n'
            if p.get("url")
            else ""
        )
        blocks.append(
            f'        <div style="{border}padding:20px 0;">\n'
            f'          <div style="font-family:monospace;font-size:10px;letter-spacing:.2em;color:{e(p["colour"])};margin-bottom:8px;">{canal(p)} · {e(p["industry"].upper())}</div>\n'
            f'          <h3 style="font-family:Georgia,serif;font-weight:300;font-size:22px;margin-bottom:8px;">{e(p["name"])}</h3>\n'
            f'          <p style="font-size:14.5px;line-height:1.65;color:#3A362E;margin-bottom:10px;">{e(p["lead"])}</p>\n'
            f"{link}        </div>"
        )
    return '      <div style="display:flex;flex-direction:column;">\n' + "\n".join(blocks) + "\n      </div>"


def render_products_js(products):
    slim = [
        {k: p.get(k) for k in ("id", "canal", "name", "industry", "url", "colour", "status", "status_note", "lead")}
        for p in products
    ]
    return "const PRODUCTS=" + json.dumps(slim, ensure_ascii=False, separators=(",", ":")) + ";"


RENDERERS = {
    "surface": render_surface_rows,
    "deep": render_deep_rows,
    "panels": render_panels,
    "index": render_index_panel,
    "js": render_products_js,
    "noscript": render_noscript,
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
            print("index.html is out of date — run: python tools/build.py")
            return 1
        print("index.html matches a fresh build")
        return 0
    out.write_text(fresh, encoding="utf-8", newline="\n")
    print(f"wrote {out} ({len(fresh):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
