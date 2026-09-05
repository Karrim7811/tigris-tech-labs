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

The ground's colour stops are derived from the layout too — paper through the
thesis, the stratum change is the turn, ink from the products block down — so
moving a section moves the light with it.

## Legacy

`port-design-bundle.mjs` / `verify-port.py` ported the original Claude Design
export. The page is no longer re-ported; they are kept for history only.
