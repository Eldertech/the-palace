---
title: "Flocking — handoff"
born: 2026-05-29
links:
  - target: "[[Flocking]]"
    type: connects-to
    label: "handoff-for"
  - target: "[[The Shop]]"
    type: connects-to
    label: "data-viz-shoot-out"
  - target: "[[Maker]]"
    type: connects-to
    label: "directs-the-shoot-out"
  - target: "[[D3.js]]"
    type: connects-to
    label: "first-job-target"
  - target: "[[Observable Plot]]"
    type: connects-to
    label: "first-job-target"
  - target: "[[p5.js]]"
    type: connects-to
    label: "second-job-target"
  - target: "[[Kuramoto Coupling]]"
    type: mirrors
    label: "synchrony-cousin"
forward_vector: "I carry the Flocking shoot-out — a three-Specialist Comparison Mode test on Reynolds canonical boids — across the Cowork → Claude Code instance boundary. Pick me up, then archive me. When I'm consumed: D3.js and Observable Plot are alive, the data-viz roster gap is closed, the Comparison Mode pattern has its first complete execution, and [[Flocking]] has its first artifacts."
session_thread: "Cowork session 2026-05-29 — seeded the [[Flocking]] concept entry, drafted D3.js and Observable Plot Specialist briefs, scoped this shoot-out. p5.js was already alive from the [[Kuramoto Coupling]] arc."
---

<!-- CONSUMED 2026-05-29 (Claude Code). All five next-moves delivered: three Sketches built + browser-verified, standards reports written, Maker's Comparison Recommendation drafted, D3.js + Observable Plot promoted stub→alive (last_tested 2026-05-29, gotchas dated), recipes added, artifacts embedded in Flocking.md, activation_count→2 / stage seed→sprout. Two real gotchas surfaced: d3-force-is-a-relaxation-solver, Plot-UMD-externalises-d3. Archived per the handoff's own instructions. -->

# Handoff: Flocking — Three-Specialist Shoot-Out

## Move

Deliver the data-viz shoot-out — three Sketches (D3.js, Observable Plot, p5.js) on the canonical Reynolds boids model, with the Maker's written recommendation as the Comparison-Mode deliverable.

## Why this move matters

Three things at once:

1. **Closes the data-viz roster gap.** D3.js and Observable Plot were just drafted as Specialist entries; this is their first job. The Shop has been thin in the interactive web viz / data-grammar lane since founding.
2. **First complete execution of Comparison Mode.** The Midjourney↔ComfyUI Comparison from Round 1 never finished (Midjourney never ran). This one runs all three Specialists to completion against an identical model and produces the actual Maker recommendation — which is what sharpens the Selection Heuristic for this lane.
3. **Anchors the freshly-seeded [[Flocking]] entry with its first artifacts.** The entry's Forward Vector names this exact shoot-out as its planned first round.

## Tried and rejected

- Predator extension for the Sketch — deferred. Sketch-tier wants the same exact canonical Reynolds model across all three so the comparison is honest; predator is a Study-tier promotion if any of the three earns it.
- Vicsek model for the Sketch — deferred. Reynolds three rules is more pedagogically clear at first contact; Vicsek is a candidate for the analytical follow-up that probes the Kuramoto correspondence formally.
- Running this in the Cowork sandbox — all three Specialists are sandbox-compatible (pure JS in HTML), but the rest of the Shop work has been Mac-side and consistency is worth more than the small convenience.

## Current state

- [[Flocking]] is seeded (concept entry, stage seed, activation_count 1, dense typed links to Kuramoto / Cooperation Yields Agency / BBS Blackboard / Mixture of Experts / Spinoza Conatus / Trickster).
- `Shop/D3.js.md` — stub, awaiting first job (this one).
- `Shop/Observable Plot.md` — stub, awaiting first job (this one).
- `Shop/p5.js.md` — `alive` since 2026-05-10 (Kuramoto coupling explorer was the first job). This is its second.
- `Flocking/` bundle exists (holds this handoff). No other artifacts yet.

## Next move

**Shared model spec — pin first, all three Specialists run THIS:**

- Reynolds three rules: separation, alignment, cohesion. No predator, no leader, no environmental forces.
- N = 80 boids
- Domain: 960 × 540 canvas/SVG, toroidal boundary (wrap at edges)
- Neighbor radius R = 50 px (same for all three rules — Sketch keeps it simple)
- Max speed = 3 px/frame; max steering force = 0.05 px/frame²
- Default rule weights: w_separation = 1.5, w_alignment = 1.0, w_cohesion = 1.0
- **Seeded initial conditions** — same RNG seed across all three Specialists so the boids start identically. Use a small reproducible PRNG (e.g., Mulberry32 with seed = 7) for initial positions and velocities. This is the discipline that makes the Comparison honest.

