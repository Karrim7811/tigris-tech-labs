/* ══════════════════════════════════════════════════════════════════════
   TIGRIS TECH LABS — SECTION A–A′
   One navigation axis: depth. One canvas: procedural geology.
   No dependencies. ES module.

   Reading order of this file:
     1. constants + seeded PRNG            2. colour / light inversion
     3. depth engine (input + physics)     4. geology generation
     5. canvas painting                    6. DOM positioning + instruments
     7. focus, legend, document mode       8. loop
   ══════════════════════════════════════════════════════════════════════ */

/* ── 1. CONSTANTS ─────────────────────────────────────────────────── */

const D_MAX = 33.0;
const SIGHT = 0.38;          // sight-line at 38% of viewport height
const MPP_VH = 0.42;         // 1 metre = 42% of viewport height at rest
const FRICTION = 0.90;       // heavy: long glide
const RUBBER = 0.14;         // soft clamp
const SEED = 0x54494752;     // "TIGR"

const DEEP = [0x14, 0x12, 0x0f];
const PAPER_PLATE = [0xf2, 0xef, 0xe7];
const DARK_PLATE = [0x10, 0x0e, 0x0c];
const INK_DARK = [0x14, 0x12, 0x0f];
const INK_LIGHT_NEAR = [0xe3, 0xdc, 0xcd];
const INK_LIGHT_DEEP = [0xed, 0xe7, 0xda];
const LAMP_L = 0.45;         // lightness at which the lamp comes on

const STRATA = [
  { code: 'TOP', name: 'TOPSOIL',        top: 0,    bot: 1.9,  sd: 1.05, col: [0xf2, 0xef, 0xe7] },
  { code: 'DAT', name: 'I. DATA',        top: 1.9,  bot: 8.0,  sd: 5.05, col: [0xe4, 0xdc, 0xcb] },
  { code: 'LNG', name: 'II. LANGUAGE',   top: 8.0,  bot: 15.0, sd: 11.1, col: [0xcb, 0xbf, 0xa8] },
  { code: 'LIA', name: 'III. LIABILITY', top: 15.0, bot: 23.0, sd: 17.1, col: [0x8a, 0x7a, 0x62] },
  { code: 'BED', name: 'IV. BEDROCK',    top: 23.0, bot: 30.0, sd: 26.1, col: [0x2a, 0x26, 0x20] },
  { code: 'EOL', name: 'END OF LOG',     top: 30.0, bot: 33.0, sd: 31.5, col: [0x14, 0x12, 0x0f] },
];
const HARDPAN = 1.9;
const WATER = 6.0;

/* Three shafts are COMPLETE: they terminate in bedrock at 30.0 m with a solid
   terminal foot and nothing whatsoever below it. Only VITREON is still being
   drilled — it alone is dashed, it alone is labelled DRILLING. That contrast is
   the point of the drawing; do not blur it. */
const SHAFTS = [
  { key: 'ALEVANT', pre: 'ALV', industry: 'REAL ESTATE',        col: [0xc4, 0x87, 0x5a], end: 30.0, drilling: false },
  { key: 'PRAIX',   pre: 'PRX', industry: 'INSURANCE / RISK',   col: [0xc8, 0x6a, 0x2f], end: 30.0, drilling: false },
  { key: 'CORTEX',  pre: 'CRX', industry: 'PEPTIDES / LIFESCI', col: [0x1a, 0x8a, 0x9e], end: 30.0, drilling: false },
  { key: 'VITREON', pre: 'VTR', industry: 'LOCAL BUSINESS',     col: [0x6b, 0x4c, 0x9a], end: 14.2, drilling: true },
];
/* below 640px only two representative casings are drawn — one completed shaft
   and the one still drilling, so the contrast survives the narrow viewport */
const TWO_UP = [1, 3];

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/* ── 2. LIGHT INVERSION ───────────────────────────────────────────── */
/* One lightness value drives strata colour, page background, vignette
   and body ink. The curve is deliberately piecewise: it holds daylight
   through the DATA layer, drops hard through the lower LANGUAGE layer
   (where no body copy is at the sight-line), then eases to black.
   Contrast is measured, not eyeballed — see tools/contrast_model.py.   */

function lightness(d) {
  if (d <= 11.6) return 1.0 - 0.18 * (d / 11.6);
  if (d <= 14.6) return 0.82 - 0.54 * ((d - 11.6) / 3.0);
  if (d <= 30.0) return 0.28 - 0.28 * ((d - 14.6) / 15.4);
  return 0.0;
}

/* The lamp: below LAMP_L the ink inverts. Body copy is fully faded out
   across the crossover band, and a short eye-adaptation dip hides the
   swap itself, so no text is ever rendered at sub-AA contrast. */
const LAMP_D = (() => {
  let lo = 11.6, hi = 14.6;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (lightness(m) > LAMP_L) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
})();

const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const css = (c) => `rgb(${Math.round(c[0])} ${Math.round(c[1])} ${Math.round(c[2])})`;
const rgba = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

function stratumAt(d) {
  for (const s of STRATA) if (d < s.bot) return s;
  return STRATA[STRATA.length - 1];
}
function stratumColour(s, L) { return mixc(DEEP, s.col, L); }

function inkFor(L) {
  if (L >= LAMP_L) return INK_DARK;
  return mixc(INK_LIGHT_NEAR, INK_LIGHT_DEEP, clamp((LAMP_L - L) / LAMP_L, 0, 1));
}

/* ── 3. DEPTH ENGINE ──────────────────────────────────────────────── */

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

const S = {
  d: 0,             // depth, metres
  v: 0,             // velocity, metres/frame
  drag: null,       // {y, d, t, vy}
  glide: null,      // {from, to, t0, dur}
  focus: -1,
  hover: -1,
  touched: false,
  legend: false,
  mode: 'section',
  w: 0, h: 0, mpp: 0, sightY: 0, dpr: 1,
  L: 1, ink: INK_DARK, adapt: 1,
};

function setDepth(v) { S.d = clamp(v, OVERTURE_M, D_MAX + 1.2); }
function firstTouch() {
  if (S.touched) return;
  S.touched = true;
  descend.classList.add('gone');
}
function impulse(dv) {
  firstTouch();
  S.glide = null;
  if (reduceMotion.matches) setDepth(S.d + dv * 6);
  else S.v += dv;
}
function glideTo(target, dur = 950) {
  firstTouch();
  if (reduceMotion.matches) { setDepth(target); S.v = 0; return; }
  S.v = 0;
  S.glide = { from: S.d, to: clamp(target, 0, D_MAX), t0: performance.now(), dur };
}

function physics(now) {
  if (S.glide) {
    const t = clamp((now - S.glide.t0) / S.glide.dur, 0, 1);
    const e = 1 - Math.pow(1 - t, 3);
    S.d = lerp(S.glide.from, S.glide.to, e);
    if (t >= 1) S.glide = null;
    return;
  }
  if (S.drag) return;                       // 1:1 grab
  if (reduceMotion.matches) { S.v = 0; S.d = clamp(S.d, 0, D_MAX); return; }
  S.d += S.v;
  S.v *= FRICTION;
  if (Math.abs(S.v) < 0.00012) S.v = 0;
  // soft rubber-band clamp at both ends
  if (S.d < OVERTURE_M) { S.d += (OVERTURE_M - S.d) * RUBBER; S.v *= 0.55; if (S.d > OVERTURE_M - 0.0006) S.d = OVERTURE_M; }
  else if (S.d > D_MAX) { S.d += (D_MAX - S.d) * RUBBER; S.v *= 0.55; if (S.d < D_MAX + 0.0006) S.d = D_MAX; }
}

/* wheel / trackpad → velocity impulse */
addEventListener('wheel', (e) => {
  if (S.mode !== 'section' || S.legend) return;
  e.preventDefault();
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? S.h : 1;
  impulse((e.deltaY * unit) / S.mpp * 0.115);
}, { passive: false });

