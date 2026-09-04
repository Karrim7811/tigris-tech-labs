# TIGRIS TECH LABS — "SECTION A–A′"

## THE ONE IDEA

The website is a **stratigraphic cross-section**. A survey plate of four boreholes
drilled into four industries. There is exactly ONE navigation axis: **DEPTH**.

The user does not scroll a page. The user **descends through ground**.

This is not decoration. It is the company's argument made structural:
- Generalist AI operates in the top 2 metres of every industry.
- Real defensibility is at depth: an industry's DATA, its LANGUAGE, its LIABILITY.
- "Depth is the strategy."

Reading order is **by constraint, not by product**. You descend through the DATA
layer and see how all four products meet data; then LANGUAGE; then LIABILITY;
then BEDROCK. This asserts that constraints are primary and products are
consequences.

## HARD PROHIBITIONS — violating any of these fails the brief

1. NO navbar. NO header. NO nav links. NO hamburger. NO logo-left/links-right bar.
2. NO hero section followed by feature cards. NO 3-up or 4-up card grid, ever.
3. NO "sections" stacked vertically in the normal sense. NO section padding rhythm.
4. NO footer with column lists.
5. NO gradient-on-dark "SaaS" look. NO glassmorphism. NO neon. NO purple-blue gradient.
6. NO generic icon set (Feather/Lucide/Heroicons). NO icons at all except the logo.
7. NO stock or generated photography. NO 3D blobs. NO abstract mesh backgrounds.
8. NO "Get Started" / "Learn More" / "Book a Demo" buttons.
9. NO testimonials, NO logo wall, NO stats counters, NO pricing, NO FAQ accordion.
10. NO invented metrics, customer names, funding figures, or team members.
11. NO Inter, Roboto, Poppins, Montserrat, Open Sans, Lato, Space Grotesk.
12. NO parallax-scrolling marketing page dressed up as this. The depth engine is
    the whole interface, not an effect applied to a page.

If a decision could have come from a template, it is the wrong decision.

## TECH

- Static. `index.html` + `styles.css` + `main.js` (ES module, no bundler). No framework.
- One `<canvas>` fixed full-viewport, z-index 0: procedural geology ONLY.
- ALL text lives in real semantic HTML in the DOM (z-index 1), positioned by the
  depth engine. Never draw copy into canvas. Screen readers and crawlers must get
  a complete document.
- Deterministic seeded PRNG (mulberry32) so geology is identical every load.
- 60fps target. Single rAF loop. Canvas sized to `devicePixelRatio` capped at 2.
- No dependencies except two Google Fonts.

## THE DEPTH ENGINE

Virtual depth `d`, in metres, from `0.0` to `33.0`.

Input → depth:
- `wheel` (and trackpad) → velocity impulse, inertial with friction ~0.90
- vertical drag (pointer) → 1:1 grab, releases with flick momentum
- touch swipe → same
- `ArrowDown`/`ArrowUp` ±0.6m, `PageDown`/`PageUp` ±4m, `Home` → 0, `End` → 33
- clicking or dragging the depth ruler → jump/scrub to that depth
- `1`–`4` focus a borehole, `Esc` unfocus, `D` toggles document mode
- Clamp at 0 and 33 with a soft rubber-band, not a hard stop.

Depth must feel like mass: heavy, slightly resistant, long glide. NOT snappy.
Never snap to strata. Continuous, free positioning.

Screen mapping: 1 metre = `vh * 0.42` px at rest. The canvas draws the section
window for `[d - 0.6*range, d + 1.4*range]` so there is always ground below.

## THE STRATA (the vertical content spine)

| Depth (m)   | Stratum        | Base colour (surface→deep) |
|-------------|----------------|----------------------------|
| 0.0 – 1.9   | TOPSOIL        | `#F2EFE7` paper            |
| 1.9         | **HARDPAN**    | near-black hard line       |
| 1.9 – 8.0   | I. DATA        | `#E4DCCB`                  |
| 6.0         | water table    | thin line + note           |
| 8.0 – 15.0  | II. LANGUAGE   | `#CBBFA8`                  |
| 15.0 – 23.0 | III. LIABILITY | `#8A7A62`                  |
| 23.0 – 30.0 | IV. BEDROCK    | `#2A2620`                  |
| 30.0 – 33.0 | END OF LOG     | `#14120F`                  |

Boundaries between strata are **hand-drawn wobbles**, never straight lines:
low-frequency sine sum + seeded jitter, ~6–14px amplitude, redrawn identically
each frame (deterministic, not animated noise).

### THE LIGHT INVERSION (most important visual move)

Ambient light falls off with depth. Interpolate a single `lightness` value from
`d`: 1.0 at surface → 0.0 at 30m.

