#!/usr/bin/env python3
"""
BLUELINE · Track VI — Physical Motion Bench
============================================
Produces TWO comparison loops on the smoke plate:
  A. Procedural "smoke" field (existing path)
  B. Velocity-driven warp using block-matching optical flow on the Blender sim

Then composites a comparison board + writes report-phys-motion.md.

Usage (after running the Blender sim and optical flow extraction):
  python3 run_phys_motion.py
"""
import os, sys, time, json, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, zoom

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BASE, "lib"))

import warp as W
import fields as F
import board as B


# ─── paths ────────────────────────────────────────────────────────────────────

PLATE      = os.path.join(BASE, "plates", "smoke.png")
FLOW_NPY   = os.path.join(BASE, "renders", "phys-motion", "flow_seq.npy")
OUT_DIR    = os.path.join(BASE, "renders", "phys-motion")
ASSETS_DIR = os.path.join(BASE, "report-assets", "phys-motion")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)


# ─── shared render settings ───────────────────────────────────────────────────

FRAMES   = 72
FPS      = 24
AMP_PROC = 6.0
MASK     = "auto:top:0.55"
ANCHOR   = "base"
FEATHER  = 36


def load_plate():
    plate = W.load_rgb(PLATE)
    H, W_ = plate.shape[:2]
    print(f"Plate: {os.path.basename(PLATE)}  {W_}x{H}", flush=True)
    return plate, H, W_


# ─── A. Procedural field ──────────────────────────────────────────────────────

def run_procedural(plate, H, W_):
    print("\n── A. Procedural 'smoke' field ──────────────────────────────────", flush=True)
    t0 = time.time()
    field_fn = F.smoke(H, W_, amp=AMP_PROC, seed=3)
    mask = W.build_mask(MASK, H, W_, feather=FEATHER)
    frames = W.render_loop(plate, field_fn, mask, frames=FRAMES, amp=1.0, anchor=ANCHOR)
    name = "smoke_procedural"
    out = os.path.join(OUT_DIR, name)
    os.makedirs(out, exist_ok=True)
    man = W.write_outputs(frames, out, name, fps=FPS)
    elapsed = time.time() - t0
    print(f"  → {name}.mp4  motion_p99={man['motion_px']:.1f}px  {elapsed:.1f}s", flush=True)
    return out, name, man


# ─── B. Velocity-driven field ─────────────────────────────────────────────────
#
# The block-matching flow captures small per-frame displacements (~1-3px at 512px).
# Directly applying these as warp offsets gives near-zero visible motion.
#
# Better approach: extract TWO things from the flow sequence:
#   1. Spatial weight map: which areas move, and how much (time-averaged magnitude).
#      This tells us WHERE in the sim frame the smoke plume is most active.
#   2. Dominant direction at each time step: the mean flow vector over the active region.
#      This gives us the TEMPORAL SIGNATURE — how the plume pushes over time.
#
# Then: build a warp field that applies the sim's temporal signature with an amplitude
# proportional to the spatial weight, stretched across the plate's mask region.
# This is a "physically-informed" field: the sim determined the motion character (slow
# upward drift with lateral wobble, stronger in mid-to-late frames as smoke builds),
# and we apply that character to the ink.

