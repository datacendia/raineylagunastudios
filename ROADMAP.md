# raineylagunastudios — Roadmap to 100%

> **Constraint:** no new paid services. Only time and effort. Items
> requiring a new subscription, paid font, paid plugin, or paid asset
> licence are excluded. Items that use *existing* paid services
> (Resend via the CRM, Cloudflare, the Netlify deployment) and stay
> within their envelope are included.
>
> **Status as of 2026-05-10:** ~90% complete. Static HTML, 124/124
> health checks, 23/23 sanitize tests passing, 0 npm vulnerabilities
> after the vitest@4 bump. Voice register canonical (`COLOFON.md`
> §15). Remaining gaps are content-system and engagement loops.
>
> **Reconciliation 2026-05-17:** Critical #6 (Lighthouse CI) shipped
> in `b196fba`/`ca07f83`/`de66b5e`. Critical #1 generator
> (`scripts/proof-of-fabrication.js`) is implemented and 6 demo proof
> JSONs (`DEMO-0001` through `DEMO-0011`) already exist in
> `data/proofs/` — what's missing is the public-facing renderer
> (#3). Strategic #18 (Twin sale) has its data layer in
> `data/twins.json`; only the UI surface remains. Effective
> completion ~93%; remaining CRITICAL: #2 (drops page), #3 (proofs
> page renderer), #4 (twin-wall counter), #5 (newsletter signup).
>
> **Voice register:** atmospheric, slow, poetic, Spanish-first.
> Capitalised brand words ("Relic of Ages", "Arthur Vance") are sparing.
> Run `npm run wrap` before commit. Verify SRI on any new CDN import.

---

## CRITICAL — blocking 100%

### 1. `scripts/new-proof.mjs` — proof-of-fabrication generator ⚠️ generator already exists as `scripts/proof-of-fabrication.js` (21 KB); 6 demo JSONs in `data/proofs/`; only the public renderer (#3) is open
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
- **Why:** No way to subscribe to studio updates or the Relic of Ages
  wishlist. The single most underused channel for an atmospheric brand
  like this is a monthly letter.
- **How:** Single email field on the homepage + the `/relic/` page.
  POSTs to a new endpoint in `raineylaguna-crm` (free; reuse the
  existing Postgres + Resend). Per `Ley Nº 29733`, single opt-in is
  lawful in Peru for legitimate-interest sends; no double opt-in
  required. Honour `cancelar`/`unsubscribe` requests with a token
  link in every send.
- **Effort:** 4 hours (UI + the CRM endpoint).

### ~~6. Lighthouse CI step~~ ✅ shipped (`b196fba` + `ca07f83` + `de66b5e`)
- **Why:** `.github/workflows/ci.yml` already foreshadows it:
  *"Adding more checks later (markdown link-check, lychee for
  external links, Lighthouse CI) is straightforward"*.
- **How:** New job in `ci.yml` runs `@lhci/cli` against the four
  primary pages (home, about, relic). Free, no token
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
- Netlify serves Brotli/gzip automatically; verify on prod.
- **Effort:** 30 min.

### 29. Per-page OG images via `scripts/og-render.mjs`
- Use the existing `og-image.html` template + headless Playwright
  (already a devDep). Free, build-time.
- **Effort:** 4 hours.

---

## PAID SERVICES — what's genuinely required

> Test for inclusion here: *can this item ship at production quality
> without the spend?* The studios site is intentionally static; the
> *software* costs almost nothing. The *physical* studio costs
> something — but that's materials and equipment, not infrastructure.

### Required for production (non-negotiable, software-side)

**None.** This site is genuinely free to run at production:

- **Hosting:** Netlify free tier (100 GB bandwidth, sufficient for an
  atmospheric studio site at any plausible traffic).
- **Domain:** `raineylagunastudios.com` already owned.
- **Analytics:** Cloudflare Analytics injection script (free).
- **CDN imports** (esm.sh, cdn.jsdelivr.net for the few atmospheric
  client-side libraries) are free public CDNs.

**Floor cost: US$ 0 / month new spend.**

### Required for production (non-negotiable, physical-side)

This is what differentiates the studios brand: software is free but
the physical-trace thesis is not. These are studio expenses you
already incur; called out so the roadmap is honest.

- **3D printing consumables (~S/ 50 – 150 / kg PLA / PETG / PLA-CF).**
  Per Twin Wall / Proof of Fabrication shipment. Not infrastructure;
  per-piece cost.
- **Hydroprinting film + activator (~S/ 80 – 200 per drop).**
  Per drop, not per month.
- **Ceramic / glaze for fired pieces (~S/ 30 – 100 per tile).**
  Per twin shipment.
- **Shipping (~S/ 15 – 40 per twin).** Glovo / Olva domestic; DHL
  if international.

These are revenue-aligned: a twin only ships when a digital order
ships, and the digital order pays for the twin many times over.

### Strongly recommended (software, optional)

- **Resend (shared via CRM).** If the newsletter (CRITICAL item 5)
  grows past ~50 subscribers receiving monthly sends, the CRM's
  Resend tier may need upgrading. Same envelope as vigia /
  raineylaguna-crm. **Not required to launch the newsletter.**

- **Owncast self-hosted on Railway (US$ 5 / mo) OR YouTube Live
  (free).** For the "Open studio hours" livestream (STRATEGIC item
  20). YouTube is free and reaches further; Owncast is brand-
  aligned but requires another Railway service. **Not required to
  launch the *page* — only when you start streaming.**

- **A custom typeface license.** If the studio ever commissions a
  custom display face (which would be on-brand), expect S/ 500 –
  2 000 one-time. Until then, Google Fonts + system fonts cover the
  register. **Not required at any point.**

### Wouldn't pay for

- **A headless CMS.** Files in `data/` *are* the CMS. The friction
  is the point.
- **An image CDN.** Netlify's edge cache + WebP/AVIF source
  conversion handle this for free.
- **A custom analytics tool.** Cloudflare Analytics suffices.
- **A "studio management" SaaS (Houzz Pro, Studio Designer, etc.).**
  This repo + the CRM cover the same ground.

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
