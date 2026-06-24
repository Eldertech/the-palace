#!/usr/bin/env python3
"""
BLUELINE — gen-AI TEXT renderer. Renders the words-as-imagery prompts in text-prompts.json
to pure black on local ComfyUI (SDXL). Two modes:

  --mode skeleton  (DEFAULT) — "Blocked, Not Prompted, for TEXT": rasterize the word in a heavy
     font (the legible letterform SKELETON), Canny-lock it with controlnet-canny-sdxl, and let
     diffusion supply only the MATERIAL (embers / bleeding ink / flame / vapor). Legible AND
     expressive — the fix for diffusion's can't-spell weakness.
  --mode free — pure txt2img from the prompt. Max vibe, no legibility guarantee (good for SFX
     where the onomatopoeia is impressionistic).

Several seeds each (generate-many-select).
  <comfy venv>/python render_text.py                                  # all, skeleton, 2 seeds
  <comfy venv>/python render_text.py --only ascension,shout-no --seeds 2
  <comfy venv>/python render_text.py --mode free --only sfx-thoom
Outputs -> out/<id>_<mode>_s<seed>.png   (+ skel/<id>.png and a contact-sheet.html)
"""
import os, sys, json, time, argparse, subprocess, urllib.request, urllib.parse, uuid
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out"); os.makedirs(OUT, exist_ok=True)
SKEL = os.path.join(HERE, "skel"); os.makedirs(SKEL, exist_ok=True)
SPEC = json.load(open(os.path.join(HERE, "text-prompts.json")))
R = SPEC["render"]
HOST = "127.0.0.1:8188"; CLIENT = uuid.uuid4().hex
STYLE, NEG = SPEC["style_suffix"], SPEC["negative"]
FONT = "/System/Library/Fonts/Supplemental/Impact.ttf"   # heavy condensed display = strong canny edges

def req(method, path, data=None):
    h = {"Content-Type": "application/json"} if data else {}
    r = urllib.request.Request(f"http://{HOST}{path}", data=data, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=900) as resp: return resp.read()

def upload(path):
    name = os.path.basename(path)
    out = subprocess.run(["curl", "-sS", "-F", f"image=@{path};type=image/png;filename={name}",
                          "-F", "overwrite=true", f"http://{HOST}/upload/image"], capture_output=True, text=True, timeout=40)
    return json.loads(out.stdout).get("name", name)

def word_skeleton(words, dest):
    """White word(s) on black, heavy font, auto-fit + greedy-wrapped, centered — the legible skeleton."""
    W, H = R["size"]; img = Image.new("RGB", (W, H), "black"); d = ImageDraw.Draw(img)
    maxw, maxh = W * 0.86, H * 0.74
    chosen = None
    for size in range(360, 48, -8):
        f = ImageFont.truetype(FONT, size)
        lines, cur = [], ""
        for w in words.split():
            t = (cur + " " + w).strip()
            if d.textlength(t, font=f) <= maxw: cur = t
            else:
                if cur: lines.append(cur)
                cur = w
        if cur: lines.append(cur)
        asc, desc = f.getmetrics(); lh = (asc + desc) * 1.06
        if lines and max(d.textlength(l, font=f) for l in lines) <= maxw and lh * len(lines) <= maxh:
            chosen = (f, lines, lh); break
    f, lines, lh = chosen or (ImageFont.truetype(FONT, 64), [words], 80)
    total = lh * len(lines); y = (H - total) / 2
    for l in lines:
        x = (W - d.textlength(l, font=f)) / 2
        d.text((x, y), l, font=f, fill="white"); y += lh
    img.save(dest); return dest

def graph(prompt, seed, prefix, skel_name=None, cn=0.85):
    W, H = R["size"]
    g = {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": R["checkpoint"]}},
      "pos":  {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
      "neg":  {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["ckpt", 1]}},
      "latent": {"class_type": "EmptyLatentImage", "inputs": {"width": W, "height": H, "batch_size": 1}},
      "dec":  {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["dec", 0]}},
    }
    pos_link, neg_link = ["pos", 0], ["neg", 0]
    if skel_name:                       # Blocked-Not-Prompted: canny-lock the letterforms
        g["skel"]  = {"class_type": "LoadImage", "inputs": {"image": skel_name}}
        g["canny"] = {"class_type": "Canny", "inputs": {"image": ["skel", 0], "low_threshold": 0.1, "high_threshold": 0.3}}
        g["cn"]    = {"class_type": "ControlNetLoader", "inputs": {"control_net_name": "controlnet-canny-sdxl.safetensors"}}
        g["ap"]    = {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": pos_link, "negative": neg_link,
                       "control_net": ["cn", 0], "image": ["canny", 0], "strength": cn, "start_percent": 0.0, "end_percent": 1.0}}
        pos_link, neg_link = ["ap", 0], ["ap", 1]
    g["samp"] = {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": pos_link, "negative": neg_link,
                 "latent_image": ["latent", 0], "seed": seed, "steps": R["steps"], "cfg": R["cfg"],
                 "sampler_name": R["sampler"], "scheduler": R["scheduler"], "denoise": 1.0}}
    return g

