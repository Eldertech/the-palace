"""ROUTE B v3 — SHARP INK LINES (bench run).

Strategy:
  (a) FLUX pass: add CANNY union control alongside DEPTH so generated edges
      lock to the authored ridge line, not free tonal blobs.
  (b) SDXL re-ink: push denoise to 0.80 with an aggressive LINE prompt and
      hard negatives on wash/grey/gradient.
  (c) Structure canny strength tuned (0.55) so the ridge line commits hard.

Approach tried: depth+canny dual control (FLUX) -> high-denoise SDXL re-ink.
"""
import os, sys, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, "lib"))
import podcomfy as PC, fluxcn as FX, comfy, layers as LZ, stack as ST
from PIL import Image

PL    = os.path.join(HERE, "plates")
OUT   = os.path.join(HERE, "renders", "routeB-sharp"); os.makedirs(OUT, exist_ok=True)
RA    = os.path.join(HERE, "report-assets", "routeB-sharp"); os.makedirs(RA, exist_ok=True)
SEED  = 8400
W, H  = 832, 1216

# ---- sharper SDXL re-ink prompt + negative ----------------------------------
INK_PROMPT_BASE = (
    "loose gestural black ink pen lines on bright white paper, "
    "pen and ink illustration, stark high contrast black and white, "
    "crisp dry brush strokes, visible paper texture, NO grey wash, "
    "monochrome, bold calligraphic marks, hand-drawn manga ink"
)
INK_NEG = (
    "grey wash, smooth shading, gradient, tone, watercolor wash, "
    "photorealistic, 3d render, digital painting, blurry, "
    "color, colour, low contrast, soft edges"
)

clouds_p = (
    "dramatic billowing storm clouds filling the sky, loose pen and ink, "
    "stark black crisp ink lines on white, NO grey tone, high contrast"
)
ridge_p = (
    "solid black silhouette of bare windswept hill ridge with a tiny lone figure "
    "on the crest, bold black ink shape, stark white sky, pen and ink, "
    "high contrast, NO grey wash"
)

# ---- Step 1: FLUX with depth + canny dual control --------------------------
print("[v3] uploading controls...", flush=True)
depth_n  = PC.upload(os.path.join(PL, "structure_depth.png"))
canny_n  = PC.upload(os.path.join(PL, "structure_canny.png"))

# Check if canny control type is available on this union CN
import urllib.request, ssl, json
try:
    import certifi; _CTX = ssl.create_default_context(cafile=certifi.where())
except Exception: _CTX = ssl._create_unverified_context()

def _pod_get(path, timeout=15):
    UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    pid = open("/tmp/tVI_pod_id").read().strip()
    r = urllib.request.Request(f"https://{pid}-8188.proxy.runpod.net{path}", headers={"User-Agent": UA})
    with urllib.request.urlopen(r, timeout=timeout, context=_CTX) as resp:
        return json.loads(resp.read())

try:
    info = _pod_get("/object_info/SetUnionControlNetType")
    vals = info.get("SetUnionControlNetType", {}).get("input", {}).get("required", {}).get("type", [[]])[0]
    print(f"[v3] union CN types available: {vals}", flush=True)
    has_canny   = "canny"   in vals
    has_lineart = "lineart" in vals
    has_hed     = "hed"     in vals
    # pick the sharpest available edge type
    edge_type = "canny" if has_canny else ("lineart" if has_lineart else ("hed" if has_hed else "auto"))
    print(f"[v3] using edge type: {edge_type}", flush=True)
except Exception as e:
    print(f"[v3] WARNING: could not query union types ({e}); defaulting edge_type=canny", flush=True)
    edge_type = "canny"

# Dual control: depth (scene structure) + edge (sharp lines)
controls_clouds = [
    {"type": "depth",    "image": depth_n, "strength": 0.35, "end": 0.75},
    {"type": edge_type,  "image": canny_n, "strength": 0.55, "end": 0.85},
]
controls_ridge = [
    {"type": "depth",    "image": depth_n, "strength": 0.60, "end": 0.85},
    {"type": edge_type,  "image": canny_n, "strength": 0.60, "end": 0.90},
]

