"""
BLUELINE flow-field proof — LOCAL higher-spiky synth set.
Copy of ../../scripts/blob_synth.py with two changes:
  - SPIKY_FRAC raised 0.32 -> 0.70 (more thrown tails)
  - directional tail made longer/denser and ALWAYS present on spiky blobs
Outputs to a LOCAL synth dir, leaving the canonical blob-library untouched.

Output: followups/flowfield-spatter/synth/synth_###.png  (black ink, alpha = shape)
Deps: numpy + PIL only.  Run with system python3 (NOT Blender).
"""
import json, math, os, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn"
LIB  = os.path.join(ROOT, "blob-library")                 # read character only
HERE = os.path.join(ROOT, "followups", "flowfield-spatter")
OUT  = os.path.join(HERE, "synth")                        # LOCAL output (no canon write)
os.makedirs(OUT, exist_ok=True)
random.seed(5); np.random.seed(5)

try:
    CH = json.load(open(os.path.join(LIB, "blob-character.json")))
except Exception:
    CH = {}
CIRC    = CH.get("circularity", {}).get("mean", 0.9)
CIRC_LO = CH.get("circularity", {}).get("p10", 0.42)
N = 30
S = 512

SPIKY_FRAC = 0.70   # was 0.32 — far more thrown-tail blobs for legible direction

def boundary(cx, cy, R, ragged):
    pts = []
    K = random.randint(3, 7)
    amps = [ragged * random.uniform(0.05, 0.34) / k for k in range(1, K + 1)]
    phis = [random.uniform(0, 2*math.pi) for _ in range(K)]
    for i in range(72):
        th = 2 * math.pi * i / 72
        rr = 1.0 + sum(amps[k-1] * math.cos(k*th + phis[k-1]) for k in range(1, K+1))
        rr = max(0.35, rr)
        pts.append((cx + math.cos(th)*R*rr, cy + math.sin(th)*R*rr))
    return pts

def make_blob(idx):
    img = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(img)
    spiky = random.random() < SPIKY_FRAC
    ragged = random.uniform(0.7, 1.25) if spiky else random.uniform(0.12, 0.4)
    R = random.uniform(S*0.16, S*0.26)
    cx = cy = S/2 + random.uniform(-S*0.05, S*0.05)
    d.polygon(boundary(cx, cy, R, ragged), fill=255)
    # satellite droplets hugging the body
    for _ in range(random.randint(2, 6)):
        a = random.uniform(0, 2*math.pi); dist = R * random.uniform(0.9, 1.5)
        sx, sy = cx + math.cos(a)*dist, cy + math.sin(a)*dist
        sr = R * random.uniform(0.08, 0.28)
        d.ellipse([sx-sr, sy-sr, sx+sr, sy+sr], fill=255)
    # directional 'thrown' spatter tail — ALWAYS on spiky blobs, longer + denser.
    # Tail thrown along +X (texture local right) so the placement rotation aligns
    # the tail with the flow-field angle. (canonical used a random axis ta.)
    if spiky or random.random() < 0.6:
        ta = 0.0 if spiky else random.uniform(-0.5, 0.5)   # spiky -> tail along +X
        TAIL_LEN = R * (4.2 if spiky else 3.0)             # longer than canonical (3.2R)
        count = random.randint(34, 70) if spiky else random.randint(18, 40)
        for _ in range(count):
            t = random.random()
            spread = (1 - t) * R * 0.42 + 5
            dx = math.cos(ta) * t * TAIL_LEN + random.uniform(-spread, spread)
            dy = math.sin(ta) * t * TAIL_LEN + random.uniform(-spread*0.55, spread*0.55)
            pr = max(1.2, R * 0.11 * (1 - t))
            px, py = cx + dx, cy + dy
            d.ellipse([px-pr, py-pr, px+pr, py+pr], fill=255)
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    arr = np.asarray(img)
    arr = np.where(arr > 90, 255, 0).astype(np.uint8)
    ys, xs = np.where(arr > 0)
    if len(xs):
        pad = 8
        x0, x1 = max(0, xs.min()-pad), min(S, xs.max()+pad)
        y0, y1 = max(0, ys.min()-pad), min(S, ys.max()+pad)
        arr = arr[y0:y1, x0:x1]
    rgba = np.zeros((*arr.shape, 4), np.uint8)
    rgba[..., 3] = arr
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, f"synth_{idx:03d}.png"))

for i in range(N):
    make_blob(i)

# contact sheet
cell = 120; cols = 6; rows = (N + cols - 1)//cols
sheet = Image.new("RGB", (cols*cell, rows*cell), (255, 255, 255))
for i in range(N):
    im = Image.open(os.path.join(OUT, f"synth_{i:03d}.png"))
    bg = Image.new("RGB", im.size, (255, 255, 255)); bg.paste(im, (0, 0), im)
    bg.thumbnail((cell-10, cell-10))
    r, q = divmod(i, cols); sheet.paste(bg, (q*cell+5, r*cell+5))
sheet.save(os.path.join(OUT, "contact.png"))
print(f"synthesized {N} HIGHER-SPIKY blobs (spiky_frac={SPIKY_FRAC}, tail along +X) -> {OUT}")
