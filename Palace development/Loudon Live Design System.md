---
title: Loudon Live Design System
type: source
pillars:
  - creation
  - tools
  - philosophy
  - practice
born: 2026-05-28
stage: sprout
energy: high
forward_vector: >
  I am the palace's default artifact aesthetic — locked grammar (Anton display,
  Cormorant body, Manrope UI, JetBrains Mono metadata, Silkscreen as register)
  over six per-stream skins. Born from Loudon Live, I now govern every artifact
  the palace makes — session pages, learning materials, slides, posters, web
  prototypes — unless context demands a different system (Stigmergy keeps its
  terminal aesthetic for swarm coordination). I am cemented through review and
  ready to use; I will fruit when used.
links:
  - target: "[[Loudon Live]]"
    type: enables
    label: visual-system
  - target: "[[Hyperdimensional Prism]]"
    type: emerged-from
    label: lissajous-in-sphere
  - target: "[[FOUR PILLARS]]"
    type: connects-to
    label: pedagogical-spine
  - target: "[[Autodidact Polymaths]]"
    type: connects-to
    label: addressee
  - target: "[[Progressive Staging]]"
    type: mirrors
    label: locked-grammar-fresh-skin
  - target: "[[Loudon Live — asset plan]]"
    type: spawned
    label: cemented-from
  - target: "[[BBS Design System]]"
    type: mirrors
    label: sibling-system-different-register
  - target: "[[Palace Philosophies]]"
    type: deepens
    label: studio-register
  - target: "[[Quality Manifesto]]"
    type: connects-to
    label: taste
  - target: "[[Playful Interface Design]]"
    type: connects-to
    label: voice-and-touch
  - target: "[[SUBSTRATE]]"
    type: deepens
    label: visual-substrate
  - target: "[[Maker]]"
    type: couples-with
    label: palace-base-of-cascade
  - target: "[[The Shop]]"
    type: connects-to
    label: shared-studio-register
---

# Loudon Live Design System

The palace's **default artifact aesthetic** — born from Loudon Live, cemented through review, now governing every artifact the palace makes unless context explicitly demands a different system.

## The Status Rule

The system is named **Loudon Live** because it was built to express the channel's brand. It serves as the **palace default** because that brand — Lissajous-in-sphere, Anton-on-Cormorant, six skins, studio register, autodidact polymath addressee — is the same brand the palace itself speaks in. Every new HTML artifact, slide deck, session page, learning poster, and web prototype defaults to this system. The override carve-out is narrow: a context with its own established visual language (currently only [[BBS Design System]] for STIGMERGY) keeps its own grammar because the context demands it.

When in doubt: use this system.

## What's Cemented

The system locks **grammar** and rotates **skin**.

**Locked grammar** (never varies, ever):

- **Type stack** — Anton (display/wordmark), Cormorant Garamond (body serif), Manrope (UI sans), JetBrains Mono (metadata), Silkscreen (technical garnish only — pixelation is a register, not a default).
- **Wordmark** — `LOUDON` slash `LIVE`, the italic-light "Live" in accent colour at weight 300. The slash is `--fg-3`, never accent.
- **Layout** — left-aligned editorial spread is the default; no centred-book-cover compositions.
- **Radii** — ceiling of 4 px. 0 / 1 / 2 / 4 only. Pill (999) only when shape carries meaning.
- **Borders** — 1 – 1.5 px. Never thicker.
- **Spacing scale** — 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 120.
- **Motion** — `cubic-bezier(.4, 0, .2, 1)` at 220 ms ordinary, `.2 .9 .2 1` at 550 ms emphasised. Two ambient motions allowed: the Lissajous rotation, the on-air red-dot pulse. No bounces, no springs.
- **Iconography** — typographic glyphs (`● ▸ · ◐ ◇`) + the Lissajous trace + the LL monogram. **No emoji, no CDN icon library.**
- **Footer** — `Loudon Live · Autodidact Polymaths` on every shipped artifact.

**Per-stream skin** (rotates by setting one class on `<html>`):

