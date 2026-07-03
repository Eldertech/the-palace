---
title: "BLUELINE — Production Plan"
type: meta
status: active
born: 2026-06-14
who_leads: loudon
forward_vector: "I am BLUELINE's front door and single source of truth: what it is, its goals, where every thread stands, and — the part that used to be missing — what to work on next. A new agent or human who searches 'production plan' lands here and is oriented in one read. When a thread's state or the horizon changes, I am the first thing updated."
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: production-plan-for
  - target: "[[BLUELINE — Production Pipeline]]"
    type: connects-to
    label: the-conceptual-stage-map
  - target: "[[BLUELINE — Motion and Flow]]"
    type: connects-to
    label: priority-thread
  - target: "[[BLUELINE — Render Backend]]"
    type: connects-to
    label: canonical-render-layer
  - target: "[[BLUELINE — Board Record Schema]]"
    type: connects-to
    label: the-shared-contract
  - target: "[[BLUELINE — toolbox]]"
    type: connects-to
    label: reproduce-anchor
  - target: "[[Capability-first prototyping]]"
    type: exemplifies
    label: prove-then-optimize
  - target: "[[The Shop]]"
    type: connects-to
    label: each-thread-ships-a-capability
tags: [meta, blueline, production-plan, status, threads, horizon]
---

# BLUELINE — Production Plan

> **Read first.** This is BLUELINE's front door: **what it is · its goals · where it stands · the
> threads · what's next.** For depth, follow the links — the *conceptual stage map* is
> [[BLUELINE — Production Pipeline]]; the *contracts* are [[BLUELINE — Render Backend]],
> [[BLUELINE — Board Record Schema]], [[BLUELINE — toolbox]]; each thread has its own doc (below).

## 1. What BLUELINE is

BLUELINE is an **opinionated instrument for bold, comic-staged, surreal-mathematical music-video
action** — built the way film is built: **storyboard → animatic → final render**, with every frame
pinned to a fixed-tempo song. It is *not* a general generator. It has a default style, a fixed visual
language, and a point of view. **The bias is the product.**