/* pointer drag anywhere on the ground → 1:1 grab, flick momentum */
function grabStart(e) {
  if (S.mode !== 'section' || S.legend) return;
  if (e.target.closest('button, a, #ruler, #legend')) return;
  S.drag = { y: e.clientY, d: S.d, t: performance.now(), vy: 0, moved: 0 };
  S.glide = null;
  document.body.classList.add('grabbing');
}
function grabMove(e) {
  if (!S.drag) return;
  const dy = e.clientY - S.drag.y;
  S.drag.moved += Math.abs(dy);
  const nd = S.drag.d - dy / S.mpp;
  const now = performance.now();
  const dt = Math.max(8, now - S.drag.t);
  S.drag.vy = (nd - S.d) / (dt / 16.7);
  S.drag.t = now;
  setDepth(nd);
  firstTouch();
}
function grabEnd() {
  if (!S.drag) return;
  const flick = S.drag.vy;
  const moved = S.drag.moved;
  S.drag = null;
  document.body.classList.remove('grabbing');
  if (!reduceMotion.matches) S.v = clamp(flick, -1.6, 1.6);
  if (moved < 4) setFocus(-1);              // click empty ground unfocuses
}
addEventListener('pointerdown', grabStart);
addEventListener('pointermove', grabMove, { passive: true });
addEventListener('pointerup', grabEnd);
addEventListener('pointercancel', grabEnd);

/* keyboard */
addEventListener('keydown', (e) => {
  const k = e.key;
  if (k === 'd' || k === 'D') { e.preventDefault(); toggleMode(); return; }
  if (S.legend) {
    if (k === 'Escape') { e.preventDefault(); closeLegend(); }
    return;
  }
  if (S.mode !== 'section') return;
  if (k >= '1' && k <= '4') { e.preventDefault(); setFocus(+k - 1); return; }
  if (k === 'Escape') { setFocus(-1); return; }
  if (k === 'l' || k === 'L') { e.preventDefault(); openLegend(); return; }
  const step = { ArrowDown: 0.6, ArrowUp: -0.6, PageDown: 4, PageUp: -4, ' ': 4 };
  if (k in step) {
    e.preventDefault();
    glideTo(clamp(S.d + step[k], 0, D_MAX), Math.abs(step[k]) > 1 ? 700 : 420);
  } else if (k === 'Home') { e.preventDefault(); glideTo(0, 1400); }
  else if (k === 'End') { e.preventDefault(); glideTo(D_MAX, 1600); }
});

/* the ruler: click to jump, drag to scrub */
const ruler = document.getElementById('ruler');
let rdrag = null;
ruler.addEventListener('pointerdown', (e) => {
  if (S.mode !== 'section') return;
  ruler.setPointerCapture(e.pointerId);
  rdrag = { y: e.clientY, d: S.d, moved: 0 };
  S.glide = null; S.v = 0;
  firstTouch();
});
ruler.addEventListener('pointermove', (e) => {
  if (!rdrag) return;
  const dy = e.clientY - rdrag.y;
  rdrag.moved += Math.abs(dy);
  if (rdrag.moved > 3) setDepth(clamp(rdrag.d - dy / S.mpp, 0, D_MAX));
});
ruler.addEventListener('pointerup', (e) => {
  if (!rdrag) return;
  const wasClick = rdrag.moved <= 3;
  rdrag = null;
  if (wasClick) glideTo(clamp(S.d + (e.clientY - S.sightY) / S.mpp, 0, D_MAX), 900);
});
ruler.addEventListener('pointercancel', () => { rdrag = null; });
ruler.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault(); });

/* ── 4. GEOLOGY (deterministic) ───────────────────────────────────── */

const rnd = mulberry32(SEED);

/* boundary wobble: low-frequency sine sum + seeded per-boundary jitter */
const BOUND = STRATA.slice(1).map((s) => ({
  d: s.top,
  a: 0.6 + rnd() * 0.75,                    // relative amplitude
  f: [0.0042 + rnd() * 0.004, 0.011 + rnd() * 0.009, 0.027 + rnd() * 0.02],
  p: [rnd() * 6.283, rnd() * 6.283, rnd() * 6.283],
  j: Array.from({ length: 96 }, () => rnd() * 2 - 1),
}));
const WOB_HARD = { a: 0.9, f: [0.005, 0.013, 0.031], p: [rnd() * 6.283, rnd() * 6.283, rnd() * 6.283], j: Array.from({ length: 96 }, () => rnd() * 2 - 1) };
const WOB_WATER = { a: 0.55, f: [0.0035, 0.009, 0.02], p: [rnd() * 6.283, rnd() * 6.283, rnd() * 6.283], j: Array.from({ length: 96 }, () => rnd() * 2 - 1) };

function wobblePx(w, x, amp) {
  const s = Math.sin(x * w.f[0] + w.p[0]) * 0.62
          + Math.sin(x * w.f[1] + w.p[1]) * 0.27
          + Math.sin(x * w.f[2] + w.p[2]) * 0.11;
  const i = Math.floor((x / 14) % 96 + 96) % 96;
  return (s + w.j[i] * 0.22) * amp * w.a;
}

/* sediment grain: fixed cloud in (xFraction, depth), densifying downward */
const GRAIN = (() => {
  const N = 22000, g = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const u = rnd();
    g[i * 4] = rnd();                                   // x fraction
    g[i * 4 + 1] = Math.pow(u, 0.62) * D_MAX;           // depth (denser deep)
    g[i * 4 + 2] = 0.45 + rnd() * 1.15;                 // radius px
    g[i * 4 + 3] = 0.1 + rnd() * 0.5;                   // alpha base
  }
  // sort by depth for windowed drawing
  const idx = Array.from({ length: N }, (_, i) => i).sort((a, b) => g[a * 4 + 1] - g[b * 4 + 1]);
  const out = new Float32Array(N * 4);
  idx.forEach((src, dst) => { for (let k = 0; k < 4; k++) out[dst * 4 + k] = g[src * 4 + k]; });
  return out;
})();
const grainDepth = (i) => GRAIN[i * 4 + 1];

/* the dark strata need their own, denser cloud: at 1/20th of the surface
   lightness a single scattered speck disappears, and the ground goes flat */
const DEEP_GRAIN = (() => {
  const N = 26000, g = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const u = rnd();
    g[i * 4] = rnd();
    g[i * 4 + 1] = 13.2 + Math.pow(u, 0.78) * (D_MAX - 13.2);
    g[i * 4 + 2] = 0.5 + rnd() * 1.0;
    g[i * 4 + 3] = 0.24 + rnd() * 0.62;
  }
  const idx = Array.from({ length: N }, (_, i) => i).sort((a, b) => g[a * 4 + 1] - g[b * 4 + 1]);
  const out = new Float32Array(N * 4);
  idx.forEach((src, dst) => { for (let k = 0; k < 4; k++) out[dst * 4 + k] = g[src * 4 + k]; });
  return out;
})();

/* boreholes: each drifts with its own seeded low-frequency wander */
SHAFTS.forEach((s, i) => {
  /* the last casing must keep enough room to its RIGHT for a field-log entry,
     or the rightmost product hangs its entry backwards over its neighbour and
     is the first thing dropped when the row is tight. Span ends at 0.84. */
  s.baseF = 0.40 + (i / Math.max(1, SHAFTS.length - 1)) * 0.44;
  s.w = { f: [0.19 + rnd() * 0.14, 0.41 + rnd() * 0.2], p: [rnd() * 6.283, rnd() * 6.283], a: 0.9 + rnd() * 0.35 };
});
SHAFTS.forEach((s, i) => { s.i = i; });
/* Narrow viewports draw two casings, not four: one completed shaft and the one
   still drilling. Focusing a product (keys 1–4, or its swatch) swaps it in, so
   every core stays reachable on a phone. */
let _tsKey = '', _ts = [0, 1, 2, 3];
function twoSet() {
  const k = S.two + ':' + S.focus;
  if (k !== _tsKey) {
    _tsKey = k;
    _ts = S.two ? [S.focus >= 0 && S.focus !== TWO_UP[1] ? S.focus : TWO_UP[0], TWO_UP[1]] : [0, 1, 2, 3];
  }
  return _ts;
}
const shaftActive = (si) => !S.two || twoSet().includes(si);
function activeShafts() { return twoSet().map((i) => SHAFTS[i]); }
function shaftX(s, d) {
  const wander = (Math.sin(d * s.w.f[0] + s.w.p[0]) * 0.62 + Math.sin(d * s.w.f[1] + s.w.p[1]) * 0.38) * s.w.a;
  const base = S.two ? 0.40 + Math.max(0, twoSet().indexOf(s.i)) * 0.36 : s.baseF;
  return (base + wander * 0.015) * S.w;
}
/* the casings that actually exist at a depth: a terminated shaft is not there
   below its foot, so nothing needs to dodge it */
function casingXsAt(d) {
  return activeShafts().filter((o) => o.drilling || d <= o.end + 0.02)
    .map((o) => shaftX(o, d)).sort((a, b) => a - b);
}
/* horizontal room beside a casing before the next casing's glow starts */
function gapRight(s, d) {
  const xs = casingXsAt(d);
  const x = shaftX(s, d);
  const next = xs.find((v) => v > x + 4);
  return (next === undefined ? S.w - 18 : next - 14) - x;
}

