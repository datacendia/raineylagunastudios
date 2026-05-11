# raineylagunastudios — Roadmap to 100%

> **Constraint:** no new paid services. Only time and effort. Items
> requiring a new subscription, paid font, paid plugin, or paid asset
> licence are excluded. Items that use *existing* paid services
> (Resend via the CRM, Cloudflare, the Vercel deployment) and stay
> within their envelope are included.
>
> **Status as of 2026-05-10:** ~90% complete. Static HTML, 124/124
> health checks, 23/23 sanitize tests passing, 0 npm vulnerabilities
> after the vitest@4 bump. Voice register canonical (`COLOFON.md`
> §15). Remaining gaps are content-system and engagement loops.
>
> **Voice register:** atmospheric, slow, poetic, Spanish-first.
> Capitalised brand words ("Twin", "Almanac", "Proof") are sparing.
> Run `npm run wrap` before commit. Verify SRI on any new CDN import.

---

## CRITICAL — blocking 100%

### 1. `scripts/new-proof.mjs` — proof-of-fabrication generator
- **Why:** The thesis is *"every interaction on this site leaves a
  physical trace in the real world."* Only `data/proofs/DEMO-0001.json`
  exists. Every shipment from now on needs a proof JSON, and writing
  one by hand each time is friction we will not pay.
- **How:** Node CLI that prompts for shipment fields (recipient,
  origin commission, materials, weight, finished_at), produces a
  signed JSON in `data/proofs/PROOF-<n>.json`, increments the
  manifest, and prints the shareable `/proofs/<id>` URL.
- **Effort:** 4 hours.

### 2. `/drops/` page rendering `data/drops.json`
- **Why:** The JSON exists (`data/drops.json`) with past + upcoming
  limited editions. No page reads it. Atmospheric scarcity is a
  free-tier feature you already wrote the data for.
- **How:** New `drops/index.html` rendering the JSON as a vertical
  calendar. Each drop shows quantity-remaining, claim deadline,
  thumbnail. Mark sold-out drops with a different visual register
  rather than hiding them — the archive itself is brand.
- **Effort:** 2 hours.

### 3. `/proofs/<id>/` static page generator
- **Why:** Each proof JSON should render at a stable URL so
  recipients can verify "yes this came from this studio". Currently
  the data is private.
- **How:** Extend the existing build pipeline (or a new
  `scripts/build-proofs.mjs`) to walk `data/proofs/*.json` and emit
  one `proofs/<id>/index.html` per entry. Template: tile photo,
  signature, materials, date, recipient (with permission).
- **Effort:** 4 hours.

### 4. Twin-wall counter on the homepage
- **Why:** Live evidence of the thesis. "37 piezas impresas este
  mes · 4 hidroimpresiones · 12 commissions abiertas". Updates as
  proofs land.
- **How:** A small bit of build-time JS reads
  `data/proofs/*.json` and writes the counts into a partial that
  the homepage includes. Updates next build, not live; that's fine.
- **Effort:** 2 hours.

### 5. Newsletter signup primitive
- **Why:** No way to subscribe to the almanac drops. The single most
  underused channel for an atmospheric brand like this is a monthly
  letter.
- **How:** Single email field on the homepage + the `/almanac/` page.
  POSTs to a new endpoint in `raineylaguna-crm` (free; reuse the
  existing Postgres + Resend). Per `Ley Nº 29733`, single opt-in is
  lawful in Peru for legitimate-interest sends; no double opt-in
  required. Honour `cancelar`/`unsubscribe` requests with a token
  link in every send.
- **Effort:** 4 hours (UI + the CRM endpoint).

### 6. Lighthouse CI step
- **Why:** `.github/workflows/ci.yml` already foreshadows it:
  *"Adding more checks later (markdown link-check, lychee for
  external links, Lighthouse CI) is straightforward"*.
- **How:** New job in `ci.yml` runs `@lhci/cli` against the four
  primary pages (home, marca, almanac, journal). Free, no token
  required for public reports.
