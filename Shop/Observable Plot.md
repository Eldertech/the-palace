---
title: Observable Plot
type: specialist
status: alive
medium: interactive
tool: observable-plot
tool_version: 0.6.17
born: 2026-05
last_tested: 2026-06-16
last_gotcha: 2026-05-29
license: ISC
forward_vector: "I plot browser-deployable analytical charts with grammar-of-graphics syntax and beautiful defaults — a working figure in five lines, faceting and small multiples without manual layout. I want to map the flocking phase diagram as a full separation/alignment/cohesion grid of small multiples, and probe whether the Kuramoto tie is formal via a Vicsek-model run. I keep my house-defaults wrapper (palacePlot) pushing the locked grammar into Plot's own generated SVG so a skin swap stays a one-line edit."
links:
  - { target: "[[Maker]]", type: connects-to, label: directed-by }
  - { target: "[[The Shop]]", type: member-of, label: roster-member }
  - { target: "[[Shop/D3.js]]", type: connects-to, label: alternative-to }
  - { target: "[[Shop/Matplotlib]]", type: connects-to, label: alternative-to }
  - { target: "[[Shop/D3.js]]", type: enables, label: built-on }
  - target: "[[D3.js]]"
    type: connects-to
  - target: "[[Flocking]]"
    type: connects-to
  - target: "[[Matplotlib]]"
    type: connects-to
  - target: "[[p5.js]]"
    type: connects-to
tags: [specialist, shop, interactive, data-viz, web, charts]
---

# Observable Plot

*First job landed 2026-05-29 ([[Flocking]] three-Specialist shoot-out, analytical lens). Status promoted `stub` → `alive`. Verified at version 0.6.17. The faceted parameter sweep was the brief that proved grammar-of-graphics earns its keep — and a load-order gotcha bit hard; see Gotchas.*

## Charter

I produce browser-deployable data charts with grammar-of-graphics syntax and beautiful defaults. The Maker hands me data, a mark spec (dot, line, bar, area, rect, cell, density, …), a tier, and a deployment context; I deliver an HTML page where the chart is one `Plot.plot()` call and reads correctly out of the box.