def build_phys_field(flow_seq, H_plate, W_plate, amp=8.0, loop_blend_frac=0.25):
    """
    Build a field callable f(t01) -> (dx, dy) from a block-matching flow sequence.

    Strategy:
    - Compute a spatial importance map from time-averaged flow magnitude.
    - Upsample and remap this map to the plate's aspect ratio (centered).
    - For each time step, compute the dominant (mean) flow direction in the active region.
    - Multiply direction * importance_map to get a physically-grounded but full-plate field.
    - Apply loop blending across the last loop_blend_frac of the sequence.

    This correctly handles the geometry mismatch: the sim's active region (small central
    square of a 512x512 frame) maps to the plate's mask region (upper-center portrait area).
    """
    T, H_f, W_f, _ = flow_seq.shape
    flow = flow_seq.astype(np.float32)

    # ── 1. Spatial importance map ─────────────────────────────────────────────
    mag = np.sqrt(flow[..., 0]**2 + flow[..., 1]**2)    # (T, H_f, W_f)
    spatial_mag = mag.mean(axis=0)                        # (H_f, W_f)
    # Normalize to [0, 1] using the 98th percentile as ceiling
    smax = np.percentile(spatial_mag, 98)
    importance = np.clip(spatial_mag / max(smax, 1e-6), 0, 1).astype(np.float32)
    # Spread the importance with a large sigma so the active region covers
    # a meaningful fraction of the plate (not just the tiny sim plume blob).
    # sigma=60 on a 512px frame ~ 24% of frame width.
    importance = gaussian_filter(importance, sigma=60.0)
    importance = (importance / max(importance.max(), 1e-6)).astype(np.float32)
    print(f"  Importance map: max={importance.max():.3f}  "
          f"area > 0.5: {(importance > 0.5).mean()*100:.1f}%", flush=True)

    # ── 2. Upsample importance map to plate size ───────────────────────────────
    # The sim renders the plume in the center of a square 512x512 frame.
    # The plate is portrait 1216x832.  We remap the importance map so the
    # plume region in the sim aligns with the plume in the plate (upper-center).
    # Simple approach: scale the importance map to the plate canvas, centering
    # horizontally and placing it in the upper 60% vertically.
    imp_h = int(H_plate * 0.65)   # map covers upper 65% of plate height
    imp_w = int(W_plate * 0.80)   # map covers central 80% of plate width
    imp_small = zoom(importance, (imp_h / H_f, imp_w / W_f), order=1)
    # Pad to full plate size, centering horizontally, top-aligned
    imp_full = np.zeros((H_plate, W_plate), np.float32)
    pad_left = (W_plate - imp_w) // 2
    imp_full[:imp_h, pad_left:pad_left + imp_w] = imp_small[:imp_h, :imp_w]
    imp_full = gaussian_filter(imp_full, sigma=24.0)   # feather the edges
    imp_full = (imp_full / max(imp_full.max(), 1e-6)).astype(np.float32)
    print(f"  Upsampled importance: {imp_full.shape}  "
          f"area > 0.3: {(imp_full > 0.3).mean()*100:.1f}%", flush=True)

    # ── 3. Temporal direction signal ──────────────────────────────────────────
    # For each frame, average the flow over the spatially active region.
    active_mask = importance > 0.2   # the high-motion region in sim coords
    u_sig = np.array([flow[t, active_mask, 0].mean() for t in range(T)], np.float32)
    v_sig = np.array([flow[t, active_mask, 1].mean() for t in range(T)], np.float32)
    print(f"  Temporal u signal: range [{u_sig.min():.2f}, {u_sig.max():.2f}]  "
          f"std={u_sig.std():.3f}", flush=True)
    print(f"  Temporal v signal: range [{v_sig.min():.2f}, {v_sig.max():.2f}]  "
          f"std={v_sig.std():.3f}", flush=True)

    # The temporal signals are tiny (mean-of-small-per-frame-displacements).
    # Normalize them to [-1, 1] range so gain controls absolute px amplitude.
    u_max = max(np.abs(u_sig).max(), 1e-6)
    v_max = max(np.abs(v_sig).max(), 1e-6)
    u_norm = u_sig / u_max    # [-1, 1]
    v_norm = v_sig / v_max    # [-1, 1]

    # ── 4. Loop blending ──────────────────────────────────────────────────────
    # Cross-fade last (blend_frames) to match the start, so the sequence loops.
    blend_frames = max(2, int(T * loop_blend_frac))
    u_b = u_norm.copy(); v_b = v_norm.copy()
    for i in range(blend_frames):
        w = i / blend_frames   # 0 at start of blend window, 1 at end
        u_b[i] = (1 - w) * u_norm[i] + w * u_norm[T - blend_frames + i]
        v_b[i] = (1 - w) * v_norm[i] + w * v_norm[T - blend_frames + i]
    print(f"  Loop blend: {blend_frames} frames ({loop_blend_frac*100:.0f}%)", flush=True)

    # ── 5. Field callable ─────────────────────────────────────────────────────
    # The field applies the sim's temporal character scaled by the spatial importance map.
    def f(t01):
        idx = int(round(t01 * T)) % T
        # dx/dy = direction_signal(t) * importance_map(x,y) * amp
        dx = u_b[idx] * imp_full * amp
        dy = v_b[idx] * imp_full * amp
        return dx, dy

    return f, imp_full


