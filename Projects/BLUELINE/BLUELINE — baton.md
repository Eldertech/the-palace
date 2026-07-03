---
title: "BLUELINE — baton"
born: 2026-07-03
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: baton-for
forward_vector: "I carry the live move on BLUELINE's Aftermath Frame solver across to a fresh Claude, waiting to be caught and deleted once the move is picked up."
---

# Baton: BLUELINE — the Aftermath Frame solver toward gen-AI frames

## Move
Iterate the **Aftermath Frame Blender solver** from its physical seed toward the real target —
**consistent, beautiful gen-AI action frames**: parameterize the *super-physics* (impossibly strong,
impossibly fast) on top of the real motion, and drive the clay proof to **pen-flow ink**. Then pick up
BLUELINE's [[BLUELINE — Production Plan]] position and ask what runs in parallel.

## Why this move matters
The solver is now *physically honest* (a real rotation → derived tip speed / contact velocity → a real
boolean wound) — but honesty is the **seed, not the product.** The product is frames a reader believes
*and a diffusion model can hold*: consistency from the physical seed, beauty from the render, drama from
the super-physics. The clay renders are not the deliverable; the inked, consistent gen-AI frame is.

## Tried and rejected (this session — don't re-walk)
- **Hand-authored bezier swing** → replaced by the rotation model (S8). Never fake the arc again.
- **Straight speed-lines that touched the blade** → replaced by arc-following lines gapped off the blade (S10).
- **Static column + faked-separate shards** → replaced by a real boolean wound; shards from the gash (S10).
- **Full forward-dynamics for the swing** → rejected; kinematic θ(t) with a peak-at-impact ω keeps it on-beat and art-directable.
- **IK matrix-setting for an exact hand pose** → unreliable headless; instead pose the arm to a target, then *read the actual hand position* and attach the sword there.
- **Render-noise flow-warp** (Track V / M3) → retired across every regime; do not reinvest.

## Current state
- Solver: `proofs/session-10-impact/build_impact.py` (real wound + arc speed-lines) and the parameterized
  `proofs/session-9-three-swings/build_swings.py` (`--swing chop|side|rising`, prints derived physics).
- Comic-amplification knobs exist but are ad-hoc: `GAIN_SPREAD / GAIN_COUNT / GAIN_STREAK`, `DT_STILL`.
- All clay renders. **Not yet:** stylized to ink · Cell-Fracture wound · full swing animated · beat-coupled.
- Honest limits are enumerated in `session-10-report.md` (boolean slit not a splintered wedge; shards
  spawned not literal removed mesh; pose is an approximation).

## Next move
Start with the **stylization seam** — it's the target and it's the biggest unknown: take the aftermath
scene's depth + OpenPose plates ([[Shop/Figure Rig]] emits these) into the render backend
([[BLUELINE — Render Backend]] / [[Steer the Generator]]'s rich-first/stylize-last) and get *one*
inked, consistent aftermath frame. In parallel (independent): (a) make the super-physics a coherent
control (one "impossibly strong/fast" dial group), (b) Cell-Fracture the wound. Then re-read the
Production Plan horizon and slot these against it.

## Receiving environment
Same surface (Claude Code, Mac). Blender **5.1.2** local (no GPU rent for the solver); the studio blends
need **MPFB2 + Rigify** (installed). The **gen-AI render is RunPod and costs money — quote first, never
fire a pod autonomously**; multi-agent-safe orchestrators + the Commons reaper exist (`_ops/commons`,
`_ops/runpod/agent_ns.py`). All BLUELINE work is merged to `main`; **make a worktree for sustained work**
(`node _ops/worktree/new-worktree.mjs --name feature/<x> --profile docs` for markdown, `blueline` for GPU).

## Calibrations from this session
- **Motion real, consequences super-physical.** Never amplify the motion; amplify only the consequences
  (comics are impossibly strong/fast). This is Loudon's explicit split.
- The precise target is **"consistent and beautiful gen-AI frames"** — always steer toward it; the
  physical solver serves that, it is not the end.
- Loudon **probes physical rigor** (he caught the fake swing and the missing deformation). Be honest
  about derived-vs-faked; show the derived numbers.
- He iterates by **looking at renders** — render, show, adjust; small fast loops.

## Load these files first
1. `Projects/BLUELINE/BLUELINE — Production Plan.md` — the front door: status, the 8 threads, the horizon.
2. `Projects/BLUELINE/BLUELINE — Motion and Flow.md` — the motion subsystem, the aftermath §, the three edges.
3. `The Aftermath Frame.md` — the concept + method (just deposited).
4. `Projects/BLUELINE/proofs/session-10-impact/{build_impact.py, session-10-report.md}` — current solver + limits.
5. `Projects/BLUELINE/proofs/session-8-swing/session-8-report.md` + `session-9-three-swings/` — the Motion Model + generalization.
6. `Steer the Generator.md` + `Projects/BLUELINE/BLUELINE — Render Backend.md` — the stylization/render target.
7. `Shop/Figure Rig.md` — the posed swinger + the plates it emits.

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. If this baton or its board line is still uncommitted, commit them first (that commit is the archive).
3. Mark it caught: remove the "Active Baton" section from `BLUELINE.md` (and post the paired `handoff_picked_up` REPLY to the board line).
4. Delete the baton file (git is its archive).
5. If the baton names a receiving-surface capability delta or worktree coordinate, confirm it holds before relying on it.
6. Act on the move, holding the calibrations above.
