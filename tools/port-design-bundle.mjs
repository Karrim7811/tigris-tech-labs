#!/usr/bin/env node
/**
 * port-design-bundle.mjs
 *
 * Ports a Claude Design ".dc.html" handoff bundle into the single
 * self-contained static index.html this repo deploys.
 *
 * The design tool exports a prototype that runs on a proprietary in-browser
 * runtime: a <x-dc> custom element, a <helmet> head block, "{{ ref }}"
 * bindings, and a DCLogic base class supplied by support.js. The handoff
 * README is explicit that none of that runtime may ship. This script strips
 * it and leaves the authored markup, CSS and animation logic untouched.
 *
 *   node tools/port-design-bundle.mjs <bundle.dc.html | bundle-dir> [options]
 *
 *   --out <path>   output file           (default: index.html beside this repo root)
 *   --dry-run      report, write nothing
 *
 * Exits non-zero on any transform it cannot complete, rather than emitting a
 * half-ported page. Re-running on the same input is deterministic.
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ *
 * Site-level <head>. The design bundle carries fonts and page CSS but
 * knows nothing about our SEO, canonical URL or favicon — those live
 * here and survive every re-port.
 * ------------------------------------------------------------------ */
const SITE_HEAD = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Tigris Tech Labs — Where Intelligence Begins</title>
<meta name="description" content="Tigris Tech Labs is a holding company for AI-native products built deep into single industries — Cortex for peptide research, Alevant for real estate, PRAIX for commercial insurance, and Vitreon for brand and interface.">
<link rel="canonical" href="https://www.tigristechlabs.com/">
<meta property="og:title" content="Tigris Tech Labs — Where Intelligence Begins">
<meta property="og:description" content="A holding company for AI-native products built deep into single industries.">
<meta property="og:url" content="https://www.tigristechlabs.com/">
<meta property="og:type" content="website">
<meta property="og:image" content="https://www.tigristechlabs.com/logo-mark.svg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F2EFE7">
<link rel="icon" type="image/svg+xml" href="logo-mark.svg">`;

/* ------------------------------------------------------------------ *
 * args
 * ------------------------------------------------------------------ */
const argv = process.argv.slice(2);
if (!argv.length || argv.includes('-h') || argv.includes('--help')) {
  console.log(`usage: node tools/port-design-bundle.mjs <bundle.dc.html | bundle-dir> [--out <path>] [--dry-run]

If given a directory, the single *.dc.html inside it is used.
Unzip the handoff bundle first — this script does not read archives.`);
  process.exit(argv.length ? 0 : 1);
}

const dryRun = argv.includes('--dry-run');
const outFlag = argv.indexOf('--out');
const outPath = outFlag !== -1 ? path.resolve(argv[outFlag + 1]) : path.join(REPO, 'index.html');
let input = path.resolve(argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--out'));

if (!fs.existsSync(input)) die(`input not found: ${input}`);
if (fs.statSync(input).isDirectory()) {
  const found = fs.readdirSync(input).filter(f => f.endsWith('.dc.html'));
  if (found.length !== 1) die(`expected exactly one *.dc.html in ${input}, found ${found.length}`);
  input = path.join(input, found[0]);
}

function die(msg) {
  console.error(`\n  port failed: ${msg}\n`);
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * 1. slice the three authored regions out of the prototype
 * ------------------------------------------------------------------ */
const src = fs.readFileSync(input, 'utf8');

const styleBlock = src.match(/<style>\n([\s\S]*?)\n<\/style>/);
if (!styleBlock) die('no <style> block found inside <helmet>');
const css = styleBlock[1];

const markupBlock = src.match(/<\/helmet>\n([\s\S]*?)\n<\/x-dc>/);
if (!markupBlock) die('no markup found between </helmet> and </x-dc>');
let markup = markupBlock[1].trim();

const jsBlock = src.match(/<script type="text\/x-dc"[^>]*>\n([\s\S]*?)\n<\/script>/);
if (!jsBlock) die('no <script type="text/x-dc"> block found');
let js = jsBlock[1];

/* ------------------------------------------------------------------ *
 * 2. markup: runtime bindings -> plain data attributes
 * ------------------------------------------------------------------ */
let refCount = 0;
let handlerCount = 0;

markup = markup.replace(/ref="\{\{\s*([A-Za-z0-9_$]+)\s*\}\}"/g, (_, n) => (refCount++, `data-ref="${n}"`));

// onClick / onInput / onChange / ... -> data-on-click / data-on-input / ...
const handlers = new Set();
markup = markup.replace(/on([A-Z][A-Za-z]*)="\{\{\s*([A-Za-z0-9_$]+)\s*\}\}"/g, (_, evt, fn) => {
  handlerCount++;
  handlers.add(evt);
  return `data-on-${evt.toLowerCase()}="${fn}"`;
});

const leftover = markup.match(/\{\{[^}]*\}\}/g);
if (leftover) {
  die(`unconverted bindings in markup — the design added a binding form this script\n` +
      `  does not know how to port yet:\n    ${[...new Set(leftover)].join('\n    ')}`);
}
if (!refCount) die('no refs converted — is this really a .dc.html export?');

/* ------------------------------------------------------------------ *
 * 3. JS: strip the component runtime, keep the animation logic verbatim
 * ------------------------------------------------------------------ */
const applied = [];
function edit(label, re, replacement, { required = true } = {}) {
  const next = js.replace(re, replacement);
  if (next === js) {
    if (required) die(`transform did not apply: ${label}\n  The export's shape changed; this script needs updating.`);
    return;
  }
  js = next;
  applied.push(label);
}