| Skin | Bg | Accent | Register |
|---|---|---|---|
| **Graphite** (default) | `#0a0a0f` | signal-amber `#e8b84a` | workshop in dim light |
| **Amber Lab** | `#f4ecdc` | signal-orange `#e8651b` | parchment / philosophical / long-form |
| **CRT** | `#000000` | phosphor green `#00ff66` | scope / DSP / signal-watching |
| **Strobe** | `#000000` | phosphor red `#ff2a2a` | dance / performance / live |
| **Cobalt Grid** | `#0e1f4d` | lime `#a8e040` | mathematics / blueprint |
| **Drafting** | `#f0eee5` | engineering red `#c8261a` | schematic / build instructions |

**Per-stream generative element** rotates from the six in `assets/generators/`: lissajous-bundle, modular-grid, particle-field, spectral-bands, waveform-stack, plus the canonical [[Hyperdimensional Prism|Lissajous trace]]. Each carries a conceptual handle — use them when relevant, not as decoration.

## Voice (also locked)

- **Studio register, never commercial-production register.** Sketch / Study / Piece — never MVP / v1 / final.
- **First-person and collaborative pronouns.** "Let's explore" — not "students," not "subscribers."
- **Sentence case in display and body.** UPPERCASE only for mono eyebrows and footers.
- **No outcome promises in titles.** "Live build · synth lab, session 1" — not "Finishing the synth in one hour."
- **Honesty as a light touch, not a confession.** Once in the trailer; the work speaks elsewhere.
- **No emoji. No abbreviations when a full word fits.** *Snare*, not "SNR".

## Where The System Lives

```
_ops/loudon-live/design-system/
├── SKILL.md              ← agent skill manifest (invoke for brand guidance)
├── README.md             ← full design rationale (read this first)
├── colors_and_type.css   ← canonical source of every token
├── index.html            ← system overview / cover page
├── assets/               ← Lissajous logos, wordmark, monogram, watermark, avatar
│   └── generators/       ← six per-stream generative SVGs
├── preview/              ← specimen cards (type / colors / spacing / components)
├── slides/               ← OBS scene templates (1920×1080)
└── ui_kits/
    ├── session-artifact/ ← long-form session HTML + JSX components
    └── stream-overlay/   ← OBS live composite (cam, lower-third, watermark)
```

The skill at `_ops/loudon-live/design-system/SKILL.md` is the agent-invocable entry point. Future palace artifacts read it first.

## The Default-Aesthetic Rule

Encoded in three places so it cannot be missed:

1. **[[CLAUDE]]** — the always-loaded entry-point file. New artifacts default to this system.
2. **[[Substrate Skill]]** — operational instructions for AI agents. Includes the SKILL.md invocation path.
3. **This entry** — the canonical source-of-truth for *what* the system is and *when not* to use it.

The override carve-out: when an artifact has its own established visual context (currently only [[BBS Design System]] for STIGMERGY — the swarm coordination terminal aesthetic with VT323/IBM Plex Mono, CP437 borders, phosphor green on terminal black), that context's design system applies instead. New override contexts require a deliberate decision documented in the artifact's parent entry.

## Collaboration with The Shop

[[The Shop]] anticipated this entry before it existed. The Shop's foreman, [[Maker]], specifies a three-layer cascade — mechanical floor (Maker) → palace-base spec (was a TODO; now this entry) → project override. I fill the long-vacant middle layer.

**The two systems are non-overlapping by layer.** The Maker owns the mechanical floor (aspect ratio, frame rate, sample rate, loudness target — the medium-mechanical defaults). This entry owns palette, type, voice, iconography, motion easing, hard rules. Projects override per-project. The cascade is articulated in the Maker's *Articulated Cascade* section; this entry is its second tier.

**Shared studio register.** The Shop's "Studio Register, Not Commercial Production" — Sketch / Study / Piece, foreman not project manager, depth-over-coverage — and this system's voice rules are the same idea in two vocabularies. Neither owns it; both reinforce it. The shared register is itself a palace-level decision, surfaced wherever it's load-bearing.

