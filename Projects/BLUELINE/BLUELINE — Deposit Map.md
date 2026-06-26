---
title: "BLUELINE — Deposit Map"
type: meta
status: proposal
born: 2026-06-13
who_leads: loudon
forward_vector: "I am the staging ground for BLUELINE's entry into the palace — the list of entries, Specialists, and skills the project needs and the typed links between them. I am not canon yet; I am the show-before-writing for a deposit that has not happened. Approve me, prune me, then I become real entries."
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: deposit-plan-for
  - target: "[[The Shop]]"
    type: connects-to
    label: stocks-from
  - target: "[[Retrospective Delay]]"
    type: mirrors
    label: sibling-visual-music-pipeline
tags: [meta, deposit-map, proposal, blueline]
---

# BLUELINE — Deposit Map

> **Status: PROPOSAL. Nothing here is committed.** This is the show-before-writing for the BLUELINE deposit. Working title "BLUELINE" is a placeholder (per the brief) — rename before canon if a truer name arrives. Read, prune, confirm direction, *then* the entries get created and committed Mac-side through the Deposit Ceremony.

> **Scope change (2026-06-13):** **Animal motion is removed as a goal for now.** The pose & locomotion vocabulary is humanoid-only. Quadruped / animal proxies, SMAL, Cascadeur quadruped AutoPosing, PFERD — all explicitly out of scope until a later revival. This retires the project's single data-starved hard case by decision, the same move the brief already made for simulated contact.

---

## 0. The one-paragraph thesis (for the entry body)

BLUELINE is an opinionated instrument for bold, comic-staged, surreal-mathematical music-video action, built the way film is built: storyboard → animatic → final render, every frame pinned to a fixed-tempo song. Its novelty is **point of view and coupling**, not components — the research found that nearly every piece (the Blender→ControlNet conditioning pipeline, humanoid locomotion libraries, declarative camera control, procedural environments, LLM-to-scene staging, flow-guided motion diffusion, the ComfyUI multi-ControlNet render core) already exists off the shelf. What BLUELINE *authors* is the curated vocabulary, the single-source flow-field spine, and the comic↔cinema transduction. **The bias is the product; the components are adopted.**

---

## 1. The spine entry — `project`

**`BLUELINE`** (`Projects/BLUELINE/BLUELINE.md`)
- `type: project · pillars: [tools, creation, philosophy] · stage: seed · who_leads: loudon`
- Philosophy pillar earns its place: the comic↔cinema two-register move is McCloud-grade theory, not just plumbing.
- Bundle: `Projects/BLUELINE/` holding `BLUELINE — plan.md` (steward-materialized work state, à la Retrospective Delay), `stage-0/`, `proofs/`, this deposit map, and the Claude Code job.
- **Typed links (frontmatter):**
  - `mirrors` → [[Retrospective Delay]] · label `sibling-visual-music-pipeline`
  - `connects-to` → [[Flocking]] · label `flow-field-is-a-vector-field`
  - `connects-to` → [[The Shop]] · label `commissions-its-render-stack`
  - `enables` → [[Loudon Live]] · label `staged-presentable-content`
  - `connects-to` → [[Loudon Live Design System]] · label `mockup-base-spec`
  - `exemplifies` → [[Boundary-Crossing Instruments]]
  - `couples-with` → [[Autodidact Polymaths]] · label `learn-by-building-the-tool`

---

## 2. New Shop Specialists — `specialist`

These follow the established Specialist shape (charter / voice / capabilities / gotchas, `directed-by: Shop/Maker`, `tested-by: Artifacts/Shop/<name>/tests/`). **Already-stocked** Specialists BLUELINE reuses unchanged: **ComfyUI, FLUX (Hugging Face), Three.js, p5.js, ffmpeg, Remotion**. New entries to deposit:

