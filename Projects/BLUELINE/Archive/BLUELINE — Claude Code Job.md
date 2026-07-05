---
title: "BLUELINE — Claude Code Job"
born: 2026-06-13
forward_vector: "I am a multi-session engineering job for a Mac-side Claude Code agent: prove or kill the technical workflows BLUELINE depends on, connect the services, and write back to the palace which tools earned their entry. I lead with capability, compare many solutions, and leave gotcha-grade reports so the Shop stocks only what works."
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: technical-spike-job-for
  - target: "[[BLUELINE — Deposit Map]]"
    type: connects-to
    label: proves-the-candidates-in
  - target: "[[The Shop]]"
    type: connects-to
    label: stocks-survivors-into
---

# BLUELINE — Claude Code Job

> **SUPERSEDED 2026-06-14 by [[BLUELINE — Production Plan]].** Sessions 1 (conditioning keystone) and 3 (flow-field spine) ran and proved out; their results live in [[Shop/Blender/toyxyz-conditioning-recipe]] and [[The Flow Field is the Spine]]. The remaining sessions are folded into the parallel-track Production Plan, which reframes the work as palace substrate. Kept as the record of the original single-thread spike and its done sessions.

**For:** a Mac-side Claude Code session (GPU available, normal git — the Cowork lock restriction does not apply).
**Goal:** over a few sessions, stand up and stress-test BLUELINE's technical pipeline end to end at small scale, **comparing multiple solutions at every fork**, and write back to the palace which tools earned a Shop entry and which were killed.
**Posture:** [[Capability-first prototyping]] — start at maximum model/tool capability, prove the behavior, *then* note where it could optimize down. Don't pre-optimize a workflow that hasn't worked once.

## Standing constraints

- **Animal motion is OUT of scope.** Humanoid only. Do not test quadruped posing, SMAL, or animal locomotion. If a tool's animal features come up, note and move on.
- **Blender is the primary blocking surface** and a first-class requirement, not a fallback — Loudon wants a familiar, detailed place to fine-tune blocking and movement by hand. Every staging path must be able to **hand off to a hand-editable Blender scene**. But Blender is not the *only* candidate for any given stage — test and compare alternatives (Three.js blocking, MCP-driven staging) and report honestly where each wins.
- **Each session ships a real artifact + a written report.** No session is a down-payment on the next.
- **Write findings into the palace** using the existing Shop test structure: `Artifacts/Shop/<Tool>/tests/test-plan.md` + a dated gotcha report. Commit normally (Mac-side). Propose Specialist entries only for tools you actually made something real with — frugality is the bar.
- **ComfyUI already lives at `_tools/ComfyUI`.** Reuse it; don't reinstall.
- Keep every test **small** — one shot, a handful of frames. This job is about *connections and viability*, not production volume.

---

## Session 1 — The conditioning pipeline (the keystone)

**Question:** can a posed 3D scene reliably become clean multi-ControlNet conditioning, and does "blocked, not prompted" actually defeat the front-on default?

**Do:**
1. Install/verify the **toyxyz "Character bones that look like OpenPose for Blender"** rig (or equivalent). Pose one humanoid in a dramatic, foreshortened, *non-front-on* stance.
2. Emit the conditioning passes from that one posed scene: **OpenPose** (and **DWPose** for comparison), **depth**, **normal**, **canny**, **lineart**.
3. Build the ComfyUI **two-pass multi-ControlNet** graph: lineart/pose/depth stack → fill → 1.5× img2img refine. One preprocessor + one ControlNet per channel (do not mix channels into one model).
4. Compare **SDXL** vs **FLUX ControlNet** for conditioning fidelity at this date.
5. **Control test:** generate the same subject prompt-only (no conditioning). Confirm the blocked version breaks the centered front-on portrait and the prompt-only version doesn't.

**Ship:** one posed Blender scene + its passes + 3–4 rendered frames (blocked vs prompt-only, SDXL vs FLUX).
**Acceptance:** the drama of the pose survives into the render; identity/structure tracks the proxy; the front-on default is visibly defeated.
**Write back:** `Artifacts/Shop/Blender/tests/` + ComfyUI gotcha update. Recommend SDXL-vs-FLUX default and OpenPose-vs-DWPose default with evidence.

---

## Session 2 — The staging-AI bake-off (language → editable scene)

**Question:** which path most reliably turns a sentence into an *editable* blocked scene (camera + humanoid locomotion + pose + environment), and does it hand off cleanly to Blender for manual tuning?

**Test sentence (the canonical decompose):** *"over the shoulder of our hero running, sword drawn, the full urban alleyway rushing by."*

