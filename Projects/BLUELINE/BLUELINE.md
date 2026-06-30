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
tags: [project, blueline, music-video, generative, pipeline, sprout]
---

# BLUELINE

![[BLUELINE — hero.png]]

> **▸ STATUS (2026-06-24) — consolidated on main.** All the BLUELINE threads are merged to canon. (1) The rendered-board **animatic** plays the 6 new-story boards on the **live Ableton clock** (Loudon's *Ascension_v8*, 120 BPM → 12 frames/beat, deterministic ✓) — `proofs/animatic/`. (2) The **frame pipeline** that produced the boards — the 6-shot noir-tragedy storyboard, rich-first/stylize-last, the RunPod backend — `proofs/new-story/`; canon [[Frame Designer]] · [[Steer the Generator]]. (3) The **text layer** — gen-AI typography, the font library, the 7-voice ink suite — `proofs/text-layer/`; canon [[Shop/Lettering]] · [[Typography as Meaning]] · [[BLUELINE — Text Layer]]. Next rungs: level the boards to uniform fidelity; a shareable muxed cut; the motion-comic register on the live clock (move the existing ink lines, slowed down); and the text layer's placement (letter *into* the frame).

> Working title — placeholder, rename freely. The brief lives in the project bundle; this entry is the palace face.

## What it is

BLUELINE makes bold, dramatic, graphic-cinematic action in surreal, mathematical worlds — music videos built the way film is built: **storyboard → animatic → final render**, with every frame pinned to the song. It is *not* a general generator. It has a default style, a fixed visual language, and a point of view. The bias is the product.

The pipeline moves between **two registers**: the storyboard speaks **comic**, the final render speaks **cinema**, and the system's whole job is the transduction between them — comic compresses and abstracts, cinema dilates and embodies. See [[Comic and Cinema — Two Ways of Seeing]] *(ghost — not yet deposited)*.

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

`stage: growing`. **The five-track technical spike is closed** (2026-06-16) and **M0 previz is the first production rung — verified.** Track-by-track: **I (GPU substrate)** board→render both tiers; **III (clock)** live-validated round-trip from real Ableton — the full **live-clock-loop** now runs end-to-end (2026-06-23): a track-agnostic **marker/locator transport** (sections from arrangement locators), **per-track clip scanners** (OSC-namespaced by track name, auto-rescan on Stop), and a **multi-track previz** showing every scanner track as a time-aligned lane (`proofs/track-III-clock/`, `?track=` players); **IV (bench)** pose/camera/environment → board records; **V (motion)** seed-lock defeats stitched-stills flicker (0.94 vs 0.17, the #1 risk, workable). **II (identity)** returned an *honest negative*: the character LoRA scored below its text-only baseline (it learned a hooded costume, not a face) — but the pipeline is sound (DreamBooth dog control +0.35) and the **v2 measurement ruler** shipped by catching it. **M0** then played the 8-shot storyboard *in time* with the live clock — beat-locked, deterministic, shot-accurate (`proofs/m0-previz/m0-report.md`).

**M1 + the re-founding (2026-06-17).** M1 raised the boards to the comic register (inked panels over a blue-line draft) and grew the **staging vocabulary** — facing, eyeline, L/R laterality, the framing-robust shoulder–shoulder–pelvis torso frame — which turns out to do *three jobs at once*: the board-record schema, the AI's conditioning keypoints, and the lossless 2D→3D transfer format. The project was then re-founded on the **established animation pipeline** rather than an invented one — see [[BLUELINE — Production Pipeline]] (anime backbone · comics skin · animated-feature tissue · music-video clock; the only novelty is two seams). Founding rationale: [[Adopt the Craft, Author the Seam]].

**M2 motion comic — verified (2026-06-17).** The held inked panels now *move*: the flow field **scrolls along its direction** (the first place [[The Flow Field is the Spine]] moves in the comic register), the figure **breathes** (feet-anchored) and **sways**, and the ground **parallaxes** — all *limited animation* (staged, not simulated). The bet that holds it together: **every motion is a pure function of the song playhead** (a continuous frame, interpolated between beats and resnapped on each beat), so the motion comic stays an *instrument*, not a video — verified by `drawFrame(F)` being pixel-identical for equal `F` and differing for different `F`. A `motion OFF` toggle freezes back to *exactly* the M1 held register, and the staging keypoints stay lossless (the bow-tension shimmer is render-only). `proofs/m2-motion-comic/m2-report.md`.

**M3 flow-warped noise — honest negative (2026-06-18).** The coherence stack's step 4 ([[The Flow Field is the Spine]] reaching the render) was tested at a **large** 482 px pose delta: render A (anchor), B·seed-lock (`N_A` reused), B·warped (`N_A` warped A→B along the flow), and ask whether warped noise holds the look where seed-lock breaks. The **inject path is proven** end to end — a `NoiseFromNPY` → `SamplerCustomAdvanced` graph feeds an external noise tensor deterministically (local SDXL pixel-identical inject-same check; pod FLUX via base64-inline transport). The **verdict is a negative**, like Track II's: seed-lock *degrades gracefully* (0.744/0.380, down from Track V's small-delta 0.88/0.94) but the **naive warp collapses to incoherent rainbow striping** (0.508/0.016) — a backward-warp + global renorm fixes mean/std yet breaks the *spatial white-noise* prior the diffusion sampler needs (reproduced on both SDXL and FLUX → method, not bug). The bet isn't disproven; it's untested-at-render — the real rung needs [[Go-with-the-Flow]]'s **whiteness-preserving, incremental** noise-warp, not a generic image warp across one comic-panel jump. The capability ships regardless (the inject node + the curl-hardened large-body `/prompt` transport). `proofs/m3-warped-noise/m3-report.md`.

**M3.5 whiteness-preserving warp — fixed, and now a tie (2026-06-19).** Built the correct noise-warp (`warp_noise_gtf.py`: forward-splat + per-cell **L2**-normalize + disocclusion hole-fill — the HIWYN / [[Go-with-the-Flow]] core). Nearest-splat warped noise is **as white as the base** (lag-1 autocorr 0.001 vs the naive warp's 0.127) yet has moved with the motion. The **rainbow is gone**: B·warped went from incoherent garbage (0.508/0.016) to a **coherent, palette-matched figure** (0.709/0.373) — but at the 482 px delta it lands **~level with seed-lock** (0.744/0.380), not beating it. So M3's negative was half an *implementation* bug (now fixed) and half a *regime* truth: warping noise across one giant staged jump (~34% disoccluded) ties seed-lock; [[Go-with-the-Flow]]'s gain lives in **small incremental** motion, where transport dominates. Design conclusion: the flow-field spine is a **within-shot** coherence tool (move the noise frame-to-frame along the clock), not a between-panel one — big staged cuts lean on seed-lock + identity + depth + img2img. `proofs/m3-warped-noise/m3.5-report.md`.

**M3.6 delta sweep — no crossover; warp ties seed-lock at every delta (2026-06-19).** Swept the A→B pose at 48/96/169/290/483 px (one pod, 11 renders), seed-lock vs flow-warped at each. On the primary identity metric (`embed_cos`) the two are **statistically tied across the whole range** (Δ within ±0.035, no trend — `proofs/m3-warped-noise/renders-sweep/m3.6-sweep.png`); `color_corr` is variance-noise (one warp win at 96 px, losses at 169/290). So even correctly white and even at small deltas, **flow-warped noise does not beat seed-lock for a single staged jump** — seed-lock is already near-ceiling (0.92–0.96) at small deltas, leaving no headroom, and n=1 renders are variance-dominated. The bet ([[The Flow Field is the Spine]]) survives **only** as a *cumulative multi-frame sequence* hypothesis (drift compounds frame-to-frame, where a per-step warp could re-align) — Go-with-the-Flow's real video regime. **Design rule, now load-bearing: the storyboard→render path (discrete panels, often-large jumps) rides seed-lock + identity + depth + img2img; do NOT invest in flow-warped noise there.** `proofs/m3-warped-noise/m3.6-report.md`.

**M3.7 cumulative-sequence test — the render-noise bet is closed (2026-06-19).** The last viable regime: a 6-frame coil→leap motion rendered as fixed-noise **seed-lock** vs a **per-step warped chain** (`N_i = GtF-warp(N_{i-1}, flow/5)` — Go-with-the-Flow's actual video mechanism), scored on *adjacent-frame* coherence (temporal smoothness). **Seed-lock wins**: adjacent embed 0.858 vs the chain's 0.809 (Δ −0.049), color +0.596 vs +0.476 — the chain *wanders more* (a divergent figure at s3 in `proofs/m3-warped-noise/renders-seq/m3.7-filmstrip.png` + GIFs). Each warp step injects ~7% fresh noise, so consecutive warped frames share *less* structure than the identical-latent seed-lock pair; with the pose ControlNet already placing content, the noise just needs to be *stable*. So across **every** regime — single jump swept 48→483 px (M3.6) and a cumulative sequence (M3.7) — **flow-warped noise never beats seed-lock at the render.** [[The Flow Field is the Spine]]'s "move the noise at the render" sub-claim is **retired**; the field stays the **compositional/FX spine** (M2's scrolling field, the staging vocabulary — verified and valuable), not a render-noise tool. Track V's novel-core unknown is answered (a clean no). `proofs/m3-warped-noise/m3.7-report.md`.

**M4 hyperreal impact — identity survives the style jump at baseline (2026-06-19, reconnaissance).** The M4 risk is *identity across the comic→hyperreal style jump*. Rendered both boards (A, B) in **comic** and **hyperreal** registers (same pose + same `N_A`, two style prompts). With **no identity model**, comic↔hyper `embed_cos` = 0.689 (A) / 0.752 (B), **mean 0.72 — above Track II's 0.60 target** (`color_corr ≈ 0`, correct: the palette is *meant* to flip). So the "same face in two registers" risk is **tractable** — PuLID/FaceID (Track II) has headroom to push past the baseline. Two honest caveats: `embed_cos` is scene/composition similarity (shared pose+noise helps it), not rigorous face-ID — that's Track II's `assess.py`; and the **comic register is soft** (FLUX from a prompt alone is stylized-graphic, not crisp flat BD ink — needs a **style LoRA**, also Track II). M4 is **green at the spike level**; full M4 is gated on Track II's two assets, not on any new unknown. `proofs/m3-warped-noise/m4-report.md`.

**Style-lock & character sidequest — the house look is locked; the face is a swappable slot (2026-06-19).** A long hands-on push to *use gen-AI well* (generate volume, select by intuition) settled BLUELINE's actual visual identity and surfaced the discipline now deposited as [[Steer the Generator]]. (1) **House style LOCKED = `pen-flow`**: modern pen & ink + scattered ink blobs + dramatic sweeping flow-lines, stark B&W noir on rough paper — chosen *by eye* via the **Taste Breeder** (a 4-up taste game that learns Loudon's picks and predicts the next, ~83% in ~12 rounds) and a finalist montage. Recipe verbatim in `proofs/style-lock/locked-style.json`. (2) **SDXL beats FLUX for this look** — FLUX renders it "too perfect/vector"; SDXL keeps the hand-drawn ink. Volume runs on RunPod (volume-free pod, any datacenter, create-retry + guaranteed teardown): 100 `pen-flow` action frames shipped (`proofs/style-lock/`, gitignored). (3) **Crystal-head character abandoned** — base SDXL won't render "a crystal instead of a head" (6 phrasings, all human heads); revisit via inpaint / FLUX-reference / a LoRA. (4) **Face → swappable slot**: render a neutral placeholder + a per-frame **registration token** (known head-direction + insightface landmarks, 6/6 detected incl. profile/up-down). The cv2 paste-swap **looked horrible** (compositing fights the ink) and prompt-only gaze **collapses to frontal** — so the real fix for *both* identity quality and gaze control is **bake at generation via InstantID** (reference identity + face-keypoint conditioning), the named next move (see the baton). The whole sidequest is `proofs/style-lock/` (Taste Breeder, pen-flow lock, pose engines, face-slot+token, gaze atlas) — git-archived on this branch, **not yet merged to main**.

**The animatic — rendered boards on the live clock (2026-06-23).** The storyboard→animatic rung, now realized with the *real rendered boards* (not the M1/M2 synthetic registers) and a *live song*. A new player (`proofs/animatic/animatic.html`) shows the 6 new-story boards on a 16:9 cinema stage, sequenced by Loudon's Ableton arrangement: **Blueline Transport** (MASTER) supplies tempo + section locators; a **Blueline ClipScan** (SCANNER) on a track named **`Boards`** supplies one MIDI clip per shot — the clip *name* carries the prompt, its *position + length* carries the timing (two independent layers); the relay fans both to the browser over WebSocket. The clip→frame law is exact arithmetic — `frame = clip_start_beats × frames_per_beat`, `frames_per_beat = (fps×60)/tempo = 12` at 120 BPM/24 fps — so beats fall on whole frames and it stays an *instrument*, not audio-plus-video. Verified headless (`verify_animatic.py` PASS: routing + whole-frame) and confirmed **live** (*Ascension_v8*, transport playing, 6 clips scanned from the `Boards` track). Two bugs surfaced and were fixed in the doing: rich prompts collided on keyword routing (→ route by leading shot-number, order as fallback) and the player borrowed the M0 previz's title via a cross-fetch (→ cut it). Full record + the architecture infographic: `proofs/animatic/animatic-report.md` + `architecture.svg`.

The two 2026-06-13 keystones still ground it: the **conditioning keystone** (Session 1 — Blender geometric passes → SDXL per-channel multi-ControlNet; blocking defeats the front-on default) and the **flow-field spine** (Session 3 — one field, three resolutions). The render-side **AnimaticPlanProposal** + **[[Shop/RunPod GPU Backend]]** converged on the same pipeline — folded in via [[BLUELINE — Render Backend]] and joined by the [[BLUELINE — Board Record Schema]].

The plan is now reset around a parallel, substrate-first structure: **[[BLUELINE — Production Plan]]**. Most of BLUELINE turned out to be palace substrate (a Shop-wide GPU backend, an Ableton clock, LoRA + a measurement ruler) that other work needs anyway — so the threads run in parallel, each shipping a Shop capability. Tools are adopted only once proven — no hopeful entries.

## Bundle

- `BLUELINE — Production Pipeline.md` — **the re-founding**: the established stage/role pipeline (anime backbone · comics skin · feature tissue · music-video clock), the two seams, and the tracks mapped onto stages. Rationale: [[Adopt the Craft, Author the Seam]].
- `BLUELINE — Production Plan.md` — **the active plan**: parallel substrate-first tracks (now understood as the pipeline stages).
- `BLUELINE — Render Backend.md` — the render-AI half; folds the AnimaticPlanProposal + the three palace-forced changes.
- `BLUELINE — Board Record Schema.md` — the beat-addressed contract every track reads/writes.
- `render-backend/` — the AnimaticPlanProposal artifacts (PLAN, runner, graph_spec, models_manifest, board_template).
- `BLUELINE — Deposit Map.md` — the original proposal of entries/Specialists/skills and the build-vs-adopt map.
- `BLUELINE — Claude Code Job.md` — the original single-thread spike (Sessions 1 & 3 done; superseded by the Production Plan).
- `proofs/` — the per-track + session + rung proofs: `m0-previz/` (the verified previz player + `m0-report.md`), `m1-animatic/` (the comic-register animatic + `m1-report.md`), `m2-motion-comic/` (the beat-locked motion comic + `m2-report.md`), `animatic/` (the **rendered-board animatic** — player + `board-records.json` + `architecture.svg` + `animatic-report.md`), `new-story/` (the 6-shot noir-tragedy storyboard + the rich-first/stylize-last frame pipeline), `text-layer/` (the **text layer** — gen-AI typography, the font library + sampler, the 7-voice ink suite; see [[Shop/Lettering]] + [[Typography as Meaning]]), `m3-warped-noise/` (flow-warped noise vs seed-lock), `track-III-clock/` (clock + M4L spec), `track-II-lora/` (LoRA grade + the v2 ruler), `track-IV-bench/`, `track-V-motion/`, `session-2-staging/`, `session-3-flowfield/`.
