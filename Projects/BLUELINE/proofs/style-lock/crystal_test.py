#!/usr/bin/env python3
"""
BLUELINE · CHARACTER test — "The Crystal-Head" (Loudon's design): head is a large faceted CRYSTAL (no face),
fedora on top, duster coat over a horizontally-striped shirt, baggy Japanese workman trousers, normal human
arms/hands, one hand a folding pocketknife, the other a towel. A crystal head has no face to drift, so
description-lock should hold the identity. This nails the PROMPT on a few poses before any volume run.
Run (comfy venv, ComfyUI :8189): python3 crystal_test.py
Outputs -> style-lock/crystal-test/<pose>.png + crystal-finalists.png
"""
import os, json
from PIL import Image, ImageDraw
from style_explore import run   # run(wf, dest) against :8189

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "crystal-test"); os.makedirs(OUT, exist_ok=True)
CKPT = "sd_xl_base_1.0.safetensors"; W, H, STEPS, CFG = 832, 1216, 26, 6.5
STYLE = json.load(open(os.path.join(HERE, "locked-style.json")))["style"]

CHAR = ("a mysterious man whose head is ONE single large faceted translucent crystal gemstone, a glittering "
        "angular geometric crystal in place of a head, completely faceless, NO human head, a dark fedora hat "
        "resting on the crystal, wearing a long open duster coat over a horizontally striped shirt, baggy "
        "functional japanese workman trousers (tobi pants), ordinary human arms and hands, holding a small "
        "folding pocketknife in one hand and a hand towel in the other")
NEG = ("human head, human face, face, eyes, nose, mouth, facial features, skin face, portrait head, helmet, "
       "two heads, color, photograph, smooth digital shading, gradient, blurry, low quality, watermark, text, border")
POSES = [
    ("stand",  "standing square to camera in a rain-slick alley, full body, calm and still"),
    ("walk",   "walking toward camera through the rain, coat flaring, mid-stride"),
    ("leap",   "leaping across a rooftop gap, coat and crystal catching the light, dynamic"),
    ("crouch", "crouched low and tense, the pocketknife held ready"),
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
    files=[]
    for i,(tag,pose) in enumerate(POSES):
        prompt=f"{CHAR}, {pose}, {STYLE}"
        dest=os.path.join(OUT,f"{tag}.png")
        dt=run(graph(prompt, 3300+i, f"crystal_{tag}"), dest)
        files.append((dest,tag)); print(f"  [{i+1}/{len(POSES)}] {tag}  ({dt:.0f}s)", flush=True)
    tw=300; th=int(tw*H/W); pad=22
    m=Image.new("RGB",(tw*len(files), th+pad),(12,13,16)); dr=ImageDraw.Draw(m)
    for i,(p,tag) in enumerate(files):
        m.paste(Image.open(p).convert("RGB").resize((tw,th)),(i*tw,pad)); dr.text((i*tw+6,6),tag,fill=(232,184,74))
    m.save(os.path.join(HERE,"crystal-finalists.png"))
    print("CRYSTAL_TEST_DONE")

if __name__ == "__main__":
    main()