| Proposed Specialist | `medium` | Wraps | Why it's a new entry |
|---|---|---|---|
| **`Shop/Blender`** ✅ **DEPOSITED** | image / 3d | blender (external) | The blocking surface + offline render + geometry-nodes environments. Loudon's familiar, detailed place to fine-tune blocking and movement by hand. GPU/Mac-resident. |
| **toyxyz conditioning** ✅ **DEPOSITED as a recipe** | image | toyxyz OpenPose-bones rig for Blender | The keystone: posed 3D → clean OpenPose/depth/normal/canny/lineart passes. **Decided: a recipe *inside* `Shop/Blender`** ([[Shop/Blender/toyxyz-conditioning-recipe]]), not its own Specialist — it's a way of using Blender, not a separate tool. |
| **`Shop/SceneCraft`** | 3d / staging | LLM→Blender-Python scene synthesis (SceneCraft pattern) | Staging-AI candidate: language → scene-graph → numerical constraints → assets. Evaluated against Blender-MCP and a bespoke Three.js stager. |
| **`Shop/KitBash3D Cargo`** | 3d-assets | Cargo asset manager (15k+ models, free) | Environment-kit source, one-click import. Pairs with Poly Haven (CC0) + Megascans. |
| **`Shop/Go-with-the-Flow`** | video / motion | flow-guided video diffusion (warped noise) | The motion-conditioning leg of the flow-field spine — already-published evidence the single field can drive camera + object motion. Render-AI, Mac/GPU. |

