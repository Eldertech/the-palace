#!/usr/bin/env python3
"""Style atlas renderer for the Visual Language Console (BLUELINE Phase 2) — LOCAL SDXL.

Renders the console's decomposed style vocabulary in pen-flow ink, sweeping ONE
fader at a time (subject + seed held constant) so each strip shows exactly what
that variable does to the look. Drives local ComfyUI on :8189 (free, SDXL staged).

  python3 style_atlas.py --smoke     # 1 frame (the pen-flow preset) — proves the local path
  python3 style_atlas.py             # full atlas (~47 frames) + per-fader contact strips
"""
import os, sys, json, time, argparse, urllib.request, urllib.parse, uuid
from pathlib import Path

HOST = os.environ.get("COMFY_HOST", "127.0.0.1:8189")
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
LOCK = ROOT / "Projects" / "BLUELINE" / "proofs" / "style-lock" / "locked-style.json"
FRAMES = HERE / "frames"
CKPT = "sd_xl_base_1.0.safetensors"
CLIENT = uuid.uuid4().hex
W, H, STEPS, CFG = 768, 1024, 20, 6.5
SEED = 77
SUBJECT = "a lone figure standing in a tall lit doorway, seen from a low dramatic angle, full body"

# ── console vocabulary (mirrors the mixing-board tool) ───────────────────────
INK   = ["fine crowquill line, thin delicate ink linework","fine pen line","medium ink line","bold brush line","heavy brush inking, thick confident brushstrokes"]
CHAR  = ["ligne claire, clear even line, no hatching","clean controlled line","natural inked line","loose expressive line","scratchy dry-nib ink line"]
BLACK = ["open airy linework, minimal blacks","light blacks","balanced spotted blacks","heavy spotted blacks, high contrast","near-solid noir blacks, bold black shapes, high contrast"]
MARK  = ["solid flat black fills","parallel-line hatching","cross-hatching, intersecting line shading","ink feathering, tapered barb-lines"]
DETAIL= ["minimal detail, essential shapes only","spare detail","moderate detail","rich detailed linework","intricate dense linework"]
ABSTR = ["naturalistic proportions, observational","lightly stylized","stylized","simplified forms","simplified iconic cartooning, flat graphic shapes"]
CONTR = ["flat even high-key lighting","bright lighting","mid-key lighting","shadowed low light","low-key single-source lighting, deep noir shadows, raking light"]
MEDIUM= {"pen":"pen and ink, crowquill","brush":"brush and ink, expressive brushstrokes","dry-brush":"dry-brush texture, scratchboard","woodcut":"black-and-white woodcut relief print, bold carved lines","pencil":"graphite pencil on toned paper"}

DEFAULT = dict(ink=3, char=3, black=3, mark=2, detail=2, abstr=2, contrast=4, medium="brush", mode="B&W", hue="crimson", carries="object")
PRESETS = {
    "pen-flow":     dict(DEFAULT, ink=4, char=3, black=4, mark=4, detail=2, abstr=2, contrast=4, medium="brush", mode="B&W"),
    "sin-city":     dict(DEFAULT, ink=5, char=2, black=5, mark=1, detail=1, abstr=3, contrast=5, medium="brush", mode="spot accent", hue="crimson", carries="object"),
    "moebius":      dict(DEFAULT, ink=2, char=1, black=1, mark=2, detail=4, abstr=1, contrast=1, medium="pen", mode="flat limited", hue="teal", carries="field"),
    "ward-woodcut": dict(DEFAULT, ink=4, char=3, black=4, mark=1, detail=2, abstr=3, contrast=5, medium="woodcut", mode="B&W"),
}

def color_clause(s):
    h, mode = s["hue"], s["mode"]
    if mode == "B&W":          return "stark black and white, monochrome ink"
    if mode == "spot accent":  return f"stark black and white with a single {h} spot colour on the {s['carries']}, selective colour"
    if mode == "duotone":      return f"duotone two-colour print, black plus {h}, risograph"
    return f"flat limited palette keyed to {h}"

def prompts(s):
    pos = (f"ink art of {SUBJECT} — {MEDIUM[s['medium']]}, {INK[s['ink']-1]}, {CHAR[s['char']-1]}, "
           f"{BLACK[s['black']-1]}, {MARK[s['mark']-1]} shadows, {DETAIL[s['detail']-1]}, "
           f"{ABSTR[s['abstr']-1]} figure, {CONTR[s['contrast']-1]}, {color_clause(s)}, "
           f"on rough textured paper, hand-drawn, ink on paper")
    neg = ["3d render","cgi","photorealistic","smooth gradient","octane","glossy","digital painting",
           "blurry","low quality","watermark","text","signature","frame","border"]
    if s["mode"] == "B&W":  neg += ["colour","color"]
    if s["char"] <= 2:      neg.append("hatching, sketchy, crosshatch")
    if s["black"] <= 2:     neg.append("grey shading, gradient, heavy shadow")
    if s["detail"] <= 2:    neg.append("busy, cluttered background")
    if s["medium"] == "woodcut": neg.append("wood grain, colour")
    return pos, ", ".join(neg)

# ── local ComfyUI plumbing (from style_explore.py) ───────────────────────────
def req(method, path, data=None, timeout=900):
    h = {"Content-Type": "application/json"} if data else {}
    r = urllib.request.Request(f"http://{HOST}{path}", data=data, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=timeout) as resp:
        return resp.read()