- **Effort:** 2 hours.

**Total critical: ~2 days.**

---

## POLISH — non-blocking

### 7. i18n innerHTML safety CI step
- **Why:** `scripts/lib/sanitize.test.mjs` covers known strings. A
  new translation could slip a `<script>` past it.
- **How:** Add to `check-html.mjs` a sweep that finds every
  `data-html="true"` element and ensures its `data-es` and `data-en`
  attributes pass `sanitize()`. Already half-implemented per the
  comment in `ci.yml`.
- **Effort:** 1 hour.

### 8. lychee external link check in CI
- **Why:** Studio site links to external sources (open-meteo,
  plausible, esm.sh). When they 404, we don't know.
- **How:** New job in `ci.yml` runs `lycheeverse/lychee-action`. Free.
- **Effort:** 1 hour.

### 9. WebP / AVIF source variants
- **Why:** PNG hero assets are heavy. Modern formats save 40–60%
  with `<picture>` fallback.
- **How:** `scripts/optimize-images.mjs` using `sharp` (free, no
  service). Generates `.webp` + `.avif` siblings; templates pick the
  right one via `<picture>`.
- **Effort:** 4 hours.

### 10. Service worker for offline reading
- **Why:** Atmospheric site, slow read; offline-friendly is on-brand.
- **How:** Vanilla service worker (no Workbox); caches HTML +
  critical CSS on first visit; serves stale-while-revalidate. Skip
  POST endpoints (proofs verification etc.).
- **Effort:** 4 hours.

### 11. Print stylesheet for `COLOFON.md`-derived pages
- **Why:** The colofón is the document people print and pin in
  studios. Default print output strips brand.
- **How:** `@media print` block in `assets/css/print.css`. Bone
  ground, serif body, ink rules, footer with the proof URL.
- **Effort:** 2 hours.

### 12. Skip-to-main-content link
- **Why:** Accessibility. WCAG 2.4.1.
- **How:** First focusable element on every page, `sr-only`-style.
- **Effort:** 30 min × pages, or 1 hour if added to the template.

### 13. Reduce hero-shader on `prefers-reduced-motion`
- **Why:** Vestibular accessibility for the existing hero canvas.
- **How:** Wrap shader init in a `matchMedia('(prefers-reduced-
  motion: reduce)')` check; fall back to a static gradient.
- **Effort:** 1 hour.

### 14. Bilingual `data-en` audit
- **Why:** Some `data-en` strings drift from `data-es` semantics
  over time.
- **How:** A new `scripts/check-i18n.mjs` that compares lengths,
  flags strings where one locale is empty, and warns on token
  count differences > 25%. Run in CI.
- **Effort:** 2 hours.

### 15. CHANGELOG.md from conventional commits
- **Same as the other repos.** 2 hours.

### 16. Pre-commit hooks
- **Same as the other repos.** 1 hour.

### 17. SECURITY.md
- **Same as the other repos.** 30 min.

---

## STRATEGIC — meaningful position shifts

### 18. "Twin sale" pairing
- **Why:** Every digital product (a Sereno subscription, a website
  project) automatically generates a *physical twin* shipped to the
  customer 3 weeks later. No design studio in LATAM does the
  digital/physical fusion as a gift.
- **How:** New `twins/` directory in `data/`; one JSON per pairing
  (digital_order_id, physical_proof_id, twin_relationship). UI on
  homepage references the most recent twin. The actual twin
  fabrication is studio process work, not code.
- **Effort:** 1 day (data model + UI) + ongoing studio time.

### 19. Public studio bitácora
- **Why:** Your most authentic SEO + brand asset. 200–400 words a
  Sunday, in the §15 voice register. Costs you 30 min/week and
  produces compounding content.
- **How:** New `bitacora/` directory; one `.html` per week (no MDX
  tooling needed — site is intentionally HTML). Index page lists
  entries reverse-chronologically. RSS feed at `bitacora/feed.xml`
  for the few people who still subscribe to feeds.
