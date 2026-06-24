#!/usr/bin/env python3
"""
BLUELINE · FLUX pose run — VOLUME-FREE pod lifecycle owner. FLUX txt2img needs no ControlNet and no network
volume (the FLUX model is baked into the worker-comfyui image), so this runs in ANY datacenter — dodging the
EU-RO-1 capacity shortage the volume-pinned orchestrator hits. Create-retry + GATE on (ComfyUI up + FLUX
checkpoint present) + ALWAYS terminate in finally.

  python3 flux_orchestrator.py --render-args "--n 100 --vary-cast"
  python3 flux_orchestrator.py --terminate-only <podId>
"""
import argparse, json, ssl, subprocess, sys, time
import urllib.request, urllib.error
from pathlib import Path

PALACE = Path("/Users/loudonstearns/Documents/The Palace")
CONFIG = PALACE / "RunPod Images" / "studio" / "config.json"
HERE = Path(__file__).resolve().parent
IMAGE = "runpod/worker-comfyui:5.8.4-flux1-dev-fp8"
# proven RunPod gpuTypeIds (from M3) + 3090 -> more datacenters with capacity, no risk of a bad-id reject
GPU_IDS = ["NVIDIA GeForce RTX 4090","NVIDIA GeForce RTX 3090","NVIDIA RTX A5000","NVIDIA L40","NVIDIA L40S",
           "NVIDIA RTX A6000","NVIDIA A40"]
CKPT = "flux1-dev-fp8.safetensors"
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

START = ('set -e\necho "[flux] launch ComfyUI (model in image; no volume, no controlnet)"\n'
         'cd /comfyui && exec python -u main.py --disable-auto-launch --disable-metadata --listen --port 8188\n')

def create_pod(max_tries=12, delay=30):
    body = {"name":"blueline-flux-pose","imageName":IMAGE,"gpuTypeIds":GPU_IDS,"gpuCount":1,
            "ports":["8188/http"],"containerDiskInGb":30,"dockerStartCmd":["bash","-c",START]}
    for i in range(max_tries):
        r, code = api("POST", "/pods", body)
        if code in (200,201):
            pid = r.get("id") or r.get("podId")
            if not pid: sys.exit(f"create: no id {json.dumps(r)[:300]}")
            Path("/tmp/pod_id").write_text(pid)
            print(f"[create] pod {pid} ({r.get('machine',{}).get('gpuTypeId') or r.get('gpuTypeIds')})"); return pid
        err = json.dumps(r)[:200]
        if code == 500 or "no instances" in err.lower():
            print(f"[create] no capacity (try {i+1}/{max_tries}) — retry in {delay}s"); time.sleep(delay); continue
        sys.exit(f"create failed [{code}]: {err}")
    sys.exit("create failed: no GPU capacity anywhere after retries")

def terminate(pid):
    r, code = api("DELETE", f"/pods/{pid}")
    print(f"[terminate] DELETE /pods/{pid} -> {code}")
    for _ in range(10):
        g, c = api("GET", f"/pods/{pid}")
        if c == 404 or (isinstance(g, dict) and g.get("desiredStatus") in ("TERMINATED","EXITED")):
            print(f"[terminate] confirmed {pid} gone"); return True
        time.sleep(3)
    print(f"[terminate] WARNING could not confirm {pid} — CHECK CONSOLE"); return False

def wait_ready(pid, boot_timeout=900):
    t0 = time.time(); up = False
    while time.time() - t0 < boot_timeout:
        el = int(time.time()-t0)
        if not up:
            try: proxy_get(pid, "/system_stats", timeout=10); up = True; print(f"[ready] ComfyUI HTTP up at ~{el}s")
            except Exception:
                g,_ = api("GET", f"/pods/{pid}"); ds = g.get("desiredStatus") if isinstance(g,dict) else "?"
                print(f"[ready] waiting… {el}s (status={ds})"); time.sleep(8); continue
        try:
            ck = json.loads(proxy_get(pid, "/object_info/CheckpointLoaderSimple", timeout=10))
            opts = ck.get("CheckpointLoaderSimple",{}).get("input",{}).get("required",{}).get("ckpt_name",[[]])
            lst = opts[0] if opts and isinstance(opts[0],list) else []
            has = CKPT in lst
            print(f"[ready] {CKPT} present={has} (have {len(lst)} ckpts)")
            if has: print(f"[ready] PASS at ~{el}s"); return True
        except Exception as e:
            print(f"[ready] ckpt probe retry ({el}s): {repr(e)[:100]}")
        time.sleep(8)
    return False

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--terminate-only", default=None)
    ap.add_argument("--render-args", default="--n 100 --vary-cast")
    a = ap.parse_args()
    if a.terminate_only: terminate(a.terminate_only); return
    pods,_ = api("GET","/pods"); existing=[p for p in (pods if isinstance(pods,list) else [])]
    if existing:
        print(f"[guard] {len(existing)} pod(s) exist {[p.get('id') for p in existing]} — abort to avoid double spend"); sys.exit(2)
    pid = create_pod(); rc = 1
    try:
        if not wait_ready(pid): raise RuntimeError("pod did not reach ready")
        print("[render] starting flux_pose_render.py")
        rc = subprocess.run([sys.executable, str(HERE/"flux_pose_render.py"), "--pod", pid] + a.render_args.split(), cwd=str(HERE)).returncode
        print(f"[render] flux_pose_render exited {rc}")
    finally:
        print("[finally] tearing down pod (guaranteed)"); terminate(pid)
    sys.exit(rc)

if __name__ == "__main__":
    main()
