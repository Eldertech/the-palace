#!/usr/bin/env python3
"""
BLUELINE M3 — render the three frames on the RunPod FLUX-ControlNet pod and pull them back.

  A           : noise = N_A      , pose = A_coil    (the anchor)
  B-seedlock  : noise = N_A      , pose = B_leap    (Track V's lever at a LARGE delta — expected to drift)
  B-warped    : noise = N_warped , pose = B_leap    (the M3 bet — expected to HOLD the look)

Same prompt + same render params for all three; the ONLY differences are pose (A vs B) and, for the two
B frames, the injected noise (N_A vs N_warped). Noise rides INLINE as base64 in the workflow (the
NoiseFromNPY `b64` input), so nothing but the openpose PNGs is uploaded.

Hardened transport (browser-UA + curl multipart upload) reused from pod_runner.py — beats the RunPod
proxy WAF. Reads the pod id from --pod or /tmp/pod_id. Does NOT create or terminate the pod (the
orchestrator owns the pod lifecycle so teardown is guaranteed even on render failure).

  python3 m3_pod_render.py --pod <id> --out renders/
"""
import argparse, base64, json, os, ssl, subprocess, sys, tempfile, time, urllib.request, urllib.parse, uuid
from pathlib import Path

# ── per-agent namespace (multi-agent safety) ─────────────────────────────────
import os as _bootstrap_os
def _find_runpod_ns():
    d = _bootstrap_os.path.dirname(_bootstrap_os.path.abspath(__file__))
    for _ in range(10):
        cand = _bootstrap_os.path.join(d, "_ops", "runpod")
        if _bootstrap_os.path.isfile(_bootstrap_os.path.join(cand, "agent_ns.py")):
            return cand
        nd = _bootstrap_os.path.dirname(d)
        if nd == d:
            break
        d = nd
    return None
_ns_dir = _find_runpod_ns()
if _ns_dir and _ns_dir not in sys.path:
    sys.path.insert(0, _ns_dir)
from agent_ns import read_pod_id, SLUG

HERE = Path(__file__).resolve().parent
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
try:
    import certifi; CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    CTX = ssl._create_unverified_context()

PROMPT = ("a lone figure in a charcoal flight jacket, copper undercut, dramatic cinematic key light, "
          "surreal mathematical landscape, bold graphic-novel color, sharp focus")

# (label, noise .npy, openpose .png). The B-warped noise file is swappable: M3 used the naive
# N_warped.npy; M3.5 uses the whiteness-preserving N_warped_gtf.npy (--warp-npy / --warp-label).
def build_frames(warp_npy, warp_label):
    return [
        ("A",          "N_A.npy",  "A_coil_openpose.png"),
        ("B_seedlock", "N_A.npy",  "B_leap_openpose.png"),
        (warp_label,   warp_npy,   "B_leap_openpose.png"),
    ]

class Pod:
    def __init__(self, pid):
        self.B = f"https://{pid}-8188.proxy.runpod.net"; self.cid = uuid.uuid4().hex
    def _req(self, method, path, data=None, headers=None, timeout=180):
        h = {"User-Agent": UA}; h.update(headers or {})
        r = urllib.request.Request(self.B + path, data=data, method=method, headers=h)
        with urllib.request.urlopen(r, timeout=timeout, context=CTX) as resp:
            return resp.read()
    def alive(self):
        try:
            self._req("GET", "/system_stats", timeout=15); return True
        except Exception:
            return False
    def upload(self, path, tries=4):
        name = Path(path).name; last = ""
        for i in range(tries):
            out = subprocess.run(["curl", "-sS", "-w", "\n%{http_code}", "--max-time", "60", "-X", "POST",
                "-H", f"User-Agent: {UA}",
                "-F", f"image=@{path};type=image/png;filename={name}", "-F", "overwrite=true",
                f"{self.B}/upload/image"], capture_output=True, text=True, timeout=80)
            body, _, code = out.stdout.rpartition("\n")
            if '"name"' in body:
                return json.loads(body).get("name", name)
            last = f"try {i+1} [{code.strip()}] body={body[:150]!r} err={out.stderr[:150]!r}"
            print(f"  upload retry: {last}"); time.sleep(6)
        raise RuntimeError(f"upload failed after {tries}: {last}")
    def submit(self, wf, tries=5):
        # /prompt carries the ~1.3 MB inline-noise body — urllib's POST is closed by the RunPod proxy
        # WAF (broken pipe). curl + browser-UA beats it, but the proxy still resets occasionally on the
        # large body (curl code 000), so retry. Proven to succeed (M3 run 2 rendered all three this way).
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump({"prompt": wf, "client_id": self.cid}, f); tmp = f.name
        try:
            last = ""
            for i in range(tries):
                out = subprocess.run(["curl", "-sS", "-w", "\n%{http_code}", "--max-time", "120", "-X", "POST",
                    "-H", "Content-Type: application/json", "-H", f"User-Agent: {UA}",
                    "--data-binary", f"@{tmp}", f"{self.B}/prompt"], capture_output=True, text=True, timeout=140)
                body, _, code = out.stdout.rpartition("\n")
                if code.strip() == "200":
                    return json.loads(body)["prompt_id"]
                last = f"try {i+1} HTTP[{code.strip()}] body={body[:200]!r} err={out.stderr[:200]!r}"
                print(f"  submit retry: {last}"); time.sleep(6)
            raise RuntimeError(f"submit failed after {tries}: {last}")
        finally:
            os.unlink(tmp)
    def wait(self, pid, timeout=420):
        t0 = time.time()
        while time.time() - t0 < timeout:
            h = json.loads(self._req("GET", f"/history/{pid}"))
            if pid in h: return h[pid]
            time.sleep(2)
        raise TimeoutError(pid)
    def fetch(self, hist, dest):
        for out in hist.get("outputs", {}).values():
            for img in out.get("images", []):
                q = urllib.parse.urlencode({"filename": img["filename"], "subfolder": img.get("subfolder", ""),
                                            "type": img.get("type", "output")})
                Path(dest).write_bytes(self._req("GET", "/view?" + q)); return dest
        return None

