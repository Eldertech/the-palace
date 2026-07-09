---
title: "BLUELINE"
type: project
status: active
pillars: [tools, creation, philosophy]
born: 2026-06-13
last_activated: 2026-06-26
activation_count: 5
stage: growing
confidence: working
energy: high
who_leads: loudon
forward_vector: "I am an opinionated instrument for bold, comic-staged, surreal-mathematical music-video action — storyboard to final render, every frame pinned to a fixed-tempo song. My novelty is point of view and coupling, not components: nearly every piece I need already exists off the shelf. What I author is the curated vocabulary, the single-source flow-field *stack*, the comic↔cinema transduction, and — the last rung — the live performance of the page. The bias is the product."
links:
  - target: "[[Retrospective Delay]]"
    type: mirrors
    label: sibling-visual-music-pipeline
  - target: "[[Flocking]]"
    type: connects-to
    label: flow-field-is-a-vector-field
  - target: "[[The Shop]]"
    type: connects-to
    label: commissions-its-render-stack
  - target: "[[Shop/Blender]]"
    type: connects-to
    label: blocking-and-conditioning-surface
  - target: "[[Blocked, Not Prompted]]"
    type: exemplifies
    label: core-mechanism
  - target: "[[The Flow Field is the Spine]]"
    type: exemplifies
    label: the-novel-bet
  - target: "[[The Aftermath Frame]]"
    type: connects-to
    label: dramatic-frame-engine
  - target: "[[Shop/RunPod GPU Backend]]"
    type: connects-to
    label: rides-shared-gpu-substrate
  - target: "[[BLUELINE — Render Backend]]"
    type: connects-to
    label: render-ai-half
  - target: "[[BLUELINE — Board Record Schema]]"
    type: connects-to
    label: the-shared-contract
  - target: "[[Loudon Live Design System]]"
    type: connects-to
    label: mockup-base-spec
  - target: "[[Boundary-Crossing Instruments]]"
    type: exemplifies
  - target: "[[Autodidact Polymaths]]"
    type: couples-with
    label: learn-by-building-the-tool
  - target: "[[Hand-Drawn 3D Look]]"
    type: spawned
    label: hand-drawn-3d-capability
  - target: "[[Frame Designer]]"
    type: spawned
    label: proving-ground
  - target: "[[Steer the Generator]]"
    type: spawned
    label: discipline-forged-here
  - target: "[[Typography as Meaning]]"
    type: connects-to
    label: text-layer-canon
  - target: "[[Diversity of Thought in Many-Agent Systems]]"
    type: mirrors
    label: two-ai-temperaments
  - target: "[[Adopt the Craft, Author the Seam]]"
    type: emerged-from
    label: re-founding-principle
  - target: "[[Graphic Storytelling]]"
    type: emerged-from
    label: speaks-comics-first
  - target: "[[BLUELINE — Production Plan]]"
    type: connects-to
    label: the-front-door
  - target: "[[BLUELINE — Motion and Flow]]"
    type: spawned
    label: unified-motion-subsystem
  - target: "[[BLUELINE — The Page]]"
    type: spawned
    label: output-aesthetic
  - target: "[[ControlNet as Topology]]"
    type: connects-to
    label: why-geometry-beats-prompting
tags: [project, blueline, music-video, generative, pipeline, sprout]
---

# BLUELINE

![[BLUELINE — hero.png]]

> **▸ Front door: [[BLUELINE — Production Plan]].** For where the project stands, its goals, the eight
> threads, and the prioritized next steps, read the Production Plan — it is the single, current source
> of truth (what it is · goals · status · threads · horizon). This entry is the palace *face*; the plan
> is the map.

> Working title — placeholder, rename freely. The brief lives in the project bundle; this entry is the palace face.

## What it is

BLUELINE makes bold, dramatic, graphic-cinematic action in surreal, mathematical worlds — music videos built the way film is built: **storyboard → animatic → final render**, with every frame pinned to the song. It is *not* a general generator. It has a default style, a fixed visual language, and a point of view. The bias is the product.

