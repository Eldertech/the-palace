"""Quick 2x2 contact sheet of a multi-figure scene's conditioning stack (shaded/color-ID/depth/openpose).
  _tools/ComfyUI/venv/bin/python3 multi_contact_sheet.py <scene_dir> [out.png]
"""
import sys, os
from PIL import Image, ImageDraw

d = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(d, "_contact.png")
passes = [("shaded_plate.png", "shaded -> canny"), ("colorid_plate.png", "color-ID"),
          ("depth_plate.png", "depth"), ("openpose.png", "OpenPose (N skeletons)")]
cw = 460
tiles = []
for fn, lab in passes:
    im = Image.open(os.path.join(d, fn)).convert("RGB")
    im = im.resize((cw, round(im.height * cw / im.width)), Image.LANCZOS)
    pad = Image.new("RGB", (cw, im.height + 26), (18, 18, 22))
    pad.paste(im, (0, 26))
    dr = ImageDraw.Draw(pad); dr.text((8, 7), lab, fill=(232, 184, 74))
    tiles.append(pad)
th = max(t.height for t in tiles)
sheet = Image.new("RGB", (cw * 2 + 12, th * 2 + 12), (10, 10, 14))
for i, t in enumerate(tiles):
    x = (i % 2) * (cw + 12); y = (i // 2) * (th + 12)
    sheet.paste(t, (x, y))
sheet.save(out)
print("wrote", out, sheet.size)
