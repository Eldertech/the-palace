---
title: "BLUELINE — Atlas"
type: meta
status: active
born: 2026-07-03
who_leads: loudon
forward_vector: "I am BLUELINE's front door and single source of truth for where everything stands. I place every proof, script, and doc into one of eight named subsystems, mark each proven / partial / retired / next, and point at the one canonical runner — so any agent (or Loudon) can find a capability in one read instead of spelunking 26 proof folders and 8 overlapping plan docs. When a subsystem's story changes, I am the first thing updated."
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: status-map-for
  - target: "[[BLUELINE — Production Pipeline]]"
    type: connects-to
    label: the-conceptual-map
  - target: "[[BLUELINE — Motion and Flow]]"
    type: connects-to
    label: priority-subsystem
  - target: "[[BLUELINE — Render Backend]]"
    type: connects-to
    label: canonical-render-layer
  - target: "[[BLUELINE — Board Record Schema]]"
    type: connects-to
    label: the-shared-contract
  - target: "[[BLUELINE — toolbox]]"
    type: connects-to
    label: reproduce-anchor
tags: [meta, blueline, atlas, index, status, subsystems]
---

# BLUELINE — Atlas

> **The front door.** BLUELINE grew as many independently-pulled threads — each a real, proven
> capability. This Atlas is the coherence layer over them: **eight subsystems**, every proof and
> script placed, each capability marked *proven / partial / retired / next*, and one canonical
> render/orchestration layer named. Read this first; follow the pointers for depth.
>
> **Doc hierarchy** — this Atlas is the status/index. The *conceptual* map is
> [[BLUELINE — Production Pipeline]] (stages 0–7 + the two seams). The *contracts/specs* are
> [[BLUELINE — Render Backend]], [[BLUELINE — Board Record Schema]], [[BLUELINE — toolbox]].
> Historical (folded into this Atlas): [[BLUELINE — Production Plan]] (its Tracks I–V are now
> subsystems), [[BLUELINE — Specialists and Seams]] (its question is answered by the live
> [[Shop/Figure Rig]] / [[Shop/Lettering]] / [[Frame Designer]] entries). Archived:
> `Archive/BLUELINE — Deposit Map.md`, `Archive/BLUELINE — Claude Code Job.md`.

## The eight subsystems

| # | Subsystem | State | Canonical doc | Lives in |
|---|---|---|---|---|
| 1 | **Clock & Sync** | ✅ shipped (live) | [[BLUELINE — Board Record Schema]] §clock | `proofs/track-III-clock`, `proofs/animatic` |
| 2 | **Board Record & Staging** | ◑ schema stable · Seam B is the frontier | [[BLUELINE — Board Record Schema]] | `proofs/session-2-staging`, `proofs/seam-a-roundtrip`, `proofs/seam-b`, `staging-skeleton/` |
| 3 | **Figure & Pose** | ✅ mature (hands shipped; face next) | [[Shop/Figure Rig]] | `proofs/blender-handdrawn`, `proofs/track-IV-bench`, `proofs/blender-gallery` |
| 4 | **Motion & Flow** ← priority | ◑ proven in comic/FX · render-noise **retired** · unifying now | [[BLUELINE — Motion and Flow]] | `proofs/session-3-flowfield`, `session-4-figure-flow`, `track-V-motion`, `track-VI-elemental-motion`, `cloud-i2v`, `embedded-motion`, `m3-warped-noise` |
| 5 | **Render Backend** | ✅ operational | [[BLUELINE — Render Backend]] | `render-backend/`, `proofs/track-II-lora` (ruler) |
| 6 | **Style & Identity** | ✅ house style locked · identity via InstantID next | [[Steer the Generator]] | `proofs/style-lock`, `style-atlas`, `visual-language-console` |
| 7 | **Text & Lettering** | ✅ rung 1 proven (material register + Living Balloon) | [[BLUELINE — Text Layer]] | `proofs/text-layer`, `proofs/lyrics-layer` |
| 8 | **Line-Art Decomposition** | ✅ validated (convert-first flat-cel) | [[Line-Art Layer Decomposition]] | `proofs/blender-fire` |

Legend: ✅ proven & load-bearing · ◑ partial / has an open frontier · ✗ retired (see below).

### 1 · Clock & Sync
The music-time substrate. Track III's Max-for-Live **transport + clip-scan** device → OSC → local
WebSocket relay → browser; `(bar,beat)→frame` is exact integer arithmetic at a locked tempo/fps, so
the render is an *instrument* not a video. **Shipped, live-validated** on *Ascension_v8* (120 BPM →
12 frames/beat). The **rendered-board animatic** (`proofs/animatic/`) is this driving the 6 new-story
boards. The comic-register players (M0/M1/M2) ride the same clock.

### 2 · Board Record & Staging
The contract every subsystem reads/writes: one board record per shot, holding *everything except the
pixels* (pose/depth/edge/flow, identity ref, style lock, seeds) plus **the beat**. The **staging spec**
is the same object at author-time (language → partial record + a `flagged` list). **Seam A** (2D→3D,
one record at two fidelities) is solved by design; **Seam B** (exact blocking → exact ControlNet
keypoints — [[Blocked, Not Prompted]]) is *the frontier*, the one place with real R&D left.

