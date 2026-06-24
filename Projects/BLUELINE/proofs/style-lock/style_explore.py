#!/usr/bin/env python3
"""
BLUELINE · STYLE-LOCK — volume generator (free, local SDXL on :8189). The method Loudon asked for:
generate MANY, then toss the outliers (style_score.py) — don't trust a single sample.

LOCKED look (Loudon's pick): black chisel-tip marker + sparse grey DRY-BRUSH, LOOSE & GESTURAL strokes that
amplify motion, on rough white cold-press watercolor paper (sumi-e / Inoue-Vagabond / manga ink lineage).

--grid: the consistency test — the locked recipe across a DIVERSE cast x several takes (so we can both see
the look hold across many characters AND toss the outliers), plus a 3-tile tone-confirm strip on one hero.
Run:  <comfy venv>/python style_explore.py --grid
      <comfy venv>/python style_explore.py --subject 0 --n 16   # deep volume on one character
Expects ComfyUI on :8189 with sd_xl_base_1.0. Outputs -> style-lock/runs/<tag>.png + runs/index.json.
"""
import os, json, time, argparse, urllib.request, urllib.parse, uuid

HOST = os.environ.get("COMFY_HOST", "127.0.0.1:8189")
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "runs"); os.makedirs(OUT, exist_ok=True)
CKPT = "sd_xl_base_1.0.safetensors"
CLIENT = uuid.uuid4().hex

SUBSTRATE = ("hand-drawn with a black chisel-tip marker on rough white cold-press watercolor paper, "
             "visible paper tooth, broken dry ink edges, monochrome black and white, lots of white space, "
             "confident calligraphic linework, manga and sumi-e ink influence")
NEG = ("color, colour, photograph, photorealistic, 3d render, grey background, smooth digital shading, "
       "gradient, blurry, low quality, watermark, text, signature, frame, border, "
       "static, stiff, standing still, posed portrait, symmetrical, calm, motionless, bust shot")
TONES = {"ink":"pure black ink, no grey, stark high contrast, white paper",
         "dry":"black ink with sparse grey dry-brush half-tones",
         "wash":"black ink with a few soft grey ink-wash tones for depth"}
LINES = {"gestural":"loose gestural brush strokes, weighted lines that amplify motion, energetic sweep",
         "tight":"tight confident economical chisel-marker contour line, clean and deliberate",
         "scratchy":"rough scratchy multi-stroke ink, raw and kinetic"}
SUBJECTS = [   # action/noir cast — people IN MOTION, varied bodies & roles (no portraits, no standing)
    "a trench-coated detective sprinting through rain-slick streets, coat flaring behind",
    "two figures mid-fistfight, one snapping back from a hook punch",
    "a woman leaping a rooftop gap, hair and coat streaming",
    "a man crashing shoulder-first through a door, splinters flying",
    "a gunslinger spinning low to fire, duster whipping around",
    "a runner vaulting over the hood of a car, caught mid-air",
    "a fighter torquing violently to dodge a strike",
    "a figure falling backward off a ledge, arms flailing",
    "a boxer driving an uppercut, sweat flying off the jaw",
    "a thief sliding under a closing shutter, dust kicked up",
    "a dancer hurled into a dramatic spinning backbend",
    "a motorcyclist laying the bike into a hard skidding turn",
    "a swordsman lunging in a deep forward stride, blade trailing light",
    "a cornered figure whipping around, scarf snapping across the frame",
]
LOCK_TONE, LOCK_LINE = "dry", "gestural"     # Loudon's pick
W, H, STEPS, CFG = 832, 1216, 24, 6.5

def req(method, path, data=None):
    h = {"Content-Type":"application/json"} if data else {}
    r = urllib.request.Request(f"http://{HOST}{path}", data=data, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=900) as resp: return resp.read()

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

def run(wf, dest):
    pid = json.loads(req("POST","/prompt",json.dumps({"prompt":wf,"client_id":CLIENT}).encode()))["prompt_id"]
    t0 = time.time()
    while True:
        h = json.loads(req("GET", f"/history/{pid}"))
        if pid in h: hist = h[pid]; break
        if time.time()-t0 > 900: raise TimeoutError(pid)
        time.sleep(2)
    if hist.get("status",{}).get("status_str") != "success":
        raise RuntimeError(f"failed: {json.dumps(hist.get('status',{}))[:300]}")
    for _, o in hist.get("outputs", {}).items():
        for img in o.get("images", []):
            q = urllib.parse.urlencode({"filename":img["filename"],"subfolder":img.get("subfolder",""),"type":img.get("type","output")})
            open(dest,"wb").write(req("GET","/view?"+q)); return time.time()-t0
    raise RuntimeError("no image")

def build_jobs(a):
    jobs = []
    if a.grid:
        line = LINES[LOCK_LINE]; tone = TONES[LOCK_TONE]
        TAKES = 3
        for si, subj in enumerate(SUBJECTS[:5]):          # diverse cast — does ONE look hold across all?
            for k in range(TAKES):                         # takes per character — volume to toss outliers
                jobs.append((f"lock_s{si}_t{k}", f"{subj}, {line}, {tone}, {SUBSTRATE}",
                             2000+si*10+k, {"kind":"lock","subject":si,"take":k}))
        for tn in ("ink","dry","wash"):                    # tone-confirm strip on the hero (eyeball the grey)
            jobs.append((f"tone_{tn}", f"{SUBJECTS[0]}, {LINES[LOCK_LINE]}, {TONES[tn]}, {SUBSTRATE}",
                         9000+hash(tn)%100, {"kind":"tone","tone":tn}))
    else:
        subj, tone, line = SUBJECTS[a.subject], TONES[a.tone], LINES[a.line]
        for k in range(a.n):
            jobs.append((f"take_{a.tone}_{a.line}_s{a.subject}_{k:02d}",
                         f"{subj}, {line}, {tone}, {SUBSTRATE}", 4000+k,
                         {"kind":"take","subject":a.subject,"take":k}))
    return jobs

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--grid", action="store_true")
    ap.add_argument("--subject", type=int, default=0)
    ap.add_argument("--tone", default=LOCK_TONE, choices=list(TONES))
    ap.add_argument("--line", default=LOCK_LINE, choices=list(LINES))
    ap.add_argument("--n", type=int, default=16)
    a = ap.parse_args()
    jobs = build_jobs(a)
    print(f"STYLE_EXPLORE host={HOST} jobs={len(jobs)} size={W}x{H} steps={STEPS} lock={LOCK_TONE}-{LOCK_LINE}")
    index = []
    for i,(tag,prompt,seed,meta) in enumerate(jobs):
        dt = run(graph(prompt, seed, tag), os.path.join(OUT, f"{tag}.png"))
        index.append({"tag":tag,"file":f"runs/{tag}.png","prompt":prompt,"seed":seed,**meta})
        print(f"  [{i+1}/{len(jobs)}] {tag}  ({dt:.0f}s)", flush=True)
    json.dump({"substrate":SUBSTRATE,"neg":NEG,"lock":f"{LOCK_TONE}-{LOCK_LINE}","jobs":index},
              open(os.path.join(OUT,"index.json"),"w"), indent=2)
    print("STYLE_EXPLORE_DONE", len(index))

if __name__ == "__main__":
    main()
