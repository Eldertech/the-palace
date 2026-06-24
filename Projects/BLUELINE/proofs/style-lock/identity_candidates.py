#!/usr/bin/env python3
"""
BLUELINE · IDENTITY CANDIDATES — generate a small cast of clean, frontal pen-ink FACE portraits so Loudon
can pick the protagonist BY EYE before the InstantID bake. Free, local SDXL on :8189.

Why a portrait variant (not the locked pen-flow recipe): the locked style is an ACTION look (sweeping flow
lines, speed streaks, foreshortening, canted angle) — great for the final frames, wrong for an identity
reference, where we want a CLEAR, well-lit, frontal face that insightface reads cleanly. The reference
encodes identity only; the full locked style is re-applied at render time in instantid_gaze_render.py.

Each candidate is insightface-checked — a face that won't detect is useless as an InstantID reference, so
we flag det_score and skip the dud. Run UNDER THE COMFY VENV PYTHON (needs insightface):
  _tools/ComfyUI/venv/bin/python identity_candidates.py
Outputs -> style-lock/identity-candidates/<id>.png (+ .token.json) + identity-candidates.png (montage).
"""
import os, json, time
import numpy as np
from PIL import Image, ImageDraw
from style_explore import run  # local :8189 renderer (POST /prompt, poll /history, fetch /view)

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "identity-candidates"); os.makedirs(OUT, exist_ok=True)
CKPT = "sd_xl_base_1.0.safetensors"
W, H, STEPS, CFG = 768, 960, 24, 6.5

PORTRAIT = ("modern pen and ink illustration, loose gestural linework, stark high-contrast black and white, "
            "film-noir deep shadow and rim light, rough white cold-press watercolor paper, lots of white space, "
            "sumi-e and manga ink influence")
NEG = ("color, colour, photograph, photorealistic, 3d render, smooth digital shading, gradient, blurry, low "
       "quality, watermark, text, signature, frame, border, speed streaks, motion blur, full body, "
       "multiple people, two heads, deformed face, hat brim shadowing the eyes")

# a varied noir cast — distinct, clear faces; Loudon picks the protagonist by eye
IDENTITIES = [
    ("weathered_man",   "a weathered older man with deep facial lines, a strong jaw, and piercing narrow eyes, hair slicked back"),
    ("young_woman",     "a young woman with sharp high cheekbones, an intense level stare, and dark cropped hair"),
    ("boxer",           "a broad-faced middle-aged man with a broken nose, heavy brow, and a steady level gaze"),
    ("gaunt_man",       "a gaunt man with hollow cheeks, deep-set intense eyes, and unkempt dark hair"),
    ("scarred_woman",   "a stern woman with a thin scar across one cheek, short slicked-back hair, and a hard expression"),
    ("androgynous",     "an androgynous youth with fine delicate features, large clear calm eyes, and tousled hair"),
]

def graph(prompt, seed, prefix):
    return {
      "ckpt":{"class_type":"CheckpointLoaderSimple","inputs":{"ckpt_name":CKPT}},
      "pos":{"class_type":"CLIPTextEncode","inputs":{"text":prompt,"clip":["ckpt",1]}},
      "neg":{"class_type":"CLIPTextEncode","inputs":{"text":NEG,"clip":["ckpt",1]}},
      "latent":{"class_type":"EmptyLatentImage","inputs":{"width":W,"height":H,"batch_size":1}},
      "samp":{"class_type":"KSampler","inputs":{"model":["ckpt",0],"positive":["pos",0],"negative":["neg",0],
              "latent_image":["latent",0],"seed":seed,"steps":STEPS,"cfg":CFG,"sampler_name":"dpmpp_2m","scheduler":"karras","denoise":1.0}},
      "dec":{"class_type":"VAEDecode","inputs":{"samples":["samp",0],"vae":["ckpt",2]}},
      "save":{"class_type":"SaveImage","inputs":{"filename_prefix":prefix,"images":["dec",0]}},
    }

def main():
    from insightface.app import FaceAnalysis
    app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"]); app.prepare(ctx_id=-1, det_size=(640,640))
    rows = []
    for i,(tag, ident) in enumerate(IDENTITIES):
        prompt = f"a close-up head-and-shoulders frontal portrait of {ident}, face fully visible and well lit, looking straight at the viewer, neutral expression, {PORTRAIT}"
        png = os.path.join(OUT, f"{i}_{tag}.png")
        dt = run(graph(prompt, 7700+i*7, f"idc_{i}_{tag}"), png)
        det = {"tag":tag,"face_detected":False}
        try:
            img = np.asarray(Image.open(png).convert("RGB"))[:,:,::-1].copy()
            faces = app.get(img)
            if faces:
                f = max(faces,key=lambda x:x.det_score)
                det.update(face_detected=True, det_score=round(float(f.det_score),3),
                           pose=[round(float(v),1) for v in (f.pose.tolist() if getattr(f,"pose",None) is not None else [])],
                           bbox=[int(v) for v in f.bbox.tolist()])
        except Exception as e: det["err"]=repr(e)[:100]
        json.dump(det, open(os.path.join(OUT,f"{i}_{tag}.token.json"),"w"), indent=2)
        rows.append((i, tag, png, det))
        print(f"  [{i+1}/{len(IDENTITIES)}] {tag}  ({dt:.0f}s)  detected={det.get('face_detected')} det_score={det.get('det_score')}", flush=True)
    # montage
    cols=3; tw=300; th=int(tw*H/W); rows_n=(len(rows)+cols-1)//cols; pad=30
    sheet=Image.new("RGB",(cols*tw, rows_n*(th+pad)+pad),(12,13,16)); dr=ImageDraw.Draw(sheet)
    for k,(i,tag,png,det) in enumerate(rows):
        c,r=k%cols,k//cols; x,y=c*tw, r*(th+pad)+pad
        sheet.paste(Image.open(png).convert("RGB").resize((tw,th)),(x,y))
        dr.text((x+4,y-26), f"[{i}] {tag}", fill=(232,184,74))
        d = det.get('det_score') if det.get('face_detected') else None
        dr.text((x+4,y-13), (f"det={d}" if d else "NO-DETECT"), fill=(0,255,102) if d else (255,80,80))
    sheet.save(os.path.join(HERE,"identity-candidates.png"))
    ndet=sum(1 for *_,d in rows if d.get('face_detected'))
    print(f"IDENTITY_CANDIDATES_DONE {len(rows)} faces, detected {ndet}, montage -> identity-candidates.png")

if __name__ == "__main__":
    main()
