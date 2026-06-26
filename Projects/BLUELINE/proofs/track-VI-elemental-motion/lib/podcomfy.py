#!/usr/bin/env python3
"""
BLUELINE · Track VI — pod ComfyUI transport + SDXL multi-ControlNet workflow builders.
Transport reuses the proven curl + browser-UA path (Python requests gets 403 from the RunPod
proxy WAF). Graphs follow render_shot.py's chained ControlNetApplyAdvanced pattern.
"""
import json, ssl, time, uuid, subprocess, urllib.request, urllib.parse
from pathlib import Path

PID_FILE = Path("/tmp/tVI_pod_id")
CLIENT = uuid.uuid4().hex
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
CKPT = "sd_xl_base_1.0.safetensors"
CN = {"canny": "controlnet-canny-sdxl.safetensors", "depth": "controlnet-depth-sdxl.safetensors"}
try:
    import certifi; _CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    _CTX = ssl._create_unverified_context()


def _base():
    return f"https://{PID_FILE.read_text().strip()}-8188.proxy.runpod.net"


def _req(method, path, data=None, headers=None, timeout=180):
    h = {"User-Agent": UA}; h.update(headers or {})
    r = urllib.request.Request(_base() + path, data=data, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=timeout, context=_CTX) as resp:
        return resp.read()


def upload(path, name=None):
    name = name or Path(path).name
    out = subprocess.run(["curl", "-sS", "-A", UA, "--max-time", "40", "-X", "POST",
        "-F", f"image=@{path};type=image/png;filename={name}", "-F", "overwrite=true",
        f"{_base()}/upload/image"], capture_output=True, text=True, timeout=50)
    if '"name"' not in out.stdout:
        raise RuntimeError(f"upload failed (rc={out.returncode}): OUT[{out.stdout[:200]}] ERR[{out.stderr[:300]}]")
    return json.loads(out.stdout).get("name", name)


def submit(workflow):
    data = json.dumps({"prompt": workflow, "client_id": CLIENT}).encode()
    return json.loads(_req("POST", "/prompt", data=data, headers={"Content-Type": "application/json"}))["prompt_id"]


def wait(pid, timeout=420):
    t0 = time.time()
    while time.time() - t0 < timeout:
        h = json.loads(_req("GET", f"/history/{pid}"))
        if pid in h:
            return h[pid]
        time.sleep(2)
    raise TimeoutError(pid)


def fetch(hist, dest):
    if hist.get("status", {}).get("status_str") != "success":
        raise RuntimeError(json.dumps(hist.get("status", {}))[:400])
    for _, o in hist.get("outputs", {}).items():
        for img in o.get("images", []):
            q = urllib.parse.urlencode({"filename": img["filename"], "subfolder": img.get("subfolder", ""),
                                        "type": img.get("type", "output")})
            Path(dest).write_bytes(_req("GET", "/view?" + q)); return dest
    raise RuntimeError("no image")


def run(workflow, dest):
    t0 = time.time(); fetch(wait(submit(workflow)), dest); return time.time() - t0


def _chain_controls(g, controls):
    """Append ControlNetLoader + ControlNetApplyAdvanced nodes, threading pos/neg links."""
    pos, neg = ["pos", 0], ["neg", 0]
    for i, c in enumerate(controls):
        g[f"img{i}"] = {"class_type": "LoadImage", "inputs": {"image": c["image"]}}
        g[f"cn{i}"] = {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN[c["kind"]]}}
        g[f"ap{i}"] = {"class_type": "ControlNetApplyAdvanced", "inputs": {
            "positive": pos, "negative": neg, "control_net": [f"cn{i}", 0], "image": [f"img{i}", 0],
            "strength": c.get("strength", 0.6), "start_percent": c.get("start", 0.0),
            "end_percent": c.get("end", 0.8)}}
        pos, neg = [f"ap{i}", 0], [f"ap{i}", 1]
    return pos, neg


def sdxl_cn(prompt, neg, seed, w, h, controls=(), prefix="tVIcn", steps=30, cfg=6.5):
    g = {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["ckpt", 1]}},
      "latent": {"class_type": "EmptyLatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["dec", 0]}},
    }
    pos, neg_l = _chain_controls(g, controls)
    g["samp"] = {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": pos, "negative": neg_l,
                 "latent_image": ["latent", 0], "seed": seed, "steps": steps, "cfg": cfg,
                 "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0}}
    return g


def sdxl_inpaint(init_name, mask_name, prompt, neg, seed, controls=(), grow=10,
                 prefix="tVIip", steps=30, cfg=6.5, denoise=1.0):
    """SDXL inpaint: VAEEncodeForInpaint noises only the masked (white) region; optional
    ControlNet(s) keep the regenerated fill structurally coherent with its surroundings."""
    g = {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
      "init": {"class_type": "LoadImage", "inputs": {"image": init_name}},
      "mask": {"class_type": "LoadImageMask", "inputs": {"image": mask_name, "channel": "red"}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["ckpt", 1]}},
      "enc": {"class_type": "VAEEncodeForInpaint", "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2],
              "mask": ["mask", 0], "grow_mask_by": grow}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["dec", 0]}},
    }
    pos, neg_l = _chain_controls(g, controls)
    g["samp"] = {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": pos, "negative": neg_l,
                 "latent_image": ["enc", 0], "seed": seed, "steps": steps, "cfg": cfg,
                 "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": denoise}}
    return g
