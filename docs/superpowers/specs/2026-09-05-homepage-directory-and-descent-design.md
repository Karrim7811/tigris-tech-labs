# Tigris Tech Labs homepage — directory at the surface, descent as the story

**Status:** implemented on branch `copy-pass` (see plan 2026-09-05-homepage-directory-and-descent.md). Owner facts in §13 still default.
**Branch:** `copy-pass` (off `master`). Supersedes the overture paragraph shipped in `563670e`.
**Site:** `index.html` — "Sounding 01", the single-file depth instrument. This design keeps it.

---

## 1. The problem

The live homepage is a 4,447 m scroll-driven descent. It is the site the owner
wants; the visual direction does not change. But:

- The metaphor and the offer decode at the same time. A visitor is working out
  what "silt" means while also working out what the company sells.
- The site says what it sells only at 2,720 m, and only behind a click.
- The first ~1,200 m is atmosphere — an overture, a critique of other products,
  two paragraphs of Mesopotamia — before the company is described.
- Wayfinding (rail, HUD) is in metaphor. A lost reader has no literal word to
  reach for.
- Products are hard-coded in five places, in prose and in markup, assuming a
  count of four. The company will build more.

Audited against six jobs a parent-company homepage must do — who we are, what we
do, what we sell, why trust us, what is different, what to do next — the live
page fails four.

## 2. Audience and role

The homepage is the **guarantee behind the products** (apple.com, about.google).
Every audience arrives with the same first question — *who is behind this?* —
and needs it answered in the first screen:

- product customers who found the parent and want routing to a product
- industry insiders who might bring the next product
- investors and partners evaluating the holding company
- talent

Products **route out** to their own domains (Google model). The parent is
directory + story; it hosts no product pages.

## 3. Decisions (locked)

| # | Decision |
|---|---|
| D1 | Keep the descent, its canvas, its interaction, its geology. Copy, order and data change; the instrument does not. |
| D2 | Nothing on the site may assume a product count. Products are data, rendered. |
| D3 | The surface (0 m) is the directory. It does the six jobs before any scroll. |
| D4 | The descent is the story. It may be as deep as the company is. |
| D5 | Metaphor stays but stops explaining: plain headline first, metaphor as an italic gloss beneath. Wayfinding is literal. |
| D6 | The name story is kept word for word and moved to the **bottom** of the descent, as the reward for descending rather than the toll for entering. |
| D7 | The overture (the −1150 → 0 m "scroll to begin" screen) is removed. First paint is the surface. *Owner may veto in review; see §13.* |
| D8 | Two new beats: **the river** (the shared layer / Tigris OS) after the products, and **the founder** before the name story. |
| D9 | Vitreon is a product — vertical SaaS for local business — not the house studio. |
| D10 | The spine of the descent is *listen → understand → build → remain*; "understand" is carried by data / language / liability, kept verbatim. |
| D11 | A **Read as one page** mode renders the whole argument as ordinary prose. |
| D12 | One product list (`products.json`) drives every product surface via a build step; the deployed file stays static. |

## 4. The surface (0 m) — first paint

Order, top to bottom, within the existing title stratum:

1. Eyebrow: `Sounding 01 · two currents, one confluence` (unchanged).
2. Wordmark `Tigris` / `TECH LABS` (unchanged).
3. Rule (unchanged).
4. **Pattern paragraph** — describes the pattern, never the instances:

   > An AI-native product holding company, named for the plain that two rivers built. We build products for single industries and go deeper into each one instead of wider across more. There is only how far down you are willing to go.

5. **Canal rows** — the same rows that exist at depth today, compacted:
   `CANAL nn` (product colour) · name · industry · `→`, hairline between rows.
   Rendered from `products.json`, ordered by `canal`. Clicking a row opens that
   product's bore panel (same behaviour as the deep rows).
   - Shows up to **6** rows. At 7 or more, shows 6 and a final row
     `All N canals →` which opens the **index overlay** (§9).
   - If a product has `status`, a status glyph in the product colour precedes
     the `CANAL nn` label and one word follows the industry (§10).
6. Footer line: `Open a canal to read its record` · `hello@tigristechlabs.com →`.
7. Cue: `↓ Scroll, drag, or arrow to descend` (unchanged).

The six jobs at 0 m: who (2, 4), what (4), what we sell (5), why trust — the
descent, different (4: "deeper not wider"), next (5, 6).

Height budget: the title stratum is measured at mount; the first descent block
is positioned beneath it (§8). Rows on viewports ≤ 900 px wrap the industry
label beneath the name.

## 5. The descent — new order