def graph(prompt, pose_name, noise_b64, prefix, w=832, h=1216, steps=24, guidance=3.5, strength=0.75, end=0.85):
    return {
     "ckpt":{"class_type":"CheckpointLoaderSimple","inputs":{"ckpt_name":"flux1-dev-fp8.safetensors"}},
     "pos":{"class_type":"CLIPTextEncode","inputs":{"text":prompt,"clip":["ckpt",1]}},
     "flux":{"class_type":"FluxGuidance","inputs":{"conditioning":["pos",0],"guidance":guidance}},
     "neg":{"class_type":"CLIPTextEncode","inputs":{"text":"","clip":["ckpt",1]}},
     "cnet":{"class_type":"ControlNetLoader","inputs":{"control_net_name":"flux-union-pro.safetensors"}},
     "union":{"class_type":"SetUnionControlNetType","inputs":{"control_net":["cnet",0],"type":"openpose"}},
     "pose":{"class_type":"LoadImage","inputs":{"image":pose_name}},
     "apply":{"class_type":"ControlNetApplyAdvanced","inputs":{
        "positive":["flux",0],"negative":["neg",0],"control_net":["union",0],"image":["pose",0],
        "strength":strength,"start_percent":0.0,"end_percent":end,"vae":["ckpt",2]}},
     "latent":{"class_type":"EmptySD3LatentImage","inputs":{"width":w,"height":h,"batch_size":1}},
     "noise":{"class_type":"NoiseFromNPY","inputs":{"path":"","seed":0,"b64":noise_b64}},
     "guider":{"class_type":"BasicGuider","inputs":{"model":["ckpt",0],"conditioning":["apply",0]}},
     "sampler":{"class_type":"KSamplerSelect","inputs":{"sampler_name":"euler"}},
     "sigmas":{"class_type":"BasicScheduler","inputs":{"model":["ckpt",0],"scheduler":"simple","steps":steps,"denoise":1.0}},
     "samp":{"class_type":"SamplerCustomAdvanced","inputs":{"noise":["noise",0],"guider":["guider",0],
        "sampler":["sampler",0],"sigmas":["sigmas",0],"latent_image":["latent",0]}},
     "dec":{"class_type":"VAEDecode","inputs":{"samples":["samp",0],"vae":["ckpt",2]}},
     "save":{"class_type":"SaveImage","inputs":{"filename_prefix":prefix,"images":["dec",0]}},
    }

def b64_of(npy_name):
    return base64.b64encode((HERE / npy_name).read_bytes()).decode()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", default=None)
    ap.add_argument("--out", default="renders")
    ap.add_argument("--warp-npy", default="N_warped.npy")
    ap.add_argument("--warp-label", default="B_warped")
    a = ap.parse_args()
    FRAMES = build_frames(a.warp_npy, a.warp_label)
    pid = read_pod_id(a.pod)
    out = (HERE / a.out); out.mkdir(parents=True, exist_ok=True)
    pod = Pod(pid)
    print(f"pod {pid} | base {pod.B} | warp={a.warp_npy}")
    if not pod.alive():
        sys.exit(f"pod {pid} not reachable at {pod.B}/system_stats")
    time.sleep(10)  # settle: a fast-booted ComfyUI answers /object_info before /upload/image is ready
    # upload each unique pose once
    uploaded = {}
    for _, _, pose in FRAMES:
        if pose not in uploaded:
            uploaded[pose] = pod.upload(str(HERE / "passes" / pose))
            print(f"  uploaded pose {pose} -> {uploaded[pose]}")
    # cache b64 per noise file
    b64cache = {}
    results = {}
    for label, noise_npy, pose in FRAMES:
        if noise_npy not in b64cache: b64cache[noise_npy] = b64_of(noise_npy)
        wf = graph(PROMPT, uploaded[pose], b64cache[noise_npy], f"m3_{label}")
        t0 = time.time()
        jid = pod.submit(wf)
        print(f"  [{label}] submitted {jid} (noise={noise_npy}, pose={pose}) — waiting…")
        hist = pod.wait(jid)
        st = hist.get("status", {}).get("status_str")
        if st != "success":
            raise RuntimeError(f"[{label}] render failed: {json.dumps(hist.get('status',{}))[:400]}")
        dest = pod.fetch(hist, str(out / f"{label}.png"))
        results[label] = dest
        print(f"  [{label}] SAVED {dest}  ({time.time()-t0:.0f}s)")
    json.dump({"pod": pid, "prompt": PROMPT, "frames": results,
               "params": {"steps": 24, "guidance": 3.5, "cn_strength": 0.75, "cn_end": 0.85,
                          "sampler": "euler", "scheduler": "simple", "size": "832x1216"}},
              open(out / "render-manifest.json", "w"), indent=2)
    print("M3_POD_RENDER_DONE", json.dumps(results))

if __name__ == "__main__":
    main()
