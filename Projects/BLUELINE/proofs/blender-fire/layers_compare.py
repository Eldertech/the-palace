#!/usr/bin/env python3
"""
BLUELINE — split-image-to-layers: three segmentation approaches compared.

  A) authored      — hand-drawn boxes/ellipses per element
  B) SAM-auto      — Segment Anything, automatic everything-masks
  C) SAM-prompted  — SAM with a box prompt per element

Each produces a set of layer masks for shot 02; this renders a coloured overlay + per-layer thumbs
for each approach and writes a reviewable HTML page (renders/layers/compare.html).

  <comfy venv>/python layers_compare.py
"""
import os, base64, json
import numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__)); REND = os.path.join(HERE, "renders")
OUT = os.path.join(REND, "layers"); os.makedirs(OUT, exist_ok=True)
SHOT = os.path.join(HERE, "..", "new-story", "out", "02_hero-on-sedan-pointing.png")
shot = cv2.imread(SHOT); H, W = shot.shape[:2]

COLORS = {"building_L": (180, 130, 70), "building_R": (210, 160, 100), "car_L": (120, 200, 60),
          "car_R": (150, 220, 90), "fire": (40, 90, 255), "person": (200, 80, 220),
          "crowd_L": (200, 200, 80), "crowd_R": (200, 220, 110)}

def colored_overlay(masks):
    ov = shot.astype(np.float32)
    for name, m in masks.items():
        col = np.array(COLORS.get(name, (200, 200, 200)), np.float32)
        a = (m > 0).astype(np.float32)[..., None] * 0.42
        ov = ov * (1 - a) + col[None, None, :] * a
    return ov.astype(np.uint8)

def b64(img_bgr, w=300):
    h = int(img_bgr.shape[0] * w / img_bgr.shape[1])
    im = cv2.resize(img_bgr, (w, h))
    return "data:image/png;base64," + base64.b64encode(cv2.imencode(".png", im)[1]).decode()

def layer_thumb(name, m):
    """extracted layer on a checker-ish dark bg"""
    bg = np.full_like(shot, 28)
    a = (m > 0).astype(np.float32)[..., None]
    return (shot.astype(np.float32) * a + bg * (1 - a)).astype(np.uint8)

# ---------- A) authored ----------
def authored():
    def box(x0, y0, x1, y1):
        m = np.zeros((H, W), np.uint8); cv2.rectangle(m, (int(x0 * W), int(y0 * H)), (int(x1 * W), int(y1 * H)), 255, -1); return m
    def ell(parts):
        m = np.zeros((H, W), np.uint8)
        for cx, cy, rx, ry in parts:
            cv2.ellipse(m, (int(cx * W), int(cy * H)), (int(rx * W), int(ry * H)), 0, 0, 360, 255, -1)
        return m
    M = {"building_L": box(0.0, 0.12, 0.22, 0.50), "building_R": box(0.72, 0.12, 1.0, 0.56),
         "car_L": box(0.02, 0.30, 0.40, 0.44), "car_R": box(0.55, 0.30, 0.98, 0.44),
         "fire": ell([(0.45, 0.13, 0.28, 0.15), (0.52, 0.30, 0.28, 0.17), (0.62, 0.18, 0.20, 0.15)])}
    p = cv2.imread(os.path.join(REND, "hero_mask_feather.png"), 0)
    M["person"] = ((p > 120).astype(np.uint8) * 255)
    return M

APPROACHES = {"A · authored": authored()}

# ---------- B/C) SAM (added if available) ----------
try:
    from ultralytics import SAM
    _sam = SAM("mobile_sam.pt")
    # box prompts per element (x0,y0,x1,y1 in px)
    def px(x0, y0, x1, y1): return [int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H)]
    PROMPTS = {"building_L": px(0.0, 0.12, 0.22, 0.50), "building_R": px(0.72, 0.12, 1.0, 0.56),
               "car_L": px(0.02, 0.30, 0.40, 0.44), "car_R": px(0.55, 0.30, 0.98, 0.44),
               "person": px(0.40, 0.42, 0.62, 0.95), "fire": px(0.24, 0.0, 0.76, 0.46)}
    Mp = {}
    for name, bb in PROMPTS.items():
        r = _sam(SHOT, bboxes=[bb], verbose=False)
        mk = r[0].masks.data[0].cpu().numpy().astype(np.uint8) * 255 if r[0].masks is not None else np.zeros((H, W), np.uint8)
        Mp[name] = cv2.resize(mk, (W, H))
    APPROACHES["C · SAM-prompted"] = Mp

    ra = _sam(SHOT, verbose=False)                              # automatic everything-masks
    Ma = {}
    if ra[0].masks is not None:
        for i, mk in enumerate(ra[0].masks.data.cpu().numpy()):
            Ma["seg_%02d" % i] = cv2.resize((mk * 255).astype(np.uint8), (W, H))
    APPROACHES["B · SAM-auto"] = Ma
    print("SAM approaches added")
except Exception as e:
    print("SAM not available yet:", repr(e)[:160])

# ---------- render + HTML ----------
order = ["A · authored", "B · SAM-auto", "C · SAM-prompted"]
cards = []
for key in order:
    if key not in APPROACHES: continue
    masks = APPROACHES[key]
    ov = colored_overlay(masks)
    cv2.imwrite(os.path.join(OUT, "overlay_%s.png" % key[0]), ov)
    thumbs = "".join(f'<figure><img src="{b64(layer_thumb(n, m), 150)}"><figcaption>{n}</figcaption></figure>'
                     for n, m in list(masks.items())[:12])
    cards.append(f'<section><h2>{key}</h2><div class="row"><img class="big" src="{b64(ov, 360)}">'
                 f'<div class="thumbs">{thumbs}</div></div></section>')

html = f"""<!doctype html><meta charset=utf-8><title>split-to-layers — compare</title>
<style>
body{{background:#15161a;color:#e9e7e2;font-family:ui-monospace,Menlo,monospace;margin:24px;}}
h1{{font-family:Anton,Impact,sans-serif;font-weight:400;letter-spacing:.03em}}
section{{border:1px solid #2c2e36;border-radius:10px;padding:14px;margin:16px 0;background:#1b1d22}}
h2{{color:#e0a83a;margin:.2em 0 .6em}}
.row{{display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap}}
.big{{border:1px solid #2c2e36;border-radius:6px}}
.thumbs{{display:flex;flex-wrap:wrap;gap:8px;max-width:640px}}
figure{{margin:0;text-align:center}} figcaption{{font-size:11px;color:#8b8d96;margin-top:3px}}
img{{display:block}} .src{{max-width:300px;border:1px solid #2c2e36;border-radius:6px}}
</style>
<h1>Split image to layers — three approaches</h1>
<p>shot 02 · each colour is a layer cel · each cel would be LaMa-infilled where the front layers cover it
(person infill already proven → <code>clean_plate.png</code>).</p>
<img class="src" src="{b64(shot, 300)}"><p style="color:#8b8d96">source</p>
{''.join(cards)}
"""
open(os.path.join(OUT, "compare.html"), "w").write(html)
print("WROTE", os.path.join(OUT, "compare.html"), "| approaches:", list(APPROACHES.keys()))
