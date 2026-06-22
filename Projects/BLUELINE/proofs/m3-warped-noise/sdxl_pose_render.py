#!/usr/bin/env python3
"""
BLUELINE · POSE EXPLOSION on the pod — SDXL (the HAND-DRAWN look). FLUX rendered the pen-flow style too
clean/vector; SDXL keeps the rough, gestural, ink-on-paper quality Loudon locked. Same locked pen-flow recipe
× the comic-action-pose library, SDXL txt2img at 832×1216 (the resolution of the sprinter he loved), fast on
a real GPU. Reuses m3_pod_render.Pod (hardened transport). Driven by sdxl_orchestrator.py.

Run via:  python3 sdxl_orchestrator.py --render-args "--n 100 --vary-cast"
Outputs -> Projects/BLUELINE/proofs/style-lock/sdxl-poses/<id>.png + manifest.json + a contact sheet every 12.
"""
import argparse, json, time, sys
from pathlib import Path
from m3_pod_render import Pod

HERE = Path(__file__).resolve().parent
STYLELOCK = HERE.parent / "style-lock"
OUT = STYLELOCK / "sdxl-poses"; OUT.mkdir(parents=True, exist_ok=True)
CKPT = "sd_xl_base_1.0.safetensors"
W, H, STEPS, CFG = 832, 1216, 26, 6.5

LOCK = json.loads((STYLELOCK / "locked-style.json").read_text())
STYLE = LOCK["style"]; NEG = LOCK.get("neg_extra", "color, blurry, low quality, watermark, text")
MOTION = ("explosive dynamic action, dramatic foreshortening, film-noir high contrast and deep shadow, "
          "striking comic-book panel composition")
CAST = ["a lean figure in a long coat","a wiry woman in a hooded jacket","a heavy bruiser in rolled sleeves",
        "a masked vigilante","a detective in a fedora","a street kid in a torn jacket","an old swordsman","a soldier in battered gear"]
CHAR_DEFAULT = "a lean figure in a long coat"
ACTIONS = ["leaping between rooftops","skidding hard around a corner","throwing a haymaker punch","diving behind cover as glass shatters",
 "sprinting from a fireball","drawing a blade in mid-turn","crashing shoulder-first through a window","vaulting over a railing",
 "sliding under a closing gate","catching a falling body at the last second","recoiling from a blow, head snapped back",
 "firing mid-dive, twisting in the air","kicking a door off its hinges","grappling, two bodies twisting","falling through the air, reaching up",
 "landing hard in a three-point crouch","swinging across a gap on a chain","parrying a strike as sparks fly","hurling an opponent over the shoulder",
 "running along a sheer wall","ducking under a swinging pipe","charging head-on, fist cocked","backflipping off a car hood",
 "dragging a wounded ally through smoke","wrenching a weapon from an attacker","leaping down a stairwell, coat billowing",
 "spinning to block two attackers","exploding out of a crouch into a sprint","slamming an enemy into a brick wall","reaching as a hand slips away"]
CAMERA = ["low canted worm's-eye angle","extreme foreshortening toward the viewer","high angle looking steeply down",
          "dutch-tilt full-body wide shot","tight close on the face mid-yell","over-the-shoulder into the action","silhouetted against a blown-out sky"]
INTENSITY = ["explosive radiating motion lines","sheets of rain and spray","shattering glass shards","billowing dust and debris",
             "hard speed streaks","a single dramatic spotlight in deep shadow","ink-splatter impact energy","flying sweat and grit"]

def slug(s): return "".join(c if c.isalnum() else "-" for c in s.lower())[:26].strip("-")

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

def contact_sheet(frames, n):
    from PIL import Image
    cols=4; tw=240; th=int(tw*H/W); show=frames[-min(len(frames),24):]
    rows=(len(show)+cols-1)//cols
    s=Image.new("RGB",(cols*tw, rows*th),(12,13,16))
    for k,f in enumerate(show):
        try: s.paste(Image.open(STYLELOCK/f["file"]).convert("RGB").resize((tw,th)),((k%cols)*tw,(k//cols)*th))
        except Exception: pass
    s.save(OUT/f"sheet_{n:03d}.png")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", required=True); ap.add_argument("--n", type=int, default=100); ap.add_argument("--vary-cast", action="store_true")
    a = ap.parse_args()
    pod = Pod(a.pod); print(f"SDXL pose run | {pod.B} | style=[{LOCK['name']}] n={a.n} {W}x{H}/{STEPS} cast={'varied' if a.vary_cast else 'single'}", flush=True)
    if not pod.alive(): sys.exit(f"pod {a.pod} not reachable")
    time.sleep(8)
    manifest, seen, i = [], set(), 0
    while i < a.n:
        act=ACTIONS[(i*7)%len(ACTIONS)]; cam=CAMERA[(i*3)%len(CAMERA)]; fx=INTENSITY[(i*5)%len(INTENSITY)]
        char=CAST[i%len(CAST)] if a.vary_cast else CHAR_DEFAULT
        k=(act,cam,fx,char)
        if k in seen: i+=1; continue
        seen.add(k)
        prompt=f"{char} {act}, {cam}, {MOTION}, {fx}, {STYLE}"
        tag=f"{i:03d}_{slug(act)}"; t0=time.time()
        try:
            jid=pod.submit(graph(prompt, 9000+i, tag)); hist=pod.wait(jid)
            if hist.get("status",{}).get("status_str")!="success": raise RuntimeError(json.dumps(hist.get("status",{}))[:200])
            pod.fetch(hist, str(OUT/f"{tag}.png"))
        except Exception as e:
            print(f"  [{i+1}/{a.n}] {tag} FAILED {repr(e)[:140]}", flush=True); i+=1; continue
        manifest.append({"file":f"sdxl-poses/{tag}.png","action":act,"camera":cam,"intensity":fx,"character":char})
        json.dump({"style":LOCK["name"],"recipe":STYLE,"frames":manifest}, open(OUT/"manifest.json","w"), indent=2)
        print(f"  [{i+1}/{a.n}] {tag}  ({time.time()-t0:.0f}s)", flush=True)
        if len(manifest)%12==0: contact_sheet(manifest, len(manifest)//12)
        i+=1
    contact_sheet(manifest, 999)
    print("SDXL_POSE_DONE", len(manifest))

if __name__ == "__main__":
    main()
