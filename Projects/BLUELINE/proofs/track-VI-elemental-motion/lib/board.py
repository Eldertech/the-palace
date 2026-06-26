#!/usr/bin/env python3
"""Compose labeled image grids (Loudon Live palette) for the Track-VI report/checkpoints."""
import os
from PIL import Image, ImageDraw, ImageFont

BG = (14, 15, 18); AMBER = (232, 184, 74); WHITE = (236, 236, 232); DIM = (150, 150, 150)


def font(size, bold=False):
    for p in ["/System/Library/Fonts/Helvetica.ttc",
              "/System/Library/Fonts/Supplemental/Arial.ttf",
              "/Library/Fonts/Arial.ttf"]:
        if os.path.exists(p):
            try: return ImageFont.truetype(p, size)
            except Exception: pass
    return ImageFont.load_default()


def cell(path, w, label, sub=""):
    im = Image.open(path).convert("RGB")
    h = int(w * im.height / im.width)
    im = im.resize((w, h))
    barh = 30
    c = Image.new("RGB", (w, h + barh), BG); d = ImageDraw.Draw(c)
    d.text((6, 4), label, fill=AMBER, font=font(18))
    if sub:
        tw = d.textlength(label, font=font(18))
        d.text((10 + tw, 8), sub, fill=DIM, font=font(13))
    c.paste(im, (0, barh))
    return c


def grid(rows, title="", out="board.png", cell_w=360, gap=10, sub=""):
    cells = [[cell(p, cell_w, lab, s) for (lab, p, s) in row] for row in rows]
    cols = max(len(r) for r in cells)
    rh = [max(c.height for c in r) for r in cells]
    W = cols * cell_w + (cols + 1) * gap
    titleh = 54 if title else gap
    subh = 24 if sub else 0
    H = titleh + subh + sum(rh) + (len(cells)) * gap
    board = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(board)
    if title:
        d.text((gap, 14), title, fill=WHITE, font=font(28))
    if sub:
        d.text((gap, titleh - 4), sub, fill=DIM, font=font(15))
    y = titleh + subh
    for r, row in enumerate(cells):
        x = gap
        for c in row:
            board.paste(c, (x, y)); x += cell_w + gap
        y += rh[r] + gap
    board.save(out)
    return out


if __name__ == "__main__":
    import sys
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    P = lambda *a: os.path.join(base, *a)
    rows = [
        [("WATER", P("plates", "water.png"), "plate"),
         ("SKY", P("plates", "sky.png"), "plate"),
         ("SMOKE", P("plates", "smoke.png"), "plate")],
        [("WATER", P("renders", "water_v1", "water_v1_anaglyph.png"), "motion"),
         ("SKY", P("renders", "sky_v1", "sky_v1_anaglyph.png"), "motion"),
         ("SMOKE", P("renders", "smoke_v1", "smoke_v1_anaglyph.png"), "motion")],
    ]
    out = grid(rows,
               title="TRACK VI · ELEMENTAL MOTION  —  stylize once, then move the ink",
               sub="top: pen-flow plate (SDXL)   bottom: motion revealed as red/cyan fringe "
                   "(frame 0 vs mid) — the inked element warps, everything else holds static",
               out=P("report-assets", "checkpoint_board.png"))
    print("BOARD", out)
