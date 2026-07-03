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
    "loud-double": "NOW!", "electronic-radio": "come in—",
    "offpanel-oval": "he's gone.", "title-burst": "CHAPTER ONE",
}


def grid():
    cols, cw, ch = 3, 470, 380
    rows = (len(B.STYLES) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cw, rows * ch), (250, 250, 250))
    for i, (name, spec) in enumerate(B.STYLES.items()):
        cell = np.full((ch, cw, 3), 255, np.uint8)
        cx, cy = cw / 2, ch * 0.40
        rx, ry = 150, 90
        if spec.get("target") == "edge":              # off-panel: tail to the left edge
            mx, my = 4, ch * 0.55
        else:                                         # dummy speaker below the balloon
            mx, my = cw / 2 - 40, ch * 0.86
        pim = B.draw_balloon(cell, name, (cx, cy), (rx, ry), (mx, my),
                             text=SAMPLE_TEXT[name], fsz=34)
        d = ImageDraw.Draw(pim)
        if spec["tail"] != "none":
            d.ellipse([mx-4, my-4, mx+4, my+4], fill=(200, 40, 40))   # speaker marker
        d.text((16, ch - 54), name, font=B.font(26), fill=(20, 20, 20))
        d.text((16, ch - 26), spec["meaning"], font=B.font(20), fill=(120, 120, 120))
        r, c = divmod(i, cols)
        sheet.paste(pim, (c * cw, r * ch))
    sheet.save(os.path.join(OUT, "catalog_grid.png"))
    print("wrote", os.path.join(OUT, "catalog_grid.png"))


def over_figure():
    import cv2
    rec = json.load(open(os.path.join(HERE, "renders", "text-anchor",
                                       "placement_record.json")))
    fr = rec["frames"][1]                                    # 01_center
    W, H = fr["res"]
    fdir = os.path.join(HERE, "renders", "text-anchor", "frame_01")
    base = np.array(Image.open(os.path.join(fdir, "ink_plate.png"))
                    .convert("RGB").resize((W, H)))
    # figure silhouette from the depth plate (near = high) — used to stop the tail short
    depth = np.array(Image.open(os.path.join(fdir, "depth_plate.png"))
                     .convert("L").resize((W, H))).astype(np.float32) / 255.0
    fig = depth > 0.15
    mx, my = int(fr["mouth"]["px"][0] * W), int(fr["mouth"]["px"][1] * H)
    half = (150, 92)

    panels = []

    # 1-4: speaker-anchored styles — body AUTO-PLACED to clear the face, tail tip STOPS
    #      SHORT of the figure (never touches the person).
    for name in ["speech-oval", "thought-cloud", "shout-spiky", "electronic-radio"]:
        img = base.copy()
        center = B.auto_place((mx, my), fig, (W, H), half)
        pim = B.draw_balloon(img, name, center, half, (mx, my),
                             text=SAMPLE_TEXT[name], fsz=34, fig=fig, gap=22)
        d = ImageDraw.Draw(pim)
        d.ellipse([mx-5, my-5, mx+5, my+5], outline=(200, 40, 40), width=3)   # mouth kp
        d.text((16, 16), name + "  (tip stops short)", font=B.font(26), fill=(200, 30, 30))
        panels.append(pim)

    # 5: off-panel — speaker is off the left edge; tail reaches the FRAME EDGE, not a face.
    img = base.copy()
    edge = (6, my)
    center = (half[0] + 40, my - 60)
    pim = B.draw_balloon(img, "offpanel-oval", center, half, edge,
                         text=SAMPLE_TEXT["offpanel-oval"], fsz=34)
    ImageDraw.Draw(pim).text((16, 16), "offpanel-oval  (tail to edge)",
                             font=B.font(26), fill=(200, 30, 30))
    panels.append(pim)

    # 6: title / system voice — tail-less burst, no speaker anchor.
    img = base.copy()
    pim = B.draw_balloon(img, "title-burst", (W / 2, 150), (250, 92), (0, 0),
                         text=SAMPLE_TEXT["title-burst"], fsz=40)
    ImageDraw.Draw(pim).text((16, 16), "title-burst  (no tail)",
                             font=B.font(26), fill=(200, 30, 30))
    panels.append(pim)

    tw, th = W // 2, H // 2
    cols = 3
    rows = (len(panels) + cols - 1) // cols
    sheet = Image.new("RGB", (tw * cols, th * rows), (255, 255, 255))
    for i, p in enumerate(panels):
        r, c = divmod(i, cols)
        sheet.paste(p.resize((tw, th)), (c * tw, r * th))
    sheet.save(os.path.join(OUT, "placement_over_figure.png"))
    print("wrote", os.path.join(OUT, "placement_over_figure.png"))


if __name__ == "__main__":
    grid()
    over_figure()