**Prior (Loudon's bet, 2026-06-13):** go in expecting **Blender-MCP to win (#1)**, with **SceneCraft a close #2**. Blender-MCP is favored because it drives the Blender scene directly — landing in Loudon's familiar, hand-editable surface is exactly the win condition. Test the prior honestly; report if it's upset.

**Compare three paths on the same sentence:**
1. **Blender MCP** *(favored)* — LLM drives Blender directly over the MCP bridge (integrates with Claude); result is already a hand-editable `.blend`.
2. **SceneCraft pattern** *(close #2)* — LLM → Blender-Python → scene-graph → numerical constraints → assets.
3. **Bespoke Three.js stager** *(challenger)* — LLM → structured JSON staging spec → assembled Three.js scene, with a Blender export path.

For each: resolve **camera** (OTS — implement as a declarative-camera / on-screen-layout constraint solver, not absolute coords), **locomotion** (Mixamo run cycle), **pose blend** (sword-draw upper body over the run — test the blend/masking), **environment** (Cargo/Poly Haven alley receding to a vanishing point).

**Crucial:** for each path, verify the result lands as a **hand-editable Blender scene** Loudon can nudge. A staging path that can't hand off to Blender loses points.

**Ship:** the same shot staged three ways + a comparison table (reliability, editability, Blender-handoff quality, speed, cost).
**Acceptance:** at least one path produces a correctly-decomposed, hand-editable blocked scene from the sentence; the boundary-flagging behavior (what it refuses/flags vs fakes) is observed.
**Write back:** recommend the **staging-AI primary** with evidence; the losers become gotcha notes, not entries. Resolve Deposit-Map open decision #4.

---

## Session 3 — The flow-field spine spike (the #1 risk, the novel bet)

**Question:** does **one authored field** truly serve all three resolutions of reality, or does each leg need its own transfer function on top of a shared source?

**Do:**
1. Author one vector field (p5.js/GLSL or Three.js). Render its three resolutions **from the same source**:
   - **Drawn** — graphic speed lines (comic register).
   - **Steers** — dense per-frame motion vectors as render conditioning. Wire this leg into **Go-with-the-Flow** (warped-noise / optical-flow motion control — the published precedent) and confirm the field drives camera + object motion.
   - **Simulated** — particle/fluid velocity input. Test both forks: **real-time GPU particles in Three.js** vs **offline Blender/Houdini**. Decide the sim engine here.
2. Honestly test the **strong claim** (one untouched field) vs the **likely-true claim** (shared source + per-leg mapping). Design the test to *falsify* the strong version.

**Ship:** one field → three rendered resolutions, side by side, plus the sim-engine decision.
**Acceptance:** the single-source coupling holds in at least the shared-source-plus-mapping form; document exactly how much per-leg authoring was needed.
**Write back:** propose `Shop/Go-with-the-Flow` if it earned it; draft the `flow-field-spine` workflow doc; resolve the sim-engine fork.

---

## Session 4 — Composite-unity + hyperreal-seam spikes (look-ahead, optional this round)

**Question:** do a sim dust pass and a diffusion skin frame read as **one photograph** (light, grain, DoF, color)? Does identity survive the comic→hyperreal style jump?

**Do (small):**
1. **Composite-unity:** one sim medium pass + one diffusion skin frame → composite. Judge as a single image.
2. **Hyperreal-seam:** one comic keyframe → hi-fi render at max exotic dial. Does the same face read across the two registers (IP-Adapter / reference / LoRA spanning both)?

**Ship:** one composited frame + one comic↔hyperreal pair.
**Acceptance:** evidence on whether composite unity is controllable and whether identity survives — or a clear "accept a heightened self" verdict.
**Write back:** notes toward M3/M4; do not over-build — this is reconnaissance.

---

## Cross-session deliverable — the tool-decision report

At job end, produce **`BLUELINE — Tool Decisions.md`** in the bundle answering, with evidence:

- **Staging-AI primary:** Blender-MCP (favored) vs SceneCraft vs bespoke Three.js — winner + why; explicitly state whether Loudon's Blender-MCP-first prior held.
- **Base model:** SDXL vs FLUX for conditioning quality, at this date.
- **Pose tooling:** Mixamo + hand-pose in Blender vs **Cascadeur** for dramatic humanoid posing.
- **Sim engine:** real-time Three.js GPU particles vs offline Blender/Houdini.
- **Preprocessor:** OpenPose vs DWPose default.
- **Which Specialists to deposit** (only proven ones) and which candidates were killed.
- **The single-source flow-field verdict** — strong claim, weak claim, or refuted.

This report resolves the Deposit Map's open decisions and tells Cowork exactly which Stage-0 tools are real. **Production code (M0) does not begin until this report exists.**

---

## What stays in Cowork (do not do here)

Don't build the authoring UI, the timeline, the faithful↔exotic dial, the interaction storyboards, or the lookbook *curation* — those are Cowork Stage-0 artifacts under the [[Loudon Live Design System]]. This job is the **service connections and technical viability** only: prove the plumbing, pick the tools, hand the verdict back.
