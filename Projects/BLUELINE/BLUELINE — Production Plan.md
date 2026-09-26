---
title: "BLUELINE — Production Plan"
born: 2026-06-14
forward_vector: "I am BLUELINE's map: what it is, its goals and locked scope, where every thread stands, and where every proof lives. A new agent or human who searches 'production plan' lands here and is oriented in one read, and I send them to BLUELINE's scroll for what to work on next, the plan agreed with Loudon. When a thread's state changes, I am the first thing updated."
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
  - target: "[[BLUELINE — The Page]]"
    type: connects-to
    label: thread-9-output-aesthetic
---

# BLUELINE — Production Plan

> **Read first.** This is BLUELINE's map: **what it is · its goals · where it stands · the
> threads · every proof placed.** What comes next is the plan on [[BLUELINE — scroll]]. For depth, follow the links — the *conceptual stage map* is
> [[BLUELINE — Production Pipeline]]; the *contracts* are [[BLUELINE — Render Backend]],
> [[BLUELINE — Board Record Schema]], [[BLUELINE — toolbox]]; each thread has its own doc (below).

## 1. What BLUELINE is

BLUELINE is an **opinionated instrument for bold, comic-staged, surreal-mathematical music-video
action** — built the way film is built: **storyboard → animatic → final render**, with every frame
pinned to a fixed-tempo song. It is *not* a general generator. It has a default style, a fixed visual
language, and a point of view. **The bias is the product.**

