#!/usr/bin/env python
"""
verify.py — gate a push of the homepage.

  1. index.html must equal a fresh build of products.json + index.template.html.
  2. No two strata may overlap at 1280x800, 1440x900, 1920x1080.
  3. Every body/label/row/HUD text node must read at >= 4.5:1 against the
     ground colour at its own depth (composited alpha included).
  4. No page errors.

    python tools/verify.py                # all checks
    python tools/verify.py --no-browser   # drift check only
"""
import argparse
import socket
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import build  # noqa: E402

VIEWPORTS = [(1280, 800), (1440, 900), (1920, 1080)]
TEXT_SELECTOR = (
    "[data-stratum] p, [data-depth-label], [data-surface-rows] span, "
    "[data-ref='hudRef'] button, [data-ref='hudRef'] span"
)

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
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--index", default=ROOT / "index.html")
    ap.add_argument("--no-browser", action="store_true")
    a = ap.parse_args(argv)
    fails = []

    fresh = build.build(ROOT / "products.json", ROOT / "index.template.html")
    if Path(a.index).read_text(encoding="utf-8") != fresh:
        print("FAIL drift: index.html is out of date — run python tools/build.py")
        fails.append("drift")
    else:
        print("ok   drift: index.html matches a fresh build")
    if a.no_browser:
        return 1 if fails else 0

    from playwright.sync_api import sync_playwright

    port = free_port()
    srv = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "-d", str(ROOT)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(0.8)
    try:
        with sync_playwright() as p:
            b = p.chromium.launch()
            for w, h in VIEWPORTS:
                page = b.new_page(viewport={"width": w, "height": h})
                errs = []
                page.on("pageerror", lambda e: errs.append(str(e)))
                page.goto(f"http://127.0.0.1:{port}/index.html")
                page.wait_for_function("() => window.__tigris && window.__tigris.strataEls")
                page.wait_for_timeout(700)
                rects = page.evaluate("() => window.__tigris.strataEls.map(e => [e.dataset.id, e._top, e._bot])")
                rs = sorted(rects, key=lambda r: r[1])
                for (ia, ta, ba), (ib, tb, bb) in zip(rs, rs[1:]):
                    if ba > tb:
                        print(f"FAIL overlap {w}x{h}: {ia} ({ta:.0f}-{ba:.0f}) into {ib} ({tb:.0f}-{bb:.0f})")
                        fails.append("overlap")
                low = [r for r in page.evaluate(CONTRAST_JS, TEXT_SELECTOR) if r["ratio"] < 4.5]
                for r in low:
                    print(f"FAIL contrast {w}x{h}: {r['ratio']}:1 at {r['depth']} m — {r['text']!r}")
                    fails.append("contrast")
                if errs:
                    print(f"FAIL errors {w}x{h}: {errs}")
                    fails.append("errors")
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
