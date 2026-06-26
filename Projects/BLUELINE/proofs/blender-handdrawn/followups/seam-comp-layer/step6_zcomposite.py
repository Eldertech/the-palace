"""
BLUELINE seam-comp-layer PROOF — Step 6: real Z-pass occlusion composite

Run with the ComfyUI venv python (has cv2 + numpy + OpenEXR):
  OPENCV_IO_ENABLE_OPENEXR=1 _tools/ComfyUI/venv/bin/python3 step6_zcomposite.py

Reads:
  inked_plate.png   — gen-AI redrawn city (flat, no depth)  [the visible base]
  blobs_rgba.png    — authored blob layer (RGBA)            [the comp layer]
  city_depth.exr    — Blender Z of the ORIGINAL city geometry (proxy for inked plate)
  blob_depth.exr    — Blender Z of the blob billboards

Computes per-pixel occlusion:
  show_blob = (blob_Z <= city_Z)   # blob is at-or-closer than the city behind it
Multiplies the blob alpha by show_blob, then alpha-overs onto inked_plate.

Writes:
  comp_depth_v2.png        — the real-Z occluded composite
  occlusion_mask.png       — the binary mask (white = blob shown, black = occluded)
  compare_occlusion.png    — 4-up: comp_naive | comp_depth(old) | comp_depth_v2 | occlusion_mask
"""
import os
os.environ.setdefault('OPENCV_IO_ENABLE_OPENEXR', '1')
import cv2
import numpy as np

PROOF = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/seam-comp-layer"


def load_rgba(path):
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise FileNotFoundError(path)
    if img.shape[2] == 3:
        # add opaque alpha
        a = np.full(img.shape[:2] + (1,), 255, dtype=img.dtype)
        img = np.concatenate([img, a], axis=2)
    return img  # BGRA, uint8


def load_depth(path):
    d = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if d is None:
        raise FileNotFoundError(path)
    return d[:, :, 0].astype(np.float32)  # R channel = camera-space Z (metres)


# ---------------------------------------------------------------------------
inked = load_rgba(os.path.join(PROOF, "inked_plate.png"))          # BGRA
blobs = load_rgba(os.path.join(PROOF, "blobs_rgba.png"))           # BGRA
city_z = load_depth(os.path.join(PROOF, "city_depth.exr"))
blob_z = load_depth(os.path.join(PROOF, "blob_depth.exr"))

H, W = inked.shape[:2]
# sanity: all same resolution
assert blobs.shape[:2] == (H, W), f"blob size {blobs.shape[:2]} != inked {(H, W)}"
assert city_z.shape == (H, W), f"city_z {city_z.shape} != {(H, W)}"
assert blob_z.shape == (H, W), f"blob_z {blob_z.shape} != {(H, W)}"

# ---------------------------------------------------------------------------
# OCCLUSION: a blob pixel is VISIBLE when the blob is closer than (or equal to)
# the city geometry behind it. A 1% tolerance avoids z-fighting on near-coplanar.
TOL = 0.99  # blob shown if blob_z <= city_z * (1/TOL) ; i.e. allow blob slightly behind
show_blob = (blob_z <= city_z / TOL)

# Build the gated blob alpha:
blob_alpha = blobs[:, :, 3].astype(np.float32) / 255.0
gated_alpha = blob_alpha * show_blob.astype(np.float32)

# ---------------------------------------------------------------------------
# Alpha-over: out = inked*(1-a) + blob_rgb*a   (premultiplied per pixel)
inked_rgb = inked[:, :, :3].astype(np.float32)
blob_rgb = blobs[:, :, :3].astype(np.float32)
a = gated_alpha[:, :, None]
out_rgb = inked_rgb * (1.0 - a) + blob_rgb * a
out = np.clip(out_rgb, 0, 255).astype(np.uint8)

comp_v2 = os.path.join(PROOF, "comp_depth_v2.png")
cv2.imwrite(comp_v2, out)
print("wrote comp_depth_v2.png")

# Occlusion mask (white = blob shown where blob present, black = occluded/no blob)
present = blob_alpha > (30 / 255.0)
mask_vis = np.zeros((H, W), dtype=np.uint8)
mask_vis[present & show_blob] = 255          # shown
mask_vis[present & ~show_blob] = 90           # occluded (mid-grey so it's visible in the mask)
mask_path = os.path.join(PROOF, "occlusion_mask.png")
cv2.imwrite(mask_path, mask_vis)
print("wrote occlusion_mask.png")

# ---------------------------------------------------------------------------
# stats
n_present = int(present.sum())
n_shown = int((present & show_blob).sum())
n_occ = int((present & ~show_blob).sum())
print(f"blob pixels: {n_present}")
print(f"  shown (in front): {n_shown} ({n_shown/max(1,n_present)*100:.1f}%)")
print(f"  occluded (behind building): {n_occ} ({n_occ/max(1,n_present)*100:.1f}%)")

# ---------------------------------------------------------------------------
# 4-up comparison: comp_naive | comp_depth(old ink-mask) | comp_depth_v2 | occlusion_mask
def to_bgr(p):
    im = cv2.imread(p, cv2.IMREAD_COLOR)
    return im

panels = []
for name in ["comp_naive.png", "comp_depth.png", "comp_depth_v2.png"]:
    p = os.path.join(PROOF, name)
    if os.path.exists(p):
        panels.append(to_bgr(p))
# add mask as 3-channel
mask3 = cv2.cvtColor(mask_vis, cv2.COLOR_GRAY2BGR)
panels.append(mask3)

# resize each to height 520 keeping aspect, then hstack
target_h = 520
resized = []
for pan in panels:
    h, w = pan.shape[:2]
    nw = int(w * target_h / h)
    resized.append(cv2.resize(pan, (nw, target_h)))
strip = np.hstack(resized)
cmp_path = os.path.join(PROOF, "compare_occlusion.png")
cv2.imwrite(cmp_path, strip)
print("wrote compare_occlusion.png")

print("\nSTEP 6 COMPLETE")
print("Panels in compare_occlusion.png: comp_naive | comp_depth(old) | comp_depth_v2 | occlusion_mask")
