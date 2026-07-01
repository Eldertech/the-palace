"""
BLUELINE — Text Layer: render the balloon-style catalog + an over-figure placement test.

  1. catalog_grid.png  — every style on white, tail pointing down to a dummy mouth, labeled.
  2. placement_over_figure.png — a real rendered figure (frame_01), balloon placed to CLEAR
     THE FACE with the tail reaching the projected mouth keypoint. Proves the fix: the tail
     interrupts the outline and never crosses the face.

Run with the ComfyUI venv python:
  _tools/ComfyUI/venv/bin/python3 balloon_catalog.py
"""
import os, json
import numpy as np
from PIL import Image, ImageDraw
import balloon_lib as B

HERE = os.path.dirname(os.path.abspath(__file__))
OUT  = os.path.join(HERE, "renders", "text-anchor", "balloons")
os.makedirs(OUT, exist_ok=True)

SAMPLE_TEXT = {
    "speech-oval": "hello.", "speech-rrect": "over here.",
    "shout-spiky": "STOP!!", "thought-cloud": "...maybe.",
    "weak-wavy": "help..", "narration-rect": "Later, that night.",
    "cold-icicle": "you're late.", "whisper-dashed": "(psst)",
    "loud-double": "NOW!",
}


def grid():
    cols, cw, ch = 3, 470, 380
    rows = (len(B.STYLES) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cw, rows * ch), (250, 250, 250))
    for i, (name, spec) in enumerate(B.STYLES.items()):
        cell = np.full((ch, cw, 3), 255, np.uint8)
        cx, cy = cw / 2, ch * 0.40
        rx, ry = 155, 92
        # dummy mouth below the balloon (a small target dot)
        mx, my = cw / 2 - 40, ch * 0.86
        pim = B.draw_balloon(cell, name, (cx, cy), (rx, ry), (mx, my),
                             text=SAMPLE_TEXT[name], fsz=34)
        d = ImageDraw.Draw(pim)
        d.ellipse([mx-4, my-4, mx+4, my+4], fill=(200, 40, 40))     # mouth marker
        d.text((16, ch - 54), name, font=B.font(26), fill=(20, 20, 20))
        d.text((16, ch - 26), spec["meaning"], font=B.font(20), fill=(120, 120, 120))
        r, c = divmod(i, cols)
        sheet.paste(pim, (c * cw, r * ch))
    sheet.save(os.path.join(OUT, "catalog_grid.png"))
    print("wrote", os.path.join(OUT, "catalog_grid.png"))


def over_figure():
    rec = json.load(open(os.path.join(HERE, "renders", "text-anchor",
                                       "placement_record.json")))
    fr = rec["frames"][1]                                    # 01_center
    W, H = fr["res"]
    fdir = os.path.join(HERE, "renders", "text-anchor", "frame_01")
    base = np.array(Image.open(os.path.join(fdir, "ink_plate.png"))
                    .convert("RGB").resize((W, H)))
    mx, my = int(fr["mouth"]["px"][0] * W), int(fr["mouth"]["px"][1] * H)

    # balloon body placed UP + to screen-right of the head so it clears the face; only the
    # tail reaches down to the mouth. (Mode #1 offset already clears the face.)
    demo = ["speech-oval", "thought-cloud", "shout-spiky", "whisper-dashed"]
    panels = []
    for name in demo:
        img = base.copy()
        cx, cy = mx + 150, my - 250
        rx, ry = 150, 92
        pim = B.draw_balloon(img, name, (cx, cy), (rx, ry), (mx, my),
                             text=SAMPLE_TEXT[name], fsz=34)
        d = ImageDraw.Draw(pim)
        d.ellipse([mx-5, my-5, mx+5, my+5], outline=(200, 40, 40), width=3)  # mouth kp
        d.text((16, 16), name, font=B.font(28), fill=(200, 30, 30))
        panels.append(pim)

    tw, th = W // 2, H // 2
    sheet = Image.new("RGB", (tw * len(panels), th), (255, 255, 255))
    for i, p in enumerate(panels):
        sheet.paste(p.resize((tw, th)), (i * tw, 0))
    sheet.save(os.path.join(OUT, "placement_over_figure.png"))
    print("wrote", os.path.join(OUT, "placement_over_figure.png"))


if __name__ == "__main__":
    grid()
    over_figure()
