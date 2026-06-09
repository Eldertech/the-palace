# Sketch — design-token compliance pass (cycle 5, 2026-06-08)

The Karplus-Strong Sketch artifact (`sketch-karplus-strong/index.html`) was built
and presented in cycle 4, where it met success criteria 1–4 (see-it-hear-it loop
closes; the string shape is the delay-line contents; sliders change audio + visual;
runs single-file in Chrome). It **failed criterion 5** of the brief: the palette was
hardcoded hex (`#0b0d10` body, `0xff7a3d` string, `0x3a4450` endpoints) and the
`Loudon Live · Autodidact Polymaths` footer was absent.

This cycle fixed exactly that, and nothing else — the physics, the worklet loop, the
postMessage bridge, the raycaster pluck, and the slider wiring are untouched, so the
sensory verdict still pending from cycle 4 (steward-011) is not pre-empted.

## What changed

- **Inlined the Graphite token block** verbatim into `:root` from
  `_ops/loudon-live/design-system/colors_and_type.css` (permitted for a `file://`
  single-file artifact by the brief's §3 note — inline the custom properties, do not
  hardcode the resolved hexes downstream).
- **Added `palaceTokens()`** — reads the CSS custom properties at runtime and exposes
  a `threeColor(name)` helper that resolves a `--var` to an integer `THREE.Color`,
  because Three.js needs `0xRRGGBB`, not a CSS string.
- **Routed all three Three.js colors through tokens:** scene background ← `--bg`,
  string line ← `--accent` (signal-amber), endpoints ← `--fg-3`. No `0x…` literal
  survives in the scene code; the only hexes left are the canonical token values in
  `:root`.
- **CSS UI chrome** now reads `var(--bg)`, `var(--border)`, `var(--accent)`, etc.,
  with Manrope for labels/buttons and JetBrains Mono for the numeric read-outs (the
  locked type grammar). Range inputs use `accent-color: var(--accent)`.
- **Added the footer** `Loudon Live · Autodidact Polymaths`.

## Verified this cycle

- Both the worklet `<script>` and the main-thread `<script>` parse clean under Node.
- No `0x` hex literal remains in the scene/JS code (grep): the only hexes are the
  inlined `:root` tokens.

## Still human-pending (unchanged from cycle 4)

- The sensory verdict: does the see-it-hear-it loop actually *read*? That is the
  open `steward-011` ask, parked on Loudon's ears.
- A noted physics nuance worth a Study-tier revisit: the loop filter carries a single
  `this.lp` one-pole state across the whole ring rather than a per-tap two-sample
  average, which couples the lowpass across the buffer. It is audibly plausible as a
  damped pluck, but it is not the textbook KS averaging filter. Holding this for a
  RESPAWN-WITH-FIXES path so it rides the same verdict rather than pre-empting it.
