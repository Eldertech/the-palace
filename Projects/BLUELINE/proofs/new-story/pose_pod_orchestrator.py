#!/usr/bin/env python3
"""
BLUELINE · FRAME DESIGNER — SDXL + OpenPose-ControlNet POD orchestrator (move generation off the Mac).

Boots the proven worker-comfyui image and downloads, into it (volume-free -> any datacenter):
  - sd_xl_base_1.0           (SDXL keeps the hand-drawn ink; FLUX smooths it away)
  - xinsir openpose SDXL CN  -> controlnet-openpose-sdxl.safetensors   (the names the pipeline's RS.graph uses)
  - xinsir depth SDXL CN     -> controlnet-depth-sdxl.safetensors
GATEs readiness on (ComfyUI up + SDXL ckpt present + openpose CN present), runs a render script against the
pod via the proxy, and ALWAYS terminates in finally. Create-retry across GPU types for capacity.

  python3 pose_pod_orchestrator.py                                   # runs rich_pipeline.py --pod <id>
  python3 pose_pod_orchestrator.py --render-script scene_pipeline.py --render-args "--seed 1100 --tag A --ngens 2"
  python3 pose_pod_orchestrator.py --terminate-only <podId>
"""
import argparse, json, ssl, subprocess, sys, time
import urllib.request, urllib.error
from pathlib import Path

PALACE = Path("/Users/loudonstearns/Documents/The Palace")
CONFIG = PALACE / "RunPod Images" / "studio" / "config.json"
HERE = Path(__file__).resolve().parent
IMAGE = "runpod/worker-comfyui:5.8.4-flux1-dev-fp8"
GPU_IDS = ["NVIDIA GeForce RTX 4090","NVIDIA GeForce RTX 3090","NVIDIA RTX A5000","NVIDIA L40","NVIDIA L40S",
           "NVIDIA RTX A6000","NVIDIA A40"]
CKPT = "sd_xl_base_1.0.safetensors"
CN_POSE = "controlnet-openpose-sdxl.safetensors"
SDXL_URL = "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors"
OP_URL = "https://huggingface.co/xinsir/controlnet-openpose-sdxl-1.0/resolve/main/diffusion_pytorch_model.safetensors"
DEPTH_URL = "https://huggingface.co/xinsir/controlnet-depth-sdxl-1.0/resolve/main/diffusion_pytorch_model.safetensors"
CANNY_URL = "https://huggingface.co/xinsir/controlnet-canny-sdxl-1.0/resolve/main/diffusion_pytorch_model.safetensors"
import os as _os
_WITH_CANNY = bool(_os.environ.get("POD_CANNY"))  # faces want ink→canny + depth + openpose
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
        return {"_error": e.read().decode()[:400]}, e.code