**Per-Specialist wiring** (held until first invocation, by intent). Several specialists in the Shop's roster need small additions to honor this system — config recipes, gotcha entries, prompt suffixes. These are written *when the specialist is next invoked*, with real evidence from the invocation, not speculative spec ahead of time. The known wiring surfaces:

| Specialist | What it needs |
|---|---|
| **Matplotlib** | rcParams recipe pulling active-skin foreground/accent; font switch to Cormorant or Manrope |
| **Manim CE** | LaTeX / Pango font configuration for Anton + Cormorant; the font-loading gotchas it produces are the entry's first real specialist test |
| **Mermaid** | Theme override mapping the six skins to Mermaid's themeVariables |
| **ComfyUI** | Palette-discipline LoRAs or prompt-suffix recipes per skin; ComfyUI's reason-for-being over Midjourney is exactly this |
| **Midjourney** | Style-reference URLs (`--sref`) anchored to specimen cards from `_ops/loudon-live/design-system/preview/` |
| **Remotion** | `import` of `colors_and_type.css` tokens; reusable React components for the wordmark and skin switcher |
| **p5.js** | Tokens consumed from CSS custom properties; the canonical Lissajous sketch at `_ops/loudon-live/design-system/assets/logo-lissajous.live.html` is already a p5.js artifact |
| **Tone.js** | Visual UI components reading the same tokens Remotion uses |

The wiring is gotcha-shaped, not architecture-shaped. Each addition gets a date and a real failure or success it learned from.

**Adoption surfaces.** When a Specialist completes a job that adopts this system, the resulting artifact's parent entry links back here with `connects-to` and a label naming the surface (`session-artifact`, `learning-poster`, `slide-deck`, `web-prototype`). Adoption is a typed-link event so the system's spread through the palace is legible from any entry.

## The Stigmergy Comparison

The two design systems sit in productive contrast.

| | Loudon Live Design System | [[BBS Design System]] |
|---|---|---|
| **Scope** | Palace default | STIGMERGY only |
| **Register** | Studio / editorial / teaching | Terminal / coordination / swarm |
| **Type** | Anton + Cormorant + Manrope + JetBrains | VT323 + IBM Plex Mono |
| **Layout** | Editorial spread, left-aligned | 80ch character-cell grid |
| **Color** | Six skins, accent reserved | Phosphor green, amber for flags |
| **Motion** | Cubic-bezier, restrained | `steps()` only, discrete |
| **Borders** | 1 – 1.5 px CSS | CP437 box-drawing characters |

They are **sibling systems**, both born from palace work, addressing different surfaces. Loudon Live is what the palace shows the world. STIGMERGY is what the palace looks like when it's working on itself.

## How To Use It

For a new palace artifact:

1. **Invoke the SKILL.md** at `_ops/loudon-live/design-system/SKILL.md` — it carries the rules in agent-readable form.
2. **Include `colors_and_type.css`** as the token source. Set one of `skin-graphite | skin-amber-lab | skin-crt | skin-strobe | skin-cobalt-grid | skin-drafting` on `<html>`. Graphite is the default.
3. **For session pages / long-form artifacts:** copy `ui_kits/session-artifact/` and rewrite `App.jsx`. The reference layout is header → escher-split (theory opener) → mechanism (h2 + diagram) → build steps → tuning grid → footer signature.
4. **For OBS scene cards:** copy from `slides/`. Swap palette by changing the skin class; swap generator by changing `src` on `.gen img`.
5. **For throwaway sketches / proofs:** Graphite skin, Cormorant body at 17/1.75, *Sketch / Study / Piece* tier vocabulary.

The previews in `preview/` are working specimen cards — open them in a browser to see the system before writing anything.

## Hard Rules (Non-Negotiable)

These survive every artifact, every palette, every skin:

