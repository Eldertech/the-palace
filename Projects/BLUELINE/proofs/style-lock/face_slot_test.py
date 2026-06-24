#!/usr/bin/env python3
"""
BLUELINE · FACE-SLOT proof — the face as a swappable "green screen". The character body/kit + a NEUTRAL
generic placeholder face, rendered across CONTROLLED head directions, each shipped with a TOKEN sidecar:
  • head_direction  — KNOWN by construction (we prompt it) -> robust registration even if detection fails
  • landmarks/bbox/pose — DETECTED with insightface where the ink face is detectable (bonus precision)
That token is what makes a later face-swap (InstantID / IP-Adapter-FaceID / ReActor) land the new face at
the right angle in every panel. Run (comfy venv, :8189): python3 face_slot_test.py
Outputs -> style-lock/face-slot/<dir>.png + <dir>.token.json + <dir>_kp.png (landmark overlay) + montage.
"""
import os, json
import numpy as np
from PIL import Image, ImageDraw
from style_explore import run

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "face-slot"); os.makedirs(OUT, exist_ok=True)
CKPT = "sd_xl_base_1.0.safetensors"; W, H, STEPS, CFG = 832, 1216, 26, 6.5
STYLE = json.load(open(os.path.join(HERE, "locked-style.json")))["style"]
KIT = ("a figure in a dark fedora, a long open duster coat over a horizontally striped shirt, baggy functional "
       "japanese workman trousers, normal human hands holding a folding pocketknife and a hand towel")
NEUTRAL = "a plain ordinary generic everyman face, neutral calm expression, simple clear eyes nose and mouth"
DIRECTIONS = {
    "front":        "head facing straight toward the viewer",
    "3q_left":      "head turned three-quarters to the left",
    "3q_right":     "head turned three-quarters to the right",
    "profile_left": "head in full left profile",
    "down":         "head tilted downward, looking down",
    "up":           "head tilted upward, looking up",
}
NEG = ("color, photograph, smooth digital shading, gradient, blurry, low quality, watermark, text, border, "
       "two heads, deformed face")

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

def detector():
    try:
        from insightface.app import FaceAnalysis
        app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
        app.prepare(ctx_id=-1, det_size=(640, 640)); return app
    except Exception as e:
        print("  [token] insightface unavailable:", repr(e)[:120]); return None

def token_for(app, png, direction):
    tok = {"head_direction": direction, "direction_known": True, "face_detected": False}
    if app is None: return tok
    try:
        img = np.asarray(Image.open(png).convert("RGB"))[:, :, ::-1].copy()  # RGB->BGR
        faces = app.get(img)
        if faces:
            f = max(faces, key=lambda x: x.det_score)
            tok.update(face_detected=True, det_score=float(f.det_score),
                       bbox=[int(v) for v in f.bbox.tolist()],
                       kps5=[[int(x), int(y)] for x, y in f.kps.tolist()],
                       pose=[float(v) for v in (f.pose.tolist() if getattr(f, "pose", None) is not None else [])])
    except Exception as e:
        tok["detect_error"] = repr(e)[:120]
    return tok

def overlay(png, tok, dst):
    im = Image.open(png).convert("RGB"); dr = ImageDraw.Draw(im)
    if tok.get("face_detected"):
        x0, y0, x1, y1 = tok["bbox"]; dr.rectangle([x0, y0, x1, y1], outline=(232, 184, 74), width=3)
        for x, y in tok.get("kps5", []): dr.ellipse([x-4, y-4, x+4, y+4], fill=(0, 255, 102))
    dr.text((8, 8), f"dir={tok['head_direction']}  detected={tok.get('face_detected')}", fill=(232, 184, 74))
    im.save(dst)

def main():
    app = detector()
    files = []
    for i, (tag, dphrase) in enumerate(DIRECTIONS.items()):
        prompt = f"{KIT}, {NEUTRAL}, {dphrase}, medium shot from the waist up, the face clearly visible, {STYLE}"
        png = os.path.join(OUT, f"{tag}.png")
        dt = run(graph(prompt, 4400+i, f"slot_{tag}"), png)
        tok = token_for(app, png, tag)
        json.dump(tok, open(os.path.join(OUT, f"{tag}.token.json"), "w"), indent=2)
        overlay(png, tok, os.path.join(OUT, f"{tag}_kp.png"))
        files.append((png, tag, tok.get("face_detected")))
        print(f"  [{i+1}/{len(DIRECTIONS)}] {tag}  ({dt:.0f}s)  face_detected={tok.get('face_detected')}", flush=True)
    cols = 3; tw = 280; th = int(tw*H/W); rows = (len(files)+cols-1)//cols; pad = 20
    m = Image.new("RGB", (cols*tw, rows*(th+pad)), (12, 13, 16)); dr = ImageDraw.Draw(m)
    for k, (p, tag, det) in enumerate(files):
        c, r = k % cols, k // cols; m.paste(Image.open(os.path.join(OUT, f"{tag}_kp.png")).convert("RGB").resize((tw, th)), (c*tw, r*(th+pad)+pad))
        dr.text((c*tw+6, r*(th+pad)+4), f"{tag} {'✓token' if det else 'dir-only'}", fill=(232,184,74))
    m.save(os.path.join(HERE, "face-slot.png"))
    ndet = sum(1 for _,_,d in files if d)
    print(f"FACE_SLOT_DONE detected {ndet}/{len(files)} (rest carry the known-direction token)")

if __name__ == "__main__":
    main()
