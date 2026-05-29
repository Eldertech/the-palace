# Loudon Live Design System

The brand and visual system for **Loudon Live** — Loudon's primary public teaching space. A YouTube channel where instruments get built, sound gets studied, and music gets played; where DSP fundamentals are taught next to real music technique, and where the work-in-progress nature of the channel is the teaching.

> Building synths, effects, and tools — out loud.

**Audience:** Autodidact Polymaths — self-taught generalists who learn across many fields at once.

**Footer signature:** `Loudon Live · Autodidact Polymaths`

**Editorial posture:** Subject is sound and music; tools are the medium. Honesty is a light touch, not a confession. The channel is itself a teaching artifact.

**Curriculum spine:** The Four Pillars — *Creation · Tools · Philosophy · Practice* — four projections of a single higher-dimensional reality cast by the light of curiosity.

**Format:** Progressive Staging — each session is one stage of one project; each stage is a complete pedagogical moment.

## Sources

Synthesised from Loudon's personal knowledge base **"The Palace"** (mounted via local FS Access at `The Palace/`). Key entries:

| Entry | What it provided |
|---|---|
| `Loudon Live.md` | Channel charter, editorial posture, audience |
| `Loudon Live/Loudon Live — launch kit.md` | Channel copy, OBS scene specs, asset list |
| `Loudon Live/Loudon Live — asset plan.md` | The variant system — 6 palettes × 6 generators × seed |
| `Artifacts/Loudon Live/toolchain/render_starting_soon.py` | Reference palette + generator code |
| `Projects/Shepard Tone Synthesizer/session-1-interactive.html` | Canonical session-artifact reference |
| `Hyperdimensional Prism.md` | The Lissajous-in-sphere visual-identity essay |
| `FOUR PILLARS.md` · `Autodidact Polymaths.md` · `Progressive Staging.md` | Pedagogical spine |
| `Hilaritas Generator.md` · `Quality Manifesto.md` · `Trickster.md` · `Palace Philosophies.md` · `Playful Interface Design.md` · `The Shop.md` · `Shop/Maker.md` · `Oblique Enrichment.md` | Voice, tone, taste |

Snapshots of the most useful sources live under `_reference/` for offline use.

## Index

| Path | Contents |
|---|---|
| `colors_and_type.css` | Locked tokens — type, palettes (Graphite default + 5 skin classes), spacing, radii, motion |
| `palace-tokens.js` | Runtime token reader — `palaceTokens()` reads the active skin's values from `colors_and_type.css` into JS so D3 / Plot / p5 charts stay update-safe (never hardcode a hex). Read by any JS-driven visual. |
| `palace-plot-defaults.js` | Observable Plot house-defaults wrapper — `palacePlot()` bakes the active skin (bg / fg-3 text / mono face / token frame) into every chart. Built on `palace-tokens.js`. |
| `assets/` | Brand marks — Lissajous logos, wordmark, LL monogram, avatar, watermark |
| `assets/logo-lissajous.live.html` | The canonical p5.js live Lissajous sketch (the patch IS the logo) |
| `assets/generators/` | Six per-stream generative SVGs |
| `preview/` | Design-system specimen cards (Type · Colors · Spacing · Components · Brand) |
| `slides/` | OBS card templates (1920 × 1080) — gallery at `slides/index.html` |
| `ui_kits/session-artifact/` | Long-form session HTML, JSX components |
| `ui_kits/stream-overlay/` | OBS live composite — cam, lower-third, watermark, chat |
| `SKILL.md` | Agent-Skills front-matter for Claude Code |
| `_reference/` | Source-file snapshots |

---

## Content fundamentals · cemented

The system as locked through review. Every design decision below carries a rule and a *why*. When in doubt: studio register, never commercial-production register. Autodidact polymath, never broadcast personality.

### Voice

**Curious, technical, professional. First-person. Studio register.** Three vocabulary moves:

| Do | Don't |
|---|---|
| "Let's explore" · "hang out" · "working on something synth-shaped" | "I'll teach" · "subscribe and hit the bell" |
| Collaborators · participants | Students · followers · audience |
| "Live build · synth lab, session 1" · "Sound lab · first principles" | "Finishing the synth in one hour" · "Working synth by end of stream" |
| Sketch / Study / Piece (or per-medium analogues: Demo / Take / Master) | MVP / v1 / final · launch / ship |

