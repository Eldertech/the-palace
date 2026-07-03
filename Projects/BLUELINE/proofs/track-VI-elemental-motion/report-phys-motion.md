# Track VI — Physical Motion Bench Report

**Date:** 2026-06-26
**Bench:** BLUELINE / proofs / track-VI-elemental-motion

---

## What we tested

Does driving the ink-warp engine with a real Blender Mantaflow velocity field
produce better motion than the existing procedural layered-wave fields?

---

## Method

### Velocity source: block-matching optical flow (optical_flow path)

We chose optical flow computed from sim density frames over Blender's EXR
velocity pass because:

1. **EXR velocity pass needs OpenEXR Python bindings.** Mantaflow's internal
   velocity lives in the fluid cache, not in a standard render pass. Getting
   it out headless via compositor → EXR → numpy requires `openexr` or
   `imageio[freeimage]` which aren't installed here. The optical-flow path
   only needs numpy/scipy/PIL.

2. **We have the rendered density frames anyway.** The sim already outputs
   grayscale PNG frames at 512×512. Optical flow on those gives physically
   grounded velocity estimates.

3. **Block-matching over Horn-Schunck.** HS is a global regularizer that
   underestimates displacement on smooth low-texture regions. Block NCC
   correctly finds the dominant displacement per spatial block.

### Geometry mismatch and how we handled it

The sim renders smoke in the lower-center of a 512×512 square frame (rows
355-437, cols 171-299). The plate is portrait 1216×832, with the drawn plume
spread through the upper portion. A naive upsample of the flow field to plate
size would place the active region in the wrong part of the image.

Solution: extract two signals from the flow separately:

1. **Spatial importance map** — time-averaged flow magnitude at each pixel,
   upsampled and remapped to the plate canvas (centered horizontally, covering
   upper 65% of plate height). This defines WHERE motion happens on the plate.

2. **Temporal direction signal** — mean flow direction in the active sim region
   at each frame step, normalized to [-1, 1]. This defines WHEN and IN WHAT
   DIRECTION the ink deforms. The normalization decouples the small per-frame
   magnitude from the desired amp parameter.

The warp field is then: `dx[y,x,t] = u_norm[t] * importance[y,x] * amp`.

### Parameters

| Item | Value |
|---|---|
| Sim resolution (Mantaflow domain) | 56 |
| Rendered frame size | 512 × 512 px |
| Sim frames | 72 |
| Optical flow block size | 16 px |
| Optical flow search radius | 12 px |
| Flow output smoothing sigma | 3.0 px |
| Plate | plates/smoke.png (832 × 1216 px) |
| Warp frames | 72 |
| Warp FPS | 24 |
| Procedural mask | auto:top:0.55, feather 36, anchor base |
| Velocity mask | flow-derived importance × auto:top, feather 36, anchor base |
| Procedural amp | 6.0 px |
| Velocity amp | 20.0 px |
| Loop blend fraction | 25% (18 frames) |

---

## Results

| Metric | Procedural | Velocity-driven |
|---|---|---|
| motion_p99 (px) | 98.4 | 33.8 |
| Loop seam | seamless (exact cycles) | smooth (25% cross-fade) |
| Spatial pattern | uniform wave across mask | importance-weighted plume shape |
| Temporal character | periodic oscillation | sim-derived drift + wobble |

---

## What worked

- Block-matching optical flow correctly captures the dominant per-frame
  motion of the smoke plume (upward drift + lateral wobble) between frames.
- Extracting separate spatial and temporal signals cleanly solves the geometry
  mismatch between the sim's square-frame layout and the portrait plate.
- The importance map places the most-deformed ink region over the top of the
  plate's drawn plume, where it reads naturally.
- Loop blending at 25% smooths the seam adequately — the sim starts nearly
  empty and ends with a full plume, which is inherently non-periodic.

## What didn't work / caveats

- **Block-matching resolution is coarse.** At 512 px with 16-px blocks we
  get 32×32 flow estimates. Fine turbulence structure inside the plume is
  averaged out. The temporal signal is the mean over the active region —
  just one vector per frame, not a spatially-varied per-pixel flow.

- **Spatial importance drives the pattern, not per-pixel velocity.** The
  current approach remaps the SIM's active region to the plate canvas, but
  it doesn't match the drawn plume's detailed shape (the plate's ink marks
  the actual plume topology; the sim's density has a generic rounded form).
  A better match would use the plate itself (via its ink density) to warp
  the importance map.

- **The loop seam is better in the procedural field.** Procedural waves use
  integer cycle counts — they loop exactly at the math level. The velocity
  field relies on cross-fading, which is visible as a slight slowdown near
  the repeat point.

- **EXR velocity pass was not used.** The preferred path (true Mantaflow
  velocity → EXR → numpy) would give per-voxel 3D velocity projected to
  screen space. The wiring is in `blender/smoke_sim_vel.py` — it needs
  `pip install openexr` or `imageio[freeimage]` to complete.

---

## Recommendation

**Velocity-driven warp is worth it for topology-matched motion; not worth it
as a drop-in replacement for simple plume animation.**

When you have a plate whose drawn content closely matches the sim (e.g. a
plate drawn specifically from a Blender render reference), the sim's velocity
field gives motion that is intrinsically aligned with the ink's topology.
That's a real win over procedural waves, which are oblivious to what's drawn.

For general plume plates (like the existing smoke.png, which is a freehand
drawing), the procedural field is simpler, more controllable, and loops better.

Two next steps to make the velocity path clearly better:

1. **Use true Blender EXR velocity** (`pip install openexr`). This gives
   per-voxel velocity without optical flow approximation.

2. **Draw the plate from a Blender render reference.** If the ink drawing
   traces the sim's actual density frames, the spatial match is perfect and
   the velocity field drives exactly the right regions.

---

## Files produced

| File | Description |
|---|---|
| `renders/phys-motion/smoke_procedural/smoke_procedural.mp4` | Procedural loop |
| `renders/phys-motion/smoke_velocity/smoke_velocity.mp4` | Velocity-driven loop |
| `renders/phys-motion/smoke_procedural/smoke_procedural_anaglyph.png` | Procedural anaglyph |
| `renders/phys-motion/smoke_velocity/smoke_velocity_anaglyph.png` | Velocity anaglyph |
| `renders/phys-motion/flow_seq.npy` | Block-matching flow (T=72, 512×512×2) |
| `report-assets/phys-motion/phys_motion_compare.png` | Side-by-side board |
| `report-assets/phys-motion/importance_map.png` | Spatial importance map |
| `lib/optical_flow.py` | Block-matching flow extractor (pure numpy/scipy) |
| `blender/smoke_sim_vel.py` | Blender script with EXR velocity pass wiring |
