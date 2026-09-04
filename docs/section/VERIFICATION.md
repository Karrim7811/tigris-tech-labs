# Verification record — Tigris Tech Labs / Section A–A′

Harness: `tools/qa.py` (Playwright, spawns its own static server), `tools/swatch_sweep.py`,
`tools/docshot.py`, `tools/look.py`, `tools/contrast_model.py`. Machine-readable output:
`tools/qa_report.json`, screenshots in `tools/shots/` and `tools/look/`.

Viewports in every sweep: **390×844, 768×1024, 1280×800, 1280×900, 1920×1080, 1600×620**
(the 900/800/620 heights are the display-clipping check the review asked for).

## Contrast — measured, not eyeballed

Method: at each depth the harness reads the painted canvas behind each text element
(median of a 9×9 pixel sample, so sediment grain specks cannot skew it), reads the
computed `--fg` and the element's *composited* opacity chain, then computes the WCAG
ratio of the real rendered ink against the real rendered ground.

Required depths, 1280×800. `fg vs bg` is the raw ink/ground pair; the remaining columns
are real rendered elements with their composited alpha applied. `field log` is the new
permanent per-product entry standing beside each casing.

| d (m) | fg vs bg | display | body | mono label | field log (mono / prose) |
| --- | --- | --- | --- | --- | --- |
| 0 | 16.27 | 16.27 | 14.15 | 12.03 | — |
| 5 | 11.72 | 11.72 | 10.32 | 9.09 | 9.62 / 10.52 |
| 10 | 7.60 | 7.60 | 6.69 | 6.32 | 6.06–6.55 / 6.32–7.00 |
| 15 | 10.98 | 10.83 | 10.24 | 7.13 | — |
| 20 | 12.84 | — (bare stratum, no copy anchored here) | | | |
| 25 | 15.12 | 15.23 | 13.59 | 11.87 | — |
| 30 | 15.67 | 15.74 (wordmark) | 15.77 (contact link) | 12.25 | — |

Worst measured value for **any** text at **any** alpha ≥ 0.12, across all six viewports
and ~35 probe depths: **5.29:1** (field-log mono product name, 10px, 1600×620, d = 11.1).
Zero elements below 4.5:1 anywhere. Full-strength worst equals that same 5.29:1 — after
this round no element is parked at a low opacity, so the mid-fade caveat from the
previous record no longer produces the worst case.

Instrument plates (ruler, readout, legend/document buttons) 16.27:1; focused field-log
plate 15.06:1.

## The ink inversion window

A continuous dark-ink-on-light-ground → light-ink-on-dark-ground ramp must pass through
contrast 1:1. The swap is therefore fast, centred on a lamp depth of 13.66 m, hidden
inside an eye-adaptation dip (`--adapt` → 0.04 for ±0.62 m), and **no copy is anchored
in 12.8–13.6 m**. Measured `--adapt`: 1.00 at 12.65 m, 1.00 at 12.9 m, 0.04 at 13.66 m,
1.00 at 14.4 m. The field-log entries are multiplied by the same `--adapt`, so they
disappear through the window too.

## Layout — the seven review fixes

1. **Meaning inversion (critical).** ALEVANT, PRAIX and CORTEX are `drilling: false`:
   solid casing to 30.0 m, a full-strength terminal foot bar across the casing, one mono
   label `ALV · TERMINATED IN BEDROCK · 30.0 m` (PRX, CRX likewise, stacked on separate
   rows so three long labels never collide), and **nothing drawn below the foot** — the
   loop returns before the dashed branch. Only VITREON has `drilling: true`. Evidence:
   `tools/look/1280x800_d29.0.png` (three feet + three TERMINATED labels, no dashes) and
   `tools/look/1280x800_d32.0.png` (only the violet dashed borehole continues).
2. **No display line is ever clipped.** Each band is laid out as one unit (label +
   display + body) whose centre is clamped inside a safe area (16px top, 22px bottom,
   plus half the block height). Where the viewport is too short to travel 1:1 across the
   whole fade window the parallax is geared down instead of the block being cut. The
   harness asserts `0 ≤ top` and `bottom ≤ innerHeight` for every `.display` of every
   band with opacity ≥ 0.12 at every probe depth: **0 clipped headlines** at all six
   viewports, including 900px, 800px and 620px heights.
   A second pass guarantees two blocks never overlap: the block farther from the
   sight-line fades as its neighbour closes in (`clear − 6 / 44`).
