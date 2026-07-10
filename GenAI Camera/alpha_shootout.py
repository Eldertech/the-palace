#!/usr/bin/env python3
"""Alpha extraction shootout on a transparency checker — method AND prompting:
  1. default gen  -> GrabCut (seeded by silhouette)         [baseline, dark bg]
  2. default gen  -> rembg   (u2net matting model)          [no prompt change]
  3. GREEN-SCREEN prompt -> chroma key                      [prompt a flat green backdrop, key it out]
Answers: which is cleanest, and does prompting the background (green screen) help matting?

  <comfy venv>/python alpha_shootout.py [sorceress|barbarian]
"""
import os, sys, json
import numpy as np, cv2
import genai_camera as g
import rich_first as RF
from PIL import Image, ImageDraw, ImageFont, ImageFilter

DIR = g.DIR
FIG = sys.argv[1] if len(sys.argv) > 1 else "sorceress"
PROMPT = {"sorceress": "an ethereal ice sorceress in long flowing hooded robes and ornate layered fabric",
          "barbarian": "a hulking scarred barbarian warrior in a thick shaggy fur cloak and layered leather-and-iron armor"}[FIG]

d = json.load(open(os.path.join(DIR, f"keypoints_{FIG}.json"))); W, H = d["res"]; kps = d["keypoints"]
xs = [x for x, y, v in kps if v]; ys = [y for x, y, v in kps if v]
x0, y0, x1, y1 = int(min(xs)-70), int(min(ys)-80), int(max(xs)+70), int(max(ys)+90)
bw, bh = x1-x0, y1-y0; GH = 1024; GW = max(512, min(1024, (int(GH*bw/bh)//8)*8))

g.layer_pose(FIG)
def prep_rgb(name):
    im = Image.open(os.path.join(DIR, name)).convert("RGB").crop((x0, y0, x1, y1)).resize((GW, GH), Image.LANCZOS)
    p = os.path.join(DIR, "_as_" + name); im.save(p); return p, im
bp, _ = prep_rgb(f"beauty_{FIG}.png"); pp, _ = prep_rgb(f"openpose_{FIG}.png")
beauty = g.upload(bp); pose = g.upload(pp)

# green init: figure (beauty alpha) over a flat green field, so img2img has green to hold onto
b_rgba = Image.open(os.path.join(DIR, f"beauty_{FIG}.png")).convert("RGBA").crop((x0, y0, x1, y1)).resize((GW, GH))
green_init = Image.alpha_composite(Image.new("RGBA", (GW, GH), (0, 200, 60, 255)), b_rgba).convert("RGB")
gip = os.path.join(DIR, "_as_greeninit.png"); green_init.save(gip); green_up = g.upload(gip)

def kp_crop():
    return {i: (int((x-x0)*GW/bw), int((y-y0)*GH/bh)) for i, (x, y, v) in enumerate(kps) if v}
kpc = kp_crop()

def checker(sq=20):
    im = Image.new("RGB", (GW, GH), (200, 200, 206)); dr = ImageDraw.Draw(im)
    for yy in range(0, GH, sq):
        for xx in range(0, GW, sq):
            if (xx//sq + yy//sq) % 2: dr.rectangle([xx, yy, xx+sq-1, yy+sq-1], fill=(240, 240, 246))
    return im
def on_checker(rgb, alpha_L): return Image.composite(rgb, checker(), alpha_L)

# --- gens ---
genA = g._to_pil(g.run_graph(RF.fig_graph(PROMPT, beauty, pose, 21, GW, GH, 0.72))[0]).convert("RGB")
print("  genA (default) done", flush=True)
genB = g._to_pil(g.run_graph(RF.fig_graph(f"{PROMPT}, on a solid flat chroma-key green screen background, plain green backdrop",
                                          green_up, pose, 21, GW, GH, 0.72))[0]).convert("RGB")
print("  genB (green) done", flush=True)

# --- extractions ---
m1 = RF.grabcut_sharp(genA, kpc, GW, GH)                          # 1 grabcut on default
from rembg import remove, new_session
sess = new_session("u2net")
m2 = remove(genA, session=sess).split()[-1]                       # 2 rembg on default
hsv = cv2.cvtColor(np.array(genB), cv2.COLOR_RGB2HSV)             # 3 chroma key on green
green = (hsv[:, :, 0] > 35) & (hsv[:, :, 0] < 90) & (hsv[:, :, 1] > 55) & (hsv[:, :, 2] > 40)
a3 = np.where(green, 0, 255).astype(np.uint8)
a3 = cv2.morphologyEx(a3, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
a3 = cv2.morphologyEx(a3, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
m3 = Image.fromarray(a3).filter(ImageFilter.GaussianBlur(1.0))

cols = [("1 · default → GrabCut", genA, on_checker(genA, m1)),
        ("2 · default → rembg", genA, on_checker(genA, m2)),
        ("3 · GREEN prompt → chroma key", genB, on_checker(genB, m3))]

# contact sheet: per method, gen (top) + on-checker (bottom)
def font(s):
    p = "/System/Library/Fonts/Helvetica.ttc"; return ImageFont.truetype(p, s) if os.path.exists(p) else ImageFont.load_default()
TH, BH = 300, 620; pad = 10; lab = 30
cw = int(GW * BH / GH)
sheet = Image.new("RGB", (cw*3 + pad*4, TH + BH + lab*2 + pad*3), (12, 12, 18)); dr = ImageDraw.Draw(sheet)
dr.text((pad, 5), f"ALPHA shootout — {FIG} · method + prompting · top = generated (with bg), bottom = cut out on checker", font=font(15), fill=(232, 184, 74))
for i, (label, gen, oc) in enumerate(cols):
    x = pad + i*(cw+pad); tcw = int(GW*TH/GH)
    dr.rectangle([x, lab, x+cw, lab+lab], fill=(26, 26, 40)); dr.text((x+7, lab+6), label, font=font(17), fill=(232, 232, 240))
    sheet.paste(gen.resize((tcw, TH)), (x + (cw-tcw)//2, lab*2))
    sheet.paste(oc.resize((cw, BH)), (x, lab*2 + TH + pad))
out = os.path.join(DIR, "renders", "alpha_shootout.png"); sheet.save(out)

g.emit(sheet, "proof", {"prompt": f"alpha shootout · {FIG}", "denoise": 0.72, "seed": 21, "dt": 0,
        "note": f"{FIG}: GrabCut vs rembg vs green-screen-prompt+chroma-key, all on a transparency checker. Which cutout is cleanest, and does prompting a green backdrop help?"},
       [("beauty", os.path.join(DIR, f"beauty_{FIG}.png")), ("pose", os.path.join(DIR, f"openpose_{FIG}.png"))])
print("ALPHA_SHOOTOUT_DONE ->", out)
