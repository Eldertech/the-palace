#!/usr/bin/env python3
"""
BLUELINE · POSE EXPLOSION — once the ONE style is locked, work it and work it: render that single style across
a HUGE number of comic-book ACTION poses. Style is held constant; POSE/framing/intensity vary wildly, so the
output reads like flipping through a stack of action panels in one consistent hand.

Combinatorial comic-action library: ACTION beat x CAMERA framing x INTENSITY fx (x optional character) ->
thousands of distinct frames; samples unique combos. Locked style from --tone/--line/--dens (defaults to
Loudon's pick: dry-gestural-medium) or from locked-style.json if present.

Run (comfy venv, ComfyUI :8189):
    python3 pose_engine.py --n 60                 # 60 action frames in the locked style
    python3 pose_engine.py --n 300 --vary-cast    # a huge set, varied characters (overnight / pod)
Outputs -> style-lock/poses/<idx>_<slug>.png + poses/manifest.json + a contact sheet every 12 frames.
"""
import os, sys, json, argparse
from style_explore import req, run, SUBSTRATE, NEG, TONES, LINES

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "poses"); os.makedirs(OUT, exist_ok=True)
CKPT = "sd_xl_base_1.0.safetensors"; W, H, STEPS, CFG = 832, 1152, 22, 6.5
DENS = {"sparse":"economical, lots of white space","medium":"balanced ink","dense":"dense heavy ink"}

CHAR_DEFAULT = "a lean figure in a long coat"
CAST = ["a lean figure in a long coat","a wiry woman in a hooded jacket","a heavy bruiser in rolled sleeves",
        "a masked vigilante","a detective in a fedora","a street kid in a torn jacket","an old swordsman",
        "a soldier in battered gear"]
ACTIONS = [
 "leaping between rooftops","skidding hard around a corner","throwing a haymaker punch","diving behind cover as glass shatters",
 "sprinting away from a fireball","drawing a blade in mid-turn","crashing shoulder-first through a window","vaulting over a railing",
 "sliding under a closing gate","catching a falling body at the last second","recoiling from a blow, head snapped back",
 "firing mid-dive, twisting in the air","kicking a door off its hinges","grappling, two bodies twisting","falling through the air, reaching up",
 "landing hard in a three-point crouch","swinging across a gap on a chain","parrying a strike as sparks fly","hurling an opponent over the shoulder",
 "running along a sheer wall","ducking under a swinging pipe","charging head-on, fist cocked","backflipping off a car hood",
 "dragging a wounded ally through smoke","wrenching a weapon from an attacker","leaping down a stairwell, coat billowing",
 "spinning to block two attackers","exploding out of a crouch into a sprint","slamming an enemy into a brick wall","reaching desperately as a hand slips away"]
CAMERA = ["low canted worm's-eye angle","extreme foreshortening toward the viewer","high angle looking steeply down",
          "dutch-tilt full-body wide shot","tight close on the face mid-yell","over-the-shoulder into the action","silhouetted against a blown-out sky"]
INTENSITY = ["explosive radiating motion lines","sheets of rain and spray","shattering glass shards","billowing dust and debris",
             "hard speed streaks","a single dramatic spotlight in deep shadow","ink-splatter impact energy","flying sweat and grit"]
MOTION = ("explosive dynamic action, dramatic foreshortening, film-noir high contrast and deep shadow, "
          "comic-book and graphic-novel panel intensity")