/* core samples: one per shaft per stratum it reaches */
const SAMPLES = [];
SHAFTS.forEach((s, si) => {
  let n = 0;
  STRATA.forEach((st) => {
    if (st.code === 'EOL') return;
    n++;
    /* a shaft that is still drilling has no core below its current foot, but
       it keeps its place in the row: the slot stands empty and says so, which
       is the honest reading and keeps the comparison four wide */
    const pending = st.top >= s.end;
    if (pending && !s.drilling) return;
    SAMPLES.push({
      shaft: si, stratum: st, pending,
      d: pending ? clamp(st.sd, st.top + 0.55, st.bot - 0.5)
                 : clamp(st.sd, st.top + 0.55, Math.min(st.bot, s.end) - 0.5),
      code: `${s.pre}·${st.code}-0${n}`,
    });
  });
});

/* ── 5. CANVAS ────────────────────────────────────────────────────── */

const cv = document.getElementById('geo');
const ctx = cv.getContext('2d', { alpha: false });

/* ── OVERTURE ─────────────────────────────────────────────────────────
   Nine metres of air above the ground. Two currents enter from the left,
   braid at the confluence and leave as one; the mark draws itself in and
   parks; at 0 m the section takes over. Depth drives it, not a clock, so
   scrolling back up replays it exactly.                                */
const OVERTURE_M = -9.0;
const VIOLET = [0x6b, 0x4c, 0x9a], VIOLET_HI = [0xa9, 0x8b, 0xd6], CLAY = [0xc4, 0x87, 0x5a];
const OV = { t: 0, pL: null, pR: null, pO: null, arcLen: 472, el: {} };
const reduceMotionOv = window.matchMedia('(prefers-reduced-motion: reduce)');

/* 0 at the top of the overture, 1 once the ground is reached */
const overtureU = (d) => clamp((d - OVERTURE_M) / -OVERTURE_M, 0, 1);
const band01 = (q, a, b, c, e) => (q < a || q > e ? 0 : q < b ? (q - a) / (b - a) : q < c ? 1 : 1 - (q - c) / (e - c));

function ovEl(id) { return (OV.el[id] || (OV.el[id] = document.getElementById(id))); }

function drawConfluence(d, w, h) {
  const u = overtureU(d);
  const fade = band01(u, 0.03, 0.14, 0.94, 1.0);
  if (fade <= 0.01) return;
  if(!OV.pL){
    const mk=()=>{const a=[];for(let i=0;i<30;i++)a.push({t:Math.random(),spd:0.05+Math.random()*0.06,sz:0.6+Math.random()*0.9,ph:Math.random()*6.28});return a;};
    OV.pL=mk(); OV.pR=mk(); OV.pO=mk();
  }
  for(const arr of [OV.pL,OV.pR,OV.pO])
    for(const pt of arr){ pt.t+=pt.spd*0.016; if(pt.t>1) pt.t-=1; }

  const SQ=Math.min(w,h), bx=(w-SQ)/2, by=(h-SQ)/2, k=SQ/1080;
  const X=v=>bx+v*SQ, Y=v=>by+v*SQ;
  const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  const easeOut=t=>1-Math.pow(1-t,3);
  const band=(q,a1,b1,c1,e1)=>{ if(q<a1||q>e1) return 0; if(q<b1) return (q-a1)/(b1-a1); if(q<c1) return 1; return 1-(q-c1)/(e1-c1); };
  const p=ease(clamp((u-0.05)/0.70,0,1)), time=OV.t, alpha=fade;

  const CXn=0.46, LY0=0.19, RY0=0.57, CYn=0.38;
  const approach=easeOut(clamp(p/0.46,0,1));
  const merge=ease(clamp((p-0.52)/0.20,0,1));
  const braid=ease(clamp((p-0.60)/0.20,0,1));
  const gapHalf=lerp(0.05,0,merge);
  const hx=lerp(0.20,CXn,approach)+0.028*braid;
  const ly=lerp(LY0,CYn,approach)+0.016*braid;
  const ry=lerp(RY0,CYn,approach)-0.016*braid;
  const lhx=hx-gapHalf*(1-merge), rhx=hx+gapHalf*(1-merge);
  const amp=0.045*(1-merge*0.60);

  const ptL=t=>{t=clamp(t,0,1);const e=t*t*(3-2*t);return {x:X(lhx*e),y:Y(lerp(LY0,ly,e)+Math.sin(t*Math.PI*2.2+time*1.1)*amp*(1-t*0.6))};};
  const ptR=t=>{t=clamp(t,0,1);const e=t*t*(3-2*t);return {x:X(rhx*e),y:Y(lerp(RY0,ry,e)+Math.sin(t*Math.PI*2.2-time*1.1+1)*amp*(1-t*0.6))};};
  const ptO=t=>{t=clamp(t,0,1);const e=t*t*(3-2*t);return {x:X(lerp(CXn,1.04,e)),y:Y(lerp(CYn,0.455,e)+Math.sin(t*Math.PI*1.1+time*0.7)*0.018*(1-t*0.4))};};

  // thin at the source, full body mid-river, sharpening to a point at the head
  const widthAt=t=>easeOut(clamp(t/0.10,0,1))*(1-Math.pow(clamp((t-0.72)/0.28,0,1),1.35)*0.99);
  const mixc=(c1,c2,t)=>[lerp(c1[0],c2[0],t),lerp(c1[1],c2[1],t),lerp(c1[2],c2[2],t)];

  const river=(fn2,col,hi,a,headT,tailFade,wScale,from)=>{
    if(a<=0.01) return;
    const N=64, base=Math.max(3,SQ*0.022)*(wScale||1), tf=tailFade||0;
    ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.shadowColor=css(col); ctx.shadowBlur=SQ*0.024; ctx.strokeStyle=css(col);
    for(let i=0;i<N;i++){
      const t0=(i/N)*headT, t1=((i+1)/N)*headT, q0=fn2(t0), q1=fn2(t1);
      const uu=((t0+t1)/2)/Math.max(headT,1e-4);
      const wd=base*widthAt(uu), al=a*(1-tf*Math.pow(uu,1.15))*0.5;
      if(wd<0.35||al<0.01) continue;
      if(from) ctx.strokeStyle=css(mixc(from,col,clamp(uu/0.45,0,1)));
      ctx.globalAlpha=al; ctx.lineWidth=wd;
      ctx.beginPath(); ctx.moveTo(q0.x,q0.y); ctx.lineTo(q1.x,q1.y); ctx.stroke();
    }
    ctx.shadowBlur=SQ*0.009; ctx.strokeStyle=css(hi);
    for(let i=0;i<N;i++){
      const t0=(i/N)*headT, t1=((i+1)/N)*headT, q0=fn2(t0), q1=fn2(t1);
      const uu=((t0+t1)/2)/Math.max(headT,1e-4);
      const wd=2*k*(wScale||1)*widthAt(uu), al=a*(1-tf*Math.pow(uu,1.15));
      if(wd<0.2||al<0.01) continue;
      ctx.globalAlpha=al; ctx.lineWidth=wd;
      ctx.beginPath(); ctx.moveTo(q0.x,q0.y); ctx.lineTo(q1.x,q1.y); ctx.stroke();
    }
    ctx.restore();
  };
  const wedges=(parts,fn2,col,a,headT)=>{
    if(a<=0.01) return;
    ctx.save(); ctx.fillStyle=css(col); ctx.shadowColor=css(col); ctx.shadowBlur=SQ*0.008;
    for(const pt of parts){
      const q=fn2(pt.t*headT), s2=k*(2.2+pt.sz*2.4)*widthAt(pt.t);
      if(s2<0.4) continue;
      ctx.globalAlpha=a;
      ctx.save(); ctx.translate(q.x,q.y); ctx.rotate(pt.ph);
      ctx.beginPath(); ctx.moveTo(-s2,-s2*0.7); ctx.lineTo(s2*1.4,0); ctx.lineTo(-s2,s2*0.7); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  };
  const nodes=(parts,fn2,col,hi,a,headT,tailFade)=>{
    if(a<=0.01) return;
    const tf=tailFade||0;
    ctx.save();
    const pts=parts.map(pt=>fn2(pt.t*headT)).sort((m,n)=>m.x-n.x);
    ctx.globalAlpha=a*0.4; ctx.strokeStyle=css(col); ctx.lineWidth=1;
    for(let i=0;i<pts.length-1;i++){
      const dx=pts[i+1].x-pts[i].x, dy=pts[i+1].y-pts[i].y;
      if(Math.hypot(dx,dy)<SQ*0.10){ ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[i+1].x,pts[i+1].y); ctx.stroke(); }
    }
    ctx.fillStyle=css(hi); ctx.shadowColor=css(col); ctx.shadowBlur=SQ*0.01;
    for(const pt of parts){
      const q=fn2(pt.t*headT), r=k*(1.6+pt.sz*2.2)*widthAt(pt.t), al=a*(1-tf*Math.pow(pt.t,1.6));
      if(r<0.3||al<0.01) continue;
      ctx.globalAlpha=al;
      ctx.beginPath(); ctx.arc(q.x,q.y,r,0,6.2832); ctx.fill();
    }
    ctx.restore();
  };
  // light bridge: soft halo, bright core filament, radial bloom. Not a scribble.
  const bridge=(x1,y1,x2,y2,a)=>{
    if(a<=0.01) return;
    const mx=(x1+x2)/2, my=(y1+y2)/2, swell=Math.sin(time*2.1)*SQ*0.006;
    ctx.save(); ctx.lineCap='round';
    ctx.globalAlpha=a*0.35; ctx.strokeStyle=css(VIOLET_HI);
    ctx.lineWidth=SQ*0.020; ctx.shadowColor=css(VIOLET_HI); ctx.shadowBlur=SQ*0.031;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo(mx,my+swell,x2,y2); ctx.stroke();
    ctx.globalAlpha=a*0.9; ctx.strokeStyle='#EDE4FA';
    ctx.lineWidth=Math.max(1.2,2.4*k); ctx.shadowColor=css(VIOLET); ctx.shadowBlur=SQ*0.017;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo(mx,my+swell,x2,y2); ctx.stroke();
    const r=SQ*0.20*a+1, g=ctx.createRadialGradient(mx,my,0,mx,my,r);
    g.addColorStop(0,rgba(VIOLET_HI,0.42*a));
    g.addColorStop(0.45,rgba(VIOLET_HI,0.18*a));
    g.addColorStop(1,rgba(VIOLET_HI,0));
    ctx.globalAlpha=1; ctx.shadowBlur=0; ctx.fillStyle=g;
    ctx.beginPath(); ctx.arc(mx,my,r,0,6.2832); ctx.fill();
    ctx.restore();
  };

  const headT=clamp(0.12+easeOut(clamp(p/0.44,0,1))*0.88,0,1);
  const side=(1-braid*0.18)*alpha;
  river(ptL,CLAY,[226,181,129],side,headT);
  river(ptR,VIOLET,VIOLET_HI,side,headT);
  wedges(OV.pL,ptL,[200,160,106],side,headT);
  nodes(OV.pR,ptR,VIOLET,VIOLET_HI,side,headT);

  const br=band(p,0.44,0.56,0.72,0.86)*alpha;
  if(br>0.01){ const a1=ptL(headT), a2=ptR(headT); bridge(a1.x,a1.y,a2.x,a2.y,br); }

  const out=clamp((p-0.70)/0.18,0,1)*alpha;
  if(out>0.01){
    const oT=easeOut(clamp((p-0.70)/0.24,0,1));
    river(ptO,VIOLET,VIOLET_HI,out,oT,0.90,0.95,CLAY);
    nodes(OV.pO,ptO,VIOLET_HI,VIOLET_HI,out*0.8,oT,0.90);
  }

  const glow=Math.max(out*0.9,br*0.5);
  if(glow>0.01){
    const gx2=X(CXn), gy2=Y(CYn), r=SQ*0.24;
    const g=ctx.createRadialGradient(gx2,gy2,0,gx2,gy2,r);
    g.addColorStop(0,rgba(VIOLET_HI,0.26*glow)); g.addColorStop(1,rgba(VIOLET_HI,0));
    ctx.save(); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(gx2,gy2,r,0,6.2832); ctx.fill(); ctx.restore();
  }
}