- **Effort:** 4 hours to scaffold; ~30 min per weekly entry forever.

### 20. "Open studio hours" placeholder
- **Why:** One Friday afternoon a month the studio livestreams via
  a single fixed camera. No commentary, no edits. The antithesis of
  the polished agency reel.
- **How:** New `/abierto/` page with the schedule + a placeholder
  for the embedded stream. Free embed via YouTube/Owncast etc. when
  it's live; static `EN VIVO · viernes 18:00` countdown otherwise.
  Linked from the homepage.
- **Effort:** 2 hours for the page; calendar-time discipline for
  the livestream itself.

### 21. Almanac preorder ledger (no payment)
- **Why:** The almanac directory exists; preorders are listed in
  `data/`. A ledger of who has reserved which copy turns a
  preorder into a public commitment.
- **How:** Form posts to a new CRM endpoint that adds a row to
  `almanac_reservations`. UI on `/almanac/` shows
  "27 reservadas · 73 copias disponibles". No payment processing —
  the studio collects on shipment.
- **Effort:** 4 hours.

### 22. Reverse-commissioning catalogue
- **Why:** `scripts/reverse-commissioning.js` exists and is
  documented in `COMMONS.md`. The public-facing surface that
  explains it is thin.
- **How:** `/commissions/` page that explains the reverse-
  commissioning model with the existing script's output as
  evidence. Drops a CTA to the CRM intake form.
- **Effort:** 4 hours.

---

## STRETCH

### 23. JSON-LD validation per-page in build
- Already in `check-jsonld.mjs`; tighten with full schema.org
  resolver.
- **Effort:** 3 hours.

### 24. Search the journal
- Pagefind at build time, free, static.
- **Effort:** 4 hours.

### 25. RSS feed for `/journal/`
- Static `journal/feed.xml` regenerated on each new entry.
- **Effort:** 2 hours.

### 26. View-transitions for entry navigation
- Native browser support; progressive enhancement.
- **Effort:** 3 hours.

### 27. `humans.txt` audit
- Already exists; verify accuracy.
- **Effort:** 15 min.

### 28. Brotli-precompressed assets
- Already in `vercel.json` indirectly; verify on prod.
- **Effort:** 30 min.

### 29. Per-page OG images via `scripts/og-render.mjs`
- Use the existing `og-image.html` template + headless Playwright
  (already a devDep). Free, build-time.
- **Effort:** 4 hours.

---

## EXPLICITLY NOT DOING

- **Build step / React migration.** The intentional staticness is
  part of the register. Do not adopt a framework.
- **Headless CMS.** Files in `data/` are the CMS. The friction is
  the point.
- **Auto-translation.** Every `data-en` string is written, not
  machine-translated. Voice register §15 is non-negotiable.
- **NFT / blockchain "verifiable" proofs.** A signed JSON in this
  repo is the chain of custody; the studio's signature is the
  authority.
- **Ad slots.** Ever.

---

## SUMMARY

| Category | Items | Total effort |
|---|---|---|
| Critical | 6 | ~2 days |
| Polish | 11 | ~1.5 days |
| Strategic | 5 | ~3 days |
| Stretch | 7 | ~1.5 days |

**Recommended ship order:**

1. Critical 1 + 3 (proof generator + page renderer) — unlocks
   everything else proof-related.
2. Critical 2 + 4 (drops page + twin-wall counter) — visible
   evidence of the thesis on the homepage.
3. Critical 5 (newsletter) — the recurring engagement loop.
4. Critical 6 (Lighthouse CI) — quality gate.
5. Strategic 19 (bitácora) — recurring brand asset on autopilot.
6. Polish 9 + 13 (perf + a11y) — quality floor.
7. Strategic 18 (twin sale) — biggest brand differentiator.
8. Stretch as quiet days arrive.
