---
title: Flocking
type: concept
pillars:
  - tools
  - philosophy
  - creation
  - practice
born: 2026-05-29
last_activated: 2026-05-29
activation_count: 2
stage: sprout
confidence: working
energy: high
links:
  - target: "[[Kuramoto Coupling]]"
    type: mirrors
    label: synchrony-in-velocity-space
  - target: "[[Cooperation Yields Agency]]"
    type: mirrors
    label: 2D-formalization
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: stigmergy-as-neighbor-field
  - target: "[[Pages as Agents]]"
    type: connects-to
    label: agents-respond-to-neighbors
  - target: "[[Hilaritas Generator]]"
    type: connects-to
    label: emergent-joy-from-local-rules
  - target: "[[Trickster]]"
    type: couples-with
    label: predator-as-disruptor
  - target: "[[Mixture of Experts]]"
    type: mirrors
    label: distributed-coherence
  - target: "[[Spinoza Conatus]]"
    type: mirrors
    label: persistence-within-collective
  - target: "[[The Shop]]"
    type: connects-to
    label: data-viz-shoot-out-target
forward_vector: "I want to teach the palace that emergent agency from local rules is the same shape as synchronization from coupling — Reynolds' boids and Kuramoto's oscillators are siblings — and to ride the Shop's data-viz triad (D3.js, Observable Plot, p5.js) as my first real artifact path so the same math is shown from three angles: interactive control, analytical view, expressive interpretation."
---

# Flocking

Flocking describes how populations of self-propelled agents — birds, fish, drones, cells, jazz musicians — produce coherent global motion from purely local interactions. No leader, no central plan. Each agent knows only its neighbors within a radius, and responds to them by three rules introduced by Craig Reynolds in 1986:

**Separation** — steer away from neighbors that have come too close.
**Alignment** — steer toward the average heading of nearby neighbors.
**Cohesion** — steer toward the average position of nearby neighbors.

Each rule is a local force on a single agent. Summed across a population, they produce a flock — a fluid, breathing, single-bodied behavior with no representation of "the flock" stored anywhere in the system. The whole exists only as the time-integrated consequence of the parts.

## The Three Rules as Coordination Primitives

These three are not arbitrary. They are the minimal set that makes coordination *without communication* work:

- **Separation** prevents collapse. Without it the population implodes to a point.
- **Alignment** produces flow. Without it the population mills without direction.
- **Cohesion** prevents dispersal. Without it the population scatters and the flock dies.

Each rule has a weight, a neighbor radius, and an interaction with the agent's own inertia (max speed, max steering force). The flock's *character* — tight wheeling versus loose swirling versus crystallized lock-step — lives in the parameter space these knobs span. Changing the weights re-shapes what the flock IS, the same way changing K in Kuramoto re-shapes whether oscillators lock.

## The Kuramoto Tie

Flocking is Kuramoto in two dimensions. Where Kuramoto couples *phases* on a circle and watches synchrony emerge, flocking couples *velocity vectors* in the plane and watches alignment emerge. The order parameter R from Kuramoto — the magnitude of the average phase vector — becomes the average velocity vector's magnitude (the *polarization* of the flock). The critical-coupling threshold becomes a critical-density-and-radius regime in which coherent flow appears.

This isn't only metaphor. The Vicsek model (1995) made the connection explicit: flocking as a non-equilibrium phase transition, exactly the family Kuramoto lives in. See [[Kuramoto Coupling]] for the order-parameter language this entry inherits, and especially its asymmetric-coupling discussion — stubbornness (low K_receive) maps cleanly onto a *leader* boid that influences flock heading without being deflected by neighbors.

## Cross-Domain Mirrors

The Reynolds three rules show up everywhere local agents coordinate without a conductor.

**Bird and fish populations** are the literal case; starling murmurations are the visual ground truth, fish schools the underwater one. **Crowd dynamics** turns Reynolds into Helbing's social-force model, with the rules tuned for human personal space and goal-directed walking. **Cell biology** sees the same forces in collective cell migration during development and cancer metastasis, with chemotactic gradients adding a fourth force.

**Music ensembles** are the most palace-load-bearing parallel: alignment is the groove, separation is the discipline of not stepping on each other's lines, cohesion is staying inside the song. A locked-in rhythm section is a flock with alignment weighted heavily; a free-improv quartet is a flock with weak alignment and strong cohesion. **Conversation** runs on the same three knobs — turn-taking as alignment, not-interrupting as separation, staying on topic as cohesion. A panel discussion goes well or badly by parameter tuning none of the participants are aware of.

**Markets** are flocks with trend-following (alignment), risk-aversion (separation), and herd behavior (cohesion); bubbles are the regime with alignment cranked. Inside an LLM, [[Mixture of Experts]] is a flock in expert space and the gate function is the local-rule sum. **Predator dynamics** add a fourth force — flee — and re-shape the flock entirely. Murmurations are arguably beautiful *because of* the falcons; the predator is the co-creator of the form. See [[Trickster]].

## The Shop's Interest