The italic-light *Live* is the only italicised word in the wordmark — and italic in body is reserved for emphasis and for the *one* keyword in a two-word title ("The infinite *staircase*", "The *leaky* integrator").

**Sentence case in display and body. UPPERCASE only for mono eyebrows and footers — never for emphasis in prose.**

**First-person.** "I'm working on…" in trailer copy. First-person plural "we'll see / let's…" when the work is collaborative. Second-person "you" only when teaching directly, sparingly — the channel is *with* the viewer, not *at* them.

**Emoji & decorative unicode: never.** No 🎶 / 🔥 / ✨ / hashtag clouds. The only typographic accents are the `·` interpunct as separator, em-dashes for asides, and `● ▸ ◂ ◐ ◇ ◉` for live/state indicators.

**No abbreviations** when a full word fits. *Snare*, not "SNR". *Hats*, not "HAT". Mono labels can be terse but should not be cryptic.

**Honesty as a light touch.** "The channel itself is a work in progress" appears once, in the trailer. It does not become the brand.

---

### Type · the LOCKED stack

| Role | Family | Weights | Use |
|---|---|---|---|
| **Display / wordmark** | **Anton** | 400 | LOUDON / LIVE lockup · slide hero numbers and big poster headlines |
| **Body serif** | **Cormorant Garamond** | 300 (italic 300, 400 reserved) | Long-form reading body in publication-flavoured artifacts · italic pull-quotes · identity statements |
| **UI sans** | **Manrope** | 300 / 400 / 500 / 700 | Magazine-article body in session artifacts · captions · lower-thirds · labels · subheads |
| **Mono** | **JetBrains Mono** | 400 / 500 / 600 | Metadata · eyebrows · parameter chips · code · timestamps |
| **Pixel** | **Silkscreen** | 400 | Sparse legends · dividers · `124 BPM` and `A · 02 / 04` style markers. **Reserved register — never body.** |

**Rules.** Anton is always uppercase, always +0.005em. Cormorant body runs 300 weight at 0.005em tracking. Manrope is 300 for body, 500 for labels; never bold body. Mono eyebrows track +0.18em; mono overlines on the OBS title bar track +0.22em. Pixel font is for technical garnishes only — pixelation is a register, not a default.

**The italic-light "Live" trick.** In any wordmark or hero, when "Live" appears alongside the channel name it is italic, weight 300, in the active accent colour. The trick survives across all skins.

**The /slash separator.** The wordmark is always `LOUDON` slash `LIVE`. The slash is `--fg-3` (never accent). The accent and glow live on the word "LIVE" only.

---

### Color · the LOCKED system

**The brand is intentionally multi-palette.** A locked grammar (type, layout, wordmark) cycles a per-stream skin (palette + generative element + seed). The Graphite skin is the channel default.

| Skin | Register | Bg | Accent | When |
|---|---|---|---|---|
| **Graphite** (default) | Workshop in dim light | `#0a0a0f` | `#e8b84a` signal-amber | The channel default |
| **Amber Lab** | Parchment · philosophical · long-form contemplation | `#f4ecdc` | `#e8651b` signal-orange | Quote · theory · philosophy episodes |
| **CRT** | Phosphor green on stark black · scope / DSP / signal-watching | `#000000` | `#00ff66` phosphor green | First-principles DSP, oscilloscope thinking |
| **Strobe** | Pure black + white + phosphor red · dance / performance | `#000000` | `#ff2a2a` phosphor red | High-energy live, set-pieces, dance |
| **Cobalt Grid** | Lab · mathematics · blueprint | `#0e1f4d` | `#a8e040` lime | Mathematics, formal theory, blueprint-thinking |
| **Drafting** | Paper · schematic · engineering | `#f0eee5` | `#c8261a` engineering red | Build instructions, schematics, signal flow |

**Semantic accents are constant across skins:** `info` (parameter-blue `#4a8fff`), `success` (phosphor green `#00ff66`), `danger` (phosphor red `#ff2a2a`). Use sparingly — one signal per layout.

