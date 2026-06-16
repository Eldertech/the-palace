---
title: Observable Plot — Test Plan
born: 2026-05-30
links:
  - { target: "[[Observable Plot]]", type: connects-to, label: test-plan-for }
forward_vector: "I hold the test plan for Observable Plot; I want every check here runnable with an honest last-run date."
---

# Observable Plot — Test Plan

> Phase E rollout. Observable Plot is the analytical lens of the data-viz triad — grammar of graphics, faceting, beautiful defaults. The Specialist has a strong Layer-0 (its own typography + colour scheme baked in); the Maker's house-defaults wrapper at `_ops/loudon-live/design-system/palace-plot-defaults.js` is the bridge, and the Style Probe checks the wrapper pushed the locked grammar through to the generated SVG.

Last run: **2026-05-30** — Smoke pass on `Flocking/flocking-observable-plot-graphite.html`; Style Probe (mono face in generated SVG) verified during the 2026-05-29 Flocking job; Determinism informally verified by the same shared-model cross-check.

## Smoke

```sh
node --experimental-vm-modules Shop/Maker/web-smoke.mjs Flocking/flocking-observable-plot-graphite.html
```

- **Automated:** as above. Pass = no `SyntaxError` raised.
- **Last run (2026-05-30):** `smoke: 1 ok, 0 fail (1 inline script)`.

## Capability Probe

Plot's three Shop roles, all proven by the Flocking shoot-out's analytical lens:

| Role                                  | Last run                                                            |
|----------------------------------------|----------------------------------------------------------------------|
| Quantitative panel chart (R-over-time) | `flocking-observable-plot-graphite.html` — 3 panels rendered         |
| Histogram                              | same artifact — neighbor histogram                                   |
| Faceted sweep (`fx`)                   | same artifact — alignment sweep, 3 facets                            |

- **Last run (2026-05-30):** all three covered by the Flocking analytical artifact.

## Style Probe (load-bearing for Plot)

Plot's Layer-0 typography and colour are aggressive. The Maker pushes the locked Loudon Live grammar via `_ops/loudon-live/design-system/palace-plot-defaults.js`, which wraps `Plot.plot()` to (a) resolve the active skin's tokens, (b) inject the mono face into the generated SVG, (c) swap colour scales to the categorical or accent ramp.

- **Manual:** open `flocking-observable-plot-graphite.html` in a browser, inspect the SVG, confirm `font-family: 'JetBrains Mono'` appears on axis-label `<text>` elements and the colours are from the resolved skin.
- **Automated check (partial):** `grep -E "font-family.*Mono" <generated-svg>` — only works if the SVG is captured to disk.
- **Last run (2026-05-30):** Plot's `<svg>` output carries the locked mono face — verified during the 2026-05-29 Flocking job and not regressed since.

## Edge Probe

- **`Plot` undefined** (UMD load order): Plot externalises `d3` and must be loaded *after* d3 in script-tag order. The Flocking job hit this on first build; the load-order fix is now in the canonical artifact.
- **NaN in series data**: Plot silently skips (matches Matplotlib's behaviour). Not a probe; documented.

- **Last run (2026-05-30):** d3-before-Plot load order verified in canonical artifact; NaN behaviour documented but not probed.

## Speed Bench

Reference host: **mac** (Chrome stable). Plot renders all three Flocking analytical panels in well under a frame — Plot is never the bottleneck.

## Determinism

Like D3, *Plot itself is not the determinism surface* — the shared seeded model is. Plot deterministically renders the same data to the same SVG (modulo browser font hinting).

- **Reproducibility artifact:** seed + model block + data array (or hash).
- **Last run (2026-05-30):** informal 2026-05-29 — Node cross-check confirmed Plot produces identical R-over-time series at seed 7 to D3 and p5.
