---
title: Murmuration — plan
born: 2026-06-22
links:
  - target: "[[Murmuration]]"
    type: connects-to
    label: plan-for
  - target: "[[Diversity of Thought in Many-Agent Systems]]"
    type: connects-to
  - target: "[[Review Layer]]"
    type: connects-to
forward_vector: "I hold Murmuration's live work-state — open decisions and a done trail — so the next steward or session picks up without re-deriving where the build stands. My end-state is to stay an accurate read-model of the project's forward vector, never a second copy of it."
---

# Murmuration — plan

Work-state for [[Murmuration]]. The forward vector lives on the entry; this file holds the moving parts. (Bundle `plan` file per [[SCHEMA]] §8 — Maker/steward-facing, high-churn.)

## Done

- **Prototype built & model-verified** (origin 2026-05; rebuilt into this bundle 2026-06-22). p5.js field+flock + AudioWorklet granular engine, flock-as-grains reading. Seed-7 deterministic; Disorder η phase transition confirmed headlessly (φ 0.10→0.93 at η=0, ≈0.10 at η=0.80; zero nonfinite). `Murmuration.html` in this bundle.
- **Engine specialist created** — [[Shop/Web Audio Worklet]] (its first job; exists because [[Shop/Tone.js]] refuses custom DSP).
- **Review Layer present** — regrouped from the prototype's 12 per-control moments to 7 coarse per-region moments, per the [[Review Layer]] granularity lesson. `REVIEW_MODE` flag, round 2.

## Open decisions

- **Cross-browser Study** — currently Chrome-only Sketch; take to Chrome/Firefox/Safari desktop, no clicks at target voice count, before claiming Study tier.
- **Second & third readings** — flock-as-distribution (additive weighting from live 2D density) and a richer predator-startle envelope. Designed in the entry; not built.
- **Voice ceiling** — profile boids/grains sustainable per platform.
- **Pitch ↔ timbre coupling** — height→pitch and (u,v)→timbre currently overlap; decide whether to decouple or lean in. Musical question, settle by ear.
- **RNBO crossover** — build the same spec as a `codebox~` device; compare browser cousin vs DAW native ([[Diversity of Thought in Many-Agent Systems]] probe).
- **Audible confirmation** — the in-browser smoke test (Engage unlocks; flock audible; Disorder melts tone→cloud; predator scatters then re-coheres) still belongs to whoever opens it first.

## Flagged for Weave

- [[Shop/Web Audio Worklet]] recipe — repoint the dead `Artifacts/Murmuration Synth/` path to this bundle (fixed inline 2026-06-22 as a small deposit-allowed correction; re-verify on next Weave).
- [[Review Layer]] — its § proofs cite Murmuration as an `Artifacts/` orphan; now that the project + bundle exist, the reference could point at the live bundle path on the next Weave.
- Review-surface upgrade — migrate this artifact's Copy-for-Claude export toward the STIGMERGY `human_eval` poster (`_ops/loudon-eval/`) once that poster is generalized beyond the rating-sheet shape.