**No cyan. Anywhere. Ever.** The earlier teal callout colour is dead; change-notes use `info` blue instead.

**Glow is reserved.** The `text-shadow` glow on the wordmark's "LIVE" is the brand's signature lit-sign moment. Use the same glow vocabulary on the on-air red dot (animated 1.6 s pulse) and on tier badges of `success` colour. Do not glow neutral foreground text.

---

### Spacing · radii · borders

- **Radii ceiling = 4 px.** 0 / 1 / 2 / 4 only. Tags & params → 1 px; cards & panels → 2 px; 4 px is the ceiling. **Never 8, never 12.** Pill (999) only when shape carries meaning — `● LIVE`, tier badge.
- **Borders are 1 – 1.5 px.** Never thicker. `--border` is `#4a4a5e` (bumped for visible separation on `#0a0a0f`). On hover, accent border at 0.55.
- **No redundant separation.** If a row has a border, don't also put a dividing line under it. Choose one mechanism.
- **Spacing scale** is 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 120. Geometric thereafter.

---

### Elevation

Elevation lifts off dark surfaces via an **inset top highlight + dark drop**, never just a drop alone. Three levels: base (1 px highlight, 1 px drop), cards (medium highlight, 6 px drop), overlays (strong highlight, 18 px wide drop). Plus accent glow (reserved for the *one* primary CTA per view) and danger glow (reserved for the on-air red dot).

---

### Motion

**Restrained.** `cubic-bezier(.4, 0, .2, 1)` 220 ms is the default; emphasised motion uses `.2 .9 .2 1` at 550 ms. The two ambient motions allowed are: (1) the Lissajous-trace slow rotation in `assets/logo-lissajous.live.html`, and (2) the 1.6 s pulse on the on-air red dot. No bounces, no springs, no decorative motion.

---

### Iconography

Iconographic system: **none, by design.** The channel uses **typographic glyphs as state indicators** (`● ▸ · ◐ ◇`), the **Lissajous trace** as the channel mark, and the **LL monogram** in avatars / lower-thirds. **No emoji. No CDN icon library.** Where a real icon set is later needed, Phosphor Light is the recommended substitute.

---

### Symbolic vocabulary · use intentionally

Each palette and each generator carries a conceptual handle that the autodidact polymath can read at a glance. **Use them when they're relevant, not as decoration.**

| Symbol / register | Conceptual handle |
|---|---|
| Lissajous trace inside a sphere | The higher-dimensional object revealed through accumulated motion · the Hyperdimensional Prism |
| Waveform stack (sine + saw + square + noise) | DSP fundamentals · the spectrum |
| Particle field | Drift · contemplation · slow change |
| Lissajous bundle | Coupled oscillations · ratio families · Kuramoto |
| Spectral bands | Spectrum as bar chart · Fourier register |
| Modular grid (step sequencer) | Rhythm · time-discretized music · pattern programming |
| Phase interference | Wave physics · two-source field |
| CRT scanline veil | First-principles signal watching · the scope on the bench |
| Drafting registration marks | Engineering / schematic register · the patch as plan |
| Parchment warm cream | Philosophy / theory / quote · long-form contemplation |
| Pixel typography (Silkscreen) | Technical garnish · sequencer time-marker · drum-machine display |
| Phosphor red dot, pulsing | "On air" · live · the channel is broadcasting *now* |

---

### Avoid

- Cyan and minty greens. Phosphor green replaces the old teal-cyan in every callout.
- Decorative gradients in chrome. The only allowed gradient is the radial protection-gradient under cards on busy backgrounds.
- Emoji. CDN icon libraries. Hashtag clouds.
- Bubbly humanist fonts (DM Sans, Fraunces, Source Serif 4 in display use). Source Serif 4 stays only as the body-serif fallback.
- Radii ≥ 8 px. Heavy drop shadows on dark surfaces without an inset top highlight.
- Centred-book-cover layouts in slides — left-aligned editorial spread is the default.
- Abbreviations cryptic enough to need decoding ("SNR" instead of "Snare").
- Outcome-promising titles, second-person broadcast voice, emoji.

---

*Footer of every Loudon Live artifact: `Loudon Live · Autodidact Polymaths`*