- Page background and strata darken continuously toward `#14120F`.
- **Body text colour inverts across the descent**: `#14120F` at surface →
  `#EDE7DA` at bedrock. Interpolate in `main.js` and set a CSS custom property
  `--fg` on `:root` each frame. Never let contrast drop below WCAG AA at any
  depth — verify at 0, 5, 10, 15, 20, 25, 30m.
- A vignette tightens with depth.
- Below the hardpan, sediment grain gets finer and denser.

The site therefore transforms from a paper survey drawing in daylight into a lit
shaft in the dark. This transformation IS the payoff.

## THE FOUR BOREHOLES

Four vertical shafts drawn on canvas, evenly distributed across the middle 62% of
the viewport width. Each is a ~3px casing line with a soft coloured glow, drilled
downward from y=0.

| # | Key      | Industry            | Colour    | Terminates |
|---|----------|---------------------|-----------|------------|
| 1 | ALEVANT  | real estate         | `#C4875A` | 30.0 m     |
| 2 | PRAIX    | insurance / risk    | `#C86A2F` | 30.0 m     |
| 3 | CORTEX   | peptides / lifesci  | `#1A8A9E` | 30.0 m     |
| 4 | VITREON  | (in build)          | `#6B4C9A` | **14.2 m** |

VITREON's casing **stops at 14.2m** and continues below as a faint dashed line
with a mono label `DRILLING`. Its incompleteness is the honest point — do not
"fix" it by extending it.

Shafts are not perfectly straight: each deviates with its own seeded low-frequency
wander (±1.5% viewport width) — real boreholes drift.

### Core samples

Where a shaft crosses a stratum, draw a **sample swatch**: a small rectangle
(~26×34px) on the casing, filled with that shaft's colour at low alpha over the
stratum grain, with a mono code beside it, e.g. `ALV·DAT-02`.

Sample swatches are the only clickable objects in the geology. Hovering raises
the swatch and shows the shaft name. Clicking **focuses** that borehole.

### Focus state

On focus (click swatch, or keys 1–4):
- The focused shaft's glow strengthens; the other three drop to ~18% opacity.
- That product's log entry for the current stratum opens in the **right margin**
  as a monospace field log: product name, industry, and its 1–2 sentence entry.
- `Esc` or clicking empty ground unfocuses.
- Focus persists as you descend, so you can read one product's whole column.

## INSTRUMENTATION (this replaces navigation entirely)

**Left edge — depth ruler.** Fixed, ~64px wide, full height. Tick marks every
0.2m, labelled every 1m in mono at 10.5px. Scrolls with depth so the current
depth sits at a fixed sight-line at 38% viewport height, marked by a thin
full-width hairline and the live depth readout. The ruler is draggable to scrub.
This is the only navigational affordance and it reads as an instrument, not a menu.

**Top right — readout.** Mono, 10.5px, letterspaced, 3 lines:
```
TIGRIS TECH LABS · SECTION A–A′
STRATUM  III. LIABILITY
DEPTH    18.42 m
```
Depth updates live with `tabular-nums`. If a shaft is focused, add a 4th line
`CORE     PRAIX / PRX·LIA-03`.

**Bottom centre — the only instruction.** `DESCEND ↓` in mono, gently pulsing.
Fades permanently after the user's first depth input. Never returns.

**The legend (jump-to).** Bottom-left, a small mono button `LEGEND`. Opens an
overlay styled as the key block of a survey plate: the six strata with their
depth ranges, right-aligned, clickable to glide to that depth. This is the
necessary escape hatch for usability — but it is drawn as a legend, not a menu.
Closes on `Esc` or selection.

## CONTENT — use this copy VERBATIM. Write no other marketing prose.

### 0.0m — SURFACE
- Logo (SVG, see below) + wordmark `TIGRIS TECH LABS`
- mono: `AI-NATIVE PRODUCT HOLDING COMPANY · SECTION A–A′ · SHEET 1 OF 1`
- display: `Everything works at the surface.`
- body: `General-purpose intelligence performs beautifully in the first two metres of any industry. It drafts, it summarises, it answers. It is also, at that depth, identical for everyone — and defensible by no one.`

### 1.9m — HARDPAN
- mono: `HARDPAN · 1.9 m`
- display: `Most products stop here.`
- body: `Below this line the work stops being general. The data gets worse, the language gets specific, and someone becomes liable for the answer. This is where we start.`

### 2.0–8.0m — I. DATA
- display: `Every industry's real data is worse than its demo.`
- body: `It lives in scanned addenda, in phone calls, in a spreadsheet one person maintains, in a field that means two different things depending on who filled it in. You cannot reason past this from the outside. You have to go and get it, understand why it is shaped that way, and build for the shape it actually has.`
- Logs: ALEVANT `Leases, rent rolls and estoppels — no two formatted alike, all legally operative.` / PRAIX `Loss runs, schedules of values and submissions that arrive as email attachments.` / CORTEX `Assay results, synthesis routes and literature that contradicts itself.` / VITREON `In build.`

