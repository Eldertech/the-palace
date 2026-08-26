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
*Identical in every baton. It rides along because the catching Claude loads the
baton and the entry, not this ceremony — so the catcher's obligations live where
the catcher will see them. Omit nothing here.*
A pickup has two beats: **claim** it when you catch it, **close** it when the move lands. The card stays visible in between — a claim that ages with no close is how a dropped baton (a "fumble") surfaces instead of vanishing. (A parent-entry baton that was never announced on the board has no card; skip the board posts — just remove the pointer and delete the file at close, step 8.)

**Catch it — claim:**
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. Check it may already be done before you commit to it. The baton is a snapshot from when it was written; the project may have moved past it. Re-read the parent entry and `git log` it since the baton's `born` date, and confirm the "Current state" the baton quotes still matches the file. For a board-announced baton, `node _ops/stigmergy/pickup-handoff.mjs <id>` prints exactly this reconciliation view — every commit that touched the entry since the baton posted — and then claims the card, so run it and read the list *before* you continue. If the move is already done, superseded, or no longer wanted, STOP — do not claim it; surface to Loudon, and if it plainly landed already, close it as a reconciler (step 7). A stale baton followed silently produces drift. (The auto-staleness heuristic is off by design — the freshness call is yours.)
3. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive step 8 relies on.
4. Claim it. For a board-announced baton (it shows in `list-handoffs`), the `pickup-handoff.mjs` from step 2 has already posted the claim (`handoff_picked_up`, `lifecycle: claim`) — the card moves to **CLAIMED (in flight)**; it does *not* leave the board. Leave the "Active Baton" pointer and the baton file in place for now — they come out at close, so a fumble mid-move never erases the work.
5. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — for a worktree, check `git worktree list` and recreate it (`node _ops/worktree/new-worktree.mjs --name <branch> --profile <p>`) if it is gone. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
6. Act on the move, holding the calibrations above.

**Close it — when the move lands:**
7. Post the close. `node _ops/stigmergy/close-handoff.mjs <id | entry> --commit <hash>` retires the card — an explicit close is the *only* thing that clears it (done is never inferred). Cite the commit that landed the move: it makes the close a checkable claim, not a self-report. **Complete, or re-baton the rest:** if you finished the whole move, close plain; if you did only part, `--partial --remainder "<what's left>"` posts the leftover as a fresh `handoff_ready` so it reappears as open work. Never let "in the spirit of the original" quietly drop scope — a gap becomes a new baton, not silence.
8. Delete the baton file (git is its archive) and remove the "Active Baton" section from the parent entry. On a surface that can't delete (Cowork), remove the pointer and note "deletion pending." Steward batons are the exception — updated in place, never deleted or closed.
