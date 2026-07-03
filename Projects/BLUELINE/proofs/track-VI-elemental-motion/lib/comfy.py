#!/usr/bin/env python3
"""
BLUELINE · Track VI — minimal local-ComfyUI driver (reuses the style-lock pattern).
Points at the running instance on :8188 / sd_xl_base_1.0. txt2img for plates; img2img
(VAEEncode init + denoise) for the Tier-C pen-flow stylize pass.
"""
import os, json, time, uuid, urllib.request, urllib.parse

HOST = os.environ.get("COMFY_HOST", "127.0.0.1:8188")
CKPT = "sd_xl_base_1.0.safetensors"
CLIENT = uuid.uuid4().hex
COMFY_INPUT = os.environ.get(
    "COMFY_INPUT",
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))),
        "_tools", "ComfyUI", "input"))

NEG = ("color, colour, photograph, photorealistic, 3d render, grey background, smooth "
       "digital shading, gradient, blurry, low quality, watermark, text, signature, "
       "frame, border")

# locked pen-flow substrate (style-lock, Loudon's pick 2026-06-19)
SUBSTRATE = ("hand-drawn with a black chisel-tip marker on rough white cold-press "
             "watercolor paper, visible paper tooth, broken dry ink edges, monochrome "
             "black and white, lots of white space, confident calligraphic linework, "
             "sparse grey dry-brush half-tones, manga and sumi-e ink influence")


def req(method, path, data=None, headers=None):
    h = dict(headers or {})
    if data and "Content-Type" not in h and isinstance(data, (bytes, bytearray)) and method == "POST" and path == "/prompt":
        h["Content-Type"] = "application/json"
    r = urllib.request.Request(f"http://{HOST}{path}", data=data, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=1200) as resp:
        return resp.read()


def _wait(pid, dest):
    t0 = time.time()
    while True:
        h = json.loads(req("GET", f"/history/{pid}"))
        if pid in h:
            hist = h[pid]; break
        if time.time() - t0 > 1200:
            raise TimeoutError(pid)
        time.sleep(2)
    if hist.get("status", {}).get("status_str") != "success":
        raise RuntimeError(f"failed: {json.dumps(hist.get('status', {}))[:300]}")
    for _, o in hist.get("outputs", {}).items():
        for img in o.get("images", []):
            q = urllib.parse.urlencode({"filename": img["filename"],
                                        "subfolder": img.get("subfolder", ""),
                                        "type": img.get("type", "output")})
            open(dest, "wb").write(req("GET", "/view?" + q))
            return time.time() - t0
    raise RuntimeError("no image")


def run(wf, dest):
    pid = json.loads(req("POST", "/prompt",
                         json.dumps({"prompt": wf, "client_id": CLIENT}).encode()))["prompt_id"]
    return _wait(pid, dest)


def txt2img(prompt, dest, seed=0, w=832, h=1216, steps=26, cfg=6.5, neg=NEG):
    wf = {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["ckpt", 1]}},
      "latent": {"class_type": "EmptyLatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
      "samp": {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["pos", 0],
               "negative": ["neg", 0], "latent_image": ["latent", 0], "seed": seed,
               "steps": steps, "cfg": cfg, "sampler_name": "dpmpp_2m",
               "scheduler": "karras", "denoise": 1.0}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": "tVI", "images": ["dec", 0]}},
    }
    return run(wf, dest)


def _upload(path):
    """POST an init image into ComfyUI's input dir; return the filename LoadImage uses."""
    fn = os.path.basename(path)
    boundary = "----tVI" + uuid.uuid4().hex
    body = b""
    body += f"--{boundary}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"{fn}\"\r\nContent-Type: image/png\r\n\r\n".encode()
    body += open(path, "rb").read() + b"\r\n"
    body += f"--{boundary}\r\nContent-Disposition: form-data; name=\"overwrite\"\r\n\r\ntrue\r\n".encode()
    body += f"--{boundary}--\r\n".encode()
    req("POST", "/upload/image", body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    return fn


def inpaint(init_path, mask_path, prompt, dest, seed=0, denoise=1.0, grow=12,
            steps=28, cfg=6.5, neg=NEG):
    """Local SDXL inpaint (VAEEncodeForInpaint noises only the white-mask region) — fills
    behind an extracted foreground in-style, the infill upgrade past white-paper."""
    fn = _upload(init_path); mn = _upload(mask_path)
    wf = {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
      "init": {"class_type": "LoadImage", "inputs": {"image": fn}},
      "mask": {"class_type": "LoadImageMask", "inputs": {"image": mn, "channel": "red"}},
      "enc": {"class_type": "VAEEncodeForInpaint", "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2],
              "mask": ["mask", 0], "grow_mask_by": grow}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["ckpt", 1]}},
      "samp": {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["pos", 0],
               "negative": ["neg", 0], "latent_image": ["enc", 0], "seed": seed, "steps": steps,
               "cfg": cfg, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": denoise}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": "tVIinp", "images": ["dec", 0]}},
    }
    return run(wf, dest)


def img2img(init_path, prompt, dest, seed=0, denoise=0.8, steps=26, cfg=6.5, neg=NEG):
    """Pen-flow stylize pass over a (typically desaturated) init image."""
    fn = _upload(init_path)
    wf = {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
      "img": {"class_type": "LoadImage", "inputs": {"image": fn}},
      "enc": {"class_type": "VAEEncode", "inputs": {"pixels": ["img", 0], "vae": ["ckpt", 2]}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["ckpt", 1]}},
      "samp": {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["pos", 0],
               "negative": ["neg", 0], "latent_image": ["enc", 0], "seed": seed,
               "steps": steps, "cfg": cfg, "sampler_name": "dpmpp_2m",
               "scheduler": "karras", "denoise": denoise}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": "tVIi", "images": ["dec", 0]}},
    }
    return run(wf, dest)