/* The DOM half: arcs draw, riders run, the mark lights and parks beside
   the masthead, the headline resolves and hands off to the section. */
function overtureDom(d) {
  const root = ovEl('overture'); if (!root) return;
  const u = overtureU(d);
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const far = d > 1.2;
  root.style.display = far ? 'none' : 'block';
  if (far) return;

  const park = u >= 0.84;
  const draw = park ? ease(clamp((u - 0.855) / 0.10, 0, 1)) : ease(clamp((u - 0.03) / 0.20, 0, 1));
  const arcFade = park ? clamp((u - 0.965) / 0.035, 0, 1) : clamp((u - 0.24) / 0.07, 0, 1);
  const off = OV.arcLen * (1 - draw), arcOp = (1 - arcFade).toFixed(3);
  for (const id of ['ov-arc-c', 'ov-arc-v']) {
    const a = ovEl(id); a.style.strokeDashoffset = off.toFixed(1); a.style.opacity = arcOp;
  }
  const riderVis = (draw > 0.02 && draw < 0.97 ? 1 : 0) * (1 - arcFade);
  for (const [rid, aid] of [['ov-rider-c', 'ov-arc-c'], ['ov-rider-v', 'ov-arc-v']]) {
    const rider = ovEl(rid), arc = ovEl(aid);
    if (riderVis <= 0.001) { rider.style.opacity = '0'; continue; }
    try {
      const q = arc.getPointAtLength(OV.arcLen * clamp(draw, 0, 1));
      rider.setAttribute('cx', q.x.toFixed(1)); rider.setAttribute('cy', q.y.toFixed(1));
    } catch (e) {}
    rider.style.opacity = riderVis.toFixed(3);
  }

  const pulse = park ? Math.sin(clamp((u - 0.90) / 0.10, 0, 1) * Math.PI) : Math.sin(clamp((u - 0.06) / 0.22, 0, 1) * Math.PI);
  const markP = park ? clamp((u - 0.905) / 0.05, 0, 1) : 1;
  const mark = ovEl('ov-mark');
  mark.style.opacity = markP.toFixed(3);
  mark.style.transform = 'scale(' + (0.9 + 0.1 * ease(markP)).toFixed(3) + ')';
  mark.style.filter = 'drop-shadow(0 0 ' + (8 + 16 * pulse).toFixed(1) + 'px rgba(169,139,214,' + (0.45 + 0.4 * pulse).toFixed(2) + '))';

  const bloomP = park ? Math.max(band01(u, 0.88, 0.955, 0.985, 1.0) * 0.6, 0.34)
                      : Math.max(band01(u, 0.15, 0.26, 0.34, 0.44) * 0.6, 0.30);
  const bloom = ovEl('ov-bloom');
  bloom.style.opacity = bloomP.toFixed(3);
  bloom.style.transform = 'scale(' + (0.85 + 0.2 * ease(clamp((u - 0.05) / 0.85, 0, 1))).toFixed(3) + ')';

  ovEl('ov-eyebrow').style.opacity = park ? '0' : (1 - clamp((u - 0.26) / 0.10, 0, 1)).toFixed(3);

  const headIn = clamp((u - 0.68) / 0.11, 0, 1), headOut = clamp((u - 0.90) / 0.08, 0, 1);
  const res = ovEl('ov-resolve');
  res.style.opacity = (headIn * (1 - headOut)).toFixed(3);
  res.style.transform = 'translateY(' + ((1 - headIn) * 14).toFixed(1) + 'px)';
  ovEl('ov-wordmark').style.opacity = (clamp((u - 0.77) / 0.09, 0, 1) * (1 - headOut)).toFixed(3);
  ovEl('ov-cue').style.opacity = (1 - clamp(u / 0.10, 0, 1)).toFixed(3);

  /* the instruments belong to the survey, not to the overture: they arrive
     as the ground does, so the opening reads as a plate and not a dashboard */
  document.documentElement.style.setProperty('--chrome', clamp((u - 0.86) / 0.14, 0, 1).toFixed(3));
  document.documentElement.style.setProperty('--chrome-events', u > 0.94 ? 'auto' : 'none');

  placeOvMark(u);
}