print(f"[v3] FLUX clouds pass (depth+{edge_type})...", flush=True)
PC.run(FX.flux_cn(clouds_p, SEED, W, H, prefix="b3clouds", controls=controls_clouds),
       os.path.join(PL, "gen_v3_clouds_flux.png"))
print(f"[v3] FLUX ridge pass (depth+{edge_type})...", flush=True)
PC.run(FX.flux_cn(ridge_p, SEED, W, H, prefix="b3ridge", controls=controls_ridge),
       os.path.join(PL, "gen_v3_ridge_flux.png"))

# ---- Step 2: SDXL re-ink at high denoise (0.80) with LINE prompt ------------
print("[v3] SDXL re-ink: clouds (denoise=0.80)...", flush=True)
comfy.img2img(
    os.path.join(PL, "gen_v3_clouds_flux.png"),
    "dramatic storm clouds, " + INK_PROMPT_BASE,
    os.path.join(PL, "gen_v3_clouds.png"),
    seed=SEED, denoise=0.80,
    neg=INK_NEG, steps=28, cfg=7.5
)
print("[v3] SDXL re-ink: ridge (denoise=0.80)...", flush=True)
comfy.img2img(
    os.path.join(PL, "gen_v3_ridge_flux.png"),
    "black hill ridge silhouette with lone figure, " + INK_PROMPT_BASE,
    os.path.join(PL, "gen_v3_ridge.png"),
    seed=SEED, denoise=0.80,
    neg=INK_NEG, steps=28, cfg=7.5
)

# ---- Step 3: stack + still --------------------------------------------------
def build(clouds_path, ridge_path, name):
    ridge_rgb   = LZ.load_rgb(ridge_path)
    clouds_rgb  = LZ.load_rgb(clouds_path)
    ridge_mask  = LZ.solid_silhouette(ridge_rgb, dark=0.5, touch="bottom", dilate=2)
    front       = LZ.rgba(ridge_rgb,  LZ.sharpen_alpha(ridge_mask, 0.8))
    back        = LZ.rgba(clouds_rgb, np.ones((H, W), np.float32))
    specs = [
        {"rgba": back,  "field": "sky",  "amp": 1.6, "label": f"back · clouds ({name})"},
        {"rgba": front, "field": None,               "label": f"front · ridge ({name})"},
    ]
    outdir = os.path.join(OUT, name); os.makedirs(outdir, exist_ok=True)
    frames = ST.render_stack(specs, frames=60)
    ST.write_loop(frames, outdir, f"routeB_sharp_{name}")
    ST.matte_board(specs, os.path.join(RA, f"routeB_sharp_{name}_mattes.png"),
                   labels=[s["label"] for s in specs])
    still_path = os.path.join(outdir, "still.png")
    Image.fromarray((np.clip(frames[0], 0, 1) * 255).astype(np.uint8)).save(still_path)
    print(f"  built {name}: ridge_cover={100*ridge_mask.mean():.1f}%  -> {outdir}", flush=True)
    return still_path

print("[v3] stacking layers...", flush=True)
still_flux = build(os.path.join(PL, "gen_v3_clouds_flux.png"),
                   os.path.join(PL, "gen_v3_ridge_flux.png"), "flux")
still_ink  = build(os.path.join(PL, "gen_v3_clouds.png"),
                   os.path.join(PL, "gen_v3_ridge.png"), "ink")

# ---- Step 4: before/after board (wash vs sharp) -----------------------------
print("[v3] building before/after board...", flush=True)
import board as BD
before_still = os.path.join(HERE, "renders", "sky_generate_v2_ink", "still.png")
board_path = os.path.join(RA, "routeB_before_after.png")
BD.grid(
    rows=[[
        ("BEFORE — v2 wash (denoise=0.55)", before_still, "depth-only FLUX + soft SDXL"),
        (f"AFTER — v3 sharp (denoise=0.80, {edge_type})", still_ink, f"depth+{edge_type} FLUX + line SDXL"),
    ]],
    title="ROUTE B — wash vs crisp pen lines",
    out=board_path,
    cell_w=420,
)
print(f"  board -> {board_path}", flush=True)

print("ROUTE_B3_SHARP_DONE", flush=True)
