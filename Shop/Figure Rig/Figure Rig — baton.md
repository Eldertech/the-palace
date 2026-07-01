---
title: "Figure Rig — baton"
born: 2026-07-01
links:
  - target: "[[Figure Rig]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress move on [[Figure Rig]] across a session boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
session_thread: "2026-06-30 → 07-01 rig-hardening session (bodies → IK → hands → faces → eyes)"
---

# Baton: Figure Rig

## Move
The character rig is **built and verified**; run the **face + hands gen-AI matrices on RunPod** with the finalized rig, then **rebuild the visual deposit** — and only then move to the queued next-steps (objects-via-proxy, multi-figure).

## Why this move matters
Every upstream piece is done and committed (body+IK, expressions, hands, depth, guide-choice, and the eyes — which took the most iteration). The remaining work is *cheap and mechanical*: the two RunPod batches cost ~$0.15–0.20 total and ~10 min each, and `build_deposit.py` already exists. What's been blocking is **not** the rig — it's RunPod pod-boot flakiness (three failed matrix attempts) and the fact that the eye construction kept changing under Loudon's eye, which kept invalidating the face plates. Both are now resolved: the eyes are final, and the plates are freshly re-rendered.

## Tried and rejected (the negative space — don't re-explore)
- **Eyes — four wrong turns before the right one:** (1) proxy sclera+iris *spheres* at a fixed offset → drifted per body type; (2) real MHCLO eyes but a **protruding dark iris ball** → Loudon: "not how eyes look"; (3) UV **texture** on the eyeball (correct realtime standard) → *invisible in Solid viewport* (textures need Material-Preview/Rendered); (4) **flat iris/pupil disks** → visible in Solid but "not perfectly oriented" on the curved cornea. **Final (keep):** iris/pupil as **material zones on the eyeball's own subdivided front faces** — conforms to the sphere, oriented by construction, Solid-visible via `diffuse_color`, rotates with gaze.
- **Guide for the gen-AI:** feeding canny the **flat ink** line → hollow eyes / front-back lost. **Winner:** canny from the **shaded** render (form). Full experiment committed (be7be36).
- **Depth plate:** measuring the **whole body** → closeup head/hand flattened to ~10% of the ramp. **Fix:** measure only **in-frame** verts (evaluated mesh).
- **Gaze control as an Empty** → only movable in Object Mode. **Fix:** an `eye_target` **control bone** (Pose-Mode grab-able).
- **Keep-alive idle pod** → ComfyUI crashes after ~20 min idle (volume-free image), uploads 404. **Rule:** boot → run the whole batch → auto-teardown; never leave a pod idle.
- **Gender convention:** MPFB `macro.json` is `0.0 = female, 1.0 = male` (I had it inverted early).