def wait_ready(secs=180):
    t0 = time.time()
    while time.time() - t0 < secs:
        try:
            req("GET", "/system_stats", timeout=5); return True
        except Exception:
            time.sleep(3)
    return False

def graph(pos, neg, seed):
    return {
        "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
        "pos":  {"class_type": "CLIPTextEncode", "inputs": {"text": pos, "clip": ["ckpt", 1]}},
        "neg":  {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["ckpt", 1]}},
        "latent": {"class_type": "EmptyLatentImage", "inputs": {"width": W, "height": H, "batch_size": 1}},
        "samp": {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["pos", 0],
                 "negative": ["neg", 0], "latent_image": ["latent", 0], "seed": seed, "steps": STEPS,
                 "cfg": CFG, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0}},
        "dec":  {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
        "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": "atlas", "images": ["dec", 0]}},
    }

def render(wf, dest):
    pid = json.loads(req("POST", "/prompt", json.dumps({"prompt": wf, "client_id": CLIENT}).encode()))["prompt_id"]
    t0 = time.time()
    while True:
        h = json.loads(req("GET", f"/history/{pid}"))
        if pid in h: hist = h[pid]; break
        if time.time() - t0 > 900: raise TimeoutError(pid)
        time.sleep(2)
    if hist.get("status", {}).get("status_str") != "success":
        raise RuntimeError(f"failed: {json.dumps(hist.get('status', {}))[:300]}")
    for _, o in hist.get("outputs", {}).items():
        for img in o.get("images", []):
            q = urllib.parse.urlencode({"filename": img["filename"], "subfolder": img.get("subfolder", ""), "type": img.get("type", "output")})
            Path(dest).write_bytes(req("GET", "/view?" + q)); return time.time() - t0
    raise RuntimeError("no image")

def build_cells():
    cells = []
    for k, n in [("ink", 5), ("char", 5), ("black", 5), ("mark", 4), ("detail", 5), ("abstr", 5), ("contrast", 5)]:
        for v in range(1, n + 1):
            cells.append((f"fader__{k}__{v}", dict(DEFAULT, **{k: v})))
    for m in ["pen", "brush", "dry-brush", "woodcut", "pencil"]:
        cells.append((f"medium__{m}", dict(DEFAULT, medium=m)))
    cells += [
        ("color__spot-crimson-object", dict(DEFAULT, mode="spot accent", hue="crimson", carries="object")),
        ("color__spot-teal-light",     dict(DEFAULT, mode="spot accent", hue="teal", carries="light")),
        ("color__duotone-crimson",     dict(DEFAULT, mode="duotone", hue="crimson")),
        ("color__flat-teal",           dict(DEFAULT, mode="flat limited", hue="teal")),
    ]
    for name, st in PRESETS.items():
        cells.append((f"preset__{name}", st))
    return cells

def contact_strips(index):
    try:
        from PIL import Image
    except Exception:
        print("[atlas] PIL missing; skipping contact strips"); return
    groups = {}
    for row in index:
        pre = row["tag"].split("__")[0] + ("__" + row["tag"].split("__")[1] if row["tag"].startswith("fader") else "")
        groups.setdefault(pre, []).append(row)
    tw = 240; th = int(tw * H / W)
    for pre, rows in groups.items():
        rows = sorted(rows, key=lambda r: r["tag"])
        s = Image.new("RGB", (tw * len(rows), th), (18, 18, 20))
        for k, r in enumerate(rows):
            try: s.paste(Image.open(HERE / r["file"]).convert("RGB").resize((tw, th)), (k * tw, 0))
            except Exception: pass
        s.save(FRAMES / f"_strip_{pre}.png")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--smoke", action="store_true")
    args = ap.parse_args()
    FRAMES.mkdir(parents=True, exist_ok=True)
    print(f"[atlas] host={HOST} — waiting for ComfyUI…", flush=True)
    if not wait_ready():
        print("[atlas] ComfyUI never came up on :8189"); sys.exit(3)
    print("[atlas] ComfyUI ready", flush=True)

    if args.smoke:
        pos, neg = prompts(PRESETS["pen-flow"])
        (FRAMES / "_smoke").mkdir(exist_ok=True)
        print(f"[smoke] POS: {pos[:110]}…", flush=True)
        dt = render(graph(pos, neg, SEED), FRAMES / "_smoke" / "smoke.png")
        print(f"[smoke] OK -> {FRAMES/'_smoke'/'smoke.png'} ({dt:.0f}s)")
        return

    cells = build_cells()
    print(f"[atlas] {len(cells)} cells, {W}x{H} @ {STEPS} steps, seed {SEED}", flush=True)
    index = []
    for i, (tag, s) in enumerate(cells):
        pos, neg = prompts(s)
        try:
            dt = render(graph(pos, neg, SEED), FRAMES / f"{tag}.png")
        except Exception as e:
            print(f"  [{i+1}/{len(cells)}] {tag} FAILED {repr(e)[:120]}", flush=True); continue
        index.append({"tag": tag, "file": f"frames/{tag}.png", "state": s, "prompt": pos})
        json.dump({"subject": SUBJECT, "seed": SEED, "size": [W, H], "cells": index},
                  open(FRAMES / "manifest.json", "w"), indent=2)
        print(f"  [{i+1}/{len(cells)}] {tag}  ({dt:.0f}s)", flush=True)
    contact_strips(index)
    print("ATLAS_DONE", len(index))

if __name__ == "__main__":
    main()
