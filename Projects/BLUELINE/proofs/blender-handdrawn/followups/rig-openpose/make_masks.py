"""
Figure Rig — per-figure MASKS from a color-ID plate (Route B input). Each figure was rendered a
distinct flat hue (multi_figure_rig.IDPAL); this thresholds the color-ID plate by hue-distance to
write one white-on-black mask per figure, for ConditioningSetMask regional conditioning.

  _tools/ComfyUI/venv/bin/python3 make_masks.py <scene_dir> <n_figures>
Writes <scene_dir>/masks/mask_<i>.png  (i in figure order = IDPAL order)
"""
import sys, os
import numpy as np
from PIL import Image

# must match multi_figure_rig.IDPAL (0-255)
IDPAL = [(217, 31, 31), (31, 115, 217), (38, 191, 77), (217, 166, 26),
         (166, 51, 191), (51, 191, 191), (217, 102, 38), (115, 115, 217)]

scene_dir = sys.argv[1]
n = int(sys.argv[2])
cid = Image.open(os.path.join(scene_dir, "colorid_plate.png")).convert("RGB")
arr = np.asarray(cid).astype(np.float32)
mdir = os.path.join(scene_dir, "masks"); os.makedirs(mdir, exist_ok=True)

# nearest-hue classification (gamma-invariant): each SATURATED pixel -> closest palette colour.
# gate on chroma, not brightness — the floor renders white and the sky black; only figures have hue.
chroma = arr.max(axis=2) - arr.min(axis=2)
fg = chroma > 40                                          # saturated -> a figure (excludes white floor + black sky)
dists = np.stack([np.sqrt(((arr - np.array(IDPAL[i % len(IDPAL)], dtype=np.float32)) ** 2).sum(2))
                  for i in range(n)], axis=0)             # (n, H, W)
nearest = dists.argmin(0)                                 # (H, W)

for i in range(n):
    mask = ((nearest == i) & fg).astype(np.uint8) * 255
    cov = float((mask > 0).mean())
    Image.fromarray(mask, "L").save(os.path.join(mdir, f"mask_{i}.png"))
    print(f"  mask_{i}  hue={IDPAL[i%len(IDPAL)]}  coverage={cov*100:.1f}%")
print("MASKS_DONE", scene_dir)