3. **The field carries information.** Each product's log line for the current stratum is
   permanently rendered beside its core swatch (mono name + core code, Newsreader 13.5px
   sentence), laid out per stratum row with automatic side flipping, width fitted to the
   corridor between casings, and suppressed if it would touch an instrument plate or the
   copy column. Focus mode remains the emphasis state on top of it. Same DOM nodes as
   document mode — they are *moved*, never duplicated (`tools/docshot.py` asserts
   11 in field / 1 in article in section mode, 12 in articles in document mode).
4. **Grain in the dark strata.** Per-particle alpha now scales with darkness
   (0.5 → 1.0), the radius no longer shrinks to sub-pixel, ink is a lighter-than-ground
   `#DDD5C3`, and a second 26 000-point cloud restricted to ≥13.2 m is drawn once the
   lamp is on. LIABILITY and BEDROCK read as ground: `tools/look/1280x800_d17.0.png`,
   `1280x800_d26.1.png`.
5. **Vitreon reads as a borehole, not a ruler.** Dash pattern `[30, 26]` at 2.4px with
   the violet glow retained, and `VITREON · DRILLING` printed **once**, at the
   termination.
6. **Mobile ≤640px.** Two representative casings only (a completed shaft and the one
   still drilling) at 0.40/0.76 of the width; casings, swatches and labels are clipped
   to `[clipTop, clipBot]` where `clipTop` sits 12px below the lower of the readout plate
   and the document button, so **no plate ever overlaps a casing**
   (`tools/look/390x844_d4.35.png`, `390x844_d17.0.png`). Focusing a product (keys 1–4 or
   its swatch) swaps that product into the pair, which is how all 18 cores stay
   reachable on a phone.
7. **Document mode.** Stratum name + depth range print **above** the headline
   (`.display::before`), never orphaned below it. Core codes sit on their own line in the
   log table (`doc_scroll1800.png`).

## Collisions — full matrix

Text-vs-borehole, text-vs-swatch, text-vs-text, text-vs-canvas-label and
display-clipped-by-viewport, at every probe depth:
**0 collisions of any kind at 390×844, 768×1024, 1280×800, 1280×900, 1920×1080, 1600×620.**

## Other checks

- **Console:** no errors or page errors on any viewport, in section mode, document mode,
  focus mode, legend or reduced motion.
- **Document mode (`D`):** canvas hidden, 66ch/660px measure, ~4.1k px of typeset prose,
  log entries returned to their articles as a mono table, ranges printed once above the
  headline.
- **prefers-reduced-motion:** `End` → 33.00, `Home` → 0.00, `PageDown` → 4.00, wheel
  moves depth directly with no inertia; no errors; every band and swatch reachable.
- **Keyboard:** all 18 core-sample swatches reachable across the depth sweep at both
  390px (with focus swapping) and 1280px — `tools/swatch_sweep.py`: 18/18, missing none.
- **Determinism:** SEED 0x54494752 through mulberry32. Geometry, both grain clouds,
  shaft wander and swatch rects are identical on every load. (Byte-identical *per code
  version*: adding the deep grain cloud consumed additional PRNG draws, so this build's
  wander differs from the previous build's — it is stable from load to load.)

## Not achieved / accepted trade-offs

1. **The 12.8–13.6 m band cannot carry copy.** Mathematically forced by a continuous ink
   inversion; mitigated by the adaptation dip and by anchoring no copy there.
2. **A band is visible for a shorter depth range on short viewports.** Because a block is
   never allowed to clip, its parallax is geared down (as low as ~0.35× at 620px height)
   rather than running past the edge. The block still moves with depth, but less than
   1 metre = `vh × 0.42` px when the viewport cannot afford it.
3. **Field-log entries are hidden below 900px width.** There is no corridor beside a
   casing at that width; the focused field-log plate is the reader on narrow screens, and
   document mode carries every line in full.
4. **VITREON has no LIABILITY core**, so its "In build." liability line appears only in
   document mode. That is the honest reading of a shaft that stops at 14.2 m.
