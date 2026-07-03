#!/usr/bin/env python3
"""
BLUELINE cloud-I2V — pod LIFECYCLE owner (the spend). Creates a RunPod ComfyUI pod on the
blueline-models volume, downloads SVD-XT to the volume (cached for next time), GATES on readiness
(ComfyUI up + svd_xt.safetensors in the checkpoint list), runs the SVD img2vid test via
svd_render.py, and ALWAYS terminates the pod in finally — a boot/render failure costs minutes,
not a leaked GPU. Loudon greenlit ~$1-3 for this run.

Mirrors the proven m3_pod_orchestrator; the only differences are: download SVD (non-gated mirror)
instead of the FLUX ControlNet, no custom node, and a longer boot timeout for the 9.6 GB download.

  python3 svd_orchestrator.py
  python3 svd_orchestrator.py --terminate-only <podId>
"""
import argparse, json, ssl, subprocess, sys, time
import urllib.request, urllib.error
from pathlib import Path

PALACE = Path("/Users/loudonstearns/Documents/The Palace")
CONFIG = PALACE / "RunPod Images" / "studio" / "config.json"
HERE = Path(__file__).resolve().parent

VOLUME_ID = "aqm8oev4b0"                       # blueline-models (EU-RO-1)
IMAGE = "runpod/worker-comfyui:5.8.4-flux1-dev-fp8"   # ComfyUI worker; SVD nodes are core
GPU_IDS = ["NVIDIA GeForce RTX 4090", "NVIDIA L40S", "NVIDIA L40",
           "NVIDIA RTX A6000", "NVIDIA A40", "NVIDIA RTX A5000"]
CKPT = "svd_xt.safetensors"
SVD_HF = ("https://huggingface.co/thingthatis/stable-video-diffusion-img2vid-xt/"
          "resolve/main/svd_xt.safetensors")     # non-gated mirror of stabilityai SVD-XT (weights-only)
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

KEY = json.load(open(CONFIG))["api_key"]
try:
    import certifi; CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    CTX = ssl._create_unverified_context()

