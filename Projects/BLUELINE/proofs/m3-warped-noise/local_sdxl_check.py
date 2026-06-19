#!/usr/bin/env python3
"""
BLUELINE M3 — LOCAL SDXL inject-check (free, no pod). Proves the one unproven piece before the spend:
that the NoiseFromNPY node actually feeds an EXTERNAL latent-noise tensor as the SamplerCustomAdvanced
initial noise, deterministically, and that a WARPED noise tensor changes the render.

Mechanism, held clean: pose is FIXED (A) across all three renders, so the ONLY variable is the noise.
  run1: noise = N_A_sdxl  (seed widget 1)   -> img_NA1
  run2: noise = N_A_sdxl  (seed widget 2)   -> img_NA2   [different seed WIDGET -> forces ComfyUI to
                                                          re-execute the sampler; the .npy ignores it]
  run3: noise = N_warped_sdxl (seed widget 1) -> img_NW
Pass iff: img_NA1 == img_NA2 (the .npy drives it, deterministically; the seed widget is inert)
      AND img_NW differs from img_NA1 (the warp moved the noise -> moved the render).

Run: <comfy venv>/python local_sdxl_check.py            (expects ComfyUI on 127.0.0.1:8189)
"""
import os, sys, json, time, shutil, urllib.request, uuid
import numpy as np
from PIL import Image

HOST = os.environ.get("COMFY_HOST", "127.0.0.1:8189")
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "local-sdxl"); os.makedirs(OUT, exist_ok=True)
COMFY = "/Users/loudonstearns/Documents/The Palace/_tools/ComfyUI"
INPUT_DIR = os.path.join(COMFY, "input")
N_A   = os.path.join(HERE, "N_A_sdxl.npy")
N_WRP = os.path.join(HERE, "N_warped_sdxl.npy")
POSE_SRC = os.path.join(HERE, "passes", "A_coil_openpose.png")
POSE_NAME = "m3_poseA.png"
CLIENT = uuid.uuid4().hex

PROMPT = ("a lone figure in a charcoal flight jacket, copper undercut, dramatic cinematic key light, "
          "surreal mathematical landscape, bold graphic-novel color, sharp focus")
NEG = "blurry, low quality, deformed, extra limbs, watermark, text"

def req(method, path, data=None, ctype=None):
    h = {}
    if ctype: h["Content-Type"] = ctype
    r = urllib.request.Request(f"http://{HOST}{path}", data=data, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=600) as resp:
        return resp.read()

def graph(noise_path, seed_widget, prefix):
    return {
        "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "pos":  {"class_type": "CLIPTextEncode", "inputs": {"text": PROMPT, "clip": ["ckpt", 1]}},
        "neg":  {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["ckpt", 1]}},
        "cnet": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": "controlnet-openpose-sdxl.safetensors"}},
        "pose": {"class_type": "LoadImage", "inputs": {"image": POSE_NAME}},
        "apply": {"class_type": "ControlNetApplyAdvanced", "inputs": {
            "positive": ["pos", 0], "negative": ["neg", 0], "control_net": ["cnet", 0],
            "image": ["pose", 0], "strength": 0.8, "start_percent": 0.0, "end_percent": 0.8}},
        "latent": {"class_type": "EmptyLatentImage", "inputs": {"width": 832, "height": 1216, "batch_size": 1}},
        "noise": {"class_type": "NoiseFromNPY", "inputs": {"path": noise_path, "seed": seed_widget}},
        "guider": {"class_type": "CFGGuider", "inputs": {"model": ["ckpt", 0], "positive": ["apply", 0],
                   "negative": ["apply", 1], "cfg": 7.0}},
        "sampler": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler"}},
        "sigmas": {"class_type": "BasicScheduler", "inputs": {"model": ["ckpt", 0], "scheduler": "karras",
                   "steps": 20, "denoise": 1.0}},
        "samp": {"class_type": "SamplerCustomAdvanced", "inputs": {"noise": ["noise", 0], "guider": ["guider", 0],
                 "sampler": ["sampler", 0], "sigmas": ["sigmas", 0], "latent_image": ["latent", 0]}},
        "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
        "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["dec", 0]}},
    }

def run(wf, dest):
    pid = json.loads(req("POST", "/prompt", json.dumps({"prompt": wf, "client_id": CLIENT}).encode(),
                         "application/json"))["prompt_id"]
    t0 = time.time()
    while True:
        h = json.loads(req("GET", f"/history/{pid}"))
        if pid in h:
            hist = h[pid]; break
        if time.time() - t0 > 600: raise TimeoutError(pid)
        time.sleep(2)
    st = hist.get("status", {})
    if st.get("status_str") != "success":
        raise RuntimeError(f"render failed: {json.dumps(st)[:500]}")
    for _, o in hist.get("outputs", {}).items():
        for img in o.get("images", []):
            q = urllib.parse.urlencode({"filename": img["filename"], "subfolder": img.get("subfolder", ""),
                                        "type": img.get("type", "output")})
            open(dest, "wb").write(req("GET", "/view?" + q))
            return dest, time.time() - t0
    raise RuntimeError("no image in outputs")

import urllib.parse
def main():
    shutil.copy(POSE_SRC, os.path.join(INPUT_DIR, POSE_NAME))
    print(f"pose -> {POSE_NAME}; noise N_A={N_A}")
    runs = [("NA1", graph(N_A, 1, "m3_NA1"), "NA1.png"),
            ("NA2", graph(N_A, 2, "m3_NA2"), "NA2.png"),
            ("NW",  graph(N_WRP, 1, "m3_NW"), "NW.png")]
    paths = {}
    for tag, wf, fn in runs:
        dest, dt = run(wf, os.path.join(OUT, fn))
        paths[tag] = dest
        print(f"  {tag}: {dest}  ({dt:.0f}s)")
    a1 = np.asarray(Image.open(paths["NA1"]).convert("RGB"), np.float32)
    a2 = np.asarray(Image.open(paths["NA2"]).convert("RGB"), np.float32)
    nw = np.asarray(Image.open(paths["NW"]).convert("RGB"), np.float32)
    d_same = float(np.abs(a1 - a2).mean())
    d_warp = float(np.abs(a1 - nw).mean())
    print(f"\n  inject-same  |NA1 - NA2| mean-abs = {d_same:.4f} / 255  (expect ~0: deterministic, .npy drives it)")
    print(f"  inject-warped|NA1 - NW | mean-abs = {d_warp:.4f} / 255  (expect >0: the warp moved the render)")
    ok = d_same < 0.5 and d_warp > 2.0
    print(f"\n  VERDICT: {'PASS' if ok else 'FAIL'} — "
          f"{'external-noise injection deterministic; warped noise changes the render.' if ok else 'mechanism not confirmed.'}")
    json.dump({"d_same_meanabs255": d_same, "d_warp_meanabs255": d_warp, "pass": ok,
               "note": "pose fixed at A; only the injected noise varies"},
              open(os.path.join(OUT, "inject-check.json"), "w"), indent=2)
    print("LOCAL_SDXL_CHECK_DONE", "PASS" if ok else "FAIL")
    sys.exit(0 if ok else 2)

if __name__ == "__main__":
    main()
