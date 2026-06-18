---
title: "BLUELINE — baton"
born: 2026-06-18
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: baton-for
forward_vector: "I carry the in-progress M3 render across a session boundary — the whole flow-warped-noise pipeline is built and locally verified; I wait for the next Claude to run the live GPU render and the consistency-ruler verdict, then I am deleted."
session_thread: "Mac-side 2026-06-18 — M3 Path B scaffold + inject node, all local prep verified; render is the only step left. Work is on the feature/blueline-m3 worktree."
---

# Baton: BLUELINE — M3 flow-warped noise, render-ready

## Move
Run the **M3 live render**: (1) a free local SDXL graph check that the noise injection works (inject-same → identical, inject-warped → different); (2) the **RunPod FLUX-ControlNet render** of three frames — A, B·seed-lock (`N_A`), B·warped (`N_warped`); (3) the **consistency ruler** verdict — does flow-warped noise hold the look at the 482 px delta where seed-lock breaks? Everything up to the render is built and verified.

## Why this move matters
The real test of M3 / coherence-stack step 4 ([[The Flow Field is the Spine]] reaching the render). Track V proved seed-lock holds a *small* delta (palette 0.94 vs 0.17); M3 asks if **warped noise** holds a *large* one. Loudon greenlit the RunPod spend (~$0.30).

## Tried and rejected (this session)
- **Path A (CogVideoX + kijai/ComfyUI-VideoNoiseWarp)** — rejected: a *video* model owns the motion, off-thesis ("staged, not simulated"). A future video-native sibling, not BLUELINE. **Stay Path B.**
- **Inject via plain `KSampler` seed** — impossible; KSampler makes noise internally. Path is `SamplerCustomAdvanced` + the custom `NoiseFromNPY` node (built + unit-tested here).
- **Verifying the full render locally on FLUX** — the Mac has SDXL only; local check uses SDXL (mechanism), real FLUX render is on the pod.

## Current state (on disk, branch feature/blueline-m3; commits dfad3fb → fef576f)
All in `Projects/BLUELINE/proofs/m3-warped-noise/`:
- `pair.py` + `passes/{A_coil,B_leap}_{rgb,depth,keypoints,openpose}` — large-delta pair (**482 px** A→B), one shared camera, OpenPose drawn.
- `warp_demo.py` + `N_A.npy`, `N_warped.npy` (16×152×104 FLUX latent, both ~N(0,1)), `flow_latent.npy`, `warp-proof.png` — latent warp, verified.
- `comfy_inject_node.py` — the `NoiseFromNPY` node. **Unit-tested**: loads `N_A.npy` → returns exactly `(1,16,152,104)`, values match; warp preserved (0.80 diff). NOT yet wired into a SamplerCustomAdvanced graph.
- `README.md` — experiment design + status.

## Next move
**First** the local SDXL check (Mac ComfyUI has `sd_xl_base_1.0` + `controlnet-openpose-sdxl`): make a 4-ch noise + its warp (reuse `flow_latent.npy`), wire `NoiseFromNPY` into a `SamplerCustomAdvanced`+SDXL+openpose graph, confirm inject-same→identical / warped→different. **Then** the pod: extend `Shop/RunPod GPU Backend/flux-controlnet-openpose.workflow.json` (KSampler+seed → SamplerCustomAdvanced / KSamplerSelect / BasicScheduler / BasicGuider / NoiseFromNPY), stand up the pod (Track I Phase B recipe), copy `comfy_inject_node.py` into the pod `custom_nodes`, upload the openpose + the two `.npy`, render A / B-seedlock / B-warped, retrieve, **terminate**. Score with `render-backend/consistency_ruler.py` on (A,B-seedlock) vs (A,B-warped). Write `m3-warped-noise/m3-report.md`.

## Receiving environment (cross-worktree + cloud)
- **Worktree:** branch `feature/blueline-m3` · dir `/Users/loudonstearns/Documents/palace-feature-blueline-m3` · profile `blueline`. Recreate if gone: `node _ops/worktree/new-worktree.mjs --name feature/blueline-m3 --profile blueline --memory`. Commit M3 there; merge to `main` when the rung ships.
- **RunPod:** parked (0 pods; `palace-flux` serverless `workersMax=0`). Key in `RunPod Images/studio/config.json` (gitignored; symlinked per profile). Volume `blueline-models` (`aqm8oev4b0`) holds FLUX-ControlNet-Union. Stand up per Track I Phase B; **terminate after**.
- **Local ComfyUI:** `_tools/ComfyUI` (symlinked), SDXL + SDXL CNs; venv `_tools/ComfyUI/venv/bin/python`. Multi-CN on MPS wants `--highvram --use-split-cross-attention` (memory `reference_comfyui_mps_controlnet`).

## Calibrations from this session
- **Verify locally before the pod spend** (Loudon's call) — prove the inject path on SDXL, then spend.
- The **commit-msg hook** annotates every commit "non-spec — not blocked"; it's a linter, ignore it for proof commits.
- **Verify branch before/after every commit** — shared tree thrashes; other agents' worktrees (`palace-entry-agent`, `weave-proposals-e2e`) exist — leave them.
- **The whole post-M2 arc is already on `main`** (M2 motion comic + beat-test; live-clock + lyrics specs; Specialists-and-Seams; Blender gallery; staging-skeleton module + its wiring into the M2 player AND the bench Python; Seam-A round-trip 17/3/0). M3 is the only open rung.

## Load these files first
1. `Projects/BLUELINE/proofs/m3-warped-noise/README.md` + this baton.
2. `comfy_inject_node.py`, `warp_demo.py`, `pair.py`.
3. `render-backend/track-I-report.md` (pod recipe, Phase B) + `Shop/RunPod GPU Backend/pod-comfyui-client.py` + `flux-controlnet-openpose.workflow.json`.
4. `Projects/BLUELINE/proofs/track-V-motion/track-V-report.md` (the coherence stack + seed-lock baseline).

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. If this baton or its board line is still uncommitted, commit them first.
3. Mark it caught: remove the "Active Baton" section from `BLUELINE.md`; post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id).
4. Delete this baton file (git is its archive).
5. Confirm the worktree coordinate holds (`git worktree list`); recreate if gone. A build that should run here but can't is a finding to report, not to hide.
6. Act on the move, holding the calibrations above.