**1. D3.js (first job) — Interactive control demo.** Single HTML file, CDN-loaded D3 v7. The above shared model implemented as a custom force (write `forceSeparation`, `forceAlignment`, `forceCohesion` rather than coercing `d3-force`'s built-ins). Three live sliders for the rule weights. Toggle for the per-boid force-vector overlay (a faint amber arrow on each boid showing the resultant steering force). Live polarization R readout in the corner. Sketch tier — no mobile, no ARIA, no Study-tier polish.

**2. Observable Plot (first job) — Analytical view.** Single HTML file, CDN-loaded Plot. The shared model runs in JS (same code path as the D3 simulation — share it). The display is Plot:

- **Polarization R over time** — a line plot, last 30 seconds rolling.
- **Neighbor-density histogram** — binned, updated on a slow tick (~5 Hz).
- **Small-multiples parameter sweep** — three panels via `fx` faceting, showing the polarization-R curve for w_align ∈ {0.3, 1.0, 2.0} with the other weights held constant. This is the brief that earns Plot's grammar-of-graphics keep.

The model animates; Plot re-renders on the slow tick. No UI sliders here — the parameter sweep IS the analytical view.

**3. p5.js (second job) — Expressive interpretation.** Single HTML file, CDN-loaded p5. Same shared model. Render: trails (8–12 frame fading buffer via a semi-transparent background rect each frame, NOT `clearRect`), color-by-velocity (HSL hue mapped to heading angle), no UI chrome, no labels, no sliders. The flock as algorithmic art. Sketch tier.

**4. Maker's Comparison recommendation — the actual deliverable.** A short prose recommendation (200–400 words) covering: what each medium revealed about the flocking math that the others didn't, when a future flocking-shaped brief should route to D3 vs. Plot vs. p5.js, and where the Selection Heuristic in `Shop/Maker.md` should be updated. This recommendation, more than any individual artifact, is what closes the Comparison.

**5. After delivery:** date each Specialist's gotchas; set `last_tested: 2026-05-29` on D3.js and Observable Plot; promote both `stub` → `alive`; draft a recipe per Specialist; embed the three artifacts into `Flocking.md` near the "Shop's Interest" section per the Enrichment placement protocol; update Flocking's `activation_count` → 2 and `last_activated`.

## Calibrations

- Mode (b) — direct Maker briefs, not BBS.
- **Reproducibility discipline carries forward**: same seed across the three Specialists. Document the seed and the PRNG in each Specialist's script header so a later style pass can re-run identically.
- Style stays deferred. Use the neutral Kuramoto palette (indigo `#6366F1` / amber `#F59E0B` / dark `#0B0B10`) as a working default, but accept that Observable Plot's grammar-of-graphics defaults will look different by nature — that visual difference is part of what the Comparison reveals.
- All three Specialists are sandbox-compatible (pure JS in HTML), but run them Mac-side for consistency with the rest of the Shop.
- Commits Mac-side; clear stale git locks first: `rm -f .git/HEAD.lock .git/index.lock`.
- p5.js's existing entry already declares its tier vocabulary; D3.js and Observable Plot inherit Sketch/Study/Piece canonical.

## Gotchas to watch

- `d3-force`'s built-in forces are graph-oriented; for Reynolds you write custom force functions and add them via `simulation.force("separation", forceSeparation)`. The naïve attempt to coerce `forceLink` or `forceManyBody` will waste an hour.
- Observable Plot has no native animation — the animation is via re-render on the slow tick. For N=80 boids this is cheap; for larger N it would need a different approach.
- p5.js trails want a semi-transparent rect each frame (e.g., `fill(11, 11, 16, 25)` then `rect(0,0,width,height)`), NOT `clearRect` or `background()`. Easy to get wrong.
- Toroidal boundary needs to be in the neighbor-finding too, not just the position update — otherwise boids near the edge see fewer neighbors and the alignment force breaks down at the seam.
- For the Comparison to be honest: same seed, same N, same R, same weights, same max-speed/force. The reports must capture all of these in the standards JSON.
- Observable Plot's facet panels need explicit shared y-domain (`y: {domain: [0,1]}`) for polarization R, so the three curves are visually comparable.

## Load these files first

Tier 1: `Flocking.md`, `Shop/Maker.md`, this handoff.
Tier 2: `Shop/D3.js.md`, `Shop/Observable Plot.md`, `Shop/p5.js.md`, `Kuramoto Coupling.md` (for the order-parameter / coupling-strength language the analytical view inherits).
Tier 3: `Enrichment.md` (placement protocol); `SCHEMA.md` §8 (bundle conventions); `Surfaces and Capabilities.md` (sandbox vs. Mac feasibility, if relevant).

## Note to incoming Claude

This is the second Comparison Mode test the Shop has run — the first (Midjourney↔ComfyUI Round 1 close-out) is still unfinished, with its handoff at `Kuramoto Coupling/Kuramoto Coupling — handoff.md` un-archived. Do not pull that one in; it stays its own outstanding piece of work. This handoff is self-contained on Flocking.

After consumption: archive this to `Flocking/Archive/Flocking — handoff — 2026-05-29.md`, remove the Active Handoff section from `Flocking.md`, and the next horizon — beyond Round 1 close-out and the data-viz gap-fill — is wiring all the now-trusted Specialists into Enrichment v2 (the originating Cowork conversation has that frame).