### 3 · Figure & Pose
The authored-geometry surface. **[[Shop/Figure Rig]]** (MPFB2 native human + Rigify IK, Blender 5.1.2)
turns a pose + body type into three aligned plates (ink · depth · canonical OpenPose drawn by the real
`draw_bodypose`) → the **D2 redraw** (canny 0.30 + depth 0.60 + openpose 0.70 @ denoise 0.92) holds the
pose *and* the pen-flow ink. **Hands shipped** (21-keypoint, 38 finger bones); **face next** (FACS
targets validated offline). Pose library + camera-grammar solvers (OTS/worm's-eye) from Track IV.

### 4 · Motion & Flow → **priority; see [[BLUELINE — Motion and Flow]]**
The most fragmented subsystem — **seven sub-threads** across flow-field spine (blind → character-aware),
comic-register scroll, elemental sims (Mantaflow/optical-flow ink-warp), video-model i2v (SVD), and the
**retired** render-noise warp. Unified in its own doc, which also designs the next lift: coupling
**pose → field → clock** (the figure shapes the field; the field evolves on the beat).

### 5 · Render Backend
Study (SDXL / pod) and Piece (FLUX / serverless) both read the *same* board record — you re-render the
record, never convert base. **Canonical runner:** `render-backend/runner.py` + `pod_runner.py` +
`serverless_runner.py`, riding the multi-agent safety layer (`_ops/runpod/agent_ns.py`,
`_ops/commons/{reaper,lease,endpoint}.py`). The measurement **ruler** (`assess.py` / `consistency_ruler.py`
— identity drift / composition / style) is how every subsystem checks itself with numbers.

### 6 · Style & Identity
House look **locked = `pen-flow`** (modern pen & ink + scattered ink blobs + sweeping flow-lines, stark
B&W noir on rough paper), chosen by eye via the **Taste Breeder**; SDXL beats FLUX for it. The
**style-atlas** (47-frame Phase-2) and the **[[Graphic Storytelling|Visual Language Console]]** (7-fader
mixing-board, V0) are the vocabulary tools. Character identity is a **swappable face-slot** → InstantID
(reference identity + face-keypoint conditioning) is the named next move; character LoRA is retired.

### 7 · Text & Lettering
Text is a **vector/canvas overlay, never diffused**; lettering is authored vocabulary, not a font
picker. Rung 1 (**material register** — gen-AI letterforms for hero words) proven; the **Living Balloon**
(bubble + word as one gen-AI material) and the 12-style balloon catalog landed. Sits on the
[[The 2.5D Paper Stack|2.5D paper stack]] at a chosen depth. See [[Shop/Lettering]].

### 8 · Line-Art Decomposition
Convert **flat ink → flat-cel (canny) first**, *then* segment (SAM) / depth (Depth Anything) / infill
(LaMa), then stylize back. The hard-won rule: SAM fails on line art but is at its best on flat-cel;
Depth Anything works on line art directly. Validated on the `blender-fire` proof. See
[[Line-Art Layer Decomposition]].

## Retired — do not reinvest

- **Render-noise flow-warp** (Track V / M3→M3.7): flow-warped diffusion noise **never beats seed-lock**
  at the render, across every regime tested (single jump 48–483 px, and cumulative sequence). The
  storyboard→render path rides **seed-lock + identity + depth + img2img**. The flow field stays the
  **compositional/FX spine**, not a render-noise tool. `proofs/m3-warped-noise/` (5 reports).
- **Character LoRA** (Track II): scored below its text-only baseline (learned a costume, not a face).
  Pipeline is sound; identity → **InstantID**. The *style* LoRA is still live.
- **Crystal-head character**: base SDXL refuses it — deferred to inpaint / FLUX-ref / a LoRA.

## Every proof folder, placed

| Proof dir | Subsystem | State |
|---|---|---|
| `track-III-clock`, `animatic` | 1 Clock & Sync | ✅ |
| `m0-previz`, `m1-animatic`, `m2-motion-comic` | 1 Clock & Sync (comic players) | ✅ |
| `session-2-staging`, `seam-a-roundtrip`, `seam-b` | 2 Board Record & Staging | ◑ (Seam B open) |
| `blender-handdrawn`, `track-IV-bench`, `blender-gallery` | 3 Figure & Pose | ✅ |
| `session-3-flowfield`, `session-4-figure-flow` | 4 Motion & Flow | ✅ |
| `track-V-motion`, `m3-warped-noise` | 4 Motion & Flow | ✗ retired render-noise |
| `track-VI-elemental-motion`, `cloud-i2v`, `embedded-motion` | 4 Motion & Flow | ◑ |
| `new-story` | 5 Render Backend (the 6-shot proof) | ✅ |
| `track-II-lora` | 5 Render Backend (ruler) / retired char-LoRA | ◑ |
| `style-lock`, `style-atlas`, `visual-language-console` | 6 Style & Identity | ✅ |
| `text-layer`, `lyrics-layer` | 7 Text & Lettering | ✅ |
| `blender-fire` | 8 Line-Art Decomposition | ✅ |
| `blueline-m1-m4-lesson.html` | teaching artifact (not a subsystem) | — |

## Where to start a job

- **Reproduce the environment:** [[BLUELINE — toolbox]] (every runtime + version pinned).
- **Render a board:** the canonical runner (subsystem 5) — never hand-roll a new orchestrator; the
  per-proof orchestrators are frozen spikes (see the [[BLUELINE — Motion and Flow]] tooling note and
  the Render Backend doc for which are superseded).
- **Stage a figure:** dispatch [[Shop/Figure Rig]] (subsystem 3).
- **Design motion:** [[BLUELINE — Motion and Flow]] (subsystem 4) — the priority frontier.
