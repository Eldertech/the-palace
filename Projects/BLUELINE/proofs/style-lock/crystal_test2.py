#!/usr/bin/env python3
"""
BLUELINE · CRYSTAL-HEAD prompt search v2. Base SDXL defaults to a human head; this tries 4 DIFFERENT phrasings
of "crystal instead of a head" (emphasis-weighted + concrete archetypes) on the SAME clear standing pose, to
find which phrasing actually renders the crystal. Winner becomes the locked character description.
Run (comfy venv, :8189): python3 crystal_test2.py
Outputs -> style-lock/crystal-test2/v{1..4}.png + crystal-v2.png montage
"""
import os, json
from PIL import Image, ImageDraw
from style_explore import run

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "crystal-test2"); os.makedirs(OUT, exist_ok=True)
CKPT = "sd_xl_base_1.0.safetensors"; W, H, STEPS, CFG = 832, 1216, 28, 7.0
STYLE = json.load(open(os.path.join(HERE, "locked-style.json")))["style"]
KIT = ("a dark fedora perched on top of the crystal, a long open duster coat over a horizontally striped shirt, "
       "baggy functional japanese workman trousers, ordinary human arms and hands, holding a folding pocketknife "
       "in one hand and a hand towel in the other, standing full body facing camera in a rain-slick alley")
NEG = ("(human head:1.5), (human face:1.5), face, eyes, nose, mouth, hair, facial features, skin face, neck stump, "
       "two heads, helmet, mask, color, photograph, blurry, low quality, watermark, text, border")
VARIANTS = {
 "v1_faceted": "(his head is one enormous faceted translucent crystal:1.6), a faceless angular gemstone head, light refracting through it",
 "v2_geode":   "(a jagged raw quartz crystal cluster sprouting where his head should be:1.7), a geode head, no face",
 "v3_diamond": "(a single huge cut diamond gem in place of his head:1.6), a prismatic crystal head, completely faceless",
 "v4_golem":   "(crystal golem:1.3), (his entire head replaced by one glowing crystal shard:1.7), a figure topped with a crystal instead of a head",
}

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
    for i,(tag,crystal) in enumerate(VARIANTS.items()):
        prompt=f"{crystal}, {KIT}, {STYLE}"
        dest=os.path.join(OUT,f"{tag}.png")
        dt=run(graph(prompt, 3400+i, f"cv2_{tag}"), dest)
        files.append((dest,tag)); print(f"  [{i+1}/{len(VARIANTS)}] {tag}  ({dt:.0f}s)", flush=True)
    tw=300; th=int(tw*H/W); pad=22
    m=Image.new("RGB",(tw*len(files), th+pad),(12,13,16)); dr=ImageDraw.Draw(m)
    for i,(p,tag) in enumerate(files):
        m.paste(Image.open(p).convert("RGB").resize((tw,th)),(i*tw,pad)); dr.text((i*tw+6,6),tag,fill=(232,184,74))
    m.save(os.path.join(HERE,"crystal-v2.png")); print("CRYSTAL_V2_DONE")

if __name__ == "__main__":
    main()
