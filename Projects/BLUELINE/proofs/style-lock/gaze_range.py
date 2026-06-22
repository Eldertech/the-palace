#!/usr/bin/env python3
"""
BLUELINE · GAZE RANGE — re-generate a WIDER span of head/gaze directions for the neutral face-slot, and
MATCH the actual gaze: insightface returns head pose (yaw/pitch/roll), so each frame's token records the
INTENDED gaze and the MEASURED gaze. We then keep/relabel by what was actually drawn — so later identity
baking/swap can be matched to a real, verified gaze direction (not a hoped-for prompt).

Run (comfy venv, :8189): python3 gaze_range.py
Outputs -> style-lock/gaze/<id>.png + <id>.token.json + gaze-atlas.png (sorted by measured yaw, labelled).
"""
import os, json
import numpy as np
from PIL import Image, ImageDraw
from insightface.app import FaceAnalysis
from style_explore import run

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "gaze"); os.makedirs(OUT, exist_ok=True)
CKPT = "sd_xl_base_1.0.safetensors"; W, H, STEPS, CFG = 832, 1216, 26, 6.5
STYLE = json.load(open(os.path.join(HERE, "locked-style.json")))["style"]
KIT = ("a figure in a dark fedora, a long open duster coat over a horizontally striped shirt, baggy japanese "
       "workman trousers, normal human hands holding a folding pocketknife and a hand towel")
NEUTRAL = "a plain ordinary generic everyman face, neutral calm expression, simple clear eyes nose and mouth"
NEG = "color, photograph, smooth digital shading, gradient, blurry, low quality, watermark, text, border, two heads"

# intended (yaw, pitch) labels + prompt phrasing — a WIDE span
YAW = [("L90","head in full left profile, gaze to the left"),
       ("L60","head turned three-quarters to the left"),
       ("L30","head turned slightly to the left"),
       ("0","head facing straight forward, looking at the viewer"),
       ("R30","head turned slightly to the right"),
       ("R60","head turned three-quarters to the right"),
       ("R90","head in full right profile, gaze to the right")]
PITCH = [("up","chin raised, looking upward"), ("lvl",""), ("dn","chin lowered, looking downward")]
# full yaw at level + the 3 key yaws (front, 3qL, 3qR) at up & down
PLAN = [(y, "lvl", yp) for (y,yp) in YAW] + \
       [(y, p, f"{yp}, {pp}") for (y,yp) in [("0",YAW[3][1]),("L60",YAW[1][1]),("R60",YAW[5][1])] for (p,pp) in [("up",PITCH[0][1]),("dn",PITCH[2][1])]]

def graph(prompt, seed, prefix):
    return {"ckpt":{"class_type":"CheckpointLoaderSimple","inputs":{"ckpt_name":CKPT}},
      "pos":{"class_type":"CLIPTextEncode","inputs":{"text":prompt,"clip":["ckpt",1]}},
      "neg":{"class_type":"CLIPTextEncode","inputs":{"text":NEG,"clip":["ckpt",1]}},
      "latent":{"class_type":"EmptyLatentImage","inputs":{"width":W,"height":H,"batch_size":1}},
      "samp":{"class_type":"KSampler","inputs":{"model":["ckpt",0],"positive":["pos",0],"negative":["neg",0],
              "latent_image":["latent",0],"seed":seed,"steps":STEPS,"cfg":CFG,"sampler_name":"dpmpp_2m","scheduler":"karras","denoise":1.0}},
      "dec":{"class_type":"VAEDecode","inputs":{"samples":["samp",0],"vae":["ckpt",2]}},
      "save":{"class_type":"SaveImage","inputs":{"filename_prefix":prefix,"images":["dec",0]}}}

def main():
    app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"]); app.prepare(ctx_id=-1, det_size=(640,640))
    rows=[]
    for i,(yl,pl,phrase) in enumerate(PLAN):
        tag=f"{i:02d}_{yl}_{pl}"
        png=os.path.join(OUT,f"{tag}.png")
        prompt=f"{KIT}, {NEUTRAL}, {phrase}, medium shot from the waist up, face clearly visible, {STYLE}"
        dt=run(graph(prompt, 5500+i, f"gaze_{tag}"), png)
        tok={"tag":tag,"intended_yaw":yl,"intended_pitch":pl,"face_detected":False}
        try:
            img=np.asarray(Image.open(png).convert("RGB"))[:,:,::-1].copy()
            faces=app.get(img)
            if faces:
                f=max(faces,key=lambda x:x.det_score); pose=getattr(f,"pose",None)
                tok.update(face_detected=True, det_score=float(f.det_score),
                           bbox=[int(v) for v in f.bbox.tolist()],
                           measured_pose=[round(float(v),1) for v in (pose.tolist() if pose is not None else [])])
        except Exception as e: tok["err"]=repr(e)[:80]
        json.dump(tok, open(os.path.join(OUT,f"{tag}.token.json"),"w"), indent=2)
        my = tok.get("measured_pose",[None,None,None])
        rows.append((tag,png,tok,my))
        print(f"  [{i+1}/{len(PLAN)}] {tag}  ({dt:.0f}s)  measured(yaw,pitch,roll)={my}", flush=True)
    # atlas sorted by measured yaw (index 1 of insightface pose = yaw? order is [pitch,yaw,roll]); fall back to intended
    def yawkey(r):
        mp=r[3]; return mp[1] if (mp and mp[1] is not None) else 0
    rows_sorted=sorted(rows,key=yawkey)
    cols=5; tw=210; th=int(tw*H/W); rows_n=(len(rows_sorted)+cols-1)//cols; pad=26
    sheet=Image.new("RGB",(cols*tw,rows_n*(th+pad)),(12,13,16)); dr=ImageDraw.Draw(sheet)
    for k,(tag,png,tok,my) in enumerate(rows_sorted):
        c,r=k%cols,k//cols; x,y=c*tw,r*(th+pad)+pad
        sheet.paste(Image.open(png).convert("RGB").resize((tw,th)),(x,y))
        lab=f"want {tok['intended_yaw']}/{tok['intended_pitch']}"
        meas=f" meas(p,y,r)={my}" if tok.get('face_detected') else " no-detect"
        dr.text((x+4,y-22),lab,fill=(232,184,74)); dr.text((x+4,y-11),meas,fill=(0,255,102) if tok.get('face_detected') else (255,80,80))
    sheet.save(os.path.join(HERE,"gaze-atlas.png"))
    ndet=sum(1 for *_,t,_ in [(r[0],r[1],r[2],r[3]) for r in rows] if t.get('face_detected'))
    print(f"GAZE_RANGE_DONE {len(rows)} dirs, detected {ndet}")

if __name__ == "__main__":
    main()