/* the mark travels from the centre of the confluence into the masthead */
function placeOvMark(u) {
  const L = ovEl('ov-logo'); if (!L) return;
  const base = L.offsetWidth || 150;
  const ax = S.w * 0.5, ay = S.h * 0.38;
  let tx = ax, ty = S.h * 0.9, sc = 0.4;
  const slot = document.querySelector('[data-mark-slot]');
  if (slot) {
    const r = slot.getBoundingClientRect();
    if (r.width > 2) { tx = r.left + r.width / 2; ty = r.top + r.height / 2; sc = r.height / base; }
  }
  const tr = ((t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2))(clamp((u - 0.84) / 0.16, 0, 1));
  const ox = tx, oy = ty - S.h * 0.26, os = sc * 1.55;
  const x = u < 0.5 ? ax : lerp(ox, tx, tr), y = u < 0.5 ? ay : lerp(oy, ty, tr), s2 = u < 0.5 ? 1 : lerp(os, sc, tr);
  L.style.left = '0px'; L.style.top = '0px';
  L.style.transform = 'translate(' + (x - base / 2).toFixed(1) + 'px,' + (y - base / 2).toFixed(1) + 'px) scale(' + s2.toFixed(4) + ')';
  /* the seal appears for its flight and dissolves as it arrives — the
     masthead carries its own mark, so two marks never sit on one spot */
  const inn = clamp((u - 0.83) / 0.04, 0, 1), out = clamp((u - 0.94) / 0.06, 0, 1);
  L.style.opacity = (inn * (1 - out)).toFixed(3);
}


function resize() {
  S.w = innerWidth; S.h = innerHeight;
  S.dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(S.w * S.dpr);
  cv.height = Math.round(S.h * S.dpr);
  S.mpp = S.h * MPP_VH;
  S.sightY = S.h * SIGHT;
  S.narrow = S.w <= 900;
  S.two = S.w <= 640;
  /* narrow: geology is confined to the upper band and the type column
     rides below it, so copy never crosses a shaft or a swatch */
  S.clipBot = S.narrow ? S.h * 0.42 : S.h;
  S.clipTop = 0;
  S.textOffset = S.narrow ? S.h * 0.26 : 0;
  measureBands();
  document.documentElement.style.setProperty('--mpp', S.mpp + 'px');
  document.documentElement.style.setProperty('--sight', S.sightY + 'px');
  layoutTicks();
}
addEventListener('resize', resize);

const yOf = (d) => S.sightY + (d - S.d) * S.mpp;
const dOf = (y) => S.d + (y - S.sightY) / S.mpp;

