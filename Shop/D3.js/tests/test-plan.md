---
title: D3.js — Test Plan
born: 2026-05-30
links:
  - { target: "[[D3.js]]", type: connects-to, label: test-plan-for }
forward_vector: "I hold the test plan for D3.js; I want every check here runnable with an honest last-run date."
---

# D3.js — Test Plan

> Phase E rollout. D3.js is the interactive-control lens of the data-viz triad — sliders, draggable agents, live regime read-outs. Smoke is a syntax-parse via the shared `web-smoke.mjs` helper; the load-bearing probe is the Determinism cross-check that the integrator (handwritten, NOT `d3-force` for kinematic sims) produces the same trajectory as the other triad Specialists.

Last run: **2026-05-30** — Smoke pass on `Flocking/flocking-d3-interactive-control.html`; Determinism informally verified 2026-05-29 (Node cross-check at seed 7 vs. p5.js + Observable Plot Specimens).

## Smoke

```sh
node --experimental-vm-modules Shop/Maker/web-smoke.mjs Flocking/flocking-d3-interactive-control.html
```

- **Automated:** as above. Pass = no `SyntaxError` raised.
- **Last run (2026-05-30):** `smoke: 1 ok, 0 fail (1 inline script)`.

## Capability Probe

D3.js's two proven roles in Shop work:

| Role                              | Last run                                                |
|------------------------------------|----------------------------------------------------------|
| Custom interactive viz with live controls | `flocking-d3-interactive-control.html` — 80 boids, R 0→0.77, live weight sliders, force-vector overlay, no console errors |
| Cobalt-skin variant (palette swap proof) | `flocking-d3-interactive-cobalt.html` — same model, different skin |

- **Last run (2026-05-30):** both covered by Flocking artifacts.

## Style Probe

D3 paints onto an author-controlled SVG (no Layer-0). The artifact must resolve colours via `palaceTokens()` rather than hex-paste. Manual hex grep:

```sh
grep -E '#[0-9a-fA-F]{3,8}' Flocking/flocking-d3-interactive-control.html | grep -v 'href\|cdn'
```

- **Last run (2026-05-30):** canonical artifact resolves via `palaceTokens()`; cobalt variant swaps the skin class on `<html>` and tokens flow through.

## Edge Probe

- **Use `d3-force` for kinematic Reynolds boids** — known wrong-path; `d3-force` is a *relaxation* solver and the boid integrator must be handwritten. Documented as a gotcha on the entry; the test is *don't*, not a run.
- **Stale `requestAnimationFrame` on hot-reload** — multiple rAF loops accumulate if the artifact is reloaded without cleanup. Mitigated by storing the rAF id and cancelling on re-init.

- **Last run (2026-05-30):** edge probes not formally exercised; documented in entry gotchas.

## Speed Bench

Reference host: **mac** (Chrome stable). 80-boid Flocking at < 4 ms/frame — see entry's Iteration Character.

## Determinism (load-bearing)

D3 is a rendering library; *determinism applies to the simulation, not D3's draw step*. The Flocking discipline (Mulberry32 PRNG, seed 7, byte-identical model block shared across the three triad Specialists) is what makes the three comparisons *legible as the same thing*.

- **Reproducibility artifact:** seed + model block source string. The Specialist's standards JSON (`Flocking/flocking-d3-interactive-control.report.json`) captures the seed, N, and weight defaults.
- **Last run (2026-05-30):** informal 2026-05-29 — Node cross-check confirmed D3, Plot, p5 produce identical first-300-frame trajectories at seed 7. The shared-model discipline holds.