## Current state
- **All committed** on `feature/figure-rig-mpfb` (worktree). Last: `ce90a5f`. Rig arc is the last ~13 commits.
- **Face plates:** just re-rendered with the final material-zone eyes — 20/20 in `renders/faces-rig/<label>/` (ink · shaded · color · depth · openpose · keypoints). *These are tracked-and-modified right now — commit them with this baton.*
- **Hand plates:** 20 sets in `renders/hands/<key>/` (ink · shaded · color · depth · openpose), batch already set to shaded→canny+depth.
- **The gen-AI matrix has NEVER completed cleanly** — 3 pod-boot failures (one crashed-after-idle, one ready-timeout, one interrupted at 38/60). Raw gen PNGs are gitignored; the HTML deposit embeds them.
- **Studio:** `figure_face_studio.blend` (open in Loudon's Blender) — Rigify IK + material-zone eyes + `eye_target` bone + 14 `EX:` expression sliders. `figure_rig_studio.blend` = the body/pose studio.
- **Deposit:** markdown answers done (`Shop/Figure Rig/Figure Rig — conditioning stack and scene expansion.md`); `figure_rig_deposit.html` (via `build_deposit.py`) needs a regen once the matrices land — Loudon's standing requirement: **every render matrix shown with its Blender guidance passes (openpose · depth · shaded)**.

## Next move
1. Commit the re-rendered face plates (they're modified now). 2. Boot **one** pod and run **both** `batch_faces_pod.py` and `batch_hands_pod.py` (via `pose_pod_orchestrator.py`, `POD_CANNY=1`, no `--keep-alive`); tear down + **sweep `/v1/pods`** after. 3. `python3 build_deposit.py` → `figure_rig_deposit.html`; verify every matrix shows its guidance passes. 4. Commit. Then pick up **task #21** (hands+objects: Blender **proxy shapes** greyboxed into shaded+depth, tagged by color-ID → replaced via prompt-region or separate-pass composite) and multi-figure scenes — both specced in the conditioning-stack markdown §5–6.

## Receiving environment
Same surface (Claude Code, Mac). **Worktree:** branch `feature/figure-rig-mpfb`, dir `/Users/loudonstearns/Documents/palace-feature-figure-rig-mpfb`, profile `blueline`. If torn down: `node _ops/worktree/new-worktree.mjs --name feature/figure-rig-mpfb --profile blueline`. **GPU:** RunPod via `pose_pod_orchestrator.py` in `Projects/BLUELINE/proofs/new-story/`; key at `RunPod Images/studio/config.json`. Pod-boot is flaky — expect a retry; if a run is interrupted, **sweep `/v1/pods` and terminate strays** (the `finally` teardown doesn't run when the process is killed). Local ComfyUI at `:8188` has SDXL + the 3 SDXL ControlNets as a slow fallback (~25 min/frame). **Blender 5.1.2**; **MPFB2 v2.0.17** installed at `~/Library/Application Support/Blender/5.1/extensions/user_default/mpfb` (`Bone.select` is EditBone-only in 5.1; don't use `--factory-startup` — it disables MPFB).

## Calibrations from this session
- Eyes must **look right AND be manipulable in the plain Solid view** (not just render) — geometry/material over texture for anything Loudon inspects while posing.
- Every fix must **track all body macros** (age/weight/gender/muscle) — tie offsets to eye radius, never fixed mm.
- Show comparison renders (front/3-4/**profile**) when judging face geometry — the profile caught the bulge the numbers missed.
- Deposit galleries: **always** pair gen renders with their Blender guidance passes.
- Balanced gender in any generated crowd; hand-drawn/printmaking aesthetic, not CGI (standing prefs, already in memory).

## Load these files first
1. `Shop/Figure Rig.md` (the entry) + `Shop/Figure Rig/Figure Rig — conditioning stack and scene expansion.md` (the answers/plans).
2. `Projects/BLUELINE/proofs/blender-handdrawn/followups/rig-openpose/faces_rig.py` (eyes = `add_real_eyes`, depth = `subject_depth_range`, expressions, landmarks) and `figure_face_studio.py`.
3. `batch_faces_pod.py`, `batch_hands_pod.py`, `build_deposit.py`, and `../new-story/pose_pod_orchestrator.py`.
4. `Projects/BLUELINE/BLUELINE.md` + `Frame Designer.md` for where this feeds the larger project.

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
*Identical in every baton. It rides along because the catching Claude loads the
baton and the entry, not this ceremony — so the catcher's obligations live where
the catcher will see them. Omit nothing here.*
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive Step 6 relies on.
3. Mark it caught: remove the "Active Baton" section from the parent entry; for a board-announced baton with no parent entry, post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id) instead.
4. Delete the baton file (git is its archive). On a surface that can't delete (Cowork), remove the marker and note "deletion pending."
5. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — for a worktree, check `git worktree list` and recreate it (`node _ops/worktree/new-worktree.mjs --name <branch> --profile <p>`) if it is gone. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
6. Act on the move, holding the calibrations above. Steward batons are the exception — updated in place, never deleted.
