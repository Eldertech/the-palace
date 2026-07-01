"""Grading contact sheets for the hands matrix. ComfyUI venv python (PIL)."""
import os
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
PL = os.path.join(HERE, "renders", "hands")
GN = os.path.join(HERE, "renders", "hands-gen")

def load(p, tw, th, bg=(215, 215, 215)):
    try: return Image.open(p).convert("RGB").resize((tw, th))
    except Exception: return Image.new("RGB", (tw, th), bg)

# 1) closeup gestures/objects × styles (the hand-quality grading sheet)
closeups = ["fist_closeup", "fist_side_closeup", "point_closeup", "point_side_closeup",
            "glass_closeup", "fabric_closeup", "snake_closeup", "flower_closeup"]
cols = [("OpenPose", os.path.join(PL, "{k}", "openpose.png")),
        ("Storyboard", os.path.join(GN, "{k}", "gen_storyboard.png")),
        ("Watercolor", os.path.join(GN, "{k}", "gen_watercolor.png")),
        ("Cel comic", os.path.join(GN, "{k}", "gen_comic.png"))]
tw, th = 200, 250
sheet = Image.new("RGB", (len(cols)*(tw+8)+120, len(closeups)*(th+8)+30), (248, 248, 248))
dr = ImageDraw.Draw(sheet)
for c, (lab, _) in enumerate(cols):
    dr.text((120+c*(tw+8), 8), lab, fill=(0, 0, 0))
for r, k in enumerate(closeups):
    y = 26+r*(th+8)
    dr.text((6, y+th//2), k.replace("_closeup", ""), fill=(0, 0, 0))
    for c, (lab, tpl) in enumerate(cols):
        sheet.paste(load(tpl.format(k=k), tw, th), (120+c*(tw+8), y))
sheet.save(os.path.join(GN, "closeups_grid.png"))
print("wrote closeups_grid.png", sheet.size)

# 2) shot range (closeup/medium/full) for point + glass, storyboard+comic
subs = ["point", "glass", "flower"]; shots = ["closeup", "medium", "full"]
styles = [("storyboard", "gen_storyboard.png"), ("comic", "gen_comic.png")]
tw, th = 180, 225
per = len(shots)*len(styles)
sheet2 = Image.new("RGB", (per*(tw+6)+120, len(subs)*(th+8)+30), (248, 248, 248))
dr = ImageDraw.Draw(sheet2)
i = 0
for shot in shots:
    for stl, _ in styles:
        dr.text((120+i*(tw+6), 8), f"{shot[:4]}·{stl[:4]}", fill=(0, 0, 0)); i += 1
for r, sub in enumerate(subs):
    y = 26+r*(th+8); dr.text((6, y+th//2), sub, fill=(0, 0, 0)); i = 0
    for shot in shots:
        for stl, fn in styles:
            sheet2.paste(load(os.path.join(GN, f"{sub}_{shot}", fn), tw, th), (120+i*(tw+6), y)); i += 1
sheet2.save(os.path.join(GN, "shots_grid.png"))
print("wrote shots_grid.png", sheet2.size)