def api(method, path, body=None, timeout=60):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request("https://rest.runpod.io/v1" + path, data=data, method=method,
          headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
            b = r.read(); return (json.loads(b) if b else {}), r.status
    except urllib.error.HTTPError as e:
        return {"_error": e.read().decode()[:500]}, e.code

def proxy_get(pid, path, timeout=15):
    url = f"https://{pid}-8188.proxy.runpod.net{path}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
        return r.read()

def start_script():
    # Volume-cache aware + aria2c (parallel, fast, resumable). If a COMPLETE copy (>9GB) is already on
    # the network volume, symlink it and boot in ~1 min. Otherwise aria2c-download to the fast container
    # disk (16 connections), then copy to the volume IN BACKGROUND so the slow volume *write* never
    # blocks ComfyUI and every future run is cached. The >9GB size check rejects any stale partial.
    return (
        'set -e\n'
        'mkdir -p /comfyui/models/checkpoints\n'
        f'CK=/comfyui/models/checkpoints/{CKPT}\n'
        f'VOL=/workspace/{CKPT}\n'
        'if [ -s "$VOL" ] && [ "$(stat -c%s "$VOL" 2>/dev/null || echo 0)" -gt 9000000000 ]; then\n'
        '  echo "[svd] using volume cache"; ln -sf "$VOL" "$CK";\n'
        'elif [ ! -s "$CK" ]; then\n'
        '  rm -f "$VOL" "$CK.part"\n'
        '  echo "[svd] fetch SVD-XT (~9.6GB)"\n'
        '  command -v aria2c >/dev/null || { apt-get update -qq && apt-get install -y -qq aria2 || true; }\n'
        '  if command -v aria2c >/dev/null; then\n'
        f'    aria2c -x16 -s16 -k1M --file-allocation=none --console-log-level=warn --dir=/comfyui/models/checkpoints -o {CKPT}.part "{SVD_HF}" && mv "$CK.part" "$CK";\n'
        '  else\n'
        f'    wget -q -O "$CK.part" "{SVD_HF}" && mv "$CK.part" "$CK";\n'
        '  fi\n'
        '  ( cp "$CK" "$VOL.part" && mv "$VOL.part" "$VOL" && echo "[svd] cached to volume" ) &\n'
        'fi\n'
        'ls -la /comfyui/models/checkpoints/ || true\n'
        'echo "[svd] launch ComfyUI"\n'
        'cd /comfyui && exec python -u main.py --disable-auto-launch --disable-metadata --listen --port 8188\n'
    )

def create_pod(max_tries=12, delay=30):
    body = {"name": "blueline-cloud-i2v", "imageName": IMAGE,
            "gpuTypeIds": GPU_IDS, "gpuCount": 1,
            "networkVolumeId": VOLUME_ID, "volumeMountPath": "/workspace",
            "ports": ["8188/http", "22/tcp"], "containerDiskInGb": 30,
            "dockerStartCmd": ["bash", "-c", start_script()]}
    for i in range(max_tries):
        r, code = api("POST", "/pods", body)
        if code in (200, 201):
            pid = r.get("id") or r.get("podId")
            if not pid: sys.exit(f"create returned no id: {json.dumps(r)[:400]}")
            Path("/tmp/svd_pod_id").write_text(pid)
            print(f"[create] pod {pid} — id at /tmp/svd_pod_id"); return pid
        err = json.dumps(r)[:200]
        if code == 500 or "no instances" in err.lower() or "no longer any instances" in err.lower():
            print(f"[create] no capacity (try {i+1}/{max_tries} [{code}]): {err} — retry in {delay}s")
            time.sleep(delay); continue
        sys.exit(f"create failed [{code}]: {json.dumps(r)[:600]}")
    sys.exit(f"create failed: no GPU capacity after {max_tries} tries")

def terminate(pid):
    r, code = api("DELETE", f"/pods/{pid}")
    print(f"[terminate] DELETE /pods/{pid} -> {code}")
    for _ in range(10):
        g, c = api("GET", f"/pods/{pid}")
        if c == 404 or (isinstance(g, dict) and g.get("desiredStatus") in ("TERMINATED", "EXITED")):
            print(f"[terminate] confirmed {pid} gone"); return True
        time.sleep(3)
    print(f"[terminate] WARNING — could not confirm termination of {pid}; check the RunPod console")
    return False

def wait_ready(pid, boot_timeout=2400):     # worst case: a slow first download (cached runs boot in ~1 min)
    t0 = time.time(); comfy_up = False
    while time.time() - t0 < boot_timeout:
        el = int(time.time() - t0)
        if not comfy_up:
            try:
                proxy_get(pid, "/system_stats", timeout=10); comfy_up = True
                print(f"[ready] ComfyUI HTTP up at ~{el}s")
            except Exception:
                g, _ = api("GET", f"/pods/{pid}")
                ds = g.get("desiredStatus") if isinstance(g, dict) else "?"
                print(f"[ready] waiting… {el}s (status={ds})"); time.sleep(10); continue
        try:
            ld = json.loads(proxy_get(pid, "/object_info/ImageOnlyCheckpointLoader", timeout=10))
            opts = ld.get("ImageOnlyCheckpointLoader", {}).get("input", {}).get("required", {}).get("ckpt_name", [[]])
            lst = opts[0] if opts and isinstance(opts[0], list) else []
            print(f"[ready] checkpoints: {lst}")
            if CKPT in lst: print(f"[ready] PASS at ~{el}s"); return True
        except Exception as e:
            print(f"[ready] probe retry ({el}s): {repr(e)[:120]}")
        time.sleep(10)
    return False

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--terminate-only", default=None)
    ap.add_argument("--render-args", default="")
    a = ap.parse_args()
    if a.terminate_only: terminate(a.terminate_only); return
    pods, _ = api("GET", "/pods")
    existing = [p for p in (pods if isinstance(pods, list) else [])]
    if existing:
        print(f"[guard] {len(existing)} pod(s) already exist: {[p.get('id') for p in existing]} — aborting to avoid double spend"); sys.exit(2)
    pid = create_pod(); rc = 1
    try:
        if not wait_ready(pid): raise RuntimeError("pod did not reach render-ready state within timeout")
        print("[render] starting svd_render.py")
        cmd = [sys.executable, str(HERE / "svd_render.py"), "--pod", pid] + a.render_args.split()
        rc = subprocess.run(cmd, cwd=str(HERE)).returncode
        print(f"[render] svd_render exited {rc}")
    finally:
        print("[finally] tearing down pod (guaranteed)"); terminate(pid)
    sys.exit(rc)

if __name__ == "__main__":
    main()