edit('class shell', /class Component extends DCLogic \{/, 'class Instrument {');
edit('constructor', /constructor\((\w+)\)\{\s*\n\s*super\(\1\);/, (m, p) => `constructor(${p}){\n    this.props = ${p} || {};`);
edit('refs', /React\.createRef\(\)/g, '{current:null}');
edit('renderVals', /\n  renderVals\(\)\{[\s\S]*?\n  \}\n/, '\n');
edit('mount hook', /componentDidMount\(\)\{/, 'mount(){');
edit('editor watchdog', /\n\s*this\.stalled=true;\n\s*this\.watch=setInterval\([\s\S]*?\},\s*\d+\);\n\s*this\.fallback=setInterval\([\s\S]*?\);\n/, '\n    this.stalled=false;\n', { required: false });
edit('unmount hook', /\n  componentWillUnmount\(\)\{[\s\S]*?\n  \}\n/, '\n', { required: false });

for (const banned of ['DCLogic', 'React.', 'this.setState', 'this.forceUpdate']) {
  if (js.includes(banned)) die(`runtime reference survived the port: ${banned}`);
}

/* ------------------------------------------------------------------ *
 * 4. bootstrap — what the runtime used to do for us
 * ------------------------------------------------------------------ */

// Editor props become plain authored defaults.
const propsAttr = src.match(/data-props="([^"]*)"/);
let propsLiteral = '{}';
if (propsAttr) {
  const decoded = propsAttr[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  try {
    const spec = JSON.parse(decoded);
    const pairs = Object.entries(spec).map(([k, v]) => `  ${k}: ${JSON.stringify(v.default)}`);
    propsLiteral = `{\n${pairs.join(',\n')}\n}`;
  } catch {
    die('could not parse the export\'s data-props JSON');
  }
}

const listeners = [...handlers].map(evt =>
  `  document.querySelectorAll('[data-on-${evt.toLowerCase()}]').forEach(el => {
    const fn = app[el.getAttribute('data-on-${evt.toLowerCase()}')];
    if (typeof fn === 'function') el.addEventListener('${evt.toLowerCase()}', fn);
  });`).join('\n\n');

const bootstrap = `
/* ---- bootstrap ---------------------------------------------------- *
 * Generated by tools/port-design-bundle.mjs — do not hand-edit here.
 * Values below are the design's authored defaults (formerly editor props).
 * ------------------------------------------------------------------- */
const INSTRUMENT_PROPS = ${propsLiteral};

function boot(){
  const app = new Instrument(INSTRUMENT_PROPS);

  document.querySelectorAll('[data-ref]').forEach(el => {
    const name = el.getAttribute('data-ref');
    if (app[name]) app[name].current = el;
  });

${listeners}

  app.mount();

  // rAF is throttled in background tabs; reset the clock so dt never spikes
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { app.prev = 0; app.start(); }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
`;

/* ------------------------------------------------------------------ *
 * 5. assemble + check
 * ------------------------------------------------------------------ */
const fonts = (src.match(/<link rel="preconnect"[^>]*>|<link href="https:\/\/fonts\.googleapis\.com[^>]*>/g) || []).join('\n');
if (!fonts) console.warn('  warning: no font <link> found in the bundle');

const script = `${js}\n${bootstrap}`;
try {
  new vm.Script(script, { filename: 'ported.js' });
} catch (err) {
  die(`ported script does not parse: ${err.message}`);
}

const out = `<!DOCTYPE html>
<html lang="en">
<head>
${SITE_HEAD}
${fonts}
<style>
${css}
</style>
</head>
<body>

${markup}

<script>
${script}
</script>
</body>
</html>
`;

const prevSize = fs.existsSync(outPath) ? fs.statSync(outPath).size : 0;

console.log(`  source        ${path.relative(process.cwd(), input)}`);
console.log(`  refs          ${refCount}`);
console.log(`  handlers      ${handlerCount}${handlers.size ? ` (${[...handlers].join(', ')})` : ''}`);
console.log(`  transforms    ${applied.join(', ')}`);
console.log(`  syntax        ok`);
console.log(`  size          ${out.length} bytes${prevSize ? ` (was ${prevSize})` : ''}`);

if (dryRun) {
  console.log(`  dry run       nothing written`);
} else {
  fs.writeFileSync(outPath, out, 'utf8');
  console.log(`  written       ${path.relative(process.cwd(), outPath)}`);
  console.log(`\n  next: verify before pushing —`);
  console.log(`    python -m http.server 8901 --bind 127.0.0.1`);
  console.log(`    python tools/verify-port.py --ported http://127.0.0.1:8901/index.html \\`);
  console.log(`        --original http://127.0.0.1:8902/<bundle>.dc.html`);
}
