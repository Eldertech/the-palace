---
title: test-plan
born: 2026-06-13
links:
  - { target: "[[Blender]]", type: connects-to, label: test-plan-for }
forward_vector: "I hold the Smoke / Capability / Style / Edge / Speed / Determinism probes for the Blender Specialist's conditioning-keystone job so each claim can be re-run and re-confirmed."
---

# Blender — Test Plan

> Shop Specialist test plan, instantiated from `_TEMPLATE/test-plan.md`. Blender's load-bearing
> Shop job is **the conditioning keystone**: a posed 3D scene → clean, registered multi-ControlNet
> passes that a render-AI fills ([[Blocked, Not Prompted]]). The probes below center on that, plus
> the blocking/render fundamentals. The reference host is the Mac (Apple Silicon, MPS, 32 GB unified).

Last run: **2026-06-13** — Session 1 of the BLUELINE Claude Code job. Posed one humanoid (worm's-eye
3/4 foreshortened lunge), emitted six conditioning passes, ran the two-pass SDXL multi-ControlNet
graph + the prompt-only control. Result one-liner is filled in the §Smoke/Capability/Determinism
blocks below; full narrative + gotchas in `gotchas-2026-06-13.md`.

## Smoke
The cheapest "did it produce anything valid at all" check: Blender opens headless and writes a
non-empty render from a scripted scene.
- **Automated:** `blender --background --python blocking/pose_and_emit.py` exits 0 and writes
  `passes/rgb.png` with non-zero, non-uniform pixels (a figure on black).
- **Last run (2026-06-13):** PASS — `rgb.png`, `depth.png`, `normal.png`, `pose_keypoints.json`,
  and `dramatic-lunge.blend` all written by Blender 5.1.2 on MPS in ~8 s total.

## Capability Probe
Walk the Specialist's Capabilities and assert one concrete output per claim relevant to the
conditioning job:

| Capability claim | Probe | Last run (2026-06-13) |
|---|---|---|
| Humanoid posing / blocking | a posed figure renders as a legible humanoid silhouette | PASS — fused-metaball mannequin, dramatic lunge reads |
| Camera authorship (worm's-eye, foreshortened, OTS) | auto-fit low 3/4 camera frames the figure | PASS — `cam_lens_mm`/framing captured in `pose_keypoints.json` |
| Depth pass | camera-Z grayscale, near=white→far=black, auto-ranged | PASS — `depth.png`, front/back limb ordering visible |
| Normal pass | camera-space normal map | PASS — `normal.png` |
| OpenPose pass (geometric, exact) | projected COCO-18 → canonical skeleton | PASS — `openpose.png`, registered to frame |
| Edge channel (canny / lineart) | edges from the clay render | PASS canny; lineart = XDoG stand-in (see Gap) |
| Multi-ControlNet fill (one CN per channel) | pose+depth+canny → SDXL fill → 1.5× refine | PASS — `blocked_sdxl_refined.png`; drama survives, front-on default defeated vs control |
| Hand-editable handoff | the `.blend` opens with a poseable armature | PASS — armature `Mannequin_Rig` present; re-pose→re-run loop |

**Gap surfaced:** SDXL has no strong standalone *lineart* ControlNet at this date (xinsir ships
pose/depth/canny). `canny` carries the edge channel; `lineart.png` is emitted as an artifact only.

## Style Probe
Blender's "style" here is **registration fidelity**, not palette: every pass must describe the same
framed view so the ControlNets agree. Probe: overlay any two passes — silhouettes coincide.
- **Manual/Automated:** all passes are emitted from one camera in one script run at identical
  resolution (832×1216), so registration is structural. Eye-check confirms openpose/depth/normal
  share the figure's outline.
- **Last run (2026-06-13):** PASS — all passes 832×1216, single-camera, co-registered.

## Edge Probe
Failure modes fail loud, never silently:
- **Bad pose / joint out of frame:** `world_to_camera_view` flags it (`in_view` → confidence 0.3 in
  `pose_keypoints.json`); the OpenPose drawer skips low-confidence joints rather than drawing garbage.
- **Empty/black render** (no geometry, bad camera): Smoke's non-uniform-pixels check catches it.
- **Depth range clipping:** depth near/far is auto-derived from joint distances; logged in JSON.
- **Last run (2026-06-13):** all 18 joints in-view (conf 1.0); no clipping.

## Speed Bench
Reference host: **mac (MPS, 32 GB unified)**.
- **Pose + 3 Blender passes + .blend (Sketch greybox):** ~8 s wall-clock (EEVEE).
- **SDXL fill (768×1024, 28 steps, 3 ControlNets):** ~15–18 s/it on MPS (incl. one-time model +
  3×ControlNet load). **NB:** default smart-memory thrashed at ~50 s/it — fixed with
  `--highvram --use-split-cross-attention`. See `gotchas-2026-06-13.md`.
- **1.5× img2img refine (1152×1536, 15 steps, no CN):** folded into the 555 s two-pass total.
- **Blocked two-pass total: ~555 s (~9 min).** Warm plain SDXL (no CN): ~78 s for 28 steps.

## Determinism (reproducibility artifact)
Blender geometry/passes are **deterministic** (scripted scene + fixed camera → identical PNGs).
The ComfyUI fill is deterministic given (fixed seed, sampler, checkpoint, workflow JSON) — the
reproducibility artifact is `blocking/pose_and_emit.py` + `blocking/draw_passes.py` +
`workflows/*.json` (the exact graphs) + the SDXL checkpoint identity, not the image bytes.
- **Reproducibility artifact:** `blocking/` scripts + `workflows/blocked-two-pass.json` + seed 7.
- **Last run (2026-06-13):** scripts + workflow JSON archived; re-runnable while the server is up.