Every section keeps its existing markup form (label · headline · body · gloss).
Depth labels are rendered by the engine from computed positions (§8), so the
numbers below are indicative, not hard-coded.

| Order | Section | Content |
|---|---|---|
| 1 | **The company** | Moved up from 1200 m. H2 *An AI-native product holding company.* Body: listen first; "we do not enter a second industry to grow. We go further into the first one." Contact line. The silt line — *Loose silt. Nothing here has been under pressure long enough to hold anything up.* — becomes this section's italic gloss. The silt section as its own stratum is removed. |
| 2–4 | **What we learn first · I / II / III** | *Its data · Its language · Its liability.* Unchanged, verbatim. |
| 5 | **Thesis** | *Depth is the strategy.* Unchanged from `563670e`. Stratum-change marker follows. |
| 6 | **The products** | Intro: *Four products. One industry each.* → generalised to *One product per industry.* with body "Each product enters a single industry and stays close to the people it serves. Open one to read how it meets that industry's data, its language, and its liability." Gloss unchanged. |
| 7 | **Canal rows** | All products, each with name, industry, one plain sentence (`lead`), `→`. Rendered from data. Unbounded. |
| 8 | **The river** (new) | See §6.1. |
| 9 | **Why a holding company** | *What a holding company is for.* Time · foundation · focus. Unchanged from `563670e`. |
| 10 | **The founder** (new) | See §6.2. |
| 11 | **The name** | Moved from 0640 m. Content untouched: *Two rivers met here, and somebody had to start keeping count* … *That is the standard a record is held to.* Label: `the name · the first record`. |
| 12 | **End of section** | *You reached the first record. Most people stop in the silt.* + invitation paragraph + email (unchanged from `563670e`). |

Every section is laid out sequentially from measured heights with a designed
gap after each (§8). The surface (variable: up to six rows) and the canal rows
(variable: unbounded) are the two blocks whose height depends on data; all
others have fixed content, and their gaps are verified as minimums.

## 6. New copy

### 6.1 The river

> **label** `— the river · what the canals are cut from`
> **h2** One river. Many canals.
> **body** Every Tigris product runs on the same shared layer — the model routing, memory, evaluation and security that Tigris builds once and every product inherits. It is not something we sell. It is how the products stay honest, fast, and cheap to run — and why the fifth canal costs less to cut than the first.
> **gloss** *The canals differ. The water is the same.*
>
> Three cells in the philosophy-grid form:
> **01 — intelligence** One model layer for every product, escalating to a frontier model only when it has to.
> **02 — memory** What one product learns, the layer keeps.
> **03 — evaluation & security** One standard, applied to every product before it ships.

The owner may strike any cell. Nothing here names an internal system; "Tigris
OS" is not used on the page. The river is the name.

### 6.2 The founder

> **label** `— the founder`
> **h2** Built from the inside.
> **body** Tigris was founded by Karim Nasser after twenty years in commercial insurance and commercial real estate. PRAIX exists because he sat in the producer's chair. The method — listen, understand, build, remain — is how that experience becomes a product, and how the next one will.

No photo, no bio page. The owner confirms the name and the figure are public.

## 7. Wayfinding

- **Rail** (vertical labels, `data-goto`): `Surface · The company · What we learn · Thesis · The products · The river · Holding company · The founder · The name · First record`. Literal words; the metaphor is in the glosses and the geology.
- **HUD strata names** (`STRATA[].n`) match the rail.
- **HUD adds two exits**, present at every depth:
  - `Products ↑` — glides to the surface rows.
  - `Read as one page` — toggles document mode (§11).
- `N / P · step stratum` unchanged.

## 8. Layout and the engine

- **Measure, don't assume.** At mount (and on resize/fonts-ready), the engine
  lays sections out in §5 order: each section's `top` is the previous section's
  measured bottom plus that section's designed gap (`data-gap`, in metres).
  Rail entries, `STRATA` depths, `data-goto` targets and `maxD` are recomputed
  from the result; each section's depth label text is written by the engine
  from its computed top, so `1 m = 1 px` stays true. Bore ticks already work
  this way (`BORE_D`). Two blocks vary with data — the surface (rows) and the
  canal rows — everything else has fixed content.
- The designed gaps are the minimums a verification step enforces at 1280×800,
  1440×900 and 1920×1080: no section may render taller than the distance to
  the next, and no two sections may overlap at any depth.
- Colour stops (`STOPS`) are unchanged; everything below the rows is already in
  the dark range.
- **Overture removed:** `minD = 0`; `depth = target = 0` at mount for all
  visitors. The reduced-motion branch that already did this becomes the only
  branch. The confluence rail label and HUD state remain for 0 m.