def proxy_get(pid, path, timeout=15):
    req = urllib.request.Request(f"https://{pid}-8188.proxy.runpod.net{path}", headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r: return r.read()

START = (
  'set -e\n'
  'mkdir -p /comfyui/models/checkpoints /comfyui/models/controlnet\n'
  'dl() {\n'
  '  if [ ! -e "$2" ]; then echo "[dl] start $(basename "$2")"; wget -q -O "$2.part" "$1"; '
  'SZ=$(stat -c%s "$2.part" 2>/dev/null || echo 0); '
  'if [ "$SZ" -gt "$3" ]; then mv "$2.part" "$2"; echo "[dl] ready $(basename "$2") ($SZ)"; '
  'else echo "[dl] FAILED $(basename "$2") ($SZ)"; rm -f "$2.part"; fi; fi; }\n'
  f'( dl "{SDXL_URL}" "/comfyui/models/checkpoints/{CKPT}" 1000000000 \n'
  f'  dl "{OP_URL}" "/comfyui/models/controlnet/{CN_POSE}" 1000000000 \n'
  + (f'  dl "{CANNY_URL}" "/comfyui/models/controlnet/controlnet-canny-sdxl.safetensors" 1000000000 \n' if _WITH_CANNY else '')
  + f'  dl "{DEPTH_URL}" "/comfyui/models/controlnet/controlnet-depth-sdxl.safetensors" 1000000000 ) &\n'
  'echo "[pod] launch ComfyUI (model downloads running in background)"\n'
  'cd /comfyui && exec python -u main.py --disable-auto-launch --disable-metadata --listen --port 8188\n'
)

NAME = "blueline-sdxl-pose-cn"

def list_named():
    d, _ = api("GET", "/pods")
    return [p for p in (d if isinstance(d, list) else []) if p.get("name") == NAME]

def cleanup_named():
    pods = list_named(); print(f"[cleanup] {len(pods)} '{NAME}' pod(s) to remove: {[p['id'] for p in pods]}")
    for p in pods:
        _, c = api("DELETE", f"/pods/{p['id']}"); print(f"  DELETE {p['id']} -> {c}")
    return len(pods)

def _cull_extras(keep):
    """RunPod's create is flaky — it can 500 yet still create the pod. Keep one, DELETE any others by name,
    so a retry never leaks (the bug that spawned 11 pods on 2026-06-23)."""
    for p in list_named():
        if p["id"] != keep:
            api("DELETE", f"/pods/{p['id']}"); print(f"[create] culled extra leaked pod {p['id']}")

def create_pod(max_tries=6, delay=30):
    body = {"name":NAME,"imageName":IMAGE,"gpuTypeIds":GPU_IDS,"gpuCount":1,
            "ports":["8188/http"],"containerDiskInGb":55,"dockerStartCmd":["bash","-c",START]}
    for i in range(max_tries):
        r, code = api("POST", "/pods", body)
        pid = (r.get("id") or r.get("podId")) if isinstance(r, dict) else None
        if code in (200, 201) and pid:
            time.sleep(4); _cull_extras(pid)
            Path("/tmp/pod_id").write_text(pid); print(f"[create] pod {pid}"); return pid
        # non-200: the pod may STILL have been created (flaky 500). RECOVER by name instead of retry-leaking.
        time.sleep(6); named = list_named()
        if named:
            pid = named[0]["id"]; _cull_extras(pid)
            Path("/tmp/pod_id").write_text(pid)
            print(f"[create] recovered pod {pid} (API returned {code} but a pod exists)"); return pid
        print(f"[create] no pod created (code {code}, try {i+1}/{max_tries}) — retry {delay}s"); time.sleep(delay)
    sys.exit("create failed: no pod after retries")

def terminate(pid):
    r, code = api("DELETE", f"/pods/{pid}")
    print(f"[terminate] DELETE /pods/{pid} -> {code}")
    for _ in range(10):
        g, c = api("GET", f"/pods/{pid}")
        if c == 404 or (isinstance(g, dict) and g.get("desiredStatus") in ("TERMINATED","EXITED")):
            print(f"[terminate] confirmed {pid} gone"); return True
        time.sleep(3)
    print(f"[terminate] WARNING could not confirm {pid} — CHECK CONSOLE"); return False

def _opts(pid, node, field):
    try:
        info = json.loads(proxy_get(pid, f"/object_info/{node}", timeout=10))
        v = info.get(node, {}).get("input", {}).get("required", {}).get(field, [[]])
        return v[0] if v and isinstance(v[0], list) else []
    except Exception:
        return []

def wait_ready(pid, boot_timeout=1800):
    t0 = time.time(); up = False
    while time.time() - t0 < boot_timeout:
        el = int(time.time()-t0)
        if not up:
            try: proxy_get(pid, "/system_stats", timeout=10); up = True; print(f"[ready] ComfyUI HTTP up at ~{el}s")
            except Exception:
                g,_ = api("GET", f"/pods/{pid}"); ds = g.get("desiredStatus") if isinstance(g,dict) else "?"
                print(f"[ready] waiting… {el}s (status={ds})"); time.sleep(10); continue
        cnames = _opts(pid, "ControlNetLoader", "control_net_name")
        ck = CKPT in _opts(pid, "CheckpointLoaderSimple", "ckpt_name")
        cn = CN_POSE in cnames
        cy = (not _WITH_CANNY) or ("controlnet-canny-sdxl.safetensors" in cnames)
        print(f"[ready] {el}s sdxl={ck} openpose_cn={cn} canny_cn={cy}")
        if ck and cn and cy: print(f"[ready] PASS at ~{el}s (sdxl+canny confirmed)"); return True
        time.sleep(10)
    return False

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--terminate-only", default=None)
    ap.add_argument("--render-script", default="rich_pipeline.py")
    ap.add_argument("--render-args", default="")
    ap.add_argument("--keep-alive", action="store_true", help="don't terminate (for batching multiple runs)")
    ap.add_argument("--cleanup", action="store_true", help="terminate ALL blueline-sdxl-pose-cn pods and exit")
    a = ap.parse_args()
    if a.cleanup: cleanup_named(); return
    if a.terminate_only: terminate(a.terminate_only); return
    pods,_ = api("GET","/pods"); existing=[p for p in (pods if isinstance(pods,list) else [])]
    if existing:
        print(f"[guard] {len(existing)} pod(s) already exist {[p.get('id') for p in existing]} — abort. "
              f"Run with --cleanup to remove leaked '{NAME}' pods first."); sys.exit(2)
    pid = create_pod(); rc = 1
    try:
        if not wait_ready(pid): raise RuntimeError("pod did not reach ready")
        print(f"[render] {a.render_script} --pod {pid} {a.render_args}")
        rc = subprocess.run([sys.executable, str(HERE/a.render_script), "--pod", pid] + a.render_args.split(),
                            cwd=str(HERE)).returncode
        print(f"[render] {a.render_script} exited {rc}")
    finally:
        if a.keep_alive and rc == 0:
            print(f"[finally] --keep-alive: pod {pid} LEFT RUNNING — terminate with --terminate-only {pid}")
        else:
            print("[finally] tearing down pod (guaranteed)"); terminate(pid)
    sys.exit(rc)

if __name__ == "__main__":
    main()