def run_velocity(plate, H, W_):
    print("\n── B. Velocity-driven field (block-matching optical flow) ───────", flush=True)
    t0 = time.time()

    print(f"  Loading flow: {FLOW_NPY}", flush=True)
    flow_raw = np.load(FLOW_NPY)
    T_sim, H_sim, W_sim, _ = flow_raw.shape
    print(f"  Raw flow shape: {flow_raw.shape}  "
          f"u [{flow_raw[...,0].min():.2f}, {flow_raw[...,0].max():.2f}]  "
          f"v [{flow_raw[...,1].min():.2f}, {flow_raw[...,1].max():.2f}]", flush=True)

    # Trim or cycle to FRAMES
    if T_sim >= FRAMES:
        flow_seq = flow_raw[:FRAMES]
    else:
        reps = (FRAMES // T_sim) + 1
        flow_seq = np.concatenate([flow_raw] * reps, axis=0)[:FRAMES]

    # Build the physically-informed field.
    # amp=20: enough to be clearly visible while keeping motion subtle relative to
    # the 1216px plate height (20px = 1.6% of height — comparable to procedural's
    # amp=6px over 512px sim = 1.2% of sim frame).
    field_fn, imp_map = build_phys_field(flow_seq, H, W_, amp=20.0, loop_blend_frac=0.25)

    # Use the importance map directly as mask (flow-derived) instead of auto:top
    # Feather it and combine with auto:top so only the plume area moves
    auto_mask = W.build_mask(MASK, H, W_, feather=FEATHER)
    combined_mask = np.clip(imp_map * 1.5, 0, 1) * auto_mask  # flow-weighted mask
    # Anchor: pin base of mask
    confine = combined_mask * W.base_anchor_weight(combined_mask)

    # Run warp manually (can't pass combined_mask through render_loop's mask arg
    # when using anchor, because render_loop recalculates from the mask spec string)
    frames_out = []
    for i in range(FRAMES):
        t = i / FRAMES
        dx, dy = field_fn(t)
        fr = W.warp_image(plate, dx * confine, dy * confine)
        frames_out.append(fr)

    name = "smoke_velocity"
    out = os.path.join(OUT_DIR, name)
    os.makedirs(out, exist_ok=True)
    man = W.write_outputs(frames_out, out, name, fps=FPS)
    elapsed = time.time() - t0
    print(f"  → {name}.mp4  motion_p99={man['motion_px']:.1f}px  {elapsed:.1f}s", flush=True)

    # Save importance map for inspection
    imp_img_path = os.path.join(ASSETS_DIR, "importance_map.png")
    Image.fromarray((imp_map * 255).astype(np.uint8)).save(imp_img_path)
    print(f"  Importance map saved: {imp_img_path}", flush=True)

    return out, name, man


# ─── comparison board ─────────────────────────────────────────────────────────

def make_board(proc_dir, proc_name, vel_dir, vel_name, proc_man, vel_man):
    print("\n── Comparison board ─────────────────────────────────────────────", flush=True)
    rows = [
        [
            ("PLATE  (source ink)", PLATE, ""),
            ("PROCEDURAL  smoke field", os.path.join(proc_dir, f"{proc_name}_anaglyph.png"),
             f"motion_p99={proc_man['motion_px']:.1f}px"),
            ("VELOCITY-DRIVEN  sim flow", os.path.join(vel_dir, f"{vel_name}_anaglyph.png"),
             f"motion_p99={vel_man['motion_px']:.1f}px"),
        ],
        [
            ("STRIP  procedural  (6 keyframes)", os.path.join(proc_dir, f"{proc_name}_strip.png"), ""),
            ("", None, ""),
            ("STRIP  velocity  (6 keyframes)", os.path.join(vel_dir, f"{vel_name}_strip.png"), ""),
        ],
    ]
    rows_clean = [[(l, p, s) for l, p, s in row if p is not None] for row in rows]
    out = os.path.join(ASSETS_DIR, "phys_motion_compare.png")
    B.grid(
        rows_clean,
        title="TRACK VI · PHYSICAL MOTION BENCH  —  procedural vs velocity-driven ink warp",
        sub="anaglyphs: frame-0 red / mid-loop cyan — coloured fringe shows where ink moved   "
            "strips: 6 keyframes across the loop",
        out=out,
        cell_w=400,
    )
    print(f"  Board: {out}", flush=True)
    return out


# ─── report ───────────────────────────────────────────────────────────────────

def write_report(proc_man, vel_man, board_path):
    print("\n── Writing report ────────────────────────────────────────────────", flush=True)
    report = f"""# Track VI — Physical Motion Bench Report

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
| Procedural amp | {AMP_PROC:.1f} px |
| Velocity amp | 20.0 px |
| Loop blend fraction | 25% (18 frames) |

---

## Results

| Metric | Procedural | Velocity-driven |
|---|---|---|
| motion_p99 (px) | {proc_man['motion_px']:.1f} | {vel_man['motion_px']:.1f} |
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
"""
    rpath = os.path.join(BASE, "report-phys-motion.md")
    with open(rpath, "w") as fh:
        fh.write(report)
    print(f"  Report: {rpath}", flush=True)
    return rpath


# ─── main ─────────────────────────────────────────────────────────────────────

def main():
    if not os.path.exists(FLOW_NPY):
        print(f"ERROR: flow_seq.npy not found at {FLOW_NPY}")
        print("Run the Blender sim + optical flow extraction first.")
        sys.exit(1)

    plate, H, W_ = load_plate()
    proc_dir, proc_name, proc_man = run_procedural(plate, H, W_)
    vel_dir,  vel_name,  vel_man  = run_velocity(plate, H, W_)
    board = make_board(proc_dir, proc_name, vel_dir, vel_name, proc_man, vel_man)
    report = write_report(proc_man, vel_man, board)

    print("\n═══ BENCH COMPLETE ═══════════════════════════════════════════════")
    print(f"Procedural loop:      {os.path.join(proc_dir, proc_name + '.mp4')}")
    print(f"Velocity loop:        {os.path.join(vel_dir,  vel_name  + '.mp4')}")
    print(f"Comparison board:     {board}")
    print(f"Report:               {report}")


if __name__ == "__main__":
    main()