The pipeline moves between **two registers**: the storyboard speaks **comic**, the final render speaks **cinema**, and the system's whole job is the transduction between them — comic compresses and abstracts, cinema dilates and embodies. See [[Comic and Cinema — Two Ways of Seeing]] *(ghost — not yet deposited)*.

## The two load-bearing ideas

- **[[Blocked, Not Prompted]]** — camera and pose are authored as geometry in a 3D block (in [[Shop/Blender]]); the model fills a composition Loudon dictated rather than choosing one. Drama becomes geometry, not adjectives, and the front-on default is defeated.
- **[[The Flow Field is the Spine]]** — an authored vector field, rendered at three resolutions of reality: drawn speed lines (comic), dense motion conditioning (steering the render), and a simulated medium (cinema). *The arrow becomes the wind.* This is the novel bet, and the #1 risk. *(Reframed 2026-07-09: a panel carries a **stack** of such fields — wind, wake, impact, ambient — each single-source, composited like buses. The discipline is single-source-per-motion, not one field per panel. See [[BLUELINE — Motion and Flow]].)*

## Two AIs, opposite risk profiles

A cheap, reliable **staging-AI** (language → editable proxies over a curated vocabulary — structured extraction, not pixels) and an expensive, uncertain **render-AI** (diffusion skin + simulation). Milestones are sequenced so the useful early tools never depend on the risky one. Mirrors [[Diversity of Thought in Many-Agent Systems]] from the tooling side: two intelligences with opposite temperaments.

## Novelty is coupling, not components

The June 2026 research found nearly every piece exists off the shelf: the Blender→ControlNet conditioning rig, humanoid locomotion libraries, declarative camera control, procedural environments, LLM-to-scene staging, flow-guided motion diffusion ([[Go-with-the-Flow]] — ghost), the ComfyUI multi-ControlNet render core. BLUELINE *authors* the opinionated vocabulary, the single-source coupling, and the comic↔cinema transduction — and adopts the rest. Full inventory and the build-vs-adopt map: [[BLUELINE — Deposit Map]].

## Scope decisions (locked)

