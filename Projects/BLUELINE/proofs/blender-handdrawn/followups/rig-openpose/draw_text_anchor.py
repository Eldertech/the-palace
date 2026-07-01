"""
BLUELINE — Text Layer, placement mode #1 (ANCHOR IN BLENDER), raster half.

Reads renders/text-anchor/placement_record.json + each frame's ink/depth plate, and:
  1. samples the depth plate at each anchor to decide occlusion (is the figure IN FRONT
     of the bubble's sheet-depth?),
  2. composites the dialogue balloon + a tail to the mouth — the LETTERS stay a locked,
     readable overlay (Commitment 1), only placement/depth/tail come from Blender,
  3. where the figure is nearer than the bubble, the figure's ink is restored ON TOP so
     the balloon is genuinely occluded — occlusion falls out of the shared depth plate,
  4. writes annotated frames + a contact sheet, and a resolved placement record.

Run with the ComfyUI venv python (has numpy + PIL):
  _tools/ComfyUI/venv/bin/python3 draw_text_anchor.py
"""
import os, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT  = os.path.join(HERE, "renders", "text-anchor")

DIALOGUE = {"balloon": "OVER HERE!", "behind_test": "BEHIND ME"}
FONTSZ   = {"balloon": 40, "behind_test": 58}
OCC_EPS  = 0.03   # depth-value margin before we call the figure "in front"

def font(sz):
    for p in ("/System/Library/Fonts/Supplemental/Chalkduster.ttf",
              "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
              "/System/Library/Fonts/Helvetica.ttc"):
        if os.path.exists(p):
            try: return ImageFont.truetype(p, sz)
            except Exception: pass
    return ImageFont.load_default()

def balloon_box(cx, cy, text, fnt, pad=22):
    tmp = ImageDraw.Draw(Image.new("RGB", (4, 4)))
    l, t, r, b = tmp.textbbox((0, 0), text, font=fnt)
    tw, th = r - l, b - t
    w, h = tw + pad * 2, th + pad * 2
    return [cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2], (tw, th)

def draw_one(base, depth_norm, cx, cy, mx, my, text, z_norm, sz=40, tail=True):
    """Draw a balloon at (cx,cy), optional tail to (mouth mx,my). Restore figure ink
    where the figure is nearer than the bubble depth (occlusion). Returns (image,
    occluded_bool) where occluded is True if the figure covers any of the balloon."""
    W, H = base.size
    layer = base.copy()
    d = ImageDraw.Draw(layer)
    fnt = font(sz)
    box, (tw, th) = balloon_box(cx, cy, text, fnt)
    if tail:
        d.line([(cx, cy), (mx, my)], fill=(20, 20, 20), width=6)
        d.polygon([(cx - 26, cy), (cx + 26, cy), (mx, my)], fill=(255, 255, 255),
                  outline=(20, 20, 20))
    # balloon body — letters LOCKED and readable (Commitment 1)
    d.rounded_rectangle(box, radius=34, fill=(255, 255, 255), outline=(20, 20, 20), width=5)
    d.text((cx - tw // 2, cy - th // 2 - 6), text, font=fnt, fill=(15, 15, 15))
    # occlusion: figure is IN FRONT wherever its depth-value exceeds the bubble's z_norm
    occ = depth_norm > (z_norm + OCC_EPS)              # near=1 scale; higher = nearer
    x0, y0, x1, y1 = [max(0, box[0]), max(0, box[1]), min(W, box[2]), min(H, box[3])]
    sel = np.zeros((H, W), bool); sel[y0:y1, x0:x1] = True
    m = occ & sel
    occluded = bool(m.any())
    if occluded:
        base_np = np.array(base); layer_np = np.array(layer)
        layer_np[m] = base_np[m]                        # figure ink restored on top
        layer = Image.fromarray(layer_np)
    return layer, occluded

def main():
    rec = json.load(open(os.path.join(OUT, "placement_record.json")))
    annotated = []
    for fr in rec["frames"]:
        fdir = os.path.join(OUT, f"frame_{fr['frame']:02d}")
        W, H = fr["res"]
        ink = Image.open(os.path.join(fdir, fr["ink_plate"])).convert("RGB").resize((W, H))
        depth = np.array(Image.open(os.path.join(fdir, fr["depth_plate"]))
                         .convert("L").resize((W, H))).astype(np.float32) / 255.0
        img = ink
        mouth_px = fr["mouth"]["px"]; mx, my = int(mouth_px[0]*W), int(mouth_px[1]*H)
        for name in ("behind_test", "balloon"):           # deep one first
            a = fr["anchors"][name]
            cx, cy = int(a["px"][0]*W), int(a["px"][1]*H)
            a["px_int"] = [cx, cy]
            if a["vis"]:
                img, occluded = draw_one(img, depth, cx, cy, mx, my, DIALOGUE[name],
                                         a["z_norm"], sz=FONTSZ[name],
                                         tail=(name == "balloon"))
                a["occluded"] = occluded
            else:
                a["occluded"] = False
        # HUD label
        d = ImageDraw.Draw(img); f = font(26)
        b = fr["anchors"]["balloon"]
        d.text((16, 16), f"{fr['label']}  balloon z={b['z_norm']:.2f} occ={b['occluded']}",
               font=f, fill=(200, 30, 30))
        out_png = os.path.join(fdir, "annotated.png")
        img.save(out_png)
        annotated.append(img)
        print(f"  frame {fr['frame']} {fr['label']}: balloon occ={b['occluded']} "
              f"behind occ={fr['anchors']['behind_test']['occluded']}")

    # contact sheet — 4 frames in a row, scaled to 1/2
    sw, sh = annotated[0].size
    tw, th = sw // 2, sh // 2
    sheet = Image.new("RGB", (tw * len(annotated), th), (255, 255, 255))
    for i, im in enumerate(annotated):
        sheet.paste(im.resize((tw, th)), (i * tw, 0))
    sheet.save(os.path.join(OUT, "contact_sheet.png"))
    json.dump(rec, open(os.path.join(OUT, "placement_record_resolved.json"), "w"), indent=1)
    print("WROTE", os.path.join(OUT, "contact_sheet.png"))

if __name__ == "__main__":
    main()
