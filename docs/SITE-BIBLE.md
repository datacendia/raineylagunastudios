# Rainey Laguna Studios — Site Bible

The complete reference for `raineylagunastudios.com`. For the wider ecosystem
(the sister web-studio brand, the CRM, Railway), see
`raineylaguna-next/docs/ARCHITECTURE.md`.

> **What this is.** A hand-built **static** site (plain HTML/CSS/JS, no
> framework), deployed on **Netlify**. It is a **game studio** site — its whole
> purpose is the game, *Relic of Ages*. (It was repositioned from a
> "creative & AI studio" to game-only; the AI services moved to the sister
> brand at `raineylaguna.com`.)

---

## 1. The brand

Rainey Laguna Studios is the **game studio**: it builds *Relic of Ages*, a
historical-investigation game made in Unreal Engine with AI-generated media.
Thesis: *"Studios makes things people remember."* From Lima, roots in Glasgow.

- **Sister brand:** `raineylaguna.com` — the web studio (websites, competitive
  intelligence, AI image/video). AI-service or web questions route there.
- **Contact:** `hola@raineylagunastudios.com` · WhatsApp `+51 912 418 482`.

---

## 2. The game — Relic of Ages

A detective out of time, **Arthur Vance**, investigates cities at the moment
history breaks them — **Lisbon 1755, Glasgow, Pompeii**. Each city is
reconstructed as a *before*, lived through a *during*, walked as an *after*.
The `/relic/` page is the landing + wishlist; it carries the AI-generated
media (the Lisbon clip, the Glasgow before/during/after triptych) that doubles
as proof of the studio's AI craft.

---

## 3. Pages

| Route | File | What |
|-------|------|------|
| `/` | `index.html` | Home — 3 chapters: 01 Manifesto · 02 The game · 03 Contact |
| `/about/` | `about/index.html` | Who/what — game studio + the family note |
| `/relic/` | `relic/index.html` | The game landing + wishlist + AI media |
| `/changelog/` | `changelog/index.html` | Changes / manifesto log |
| `/privacy/`, `/terms/` | … | Legal (Ley 29733) |
| `og-image.html` | — | OG image render source |

(Removed in the game-only repositioning: `/work/`, `/journal/`, `/marca/`,
`/servicios/`, `/who-we-serve/`, `/memory/`, `/almanac/`, `/verify.html`, and
the fabrication-era scripts/data.)

---

## 4. Design system

| Token | Value | Role |
|-------|-------|------|
| `--iron` | `#0E0D0B` | Background (graphite ink) |
| `--iron-02/04` | `#15130F` / `#1E1B15` | Panels, hairline rules |
| `--bone` | `#F6F2E8` | Foreground (ivory paper) |
| `--bone-70/45/20` | `rgba(246,242,232,…)` | Muted text (70/45) + decorative (20) |
| `--vermilion` | `#E83C1E` | The single accent (industrial orange) |
| `--copper` | `#8AA9A0` | Secondary accent (technical detail) |

- **Type:** **Fraunces** (variable serif — `wght`/`opsz`/`slnt` axes) for
  display; **JetBrains Mono** for UI / metadata / readouts.
- **Tone:** architectural, cinematic, editorial. Visible grid, ruled lines.
- **Accessibility:** muted text must clear **WCAG AA**. `--bone-45` is `0.58`
  opacity (≈6.2:1 on iron); the wishlist CTA is iron-on-vermilion (≈4.7:1),
  not bone-on-vermilion (which fails). Footer links carry a 24px tap target.
  See `lighthouserc.json`.

### The Living Manifesto

The manifesto block (homepage) is typeset in Fraunces and **modulated live by
Lima's actual weather** (Open-Meteo / SENAMHI) — its `wght`/`opsz`/`slnt` axes
shift through the day. Same words read differently at 6 a.m. and 6 p.m.

---

## 5. Internationalisation

Bilingual **at source** — every visible node carries `data-es` and `data-en`
attributes (plus `data-title-es/en`, `data-desc-es/en` for `<head>`). An inline
script swaps `textContent`/`innerHTML` on language toggle. There is **no build
step and no /en/ route** — one document renders either language client-side.
(Contrast with the sister `raineylaguna-next`, which is route-split + dict-based.)

---

## 6. Structured data & SEO

- JSON-LD `@graph`: `Organization` (#org, `sameAs` raineylaguna.com),
  `ProfessionalService` (#studio), `Person` (#founder), `WebSite`, and a
  **`VideoGame`** node for Relic of Ages (replaced the old AI-service nodes).
- `llms.txt` — AI-assistant brief; describes the game studio and **routes
  AI-service / web / intelligence questions to raineylaguna.com**.
- `sitemap.xml`, `og-image.png`, `_headers` (Netlify).

---

## 7. Build, checks & deploy

- **No framework.** Static files served as-is.
- **`scripts/check-html.mjs`** (`npm run check`) — validates JSON-LD parses +
  inline JS parses across all pages. Run before every commit.
- **Deploy:** **Netlify** (`_headers` for header rules; deploy previews per PR).
- **Lighthouse CI** (`lighthouserc.json`): audits the **built static files**
  (`staticDistDir`) — `/`, `/about/`, `/relic/` — so each PR grades its own
  changes (not production). Asserts performance ≥0.85, accessibility ≥0.95,
  best-practices ≥0.9, SEO ≥0.95, plus `color-contrast`.
  > History: it used to audit live prod URLs incl. deleted `/work` & `/journal`,
  > which 404'd → `ERRORED_DOCUMENT_REQUEST`. Fixed by repointing to surviving
  > pages + `staticDistDir`.

---

## 8. Other docs in this repo

- `README.md` — quick start
- `COLOFON.md` — colophon / production notes
- `COMMONS.md` — shared conventions
- `ROADMAP.md` — planned work
- `CHANGELOG` → `/changelog/`
