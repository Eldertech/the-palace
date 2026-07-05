---
title: "BLUELINE — Board Record Schema"
born: 2026-06-14
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
---

# BLUELINE — Board Record Schema

> The connective tissue. The AnimaticPlanProposal's `board_template.txt` is the seed; this extends it with the two things it lacked — a **clock** (so renders sync to Ableton) and an **edge channel** (so SDXL gets its canny). One record per shot; the BIBLE once per film.

## The principle

A board record holds **everything except the pixels**: the authored control (pose / depth / edge / flow field), the identity reference, the descriptor, the seeds, the style lock — and now **when it happens in the song**. Every BLUELINE thread touches this object and nothing else needs to know about the others. That decoupling is what makes the threads parallel.

## The author-time front: the staging spec → the board record

Session 2's **staging spec** (`proofs/session-2-staging/alley-shot.staging.json`, schema in `staging-spec.schema.json`) and this board record are **the same object at two lifecycle stages** — both are "the source of truth that is not the pixels." The staging spec is the *author-time front*: the staging-AI turns a sentence into a **partial** record — vocabulary **resolved** (camera grammar, locomotion, pose-overlay, environment) plus a **`flagged`** list of what it refuses to fake. The **Bench (Track IV)** then *resolves the flagged items by rendering the actual control passes*, producing the **full** board record the runner executes. One object, authored → resolved → executed.

| Staging spec (author-time, JSON) | → resolves into → | Board record (render-time) |
|---|---|---|
| `resolved.camera` (grammar + screen-constraints + solve) | Track IV camera solver | `CAMERA_GRAMMAR` + the registered `POSE`/`DEPTH`/`EDGE` framed by that camera |
| `resolved.subject` (locomotion + sword-overlay + root + prop) | Track IV pose emission | `POSE` / `DEPTH` / `EDGE` passes + `CHARS` annotation |
| `resolved.environment` (vocab + facades + vanishing point) | plate / depth source | `SETTING` + `DEPTH` plate |
| `resolved.motion` (the *vector*) | Track V | `FLOW` handle (the *treatment* stays flagged) |
| `flagged[]` (asset_kit / clip / motion_treatment / identity) | filled by IV / II / V over time | `FLAGGED` block — shrinks to empty as the record completes |

**Format reconciliation (Session 2's "the spec is the interchange"):** the human-authorable/runner-parsed form is `board_template.txt` (BIBLE + BOARD blocks); the machine-interchange form is the staging-spec **JSON** shape. They are equivalent — a thin adapter converts (the staging-AI emits JSON; a converter writes the `board_template.txt` the runner reads, or the runner gains a JSON loader). Don't maintain two *contracts*; maintain one contract in two serializations. `CAMERA_GRAMMAR` and `FLAGGED` (below) are the two fields the staging spec contributed that the original template lacked.

## Who reads/writes which fields

| Field group | Written by | Read by |
|---|---|---|
| `BAR` / `BEAT` / `FRAME` (the clock) | the Clock (Track III, from Ableton section clips) | the runner (output naming), the sync mux |
| `POSE` / `DEPTH` / `EDGE` / `NORMAL` (control passes) | the Bench (Track IV, Blender geometric emission) | the runner → ControlNet |
| `CAMERA_GRAMMAR` (named grammar + on-screen-layout solve) | the staging-AI (author-time) → the Bench's camera solver (Track IV) | the Bench (frames the passes), the runner (provenance) |
| `FACING` / `EYELINE` (the staging channel) | the staging-AI (author-time) → the Bench (Track IV) | the Bench's `POSE` emission — they *become* the OpenPose head keypoints (nose/eyes/ears), so the render is conditioned on facing + gaze, not just limb pose. The animatic's oriented-head (M1) is the 2D preview of this. |
| `FLAGGED` (the flag-not-fake boundary) | the staging-AI; each track clears its items as it resolves them | a human + the runner (knows what is a deliberate placeholder vs final) |
| `FLOW` (the field handle + scalar) | the Spine (Track V) | speed-line render, motion conditioning, sim |
| `IDREF` / `id_study` / `id_piece` (identity) | the Face & Look (Track II, LoRA/FaceID/PuLID) | the runner → IP-Adapter / PuLID |
| `STYLE_LOCK` / style LoRA | the Face & Look (Track II) | both graphs |
| `POSITIVE` / `SEED` / `FLUX_SEED` / `SHOT_ID` | author (hand or staging-AI) | the runner |

## The extensions to `board_template.txt`

Add to each `# === BOARD ===` block:

```
BAR: 17                      # bar number in the Live set (section-clip-addressed; Track III)
BEAT: 1.0                    # beat within the bar (fixed tempo → exact frame)
FRAME: 2448                  # derived: (bar,beat)→frame at locked fps; runner can compute
SECTION: verse               # the named MIDI clip (span) this board sits in — from /transport/section
HOLD: 4                      # beats this board holds (comic register) — 0 if it expands;
                             # can derive from the section clip's length_bars now that sections are spans
EDGE: edge/04A_canny.png     # the SDXL edge channel (was missing)
FLOW: fields/scene04.flow    # handle to the shared flow field (Track V), optional
CAMERA_GRAMMAR: OTS | shoulder@0.30,0.74 vp@0.58,0.46 | lens 34
                             # a NAMED grammar + its on-screen-layout solve (Session 2 / Track IV),
                             # not raw coords — ANGLE elevated from human annotation to a solver target
FACING: 0.15                 # body/chest yaw, -1 (screen-L) … 0 (camera) … +1 (screen-R) — the staging channel
EYELINE: 0.13,0.38           # gaze target in screen fractions (what the subject looks AT); becomes the
                             # OpenPose head keypoints so facing/gaze is CONDITIONED, not left to the model.
                             # Body can hold one way while the head looks another (the "senses off-frame" beat).
HANDS: L=open R=grip         # per-hand state (open / fist / grip). Hands are the hardest thing for diffusion;
                             # the POSE pass carries ANATOMICAL L/R keypoints (OpenPose L/R wrist/ankle), so a
                             # swapped/merged hand stops being the estimator's GUESS — we declare it. NEAR/FAR
                             # limb ordering rides the DEPTH pass; foot-contact/weight is a proposed field
                             # (kills floaty/sliding feet). M1 previews all of this as L/R-tagged extremities.
FLAGGED: asset_kit(greybox→kit TBD); motion_treatment(→flow-field); hero_identity(→IDREF)
                             # the flag-not-fake boundary (Session 2): what is a DELIBERATE placeholder,
                             # and what each item is waiting on. Empty when fully resolved.
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

<!-- CLAUDE → LOUDON: open question (now half-answered by markers→clips, 2026-06-16) — HOLD/expansion can be computed by the Clock from the section clip's length_bars span, since sections are no longer points but durations. Still drafted as a declarative record field for the comic register; revisit the auto-derive when Track III and Track V meet. -->
