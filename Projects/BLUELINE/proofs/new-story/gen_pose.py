#!/usr/bin/env python3
"""
BLUELINE · NEW STORY — GENERATE-THEN-EXTRACT pose pipeline (Loudon's "generate, then develop" applied to
posing). For dynamic action + MULTI-CHARACTER shots that blind joint-table authoring can't reach, let
gen-AI INVENT the composition from a prompt, then extract OpenPose (DWPose, multi-person) from it. The
extracted skeleton becomes the conditioning for the controlled pen-flow render (render_shot.py --pose ...),
with the hero's identity swapped in via InstantID.

One ComfyUI graph: SDXL generate (a CLEAR style — the gen is a throwaway pose reference, so clarity beats
the locked ink for clean DWPose extraction) -> DWPreprocessor (multi-person) -> save both gen + openpose.

Run (comfy venv, :8189): python gen_pose.py [--scene S05] [--n 1]
Outputs -> proofs/new-story/genpose/<scene>_<i>_gen.png + <scene>_<i>_openpose.png
"""
import os, json, time, argparse, urllib.request, urllib.parse, uuid

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "genpose"); os.makedirs(OUT, exist_ok=True)
CKPT = "sd_xl_base_1.0.safetensors"
HOST = "127.0.0.1:8189"; CLIENT = uuid.uuid4().hex
# clear, readable style for the throwaway pose-reference (NOT pen-flow — ink is too abstract for DWPose)
STYLE = "dynamic cinematic action illustration, clear full-body figures, dramatic motion, detailed anatomy, sharp"
NEG = "blurry, low quality, cropped, deformed, extra limbs, watermark, text"

SCENES = {  # the dynamic / multi-character shots blind authoring struggled with
    "S04": {"size": (832, 1216), "n_fig": 1,
            "prompt": "a man falling through the air, plummeting straight down, coat and limbs flailing, seen from far below against a smoky sky"},
    "S05": {"size": (1216, 832), "n_fig": 3,
            "prompt": "a powerful man landing hard in a three-point crouch on cracked pavement, one fist down, a woman lying collapsed on the ground beside him, a crowd of people recoiling behind"},
    "S06": {"size": (832, 1216), "n_fig": 2,
            "prompt": "a man kneeling on the ground cradling an unconscious woman in his arms, leaning down close to kiss her, two figures intimate and close together"},
}

def req(method, path, data=None):
    h = {"Content-Type": "application/json"} if data else {}
    r = urllib.request.Request(f"http://{HOST}{path}", data=data, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=900) as resp: return resp.read()

def graph(prompt, W, H, seed, prefix):
    return {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": f"{prompt}, {STYLE}", "clip": ["ckpt", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["ckpt", 1]}},
      "latent": {"class_type": "EmptyLatentImage", "inputs": {"width": W, "height": H, "batch_size": 1}},
      "samp": {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["pos", 0], "negative": ["neg", 0],
               "latent_image": ["latent", 0], "seed": seed, "steps": 30, "cfg": 7.0, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save_gen": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix + "_gen", "images": ["dec", 0]}},
      "dw": {"class_type": "DWPreprocessor", "inputs": {"image": ["dec", 0], "detect_hand": "disable",
             "detect_body": "enable", "detect_face": "disable", "resolution": 1024,
             "bbox_detector": "yolox_l.onnx", "pose_estimator": "dw-ll_ucoco_384.onnx"}},
      "save_pose": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix + "_openpose", "images": ["dw", 0]}},
    }

def run(wf):
    pid = json.loads(req("POST", "/prompt", json.dumps({"prompt": wf, "client_id": CLIENT}).encode()))["prompt_id"]
    t0 = time.time()
    while True:
        h = json.loads(req("GET", f"/history/{pid}"))
        if pid in h: hist = h[pid]; break
        if time.time() - t0 > 900: raise TimeoutError(pid)
        time.sleep(2)
    if hist.get("status", {}).get("status_str") != "success":
        raise RuntimeError(json.dumps(hist.get("status", {}))[:400])
    saved = {}
    for _, o in hist.get("outputs", {}).items():
        for img in o.get("images", []):
            q = urllib.parse.urlencode({"filename": img["filename"], "subfolder": img.get("subfolder", ""), "type": img.get("type", "output")})
            dst = os.path.join(OUT, img["filename"]); open(dst, "wb").write(req("GET", "/view?" + q))
            saved["openpose" if "openpose" in img["filename"] else "gen"] = dst
    return saved, time.time() - t0

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scene", default="all", help="S04 | S05 | S06 | all")
    ap.add_argument("--n", type=int, default=1, help="generations per scene (generate many, select)")
    ap.add_argument("--seed", type=int, default=3100)
    a = ap.parse_args()
    scenes = list(SCENES) if a.scene == "all" else [a.scene]
    for sc in scenes:
        s = SCENES[sc]; W, H = s["size"]
        for i in range(a.n):
            saved, dt = run(graph(s["prompt"], W, H, a.seed + i * 13, f"{sc}_{i}"))
            print(f"  {sc}#{i} ({dt:.0f}s) {s['n_fig']} figs intended -> {os.path.basename(saved.get('gen',''))} + {os.path.basename(saved.get('openpose',''))}", flush=True)
    print("GEN_POSE_DONE")

if __name__ == "__main__":
    main()
