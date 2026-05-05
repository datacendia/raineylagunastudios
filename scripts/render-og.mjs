/* Rainey Laguna · OG image renderer
   Renders og-image.html to og-image.png at exactly 1200×630 so social previews
   (Twitter, WhatsApp, Facebook, LinkedIn) have a PNG to consume — most of them
   do not render SVG reliably.

   One-time setup (Windows PowerShell):
     npm init -y
     npm i -D playwright
     npx playwright install chromium

   Then any time og-image.html changes:
     node scripts/render-og.mjs

   After first successful run, switch og:image and twitter:image meta tags in
   index.html + en/index.html from .svg to .png.
*/
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
const src = 'file:///' + path.join(ROOT, 'og-image.html').replace(/\\/g, '/');
await page.goto(src, { waitUntil: 'networkidle' });
// Wait for webfonts to be fully loaded so Fraunces renders correctly.
await page.evaluate(() => document.fonts.ready);

const el = await page.locator('.og-card');
const out = path.join(ROOT, 'og-image.png');
await el.screenshot({ path: out, omitBackground: false });

await browser.close();
const bytes = fs.statSync(out).size;
console.log(`  + og-image.png  (${(bytes / 1024).toFixed(1)} KB, 2400×1260 @2x)`);
console.log('  Next: update og:image + twitter:image meta tags in index.html and en/index.html from .svg to .png.');
