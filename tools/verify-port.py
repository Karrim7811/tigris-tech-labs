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
import re
import statistics
import sys
import tempfile
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

# wheel ticks applied before each capture — cumulative descent through the page
STEPS = [0, 6, 10, 18, 30, 44, 60]

# a frame is a mismatch above this mean per-channel difference. The canvas
# paints randomised grain and particle "cuttings", so identical pages still
# differ slightly; anything real lands far above this.
MEAN_DIFF_TOLERANCE = 3.0

# The no-JS fallback check compares against a fallback-only reference, and
# neither render touches the canvas — a correct fallback matches exactly.
# Measured: 0.000% when the fallback covers, 0.795% when the component
# paints over it. This sits an order of magnitude below the failure.
NOJS_PIXEL_TOLERANCE = 0.1


def check_noscript(browser, url, out_dir):
    """Prove the <noscript> fallback is what a JS-less visitor actually sees.

    Presence in the DOM is not the same as being visible: the fallback and the
    component root are both position:fixed, so without an explicit z-index the
    component wins on DOM order and paints straight over it. That bug shipped
    once already.

    This cannot be checked by inspecting the DOM, because with scripting off
    there is no way to run script in the page. So instead: render the page with
    JS disabled, render a reference document containing only the fallback, and
    compare pixels. If the fallback is covered, the two won't match.
    """
    html = urllib.request.urlopen(url, timeout=30).read().decode('utf-8', 'replace')
    block = re.search(r'<noscript>([\s\S]*?)</noscript>', html)
    if not block:
        return None, []   # no fallback in this design; nothing to check

    head = re.search(r'<head>([\s\S]*?)</head>', html)
    reference = f'<!DOCTYPE html>\n<html lang="en">\n<head>{head.group(1) if head else ""}</head>\n' \
                f'<body>\n{block.group(1)}\n</body>\n</html>'
    ref_file = (out_dir / 'nojs_reference.html').resolve()
    ref_file.write_text(reference, encoding='utf-8')

    shots = {}
    for tag, target, js_on in (('actual', url, False), ('reference', ref_file.as_uri(), True)):
        ctx = browser.new_context(viewport={'width': 1440, 'height': 900}, java_script_enabled=js_on)
        page = ctx.new_page()
        page.goto(target)
        page.wait_for_timeout(1800)
        shots[tag] = out_dir / f'nojs_{tag}.png'
        page.screenshot(path=str(shots[tag]))
        ctx.close()

    from PIL import Image, ImageChops
    a = Image.open(shots['actual']).convert('RGB')
    b = Image.open(shots['reference']).convert('RGB')
    if a.size != b.size:
        return None, [f'no-JS render size mismatch: {a.size} vs {b.size}']

    # Mean difference is the wrong metric here. Both renders are mostly empty
    # paper, so text bleeding through moves the mean by well under 1/255 —
    # a covered fallback and a correct one score the same. Count how many
    # pixels actually changed instead. Neither render involves the canvas, so
    # a correct fallback matches its reference exactly: 0.000%.
    px = list(ImageChops.difference(a, b).getdata())
    changed = sum(1 for q in px if max(q) > 32) / len(px) * 100

    problems = []
    if changed > NOJS_PIXEL_TOLERANCE:
        problems.append(
            f'the <noscript> fallback is not what renders with JS disabled '
            f'({changed:.3f}% of pixels differ from the fallback-only reference). '
            f'Almost always a stacking bug: give the fallback a z-index above '
            f'everything the component uses. Compare {shots["actual"].name} '
            f'against {shots["reference"].name}.')
    return changed, problems


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

        nojs_diff, nojs_problems = check_noscript(browser, args.ported, out_dir)
        failures.extend(nojs_problems)

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
    if nojs_diff is None:
        print('\n  no-JS         no <noscript> fallback in this build')
    else:
        print(f'\n  no-JS         fallback renders, {nojs_diff:.3f}% of pixels differ '
              f'from the fallback-only reference (tolerance {NOJS_PIXEL_TOLERANCE}%)')

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
