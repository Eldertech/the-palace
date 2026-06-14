---
title: "BLUELINE — Board Record Schema"
type: meta
status: draft
born: 2026-06-14
who_leads: loudon
forward_vector: "I am the one object every BLUELINE thread reads or writes: the board record. The bench writes me, the clock time-stamps me, the backend executes me, the LoRAs style me, the spine animates me. I am the source of truth that is not the pixels — and I carry a beat, so the render can be an Ableton instrument and not just a film tool."
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: the-shared-contract
  - target: "[[BLUELINE — Render Backend]]"
    type: connects-to
    label: executed-by
  - target: "[[Blocked, Not Prompted]]"
    type: exemplifies
    label: the-record-is-truth
tags: [meta, blueline, schema, contract, sync]
---

# BLUELINE — Board Record Schema

> The connective tissue. The AnimaticPlanProposal's `board_template.txt` is the seed; this extends it with the two things it lacked — a **clock** (so renders sync to Ableton) and an **edge channel** (so SDXL gets its canny). One record per shot; the BIBLE once per film.

## The principle

A board record holds **everything except the pixels**: the authored control (pose / depth / edge / flow field), the identity reference, the descriptor, the seeds, the style lock — and now **when it happens in the song**. Every BLUELINE thread touches this object and nothing else needs to know about the others. That decoupling is what makes the threads parallel.

## Who reads/writes which fields

| Field group | Written by | Read by |
|---|---|---|
| `BAR` / `BEAT` / `FRAME` (the clock) | the Clock (Track III, from Ableton locators) | the runner (output naming), the sync mux |
| `POSE` / `DEPTH` / `EDGE` / `NORMAL` (control passes) | the Bench (Track IV, Blender geometric emission) | the runner → ControlNet |
| `FLOW` (the field handle + scalar) | the Spine (Track V) | speed-line render, motion conditioning, sim |
| `IDREF` / `id_study` / `id_piece` (identity) | the Face & Look (Track II, LoRA/FaceID/PuLID) | the runner → IP-Adapter / PuLID |
| `STYLE_LOCK` / style LoRA | the Face & Look (Track II) | both graphs |
| `POSITIVE` / `SEED` / `FLUX_SEED` / `SHOT_ID` | author (hand or staging-AI) | the runner |

## The extensions to `board_template.txt`

Add to each `# === BOARD ===` block:

```
BAR: 17                      # bar number in the Live set (locator-addressed)
BEAT: 1.0                    # beat within the bar (fixed tempo → exact frame)
FRAME: 2448                  # derived: (bar,beat)→frame at locked fps; runner can compute
HOLD: 4                      # beats this board holds (comic register) — 0 if it expands
EDGE: edge/04A_canny.png     # the SDXL edge channel (was missing)
FLOW: fields/scene04.flow    # handle to the shared flow field (Track V), optional
```

And to the `# === BIBLE ===`:

```
TEMPO: 128                   # locked BPM (the fixed-tempo decision)
FPS: 24                      # chosen so frames-per-beat is integer (128 BPM, 24 fps → 11.25; pick fps/tempo so this is whole)
FRAMES_PER_BEAT: <integer>   # the determinism guarantee — beats fall on whole frames
```

> **The determinism rule (from the fixed-tempo decision):** choose `FPS` and `TEMPO` so `FRAMES_PER_BEAT` is an integer. Then `(BAR,BEAT) → FRAME` is exact constant arithmetic and sync is an offline deterministic render plus a single start-trigger — no elastic alignment. This is what makes BLUELINE an instrument synced to Live rather than a video paired with audio.

## The node-title contract (extended)

The runner patches ComfyUI nodes by `_meta.title`, never by node id. Titles both graphs must expose:

```
POSITIVE   NEG   POSE   DEPTH   EDGE   IDREF   SAMPLER   SAVE
```

`EDGE` is the addition (canny on SDXL; a true lineart CN on the FLUX/SD1.5 path). Any titled node a board doesn't supply is left untouched, so one runner drives both tiers. ControlNet strengths/windows stay **locked in the graph**, per-channel — only control images, identity, text, and seed vary per board.

## Output addressing

The runner names outputs `out/<tier>/<SHOT_ID>_<FRAME>_*.png`. Because `FRAME` is in the record, the rendered sequence is **sync-addressable** — the mux (or the single Live start-trigger) lands every board on its beat with no manual alignment.

<!-- CLAUDE → LOUDON: open question — should HOLD/expansion live in the record (declarative) or be computed by the Clock from beat spacing? Drafted as a record field for now; revisit when Track III and Track V meet. -->
