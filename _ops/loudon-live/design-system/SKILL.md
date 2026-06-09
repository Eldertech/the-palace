---
name: loudon-live-design
description: Use this skill to generate well-branded interfaces and assets for Loudon Live, either for production or throwaway prototypes/mocks/sketches/session artifacts. Contains essential design guidelines, colors, type, fonts, the Lissajous-in-sphere visual identity, six per-stream skins, six generative elements, slide templates, and UI kit components for prototyping. The audience is autodidact polymaths and the editorial register is studio (not commercial production).
user-invocable: true
---

# Loudon Live · design skill

Loudon Live is Loudon's primary public teaching space — a YouTube channel where instruments get built, sound gets studied, and music gets played. The visual system is **locked grammar · fresh skin**: typography, layout, the wordmark and safe zones never change; per stream the palette and one generative element rotate.

## How to use this skill

1. Read `README.md` in full. It carries the **content fundamentals** (voice, casing, person, no-emoji rule, do/don't copy), the **visual foundations** (type, the six palettes, the six generative elements, spacing, radii, motion, hover/press/focus, transparency rules), and the **iconography** position (typographic glyphs + the Lissajous trace + the LL monogram — and explicitly no emoji and no CDN icon set).
2. Read `colors_and_type.css`. It is the canonical source of every token used by every artifact. Switch palette by setting one of `skin-graphite | skin-amber-lab | skin-teal-patch | skin-dusk-tape | skin-cobalt-grid | skin-bone-synth` on the document root. Graphite is the default.
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
- **Italic-light *Live*** is the brand signature. The wordmark is always *Loudon **Live*** with the second word in italic at weight 300 in the accent colour.
- **One accent glow per view.** Reserved for the primary call to action.
- **No decorative gradients in chrome.** The only allowed gradient is the radial protection-gradient under cards on busy backgrounds.
- **Restrained motion.** Cubic-bezier(.4, 0, .2, 1) for ordinary; .2, .9, .2, 1 for emphasized. No bounces, no springs. The Lissajous trace's slow rotation is the only ambient motion.
- **Studio register, not commercial-production register.** Sketch / Study / Piece — never MVP / v1 / final.
- **Interactive/stateful first versions ship reviewable.** Any interactive build (instrument, explorer, prototype, card series, deck) ships its *first* version with a built-in review surface so Loudon can leave section-level feedback in context, then flip it off to ship clean. Reach for `ui_kits/review-layer/` (the DOM-anchored method) — but new review methods are wanted, not that one reused. Granularity rule: one moment per natural unit (a card, a section), never one per control. Static one-shot artifacts (a single banner, an OBS card) are exempt. Principle: [[Review Layer]].

## If invoked without other guidance

Ask the user: *what stream is this for, what palette and generator do you want, and is this a session artifact, an OBS scene card, a banner, or something else?* Then act as an expert designer for Loudon Live — outputting HTML artifacts that drop straight into OBS or YouTube. Stay in the studio register. The footer of any artifact you ship should read **Loudon Live · Autodidact Polymaths**.
