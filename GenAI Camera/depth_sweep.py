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
    g.layer_pose(FIG)   # ensure openpose_<FIG>.png exists
    # CROP-FIRST: crop each conditioning plate to the figure and resize to a portrait gen frame, so the
    # figure FILLS the frame (no small-in-a-wide-frame recomposition; inputs match outputs).
    x0, y0, x1, y1 = map(int, fig_bbox(os.path.join(DIR, f"keypoints_{FIG}.json")))
    ibox = (x0, y0, x1, y1); bw, bh = x1-x0, y1-y0
    GH = 1024; GW = max(512, min(1024, (int(GH*bw/bh)//8)*8))
    def prep(name):
        im = Image.open(os.path.join(DIR, name)).convert("RGB").crop(ibox).resize((GW, GH), Image.LANCZOS)
        tp = os.path.join(DIR, "_swp_" + name); im.save(tp); return tp, im
    (bp, bimg) = prep(f"beauty_{FIG}.png"); (dp, dimg) = prep(f"depth_{FIG}.png"); (pp, pimg) = prep(f"openpose_{FIG}.png")
    beauty = g.upload(bp); depth = g.upload(dp); pose = g.upload(pp)

    cells = [("init (beauty)", bimg, True), ("pose", pimg, True), ("depth", dimg, True)]
    for X in STRENGTHS:
        cns = [{"type": "pose", "image_fn": pose, "strength": 0.9, "end": 0.85}]
        if X > 0: cns = [{"type": "depth", "image_fn": depth, "strength": X, "end": 0.85}] + cns
        im = g._to_pil(g.run_graph(g.build_graph(beauty, PROMPT, DENOISE, SEED, 8, cns))[0])
        cells.append(("pose only" if X == 0 else f"depth {X:.2f}", im, False))
        print(f"  depth {X:.2f} done", flush=True)

    # contact sheet: 3 cols; row 0 = inputs, then the sweep
    CH = 430; pad = 10; lab = 34; cols = 3; hdr = 26
    cw = int(cells[0][1].width * CH / cells[0][1].height)
    rows = (len(cells) + cols - 1) // cols
    Wd = cols*cw + (cols+1)*pad; Ht = hdr + rows*(CH+lab) + (rows+1)*pad
    sheet = Image.new("RGB", (Wd, Ht), (12, 12, 18)); dr = ImageDraw.Draw(sheet)
    f = font(24); ft = font(16)
    dr.text((pad, 5), f"DEPTH strength sweep — {FIG} · pose 0.9 · denoise {DENOISE} · seed {SEED}   (top row = conditioning sent in)", font=ft, fill=(232, 184, 74))
    for i, (label, im, is_in) in enumerate(cells):
        r, c = divmod(i, cols)
        x = pad + c*(cw+pad); y = hdr + pad + lab + r*(CH+lab+pad)
        sheet.paste(im.resize((cw, CH)), (x, y))
        dr.rectangle([x, y-lab, x+cw, y], fill=(46, 36, 12) if is_in else (26, 26, 40))
        col = (232, 184, 74) if (is_in or label == "pose only") else (232, 232, 240)
        dr.text((x+8, y-lab+7), ("· " + label) if is_in else label, font=f, fill=col)
    out = os.path.join(DIR, "renders", "depth_sweep.png"); sheet.save(out)

    g.emit(sheet, "proof",
           {"prompt": f"depth sweep · {FIG}", "denoise": DENOISE, "seed": SEED, "dt": 0,
            "note": f"{FIG}: figure DEPTH 0.0->0.8 (pose held 0.9). Top row = the conditioning sent in (beauty init · pose · depth). Does bulky fur/armor find the same ~0.3 sweet spot as robes?"},
           [("beauty", os.path.join(DIR, f"beauty_{FIG}.png")), ("depth", os.path.join(DIR, f"depth_{FIG}.png")),
            ("pose", os.path.join(DIR, f"openpose_{FIG}.png"))])
    print("SWEEP_DONE ->", out)

if __name__ == "__main__":
    main()
