#!/usr/bin/env python3
"""
BLUELINE · TASTE-BREEDER — pool generator. Builds a STYLE-SPANNING pool for the intuition game: many small
fast candidates varying tone x line x density x subject, each tagged with its axis values so the game's
taste model can learn which axes Loudon's clicks favour. Faster/smaller than style_explore (volume > size).

Run (comfy venv, ComfyUI on :8189):
    python3 pool_gen.py            # generate the spanning pool + (re)write pool-manifest.json
    python3 pool_gen.py --manifest # just (re)scan runs/ and rebuild the manifest, no generation
Outputs -> style-lock/runs/pool_*.png + style-lock/pool-manifest.json
"""
import os, sys, json, glob, argparse
from style_explore import req, run, SUBSTRATE, NEG, TONES, LINES, SUBJECTS, CKPT

HERE = os.path.dirname(os.path.abspath(__file__)); RUNS = os.path.join(HERE, "runs")
os.makedirs(RUNS, exist_ok=True)
W, H, STEPS, CFG = 640, 896, 18, 6.5          # smaller+faster: the breeder wants many candidates
DENSITY = {"sparse":"economical, lots of white space, minimal marks",
           "medium":"balanced amount of ink and detail",
           "dense":"dense hatching and heavy ink, filled composition"}

def graph(prompt, seed, prefix):
    return {
      "ckpt":{"class_type":"CheckpointLoaderSimple","inputs":{"ckpt_name":CKPT}},
      "pos":{"class_type":"CLIPTextEncode","inputs":{"text":prompt,"clip":["ckpt",1]}},
      "neg":{"class_type":"CLIPTextEncode","inputs":{"text":NEG,"clip":["ckpt",1]}},
      "latent":{"class_type":"EmptyLatentImage","inputs":{"width":W,"height":H,"batch_size":1}},
      "samp":{"class_type":"KSampler","inputs":{"model":["ckpt",0],"positive":["pos",0],"negative":["neg",0],
              "latent_image":["latent",0],"seed":seed,"steps":STEPS,"cfg":CFG,
              "sampler_name":"dpmpp_2m","scheduler":"karras","denoise":1.0}},
      "dec":{"class_type":"VAEDecode","inputs":{"samples":["samp",0],"vae":["ckpt",2]}},
      "save":{"class_type":"SaveImage","inputs":{"filename_prefix":prefix,"images":["dec",0]}},
    }

MOTION = ("explosive dynamic action pose, strong sense of movement, dramatic foreshortening, "
          "sweeping motion lines and speed streaks, low canted camera angle, film-noir high contrast "
          "and deep shadow, comic-book and graphic-novel panel intensity")

def prompt_for(tone, line, dens, subj_i):
    return f"{SUBJECTS[subj_i]}, {MOTION}, {LINES[line]}, {TONES[tone]}, {DENSITY[dens]}, {SUBSTRATE}"

def jobs_plan():
    jobs, seed = [], 6000
    # 1. SUBJECT VARIETY first — the locked dry-gestural look across the WHOLE action cast (kills repetition)
    for si in range(len(SUBJECTS)):
        jobs.append(("dry", "gestural", "medium", si, seed)); seed += 1
    # 2. style spread — tone x line on two action heroes (so taste still discriminates style)
    for si in (0, 4):
        for tn in TONES:
            for ln in LINES:
                if (tn, ln) == ("dry", "gestural"):  # already covered in pass 1
                    continue
                jobs.append((tn, ln, "medium", si, seed)); seed += 1
    # 3. density feel on a hero
    for dn in ("sparse", "dense"):
        jobs.append(("dry", "gestural", dn, 0, seed)); seed += 1
    return jobs

def tag_existing():
    """Tag the locked-grid leftovers (lock_s#_t#) that already exist: dry-gestural, medium density."""
    out = []
    for f in sorted(glob.glob(os.path.join(RUNS, "lock_s*_t*.png"))):
        b = os.path.basename(f); si = int(b.split("_s")[1].split("_")[0])
        out.append({"file": f"runs/{b}", "tone":"dry","line":"gestural","density":"medium","subject":si})
    return out

def build_manifest():
    entries = tag_existing()
    for f in sorted(glob.glob(os.path.join(RUNS, "pool_*.png"))):
        b = os.path.basename(f)[:-4].split("_")   # pool_<tone>_<line>_<dens>_s<subj>
        tone, line, dens = b[1], b[2], b[3]; subj = int(b[4][1:])
        entries.append({"file": f"runs/{os.path.basename(f)}", "tone":tone,"line":line,"density":dens,"subject":subj})
    axes = {"tone":list(TONES), "line":list(LINES), "density":list(DENSITY),
            "subject":list(range(len(SUBJECTS)))}
    json.dump({"axes":axes, "subjects":SUBJECTS, "images":entries},
              open(os.path.join(HERE,"pool-manifest.json"),"w"), indent=2)
    print(f"manifest: {len(entries)} images -> pool-manifest.json")
    return entries

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--manifest", action="store_true"); a = ap.parse_args()
    if not a.manifest:
        plan = jobs_plan()
        print(f"POOL_GEN jobs={len(plan)} size={W}x{H} steps={STEPS}")
        for i,(tn,ln,dn,si,seed) in enumerate(plan):
            tag = f"pool_{tn}_{ln}_{dn}_s{si}"
            dt = run(graph(prompt_for(tn,ln,dn,si), seed, tag), os.path.join(RUNS, f"{tag}.png"))
            print(f"  [{i+1}/{len(plan)}] {tag}  ({dt:.0f}s)", flush=True)
            build_manifest()   # rewrite each step so the game sees the pool grow live
    build_manifest()
    print("POOL_GEN_DONE")

if __name__ == "__main__":
    main()
