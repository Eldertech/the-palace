---
title: "Flocking — Maker's Comparison Recommendation"
born: 2026-05-29
links:
  - target: "[[Flocking]]"
    type: connects-to
    label: "comparison-deliverable-for"
  - target: "[[Maker]]"
    type: connects-to
    label: "sharpens-selection-heuristic"
  - target: "[[D3.js]]"
    type: connects-to
    label: "candidate"
  - target: "[[Observable Plot]]"
    type: connects-to
    label: "candidate"
  - target: "[[p5.js]]"
    type: connects-to
    label: "candidate"
---

# Flocking — Maker's Comparison Recommendation

*Comparison Mode · three Specialists · one seeded Reynolds model (N=80, seed 7, R=50, weights 1.5/1.0/1.0, toroidal 960×540). The recommendation is the deliverable; the three Sketches are the evidence.*

Here is what each lens revealed that the others could not.

**D3.js — you feel the parameter space.** Drag the alignment weight and the regime label flips drift → milling → coherent in your hand; the force-vector overlay draws the three rules as one resultant arrow per boid, so coordination-without-communication becomes literally visible. But the lesson cuts against the brief I wrote: d3-force was billed as the "primary lane," and it turned out to be the thing I had to *fight*. d3-force is a relaxation solver, not a kinematic integrator — to make it reproduce Reynolds I disabled its friction and cooling and had the custom force *replace* velocity, which uses d3-force as a bare tick loop and throws away its force-composition. The real D3 win was the selection/SVG/interaction grammar, not the physics engine.

**Observable Plot — you read the math.** The faceted sweep is the whole argument: three R(t) curves at w_align ∈ {0.3, 1.0, 2.0}, shared y-axis, in essentially one `Plot.plot()` call. *This* is where the Kuramoto tie stops being a metaphor — R climbing 0→1 is the order parameter, and the sweep is a first sketch of the phase diagram [[Flocking]] asks for. No other lens answered a quantitative question. Cost: zero felt dynamics, plus a real load-order gotcha (Plot externalizes d3).

**p5.js — you feel the phenomenon.** Color-by-velocity turns alignment into a hue field: a coherent flock reads as colour agreement before any number is computed. Fastest to author, most beautiful, least informative. The flock as art.

**Routing, going forward:**
- Brief wants the user to *manipulate rules and feel the regime* → **D3.js** — but write your own integrator; reach for d3-force only for rendering/interaction.
- Brief wants to *answer a quantitative question* (converges? what regime? phase diagram?) → **Observable Plot**, faceting.
- Brief wants the phenomenon *felt or ambient* (header, mood, art) → **p5.js**.

None of the three substitutes for another. For a "same math, three lenses" brief, Comparison Mode genuinely paid — and the shared seeded model is exactly what let the three read as the *same* thing. I'm folding this into my Selection Heuristics as a new particle/agent-systems line.

## Addendum (2026-05-29) — design-system fit, measured

A follow-on test ran the question *how well does each lens carry the Loudon Live grammar?* by taking the Plot analytical view to full **Graphite** at Piece tier ([flocking-observable-plot-graphite.html](flocking-observable-plot-graphite.html)) and building the reusable wrapper `_ops/loudon-live/design-system/palace-plot-defaults.js`.

The governing axis: a design system is a defaults-override discipline, so fit is inverse to how opinionated the tool is.
- **D3.js / p5.js** — no defaults; the system is *additive*. Near-zero friction, but you do all the styling work anyway.
- **Observable Plot** — strong defaults; the system is *subtractive* (an implicit "Layer 0" of the tool's own taste). Highest friction — **but lower than I projected.** Two corrections from the measurement: (1) inside a chart one mono face is *correct*, so the multi-font worry evaporates and lives only in the HTML chrome you fully control; (2) the wrapper collapses per-panel override cost to data-only and pushes the locked mono face *into Plot's generated SVG* (verified at the token). Residual friction is just two things: gridlines derive from text colour (not a token), and Plot can't own its card background.

Verdict: all three can wear the full skin at Piece tier. D3/p5 by direct application; Plot by a one-time wrapper investment that's now made. The wrapper generalises — build the skin shim before a tool's *second* styled job, not per-artifact.

*Loudon Live · Autodidact Polymaths*