function paint() {
  const { w, h } = S;
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  const L = S.L;
  const top = dOf(0), bot = dOf(h);
  const step = Math.max(6, Math.round(w / 190));

  // strata bodies, each bounded by hand-drawn wobbles
  const ampPx = lerp(6, 14, 0.5);
  for (let i = 0; i < STRATA.length; i++) {
    const st = STRATA[i];
    const yTop = i === 0 ? -h : null;
    const bTop = i === 0 ? null : BOUND[i - 1];
    const bBot = i === STRATA.length - 1 ? null : BOUND[i];
    ctx.beginPath();
    if (bTop) {
      for (let x = -step; x <= w + step; x += step) {
        const y = yOf(st.top) + wobblePx(bTop, x, ampPx);
        x === -step ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
    } else { ctx.moveTo(-step, yTop); ctx.lineTo(w + step, yTop); }
    if (bBot) {
      for (let x = w + step; x >= -step; x -= step) {
        ctx.lineTo(x, yOf(st.bot) + wobblePx(bBot, x, ampPx));
      }
    } else { ctx.lineTo(w + step, yOf(st.bot) + h * 2); ctx.lineTo(-step, yOf(st.bot) + h * 2); }
    ctx.closePath();
    ctx.fillStyle = css(stratumColour(st, L));
    ctx.fill();
  }

  // sediment grain — densifies with depth, finer below the hardpan
  const dark = clamp((LAMP_L - L) / LAMP_L, 0, 1);       // 0 in daylight, 1 at bedrock
  const inkG = L >= LAMP_L ? [0x2b, 0x25, 0x1c] : [0xdd, 0xd5, 0xc3];
  const drift = reduceMotion.matches ? 0 : clamp(S.v, -0.9, 0.9) * 14;
  /* per-particle contrast RISES as the ground darkens: a speck at 34% alpha on
     near-black ground is invisible, and the stratum reads as a flat rectangle */
  const gAlpha = L >= LAMP_L ? 0.5 : lerp(0.5, 1.0, dark);
  const drawCloud = (cloud, mul) => {
    const n = cloud.length / 4;
    let lo = 0, hi = n - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; cloud[m * 4 + 1] < top - 0.2 ? (lo = m + 1) : (hi = m); }
    for (let i = lo; i < n; i++) {
      const gd = cloud[i * 4 + 1];
      if (gd > bot + 0.2) break;
      const y = yOf(gd) + drift * (0.4 + cloud[i * 4 + 2] * 0.5);
      if (y < -8 || y > h + 8) continue;
      const deep = clamp(gd / 20, 0, 1);
      const r = cloud[i * 4 + 2] * (1 - deep * 0.28);     // finer with depth, but never sub-pixel
      ctx.globalAlpha = clamp(cloud[i * 4 + 3] * (0.5 + deep * 0.85) * gAlpha * mul, 0, 1);
      ctx.fillRect(cloud[i * 4] * w, y, r, r);
    }
  };
  ctx.fillStyle = rgba(inkG, 1);
  drawCloud(GRAIN, 1);
  if (dark > 0.02) drawCloud(DEEP_GRAIN, dark);           // the dark strata's own cloud
  ctx.globalAlpha = 1;

  // boundary lines
  const lineInk = L >= LAMP_L ? [0x2a, 0x24, 0x1b] : [0xbf, 0xb6, 0xa3];
  ctx.lineWidth = 1;
  BOUND.forEach((b, i) => {
    const y0 = yOf(b.d);
    if (y0 < -30 || y0 > h + 30) return;
    ctx.strokeStyle = rgba(lineInk, 0.4);
    ctx.beginPath();
    for (let x = -step; x <= w + step; x += step) {
      const y = y0 + wobblePx(b, x, ampPx);
      x === -step ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  });

  // hardpan: the hard near-black line
  {
    const y0 = yOf(HARDPAN);
    if (y0 > -40 && y0 < h + 40) {
      ctx.strokeStyle = rgba(L >= LAMP_L ? [0x14, 0x12, 0x0f] : [0x8e, 0x86, 0x76], 0.92);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let x = -step; x <= w + step; x += step) {
        const y = y0 + wobblePx(WOB_HARD, x, ampPx * 0.8);
        x === -step ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  }

  // water table: thin dashed line
  {
    const y0 = yOf(WATER);
    if (y0 > -40 && y0 < h + 40) {
      ctx.save();
      ctx.setLineDash([9, 7]);
      ctx.strokeStyle = rgba(L >= LAMP_L ? [0x3c, 0x4e, 0x52] : [0x9d, 0xb2, 0xb6], 0.7);
      ctx.beginPath();
      for (let x = -step; x <= w + step; x += step) {
        const y = y0 + wobblePx(WOB_WATER, x, ampPx * 0.55);
        x === -step ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // boreholes
  const narrow = S.narrow;
  const clipBot = S.clipBot;
  const clipTop = S.clipTop;
  if (narrow) { ctx.save(); ctx.beginPath(); ctx.rect(0, clipTop, w, clipBot - clipTop); ctx.clip(); }

  S.labelRects = [];
  const MONO = '10.5px "JetBrains Mono", monospace';
  /* one mono annotation beside a casing, flipped to the left when the room to
     the right would run it into the next casing */
  const annotate = (text, x, y, s, dim, alpha) => {
    ctx.font = MONO;
    ctx.textBaseline = 'middle';
    const tw = ctx.measureText(text).width;
    const d = dOf(y);
    const xs = casingXsAt(d);
    const nextX = xs.find((v) => v > x + 6);
    /* never over a casing, and never into the column the copy occupies */
    const bound = Math.max(S.textRight + 14, 70);
    const roomR = (nextX === undefined ? S.w - 14 : nextX - 14) - (x + 13);
    const roomL = (x - 13) - bound;
    const right = roomR >= tw || roomL < tw;
    if (right && roomR < tw && roomL < tw) return;             // nowhere to put it
    ctx.textAlign = right ? 'left' : 'right';
    ctx.fillStyle = rgba(s.col, alpha * dim);
    ctx.fillText(text, right ? x + 13 : x - 13, y);
    S.labelRects.push([right ? x + 13 : x - 13 - tw, y - 7, tw, 14]);
  };

  activeShafts().forEach((s) => {
    const si = SHAFTS.indexOf(s);
    const dim = S.focus >= 0 && S.focus !== si ? 0.18 : 1;
    const glow = S.focus === si ? 1.5 : 1;
    const dTop = Math.max(0, top - 1), dBot = Math.min(D_MAX, bot + 1);
    const seg = (from, to, dashed) => {
      if (to <= from) return;
      ctx.beginPath();
      for (let d = from; d <= to; d += 0.06) ctx.lineTo(shaftX(s, d), yOf(d));
      ctx.lineTo(shaftX(s, to), yOf(to));
      /* a drilling shaft's continuation must read as a borehole, not as a
         second tick ruler: long dashes, wide gaps, glow retained */
      if (dashed) ctx.setLineDash([30, 26]);
      // glow
      ctx.strokeStyle = rgba(s.col, 0.1 * dim * glow);
      ctx.lineWidth = 15 * glow;
      ctx.stroke();
      ctx.strokeStyle = rgba(s.col, 0.2 * dim * glow);
      ctx.lineWidth = 7 * glow;
      ctx.stroke();
      // casing
      ctx.strokeStyle = rgba(s.col, (dashed ? 0.62 : 0.95) * dim);
      ctx.lineWidth = dashed ? 2.4 : 3;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
    };

    seg(dTop, Math.min(dBot, s.end), false);
    const yEnd = yOf(s.end);
    const endVisible = yEnd > clipTop - 22 && yEnd < clipBot + 22;

    if (s.drilling) {
      // still drilling: dashed continuation to the bottom of the section
      seg(Math.max(dTop, s.end), dBot, true);
      if (endVisible) annotate(`${s.key} · DRILLING`, shaftX(s, s.end), yEnd + 15, s, dim, 0.92);
    } else if (endVisible) {
      /* completed: a solid terminal foot across the casing at full strength,
         one label, and nothing whatsoever drawn below it */
      const x = shaftX(s, s.end);
      ctx.strokeStyle = rgba(s.col, 0.98 * dim);
      ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(x - 17, yEnd); ctx.lineTo(x + 17, yEnd); ctx.stroke();
      ctx.lineWidth = 1;
      annotate(`${s.pre} · TERMINATED IN BEDROCK · ${s.end.toFixed(1)} m`,
               x, yEnd + 16 + si * 18, s, dim, 0.9);
    }
  });

  // core samples
  ctx.font = MONO;
  ctx.textBaseline = 'middle';
  SAMPLES.forEach((sm, i) => {
    const s = SHAFTS[sm.shaft];
    if (!sm.on) return;
    const dim = S.focus >= 0 && S.focus !== sm.shaft ? 0.22 : 1;
    const hovered = S.hover === i;
    const wS = 26, hS = 34;
    const bx = sm.bx, by = sm.by;
    if (sm.pending) {
      /* no core recovered here yet — an empty box on the same grid, dashed the
         way the borehole below the foot is dashed */
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = rgba(s.col, (hovered ? 0.9 : 0.6) * dim);
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, wS - 1, hS - 1);
      ctx.restore();
    } else {
      ctx.fillStyle = rgba(s.col, (hovered ? 0.5 : 0.3) * dim);
      ctx.fillRect(bx, by, wS, hS);
      ctx.strokeStyle = rgba(s.col, (hovered ? 1 : 0.8) * dim);
      ctx.lineWidth = hovered ? 1.6 : 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, wS - 1, hS - 1);
      // striations inside the swatch
      ctx.strokeStyle = rgba(s.col, 0.35 * dim);
      for (let k = 1; k < 4; k++) {
        ctx.beginPath(); ctx.moveTo(bx + 2, by + (hS / 4) * k); ctx.lineTo(bx + wS - 2, by + (hS / 4) * k + (k % 2 ? 1.5 : -1)); ctx.stroke();
      }
      ctx.lineWidth = 1;
    }
    /* when the log entry is standing beside the swatch it prints the code
       itself — don't set the same string twice */
    if (!sm.entryOn) {
      ctx.textAlign = 'left';
      ctx.fillStyle = rgba(hovered ? s.col : (S.L >= LAMP_L ? [0x3a, 0x33, 0x28] : [0xc9, 0xc0, 0xae]), (hovered ? 1 : 0.72) * dim);
      ctx.fillText(sm.code, bx + wS + 8, by + hS / 2 - (hovered ? 7 : 0));
      if (hovered) ctx.fillText(s.key, bx + wS + 8, by + hS / 2 + 7);
    }
  });

  if (narrow) ctx.restore();

  // vignette — tightens with depth
  const vg = ctx.createRadialGradient(w * 0.42, S.sightY, Math.min(w, h) * lerp(0.62, 0.16, 1 - L), w * 0.42, S.sightY, Math.max(w, h) * lerp(1.05, 0.72, 1 - L));
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, `rgba(6,5,4,${lerp(0.16, 0.82, 1 - L)})`);
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  // the overture rides above the ground, on the same canvas
  if (S.d < 1.2) drawConfluence(S.d, w, h);
}

/* ── 6. DOM: bands, ruler ticks, readout ──────────────────────────── */

const bands = [...document.querySelectorAll('.band')].map((el) => ({
  el, anchor: +el.dataset.anchor, stratum: el.dataset.stratum,
  isEnd: el.classList.contains('end'), h: 0,
}));
function measureBands() {
  for (const b of bands) {
    b.h = b.el.offsetHeight;
    let r = 0;
    for (const c of b.el.children) r = Math.max(r, c.offsetLeft + c.offsetWidth);
    b.tw = r;
  }
}
bands.forEach((b) => {
  const h = b.el.querySelector('.display');
  if (h) { h.dataset.range = b.el.dataset.range; h.dataset.stratum = b.el.dataset.stratum; }
});

const ticksEl = document.getElementById('ticks');
const tickLabels = [];
function layoutTicks() {
  ticksEl.textContent = '';
  tickLabels.length = 0;
  const frag = document.createDocumentFragment();
  for (let i = 0; i <= D_MAX * 5 + 0.001; i++) {
    const d = i / 5;
    const t = document.createElement('div');
    const major = Math.abs(d % 1) < 1e-9;
    const half = !major && Math.abs((d * 2) % 1) < 1e-9;
    t.className = 'tick ' + (major ? 't-major' : half ? 't-half' : 't-minor');
    t.style.top = (d * S.mpp).toFixed(2) + 'px';
    frag.appendChild(t);
    if (major) {
      const l = document.createElement('div');
      l.className = 'tick-label';
      l.textContent = String(Math.round(d));
      l.style.top = (d * S.mpp).toFixed(2) + 'px';
      l.dataset.m = String(Math.round(d));
      frag.appendChild(l);
      tickLabels.push(l);
    }
  }
  ticksEl.appendChild(frag);
}

const swatchLayer = document.getElementById('swatches');
SAMPLES.forEach((sm, i) => {
  const b = document.createElement('button');
  b.className = 'swatch';
  b.type = 'button';
  const s = SHAFTS[sm.shaft];
  b.setAttribute('aria-label', `Core sample ${sm.code} — ${s.key}, ${sm.stratum.name}, ${sm.d.toFixed(1)} metres. Focus this borehole.`);
  b.addEventListener('click', (e) => { e.stopPropagation(); glideTo(sm.d, 700); setFocus(sm.shaft); });
  b.addEventListener('pointerenter', () => { S.hover = i; });
  b.addEventListener('pointerleave', () => { if (S.hover === i) S.hover = -1; });
  b.addEventListener('focus', () => { S.hover = i; });
  b.addEventListener('blur', () => { if (S.hover === i) S.hover = -1; });
  sm.el = b;
  swatchLayer.appendChild(b);
});

/* ── the field: every product's log entry, permanently beside its core ──
   The middle of the section used to be four lines and a lot of dark ground.
   The comparison the structure promises — the same stratum, read four ways —
   now stands in it. Each entry is the SAME DOM node that document mode reads;
   it is moved into the field layer in section mode and handed back to its
   article in document mode, so nothing is duplicated for screen readers. */
const logfield = document.getElementById('logfield');
const ENTRIES = [];
document.querySelectorAll('.logs .entry').forEach((el) => {
  const band = el.closest('.band');
  const si = +el.dataset.shaft;
  const sm = SAMPLES.find((x) => x.shaft === si && x.stratum.name === band.dataset.stratum);
  if (!sm) return;
  const code = document.createElement('span');
  code.className = 'mono ecode';
  code.textContent = sm.code;
  el.querySelector('.name').appendChild(code);
  ENTRIES.push({ el, home: el.parentNode, sm, si });
  sm.entry = el;
});
function relocateEntries() {
  for (const e of ENTRIES) {
    const want = S.mode === 'section' ? logfield : e.home;
    if (e.el.parentNode !== want) want.appendChild(e.el);
    if (S.mode !== 'section') { e.el.style.cssText = ''; }
  }
}

/* the instrument plates own their corners; an entry never slides under one */
function plateRects() {
  const r = [];
  for (const id of ['readout', 'docmode', 'legendbtn', 'fieldlog', 'descend']) {
    const el = document.getElementById(id);
    if (!el || el.hidden) continue;
    const b = el.getBoundingClientRect();
    if (b.width) r.push([b.left - 10, b.top - 8, b.width + 20, b.height + 16]);
  }
  return r;
}
const hits = (a, b) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];

/* geometry for every core sample: the swatch rect, its hit target, and the
   log entry standing beside it. Runs before paint, so canvas and DOM agree. */
function layoutSamples() {
  const plates = S.mode === 'section' ? plateRects() : [];
  const wS = 26, hS = 34;
  const rulerW = 64;
  const groups = new Map();
  for (let i = 0; i < SAMPLES.length; i++) {
    const sm = SAMPLES[i];
    const on = shaftActive(sm.shaft);
    const y = yOf(sm.d);
    const lift = S.hover === i ? 3 : 0;
    sm.bx = shaftX(SHAFTS[sm.shaft], sm.d) - wS / 2;
    sm.by = y - hS / 2 - lift;
sm.on = on && (S.narrow
      ? y - hS / 2 - 4 > S.clipTop && y + hS / 2 + 4 < S.clipBot
      : y > S.clipTop - 50 && y < S.clipBot + 50);
    if (sm.el) {
      sm.el.style.display = sm.on ? 'block' : 'none';
      if (sm.on) sm.el.style.transform = `translate3d(${sm.bx}px,${sm.by}px,0)`;
    }
    sm.entryOn = false;
    if (!sm.entry) continue;
    if (sm.entry.parentNode !== logfield) continue;
    /* the log entries of one stratum all sit at the same depth — they are the
       row you compare across, so they are laid out as a row */
    if (!groups.has(sm.stratum.code)) groups.set(sm.stratum.code, []);
    groups.get(sm.stratum.code).push(sm);
    sm.entry.style.opacity = '0';
    sm.entry.style.visibility = 'hidden';
  }

  for (const group of groups.values()) {
    group.sort((a, b) => a.bx - b.bx);
    // every casing on screen at this row, dashed continuations included
    const xs = activeShafts().map((o) => shaftX(o, group[0].d)).sort((a, b) => a - b);
    let prevH = 0;
    for (const sm of group) {
      const el = sm.entry;
      const dist = Math.abs(S.d - sm.d);
      const dim = S.focus >= 0 && S.focus !== sm.shaft ? 0.3 : 1;
      let o = sm.on && !S.narrow ? clamp(1 - smooth((dist - 1.5) / 0.9), 0, 1) * S.adapt * dim : 0;
      if (o <= 0.02) continue;
      const cx = sm.bx + wS / 2;
      const nextX = xs.find((v) => v > cx + 6);
      const prevX = [...xs].reverse().find((v) => v < cx - 6);
      const rightRoom = (nextX === undefined ? S.w - 14 : nextX - 25) - (cx + 25);
      const leftRoom = (cx - 25) - (prevX === undefined ? rulerW + 14 : prevX + 25);
      let wid, left, right, dy = 0;
      if (rightRoom >= 132) {
        right = true; wid = Math.min(258, rightRoom); left = cx + 25;
      } else {
        /* no room to the right — hang the entry off the LEFT of its casing and
           drop it below its neighbour's entry so the two never collide */
        right = false; wid = Math.min(258, leftRoom); left = cx - 25 - wid;
        dy = prevH + 16;
      }
      const baseTop = sm.by - 3 + dy;
      const h = el.offsetHeight || 62;
      let topY = baseTop;
      /* a row of four is the comparison this section exists to make, so an
         entry that lands under an instrument plate slides clear of it rather
         than disappearing and quietly leaving three of four on screen */
      const fits = (ty) => ty >= S.clipTop + 4 && ty + h <= S.clipBot - 4 &&
        !plates.some((p) => hits([left, ty, wid, h], p));
      if (wid < 112 || left < rulerW + 6 || left + wid > S.w - 6) { o = 0; }
      else if (!fits(topY)) {
        const cand = [];
        for (const p of plates) { cand.push(p[1] + p[3] + 8, p[1] - h - 8); }
        cand.sort((a, b) => Math.abs(a - baseTop) - Math.abs(b - baseTop));
        const ok = cand.find(fits);
        if (ok === undefined) o = 0; else topY = ok;
      }
      if (o > 0.02) {
        el.style.width = wid + 'px';
        el.style.transform = `translate3d(${Math.round(left)}px,${Math.round(topY)}px,0)`;
        el.style.textAlign = right ? 'left' : 'right';
        el.classList.toggle('flip', !right);
        el.style.setProperty('--core', css(SHAFTS[sm.shaft].col));
        el.style.opacity = o.toFixed(3);
        el.style.visibility = 'visible';
        sm.entryOn = true;
        prevH = h;
      }
    }
  }
}

const roStrat = document.getElementById('ro-strat');
const roDepth = document.getElementById('ro-depth');
const roCoreRow = document.getElementById('ro-core-row');
const roCore = document.getElementById('ro-core');
const cursorval = document.getElementById('cursorval');
const descend = document.getElementById('descend');
const fieldlog = document.getElementById('fieldlog');

function updateDom() {
  layoutSamples();
  const root = document.documentElement.style;
  const L = S.L;
  const ink = S.ink;
  root.setProperty('--fg', css(ink));
  root.setProperty('--bg', css(stratumColour(stratumAt(clamp(S.d, 0, D_MAX)), L)));
  root.setProperty('--plate', rgba(L >= LAMP_L ? PAPER_PLATE : DARK_PLATE, 0.88));
  root.setProperty('--plate-solid', rgba(L >= LAMP_L ? PAPER_PLATE : DARK_PLATE, 0.97));
  root.setProperty('--plate-ink', css(L >= LAMP_L ? INK_DARK : inkFor(Math.min(L, LAMP_L - 0.01))));
  root.setProperty('--adapt', S.adapt.toFixed(3));

  // bands: fade + rise from depth proximity only
  const instant = reduceMotion.matches;
  let minTop = Infinity, textRight = 0;
  /* PASS 1 — lay every band out as one unit: label + display + body. */
  for (const b of bands) {
    const dist = Math.abs(S.d - b.anchor);
    // the end of the log stays put once you have reached the bottom
    const below = b.isEnd && S.d > b.anchor;
    /* fade window: fully lit for 1.35 m either side of the anchor, then a
       short 0.55 m fade — short enough that copy is never parked at a low
       opacity, and clear of the ink-inversion window entirely */
    const hold = 1.35, tail = 0.55;
    let o = below ? 1 : instant ? (dist < 1.6 ? 1 : 0) : 1 - smooth((dist - hold) / tail);
    o = clamp(o, 0, 1) * S.adapt;

    /* The block travels with depth but never crosses an edge, so a display
       line can never be clipped. Where the viewport is too short to travel
       1:1 across the whole fade window, the parallax is geared down rather
       than the block being cut off. */
    const half = b.h / 2;
    const mTop = 16, mBot = S.narrow ? 12 : 22;
    const safeTop = mTop + half, safeBot = S.h - mBot - half;
    const wanted = Math.min(0.55 * S.mpp, Math.max(0, (safeBot - safeTop) / 2));
    let home = S.sightY + S.textOffset;
    if (safeBot < safeTop) home = S.h / 2;                    // taller than the viewport
    else home = clamp(home, safeTop + wanted, Math.max(safeTop + wanted, safeBot - wanted));
    const trUp = Math.max(1, home - safeTop), trDn = Math.max(1, safeBot - home);
    const gain = clamp(Math.min(trUp, trDn) / ((hold + tail) * S.mpp), 0.16, 1);
    let off = (b.anchor - S.d) * S.mpp * gain;
    if (below) off = Math.max(off, -trUp * 0.5);              // the end of the log stays put
    b.o = o;
    b.y = home + clamp(off, -trUp, trDn);
    b.rise = instant ? 0 : (1 - o) * 26 * Math.sign(S.d - b.anchor || 1);
  }

  /* PASS 2 — two blocks of copy never sit on top of one another: the block
     farther from the sight-line yields, fading out as its neighbour closes in. */
  const live = bands.filter((b) => b.o > 0.004)
    .sort((a, b) => Math.abs(S.d - a.anchor) - Math.abs(S.d - b.anchor));
  for (let i = 1; i < live.length; i++) {
    for (let j = 0; j < i; j++) {
      if (live[j].o <= 0.004) continue;
      const clear = Math.abs(live[i].y - live[j].y) - (live[i].h + live[j].h) / 2;
      live[i].o *= clamp((clear - 6) / 44, 0, 1);
    }
  }

  /* PASS 3 — commit */
  for (const b of bands) {
    b.el.style.opacity = b.o.toFixed(3);
    b.el.style.transform = `translate3d(0,${(b.y + b.rise).toFixed(1)}px,0) translateY(-50%)`;
    b.el.style.visibility = b.o < 0.006 ? 'hidden' : 'visible';
    if (b.o > 0.12) { minTop = Math.min(minTop, b.y - b.h / 2); textRight = Math.max(textRight, b.tw); }
  }
  S.textRight = textRight;
  /* narrow viewports: the geology yields to the type — shafts and
     swatches are clipped above the highest visible block of copy */
  S.clipBot = S.narrow ? Math.max(S.h * 0.10, Math.min(S.h * 0.42, minTop - 10)) : S.h;
  /* narrow: the readout plate owns the top-right corner — the casings start
     below it rather than running underneath it */
  S.clipTop = S.narrow
    ? Math.min(S.h * 0.3, Math.max(
        document.getElementById('readout').getBoundingClientRect().bottom,
        document.getElementById('docmode').getBoundingClientRect().bottom) + 12)
    : 0;

  ticksEl.style.transform = `translate3d(0,${(S.sightY - S.d * S.mpp).toFixed(1)}px,0)`;

  const st = stratumAt(clamp(S.d, 0, D_MAX));
  const near = Math.abs(S.d - HARDPAN) < 0.16 ? 'HARDPAN' : st.name;
  if (roStrat.textContent !== near) roStrat.textContent = near;
  const dtxt = clamp(S.d, 0, D_MAX).toFixed(2) + ' m';
  roDepth.textContent = dtxt;
  cursorval.textContent = clamp(S.d, 0, D_MAX).toFixed(2);
  /* the metre label nearest the cursor would collide with it — drop it */
  const dc = clamp(S.d, 0, D_MAX);
  for (const l of tickLabels) {
    const hide = Math.abs(+l.dataset.m - dc) < 0.42;
    if (hide !== (l.style.opacity === '0')) l.style.opacity = hide ? '0' : '';
  }
  ruler.setAttribute('aria-valuenow', clamp(S.d, 0, D_MAX).toFixed(2));
  ruler.setAttribute('aria-valuetext', `${clamp(S.d, 0, D_MAX).toFixed(2)} metres — ${near}`);

  // focus: field log in the right margin
  if (S.focus >= 0) {
    const s = SHAFTS[S.focus];
    const sample = SAMPLES.find((sm) => sm.shaft === S.focus && sm.stratum.code === st.code);
    /* the entry node lives in the field layer in section mode — reach it through
       the sample, not through the article it came from */
    const entry = sample && sample.entry;
    roCoreRow.hidden = false;
    roCore.textContent = `${s.key} / ${sample ? sample.code : '—'}`;
    if (entry) {
      fieldlog.hidden = false;
      fieldlog.style.setProperty('--core', css(s.col));
      document.getElementById('fl-name').textContent = s.key;
      document.getElementById('fl-code').textContent = sample ? sample.code : '';
      fieldlog.querySelector('.fl-ind').textContent = s.industry;
      fieldlog.querySelector('.fl-text').textContent = entry.querySelector('.entrytext').textContent;
      fieldlog.style.opacity = (S.adapt * 0.99).toFixed(2);
    } else {
      fieldlog.hidden = true;
    }
  } else {
    roCoreRow.hidden = true;
    fieldlog.hidden = true;
  }
}

/* ── 7. FOCUS, LEGEND, DOCUMENT MODE ──────────────────────────────── */

function setFocus(i) { S.focus = i; if (i >= 0) firstTouch(); }

const legend = document.getElementById('legend');
const legendList = document.getElementById('legend-list');
const legendBtn = document.getElementById('legendbtn');
[...STRATA].forEach((s) => {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.type = 'button';
  b.innerHTML = `<span>${s.name}</span><span class="lg-depth">${s.top.toFixed(1)} – ${s.bot.toFixed(1)} M</span>`;
  b.addEventListener('click', () => {
    closeLegend();
    glideTo(clamp((s.top + s.bot) / 2 - (s.code === 'TOP' ? 0.5 : 0), 0, D_MAX), 1200);
  });
  li.appendChild(b);
  legendList.appendChild(li);
});
function openLegend() {
  S.legend = true; legend.hidden = false;
  legend.querySelector('button').focus();
}
function closeLegend() {
  S.legend = false; legend.hidden = true; legendBtn.focus();
}
legendBtn.addEventListener('click', openLegend);
legend.addEventListener('pointerdown', (e) => { if (e.target === legend) closeLegend(); });

const docBtn = document.getElementById('docmode');
function toggleMode() {
  S.mode = S.mode === 'section' ? 'doc' : 'section';
  document.body.dataset.mode = S.mode;
  document.documentElement.dataset.mode = S.mode;
  docBtn.setAttribute('aria-pressed', String(S.mode === 'doc'));
  docBtn.textContent = S.mode === 'doc' ? 'READ AS SECTION' : 'READ AS DOCUMENT';
  if (S.mode === 'doc') { S.focus = -1; relocateEntries(); scrollTo(0, 0); }
  else { relocateEntries(); resize(); placeDocBtn(); }
}
docBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMode(); });
/* the same offer, made in prose at the surface: a visitor who would rather
   read than descend should not have to find the instrument plate first */
