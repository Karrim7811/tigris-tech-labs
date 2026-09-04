# Tigris Tech Labs — Section A–A′

A single-screen geological section. There is no page to scroll: there is one virtual
**depth** value, 0.00–33.00 metres, and every visible thing — strata, light, copy,
instruments — is a function of it.

Static site, no build step, no framework, no dependencies except two Google Fonts.

```
index.html    semantic document (all copy lives here, never on the canvas)
styles.css    tokens, instrument plates, document mode, reduced motion
main.js       ES module: depth engine, light inversion, procedural geology, layout
tools/        verification harness (not part of the deployed site)
```

Serve the folder over HTTP (ES module + canvas need an origin):

```
python -m http.server 8800 -d .    # then open http://127.0.0.1:8800/
```

## Controls

| Input | Action |
| --- | --- |
| Wheel / trackpad | Inertial descent — impulse, friction 0.90, long glide |
| Drag (mouse / touch) | 1:1 grab, releases with flick momentum |
| `↓` / `↑` | ±0.6 m, eased over 420 ms |
| `PageDown` / `PageUp` | ±4 m |
| `Home` / `End` | Surface (0 m) / bedrock (33 m) |
| Depth ruler (left) | Click to jump, drag to scrub. It is a real `role="slider"` |
| `1`–`4` | Focus a borehole — dims the others, opens its field log |
| `Esc` | Unfocus |
| `D` | Document mode — the same content as ordinary typeset prose |
| `L` | Legend |
| Core swatches | Click or `Tab` + `Enter` on any of the 18 samples |

Depth clamps softly at 0 and 33 (rubber band, 0.14) and never snaps to a stratum
boundary. The hairline at **38 % of viewport height** is the current depth: whatever
crosses it is what the readout is reporting.

## The two mechanisms

**Depth → position.** `D_MAX = 33`, sight line `0.38h`, scale `0.42h` per metre.
A block of copy carries `data-anchor="<metres>"`; it is drawn at
`sightY + (anchor − d) × mpp` and lit fully within 1.35 m of its anchor, fading out
over the next 0.55 m. Nothing is positioned by document flow.

**Depth → light.** One `lightness(d)` curve (piecewise: slow to 11.6 m, fast collapse
to 14.6 m, long tail to 30 m) drives stratum colour, page background, vignette, and
the `--fg` custom property on `:root`, rewritten every frame. Ink runs from `#14120F`
at the surface to `#EDE7DA` at bedrock — the page inverts around a lamp depth of
**13.66 m**. A continuous dark-ink-over-light-ground → light-ink-over-dark-ground ramp
must mathematically pass through contrast 1:1, so the swap happens fast, inside an
eye-adaptation dip (`--adapt` falls to 0.04 for ±0.62 m) and **no body copy is
anchored in the 12.8–13.6 m window**. All instrument text sits on 0.88-alpha plates
and stays above 13:1 at every depth.

## Editing the copy

All prose is in `index.html`, one `<article class="band">` per passage:

```html
<article class="band" data-anchor="16.4" data-range="15.0 – 23.0 m" data-stratum="III. LIABILITY">
```

- `data-anchor` — the depth in metres at which the passage is at the sight line.
- `data-range` / `data-stratum` — printed in the label and in document mode.
- `.logs` inside a band holds the per-venture field-log entries. In section mode those
  same nodes are **moved** into `#logfield` and positioned permanently beside each
  borehole's core swatch for that stratum — that is the comparison the section exists to
  make. In document mode they are handed back to their article and become a mono table.
  They are never duplicated, so a screen reader hears each line once. Below 900px wide
  there is no corridor beside a casing, so the entries are hidden and the focused
  field-log plate is the reader instead.

Keep anchors at least ~1.7 m apart (the lit window is 1.35 m plus a 0.55 m fade), and
keep them out of **12.8–13.6 m**: copy placed there falls inside the ink inversion and
will not meet WCAG AA. A passage is treated as one indivisible block: it is clamped
inside the viewport so a display line can never be clipped, and if two blocks would
overlap, the one farther from the sight-line fades out.

## Editing the geology

`main.js`, top of file:

- `STRATA` — code, name, top/bottom in metres, and surface colour. Boundaries are
  redrawn as wobbly hand-drawn lines from the seed, never straight.
- `SHAFTS` — the four boreholes: label, sample prefix, industry, colour, the depth each
  reaches, and `drilling`. A shaft with `drilling: false` **terminates**: solid casing to
  its end depth, a terminal foot bar across the casing, one label
  `ALV · TERMINATED IN BEDROCK · 30.0 m`, and nothing whatsoever drawn below it. Only
  `VITREON` is `drilling: true` — it alone continues as a long-dashed, glowing borehole
  and it alone is labelled `DRILLING`, printed once at its termination. Do not dash a
  completed shaft: Vitreon's incompleteness is only meaningful because the others are
  visibly finished.
- Below 640px only two casings are drawn (one completed, plus Vitreon). Focusing a
  product swaps it into that pair, so every core stays reachable on a phone.
- `SAMPLES` is generated from `STRATA × SHAFTS`; each swatch gets a mono code such as
  `PRX·LIA-04` and a real focusable `<button>` over the painted rectangle.
- `SEED = 0x54494752` feeds a mulberry32 PRNG, so boundaries, grain (22 000 surface
  points plus a 26 000-point cloud that only paints below 13.2 m, where the ground is too
  dark for sparse specks to read), shaft wander and swatch placement are identical on
  every load. Change the seed
  and you get a different, equally deterministic site.

## Verification harness

```
python tools/contrast_model.py   # the colour maths, independent of the browser
python tools/qa.py               # Playwright: 6 viewports × ~35 depths
python tools/swatch_sweep.py     # every core sample is keyboard reachable
python tools/docshot.py          # document mode: log tables, node relocation
python tools/look.py             # quick screenshots at chosen depths
```

`tools/qa.py` starts its own server, writes `tools/qa_report.json` and screenshots to
`tools/shots/`. It measures real composited text contrast against the painted canvas
(median 9×9 sample), checks that no text rectangle overlaps a borehole, swatch, canvas
label or other block of copy, asserts that no display headline is ever clipped by a
viewport edge (heights 620/800/844/900/1024/1080), and exercises document mode, focus
mode and `prefers-reduced-motion`. Measured results live in `VERIFICATION.md`.

## Accessibility

- The DOM is a complete, readable document without JavaScript ordering: heading,
  passages, field logs, contact.
- `prefers-reduced-motion`: no inertia, no glide, no pulse — wheel and keys move depth
  directly, bands cut in and out, everything remains reachable.
- The canvas is `aria-hidden`; the ruler is a labelled slider with `aria-valuetext`
  in metres; every swatch has an `aria-label`; `#keyhelp` lists the keys for screen
  readers.
- Document mode (`D`) is a genuine reading view — 66ch measure, parchment ground,
  static ink, canvas off.
