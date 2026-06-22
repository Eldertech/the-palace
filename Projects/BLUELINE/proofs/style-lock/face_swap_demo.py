#!/usr/bin/env python3
"""
BLUELINE · FACE-SWAP proof — close the loop on the swappable-face slot. Render ONE distinct target identity
(pen-flow style), then for each neutral face-slot panel use its TOKEN landmarks to align + blend the target
face in (similarity transform from the 5-point kps -> the panel's kps = direction-matched; seamlessClone over
the face hull). Proves "easy to change later, accurately" with no gated models (insightface + OpenCV).

Honest scope: a 2D landmark swap nails frontal / three-quarter; extreme profile or up/down out-of-plane
angles are where a heavier identity model (InstantID / IP-Adapter-FaceID) earns its keep. The demo shows both.

Run (comfy venv, :8189 for the target render): python3 face_swap_demo.py
Outputs -> style-lock/face-swap/target.png, <dir>_swapped.png, swap-demo.png (target | originals | swapped)
"""
import os, glob, json
import numpy as np, cv2
from insightface.app import FaceAnalysis
from style_explore import run

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "face-swap"); os.makedirs(OUT, exist_ok=True)
SLOT = os.path.join(HERE, "face-slot")
CKPT = "sd_xl_base_1.0.safetensors"; W, H, STEPS, CFG = 832, 1216, 26, 6.5
STYLE = json.load(open(os.path.join(HERE, "locked-style.json")))["style"]
TARGET_PROMPT = ("a close-up frontal portrait face of a young woman with sharp cheekbones, a short dark bob and "
                 f"a small scar through one eyebrow, looking straight at the viewer, clear face, {STYLE}")
DIRS = ["front", "3q_left", "3q_right", "profile_left", "down", "up"]

def graph(prompt, seed, prefix):
    return {"ckpt":{"class_type":"CheckpointLoaderSimple","inputs":{"ckpt_name":CKPT}},
      "pos":{"class_type":"CLIPTextEncode","inputs":{"text":prompt,"clip":["ckpt",1]}},
      "neg":{"class_type":"CLIPTextEncode","inputs":{"text":"color, blurry, low quality, text, watermark","clip":["ckpt",1]}},
      "latent":{"class_type":"EmptyLatentImage","inputs":{"width":W,"height":H,"batch_size":1}},
      "samp":{"class_type":"KSampler","inputs":{"model":["ckpt",0],"positive":["pos",0],"negative":["neg",0],
              "latent_image":["latent",0],"seed":seed,"steps":STEPS,"cfg":CFG,"sampler_name":"dpmpp_2m","scheduler":"karras","denoise":1.0}},
      "dec":{"class_type":"VAEDecode","inputs":{"samples":["samp",0],"vae":["ckpt",2]}},
      "save":{"class_type":"SaveImage","inputs":{"filename_prefix":prefix,"images":["dec",0]}}}

def main():
    app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"]); app.prepare(ctx_id=-1, det_size=(640,640))
    # 1. render the target identity
    tgt_png = os.path.join(OUT, "target.png")
    print("rendering target identity…", flush=True); run(graph(TARGET_PROMPT, 7777, "swap_target"), tgt_png)
    tgt_img = cv2.imread(tgt_png); tfaces = app.get(tgt_img)
    if not tfaces: raise SystemExit("no face in target render")
    tgt = max(tfaces, key=lambda f: f.det_score)

    results = []
    for d in DIRS:
        panel_png = os.path.join(SLOT, f"{d}.png")
        if not os.path.isfile(panel_png): print(f"  {d}: missing panel"); continue
        panel = cv2.imread(panel_png); pf = app.get(panel)
        if not pf: results.append((d, panel_png, None, "no panel face")); print(f"  {d}: panel face not detected"); continue
        p = max(pf, key=lambda f: f.det_score)
        try:
            M, _ = cv2.estimateAffinePartial2D(tgt.kps.astype(np.float32), p.kps.astype(np.float32))
            warped = cv2.warpAffine(tgt_img, M, (panel.shape[1], panel.shape[0]), borderMode=cv2.BORDER_REFLECT)
            hull = cv2.convexHull(p.landmark_2d_106.astype(np.int32))
            mask = np.zeros(panel.shape[:2], np.uint8); cv2.fillConvexPoly(mask, hull, 255)
            mask = cv2.dilate(mask, np.ones((9,9), np.uint8))
            x, y, w, h = cv2.boundingRect(hull); center = (int(x+w/2), int(y+h/2))
            out = cv2.seamlessClone(warped, panel, mask, center, cv2.NORMAL_CLONE)
            dst = os.path.join(OUT, f"{d}_swapped.png"); cv2.imwrite(dst, out)
            results.append((d, panel_png, dst, "ok")); print(f"  {d}: swapped ok", flush=True)
        except Exception as e:
            results.append((d, panel_png, None, repr(e)[:80])); print(f"  {d}: swap failed {repr(e)[:80]}")

    # montage: row0 = target (in slot0) ; then per dir: original | swapped
    from PIL import Image, ImageDraw
    tw=200; th=int(tw*H/W); cols=len(DIRS); pad=20
    sheet=Image.new("RGB",(cols*tw,(th+pad)*2+th+pad),(12,13,16)); dr=ImageDraw.Draw(sheet)
    sheet.paste(Image.open(tgt_png).convert("RGB").resize((tw,th)),(0,pad)); dr.text((6,4),"TARGET identity",fill=(232,184,74))
    for c,(d,orig,sw,st) in enumerate(results):
        y1=(th+pad)+pad; y2=2*(th+pad)+pad
        sheet.paste(Image.open(orig).convert("RGB").resize((tw,th)),(c*tw,y1)); dr.text((c*tw+6,y1-16),f"orig {d}",fill=(150,150,160))
        if sw: sheet.paste(Image.open(sw).convert("RGB").resize((tw,th)),(c*tw,y2)); dr.text((c*tw+6,y2-16),f"swap {d}",fill=(0,255,102))
        else: dr.text((c*tw+6,y2),f"swap {d}: {st}",fill=(255,80,80))
    sheet.save(os.path.join(HERE,"swap-demo.png"))
    ok=sum(1 for *_,s in results if s=="ok")
    print(f"FACE_SWAP_DONE swapped {ok}/{len(results)}")

if __name__ == "__main__":
    main()
