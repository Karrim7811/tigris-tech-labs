#!/usr/bin/env python
"""
verify-port.py — prove a ported index.html still behaves like the design bundle.

The ported page must be visually indistinguishable from the prototype running
on its own runtime. This drives both through the same scripted descent and
compares them frame by frame, then exercises the interactive surface.

    pip install playwright pillow && playwright install chromium

    # serve both, in two shells
    python -m http.server 8901 --bind 127.0.0.1          # from the repo root
    python -m http.server 8902 --bind 127.0.0.1          # from the bundle dir

    python tools/verify-port.py \
        --ported   http://127.0.0.1:8901/index.html \
        --original http://127.0.0.1:8902/Tigris%20v9.dc.html

--original is optional. Without it you get the smoke test but no pixel
comparison, which is the part that actually catches a bad port.

Exits non-zero if anything fails, so it can gate a push.
"""
import argparse
import statistics
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

# wheel ticks applied before each capture — cumulative descent through the page
STEPS = [0, 6, 10, 18, 30, 44, 60]

# a frame is a mismatch above this mean per-channel difference. The canvas
# paints randomised grain and particle "cuttings", so identical pages still
# differ slightly; anything real lands far above this.
MEAN_DIFF_TOLERANCE = 3.0


def descend(page, out_dir, tag):
    """Walk the page down through STEPS, capturing a frame at each stop."""
    frames = []
    applied = 0
    for i, total in enumerate(STEPS):
        while applied < total:
            page.mouse.wheel(0, 400)
            page.wait_for_timeout(40)
            applied += 1
        page.wait_for_timeout(1100)
        shot = out_dir / f'{tag}_{i}.png'
        page.screenshot(path=str(shot))
        frames.append({
            'shot': shot,
            'hud': page.evaluate("""() => {
                const hud = [...document.querySelectorAll('div')]
                    .map(e => e.textContent.trim())
                    .filter(t => /^(OVERTURE|DEPTH)/.test(t));
                return hud[0] || '';
            }"""),
        })
    return frames


def open_page(browser, url, errors):
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
    page.on('console', lambda m: errors.append(f'console: {m.text}') if m.type == 'error' else None)
    page.goto(url)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2500)
    return page


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ported', required=True, help='URL of the ported index.html')
    ap.add_argument('--original', help='URL of the .dc.html prototype (served with support.js)')
    ap.add_argument('--out', help='directory for screenshots (default: a temp dir)')
    args = ap.parse_args()

    out_dir = Path(args.out) if args.out else Path(tempfile.mkdtemp(prefix='verify-port-'))
    out_dir.mkdir(parents=True, exist_ok=True)

    failures = []
    port_errors, orig_errors = [], []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        page = open_page(browser, args.ported, port_errors)
        ported = descend(page, out_dir, 'port')

        # interactive surface: every panel opens by its trigger, Escape closes it
        bores = [el.get_attribute('data-bore') for el in page.locator('[data-bore]').all()]
        if not bores:
            failures.append('no [data-bore] triggers found on the ported page')
        for bore in bores:
            page.evaluate(
                """(id) => document.querySelector(`[data-bore="${id}"]`)
                       .dispatchEvent(new MouseEvent('click', {bubbles: true}))""", bore)
            page.wait_for_timeout(600)
            state = page.evaluate("""() => {
                const b = document.querySelector('[data-ref="boreRef"]');
                return {op: b.style.opacity, open: [...b.querySelectorAll('[data-panel]')]
                    .filter(p => p.style.display !== 'none').map(p => p.getAttribute('data-panel'))};
            }""")
            if state['op'] != '1' or state['open'] != [bore]:
                failures.append(f'panel "{bore}" did not open cleanly: {state}')
            page.keyboard.press('Escape')
            page.wait_for_timeout(400)
            if page.evaluate("""() => document.querySelector('[data-ref="boreRef"]').style.opacity""") != '0':
                failures.append(f'panel "{bore}" did not close on Escape')

        # narrow viewport must still render
        page.set_viewport_size({'width': 390, 'height': 844})
        page.wait_for_timeout(700)
        page.screenshot(path=str(out_dir / 'port_mobile.png'))
        page.close()

        original = None
        if args.original:
            opage = open_page(browser, args.original, orig_errors)
            original = descend(opage, out_dir, 'orig')
            opage.close()

        browser.close()

    print(f'\n  screenshots   {out_dir}')
    print(f'  canals        {", ".join(bores) if bores else "none"}')

    print('\n  descent (HUD readout at each stop)')
    for i, f in enumerate(ported):
        line = f'    {STEPS[i]:>3} ticks  {f["hud"]}'
        if original:
            match = f['hud'] == original[i]['hud']
            if not match:
                failures.append(f'HUD differs at step {STEPS[i]}: '
                                f'ported {f["hud"]!r} vs original {original[i]["hud"]!r}')
            line += '   ' + ('match' if match else 'MISMATCH')
        print(line)

    if original:
        from PIL import Image, ImageChops
        print('\n  pixel comparison against the prototype')
        diffs = []
        for i, (a, b) in enumerate(zip(original, ported)):
            ia = Image.open(a['shot']).convert('RGB')
            ib = Image.open(b['shot']).convert('RGB')
            if ia.size != ib.size:
                failures.append(f'frame {i} size mismatch: {ia.size} vs {ib.size}')
                continue
            px = list(ImageChops.difference(ia, ib).getdata())
            mean = sum(sum(q) for q in px) / (len(px) * 3)
            diffs.append(mean)
            flag = '' if mean <= MEAN_DIFF_TOLERANCE else '   OVER TOLERANCE'
            print(f'    frame {i}  mean abs diff {mean:6.2f}/255{flag}')
            if mean > MEAN_DIFF_TOLERANCE:
                failures.append(f'frame {i} differs from the prototype by {mean:.2f}/255')
        if diffs:
            print(f'    worst {max(diffs):.2f}/255, median {statistics.median(diffs):.2f}/255 '
                  f'(tolerance {MEAN_DIFF_TOLERANCE})')
    else:
        print('\n  no --original given: skipped the pixel comparison')

    # the getImageData hint is emitted by this harness, not by the page
    port_errors = [e for e in port_errors if 'willReadFrequently' not in e]
    orig_errors = [e for e in orig_errors if 'willReadFrequently' not in e]
    print(f'\n  console       ported: {port_errors or "clean"}')
    if args.original:
        print(f'                original: {orig_errors or "clean"}')
    failures.extend(f'console error on ported page: {e}' for e in port_errors)

    if failures:
        print('\n  FAILED')
        for f in failures:
            print(f'    - {f}')
        return 1
    print('\n  PASSED')
    return 0


if __name__ == '__main__':
    sys.exit(main())
