/* Rainey Laguna Studios — HTML/JS/JSON-LD parser-validator.
   Validates inline <script> and <script type="application/ld+json"> blocks
   in every shipped HTML page. Run from repo root:
     node scripts/check-html.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { DANGEROUS_RE } from './lib/sanitize.mjs';

const PAGES = [
  'index.html',
  'verify.html',
  '404.html',
  'about/index.html',
  'marca/index.html',
  'memory/index.html',
  'work/index.html',
  'servicios/index.html',
  'journal/index.html',
  'journal/firmar-objetos/index.html',
  'journal/tres-meses/index.html',
  'privacy/index.html',
  'terms/index.html',
  'og-image.html',
];

let total = 0, fail = 0;

for (const rel of PAGES) {
  const abs = path.resolve(rel);
  if (!fs.existsSync(abs)) {
    console.log(`SKIP ${rel} (not found)`);
    continue;
  }
  const html = fs.readFileSync(abs, 'utf8');
  console.log(`\n— ${rel} (${html.length} chars) —`);

  // 1. JSON-LD blocks
  const ldRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let i = 0;
  for (const m of html.matchAll(ldRe)) {
    i++; total++;
    try { JSON.parse(m[1]); console.log(`  jsonld ${i}: OK`); }
    catch (e) { fail++; console.log(`  jsonld ${i}: FAIL — ${e.message}`); }
  }

  // 2a. data-html="true" strings are interpolated into innerHTML by the
  //     i18n layer (see the apply() loop at end of index.html). The adjacent
  //     data-es / data-en values on the SAME element are therefore trusted
  //     as HTML at render time. Refuse any value that contains <script>,
  //     <iframe>, <object>, <embed>, <style>, javascript:, or an inline
  //     event-handler attribute (on*=). Benign inline tags (<em>, <strong>,
  //     <a href="https://...">, <br>) are allowed.
  //
  //     We match whole opening tags (from '<' through the next unescaped
  //     '>') via a regex that understands double-quoted attribute values,
  //     then inspect only tags whose text contains data-html="true".
  const tagRe = /<[a-zA-Z][^>"]*(?:"[^"]*"[^>"]*)*>/g;
  // DANGEROUS_RE imported from ./lib/sanitize.mjs - same source of truth
  // as the unit tests in scripts/lib/sanitize.test.mjs.
  const attrRe = /data-(?:es|en|title-es|title-en|desc-es|desc-en|placeholder-es|placeholder-en)="([^"]*)"/g;
  let dhIdx = 0;
  for (const tagMatch of html.matchAll(tagRe)) {
    const tag = tagMatch[0];
    if (!tag.includes('data-html="true"')) continue;
    dhIdx++;
    let checked = 0, bad = 0;
    for (const a of tag.matchAll(attrRe)) {
      checked++; total++;
      if (DANGEROUS_RE.test(a[1])) {
        fail++; bad++;
        console.log(`  data-html ${dhIdx}: FAIL — dangerous token in ${a[0].slice(0, 60)}…`);
      }
    }
    if (checked > 0 && bad === 0) {
      // keep noise down — one compact OK per tag
      console.log(`  data-html ${dhIdx}: OK (${checked} i18n attrs clean)`);
    }
  }

  // 1b. SRI guard. Today the site has 0 CDN <script src="https://..."> tags
  //     and 0 CDN <link rel="stylesheet" href="https://..."> tags — every
  //     script lives under /scripts/ and every stylesheet is inline. The
  //     moment someone introduces an external CDN asset, this check makes
  //     CI red until they add `integrity="sha384-..." crossorigin="anonymous"`.
  //     Per rainey-stack/CONVENTIONS.md §13.5 (SRI rule).
  const cdnScriptRe = /<script\b[^>]*\bsrc=["']https?:\/\/[^"']+["'][^>]*>/gi;
  const cdnLinkRe = /<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']https?:\/\/[^"']+["'][^>]*>/gi;
  for (const m of html.matchAll(cdnScriptRe)) {
    total++;
    if (/\bintegrity=/i.test(m[0])) {
      console.log(`  sri script: OK`);
    } else {
      fail++;
      console.log(`  sri script: FAIL — CDN <script src=…> missing integrity= attribute: ${m[0].slice(0, 100)}`);
    }
  }
  for (const m of html.matchAll(cdnLinkRe)) {
    total++;
    if (/\bintegrity=/i.test(m[0])) {
      console.log(`  sri link: OK`);
    } else {
      fail++;
      console.log(`  sri link: FAIL — CDN <link rel=stylesheet> missing integrity= attribute: ${m[0].slice(0, 100)}`);
    }
  }

  // 2. Inline JS blocks — parse-check only (no exec; DOM APIs unavailable).
  //    Skip non-JS script types: ld+json (handled above) and importmap (JSON).
  const jsRe = /<script(?![^>]*type="application\/ld\+json")(?![^>]*type="importmap")(?![^>]*src=)(?:[^>]*)>([\s\S]*?)<\/script>/g;
  let j = 0;
  for (const m of html.matchAll(jsRe)) {
    j++; total++;
    try {
      new vm.Script(m[1], { filename: `${rel}-inline-${j}.js` });
      console.log(`  js ${j}: OK (${m[1].length} chars)`);
    } catch (e) {
      fail++;
      console.log(`  js ${j}: FAIL — ${e.message}`);
    }
  }
}

// 3. Standalone .js modules referenced from index.html
const SCRIPT_MODULES = [
  'scripts/hydroprint-lab.js',
  'scripts/lab-qr-snapshot.js',
  'scripts/memory-object.js',
  'scripts/proof-of-fabrication.js',
  'scripts/reverse-commissioning.js',
  'scripts/twin-wall.js',
];
console.log(`\n— standalone modules —`);
for (const rel of SCRIPT_MODULES) {
  const abs = path.resolve(rel);
  if (!fs.existsSync(abs)) {
    console.log(`  SKIP ${rel} (not found)`);
    continue;
  }
  total++;
  const src = fs.readFileSync(abs, 'utf8');
  const isModule = /^\s*(import|export)\s/m.test(src);
  let r;
  if (isModule) {
    // Pipe source through stdin so we can pass --input-type=module without
    // touching package.json's "type" field (which would break commonjs deps).
    r = spawnSync(process.execPath,
      ['--input-type=module', '--check', '-'],
      { encoding: 'utf8', input: src });
  } else {
    r = spawnSync(process.execPath, ['--check', abs], { encoding: 'utf8' });
  }
  if (r.status === 0) {
    console.log(`  ${rel}: OK (${src.length} chars${isModule ? ', ESM' : ''})`);
  } else {
    fail++;
    const msg = (r.stderr || '').split('\n').find(l => l.trim()) || 'syntax error';
    console.log(`  ${rel}: FAIL — ${msg}`);
  }
}

// 4. Validate the data/ JSON files too
const DATA_FILES = [
  'data/twins.json',
  'data/proofs/DEMO-0001.json',
  'data/drops.json',
  'data/brand/color-witness.json',
  'data/brand/asset-manifest.json',
  'site.webmanifest',
  'sitemap.xml',
];
console.log(`\n— data files —`);
for (const rel of DATA_FILES) {
  const abs = path.resolve(rel);
  if (!fs.existsSync(abs)) {
    console.log(`  SKIP ${rel} (not found)`);
    continue;
  }
  const src = fs.readFileSync(abs, 'utf8');
  total++;
  if (rel.endsWith('.json') || rel === 'site.webmanifest') {
    try { JSON.parse(src); console.log(`  ${rel}: OK (JSON, ${src.length} chars)`); }
    catch (e) { fail++; console.log(`  ${rel}: FAIL — ${e.message}`); }
  } else if (rel.endsWith('.xml')) {
    // sanity check — non-empty + has the expected root
    const has = src.includes('<urlset') && src.includes('</urlset>');
    if (has) console.log(`  ${rel}: OK (XML, ${src.length} chars)`);
    else { fail++; console.log(`  ${rel}: FAIL — missing <urlset> root`); }
  }
}

console.log(`\n========================================`);
console.log(`${total - fail} / ${total} checks passed${fail ? ` · ${fail} failed` : ''}`);
process.exit(fail ? 1 : 0);