def slug(s): return "".join(c if c.isalnum() else "-" for c in s.lower())[:28].strip("-")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=60)
    ap.add_argument("--tone", default=None); ap.add_argument("--line", default=None); ap.add_argument("--dens", default="medium")
    ap.add_argument("--vary-cast", action="store_true")
    a = ap.parse_args()
    lock = {}
    lf = os.path.join(HERE, "locked-style.json")
    if os.path.isfile(lf): lock = json.load(open(lf))
    tone = a.tone or lock.get("tone","dry"); line = a.line or lock.get("line","gestural"); dens = a.dens or lock.get("density","medium")
    # the locked style is a full verbatim recipe (pen-flow) when locked-style.json carries one; else assemble from axes
    STYLE = lock.get("style") or f"{LINES[line]}, {TONES[tone]}, {DENS[dens]}, {SUBSTRATE}"
    NEG_USE = lock.get("neg_extra", NEG)
    print(f"POSE_ENGINE locked=[{lock.get('name', tone+'-'+line+'-'+dens)}] n={a.n} cast={'varied' if a.vary_cast else 'single'} size={W}x{H}")

    def graph(prompt, seed, prefix):
        return {"ckpt":{"class_type":"CheckpointLoaderSimple","inputs":{"ckpt_name":CKPT}},
          "pos":{"class_type":"CLIPTextEncode","inputs":{"text":prompt,"clip":["ckpt",1]}},
          "neg":{"class_type":"CLIPTextEncode","inputs":{"text":NEG_USE,"clip":["ckpt",1]}},
          "latent":{"class_type":"EmptyLatentImage","inputs":{"width":W,"height":H,"batch_size":1}},
          "samp":{"class_type":"KSampler","inputs":{"model":["ckpt",0],"positive":["pos",0],"negative":["neg",0],
                  "latent_image":["latent",0],"seed":seed,"steps":STEPS,"cfg":CFG,"sampler_name":"dpmpp_2m","scheduler":"karras","denoise":1.0}},
          "dec":{"class_type":"VAEDecode","inputs":{"samples":["samp",0],"vae":["ckpt",2]}},
          "save":{"class_type":"SaveImage","inputs":{"filename_prefix":prefix,"images":["dec",0]}}}

    manifest = []
    seen = set()
    i = 0
    while i < a.n:
        # deterministic-but-spread combo from the index
        act = ACTIONS[(i*7) % len(ACTIONS)]; cam = CAMERA[(i*3) % len(CAMERA)]; fx = INTENSITY[(i*5) % len(INTENSITY)]
        char = CAST[i % len(CAST)] if a.vary_cast else CHAR_DEFAULT
        keyc = (act, cam, fx, char)
        if keyc in seen: i += 1; continue
        seen.add(keyc)
        prompt = f"{char} {act}, {cam}, {MOTION}, {fx}, {STYLE}"
        tag = f"{i:03d}_{slug(act)}"
        try:
            dt = run(graph(prompt, 7000+i, tag), os.path.join(OUT, f"{tag}.png"))
        except Exception as e:
            print(f"  [{i+1}/{a.n}] {tag} FAILED {repr(e)[:120]}", flush=True); i += 1; continue
        manifest.append({"file":f"poses/{tag}.png","action":act,"camera":cam,"intensity":fx,"character":char,
                         "tone":tone,"line":line,"density":dens})
        json.dump({"style":f"{tone}-{line}-{dens}","prompt_template":STYLE,"frames":manifest},
                  open(os.path.join(OUT,"manifest.json"),"w"), indent=2)
        print(f"  [{i+1}/{a.n}] {tag}  ({dt:.0f}s)", flush=True)
        if len(manifest) % 12 == 0: contact_sheet(manifest, len(manifest)//12)
        i += 1
    contact_sheet(manifest, 999)
    print("POSE_ENGINE_DONE", len(manifest))

def contact_sheet(frames, n):
    from PIL import Image
    cols=4; tw=240; th=int(tw*H/W); show=frames[-min(len(frames),24):]
    rows=(len(show)+cols-1)//cols
    s=Image.new("RGB",(cols*tw, rows*th),(12,13,16))
    for k,f in enumerate(show):
        try: im=Image.open(os.path.join(HERE,f["file"])).convert("RGB").resize((tw,th))
        except Exception: continue
        s.paste(im,((k%cols)*tw,(k//cols)*th))
    s.save(os.path.join(OUT,f"sheet_{n:03d}.png"))

if __name__ == "__main__":
    main()
