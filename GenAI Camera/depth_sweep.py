#!/usr/bin/env python3
"""
Characterization sweep: figure DEPTH-strength vs clothing freedom (pose held at 0.9).

Isolates the one dial. Same figure / prompt / seed / denoise; only the figure's depth ControlNet
strength changes: 0.0 (pose-only, max costume) -> 0.8 (depth locks the nude). One labeled contact
sheet lands on the scroll so the whole range reads at a glance.

  <comfy venv>/python depth_sweep.py [figure_name]   (default: sorceress)
"""
import os, sys, json
import genai_camera as g
from PIL import Image, ImageDraw, ImageFont

DIR = g.DIR
FIG = sys.argv[1] if len(sys.argv) > 1 else "sorceress"
PROMPT = {"sorceress": "an ethereal ice sorceress in long flowing hooded robes and ornate layered fabric",
          "barbarian": "a hulking scarred barbarian warrior in a thick shaggy fur cloak and layered leather-and-iron armor"}.get(FIG, "a figure in dramatic costume")
STRENGTHS = [0.0, 0.15, 0.30, 0.45, 0.60, 0.80]
SEED, DENOISE = 21, 0.9

def font(sz):
    for p in ("/System/Library/Fonts/Helvetica.ttc", "/System/Library/Fonts/Supplemental/Arial.ttf"):
        if os.path.exists(p):
            try: return ImageFont.truetype(p, sz)
            except Exception: pass
    return ImageFont.load_default()

def fig_bbox(kp_json):
    d = json.load(open(kp_json)); W, H = d["res"]
    pts = [(x, y) for x, y, v in d["keypoints"] if v]
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys); w, h = x1-x0, y1-y0
    return (max(0, x0-w*0.7), max(0, y0-h*0.18), min(W, x1+w*0.7), min(H, y1+h*0.4))

def main():
    beauty = g.upload(os.path.join(DIR, f"beauty_{FIG}.png"))
    depth  = g.upload(os.path.join(DIR, f"depth_{FIG}.png"))
    pose   = g.upload(g.layer_pose(FIG))
    box = fig_bbox(os.path.join(DIR, f"keypoints_{FIG}.json"))

    crops = []
    for X in STRENGTHS:
        cns = [{"type": "pose", "image_fn": pose, "strength": 0.9, "end": 0.85}]
        if X > 0: cns = [{"type": "depth", "image_fn": depth, "strength": X, "end": 0.85}] + cns
        im, dt = g._to_pil(g.run_graph(g.build_graph(beauty, PROMPT, DENOISE, SEED, 8, cns))[0]), 0
        crops.append((X, im.crop(tuple(map(int, box)))))
        print(f"  depth {X:.2f} done", flush=True)

    # contact sheet: 3 cols x 2 rows, label bar per cell
    CH = 460; pad = 10; lab = 34; cols = 3
    cw = int(crops[0][1].width * CH / crops[0][1].height)
    rows = (len(crops) + cols - 1) // cols
    W = cols*cw + (cols+1)*pad; H = rows*(CH+lab) + (rows+1)*pad
    sheet = Image.new("RGB", (W, H), (12, 12, 18)); dr = ImageDraw.Draw(sheet); f = font(24); ft = font(16)
    dr.text((pad, 2), f"figure DEPTH strength sweep — {FIG} · pose held 0.9 · denoise {DENOISE} · seed {SEED}", font=ft, fill=(232, 184, 74))
    for i, (X, im) in enumerate(crops):
        r, c = divmod(i, cols)
        x = pad + c*(cw+pad); y = pad + lab + r*(CH+lab+pad)
        sheet.paste(im.resize((cw, CH)), (x, y))
        dr.rectangle([x, y-lab, x+cw, y], fill=(26, 26, 40))
        tag = "pose only" if X == 0 else f"depth {X:.2f}"
        dr.text((x+8, y-lab+7), tag, font=f, fill=(232, 184, 74) if X == 0 else (232, 232, 240))
    out = os.path.join(DIR, "renders", "depth_sweep.png"); sheet.save(out)

    g.emit(sheet, "proof",
           {"prompt": f"depth-strength sweep · {FIG}", "denoise": DENOISE, "seed": SEED, "dt": 0,
            "note": f"figure DEPTH strength 0.0->0.8 (pose held 0.9). 0.0 = max costume freedom; high = depth locks the nude, costume hugs. Find the sweet spot where the body has 3D form AND the costume still forms."},
           [("beauty", os.path.join(DIR, f"beauty_{FIG}.png")), ("depth", os.path.join(DIR, f"depth_{FIG}.png")),
            ("pose", os.path.join(DIR, f"openpose_{FIG}.png"))])
    print("SWEEP_DONE ->", out)

if __name__ == "__main__":
    main()
