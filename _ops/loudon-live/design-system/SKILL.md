---
name: loudon-live-design
description: Use this skill to generate well-branded interfaces and assets for Loudon Live, either for production or throwaway prototypes/mocks/sketches/session artifacts. Contains essential design guidelines, colors, type, fonts, the Lissajous-in-sphere visual identity, six per-stream skins, six generative elements, slide templates, and UI kit components for prototyping. The audience is autodidact polymaths and the editorial register is studio (not commercial production).
user-invocable: true
---

# Loudon Live · design skill

Loudon Live is Loudon's primary public teaching space — a YouTube channel where instruments get built, sound gets studied, and music gets played. The visual system is a **floor, not a cage**: a tiny non-negotiable floor (the studio voice, the Lissajous sigil, the nevers — no cyan / no emoji / no hype) keeps everything recognizably Loudon, and a wide field above it is meant to vary. The **house style** below (Anton / Cormorant / Manrope / JetBrains type, six skins, the wordmark) is the reliable default to reach for — steady grammar, fresh skin per stream — but a projection may depart from it. Loudon presents as many projections (loudon, LDN, Loud'n Live, Professor Compressor, Sonic Sensei, TRICKSTER); the house style is the home of the **Loud'n Live** projection specifically. Hold the floor always; treat the house style as default, not law.

## How to use this skill

1. Read `README.md` in full. It carries the **content fundamentals** (voice, casing, person, no-emoji rule, do/don't copy), the **visual foundations** (type, the six palettes, the six generative elements, spacing, radii, motion, hover/press/focus, transparency rules), and the **iconography** position (typographic glyphs + the Lissajous trace + the LL monogram — and explicitly no emoji and no CDN icon set).
2. Read `colors_and_type.css`. It is the canonical source of every token used by every artifact. Switch palette by setting one of `skin-graphite | skin-amber-lab | skin-crt | skin-strobe | skin-cobalt-grid | skin-drafting` on the document root. Graphite is the default. (The CSS still honours the deprecated aliases `skin-teal-patch | skin-dusk-tape | skin-bone-synth`, but new artifacts use the canonical names.)
3. Browse `assets/` (brand marks + per-stream generators), `slides/` (OBS card templates), `ui_kits/session-artifact/` (long-form session page) and `ui_kits/stream-overlay/` (live composite).

## What to make

The most common briefs:

- **A new session artifact** (long-form HTML page for one stream). Copy `ui_kits/session-artifact/` and rewrite `App.jsx`. Header → escher split (theory opener) → mechanism (h2 + diagram) → build steps (progressive staging) → tuning grid → footer signature.
- **A new OBS scene card** (Starting Soon / BRB / Stream Ended / Topic Title). Copy from `slides/`. Swap the palette by changing the `skin-*` class on `<html>`; swap the generative element by changing the `src` of the `.gen img`. Keep the wordmark fixed.
- **A throwaway prototype / sketch / proof artifact.** Use the Graphite skin, the serif at 17/1.75 for body, and the *Sketch / Study / Piece* tier vocabulary in any internal labelling.

## Hard rules

- **No emoji. No CDN icon library.** Typographic glyphs (`● ▸ · ◐ ◇`) and the Lissajous trace are the channel's iconography.
- **No outcome promises in titles.** "Live build · synth lab, session 1" — not "Finishing the synth in one hour."
- **First-person and collaborative pronouns.** "Let's explore" and "hang out" — not "students" or "subscribe and hit the bell."
- **The wordmark is `LOUD’N LIVE`** *(renamed from `LOUDON / LIVE` 2026-07)*. The `’n` connector **case-matches its run**: all-caps settings (the Anton lockup, mono all-caps eyebrows) get a full-size cap `’N` → `LOUD’N LIVE`; title/sentence case (prose, body, signatures) gets lowercase → `Loud’n Live`. **Never strand a shrunken lowercase `’n` between all-caps words.** Said aloud: "Loudon"; read on the page: "loud *and* live." One apostrophe, always. "Live" is the accent word (weight 300, italic in title-case). Plain-text fallback (handles/URLs): `loudonlive`, never `loudnlive`.
- **One accent glow per view.** Reserved for the primary call to action.
- **No decorative gradients in chrome.** The only allowed gradient is the radial protection-gradient under cards on busy backgrounds.
- **Restrained motion.** Cubic-bezier(.4, 0, .2, 1) for ordinary; .2, .9, .2, 1 for emphasized. No bounces, no springs. The Lissajous trace's slow rotation is the only ambient motion.
- **Studio register, not commercial-production register.** Sketch / Study / Piece — never MVP / v1 / final.
- **Interactive/stateful first versions ship reviewable.** Any interactive build (instrument, explorer, prototype, card series, deck) ships its *first* version with a built-in review surface so Loudon can leave section-level feedback in context, then flip it off to ship clean. Reach for `ui_kits/review-layer/` (the DOM-anchored method) — but new review methods are wanted, not that one reused. Granularity rule: one moment per natural unit (a card, a section), never one per control. Static one-shot artifacts (a single banner, an OBS card) are exempt. Principle: [[Review Layer]].

## If invoked without other guidance

Ask the user: *what stream is this for, what palette and generator do you want, and is this a session artifact, an OBS scene card, a banner, or something else?* Then act as an expert designer for Loud'n Live — outputting HTML artifacts that drop straight into OBS or YouTube. Stay in the studio register. The footer of any artifact you ship should read **Loud'n Live** — the wordmark alone (the `· Autodidact Polymaths` tagline was retired from the universal footer 2026-07). Name the audience situationally in prose instead: describe the way of learning ("teaches yourself, across fields"), never label the person ("you are a polymath"); reserve the term "autodidact polymaths" for the long-form / Amber Lab register, said once. See the phrasing bank in `README.md` § *Naming the audience*.