### 6.0m — water table
- mono note only: `WATER TABLE · 6.0 m · everything below this line is saturated with context`

### 8.0–15.0m — II. LANGUAGE
- display: `Words here are load-bearing.`
- body: `"Occupancy" is not a synonym for "utilisation." "Material" has a threshold. "Adverse" has a definition someone will litigate. A model that treats these as ordinary English will be fluent, confident, and wrong in the way only a practitioner can see — which is the most expensive kind of wrong.`
- Logs: ALEVANT `A clause is not a sentence. It is an obligation with a date attached.` / PRAIX `Wording decides recovery. The same event is covered or excluded on a phrase.` / CORTEX `Nomenclature is identity. One character changes the molecule.` / VITREON `In build.`

### 15.0–23.0m — III. LIABILITY
- display: `Someone signs their name to the answer.`
- body: `This is the layer that decides whether software is allowed to act — not whether it can, but whether anyone will accept the consequence when it is wrong. Get this layer right and the product can do real work. Get it wrong and you have a demo, permanently.`
- Logs: ALEVANT `An abstraction error moves money at closing.` / PRAIX `A mispriced risk is carried for the life of the policy.` / CORTEX `A wrong result is discovered downstream, expensively.` / VITREON `In build.`

### 23.0–30.0m — IV. BEDROCK
- display (largest type on the site): `Depth is the strategy.`
- body: `Each product we build starts from a single industry's real constraints — its data, its language, its liability — and stays there until it is indispensable to the people doing the work. We do not broaden. We go down.`

### 30.0–33.0m — END OF LOG
- wordmark `TIGRIS TECH LABS`
- mono: `SECTION A–A′ · END OF LOG`
- contact: `hello@tigristechlabs.com` as a mailto, set in Newsreader at display size, underline on hover only
- mono, small, muted: `Depths on this section are a diagram, not a measurement.`

## TYPE

- Display/body: **Newsreader** (Google), weights 300/400, italic available.
  Use the italic for the emphasised half of display lines.
- Instrument/mono: **JetBrains Mono** (Google), weight 400, `letter-spacing: .16em`,
  uppercase for labels.
- Display sizes: `clamp(38px, 6.2vw, 104px)`, line-height 1.02, `text-wrap: balance`.
- Body: `clamp(16px, 1.15vw, 19px)`, line-height 1.68, max-width `38ch`.
- Mono labels: 10.5–11.5px. Absolute floor 10.5px.
- Two fonts only. Ever.

## COMPOSITION

Type must never sit on top of a borehole or a sample swatch. Reserve a text
column in the left third (x from ruler edge to 34% viewport width) for display +
body copy; the boreholes occupy the middle 62% starting at 36%. Field logs open
in the right margin (from 78% width). On narrow viewports the boreholes compress
and type moves below them — verify no collision at 390px, 768px, 1280px, 1920px,
and at 1600×620 (short viewport).

Content per stratum fades and rises into place as its depth band enters the
sight-line, and fades out as it leaves. Opacity/translate only, driven by depth
proximity — NOT IntersectionObserver, NOT scroll-triggered CSS.

## LOGO (inline SVG, required)

A borehole mark that is also a `T`: one horizontal rule (the ground surface) and
one vertical line descending through and well past it (the shaft), with a small
open circle at the collar where they meet. Monochrome, `currentColor`, 1.5px
strokes, `viewBox="0 0 24 24"`, legible at 20px. Generate a matching 32×32 favicon
as an inline data-URI SVG.

## ACCESSIBILITY — non-negotiable

- Full content in DOM in correct reading order, real `<h1>`/`<h2>`/`<p>`.
  The canvas is `aria-hidden="true"`.
- **Document mode**: `D`, or a mono `READ AS DOCUMENT` toggle top-right. Flattens
  everything into a single beautifully typeset linear paper document on parchment
  — ruler, canvas and depth engine off, normal page scroll, 66ch measure,
  strata become `<h2>`s with their depth ranges. Must be genuinely pleasant to
  read, not a fallback dump. Toggle back with the same control.
- `prefers-reduced-motion: reduce`: no inertia (direct 1:1 depth), no drifting
  sediment, no pulsing, instant band transitions. Still fully navigable.
- Keyboard: every sample swatch reachable by `Tab` with a visible focus ring;
  full depth control from the keyboard.
- Canvas painting pauses on `document.hidden`.
- Focus-visible rings everywhere, 2px, offset 2px, current `--fg`.

## DELIVERABLES

`/home/user/workspace/tigris-site/` → `index.html`, `styles.css`, `main.js`,
`README.md` (controls + how to edit the copy and the strata table).
`git init` and commit at milestones. Do NOT deploy — the parent agent deploys.
