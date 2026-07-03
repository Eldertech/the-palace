"""Probe: does the configured serverless endpoint carry the FLUX union ControlNet?
Submits a tiny FLUX + flux-union-pro (canny) job. COMPLETED => Route B can run serverless;
FAILED (missing model/node) => fall back to the M3 volume-pod recipe."""
import os, sys, json, importlib.util, ssl
ssl._create_default_https_context = ssl._create_unverified_context   # macOS framework py lacks CA roots
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
spec = importlib.util.spec_from_file_location("svc", os.path.join(ROOT, "Shop", "RunPod GPU Backend", "serverless-client.py"))
svc = importlib.util.module_from_spec(spec)
sys.modules["svc"] = svc                      # dataclasses needs the module registered (py3.14)
spec.loader.exec_module(svc)

cfg = json.load(open(os.path.join(ROOT, "RunPod Images", "studio", "config.json")))
ep = svc.RunPodEndpoint(endpoint_id=cfg["endpoint_id"], api_key=cfg["api_key"],
                        poll=svc.PollPolicy(total_timeout_seconds=600, cold_start_grace_seconds=300))

canny = svc.encode_image(os.path.join(HERE, "plates", "structure_canny.png"))
W, H = 832, 1216
wf = {
 "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "flux1-dev-fp8.safetensors"}},
 "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": "a hill ridge under a sky, ink", "clip": ["ckpt", 1]}},
 "flux": {"class_type": "FluxGuidance", "inputs": {"conditioning": ["pos", 0], "guidance": 3.5}},
 "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": "", "clip": ["ckpt", 1]}},
 "cnet": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": "flux-union-pro.safetensors"}},
 "union": {"class_type": "SetUnionControlNetType", "inputs": {"control_net": ["cnet", 0], "type": "canny"}},
 "ctrl": {"class_type": "LoadImage", "inputs": {"image": canny["name"]}},
 "apply": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["flux", 0], "negative": ["neg", 0],
           "control_net": ["union", 0], "image": ["ctrl", 0], "strength": 0.6, "start_percent": 0.0,
           "end_percent": 0.8, "vae": ["ckpt", 2]}},
 "latent": {"class_type": "EmptySD3LatentImage", "inputs": {"width": W, "height": H, "batch_size": 1}},
 "samp": {"class_type": "KSampler", "inputs": {"seed": 1, "steps": 16, "cfg": 1, "sampler_name": "euler",
          "scheduler": "simple", "denoise": 1, "model": ["ckpt", 0], "positive": ["apply", 0],
          "negative": ["apply", 1], "latent_image": ["latent", 0]}},
 "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
 "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": "cntest", "images": ["dec", 0]}},
}
payload = {"workflow": wf, "images": [{"name": canny["name"], "image": canny["image"]}]}
try:
    out = ep.run(payload)
    saved = ep.save_outputs(out, os.path.join(HERE, "report-assets", "serverless_cn_test"))
    print("SERVERLESS_CN_OK", saved)
except svc.RunPodError as e:
    print("SERVERLESS_CN_FAIL", str(e)[:600])
