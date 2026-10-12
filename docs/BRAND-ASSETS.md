# Brand assets — proposed logo direction

> **This is a proposed brand refresh, not an existing official logo.**
> Nothing here should be presented to the public as TOC's established mark. If the company has
> approved brand assets, replace the components below with them — the site is built so this is a
> contained change.

---

## 1. The idea

TOC as a **geometric monogram inside a hairline frame**: three letterforms built only from
horizontal and vertical strokes, sitting inside a thin bronze rectangle like a drawing on a sheet.

- **T** — a horizontal bar with its stem descending from the centre
- **O** — a squared, gently-radiused counter
- **C** — three strokes: top arm, left stem, bottom arm

Why this works for a construction and architecture practice:

- **Architectural, not decorative.** It reads like a survey mark or a title block on a drawing,
  rather than a house-roof or hard-hat cliché.
- **Legible when tiny.** Because the letters are strokes rather than filled shapes, the mark
  survives at 16 px in a favicon and at 64 px in a footer without redrawing.
- **Typeface-independent.** The mark is drawn as SVG paths, not typeset text. It renders identically
  in every browser, needs no webfont, and can be reproduced in print, signage or embroidery without
  licence questions.
- **One restrained accent.** The bronze hairline frame is the only ornament — consistent with using
  bronze sparingly across the site.

## 2. Wordmark and lockup

The primary lockup is **monogram + "TOC Luxury" in DM Serif Display + "CONSTRUCTIONS LTD" in
Manrope, letterspaced to 0.22em, bronze-to-grey**.

Two treatments are provided and both are used on the site:

| Treatment | Use | File |
| --- | --- | --- |
| Light (charcoal ink on ivory/white) | Header on light backgrounds, stationery, documents | `Monogram` with `tone="default"` |
| Dark (ivory ink on charcoal, bronze frame) | Footer, dark sections, signage on dark grounds | `Monogram` with `tone="white"` |

An inverse variant with the charcoal block built into the artwork is included for contexts where the
mark must carry its own background (social avatar, favicon, app tile).

## 3. Files

| File | Purpose |
| --- | --- |
| `public/favicon.svg` | Browser tab — inverse mark on charcoal |
| `public/logo/toc-monogram.svg` | Monogram, charcoal ink, transparent background |
| `public/logo/toc-monogram-white.svg` | Monogram, ivory ink, transparent background |
| `public/logo/toc-monogram-charcoal.svg` | Monogram, charcoal ink (print/vector source) |
| `public/logo/toc-monogram-inverse.svg` | Monogram on a charcoal tile |
| `public/logo/toc-monogram.png` | 512 px raster for app icons and social avatars |
| `public/site.webmanifest` | References the PNG for installable-app use |
| `src/components/brand/Monogram.tsx` | React component used everywhere in the UI |
| `src/components/brand/Wordmark.tsx` | Lockup: monogram + wordmark, light/dark, full/compact |

## 4. Colour specification

| Token | Hex | Role |
| --- | --- | --- |
| Warm ivory | `#F5F2EC` | Page background, dark-section type |
| Deep charcoal | `#242724` | Type, dark sections, primary buttons |
| Muted bronze | `#A78B64` | Eyebrows, rules, frames, focus rings, hover states |
| Pure white | `#FFFFFF` | Cards, form fields, alternating sections |
| Soft grey | `#8A857C` / `#6E6A62` | Secondary text |
| Rule grey | `#242724` at 10 % | Dividers and borders |

Bronze is used only for small accents — never as a fill for large areas. All text/background pairs in
use meet WCAG AA; the primary risk area (ivory type over photography) is handled with a two-layer
charcoal scrim and was measured at ≈9:1 in testing.

## 5. Typography

| Role | Family | Notes |
| --- | --- | --- |
| Display | **DM Serif Display** (400, roman + italic) | Headings only. Italic is used for the second clause of a headline to add editorial rhythm |
| Body / UI | **Manrope** (variable 200–800) | Body copy, navigation, forms, buttons, eyebrows |

Both are self-hosted in `public/fonts/` (Latin, Latin-Extended, Vietnamese subsets; ~125 KB total).
The site makes no request to Google Fonts or any other font CDN. If a different approved pairing is
used, update the `@font-face` block in `src/index.css` and `fontFamily` in `tailwind.config.js`.

## 6. How to swap in approved brand artwork

1. **Monogram** — replace the `<g>` paths inside `src/components/brand/Monogram.tsx` and update the
   matching files in `public/logo/`. The component accepts `tone`, so keep the two ink colours
   parameterised rather than baked in.
2. **Wordmark** — edit `src/components/brand/Wordmark.tsx`. It expects a monogram element plus two
   text lines ("TOC Luxury" / "Constructions Ltd"). Change the text, size or letter-spacing there.
3. **Social/OG card** — regenerate `public/images/og-toc.jpg` (1200×630); it currently shows
   reference architecture imagery with no logo baked in.
4. **Wordmark text** — the strings come from Company details in the admin (`legalName`, `monogram`,
   `strapline`), stored in `content/site.json`. The name shown next to the mark changes with no code
   edit; the drawn monogram letters themselves are artwork in `src/components/brand/`.

## 7. Usage notes for whoever applies the identity

- Minimum clear space around the monogram: **one quarter of its width** on all sides.
- Minimum size: **16 px** for the monogram, **24 px** for the full lockup.
- Do not stretch, rotate, add drop shadows, outline it, or place it on busy photography without a
  solid or scrimmed ground.
- The bronze frame may be dropped in single-colour reproduction (one-colour print, engraving).
- Where the mark appears over photography, use the white-ink treatment over a darkened area.
