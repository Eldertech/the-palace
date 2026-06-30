---
title: "BLUELINE — baton"
born: 2026-06-23
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: baton-for
  - target: "[[Frame Designer]]"
    type: connects-to
forward_vector: "I carry the new-story sequence across the overnight pause — storyboard done, animatic next — waiting to be caught once Loudon brings the song tomorrow."
---

# Baton: BLUELINE — new-story sequence

> **Storyboard COMPLETE.** The 6-shot opening is shot. Next rung is the **ANIMATIC**; Loudon brings a song tomorrow (the spine everything pins to). All cloud/local render resources are spun down.

## Move
Sequence the 6 storyboard boards into a timed **animatic**, pinned to the song Loudon brings — the BLUELINE pipeline's next rung (storyboard → **animatic** → motion comic → flow-field → hyperreal). In BLUELINE the music leads and the frames follow; ride the existing Track-III clock work.

## Where it stands — the 6-shot opening (all on this branch, `proofs/new-story/`)
A noir-tragedy opening in one consistent pen-flow ink language. Keeper file per shot:
1. **01 burning city** — `out/01_wide-burning-city.png`
2. **02 hero on the car** — `out/02_fixed_bw_s2211.png` (fixed 2026-06-23: authored standing-on-roof pointing pose + forced B&W desaturate)
3. **03 the leap** — `out/03_leap-legs-denting-roof.png`
4. **04 plummet** — `out/04_plummeting-from-below_s1234.png`
5. **05 impact over the dying woman** — `layers/rich_final_d85.png` (the polished one — full rich-first pipeline)
6. **06 the kiss → HERO POV** — `out/06_the-kiss-blood-sweat_s5678.png` (reframed: the two-figure kiss became the hero's POV looking straight down at her face; the kiss is the unseen thing past the bottom edge)

Final sequence atlas: `layers/opening_sequence_FINAL.png`.

## The validated pipeline (reusable — see [[Frame Designer]])
- **openpose-first staging** — author skeletons, strong conditioning (~0.95), facing color-encoded
- **rich-first / stylize-last** — render rich (colour/value) → GrabCut **sharp** edges → depth composite → **desaturate + img2img ~0.8** to reach the locked pen-flow LAST
- **pose stays firm & scales up with denoise** (0.85/end 0.9 held the hero's facing)
- **RunPod backend** — `pod_backend` (local|pod transport) + `pose_pod_orchestrator` (SDXL + xinsir openpose CN, gate, **always-terminate**, leak-fixed: recover-by-name on flaky 500)
Captured in [[Frame Designer]] field notes (2026-06-22 + 2026-06-23, on main). Scripts: `proofs/new-story/`.

## Deferred threads (not blocking the animatic)
- **Two-figure / contact shots done right** (if a literal kiss/embrace is ever needed): author the pose in **Blender** (two rigs) → OpenPose + depth + **regional/Couple conditioning** — the converging standard practice. (Today we *reframed* past it.)
- **Crowd in shot 05** erodes at high denoise (un-anchored) → **depth ControlNet** to anchor the scene.
- **01/03/04** are early/looser passes — level to 05's fidelity for a uniform storyboard if desired.
- **"Reframe the hard shot"** technique (Loudon's 06 move) — offered for the Frame Designer field notes, not yet written.

## On pickup
1. State the move back: sequence the 6 boards into a song-pinned animatic.
2. Get the **song** from Loudon (the spine) — read its tempo + section map; that drives the timing.
3. All online resources are **spun down** (no pods, local ComfyUI off). Re-launch a pod only when rendering is needed (`pose_pod_orchestrator.py`); it always terminates.
4. Delete this baton once the animatic move is underway (git is the archive).