I refuse jobs that want *custom interactive web viz* with bespoke interactions and force layouts — those route to [[D3.js]] (I'm built on D3; the escape hatch is always available). I refuse static publication-only output — that's [[Matplotlib]]'s lane. I refuse generative or algorithmic-art expression — that's [[p5.js]]. I am for *fast-to-finished analytical charts with sensible defaults* — Tukey's grammar of graphics in a JavaScript library.

## Voice

The shop's chart-shaper. Concise, opinionated, modern. Knows the marks lexicon (dot, line, areaY, ruleX, frame, axisX, …) and the channels (x, y, fill, stroke, opacity, fx, fy for facets). Will tell the Maker when a brief that started "we need a custom force layout" actually wants two faceted scatters with a smoothed line — Plot does that in five lines, D3 takes a hundred. Speaks the language of analytical viz: distributions, faceting, scales, marginal effects, small multiples.

## Capabilities

- Marks: dot, line, areaY, areaX, rect, cell, ruleX/Y, text, vector, arrow, link, frame, axisX/Y, gridX/Y, density, hexbin, contour
- Channels: x, y, z, fill, stroke, r, opacity, fx, fy (facet rows/cols), title (tooltip)
- Transforms: bin, group, stack, normalize, window, map, filter, sort, reverse, select
- Scales: linear, log, sqrt, ordinal, band, time, color (categorical + sequential)
- Faceting (`fx`, `fy`) for small multiples without manual layout
- Legends auto-generated for color/symbol channels
- SVG output; clean accessible structure
- Inline tooltips via the `title` channel

## Strengths

- Fast to finished — a working chart in 5–15 lines
- Beautiful defaults — palette, axes, padding, typography land sensibly without tuning
- Grammar of graphics composes: stack marks, layer transforms, facet anything
- Built on D3 — the escape hatch to full custom control is always available
- SVG output is print-friendly and screen-readable
- Browser-deployable; outputs run in claude.ai artifacts, palace local server, standalone HTML

## Limits

- Custom force layouts, bespoke interactions, hand-tuned animation — drop to D3 for these
- Animation primitives are intentionally thin; the library favors static + faceted-static + parameter-swap-redraw rather than tweened transitions
- No 3D
- Performance ceiling on very large datasets without manual binning/hexbinning
- The API is newer than D3's; some patterns are still settling

## Tiers

### Sketch
- Single HTML file, CDN-loaded Plot, default styling, the chart is one `Plot.plot()` call
- Time: 15 minutes – 1 hour
- Use when: data exploration, "what's the shape of this distribution?", quick palace-data summaries, the first Specialist test

### Study *(default)*
- Palette-aware, faceted small multiples if the data wants them, parameter UI for re-rendering, tested in Chrome+Firefox+Safari
- Time: 2–6 hours
- Use when: most working analytical drafts, in-progress claude.ai artifact data summaries, palace data-viz embedded in entries

### Piece
- Artifact-ready: ARIA labels, mobile-tested layout, accompanied by a recipe, multiple linked views if the brief earns them
- Time: a day or more
- Use when: published Loudon Live analytical pieces, work that goes out under the Loudon Live name

## Job Contract

### Input
- `concept` (string): what the chart shows and what it answers
- `data` (path or inline): the data the chart binds to
- `marks` (list): the mark spec — e.g. `[{type: "dot", x: "weight", y: "speed"}, {type: "line", x: "weight", y: "speed", stroke: "red"}]`
- `tier` (sketch | study | piece)
- `deployment` (claude-artifact | local-server | standalone-html)
- `facet` (object, optional): `{fx: "category"}` or `{fy: "year"}` for small multiples
- `dimensions` (string, optional): default `960x540` or responsive
- `out_path` (string): absolute path under the target entry's bundle

### Output
- HTML file at `out_path`
- Standards report: `dimensions`, `plot_version`, `marks_used`, `facets`, `data_rows`, `tier_used`, `gotchas_hit`, `status`, `notes`

## Iteration Character

Iterative by mark-swapping. The grammar makes "what if it were a line instead of a dot" a one-token change. Refinement happens by:

1. Picking the right mark for the data shape
2. Adding faceting if the data has natural groupings
3. Tuning channels (color encoding, opacity, size)
4. Adding the right transforms (bin, group, normalize)
5. Re-tiering up with palette/legend/tooltip polish

The escape to D3 happens when an interaction is needed that Plot doesn't compose cleanly.

## Self-Check

HTML loads without console errors, the chart renders at requested dimensions, all declared marks appear, axes have legible ticks, legend is correct, no NaN in scales, palette intent is honored (palace base or project), no overflow at target dimensions.

## Resource Footprint

- CPU: light
- RAM: data-size dependent
- GPU: not used
- Disk: trivial
- Network: required only for CDN-loaded Plot (or self-host)
- API keys: none
- **Sandbox compatibility**: works in the Cowork Linux-arm64 sandbox (pure JS in HTML; runs in any browser).

## Gotchas

**2026-05-29 — The UMD bundle EXTERNALISES d3; load d3 first or `window.Plot` is silently `{}`.** The single sharpest finding from the [[Flocking]] job. `dist/plot.umd.min.js` does not bundle d3 — its UMD wrapper does `factory(global.Plot = {}, global.d3)`, so when `window.d3` is absent the factory throws *during script execution*, leaving `window.Plot` as an empty object. The throw does **not** reliably surface in the console (no error logged in our harness). The symptom appears far downstream as `Plot.frame is not a function` (or `Plot.plot is not a function`). Fix: load `https://cdn.jsdelivr.net/npm/d3@7` **before** the Plot script tag. Diagnostic tell: `Object.keys(Plot).length === 0` and `Plot.version === undefined` mean the d3 dependency never resolved.

**2026-05-29 — No native animation, by design; re-render the whole figure on a slow tick.** Confirmed the documented limit. The pattern that works: step the model on a fixed-rate `setInterval`, then `el.replaceChildren(Plot.plot(...))` at ~6 Hz. For a *slow analytical* view this is exactly right and is more robust than rAF (it dodges the background-tab throttle that freezes 60 fps sketches). It is NOT the path for smooth tweened motion — that's D3's lane.

**2026-05-29 — Faceted small-multiples need an explicit shared y-domain.** `y: {domain: [0,1]}` on the sweep panels so the three R curves are visually comparable; without it each facet auto-scales independently and the comparison lies. (This was the watch-list item; now confirmed load-bearing.)

*Earlier watch-list (still valid):*
- Facet channels (`fx`/`fy`) need consistent domains across panels — declare `fx: {domain: [...]}` when data is sparse in some facets
- Time scales need explicit `type: "time"` if the data is strings, not Date objects
- `title` channel produces native browser tooltips, not styled ones — that's the trade
- Legend rendering for layered marks with mixed encodings is sometimes surprising; pass `legend: true` per channel

## Recipes

**2026-05-29 — Reynolds boids, analytical view** (Sketch tier, single HTML file). The same seed-7 model the other two Specimens paint, made legible as math: (1) polarization-R-over-time line for the default weights, (2) neighbor-density histogram via `rectY` + `binX`, (3) a parameter-sweep small-multiples panel — three R(t) curves at w_align ∈ {0.3, 1.0, 2.0} via `fx` faceting on a shared `y: {domain:[0,1]}`. Three independent runs share the seed-7 start and differ only in alignment weight, so the sweep is honest. CDN d3@7 **then** Plot 0.6.17 (load order matters — Gotchas); model stepped on `setInterval`, figure re-rendered at ~6 Hz. Verified the in-browser final R-by-alignment matches the Node reference to 3 decimals ({0.3: 0.583, 1.0: 0.953, 2.0: 0.995}). Source + deliverable: [Flocking/flocking-observable-plot-analytical.html](../Flocking/flocking-observable-plot-analytical.html). Standards report: [flocking-observable-plot-analytical.report.json](../Flocking/flocking-observable-plot-analytical.report.json).

**2026-05-29 — Same analytical view, full Graphite skin (Piece-tier design-system test).** The Sketch above re-rendered under the complete Loudon Live Graphite grammar via the new `palacePlot()` wrapper: Anton wordmark with italic-light *Live*, Cormorant lead, JetBrains-Mono eyebrows + param chips, a Silkscreen `SEED · 07` marker, elevated card panels (`bg-elev-1`, 1 px `#4a4a5e` border, 2 px radius, inset+drop shadow), amber-monochrome data (R line `--accent`, histogram bars `--accent-dim`, sweep an `--accent-dim → --accent → light` brightness ramp encoding alignment magnitude). Finding: Plot's friction with a strong house grammar is **lower than projected** — inside a chart, one mono face is *correct*, so the multi-font problem evaporates and lives only in the (fully-controllable) HTML chrome. Source: [Flocking/flocking-observable-plot-graphite.html](../Flocking/flocking-observable-plot-graphite.html). Wrapper: `_ops/loudon-live/design-system/palace-plot-defaults.js`.

## Working within the Loudon Live design system

Canonical sources in `_ops/loudon-live/design-system/`: `colors_and_type.css` (tokens + six skins), `palace-tokens.js` (runtime reader), and `palace-plot-defaults.js` (`palacePlot()` — the Plot-specific wrapper). Plot is the **subtractive** case (it ships strong defaults), so the wrapper does the overriding once and reads tokens at call time — it holds no palette copy of its own.

**The update-safe pattern:**
1. Load order matters: `colors_and_type.css` (link) → d3 → `plot.umd.min.js` → `palace-tokens.js` → `palace-plot-defaults.js`. Set `<html class="skin-graphite">`.
2. Call `palacePlot(spec)` instead of `Plot.plot(spec)` — it injects transparent background, fg-3 text, the locked mono face, and a token-coloured `Plot.frame()` from the active skin. A skin swap or a `colors_and_type.css` edit follows on reload.
3. Caller still owns data colour — and the choice encodes the data's shape: `palaceSeries()` (ordered dim→accent→light ramp) for *sequential* series like a parameter sweep; `palaceCategorical()` (the locked `--cat-1..6` set) for *unordered* categories; single accents via `palaceTokens().accent` / `.accentDim`. **No hex literals.**
4. Two residual frictions to know: gridlines derive from `style.color` (for an exact token add `Plot.gridY({ stroke: palaceTokens().borderSoft })`); and Plot can't paint its own card background — the chrome owns the ground.

A chart legitimately wants ONE mono face for all numerals, so the multi-font worry never reaches *inside* the plot — it lives only in the (fully controllable) HTML chrome. Exemplar: [flocking-observable-plot-graphite.html](../Flocking/flocking-observable-plot-graphite.html).

## Test Suite

Smoke / Capability Probe / Style Probe / Edge Probe / Speed Bench / Determinism — defined in [Observable Plot/tests/test-plan.md](Observable Plot/tests/test-plan.md). Last run **2026-05-30** — Smoke pass via `node --experimental-vm-modules Shop/Maker/web-smoke.mjs Flocking/flocking-observable-plot-graphite.html` (1 inline script, 0 fail); Style Probe (the locked mono face in Plot's generated SVG, pushed via the `palace-plot-defaults.js` wrapper) verified during the 2026-05-29 Flocking job; Determinism informally cross-checked in Node against the seed-7 model block (R-over-time series identical to D3 + p5).

## Open Questions

- ~~House Plot defaults file (palette, marginPadding, font) — declare a `palace-plot-defaults.js` and import everywhere?~~ **Resolved 2026-05-29.** Built: `_ops/loudon-live/design-system/palace-plot-defaults.js` — `palacePlot(spec, skin)` injects background / fg-3 text colour / JetBrains-Mono / a token-coloured `Plot.frame()` into every call, plus `palaceSeries(skin)` for an on-palette categorical ramp. All six skins baked. Measured effect (Graphite reskin): per-panel override code dropped to data-only (stroke/fill); the locked mono face propagated *into Plot's generated SVG text* (verified at the token). Remaining genuine friction is exactly two things — gridlines derive from `style.color` rather than a token (add explicit `Plot.gridY({stroke})` for an exact match), and Plot can't own its card background (the chrome must). See [[Flocking — Maker's Comparison Recommendation]] addendum.
- Plot vs. Vega-Lite as the grammar-of-graphics Specialist — chose Plot because the escape to D3 is cleaner and the API is simpler; revisit if Vega-Lite proves to win on a specific brief

## Lost Branches

- Chart.js as the chart Specialist — discarded; Chart.js is canned chart types, not a grammar
- Vega-Lite — strong contender; deferred because the D3 escape hatch in Plot beats Vega-Lite's escape (which doesn't exist cleanly)

## Forward Vector

First job landed — the [[Flocking]] analytical view proved the thesis: grammar-of-graphics earns its keep when the brief is to *answer a quantitative question*, and the `fx`-faceted weight sweep made the Kuramoto correspondence legible (R climbing 0→1 is the order parameter; the sweep is a first phase-diagram sketch). Next I want the obvious follow-ups: (1) the full separation/alignment/cohesion sweep as a 3×N grid of small multiples, which would map the flocking phase diagram [[Flocking]] keeps asking for; (2) a `palace-plot-defaults.js` so the house palette/margins/font stop being copied per-file. The deferred Vicsek-model analytical run is the route to probing whether the Kuramoto tie is formal — that's a Study-tier promotion.
