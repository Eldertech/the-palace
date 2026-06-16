---
title: "BLUELINE — Production Plan"
type: meta
status: active
born: 2026-06-14
who_leads: loudon
forward_vector: "I am BLUELINE's production plan, reset around a truth the early work uncovered: most of this pipeline is palace substrate that other work needs too. So I run as parallel tracks, each one a smallest-useful-test that retires the biggest unknown in its seam and leaves behind a Shop capability the whole palace can use. BLUELINE is the proving ground; the substrate is the prize."
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: production-plan-for
  - target: "[[BLUELINE — Render Backend]]"
    type: connects-to
    label: track-IV-executes-on
  - target: "[[BLUELINE — Board Record Schema]]"
    type: connects-to
    label: the-shared-spine
  - target: "[[Shop/RunPod GPU Backend]]"
    type: connects-to
    label: substrate-track-I
  - target: "[[Capability-first prototyping]]"
    type: exemplifies
    label: prove-then-optimize
  - target: "[[The Shop]]"
    type: connects-to
    label: each-track-ships-a-specialist
tags: [meta, blueline, production-plan, parallel, substrate]
---

# BLUELINE — Production Plan

> **Supersedes** the single-thread [[BLUELINE — Claude Code Job]] (Sessions 1 & 3 done — conditioning keystone and flow-field spine both proved). What the early sessions revealed: BLUELINE is less a single app than a stack of **palace substrate upgrades** that other work (Image-to-3D, Loudon Live, any music-synced visual) needs anyway. So the plan is reset as **parallel tracks**, defined by the project's real seams, not a feature list.

## How the tracks were chosen

Three filters, applied to every candidate piece of work:

1. **Does it serve all palace work, or only BLUELINE?** Substrate gets priority and gets built as reusable Shop machinery (a Specialist, a recipe, a host class), never as project-local scratch.
2. **What is the biggest *unknown* in this seam, and what is the *smallest* test that retires it?** Capability-first: prove the behavior at full capability on one tiny case before any volume, then optimize down.
3. **Can it run without waiting on another track?** Tracks are cut so the seams between them are thin — they meet only at the [[BLUELINE — Board Record Schema]], so they parallelize cleanly.

The result is five tracks plus a shared spine. Your earlier examples are here — Ableton is **Track III**, pose design is **Track IV**, LoRA is **Track II** — but reframed as palace substrate and joined by the two seams those examples didn't name (the GPU backend, the motion glue).

---

## The shared spine (not a track — the thing all tracks touch)

**The board record** ([[BLUELINE — Board Record Schema]]) is the one object every track reads or writes: the bench writes its control passes, the clock stamps its beat, the backend executes it, the Face & Look styles it, the spine animates it. And **the measurement ruler** (identity drift / composition adherence / style coherence, from Track II) is how every track checks itself with numbers, not vibes. Build the schema stub first; everything plugs into it.

---

## Track I · The GPU Substrate — *make RunPod Shop-wide*

- **Serves all palace work?** Yes — Image-to-3D, ComfyUI, FLUX, every GPU Specialist. Highest leverage; it unblocks Tracks II and V.
- **Biggest unknown:** can the Shop dispatch *any* GPU job cheaply, reproducibly, and without the proxy-WAF / cold-start / VRAM walls already half-charted?
- **Smallest useful test:** stand up the serverless endpoint + network volume; port the AnimaticPlanProposal's title-contract `runner.py` onto the palace client's hardened transport (browser UA + curl upload); drive the *existing* `flux-controlnet-openpose.workflow.json` from one board record end to end. Prove the **Study→pod / Piece→serverless** routing split on a single board.
- **Ships to palace:** the `runpod` host class merged into `host-capability.json` (in lockstep with the Maker Roster), the unified runner, the network-volume layout. See [[BLUELINE — Render Backend]] for the three merge changes.
- **Runs:** Mac to drive, RunPod to compute. **Starts now** (reuses proven pieces).

## Track II · Identity & Style as palace assets — *LoRA + the ruler*

- **Serves all palace work?** Yes — the Loudon Live house aesthetic, any character across any project, the measurement ruler the whole Shop can use.
- **Biggest unknown (two, both hard):** does a character hold across the **SDXL→FLUX base swap**, and can a house style be **locked** rather than hoped for? These are BLUELINE risks #4 and #5 and they're the hardest *measured* questions in the project.
- **Smallest useful test:** one character turnaround sheet → one character LoRA; one **style LoRA** (the comic/BD house look). Render one board at Study (FaceID/LoRA) and re-drive it at Piece (PuLID-Flux). Score it with the three metrics — target identity-drift cosine ≥ 0.6 within a scene.
- **Ships to palace:** a LoRA-training recipe (likely a new **Shop Specialist**, *adopt only if it earns it*), and `assess.py` as the reusable **measurement ruler** (identity / composition / style). InsightFace is already loaded for PuLID, so the identity metric is free.
- **Runs:** RunPod (training + inference). **Starts once Track I's endpoint exists.**

