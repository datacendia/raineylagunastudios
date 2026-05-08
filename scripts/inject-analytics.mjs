/* Rainey Laguna Studios — analytics snippet injector.
 *
 * Idempotent: each run replaces (or removes) the marked block, never
 * duplicates it. Safe to commit the result.
 *
 * Usage:
 *   CF_BEACON_TOKEN=xxx node scripts/inject-analytics.mjs        # inject
 *   CF_BEACON_TOKEN= node scripts/inject-analytics.mjs           # remove
 *   node scripts/inject-analytics.mjs                            # remove
 *
 * The HTML block we insert is bracketed by HTML comments so future runs
 * can find it deterministically:
 *   <!-- BEGIN cf-analytics -->
 *   <script ...></script>
 *   <!-- END cf-analytics -->
 *
 * Token is created in CF dashboard → Analytics & Logs → Web Analytics
 * (see rainey-stack/INFRA-SETUP.md).
 */

import fs from "node:fs";
import path from "node:path";

const PAGES = [
  "index.html",
  "verify.html",
  "404.html",
  "about/index.html",
  "marca/index.html",
  "memory/index.html",
  "work/index.html",
  "servicios/index.html",
  "journal/index.html",
  "journal/firmar-objetos/index.html",
  "journal/tres-meses/index.html",
  "privacy/index.html",
  "terms/index.html",
  // og-image.html is a render target, not a page humans visit — skip.
];

const BEGIN = "<!-- BEGIN cf-analytics -->";
const END = "<!-- END cf-analytics -->";
// Match the existing block (greedy through END), case-sensitive.
const BLOCK_RE = new RegExp(`${escape(BEGIN)}[\\s\\S]*?${escape(END)}\\n?`, "g");

function escape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const token = (process.env.CF_BEACON_TOKEN ?? "").trim();
const snippet = token
  ? `${BEGIN}
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${token}"}'></script>
${END}
`
  : "";

let changed = 0;
let skipped = 0;
for (const rel of PAGES) {
  const abs = path.resolve(rel);
  if (!fs.existsSync(abs)) {
    console.log(`  skip ${rel} (not found)`);
    skipped++;
    continue;
  }
  let html = fs.readFileSync(abs, "utf8");
  const before = html;
  html = html.replace(BLOCK_RE, "");
  if (token) {
    if (!html.includes("</body>")) {
      console.log(`  skip ${rel} (no </body> tag)`);
      skipped++;
      continue;
    }
    html = html.replace("</body>", `${snippet}</body>`);
  }
  if (html !== before) {
    fs.writeFileSync(abs, html);
    console.log(`  updated ${rel}`);
    changed++;
  } else {
    console.log(`  unchanged ${rel}`);
  }
}

console.log(
  `\n${changed} updated, ${skipped} skipped — analytics ${
    token ? "injected" : "removed"
  }.`,
);
