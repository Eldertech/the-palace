#!/usr/bin/env python3
"""Alpha-mask quality check. Generate a rich costumed figure, GrabCut it (seeded by the skeleton
silhouette, adopted from BLUELINE), and show it on a transparency checkerboard so the cutout edges
are judgeable. Contact sheet: rich render · alpha mask · on checkerboard · edge zoom.

  <comfy venv>/python alpha_check.py [sorceress|barbarian]
"""
import os, sys, json
import genai_camera as g
import rich_first as RF
from PIL import Image, ImageDraw, ImageFont

DIR = g.DIR
FIG = sys.argv[1] if len(sys.argv) > 1 else "sorceress"
PROMPT = {"sorceress": "an ethereal ice sorceress in long flowing hooded robes and ornate layered fabric",
          "barbarian": "a hulking scarred barbarian warrior in a thick shaggy fur cloak and layered leather-and-iron armor"}[FIG]

d = json.load(open(os.path.join(DIR, f"keypoints_{FIG}.json"))); W, H = d["res"]; kps = d["keypoints"]
xs = [x for x, y, v in kps if v]; ys = [y for x, y, v in kps if v]
x0, y0, x1, y1 = int(min(xs)-70), int(min(ys)-80), int(max(xs)+70), int(max(ys)+90)
bw, bh = x1-x0, y1-y0; GH = 1024; GW = max(512, min(1024, (int(GH*bw/bh)//8)*8))

def prep(name):
    im = Image.open(os.path.join(DIR, name)).convert("RGB").crop((x0, y0, x1, y1)).resize((GW, GH), Image.LANCZOS)
    tp = os.path.join(DIR, "_ac_" + name); im.save(tp); return tp
g.layer_pose(FIG)   # thick controlnet_aux pose
beauty = g.upload(prep(f"beauty_{FIG}.png")); pose = g.upload(prep(f"openpose_{FIG}.png"))

def kp_crop():
    out = {}
    for i, (x, y, v) in enumerate(kps):
        if v: out[i] = (int((x-x0)*GW/bw), int((y-y0)*GH/bh))
    return out
kpc = kp_crop()

# rich costumed figure (rich-first fig graph: img2img beauty + thick pose, RICH style)
rich = g._to_pil(g.run_graph(RF.fig_graph(PROMPT, beauty, pose, 21, GW, GH, 0.72))[0]).convert("RGB")
print("  rich figure done", flush=True)
mask = RF.grabcut_sharp(rich, kpc, GW, GH)              # 'L' alpha from GrabCut-seeded-by-silhouette

def checker(W, H, sq=20):
    im = Image.new("RGB", (W, H), (200, 200, 206)); dr = ImageDraw.Draw(im)
    for yy in range(0, H, sq):
        for xx in range(0, W, sq):
            if (xx//sq + yy//sq) % 2: dr.rectangle([xx, yy, xx+sq-1, yy+sq-1], fill=(240, 240, 246))
    return im
on_checker = Image.composite(rich, checker(GW, GH), mask)
# edge zoom: head + shoulder region (top-center) enlarged on the checker
zx0, zy0 = int(GW*0.28), int(GH*0.02); zx1, zy1 = int(GW*0.72), int(GH*0.36)
zoom = on_checker.crop((zx0, zy0, zx1, zy1))

def font(s):
    p = "/System/Library/Fonts/Helvetica.ttc"
    return ImageFont.truetype(p, s) if os.path.exists(p) else ImageFont.load_default()

CH = 620; pad = 10; lab = 30
cells = [("rich render (gen bg)", rich), ("alpha mask (GrabCut)", mask.convert("RGB")),
         ("on transparency checker", on_checker), ("edge zoom · head/shoulder", zoom)]
cws = [int(im.width*CH/im.height) for _, im in cells]
sheet = Image.new("RGB", (sum(cws)+pad*(len(cells)+1), CH+lab+pad*2), (12, 12, 18))
dr = ImageDraw.Draw(sheet); f = font(20)
dr.text((pad, 6), f"ALPHA MASK check — {FIG} · GrabCut seeded by the skeleton silhouette (rich render -> cut -> on checker)", font=font(15), fill=(232, 184, 74))
x = pad
for (label, im), cw in zip(cells, cws):
    sheet.paste(im.resize((cw, CH)), (x, lab+pad))
    dr.rectangle([x, pad, x+cw, lab+pad], fill=(26, 26, 40)); dr.text((x+7, pad+6), label, font=f, fill=(232, 232, 240))
    x += cw + pad
out = os.path.join(DIR, "renders", "alpha_check.png"); sheet.save(out)

g.emit(sheet, "proof", {"prompt": f"alpha-mask check · {FIG}", "denoise": 0.72, "seed": 21, "dt": 0,
        "note": f"{FIG}: how clean is the GrabCut alpha cutout? rich render -> GrabCut-seeded-by-silhouette -> composited on a transparency checkerboard, with an edge zoom. Judge the fringing / clipped wisps."},
       [("beauty", os.path.join(DIR, f"beauty_{FIG}.png")), ("pose", os.path.join(DIR, f"openpose_{FIG}.png"))])
print("ALPHA_CHECK_DONE ->", out)