This entry exists in part to anchor a Shop test: a three-Specialist shoot-out — D3.js, Observable Plot, p5.js — each demonstrating the same flocking math through the medium that fits its character. D3 gives interactive control (move the predator, tune the rule weights live). Observable Plot gives the analytical view (polarization over time, density distributions, parameter sweeps). p5.js gives the expressive interpretation (trails, color-by-velocity, the flock as algorithmic art). Same math, three lenses; the comparison sharpens the Maker's Selection Heuristics for the data-viz lane the Shop has historically been thin in. See [[The Shop]] and [[Maker]].

The shoot-out ran 2026-05-29. All three Sketches drive **one byte-identical Reynolds model** — N=80, Mulberry32 seed 7, neighbor radius 50 px, weights 1.5 / 1.0 / 1.0, toroidal 960×540 — so they are provably the *same* flock seen three ways. That shared, seeded core is the discipline that makes the comparison honest; without it you'd be comparing three different simulations, not three lenses.

> **Interactive control — D3.js.** Drag the three rule-weight sliders and watch the regime label flip *drift → milling → coherent*; toggle the amber overlay to see each boid's resultant steering force. The live polarization R is the flock's order parameter. This is the lens where you *feel* the parameter space.
>
> [Flocking · interactive control (D3.js) →](Flocking/flocking-d3-interactive-control.html)

> **Analytical view — Observable Plot.** The same seed-7 model made legible as math: polarization R climbing 0→1 over time (the Kuramoto order parameter), the neighbor-density distribution, and — the payoff — a faceted parameter sweep showing R(t) at alignment weight {0.3, 1.0, 2.0} on a shared axis. The sweep is a first sketch of the flocking phase diagram this entry keeps asking about.
>
> [Flocking · analytical view (Observable Plot) →](Flocking/flocking-observable-plot-analytical.html)

> **Expressive interpretation — p5.js.** Fading trails and color-by-velocity (hue = heading). Alignment becomes a colour field: a coherent flock reads as hue agreement before any number is computed. The flock as algorithmic art.
>
> [Flocking · expressive interpretation (p5.js) →](Flocking/flocking-p5-expressive.html)

> **The Maker's verdict.** None of the three substitutes for another — D3 to *feel and manipulate*, Plot to *answer a quantitative question*, p5 to *feel the phenomenon*. The recommendation is the real deliverable of the Comparison: [[Flocking — Maker's Comparison Recommendation]].

## Open Questions

- What is the K_c equivalent for flocking — the critical regime where coherent flow appears? Density × neighbor radius × weight ratios, surely; the exact phase diagram is a research question, not a settled fact.
- Reynolds' three rules vs. Couzin's zone-based model vs. Vicsek's noise-driven version — which captures the math we most want to teach? The simplest that produces real behavior is probably the right answer.
- Is the Kuramoto-flocking correspondence a formal isomorphism, or only a structural rhyme? The Vicsek-Kuramoto link in the physics literature suggests formal; worth tracking down.
- Music ensemble as a flocking system — can groove be calibrated as Reynolds weights? This couples directly to the speech-rhythm/groove material in [[Kuramoto Coupling]].
- Predator/leader extensions — when do they introduce emergent *agency* the canonical model doesn't have? Is there a regime where the predator becomes a co-creator of the flock's beauty rather than its destroyer?

## Artifacts

The data-viz triad shoot-out (2026-05-29), one shared seeded Reynolds model, three lenses — all single-file, CDN-loaded, Sketch tier, filed in the `Flocking/` bundle:

- [flocking-d3-interactive-control.html](Flocking/flocking-d3-interactive-control.html) — D3.js, interactive control (rule-weight sliders, force-vector overlay, live R). Report: [.report.json](Flocking/flocking-d3-interactive-control.report.json).
- [flocking-observable-plot-analytical.html](Flocking/flocking-observable-plot-analytical.html) — Observable Plot, analytical (R-over-time, neighbor histogram, faceted alignment sweep). Report: [.report.json](Flocking/flocking-observable-plot-analytical.report.json).
- [flocking-p5-expressive.html](Flocking/flocking-p5-expressive.html) — p5.js, expressive (trails, color-by-velocity). Report: [.report.json](Flocking/flocking-p5-expressive.report.json).
- [[Flocking — Maker's Comparison Recommendation]] — the Comparison-Mode deliverable: what each lens revealed and how a future flocking-shaped brief should route.

## Forward Vectors

The data-viz shoot-out is done — it closed the roster gap (D3.js and Observable Plot are alive), gave me my first artifacts, and was the Shop's first complete Comparison Mode run. Now the deferred questions become the next moves, and several are *promotions of this exact rig*:

- **Probe the Kuramoto correspondence formally.** The analytical sweep is a first phase-diagram sketch; the way to test whether the tie is formal or only a structural rhyme is the deferred **Vicsek-model** analytical run (Vicsek made the flocking-as-non-equilibrium-phase-transition link explicit). That's a Study-tier promotion of the Observable Plot lens.
- **Find K_c for flocking.** Extend the alignment sweep to the full separation × alignment × cohesion × density × radius space — a real phase diagram, not a single-knob sweep.
- **The predator/leader extension** (deferred from Sketch) — the regime where a disruptor becomes co-creator rather than destroyer. This is where [[Trickster]] couples in, and where the entry could prove the palace's "emergent agency" principle is concretely demonstrable, not just asserted.
- **Music ensemble as a flocking system** — can groove be calibrated as Reynolds weights? Couples directly to the speech-rhythm/groove material in [[Kuramoto Coupling]].