def run(wf, dest):
    pid = json.loads(req("POST", "/prompt", json.dumps({"prompt": wf, "client_id": CLIENT}).encode()))["prompt_id"]
    t0 = time.time()
    while True:
        h = json.loads(req("GET", f"/history/{pid}"))
        if pid in h: hist = h[pid]; break
        if time.time() - t0 > 900: raise TimeoutError(pid)
        time.sleep(2)
    if hist.get("status", {}).get("status_str") != "success":
        raise RuntimeError(json.dumps(hist.get("status", {}))[:400])
    for _, o in hist.get("outputs", {}).items():
        for img in o.get("images", []):
            q = urllib.parse.urlencode({"filename": img["filename"], "subfolder": img.get("subfolder", ""), "type": img.get("type", "output")})
            open(dest, "wb").write(req("GET", "/view?" + q)); return time.time() - t0
    raise RuntimeError("no image")

def contact_sheet(rendered):
    rows = []
    for p in SPEC["prompts"]:
        shots = [d for (i, d) in rendered if i == p["id"]]
        if not shots: continue
        cells = "".join(f'<figure><img src="out/{os.path.basename(d)}"><figcaption>{os.path.basename(d)}</figcaption></figure>' for d in shots)
        rows.append(f'<section><h2>{p["id"]} · <span>{p["type"]} · {p["source"]} · {p["emotion"]}</span> <em>"{p["words"]}"</em></h2><div class="row">{cells}</div></section>')
    html = ('<!doctype html><meta charset=utf-8><title>BLUELINE — gen-AI text · contact sheet</title>'
            '<style>body{background:#0b0b0d;color:#e9e7e2;font-family:JetBrains Mono,monospace;margin:0;padding:24px}'
            'h1{font-family:Anton,Impact,sans-serif;letter-spacing:.04em}section{margin:0 0 28px}'
            'h2{font-size:13px;color:#e0a83a;font-weight:400}h2 span{color:#8b8d96}h2 em{color:#e9e7e2;font-style:normal}'
            '.row{display:flex;gap:10px;flex-wrap:wrap}figure{margin:0}img{height:210px;background:#000;border:1px solid #2c2e36;border-radius:6px;display:block}'
            'figcaption{font-size:9px;color:#6a6c75;margin-top:3px}</style>'
            '<h1>BLUELINE · gen-AI text on black — pick the keepers</h1>' + "".join(rows))
    open(os.path.join(HERE, "contact-sheet.html"), "w").write(html)

def main(only, seeds, mode):
    prompts = [p for p in SPEC["prompts"] if (not only or p["id"] in only)]
    base_seeds = [1111, 2222, 3333, 4444, 5555, 6666][:seeds]
    rendered = []
    print(f"rendering {len(prompts)} prompt(s) x {seeds} seed(s) [{mode}] on {HOST}", flush=True)
    for p in prompts:
        full = f'{p["positive"]}, {STYLE}'
        skel_name = None
        if mode == "skeleton":
            sk = word_skeleton(p["words"], os.path.join(SKEL, f'{p["id"]}.png'))
            skel_name = upload(sk)
        for sd in base_seeds:
            dest = os.path.join(OUT, f'{p["id"]}_{mode}_s{sd}.png')
            try:
                dt = run(graph(full, sd, f'txt_{p["id"]}_{mode}_s{sd}', skel_name), dest)
                rendered.append((p["id"], dest))
                print(f'  [{p["id"]}] "{p["words"]}" {mode} seed={sd} ({dt:.0f}s) -> {os.path.basename(dest)}', flush=True)
            except Exception as e:
                print(f'  [{p["id"]}] seed={sd} FAILED: {str(e)[:160]}', flush=True)
        contact_sheet(rendered)
    print(f"TEXT_RENDER_DONE — {len(rendered)} images -> out/  ·  open contact-sheet.html", flush=True)

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default=None, help="comma-separated prompt ids")
    ap.add_argument("--seeds", type=int, default=2)
    ap.add_argument("--mode", choices=["skeleton", "free"], default="skeleton")
    a = ap.parse_args()
    only = set(a.only.split(",")) if a.only else None
    main(only, a.seeds, a.mode)
