# Rainey Laguna Studios

A working creative studio in Lima. Physical + digital. Graphic design, brand management, 3D printing, hydroprinting, and more.

`raineylagunastudios.com` is the **parent / main brand**. `raineylaguna.com` is the **web-development vertical** underneath it.

> **Read first, every session:**
> [`rainey-stack/CONVENTIONS.md`](https://github.com/datacendia/rainey-stack/blob/main/CONVENTIONS.md)
> is the canonical conventions document for the whole stack. This repo is
> intentionally **static HTML** — no build step — so most of the code-level
> rules in that file apply elsewhere, but the §15 voice register
> (*atmospheric, slow, poetic, Spanish-first*) is canon for every word
> shipped here. Run `npm run wrap` before commit and verify SRI hashes on
> any new CDN imports.

---

## The three signature mechanics

Every interaction on this site leaves a physical trace in the real world. That is the thesis. Three mechanics, none of which exist on any other design studio website:

### 01 · The Living Manifesto
The studio's manifesto is typeset in Fraunces, a variable font with `wght`, `opsz`, and slant axes. The values are driven live by Lima's current weather (Open-Meteo API):

- **Humidity → weight.** Dry Lima (rare) = 240. Heavy garúa = 520.
- **Cloud cover → optical size.** Clear sky = 24 (airy). Overcast = 10 (dense).
- **Wind → letter-spacing.** Windier = tighter.

The same paragraph reads differently at different times of day. A live readout panel shows the current `wght` and `opsz` being applied.

**Status:** live and working. Weather fetch hits Open-Meteo every 10 minutes.

### 02 · The Kiln
A 3D printer in the Lima studio, wired to this homepage. Every visit adds a small token to the print queue. A live webcam feed shows the printer working. Objects accumulate into a physical mosaic wall, photographed monthly. 1-in-100 visitors gets theirs mailed home.

**Status:** demo skeleton in place (animated job counter + sweep effect). Real implementation requires wiring a Prusa printer to OctoPrint or Moonraker and exposing a JSON endpoint via Vigía.

### 03 · The Postcard
Every visit generates a one-of-one postcard with: today's date, Lima sky, your arrival time, a unique serial number, a deterministically-generated barcode from your visit signature. Download as PDF. 1-in-100 is physically printed, hand-signed by Stuart, and mailed.

**Status:** postcard renders live per visit with real weather + serial. PDF download and mailing lottery pending.

---

## Visual system — the iron mirror of `.com`

| Token | Value | Role |
|-------|-------|------|
| `--iron` | `#0E0D0B` | Background · graphite ink |
| `--iron-02` | `#15130F` | Panel one step up |
| `--bone` | `#F6F2E8` | "Paper" · ivory foreground |
| `--vermilion` | `#E83C1E` | Accent · industrial machine orange |
| `--oxide` | `#8AA9A0` | Secondary accent · oxidised copper |

Same Fraunces + JetBrains Mono pairing as `.com` for family resemblance. Chromatically inverted: `.com` is paper-on-warm daylight; `.studio` is ivory-on-iron night. Parent and child read as night-and-day siblings.

---

## Files

```
index.html          Single-file site, ~1400 lines, all bilingual via data-es/data-en
README.md           This file
progress.txt        Build log and next steps
```

No build step yet — open `index.html` directly in a browser.

---

## Next steps (priority order)

1. **Sketch the workshop.** Wire a real Prusa to an always-on Pi running OctoPrint; expose a minimal JSON endpoint (`state`, `progress`, `job_name`) that the homepage can poll.
2. **Live webcam feed.** Low-framerate (0.25 fps) still-image feed from the printer, embedded in `.kiln-frame`.
3. **Postcard PDF export.** Generate a real A6 PDF on download using `pdf-lib` or similar, embedding the visit's weather snapshot as cover art.
4. **Object #01.** Design and fabricate one self-initiated piece — hydroprinted ceramic mug + 3D-printed stand set — to seed Work slot #02 and serve as the studio's first calling card.
5. **Photography.** Half-day shoot of the object + the workshop + the printer. Real imagery unlocks everything else.
6. **Deploy.** Netlify or Cloudflare Pages. DNS for `raineylagunastudios.com` (not yet owned at time of writing).
7. **English mirror at `/en/`.** Port the `build-en.mjs` pattern from `.com`.
