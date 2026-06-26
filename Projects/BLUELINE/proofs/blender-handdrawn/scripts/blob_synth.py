"""
BLUELINE — synthesize HIGH-RES ink blobs/splatter that match the measured
character from blob_analyze.py (blob-character.json). Crisp at any scale, so the
big foreground masses don't pixelate like upscaled low-res mattes.

Each blob = an irregular filled body (Fourier-boundary; raggedness driven by the
measured circularity) + satellite droplets + a directional 'thrown' spatter tail.

Output: blob-library/synth/synth_###.png  (black ink, alpha = shape)
Deps: numpy + PIL only.
"""
import json, math, os, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn"
LIB = os.path.join(ROOT, "blob-library"); OUT = os.path.join(LIB, "synth")
os.makedirs(OUT, exist_ok=True)
random.seed(5); np.random.seed(5)

try:
    CH = json.load(open(os.path.join(LIB, "blob-character.json")))
except Exception:
    CH = {}
CIRC = CH.get("circularity", {}).get("mean", 0.9)      # ~1 round, lower = ragged
CIRC_LO = CH.get("circularity", {}).get("p10", 0.42)
N = 30
S = 512                                                 # texture resolution

def boundary(cx, cy, R, ragged):
    """Closed irregular boundary via summed harmonics; ragged in [0..1]."""
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
    spiky = random.random() < 0.32                      # the ragged/spiky tail of the dist
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
    # directional 'thrown' spatter tail — specks with density falloff along one axis
    if spiky or random.random() < 0.6:
        ta = random.uniform(0, 2*math.pi)
        for _ in range(random.randint(18, 46)):
            t = random.random()
            spread = (1 - t) * R * 0.5 + 6
            dx = math.cos(ta) * t * R*3.2 + random.uniform(-spread, spread)
            dy = math.sin(ta) * t * R*3.2 + random.uniform(-spread, spread)
            pr = max(1.2, R * 0.10 * (1 - t))
            px, py = cx + dx, cy + dy
            d.ellipse([px-pr, py-pr, px+pr, py+pr], fill=255)
    # tiny crisp -> faint micro-roughen so edges read as ink, not vector
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    arr = np.asarray(img)
    arr = np.where(arr > 90, 255, 0).astype(np.uint8)   # re-threshold = crisp ink edge
    # crop to content + small pad
    ys, xs = np.where(arr > 0)
    if len(xs):
        pad = 8
        x0, x1 = max(0, xs.min()-pad), min(S, xs.max()+pad)
        y0, y1 = max(0, ys.min()-pad), min(S, ys.max()+pad)
        arr = arr[y0:y1, x0:x1]
    rgba = np.zeros((*arr.shape, 4), np.uint8)
    rgba[..., 3] = arr                                  # black ink, alpha = shape
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
print(f"synthesized {N} high-res blobs (circ~{CIRC}, spiky-tail from p10={CIRC_LO}) -> {OUT}")