Its novelty is **point of view and coupling, not components**: nearly every piece already exists off
the shelf (Blender→ControlNet conditioning, the ComfyUI render core, flow-guided motion diffusion, an
Ableton clock). What BLUELINE *authors* is the curated vocabulary, the single-source flow-field spine,
and the **comic↔cinema transduction** (the storyboard speaks comic; the render speaks cinema; the
system's job is the transduction between them). The two load-bearing ideas: **[[Blocked, Not Prompted]]**
(camera and pose authored as geometry, so the model fills a composition Loudon dictated) and
**[[The Flow Field is the Spine]]** (one authored vector field rendered at three resolutions of reality).

## 2. Goals & locked scope

**The destination:** a full song realized end-to-end as an *instrument* — storyboard → animatic →
motion → hyperreal impact → beat-locked cut — where the render stays a deterministic function of the
song playhead, not a video paired with audio.

Locked scope decisions (do not relitigate without a reason):
- **Fixed tempo** — sync is deterministic arithmetic (beats fall on whole frames), not elastic alignment.
- **Staged, not simulated** — comic motion is camera + FX + pose, never simulated *contact*. **(Relaxed 2026-07-03:** the *held-pose* constraint is lifted — **pose-blend-along-flow** is now in scope as a bounded experiment; simulated physical contact between figures stays out. This greenlights Motion & Flow **Edge 3**, which moves from a decision to the build queue below.)
- **Humanoid only** — animal motion is out of scope (the one data-starved hard case, retired by decision).
- **Each milestone ships** — every rung is a usable tool, never a down-payment on the next.

Quality is measured the palace way — [[Quality Manifesto]]'s wellbeing / integrity / relationship, and
"how do you feel?", not output volume.

## 3. Where it stands — the eight threads

BLUELINE is eight **threads** (the current working parts). Each is marked ✅ proven & load-bearing ·
◑ partial / has an open frontier · ✗ retired. *(These grew out of the original Track I–VI spike; the
lineage is noted where it maps.)*

| # | Thread | State | Canonical doc | Lives in |
|---|---|---|---|---|
| 1 | **Clock & Sync** (was Track III) | ✅ shipped, live-validated | [[BLUELINE — Board Record Schema]] §clock | `proofs/track-III-clock`, `proofs/animatic` |
| 2 | **Board Record & Staging** | ◑ schema stable · **Seam B is the frontier** | [[BLUELINE — Board Record Schema]] | `proofs/session-2-staging`, `seam-a-roundtrip`, `seam-b`, `staging-skeleton/` |
| 3 | **Figure & Pose** (was Track IV) | ✅ mature (hands shipped; face next) | [[Shop/Figure Rig]] | `proofs/blender-handdrawn`, `track-IV-bench`, `blender-gallery` |
| 4 | **Motion & Flow** ← priority (was Track V) | ◑ proven in comic/FX · render-noise **retired** · unifying now | [[BLUELINE — Motion and Flow]] | `proofs/session-3-flowfield`, `session-4-figure-flow`, `track-V-motion`, `track-VI-elemental-motion`, `cloud-i2v`, `embedded-motion`, `m3-warped-noise` |
| 5 | **Render Backend** (was Track I) | ✅ operational | [[BLUELINE — Render Backend]] | `render-backend/`, `proofs/track-II-lora` (the ruler) |
| 6 | **Style & Identity** (was Track II) | ✅ house style locked · identity via InstantID next | [[Steer the Generator]] | `proofs/style-lock`, `style-atlas`, `visual-language-console` |
| 7 | **Text & Lettering** | ✅ rung 1 proven (material register + Living Balloon) | [[BLUELINE — Text Layer]] | `proofs/text-layer`, `proofs/lyrics-layer` |
| 8 | **Line-Art Decomposition** | ✅ validated (convert-first flat-cel) | [[Line-Art Layer Decomposition]] | `proofs/blender-fire` |

**One-line each:**
1. **Clock & Sync** — the music-time substrate. Max-for-Live transport + clip-scan → OSC → WebSocket → browser; `(bar,beat)→frame` is exact arithmetic. The rendered-board **animatic** plays the 6 boards on *Ascension_v8* (120 BPM → 12 fr/beat).
2. **Board Record & Staging** — the contract every thread reads/writes (pose/depth/edge/flow + the beat). **Seam B** (exact blocking → exact ControlNet keypoints — [[Blocked, Not Prompted]]) is the one place with real R&D left.
3. **Figure & Pose** — [[Shop/Figure Rig]] (MPFB2 + Rigify) → three aligned plates → the **D2 redraw** holds pose *and* pen-flow ink. Hands shipped; face next.
4. **Motion & Flow** — seven motion threads under one principle (*draw the ink once, move it with geometry*); render-noise warp retired; the pose→field→clock coupling is the next lift. See [[BLUELINE — Motion and Flow]].
5. **Render Backend** — Study (SDXL/pod) + Piece (FLUX/serverless) read the *same* board record. Canonical runner: `render-backend/` + the multi-agent-safe `_ops/commons` layer. Plus the measurement **ruler** (`assess.py`).
6. **Style & Identity** — house look **locked = `pen-flow`** (via the Taste Breeder); the [[Graphic Storytelling|Visual Language Console]] is the vocabulary tool; identity is a swappable face-slot → InstantID.
7. **Text & Lettering** — text is a vector overlay, never diffused. Rung 1 (material register + the Living Balloon) proven. See [[Shop/Lettering]].
8. **Line-Art Decomposition** — convert flat-ink → flat-cel first, *then* SAM/Depth-Anything/LaMa, then stylize back.

## 4. Retired — do not reinvest

- **Render-noise flow-warp** (Track V / M3→M3.7): flow-warped diffusion noise **never beats seed-lock**
  at the render, across every regime. Storyboard→render rides **seed-lock + identity + depth + img2img**;
  the field stays the compositional/FX spine, not a render-noise tool. `proofs/m3-warped-noise/`.
- **Character LoRA** (Track II): scored below its text-only baseline (learned a costume, not a face) →
  identity moves to **InstantID**. The *style* LoRA is still live.
- **Crystal-head character**: base SDXL refuses it — deferred to inpaint / FLUX-ref / a LoRA.

## 5. The horizon — what's next

The one prioritized, cross-thread stack. Each item links the thread that owns it.

**Ready now** (build; no new unknowns):
1. **Motion & Flow · Edge 1 — pose → field.** Obstacle mask from the same board-record pose that
   conditions the render; concrete wins: flow-field-biased ink splatter + feed-the-field-to-render
   img2img fuse. → [[BLUELINE — Motion and Flow]] §Edge 1.
2. **Figure & Pose — face keypoints + a pose library.** `draw_facepose` (the 70-pt map) and a
   dial-a-frame catalogue. → [[Shop/Figure Rig]].
3. **Style & Identity — InstantID face-slot.** Bake identity + gaze at generation. → [[Steer the Generator]].
4. **Text & Lettering — rungs 2+.** Dialogue-balloon modes #2/#3; letter *into* the frame. → [[BLUELINE — Text Layer]].
5. **Cross-cutting — level the 6 boards to uniform fidelity, and a shareable muxed cut.** → [[Frame Designer]] + `Shop/ffmpeg`.
6. **Motion & Flow · Edge 3 — pose-blend-along-flow** *(greenlit 2026-07-03 — Loudon relaxed the "staged, not simulated" lock).* Interpolate held key-poses along the flow direction (coil→leap that follows the wind); bounded experiment, simulated contact still out. The technique was already ready; it just needed the scope call. → [[BLUELINE — Motion and Flow]] §Edge 3.

**The big lifts** (design / research):
7. **Motion & Flow · Edge 2 — field → clock.** A time-varying field that evolves per beat (the
   priority frontier; a wiring job — substrate exists in Track VI's `warp.py` / `fields.py:from_flow`).
8. **Figure & Pose — the multi-figure ladder.** Separated → contact → interlocked → crowd; Route A
   3-guide stack / Route B regional conditioning ("the next big prize"). → [[Shop/Figure Rig]].
9. **Board Record & Staging — Seam B + the staging-AI.** Exact blocking → exact keypoints; language →
   staging spec. → [[BLUELINE — Production Pipeline]] §the two seams.
10. **Render Backend — serverless graduation** for the Piece tier. → [[BLUELINE — Render Backend]].

**Decisions for Loudon** (a call, not a build):
11. **Visual Language Console · Phase 2** — the hybrid style atlas on RunPod (quote GPU first).

**The gate:** full-song **production volume** begins once a board pair survives the motion test, the
boards are leveled to uniform fidelity, and a muxed cut exists.

## 6. Every proof folder, placed

| Proof dir | Thread | State |
|---|---|---|
| `track-III-clock`, `animatic`, `m0-previz`, `m1-animatic`, `m2-motion-comic` | 1 Clock & Sync (+ comic players) | ✅ |
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
| `blueline-m1-m4-lesson.html` | teaching artifact (not a thread) | — |

## 7. How the threads were chosen (origin rationale)

The original 2026-06 spike cut the work into parallel **tracks** by three filters, and the framing
still holds — it's why the threads parallelize cleanly and each leaves behind reusable palace machinery:

1. **Does it serve all palace work, or only BLUELINE?** Substrate (the GPU backend, the clock, the
   ruler, the flow-field, the Figure Rig) got priority and was built as reusable Shop machinery — most
   of BLUELINE turned out to be palace substrate other work needs anyway. *The substrate was the prize.*
2. **What is the biggest *unknown* in this seam, and the *smallest* test that retires it?**
   Capability-first ([[Capability-first prototyping]]): prove the behavior on one tiny case before volume.
3. **Can it run without waiting on another thread?** Threads meet only at the
   [[BLUELINE — Board Record Schema|board record]], so they parallelize.

The threads meet the established animation pipeline in [[BLUELINE — Production Pipeline]] (anime
backbone · comics skin · feature tissue · music-video clock) — *adopt the craft, author the seam*.

## 8. Doc map

- **Front door / status / horizon** — *this doc*.
- **Conceptual stage map** — [[BLUELINE — Production Pipeline]] (stages 0–7, the two seams).
- **Contracts** — [[BLUELINE — Render Backend]] · [[BLUELINE — Board Record Schema]] · [[BLUELINE — toolbox]].
- **Priority thread** — [[BLUELINE — Motion and Flow]].
- **Historical (folded here)** — [[BLUELINE — Specialists and Seams]] (its roster is the live
  [[Shop/Figure Rig]] / [[Shop/Lettering]] / [[Frame Designer]]). Archived: `Archive/BLUELINE — Deposit Map.md`,
  `Archive/BLUELINE — Claude Code Job.md`. *New here? Skip the historical/archived docs — they're kept
  for reasoning, not orientation.*