- **Fixed tempo** — sync is deterministic arithmetic, not elastic alignment.
- **Staged, not simulated** — comic motion is camera + FX + pose, never simulated *contact*. *(Updated 2026-07-03: the held-pose constraint is relaxed — **pose-blend-along-flow** is now in scope as a bounded experiment (interpolate key-poses along the flow direction). Simulated physical contact between figures stays out. Unblocks [[BLUELINE — Motion and Flow]] Edge 3.)*
- **Animal motion is OUT of scope** *(2026-06-13)* — humanoid only; the one data-starved hard case retired by decision.
- **Each milestone ships** — M0 previz → M1 animatic → M2 motion comic → M3 flow-field FX → M4 hyperreal impact → M5 sync server. Every rung is a usable tool.
- **Live performance is the final stage** *(2026-07-09)* — the last rung of the production process, not a separate project. Everything offline is built to survive the crossing into real time (same record, same audio→parameter map, same warm-started render; only the clock source and the model's step-count change). See [[BLUELINE — The Page]].
- **The flow field is a stack, not one field** *(2026-07-09)* — coherence is single-source-*per-motion*, not one field per panel; multiple fields (wind, wake, impact, ambient) compose like buses. Relaxes [[The Flow Field is the Spine]]'s singular framing.
- **The page persists through the pipeline** *(2026-07-09)* — the screen is a comic page; panels arrive in musical time, layers breathe inside them. Adopt the comic lexicon: **panel** is the unit, "frame" is reserved for the 1/24s image. See [[BLUELINE — The Page]].

## Where it stands

`stage: growing`. **The full status map, threads, and next steps are in [[BLUELINE — Production Plan]]**
— every proof placed, each thread marked proven / partial / retired, with the prioritized horizon. In
brief: **Clock & Sync** shipped and
live-validated (the rendered-board **animatic** plays on *Ascension_v8*, 120 BPM → 12 fr/beat);
**Figure & Pose** is mature ([[Shop/Figure Rig]], hands shipped); **Style & Identity** locked the
`pen-flow` house look (identity → InstantID next); **Text & Lettering** proved rung 1 (material register
+ the Living Balloon); **Line-Art Decomposition** validated the convert-first flat-cel path; the
**Render Backend** runs Study(SDXL/pod)/Piece(FLUX/serverless) off one board record. **Motion & Flow**
is the priority frontier — seven threads unified in [[BLUELINE — Motion and Flow]], with the render-noise
warp **retired** (seed-lock wins) and the *pose → field → clock* coupling named as the next lift.

The keystones still ground it: the **conditioning keystone** (Session 1 — Blender geometric passes → SDXL
multi-ControlNet; [[Blocked, Not Prompted]]) and the **flow-field spine** (Session 3+4 — one field, now
character-aware; [[The Flow Field is the Spine]]). The conceptual map is [[BLUELINE — Production Pipeline]];
the contracts are [[BLUELINE — Render Backend]] · [[BLUELINE — Board Record Schema]] · [[BLUELINE — toolbox]].
*(The per-rung M0→M4 history that used to live here is preserved in the proof reports under `proofs/` and
in git; the [[BLUELINE — Production Plan]] is the front door as of 2026-07-03.)*

## Bundle

> **New here?** Read `BLUELINE — Production Plan.md` (the front door) and stop there until you need
> depth. The historical/archived docs below are kept for reasoning, not orientation — skip them.

**Front door — read first**
- `BLUELINE — Production Plan.md` — **read first**: what it is · goals · where it stands · the eight threads · the horizon (next steps). Every proof placed.

**Conceptual map + contracts (canonical)**
- `BLUELINE — Production Pipeline.md` — the established stage/role pipeline (anime backbone · comics skin · feature tissue · music-video clock) + the two seams.
- `BLUELINE — The Page.md` — **the output aesthetic (locked 2026-07-09)**: screen = comic page, panels in musical time, the comic lexicon, the panel file structure, live as the final stage.
- `BLUELINE — Motion and Flow.md` — the priority thread: seven motion threads unified + the pose → field → clock coupling.
- `BLUELINE — Render Backend.md` — the render-AI half (Study/SDXL·pod, Piece/FLUX·serverless) + the canonical runner in `render-backend/`.
- `BLUELINE — Board Record Schema.md` — the beat-addressed contract every thread reads/writes.
- `BLUELINE — toolbox.md` — every runtime + version pinned (the reproduce anchor).

**Historical (folded into the Production Plan) — skip if new**
- `BLUELINE — Specialists and Seams.md` — its "how many Specialists" question is answered by the live [[Shop/Figure Rig]] / [[Shop/Lettering]] / [[Frame Designer]] entries.
- `Archive/BLUELINE — Deposit Map.md`, `Archive/BLUELINE — Claude Code Job.md` — the original June 2026 proposal + single-thread spike (executed / superseded).

- `proofs/` — the per-track + session + rung proofs: `m0-previz/` (the verified previz player + `m0-report.md`), `m1-animatic/` (the comic-register animatic + `m1-report.md`), `m2-motion-comic/` (the beat-locked motion comic + `m2-report.md`), `animatic/` (the **rendered-board animatic** — player + `board-records.json` + `architecture.svg` + `animatic-report.md`), `new-story/` (the 6-shot noir-tragedy storyboard + the rich-first/stylize-last frame pipeline), `text-layer/` (the **text layer** — gen-AI typography, the font library + sampler, the 7-voice ink suite; see [[Shop/Lettering]] + [[Typography as Meaning]]), `m3-warped-noise/` (flow-warped noise vs seed-lock), `track-III-clock/` (clock + M4L spec), `track-II-lora/` (LoRA grade + the v2 ruler), `track-IV-bench/`, `track-V-motion/`, `session-2-staging/`, `session-3-flowfield/`, `session-10-impact/` (the physical impact solver), `session-11-outline/` (the **Aftermath Frame tool** — `impact_tool.py`, the single-sweep guide + debris look, outline pipeline).

## Active Baton

[[BLUELINE — baton]] — drafted 2026-07-04 (the Aftermath Frame tool → a guide that LEADS + gen-AI frames; hand to a fresh Claude). Lives on `feature/blueline-aftermath`.
