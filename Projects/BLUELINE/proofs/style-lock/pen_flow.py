#!/usr/bin/env python3
"""
BLUELINE · STYLE candidate "PEN-FLOW" — Loudon's synthesis from the finalist montage:
  modern PEN AND INK (the first tile he loved) + scattered INK BLOBS/splatter
  + the dramatic sweeping FLOW LINES / speed streaks from the noir sprinter (last tile),
  stark high-contrast B&W, film-noir, on rough white paper.
Renders N action frames in this one recipe (style held, pose varied) + a montage to confirm the look.
Run (comfy venv, ComfyUI :8189): python3 pen_flow.py
"""
import os, json
from PIL import Image, ImageDraw
from style_explore import graph, run   # graph(prompt, seed, prefix); 832x1216, our SDXL settings

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "penflow"); os.makedirs(OUT, exist_ok=True)
PEN_FLOW = ("modern pen and ink illustration, loose gestural linework with bold dramatic sweeping FLOW LINES "
            "and speed streaks driving the motion, scattered energetic ink blobs and splatter, stark "
            "high-contrast black and white, film-noir deep shadow, rough white paper, lots of white space, "
            "dynamic foreshortening, low canted angle")
SUBJECTS = [
    ("sprint", "a trench-coated detective sprinting through pouring rain, coat flaring behind"),
    ("leap",   "a figure leaping between rooftops, coat and scarf streaming"),
    ("draw",   "a gunslinger spinning low to fire, duster whipping around"),
    ("recoil", "a boxer's head snapping back from an uppercut, sweat flying off in an arc"),
]

def main():
    files = []
    for i,(tag,subj) in enumerate(SUBJECTS):
        prompt = f"{subj}, {PEN_FLOW}"
        dest = os.path.join(OUT, f"{tag}.png")
        dt = run(graph(prompt, 8100+i, f"penflow_{tag}"), dest)
        files.append((dest, tag)); print(f"  [{i+1}/{len(SUBJECTS)}] {tag}  ({dt:.0f}s)", flush=True)
    # montage
    tw=300; th=int(tw*1216/832); pad=22
    m=Image.new("RGB",(tw*len(files), th+pad),(12,13,16)); dr=ImageDraw.Draw(m)
    for i,(p,tag) in enumerate(files):
        im=Image.open(p).convert("RGB").resize((tw,th)); m.paste(im,(i*tw,pad)); dr.text((i*tw+6,6),tag,fill=(232,184,74))
    m.save(os.path.join(HERE,"penflow-finalists.png"))
    json.dump({"recipe":PEN_FLOW,"frames":[t for _,t in files]}, open(os.path.join(OUT,"recipe.json"),"w"), indent=2)
    print("PEN_FLOW_DONE")

if __name__ == "__main__":
    main()