- Body-colour recolouring through the light inversion applies to `<p>`; every
  new text node that must survive the inversion is a `<p>`.

## 9. The index overlay

Reuses the existing bore layer (`boreRef`). A panel `data-panel="index"` lists
every product: `CANAL nn` · name · industry · `lead` · status word (if set) ·
`url →`. Scrollable, unbounded. Opened only by `All N canals →` on the surface when
N > 6. `Esc` closes, as for bore panels.

## 10. Product data and status

`products.json` at the repo root — an array; one object per product:

```json
{
  "id": "praix",
  "canal": 3,
  "name": "PRAIX",
  "industry": "Commercial insurance",
  "url": "https://praix.ai",
  "colour": "#C4875A",
  "status": "live",
  "lead": "An AI-native CRM for commercial insurance producers — finds the right prospects, prepares the strategy, and hands over the next move.",
  "panel": {
    "intro": "An AI-native CRM and growth platform for commercial insurance. …",
    "data": "…", "language": "…", "liability": "…",
    "screen": "assets/praix-screen.png"
  }
}
```

- `canal` is the display order. Reordering is changing this number.
- `status` is optional: `live` | `building` | `planned`. Absent → no glyph, no
  word. Glyphs: filled dot · half-filled dot · dashed ring, in the product
  colour. Word: `live` / `in build` / `planned`. A `live` product with
  invitation-only access carries `"status_note": "invitation"` and renders
  `live · invitation`.
- `panel.screen` is optional. Present → the bore panel shows the image beneath
  the intro. Absent → nothing. No placeholder imagery.
- Initial data mirrors today's content: Cortex 1, Alevant 2, PRAIX 3, Vitreon 4;
  no `status` set on any product until the owner supplies them.

## 11. Read as one page (document mode)

Toggled by the HUD control or `D`. Renders the same DOM as ordinary flowing
prose: surface paragraph, canal rows as a list, every descent section in §5
order, panels' intro/data/language/liability as a table per product, contact.
Canvas, ruler, HUD hidden; body scrolls normally; light ground, dark ink.
Sections are moved, not duplicated, so screen readers hear each once.
Toggling back restores section mode at the same depth.

## 12. Build and no-JS fallback

- `index.template.html` holds the page with five stamp points:
  surface rows · deep rows · bore panels · the JS `PRODUCTS` array · the
  `<noscript>` product list.
- `tools/build.py products.json index.template.html → index.html`. Idempotent.
- `tools/verify.py` rebuilds to a temp file and fails if it differs from the
  committed `index.html`, and runs the height-budget check (§8) headless.
- `index.html` remains committed and is what deploys. No runtime fetch.
- The `<noscript>` fallback renders the pattern paragraph, every product with
  its lead and `url`, and the email — from the same data.

## 13. Facts the owner supplies (defaults apply until then)

| Fact | Default in this spec |
|---|---|
| Product order | Today's: Cortex, Alevant, PRAIX, Vitreon. Research suggests PRAIX first. |
| Per-product `status` | Unset — nothing renders. |
| River cells (§6.1) | As written; strike any. |
| Founder line (§6.2) | As written; name and "twenty years" from the owner's own notes. |
| Overture removal (D7) | Removed. Veto restores `minD = −1150` and the "scroll to begin" screen. |

## 14. Out of scope

Product pages on the parent domain · video · testimonials, logos, metrics ·
any new navigation bar · changes to the canvas, geology or interaction model ·
the Section A–A′ build (`section-aa` branch, parked).

## 15. Verification (definition of done)

1. At 1280×800, without scrolling: wordmark, pattern paragraph, all canal rows
   (≤ 6), contact and cue are visible. First paint is the surface (no overture).
2. Height budgets: no fixed block overflows at 1280×800, 1440×900, 1920×1080.
3. Add a fifth entry to `products.json`, build: a fifth row appears on the
   surface, in the deep rows, as a bore panel, in the fallback; every section
   below the rows shifts; no overlap; depth labels update; HUD strata correct.
4. Add three more (8 total): surface shows 6 + `All 8 canals →`; overlay lists 8.
5. `status` set on one product renders glyph + word there and nowhere else.
6. `Read as one page` shows every section in §5 order, once each; toggling back
   lands at the same depth.
7. `Products ↑` from 4,000 m lands on the surface rows.
8. No page errors at any tested viewport; reduced-motion path unchanged.
9. `tools/verify.py` passes; `index.html` is byte-identical to a fresh build.
10. Composited contrast of every new text node ≥ 4.5:1 at its depth.