- **No emoji. No CDN icon library.** Typographic glyphs and the Lissajous trace are the only iconography.
- **No outcome promises in titles or session names.**
- **First-person and collaborative pronouns.** Never "subscribe and hit the bell," never "students," never "audience."
- **Italic-light *Live*** is the brand signature. Italic in body reserved for emphasis and the *one* keyword in a two-word title.
- **One accent glow per view.** Reserved for the primary call to action.
- **No cyan.** Anywhere. Ever. The earlier teal callout is dead; change-notes use info-blue.
- **No decorative gradients in chrome.** The only allowed gradient is the radial protection-gradient under cards on busy backgrounds.
- **Restrained motion.** The Lissajous trace's slow rotation and the on-air red-dot pulse are the only ambient motions.

## Origin

Arrived May 2026 as a Claude Design handoff bundle — Loudon's second design-system deposit after [[BBS Design System]] (April 2026). Born from extended review across:

- [[Loudon Live]] (channel charter, editorial posture, audience)
- [[Loudon Live — asset plan]] (the variant system that this entry cements)
- [[Loudon Live — launch kit]] (channel copy, OBS scene specs, asset list)
- [[Hyperdimensional Prism]] (Lissajous-in-sphere visual-identity essay)
- [[FOUR PILLARS]] · [[Autodidact Polymaths]] · [[Progressive Staging]] (pedagogical spine)
- [[Hilaritas Generator]] · [[Quality Manifesto]] · [[Trickster]] · [[Palace Philosophies]] · [[Playful Interface Design]] · [[The Shop]] · [[Oblique Enrichment]] (voice, tone, taste)

The system is **cemented** — type stack locked, six skins specified, six generators built, slides and ui_kits drafted, voice rules itemised. Stage: `sprout`. It fruits when used. Track each artifact that adopts it via typed links back to this entry.

## What Comes Next

- **First palace artifact adopting the system that isn't a Loudon Live asset** — the test case for "default aesthetic for everything." Candidates: a new session artifact for [[Shepard Tone Synthesizer]], a learning poster for [[FOUR PILLARS]], a deck for [[2D Torus Wavetable Synthesizer]].
- **Migration of older palace artifacts** — only as natural touch-points arise. No campaign to retrofit.
- **Possible cleavage point** — if a palace artifact category emerges that the six skins don't serve (very long-form essays? printed handouts?), that's a signal to grow a new skin, not to fork the system.

## Cross-Domain Resonances

- **[[Hyperdimensional Prism]]** — the Lissajous-in-sphere essay is the visual identity's philosophical core. The patch that generates the logo is itself a pedagogical artifact.
- **[[Progressive Staging]]** — locked grammar / fresh skin mirrors stage-by-stage release: the constant teaches recognition, the variant teaches recombination.
- **[[Quality Manifesto]]** — the system's restraint (no cyan, no emoji, radii ≤ 4 px, one accent glow per view) is what taste-as-policy looks like in CSS.
- **[[Playful Interface Design]]** — the italic-light *Live* trick, the typographic glyphs, the studio register: play through restraint, not through flourish.
- **[[BBS Design System]]** — sibling system. Reading them side-by-side teaches the difference between editorial register and terminal register.
- **[[The Shop]]** — the maker register (Sketch / Study / Piece, never MVP / v1 / final) is shop vocabulary.

## Open Questions

- **Skin-selection rubric.** When a new palace artifact is being made, which skin should it default to? Graphite is the channel default, but a math poster wants Cobalt Grid, a Confucian philosophy entry wants Amber Lab, a DSP first-principles piece wants CRT. A small decision card per artifact type would help future Claude pick correctly without bikeshedding.
- **Token-level inheritance.** Should palace artifacts pull `colors_and_type.css` from a single canonical URL, or copy it per artifact? Copying is honest (artifact stays self-contained); pulling is DRY (one update cascades). Currently: copy per artifact.
- **Stigmergy contact surface.** When a palace artifact wants to *show* swarm coordination output (a session page summarising a Weave run), which system applies? Probably this one, with STIGMERGY excerpts treated as embedded code-block content. Test case will decide.