Its novelty is **point of view and coupling, not components**: nearly every piece already exists off
the shelf (Blender→ControlNet conditioning, the ComfyUI render core, flow-guided motion diffusion, an
Ableton clock). What BLUELINE *authors* is the curated vocabulary, the single-source flow-field stack,
and the **comic↔cinema transduction** (the storyboard speaks comic; the render speaks cinema; the
system's job is the transduction between them). The two load-bearing ideas: **[[Blocked, Not Prompted]]**
(camera and pose authored as geometry, so the model fills a composition Loudon dictated) and
**[[The Flow Field is the Spine]]** (one authored vector field rendered at three resolutions of reality).

## 2. Goals & locked scope

**The destination:** a full song realized end-to-end as an *instrument* — storyboard → animatic →
motion → hyperreal impact → beat-locked cut → **performed live** — where the render stays a
deterministic (offline) or steerable (live) function of the song, not a video paired with audio. Live
performance is the **final stage**, and every offline stage is built to survive the crossing into it
(the spine principle — see [[BLUELINE — The Page]]).

Locked scope decisions (do not relitigate without a reason):
- **Fixed tempo** — sync is deterministic arithmetic (beats fall on whole frames), not elastic alignment.
- **Staged, not simulated** — comic motion is camera + FX + pose, never simulated *contact*. **(Relaxed 2026-07-03:** the *held-pose* constraint is lifted — **pose-blend-along-flow** is now in scope as a bounded experiment; simulated physical contact between figures stays out. This greenlights Motion & Flow **Edge 3**, which moves from a decision to the build queue below.)
- **Humanoid only** — animal motion is out of scope (the one data-starved hard case, retired by decision).
- **Each milestone ships** — every rung is a usable tool, never a down-payment on the next.
- **Live performance is the final stage** *(2026-07-09)* — the last rung, not a separate project; built so every offline stage survives the crossing into real time (same record, same audio→parameter map, same warm-started render; only the clock source and step-count change). → [[BLUELINE — The Page]].
- **The flow field is a stack, not one field** *(2026-07-09)* — coherence is single-source-*per-motion*, not one field per panel; fields (wind, wake, impact, ambient) compose like buses. → [[BLUELINE — Motion and Flow]].
- **The page persists through the pipeline** *(2026-07-09)* — the screen is a comic page, panels arriving in musical time; adopt the comic lexicon (**panel** is the unit; "frame" is reserved for the 1/24s image). → [[BLUELINE — The Page]].

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
| 8 | **Line-Art Decomposition** | ✅ validated (convert-first flat-cel) | [[Animate the Background#The N-Layer Case (Line-Art Decomposition)\|Animate the Background § The N-Layer Case]] | `proofs/blender-fire` |
| 9 | **The Page** ← new | ○ seed (locked 2026-07-09) | [[BLUELINE — The Page]] | — (compositor spec) |

**One-line each:**
1. **Clock & Sync** — the music-time substrate. Max-for-Live transport + clip-scan → OSC → WebSocket → browser; `(bar,beat)→frame` is exact arithmetic. The rendered-board **animatic** plays the 6 boards on *Ascension_v8* (120 BPM → 12 fr/beat).
2. **Board Record & Staging** — the contract every thread reads/writes (pose/depth/edge/flow + the beat). **Seam B** (exact blocking → exact ControlNet keypoints — [[Blocked, Not Prompted]]) is the one place with real R&D left.
3. **Figure & Pose** — [[Shop/Figure Rig]] (MPFB2 + Rigify) → three aligned plates → the **D2 redraw** holds pose *and* pen-flow ink. Hands shipped; face next.
4. **Motion & Flow** — seven motion threads under one principle (*draw the ink once, move it with geometry*); render-noise warp retired; the pose→field→clock coupling is the next lift. See [[BLUELINE — Motion and Flow]].
5. **Render Backend** — Study (SDXL/pod) + Piece (FLUX/serverless) read the *same* board record. Canonical runner: `render-backend/` + the multi-agent-safe `_ops/commons` layer. Plus the measurement **ruler** (`assess.py`).
6. **Style & Identity** — house look **locked = `pen-flow`** (via the Taste Breeder); the [[Graphic Storytelling|Visual Language Console]] is the vocabulary tool; identity is a swappable face-slot → InstantID.
7. **Text & Lettering** — text is a vector overlay, never diffused. Rung 1 (material register + the Living Balloon) proven. See [[Shop/Lettering]].
8. **Line-Art Decomposition** — convert flat-ink → flat-cel first, *then* SAM/Depth-Anything/LaMa, then stylize back.
9. **The Page** *(new, locked 2026-07-09)* — the screen as a comic page: panels arrive in musical time, layers breathe inside them, and the compositor is a clock-driven browser app that renders offline and performs live. The comic lexicon and the panel file structure live here. See [[BLUELINE — The Page]].

## 4. Retired — do not reinvest

- **Render-noise flow-warp** (Track V / M3→M3.7): flow-warped diffusion noise **never beats seed-lock**
  at the render, across every regime. Storyboard→render rides **seed-lock + identity + depth + img2img**;
  the field stays the compositional/FX spine, not a render-noise tool. `proofs/m3-warped-noise/`.
- **Character LoRA** (Track II): scored below its text-only baseline (learned a costume, not a face) →
  identity moves to **InstantID**. The *style* LoRA is still live.
- **Crystal-head character**: base SDXL refuses it — deferred to inpaint / FLUX-ref / a LoRA.

## 5. The horizon — what's next

The plan — what comes next, agreed with Loudon — lives on [[BLUELINE — scroll]], where it changes only with his yes.

## 6. Every proof folder, placed

| Proof dir | Thread | State |
|---|---|---|
| `track-III-clock`, `animatic`, `m0-previz`, `m1-animatic`, `m2-motion-comic` | 1 Clock & Sync (+ comic players) | ✅ |
| `session-2-staging`, `seam-a-roundtrip`, `seam-b` | 2 Board Record & Staging | ◑ (Seam B open) |
| `blender-handdrawn`, `track-IV-bench`, `blender-gallery` | 3 Figure & Pose | ✅ |
| `session-3-flowfield`, `session-4-figure-flow`, `session-5-flow-3d`, `session-6-flow-gn-studio`, `session-7-aftermath`, `session-8-swing`, `session-9-three-swings`, `session-10-impact` | 4 Motion & Flow | ✅ |
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

- **Map / status / every proof** — *this doc*. **What's next** — the plan on [[BLUELINE — scroll]].
- **Conceptual stage map** — [[BLUELINE — Production Pipeline]] (stages 0–7, the two seams).
- **Contracts** — [[BLUELINE — Render Backend]] · [[BLUELINE — Board Record Schema]] · [[BLUELINE — toolbox]].
- **Priority thread** — [[BLUELINE — Motion and Flow]].
- **Historical (folded here)** — [[BLUELINE — Specialists and Seams]] (its roster is the live
  [[Shop/Figure Rig]] / [[Shop/Lettering]] / [[Frame Designer]]). Archived: `Archive/BLUELINE — Deposit Map.md`,
  `Archive/BLUELINE — Claude Code Job.md`. *New here? Skip the historical/archived docs — they're kept
  for reasoning, not orientation.*
