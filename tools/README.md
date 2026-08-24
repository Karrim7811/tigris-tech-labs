# tools

The homepage is authored in Claude Design and exported as a `.dc.html` handoff
bundle. That export is a **prototype**, not shippable code: it runs on a
proprietary in-browser runtime (`<x-dc>`, `<helmet>`, `{{ ref }}` bindings, a
`DCLogic` base class from `support.js`), and the handoff README is explicit that
none of that runtime may ship.

These two scripts are the pipeline from that export to the static `index.html`
Vercel deploys. Nothing else in this repo has a build step, and this doesn't
add one — the output is a single self-contained file.

## Updating the site from a new design export

1. Unzip the bundle somewhere (these scripts don't read archives).

2. Port it:

   ```
   node tools/port-design-bundle.mjs <bundle-dir-or-.dc.html>
   ```

   Writes `index.html`. Add `--dry-run` to see what it would do first. It
   exits non-zero rather than emit a half-ported page, so if the design tool
   changes its export shape you get a clear failure naming the transform that
   no longer applies — not a silently broken homepage.

   Site-level `<head>` (title, description, canonical, OG tags, favicon) lives
   in the script, not in the design bundle, and survives every re-port. Edit it
   there.

3. Verify — this is the step that makes the port trustworthy:

   ```
   python -m http.server 8901 --bind 127.0.0.1                 # from the repo root
   python -m http.server 8902 --bind 127.0.0.1                 # from the bundle dir

   python tools/verify-port.py \
       --ported   http://127.0.0.1:8901/index.html \
       --original http://127.0.0.1:8902/<bundle>.dc.html
   ```

   Drives both the ported page and the original prototype through the same
   scripted descent, compares the HUD readout and the rendered pixels at seven
   positions, opens and closes every product panel, and checks a 390px
   viewport. Exits non-zero on any failure, so it can gate a push.

   Needs `pip install playwright pillow && playwright install chromium`.

4. Commit and push. Vercel auto-deploys `master` to www.tigristechlabs.com.

## Why the pixel comparison matters

The port rewrites the component shell and the ref plumbing, but leaves the
animation logic verbatim — one canvas, one rAF loop, direct `el.style`
mutation, no component state. A mistake there doesn't throw; it just renders
subtly wrong. Comparing frames against the prototype is the only check that
catches it. Expect a mean difference well under 1/255 — the residual is the
randomised paper grain and particle cuttings, which differ run to run even
between two loads of the same page.
