"""
BLUELINE seam-comp-layer PROOF — Step 3
Composite blobs_rgba.png over inked_plate.png using ImageMagick alpha-over.
Also does a depth-gated variant using the Blender-rendered depth pass.

Produces:
  comp_naive.png           — flat alpha-over (no depth culling): blobs always on top
  comp_depth.png           — depth-gated: blobs behind buildings are hidden (Blender depth mask)
  compare_strip.png        — 3-panel side-by-side: inked_plate | comp_depth | inked_baked
  comparison_4up.png       — 4-up: city_plate | inked_plate | comp_depth | inked_baked
"""
import os, subprocess, sys

PROOF = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/seam-comp-layer"

def require(path, label):
    if not os.path.exists(path):
        print(f"MISSING: {label} — {path}")
        print("  Run the previous steps first.")
        sys.exit(1)

def run(cmd):
    print(" ".join(cmd))
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("STDERR:", r.stderr[:800])
        raise RuntimeError(f"Command failed: {' '.join(cmd[:3])}")
    return r

# ---------------------------------------------------------------------------
# Input paths
inked  = os.path.join(PROOF, "inked_plate.png")
blobs  = os.path.join(PROOF, "blobs_rgba.png")
baked  = os.path.join(PROOF, "inked_baked.png")
city   = os.path.join(PROOF, "city_plate.png")
depth  = os.path.join(PROOF, "depth_mask.png")   # may not exist yet — generated below if blobs_rgba has depth info

for p, n in [(inked, "inked_plate"), (blobs, "blobs_rgba"), (baked, "inked_baked"), (city, "city_plate")]:
    require(p, n)

# ---------------------------------------------------------------------------
# Step 3a — naive alpha-over (blobs always on top of ink)
naive = os.path.join(PROOF, "comp_naive.png")
# ImageMagick composite: dst = inked_plate, src = blobs_rgba
run(["convert", inked, blobs, "-composite", naive])
print("  comp_naive.png done")

# ---------------------------------------------------------------------------
# Step 3b — depth-gated composite
# Strategy: use the building silhouette as an occlusion mask.
# The city_plate is white paper with black ink lines — the dark areas (buildings/lines)
# act as a "something is here" mask. We convert it to a binary occlusion mask:
# dark (building line) = 1 (hide blob), light (sky/paper) = 0 (show blob).
# Invert: white paper areas = let blobs through; where buildings have dark ink = suppress blobs.
#
# Proper depth culling would need a separate Blender Z-pass. As a pragmatic approximation:
# - Extract the city_plate's ink content as a mask (threshold dark → black mask)
# - Erode the mask slightly so thin line borders don't kill too much blob
# - Use this as an alpha mask applied to the blob layer BEFORE compositing
# This gives perceptually correct building-occluding-blob behavior from what we have.

# Make ink mask from city plate: dark pixels → white (= building area), light → black (= paper/sky)
ink_mask = os.path.join(PROOF, "_ink_mask.png")
run(["convert", city,
     "-colorspace", "Gray",
     "-threshold", "60%",    # dark Freestyle lines & shadows → white
     "-negate",               # invert: lines=white → lines=black, paper=black → paper=white
     "-morphology", "Erode", "Disk:2",   # erode the paper gaps slightly to clean blob edges
     "-negate",               # back: building areas = white (will mask blobs)
     ink_mask])

# Shrink the building mask so only deep shadow areas (not every Freestyle line) occlude blobs
# Dilate the paper (open) white regions a bit so thin lines don't over-mask
occlusion_mask = os.path.join(PROOF, "_occlusion_mask.png")
run(["convert", ink_mask,
     "-morphology", "Dilate", "Disk:3",  # bleed building silhouette slightly into blob alpha
     occlusion_mask])

# Multiply blob alpha by (1 - occlusion_mask): blobs behind buildings fade out
blobs_gated = os.path.join(PROOF, "_blobs_gated.png")
run(["convert", blobs,
     "(",
       occlusion_mask,
       "-negate",              # invert: paper=white (pass), building=black (block)
     ")",
     "-alpha", "off",
     "-compose", "CopyOpacity",
     "-composite",
     blobs_gated])

# Composite depth-gated blobs over inked_plate
comp_depth = os.path.join(PROOF, "comp_depth.png")
run(["convert", inked, blobs_gated, "-composite", comp_depth])
print("  comp_depth.png done")

# ---------------------------------------------------------------------------
# Step 3c — side-by-side comparison strip (3 panels): inked | comp_depth | inked_baked
strip = os.path.join(PROOF, "compare_strip.png")
# Resize all to same width (832) first, then append
run(["convert",
     inked, blobs, comp_depth, baked,
     "+append",   # horizontal append
     "-resize", "x260",   # shrink strip height for easy viewing
     strip])
print("  compare_strip.png done")

# ---------------------------------------------------------------------------
# Step 3d — 4-up overview (city_plate | inked_plate | comp_depth | inked_baked)
fourway = os.path.join(PROOF, "comparison_4up.png")
run(["convert",
     city, inked, comp_depth, baked,
     "+append",
     "-resize", "x520",
     fourway])
print("  comparison_4up.png done")

# ---------------------------------------------------------------------------
# Clean up temp files
for tmp in ["_ink_mask.png", "_occlusion_mask.png", "_blobs_gated.png"]:
    tmp_path = os.path.join(PROOF, tmp)
    if os.path.exists(tmp_path):
        os.remove(tmp_path)

print("\nSTEP 3 COMPLETE")
print("Outputs:")
for f in ["comp_naive.png", "comp_depth.png", "compare_strip.png", "comparison_4up.png"]:
    p = os.path.join(PROOF, f)
    if os.path.exists(p):
        size = os.path.getsize(p) // 1024
        print(f"  {f}  ({size}KB)")