## Track III · The Clock — *the music-time substrate*

- **Serves all palace work?** Yes — every music-synced visual, all of Loudon Live, not just BLUELINE. This is the seam that turns a render pipeline into an *instrument*.
- **Biggest unknown:** is fixed-tempo→frame truly deterministic end to end, and can a browser/render stay beat-locked to a live Ableton session?
- **Smallest useful test:** a Max for Live device reads `bar.beat.tick` + **named MIDI clips on its own track as sections** (markers→clips, 2026-06-16 — clips are spans, not points) → OSC → a small local WebSocket relay → a tiny client that logs beat-accurate timestamps and proves **beats land on whole frames** at the locked tempo/fps. Then trigger one short pre-rendered sequence in sync (render-once-and-mux, or single start-trigger). **✅ live-validated round-trip from Ableton (2026-06-16).**
- **Ships to palace:** the M4L device + OSC/WS relay as Shop machinery; the `(bar,beat)→frame` determinism recipe (feeds [[BLUELINE — Board Record Schema]]). Uses the `ableton-extensions` skill.
- **Runs:** Mac + browser, **no GPU**. **Starts now**, fully independent.

## Track IV · The Bench — *authored control: blocking, pose, camera*

- **Serves all palace work?** Partly — the geometric-emission technique and camera-grammar solvers are reusable for any character imagery; the *opinionated vocabulary* is BLUELINE's own (that's the point — the bias is the product).
- **Biggest unknown:** does the proven single-pose keystone scale into a reusable, **hand-tunable** vocabulary without losing register-clean conditioning?
- **Smallest useful test:** grow Session 1's geometric emission into a tiny pose library (a handful of dramatic held poses) + one or two **camera-grammar presets as constraint solvers** (OTS, worm's-eye), each round-tripping registered passes into a board record. Hand-editability in Blender is the win condition.
- **Ships to palace:** the pose/camera library + recipe in the `Shop/Blender` bundle (extends the tested [[Shop/Blender/toyxyz-conditioning-recipe]]).
- **Runs:** Mac (Blender). **Starts now**, builds on proven work — your familiar hand-tuning surface.

## Track V · The Motion — *the flow-field spine reaches the render*

- **Serves all palace work?** Yes by consequence — it closes [[Shop/RunPod GPU Backend]]'s **#1 untested horizon** (the walk-cycle's stitched-stills flicker), which any generative-motion work in the palace will hit.
- **Biggest unknown (the novel core):** does one flow field, dense-conditioning a board *pair* via [[Go-with-the-Flow]] / warped noise, read as **coherent motion** rather than independent frames?
- **Smallest useful test:** the proven field (Session 3) + a 2-board pair → motion-conditioned render on the Track I backend; compare against the independent-frame baseline the RunPod walk-cycle already produced. Does identity + cloth + stride stay coherent?
- **Ships to palace:** the motion-conditioning recipe; the "stitched stills → coherent motion" answer the whole Shop wants.
- **Runs:** RunPod. **Starts once Track I's endpoint exists** (and wants a board pair from Track IV).

---

## Parallelism & sequencing

```
NOW (independent, in parallel):
  Track I  · GPU Substrate ........ unblocks II & V
  Track III · The Clock ........... no GPU, fully independent
  Track IV · The Bench ............ Blender, builds on Session 1
  + shared spine: board-record schema stub

ONCE Track I's endpoint is live:
  Track II · LoRA + ruler ......... needs training compute
  Track V  · Motion ............... needs backend + a board pair from IV
```

**De-risk order:** the riskiest unknowns are **V (motion coherence)** and **II (identity across the base swap)** — run their *smallest* tests as early as their dependency on Track I allows, so a hard "no" surfaces while it's cheap. The substrate tracks (I, III) build in parallel regardless, because they pay off across the whole palace even if a BLUELINE-specific bet wobbles.

**Each track ships a usable tool** (the rung discipline): Track I = a Shop GPU dispatcher; III = a beat-sync bridge for any music visual; IV = a pose/camera library; II = a LoRA recipe + a measurement ruler; V = motion conditioning. None is a down-payment on the next.

## First moves (smallest tests, this round)

1. **Track I:** endpoint + volume up; existing FLUX workflow driven from one board record through the hardened runner; prove the routing split. *(Retires the substrate unknown, unblocks the rest.)*
2. **Track III:** M4L → OSC → WS → beat-accurate log; prove beats-on-whole-frames at locked tempo/fps. *(GPU-free, parallel, highest cross-palace leverage.)*
3. **Track IV:** three dramatic poses + one camera-grammar solver, each emitting a board record. *(Builds the vocabulary on proven ground.)*
4. **Then** Track V's 2-board motion test and Track II's one-character / one-style LoRA + assess run, the moment the endpoint is warm.

Production volume (a full song) begins only after Tracks I, III, and the spine schema are real and a board pair has survived Track V.
