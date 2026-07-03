#!/usr/bin/env python3
"""
BLUELINE cloud-I2V — run plain SVD img2vid on the cloud crop and pull the frames back.

The smallest motion-direction test: feed cloud_init.png (the drawn sky, wind streaks intact) to
SVD and generate a short clip at two motion amounts. Does SVD drift the clouds ALONG the drawn
wind on its own? We retrieve every frame; drift direction is measured locally (measure_drift.py).

No noise-warping yet — this asks whether motion-direction comes FREE from the frame's own implied
wind before we build the harder Go-with-the-Flow steering.

Reuses the hardened transport (browser-UA + curl) from m3_pod_render. Does NOT create/terminate the
pod (the orchestrator owns the lifecycle).

  python3 svd_render.py --pod <id> --out renders/
"""
import argparse, json, os, ssl, subprocess, sys, tempfile, time, urllib.request, urllib.parse, uuid
from pathlib import Path

HERE = Path(__file__).resolve().parent

# ── per-agent namespace: resolve the pod id from THIS agent's slugged handoff ──
def _find_runpod_ns():
    d = os.path.dirname(os.path.abspath(__file__))
    for _ in range(10):
        cand = os.path.join(d, "_ops", "runpod")
        if os.path.isfile(os.path.join(cand, "agent_ns.py")):
            return cand
        nd = os.path.dirname(d)
        if nd == d:
            break
        d = nd
    return None
_ns_dir = _find_runpod_ns()
if _ns_dir and _ns_dir not in sys.path:
    sys.path.insert(0, _ns_dir)
from agent_ns import read_pod_id       # noqa: E402  (explicit --pod → my slugged handoff → legacy)
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
try:
    import certifi; CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    CTX = ssl._create_unverified_context()

# (label, motion_bucket_id) — low vs high motion; same seed/init so only the motion amount differs.
CONDITIONS = [("svd_m60", 60), ("svd_m160", 160)]

class Pod:
    def __init__(self, pid):
        self.B = f"https://{pid}-8188.proxy.runpod.net"; self.cid = uuid.uuid4().hex
    def _req(self, method, path, data=None, headers=None, timeout=180):
        h = {"User-Agent": UA}; h.update(headers or {})
        r = urllib.request.Request(self.B + path, data=data, method=method, headers=h)
        with urllib.request.urlopen(r, timeout=timeout, context=CTX) as resp:
            return resp.read()
    def alive(self):
        try: self._req("GET", "/system_stats", timeout=15); return True
        except Exception: return False
    def upload(self, path, tries=4):
        name = Path(path).name; last = ""
        for i in range(tries):
            out = subprocess.run(["curl", "-sS", "-w", "\n%{http_code}", "--max-time", "60", "-X", "POST",
                "-H", f"User-Agent: {UA}", "-F", f"image=@{path};type=image/png;filename={name}",
                "-F", "overwrite=true", f"{self.B}/upload/image"], capture_output=True, text=True, timeout=80)
            body, _, code = out.stdout.rpartition("\n")
            if '"name"' in body: return json.loads(body).get("name", name)
            last = f"try {i+1} [{code.strip()}] {body[:150]!r} {out.stderr[:120]!r}"; print("  upload retry:", last); time.sleep(6)
        raise RuntimeError(f"upload failed after {tries}: {last}")
    def submit(self, wf, tries=5):
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump({"prompt": wf, "client_id": self.cid}, f); tmp = f.name
        try:
            last = ""
            for i in range(tries):
                out = subprocess.run(["curl", "-sS", "-w", "\n%{http_code}", "--max-time", "120", "-X", "POST",
                    "-H", "Content-Type: application/json", "-H", f"User-Agent: {UA}",
                    "--data-binary", f"@{tmp}", f"{self.B}/prompt"], capture_output=True, text=True, timeout=140)
                body, _, code = out.stdout.rpartition("\n")
                if code.strip() == "200": return json.loads(body)["prompt_id"]
                last = f"try {i+1} HTTP[{code.strip()}] {body[:200]!r} {out.stderr[:160]!r}"; print("  submit retry:", last); time.sleep(6)
            raise RuntimeError(f"submit failed after {tries}: {last}")
        finally:
            os.unlink(tmp)
    def wait(self, pid, timeout=900):
        t0 = time.time()
        while time.time() - t0 < timeout:
            h = json.loads(self._req("GET", f"/history/{pid}"))
            if pid in h: return h[pid]
            time.sleep(3)
        raise TimeoutError(pid)
    def fetch_all(self, hist, dest_dir, label):
        saved = []
        for out in hist.get("outputs", {}).values():
            for i, img in enumerate(out.get("images", [])):
                q = urllib.parse.urlencode({"filename": img["filename"], "subfolder": img.get("subfolder", ""),
                                            "type": img.get("type", "output")})
                p = Path(dest_dir) / f"{label}_{i:02d}.png"; p.write_bytes(self._req("GET", "/view?" + q)); saved.append(str(p))
        return saved