**Specialists to *evaluate but maybe not adopt* (decide during the Claude Code job, don't pre-deposit):**
- **Blender MCP** and **Three.js MCP** — staging-AI plumbing alternatives to SceneCraft. Adopt whichever wins the bake-off; the loser becomes a gotcha note, not an entry.
- **Cascadeur** — AI-assisted dramatic *humanoid* posing. Strong candidate for the held-extreme-pose problem; adopt if it beats hand-posing in Blender for the aesthetic. (Quadruped features now out of scope.)
- **DWPose** vs **OpenPose** preprocessor — a parameter choice inside the render recipe, not an entry.

> **Frugality note (Shopkeeper's bar):** propose entries only for tools we've actually *made something with*. Several rows above are candidates the Claude Code job will prove or kill — only survivors get deposited.

---

## 3. New skills — palace `.skill` capabilities

Skills are the agent-facing know-how. Existing relevant skills: **`ableton-extensions`** (Max for Live / Live API bridge), **`rnbo-codebox`**, **`project-stage-builder`**, **`the-substrate`**. Proposed new skills:

| Proposed skill | What it carries | Notes |
|---|---|---|
| **`blocked-not-prompted`** | The full conditioning workflow: pose a 3D scene → emit OpenPose/depth/normal/canny → multi-ControlNet fill in ComfyUI. One preprocessor + one ControlNet per channel (the field's hard-won rule). | The technical heart of M0→M1. Built *from* the Claude Code job's findings. |
| **`flow-field-spine`** | Author one vector field (p5/GLSL/Three.js) → render its three resolutions: drawn speed lines, dense motion vectors, particle/sim velocity. The single-source coupling. | Encodes the M3 spike result. Don't write until the spike proves the coupling holds. |
| **`comic-to-cinema`** | The two-register transduction: comic-default render recipe ↔ hyperreal-impact render recipe; identity across the style jump; impact-expansion timing. | M4-era; latest to mature. |

**Decided (2026-06-13): bundle docs before skills.** Write `blocked-not-prompted` / `flow-field-spine` / `comic-to-cinema` as **project-bundle docs first**, per the "palace work wants messy and flexible, don't lock taxonomies early" principle. Promote a doc to a standalone skill only once its workflow is stable across several runs. (The toyxyz recipe is the first such bundle doc.)

---

## 4. New concept / reference entries — `concept` / `source`

Small entries that give the project its intellectual scaffolding and link targets. Propose sparingly; let the rest emerge.

- **`Blocked, Not Prompted`** (`concept`) — authoring composition as geometry so the model fills rather than chooses. `contradicts` → the front-on prompt-only default. The most reusable idea here.
- **`The Flow Field is the Spine`** (`concept`) — one quantity at three resolutions of reality; "the arrow becomes the wind." `connects-to` [[Flocking]], `couples-with` `Blocked, Not Prompted`.
- **`Comic and Cinema — Two Ways of Seeing`** (`concept`) — McCloud's gutter + transition types, compression vs dilation. `philosophy` pillar anchor.
- **`Staging-AI vs Render-AI`** (`concept`) — the opposite-risk-profile split; cheap structured extraction vs expensive uncertain generation. `exemplifies` → [[Diversity of Thought in Many-Agent Systems]] (two AIs, opposite temperaments).
- **`Go-with-the-Flow`** (`source`) — CVPR 2025, arXiv 2501.08331. The published precedent that one flow field drives camera + object motion. `connects-to` `The Flow Field is the Spine`.
- **`Declarative Camera Control`** (`source`/`concept`) — the automatic-cinematography literature behind the camera-grammar solver (Galvane et al.). Camera preset = on-screen-layout constraint solver.

---

## 5. Build-vs-adopt map (annotates the milestone ladder)

The honest accounting of what is *authored* vs *adopted* at each rung. This belongs in the entry body — it's the project's strategic spine.

| Rung | Adopt (off the shelf) | Author (the actual work) |
|---|---|---|
| **M0 · Describe the Block** | Blender + toyxyz rig, Mixamo locomotion, declarative-camera algorithms, Cargo/Poly Haven environments, SceneCraft/Blender-MCP staging | The **opinionated vocabulary** (which camera grammars, poses, environment kits) + the staging-AI schema that resolves language onto *only* that vocabulary and flags the rest |
| **M1 · Animatic Builder** | ComfyUI two-pass multi-ControlNet, IP-Adapter, comic style-LoRA | The comic style-LoRA *target*, beat-stepping, drawn-speed-lines-from-field |
| **M2 · Motion & the Gutter** | endpoint i2v, dense ControlNet, **Go-with-the-Flow** | McCloud transition logic, beat-locking, camera moves through the comic scene |
| **M3 · Flow-Field Spine** | particle/fluid sim (Three.js GPU **or** Blender), compositor | **The single-source coupling** — same field → speed lines + motion + sim, no per-leg re-authoring. The novel bet. |
| **M4 · Hyperreal Impact** | diffusion skin, sim medium, compositing | Impact-expansion timing, **identity across the style jump**, in/out transition |
| **M5 · Sync Server** | ffmpeg mux, deterministic render | Fixed-tempo time mapping (trivial by decision), caching/loop reuse, Ableton trigger |

---

## 6. Decisions (resolved 2026-06-13)

1. **Name** — ⏳ still open; keep "BLUELINE" as working placeholder until the lookbook locks the feel.
2. **Conditioning rig** — ✅ **recipe inside `Shop/Blender`**, not its own Specialist.
3. **Skills vs bundle docs** — ✅ **bundle docs first**, promote to skills later.
4. **Staging-AI primary** — 🔬 **Session 2 bake-off ran (2026-06-13).** Headline finding *reframes* the bet: all three paths converge on the **same hand-editable `.blend`**, because the staging **spec is the interchange format** and the Blender backend is shared — so they're **layers differing in authoring loop**, not rivals. **SceneCraft (Blender-Python batch) and the bespoke Three.js stager are both proven** (each lands an editable `.blend` from the sentence; the Three.js front-end exports the spec → identical `.blend`). **Blender-MCP could not be live-tested** (not connected as an MCP server here); its prior-justifying reason — "drives Blender directly into the hand-editable surface" — is now **true of all three**, so it no longer discriminates; its real edge (live LLM read-back + asset pulls) needs a live trial. **Recommendation:** adopt the spec-as-interchange architecture as primary, SceneCraft as the proven default backend, Three.js as the human-preview front-end, and give Blender-MCP its live trial next. No tool killed. Evidence: `proofs/session-2-staging/session-2-report.md`. **Loudon's final call pending** (incl. how Blender-MCP gets tested + whether `Shop/SceneCraft` is its own Specialist or a Shop/Blender recipe).
5. **Pre-deposit set** — ✅ **done.** Deposited: `BLUELINE` (project), `Shop/Blender` (+ toyxyz recipe), `Blocked, Not Prompted`, `The Flow Field is the Spine`. Everything else waits on the Claude Code job so we adopt proven tools, not hopeful ones.

> **Deposited but not yet committed.** All five files are written into the palace working tree. Commit Mac-side through the Deposit Ceremony (or the lock-safe committer if from Cowork).
