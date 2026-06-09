# Site Audit — Rainey Laguna Studios

_Prepared while evaluating a new AI photo-animation / memory-book service. Scope: full-site review plus a brand-fit assessment of the proposed offering._

---

## 1. What the site is

A no-build, dependency-free static HTML site for a Lima creative studio. Every
page hand-codes the same design system inline. The entire brand rests on one
thesis, repeated across every page:

> **Every interaction leaves a physical trace in the real world.**

This is enforced by three signature mechanics — signed objects (Ed25519
provenance), NFC "memory" pages, and weather-driven typography — and a strict
visual language.

---

## 2. Design system (strong, keep as-is)

| Token | Value | Role |
| --- | --- | --- |
| `--iron` | `#0E0D0B` | ground |
| `--bone` | `#F6F2E8` | ink |
| `--vermilion` | `#E83C1E` | single accent |
| `--copper` | `#8AA9A0` | secondary accent |

- **Type:** Fraunces (display/serif) + JetBrains Mono (labels/eyebrows). Two
  families, used consistently. Correct discipline.
- **Color:** 4 tokens + opacity steps. Within the 3–5 color rule. No gradients,
  no purple. Good.
- **Layout:** flexbox + CSS grid, responsive `clamp()` type, mobile breakpoints
  at 720px. Sound.

**Verdict:** the design system is a genuine asset. Any new work must inherit it
verbatim — same tokens, same Fraunces/Mono pairing, same eyebrow→h2→sub→grid
section rhythm. Do not introduce new colors or fonts.

---

## 3. Strengths

1. **A real, defensible thesis.** Physical + digital fusion is not generic
   agency filler. It is specific and ownable.
2. **Provenance as product.** Ed25519 signatures, `/verify.html`, public
   "twins," and `/memory/` NFC pages form a coherent trust system. Memory is
   already a core brand concept.
3. **Bilingual + accessible.** `data-es` / `data-en` everywhere, a clean
   client-side language toggle with `localStorage` persistence, skip links,
   `prefers-reduced-motion` handling.
4. **Performance.** Zero runtime dependencies, system-fast static pages,
   Lighthouse CI in the pipeline.
5. **Honest voice.** Spanish-first, atmospheric, real pricing in Soles, "no
   middlemen." Reads like a workshop, not a pitch deck.

---

## 4. Weaknesses / risks

| # | Issue | Severity | Note |
| --- | --- | --- | --- |
| 1 | `noindex,nofollow` on most sub-pages (servicios, marca, memory, who-we-serve) | High (if launching) | Only the homepage is indexable. Deliberate pre-launch state — flip when ready. |
| 2 | Several mechanics are demos, not live (Kiln feed, postcard PDF, twin-wall counter) | Medium | README/ROADMAP are honest about this; don't sell them as live. |
| 3 | No real photography yet | Medium | ROADMAP calls this the unlock for everything. |
| 4 | No `/en/` mirror despite bilingual infra | Low | Toggle works, but there's no English-indexable URL surface. |
| 5 | Each page re-declares the full CSS inline | Low (by design) | Intentional no-build choice; just remember edits don't propagate automatically. |

---

## 5. The AI photo-animation + memory-book idea

### Where it fits beautifully
"Memoria física" (service 07) and the `/memory/` NFC system are **already about
turning moments into lasting, signed artifacts**. A printed, hand-bound memory
book with NFC chips, a serial, weather-of-the-day, and an Ed25519 signature is a
near-perfect 8th service. The book *is* the physical trace.

### Where it fights the brand (address head-on)
1. **Screen vs. object.** The thesis pulls toward things you hold; an animated
   clip lives on a phone — the opposite pole. **Resolution:** lead with the
   *book*; treat the animation as a quiet NFC-triggered layer, never the
   headline.
2. **Voice register.** "AI-powered photo animation" is the loudest, most
   generic-tech phrase imaginable and clashes with the slow, poetic, Spanish-
   first voice (COLOFON §15). **Resolution:** reframe entirely — _"the portrait
   breathes for a moment when you tap it"_ — never sold as an AI feature.
3. **Provenance tension.** This studio certifies authenticity; generative AI
   invents motion that never happened. **Resolution:** declare every animation
   as an *interpretation, not a record*, on its provenance page, and always
   preserve the untouched original.

### Recommended positioning
Ship it as **"Libro de Memoria" / "Memory Book"** — a hand-bound, signed,
NFC-tagged physical book where AI animation is a subtle optional layer that
wakes on tap. This keeps the offering inside the physical-trace thesis instead
of breaking it.

---

## 6. Implementation status (this pass)

- [x] Added **Service 08 · Libro de memoria** to `/servicios/` — on-brand,
      bilingual (ES/EN), with the existing section rhythm and pricing block.
- [x] Updated the service index grid, eyebrow ("8 campos"), headline ("Ocho
      campos"), lede, and meta description from seven → eight fields.
- [ ] Optional next: a dedicated `/libro-de-memoria/` page mirroring `/memory/`.
- [ ] Optional next: a `/memory/`-style demo where a portrait "breathes" on tap.
- [ ] Before launch: revisit `noindex` flags and consider an `/en/` surface.

---

## 7. Recommendation

**Proceed — but as the book, not the animation.** The memory book is one of the
most on-thesis services this studio could add. The AI motion is a charming
detail that must stay subordinate to the physical object and be framed honestly
as interpretation. Marketed that way, it strengthens the brand instead of
diluting it.
