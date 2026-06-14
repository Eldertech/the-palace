---
title: "BLUELINE"
type: project
status: active
pillars: [tools, creation, philosophy]
born: 2026-06-13
last_activated: 2026-06-14
activation_count: 2
stage: sprout
confidence: working
energy: high
who_leads: loudon
forward_vector: "I am an opinionated instrument for bold, comic-staged, surreal-mathematical music-video action — storyboard to final render, every frame pinned to a fixed-tempo song. My novelty is point of view and coupling, not components: nearly every piece I need already exists off the shelf. What I author is the curated vocabulary, the single-source flow-field spine, and the comic↔cinema transduction. The bias is the product."
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
tags: [project, blueline, music-video, generative, pipeline, sprout]
---

# BLUELINE

> Working title — placeholder, rename freely. The brief lives in the project bundle; this entry is the palace face.

## What it is

BLUELINE makes bold, dramatic, graphic-cinematic action in surreal, mathematical worlds — music videos built the way film is built: **storyboard → animatic → final render**, with every frame pinned to the song. It is *not* a general generator. It has a default style, a fixed visual language, and a point of view. The bias is the product.

The pipeline moves between **two registers**: the storyboard speaks **comic**, the final render speaks **cinema**, and the system's whole job is the transduction between them — comic compresses and abstracts, cinema dilates and embodies. See [[Comic and Cinema as Two Registers]] *(ghost — not yet deposited)*.

## The two load-bearing ideas

- **[[Blocked, Not Prompted]]** — camera and pose are authored as geometry in a 3D block (in [[Shop/Blender]]); the model fills a composition Loudon dictated rather than choosing one. Drama becomes geometry, not adjectives, and the front-on default is defeated.
- **[[The Flow Field is the Spine]]** — one authored vector field, rendered at three resolutions of reality: drawn speed lines (comic), dense motion conditioning (steering the render), and a simulated medium (cinema). *The arrow becomes the wind.* This is the novel bet, and the #1 risk.

## Two AIs, opposite risk profiles

A cheap, reliable **staging-AI** (language → editable proxies over a curated vocabulary — structured extraction, not pixels) and an expensive, uncertain **render-AI** (diffusion skin + simulation). Milestones are sequenced so the useful early tools never depend on the risky one. Mirrors [[Diversity of Thought in Many-Agent Systems]] from the tooling side: two intelligences with opposite temperaments.

## Novelty is coupling, not components

The June 2026 research found nearly every piece exists off the shelf: the Blender→ControlNet conditioning rig, humanoid locomotion libraries, declarative camera control, procedural environments, LLM-to-scene staging, flow-guided motion diffusion ([[Go-with-the-Flow]] — ghost), the ComfyUI multi-ControlNet render core. BLUELINE *authors* the opinionated vocabulary, the single-source coupling, and the comic↔cinema transduction — and adopts the rest. Full inventory and the build-vs-adopt map: [[BLUELINE — Deposit Map]].

## Scope decisions (locked)

- **Fixed tempo** — sync is deterministic arithmetic, not elastic alignment.
- **Staged, not simulated** — comic motion is held pose + camera + FX, never simulated contact.
- **Animal motion is OUT of scope** *(2026-06-13)* — humanoid only; the one data-starved hard case retired by decision.
- **Each milestone ships** — M0 previz → M1 animatic → M2 motion comic → M3 flow-field FX → M4 hyperreal impact → M5 sync server. Every rung is a usable tool.

## Where it stands

`stage: sprout`. Two keystones proved (2026-06-13): the **conditioning keystone** (Session 1 — Blender geometric passes → SDXL per-channel multi-ControlNet; blocking defeats the front-on default) and the **flow-field spine** (Session 3 — one field, three resolutions, thin per-leg scalar). Then a second conceptual approach (the **AnimaticPlanProposal**) and the **[[Shop/RunPod GPU Backend]]** work converged on the same pipeline from the render side — folded in via [[BLUELINE — Render Backend]] and joined by the [[BLUELINE — Board Record Schema]].

The plan is now reset around a parallel, substrate-first structure: **[[BLUELINE — Production Plan]]**. Most of BLUELINE turned out to be palace substrate (a Shop-wide GPU backend, an Ableton clock, LoRA + a measurement ruler) that other work needs anyway — so the threads run in parallel, each shipping a Shop capability. Tools are adopted only once proven — no hopeful entries.

## Bundle

- `BLUELINE — Production Plan.md` — **the active plan**: parallel substrate-first tracks.
- `BLUELINE — Render Backend.md` — the render-AI half; folds the AnimaticPlanProposal + the three palace-forced changes.
- `BLUELINE — Board Record Schema.md` — the beat-addressed contract every track reads/writes.
- `render-backend/` — the AnimaticPlanProposal artifacts (PLAN, runner, graph_spec, models_manifest, board_template).
- `BLUELINE — Deposit Map.md` — the original proposal of entries/Specialists/skills and the build-vs-adopt map.
- `BLUELINE — Claude Code Job.md` — the original single-thread spike (Sessions 1 & 3 done; superseded by the Production Plan).
- `proofs/` — `session-3-flowfield/` and the conditioning keystone artifacts under `Artifacts/Shop/Blender/tests/`.
