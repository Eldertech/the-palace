---
title: "BLUELINE — baton"
born: 2026-07-04
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: baton-for
forward_vector: "I carry the live move on BLUELINE's Aftermath Frame tool — from a working outline generator toward a swoosh that actually LEADS and gen-AI frames — across to a fresh Claude, waiting to be caught and deleted once the move is picked up."
---

# Baton: BLUELINE — the Aftermath Frame tool → a leading guide + gen-AI frames

## Move
The Aftermath Frame solver is now a **tool** (`proofs/session-11-outline/impact_tool.py`): one authored
ACTION → derived physics → an outline-inked frame + a manipulable `.blend`, with a named parameter
surface Loudon can steer. **The move now:** make the single-sweep flow guide actually **LEAD** the frame
(it is faint today), then carry the outline into the **gen-AI second pass** — the real target is
*consistent, beautiful gen-AI action frames*, outline as the fast-feedback seed a diffusion model layers on.

## Why this move matters
Loudon's stated goal is "**get the flow right — a strong single guide gen-AI can distinguish**." We shipped
the single-sweep arc (it replaced the vertical 5-line fan) and locked the debris look to his taste
(follow-arc, thinned, so the guide leads). But at the current default `guide-w 0.14` the swoosh reads
**faint** — it does not yet lead. That gap is the top of this baton: the guide is the spine of the whole
approach, and it isn't pulling its weight.

## Current state
- **The tool:** `impact_tool.py` — `--action chop|side|rising`, `--punch 0..1`, `--preset grounded|heroic|super`,
  `--spray arc|out`, `--density`, `--guide-w`, `--style outline|greybox`, `--plates 0|1`, `--save`, `--render`.
  Locked frame-5 defaults: `spray=arc · density=0.45 · punch=0.6 · guide-w=0.14`. Named Blender collections
  (FIGURE/BLADE/TARGET/WOUND/DEBRIS/GUIDE) so the saved `.blend` is hand-manipulable. Saves the `.blend`
  **before** the flat-white render override touches materials.
- **Proven:** only the `chop` action, outline style, on the studio rig. `out/tool/chop.blend` + `chop_outline.png`.
- **The look call:** frame 5 (follow-arc, thinned) — recorded in memory `feedback_blueline_aftermath_debris.md`
  and reproduced by `out/debris/d5_arc_thin.png`. The `contact_sheet.png`s show the range that got there.
- **Not yet:** a guide that LEADS · `side`/`rising` tested · conditioning plates · any gen-AI pass.

## Tried and rejected (this session — don't re-walk)
- **Vertical 5-line speed fan** → replaced by ONE arc-following swoosh (reads as the swing, not as streaks).
- **Sampling the guide arc by `u`** → bunched near windup (the `u^2.5` accel); use **angle-uniform**
  `guide_dir(a)` — the guide shows the PATH, not the speed profile.
- **Guide at radius 1.24×Rc** → floated *above* the swing, invisible against debris; hug the blade at
  `R_CEN≈1.0` (Rc). Diagnosed with the `--diag` red-isolation mode in `single_sweep.py`.
- **Swoosh-only variation sweep** → barely moved the frame; **debris dominates** the composition, so vary
  the debris axis (`spray`/`punch`/`density`), not the guide, when exploring looks.
- **Physical fidelity (Cell-Fracture, forward dynamics)** → still the WRONG direction. Keep the 3D model
  simple + FAST to iterate; amplify only the *consequences*, never the motion.

## Next move
1. **Make the guide LEAD.** Bump `guide-w` default (try 0.24 → 0.32) and re-judge against `d5_arc_thin`;
   possibly also darken/thicken the Freestyle weight on the GUIDE collection alone, or give it a second
   offset rail. Render → show Loudon → adjust. This is the spine; do it first.
2. **Task 4 — conditioning plates.** Emit depth / geometric OpenPose (armature-projected — **never**
   DWPose-on-greybox) / canny from the same scene (`--plates 1` is stubbed). These feed the render backend.
3. **The gen-AI second pass.** Take the outline + plates into [[BLUELINE — Render Backend]] /
   [[Steer the Generator]] (rich-first/stylize-last) and get *one* consistent, beautiful gen-AI aftermath
   frame. **The gen-AI render is RunPod and costs money — quote first, never fire a pod autonomously.**
4. Test `side` and `rising` through the tool once the guide is right.

## Receiving environment
Same surface (Claude Code, Mac). **This baton and all the session-11 work now live on `main`** —
the `feature/blueline-aftermath` worktree was merged and torn down (2026-07-04). Catch this from the
palace root `/Users/loudonstearns/Documents/The Palace`; if you want isolation for a GPU/Blender build,
branch a fresh worktree from `main`: `node _ops/worktree/new-worktree.mjs --name feature/blueline-<slug>
--profile blueline`. Blender **5.1.2** local for the solver (no GPU rent); studio blends need **MPFB2 +
Rigify** (installed). RunPod orchestrators + the Commons reaper exist (`_ops/commons`,
`_ops/runpod/agent_ns.py`) — but **quote before any paid pod**.

## Calibrations from this session
- **Loudon steers by looking at renders.** Show a range full-size, let him pick, *then* build around the
  pick. Don't accept a terse pick until you're sure he understood the question — he reversed "2"→"5" once
  the frames were shown full-size and re-explained. The informed, full-size pick is the real signal.
- **The look is settled: follow-arc debris, thinned, guide leading.** Not outward-splash, not a dense
  cloud. `punch` is the one energy dial (toward 1.0 only for a deliberate super-hit). Confirm before
  shipping any dense/splash look.
- **Motion real, consequences super-physical.** Never amplify the motion.
- **The target is consistent + beautiful gen-AI frames.** The outline is the fast seed, not the deliverable.

## Load these files first
1. `Projects/BLUELINE/proofs/session-11-outline/impact_tool.py` — the tool (this baton's subject).
2. `Projects/BLUELINE/proofs/session-11-outline/{single_sweep.py, debris_spread.py}` — the guide + debris
   prototypes the tool was distilled from (and `--diag` mode for guide placement).
3. memory `feedback_blueline_aftermath_debris.md` — the look call, in Loudon's words.
4. `The Aftermath Frame.md` — the concept + method.
5. `Projects/BLUELINE/BLUELINE — Motion and Flow.md` — the motion subsystem + the aftermath §.
6. `Steer the Generator.md` + `Projects/BLUELINE/BLUELINE — Render Backend.md` — the gen-AI target.

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. If this baton or its board line is still uncommitted, commit them first (that commit is the archive).
3. Mark it caught: remove the "Active Baton" section from `BLUELINE.md` (and post the paired
   `handoff_picked_up` REPLY to the board line on the owner's persistent board).
4. Delete the baton file (git is its archive).
5. If the baton names a receiving-surface capability delta or worktree coordinate, confirm it holds.
6. Act on the move, holding the calibrations above.