document.querySelectorAll('[data-doc]').forEach((el) => {
  el.addEventListener('click', (e) => { e.stopPropagation(); toggleMode(); });
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
});

/* ── 8. LOOP ──────────────────────────────────────────────────────── */

/* eye-adaptation dip: hides the ink inversion at the lamp depth so no
   text is ever painted inside the sub-AA crossover window */
function adaptation(d) {
  if (reduceMotion.matches) return 1;
  const w = 0.62;
  const t = clamp(Math.abs(d - LAMP_D) / w, 0, 1);
  return lerp(0.04, 1, smooth(t));
}

let raf = null;
function frame(now) {
  raf = requestAnimationFrame(frame);
  if (S.mode !== 'section') return;
  OV.t = (now || 0) / 1000;
  physics(now);
  S.L = lightness(clamp(S.d, 0, D_MAX));
  S.ink = inkFor(S.L);
  S.adapt = adaptation(clamp(S.d, 0, D_MAX));
  updateDom();
  overtureDom(S.d);
  if (!document.hidden) paint();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
  else if (!raf) raf = requestAnimationFrame(frame);
});

/* the document-mode toggle sits under the readout plate, whatever its height */
function placeDocBtn() {
  const r = document.getElementById('readout').getBoundingClientRect();
  /* the readout is display:none in document mode, and toggling modes changes
     the scrollbar, which fires resize — measuring it then would pin the button
     to the top of the viewport and leave it there over the plate on return */
  if (!r.height) return;
  docBtn.style.top = Math.round(r.bottom + 10) + 'px';
}
addEventListener('resize', placeDocBtn);

relocateEntries();
/* open at the top of the overture; a reduced-motion visitor starts on the
   ground, past the animation, exactly as the section's own bands do */
S.d = S.target = reduceMotionOv.matches ? 0 : OVERTURE_M;
try { const arc = document.getElementById('ov-arc-c'); if (arc) OV.arcLen = arc.getTotalLength(); } catch (e) {}

resize();
placeDocBtn();
document.fonts && document.fonts.ready.then(() => { resize(); placeDocBtn(); });
raf = requestAnimationFrame(frame);

/* expose a small probe for automated contrast QA */
window.__tigris = {
  get depth() { return S.d; },
  set depth(v) { S.glide = null; S.v = 0; setDepth(v); },
  lightness, inkFor, LAMP_D, LAMP_L, SAMPLES, STRATA, S,
  yOf, dOf,
  shaftAt: (i, d) => shaftX(SHAFTS[i], d),
  shaftEnd: (i) => SHAFTS[i].end,
  shaftDrilling: (i) => !!SHAFTS[i].drilling,
  shaftOn: (i) => shaftActive(i),
  get clipBot() { return S.clipBot; },
  get clipTop() { return S.clipTop; },
  get labelRects() { return S.labelRects || []; },
};