def svd_graph(image_name, prefix, motion_bucket, frames=25, w=1024, h=576, steps=20, cfg=2.5, seed=42, aug=0.0, fps=7):
    return {
      "ck":   {"class_type": "ImageOnlyCheckpointLoader", "inputs": {"ckpt_name": "svd_xt.safetensors"}},
      "img":  {"class_type": "LoadImage", "inputs": {"image": image_name}},
      "cond": {"class_type": "SVD_img2vid_Conditioning", "inputs": {
                 "clip_vision": ["ck", 1], "init_image": ["img", 0], "vae": ["ck", 2],
                 "width": w, "height": h, "video_frames": frames, "motion_bucket_id": motion_bucket,
                 "fps": fps, "augmentation_level": aug}},
      "g":    {"class_type": "VideoLinearCFGGuidance", "inputs": {"model": ["ck", 0], "min_cfg": 1.0}},
      "ks":   {"class_type": "KSampler", "inputs": {
                 "model": ["g", 0], "positive": ["cond", 0], "negative": ["cond", 1], "latent_image": ["cond", 2],
                 "seed": seed, "steps": steps, "cfg": cfg, "sampler_name": "euler", "scheduler": "karras", "denoise": 1.0}},
      "dec":  {"class_type": "VAEDecode", "inputs": {"samples": ["ks", 0], "vae": ["ck", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["dec", 0]}},
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", default=None)
    ap.add_argument("--out", default="renders")
    ap.add_argument("--init", default="cloud_init.png")   # the I2V seed (any background crop)
    ap.add_argument("--prefix", default="svd")            # output label prefix
    a = ap.parse_args()
    pid = read_pod_id(a.pod)          # explicit --pod, else this agent's slugged handoff file
    out = (HERE / a.out); out.mkdir(parents=True, exist_ok=True)
    pod = Pod(pid)
    print(f"pod {pid} | base {pod.B} | init {a.init} | prefix {a.prefix}")
    if not pod.alive(): sys.exit(f"pod {pid} not reachable")
    time.sleep(10)
    img = pod.upload(str(HERE / a.init)); print("  uploaded init ->", img)
    conditions = [(f"{a.prefix}_m60", 60), (f"{a.prefix}_m160", 160)]
    results = {}
    for label, mb in conditions:
        wf = svd_graph(img, label, mb); t0 = time.time()
        jid = pod.submit(wf); print(f"  [{label}] submitted {jid} (motion_bucket={mb}) — waiting…")
        hist = pod.wait(jid)
        st = hist.get("status", {}).get("status_str")
        if st != "success": raise RuntimeError(f"[{label}] failed: {json.dumps(hist.get('status', {}))[:400]}")
        frames = pod.fetch_all(hist, str(out), label)
        results[label] = {"motion_bucket": mb, "frames": len(frames)}
        print(f"  [{label}] SAVED {len(frames)} frames ({time.time()-t0:.0f}s)")
    json.dump({"pod": pid, "init": "cloud_init.png", "conditions": results,
               "params": {"model": "svd_xt", "frames": 25, "size": "1024x576", "steps": 20, "cfg": 2.5,
                          "sampler": "euler", "scheduler": "karras"}},
              open(out / "svd-manifest.json", "w"), indent=2)
    print("SVD_RENDER_DONE", json.dumps(results))

if __name__ == "__main__":
    main()
