# Text Layer — placement mode #1 (ANCHOR IN BLENDER) — proof

**Date:** 2026-07-01 · **Branch:** `feature/blueline-text-anchor`

## The claim being tested
A dialogue balloon is a *sheet at a depth* ([[The 2.5D Paper Stack]]), not a sticker
composited flat-last. If its anchor lives in the Blender scene, then its **screen
position** and its **stack depth** both fall out of the *same* `world_to_camera_view`
projection that already makes the figure's OpenPose + depth plates. Parallax,
head-tracking, and occlusion then come for free — no separate 2D layout pass.

This proves the **WHERE** half only. The **WHAT** (the letters) stays a locked, readable
overlay — Commitment 1 is untouched. Blender computes *where / how deep / how the tail
bends*; the compositor draws *what*.

## Method
- `text_anchor_proof.py` (Blender headless) reuses the proven rig from
  `pose_rig_mpfb_v3.py` — same MPFB2 human, same camera, same depth mapping — and adds a
  text anchor in the head's own frame (so it rides head turns). It renders a 4-frame
  "camera drift + head turn" sequence and projects each anchor with the SAME
  `world_to_camera_view` the keypoints use, emitting `placement_record.json`.
- `draw_text_anchor.py` (ComfyUI venv python) reads the record + plates, samples the
  **depth plate** to decide occlusion (is the figure nearer than the bubble's sheet
  depth?), composites balloon + tail, restores figure ink where it is in front, and
  builds `contact_sheet.png`.

Depth is in the depth-plate's own scale (View Z Depth `[2.0, 5.5] bu → [1.0, 0.0]`,
near = 1.0), so a projected anchor's `z_norm` is directly comparable to a depth-plate
pixel — that comparison *is* the occlusion test.

## Frames
| frame | what it shows |
|---|---|
| 00 drift-left / 01 center / 02 drift-right | camera orbits ±14°; the balloon stays pinned to its speaker and its `z_norm` updates with viewpoint (0.58 → 0.60 → 0.63) |
| 03 head-turn | camera centered, head turns 30° — the balloon + tail **follow the head** (px x 0.641 → 0.552) |

## Result (verified)
- **`OVER HERE!`** — in-world dialogue, head-depth (`z_norm` ~0.60), in clear space →
  `occluded = False` in all 4 frames. Tail tracks the mouth; balloon tracks the head.
- **`BEHIND ME`** — control sheet placed behind the torso (`z_norm` ~0.40, deeper) →
  `occluded = True` in all 4 frames; the figure's ink correctly cuts across it.

The two branches of the depth test both fire, from the shared plate. ✅

## Honest limits / next
- **Parallax under pure camera drift is subtle** — the balloon is pinned to the head, so
  it moves *with* the figure across frame (correct); the visible "tracking" money-shot is
  the head-turn, and the visible depth cue is the occlusion.
- Letters here are a plain system font placeholder; the real pipeline composites the
  locked lettering (voice-specific) — this proof only demonstrates placement.
- Not yet built: emitting each text event as a transparent sheet + `z_depth` into the
  compositor's stack order; the tail as a warped drawn line ([[Move the Ink, Don't Redraw It]]);
  the two remaining placement modes (2D post-composite, hybrid-by-voice).

## Files
- `text_anchor_proof.py`, `draw_text_anchor.py` — the two halves
- `placement_record.json` / `placement_record_resolved.json` — the emitted placement data
- `frame_NN/{ink_plate,depth_plate,annotated}.png`, `contact_sheet.png`
