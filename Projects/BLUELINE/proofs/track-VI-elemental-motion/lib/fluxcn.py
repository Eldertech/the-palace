#!/usr/bin/env python3
"""
BLUELINE · Track VI — FLUX union-ControlNet workflow builder + SSL-safe serverless transport.
Reuses the proven flux1-dev-fp8 + flux-union-pro pattern (pod-comfyui-client / m3). The graph
is transport-agnostic: same workflow runs on the serverless endpoint or the M3 volume-pod.
"""
import os, ssl, json, time, base64, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
CFG = json.load(open(ROOT / "RunPod Images" / "studio" / "config.json"))
KEY, ENDPOINT = CFG["api_key"], CFG.get("endpoint_id")
FLUX_CKPT = "flux1-dev-fp8.safetensors"
UNION = "flux-union-pro.safetensors"
try:
    import certifi; _CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    _CTX = ssl._create_unverified_context()


def flux_cn(prompt, seed, w, h, controls=(), guidance=3.5, steps=24, prefix="b2flux", neg=""):
    """FLUX + flux-union-pro, chaining one ControlNetApplyAdvanced per control type."""
    g = {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": FLUX_CKPT}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
      "flux": {"class_type": "FluxGuidance", "inputs": {"conditioning": ["pos", 0], "guidance": guidance}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["ckpt", 1]}},
      "latent": {"class_type": "EmptySD3LatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["dec", 0]}},
    }
    pos, negl = ["flux", 0], ["neg", 0]
    for i, c in enumerate(controls):
        g[f"cn{i}"] = {"class_type": "ControlNetLoader", "inputs": {"control_net_name": UNION}}
        g[f"un{i}"] = {"class_type": "SetUnionControlNetType", "inputs": {"control_net": [f"cn{i}", 0], "type": c["type"]}}
        g[f"im{i}"] = {"class_type": "LoadImage", "inputs": {"image": c["image"]}}
        g[f"ap{i}"] = {"class_type": "ControlNetApplyAdvanced", "inputs": {
            "positive": pos, "negative": negl, "control_net": [f"un{i}", 0], "image": [f"im{i}", 0],
            "strength": c.get("strength", 0.6), "start_percent": c.get("start", 0.0),
            "end_percent": c.get("end", 0.8), "vae": ["ckpt", 2]}}
        pos, negl = [f"ap{i}", 0], [f"ap{i}", 1]
    g["samp"] = {"class_type": "KSampler", "inputs": {"seed": seed, "steps": steps, "cfg": 1,
                 "sampler_name": "euler", "scheduler": "simple", "denoise": 1, "model": ["ckpt", 0],
                 "positive": pos, "negative": negl, "latent_image": ["latent", 0]}}
    return g


# ---- SSL-safe serverless transport (worker-comfyui /run) --------------------

def _post(path, body, timeout=60):
    req = urllib.request.Request(f"https://api.runpod.ai/v2/{ENDPOINT}/{path}",
          data=json.dumps(body).encode(), method="POST",
          headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout, context=_CTX) as r:
        return json.loads(r.read())


def _get(path, timeout=60):
    req = urllib.request.Request(f"https://api.runpod.ai/v2/{ENDPOINT}/{path}",
          headers={"Authorization": f"Bearer {KEY}"})
    with urllib.request.urlopen(req, timeout=timeout, context=_CTX) as r:
        return json.loads(r.read())


def serverless_run(workflow, images, dest, timeout=700):
    """images: list of (name, path). Submit -> poll -> save first output image."""
    payload = {"input": {"workflow": workflow,
               "images": [{"name": n, "image": base64.b64encode(Path(p).read_bytes()).decode()}
                          for n, p in images]}}
    jid = _post("run", payload)["id"]
    t0 = time.time()
    while time.time() - t0 < timeout:
        s = _get(f"status/{jid}")
        st = s.get("status")
        if st == "COMPLETED":
            out = s.get("output", {})
            imgs = out.get("images", []) if isinstance(out, dict) else []
            if not imgs:
                raise RuntimeError(f"no images in output: {json.dumps(out)[:300]}")
            data = imgs[0].get("data") or imgs[0].get("image")
            if str(data).startswith("http"):
                with urllib.request.urlopen(str(data), timeout=120, context=_CTX) as r:
                    Path(dest).write_bytes(r.read())
            else:
                Path(dest).write_bytes(base64.b64decode(data))
            return time.time() - t0
        if st in ("FAILED", "CANCELLED", "TIMED_OUT"):
            raise RuntimeError(f"job {st}: {json.dumps(s)[:400]}")
        time.sleep(3)
    raise TimeoutError(jid)
