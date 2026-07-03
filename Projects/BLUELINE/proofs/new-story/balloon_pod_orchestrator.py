#!/usr/bin/env python3
"""
BLUELINE — living-balloon POD orchestrator. Multi-agent-safe + fast-boot variant of
pose_pod_orchestrator.py, built after two lessons (2026-07-02):

  1. MULTI-AGENT: a 2nd Claude's account-wide `--cleanup` sweeps killed this run's pods
     mid-boot, and our own blanket delete-by-shared-name would kill theirs. FIX: a UNIQUE
     pod name so we never collide, and teardown scoped to ONLY our own pod id — never an
     account sweep, never delete-by-shared-name.
  2. SLOW BOOT: the shared orchestrator downloads SDXL+openpose+canny+depth (~14GB) via
     single-stream wget and timed out at 30min with canny still downloading. FIX: download
     ONLY what the balloon task needs (SDXL + canny, ~9GB), in parallel via aria2c -x16,
     and gate readiness on exactly those two.

Boots the proven worker-comfyui image, downloads SDXL + controlnet-canny-sdxl, gates on
both present, runs balloon_pod_render.py against the pod, ALWAYS terminates its own pod.

  python3 balloon_pod_orchestrator.py
  python3 balloon_pod_orchestrator.py --terminate-only <podId>
"""
import argparse, json, ssl, subprocess, sys, time, urllib.request, urllib.error
from pathlib import Path

PALACE = Path("/Users/loudonstearns/Documents/The Palace")
CONFIG = PALACE / "RunPod Images" / "studio" / "config.json"
HERE = Path(__file__).resolve().parent
IMAGE = "runpod/worker-comfyui:5.8.4-flux1-dev-fp8"
GPU_IDS = ["NVIDIA GeForce RTX 4090","NVIDIA GeForce RTX 3090","NVIDIA RTX A5000","NVIDIA L40",
           "NVIDIA L40S","NVIDIA RTX A6000","NVIDIA A40"]
NAME = "blueline-balloon-canny"          # UNIQUE — never collides with other agents' pods
CKPT = "sd_xl_base_1.0.safetensors"
CANNY = "controlnet-canny-sdxl.safetensors"
SDXL_URL = "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors"
CANNY_URL = "https://huggingface.co/xinsir/controlnet-canny-sdxl-1.0/resolve/main/diffusion_pytorch_model.safetensors"
PIDFILE = "/tmp/balloon_pod_id"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
KEY = json.load(open(CONFIG))["api_key"]
try:
    import certifi; CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    CTX = ssl._create_unverified_context()

def api(method, path, body=None, timeout=60):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request("https://rest.runpod.io/v1"+path, data=data, method=method,
          headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
            b = r.read(); return (json.loads(b) if b else {}), r.status
    except urllib.error.HTTPError as e:
        return {"_error": e.read().decode()[:300]}, e.code

def proxy_get(pid, path, timeout=12):
    req = urllib.request.Request(f"https://{pid}-8188.proxy.runpod.net{path}", headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r: return r.read()

# download SDXL + canny only, in parallel, aria2c (fallback wget). ComfyUI launches first.
START = (
  'set -e\n'
  'mkdir -p /comfyui/models/checkpoints /comfyui/models/controlnet\n'
  'dl(){ if [ ! -e "$2" ]; then echo "[dl] start $(basename "$2")"; '
  'if command -v aria2c >/dev/null 2>&1; then aria2c -x16 -s16 -q -o "$2.part" "$1" || wget -q -O "$2.part" "$1"; '
  'else wget -q -O "$2.part" "$1"; fi; '
  'SZ=$(stat -c%s "$2.part" 2>/dev/null || echo 0); '
  'if [ "$SZ" -gt "$3" ]; then mv "$2.part" "$2"; echo "[dl] ready $(basename "$2") ($SZ)"; '
  'else echo "[dl] FAILED $(basename "$2")"; rm -f "$2.part"; fi; fi; }\n'
  f'( dl "{SDXL_URL}" "/comfyui/models/checkpoints/{CKPT}" 1000000000 & '
  f'  dl "{CANNY_URL}" "/comfyui/models/controlnet/{CANNY}" 1000000000 & wait ) &\n'
  'echo "[pod] launch ComfyUI (SDXL+canny downloading in parallel)"\n'
  'cd /comfyui && exec python -u main.py --disable-auto-launch --disable-metadata --listen --port 8188\n'
)

def my_pods():
    d,_ = api("GET","/pods")
    return [p for p in (d if isinstance(d,list) else []) if p.get("name")==NAME]

def terminate(pid):
    """Scoped: terminate ONLY this pod id. Never an account sweep."""
    _, code = api("DELETE", f"/pods/{pid}")
    print(f"[terminate] DELETE /pods/{pid} -> {code}")
    for _ in range(10):
        g,c = api("GET", f"/pods/{pid}")
        if c==404 or (isinstance(g,dict) and g.get("desiredStatus") in ("TERMINATED","EXITED")):
            print(f"[terminate] confirmed {pid} gone"); return True
        time.sleep(3)
    print(f"[terminate] WARNING could not confirm {pid} — CHECK CONSOLE"); return False

def create_pod(max_tries=6, delay=25):
    body = {"name":NAME,"imageName":IMAGE,"gpuTypeIds":GPU_IDS,"gpuCount":1,
            "ports":["8188/http"],"containerDiskInGb":55,"dockerStartCmd":["bash","-c",START]}
    for i in range(max_tries):
        r,code = api("POST","/pods", body)
        pid = (r.get("id") or r.get("podId")) if isinstance(r,dict) else None
        if code in (200,201) and pid:
            Path(PIDFILE).write_text(pid); print(f"[create] pod {pid}"); return pid
        # non-200 may still have created it — recover by OUR unique name (safe: only ours)
        time.sleep(6); mine = my_pods()
        if mine:
            pid = mine[0]["id"]; Path(PIDFILE).write_text(pid)
            print(f"[create] recovered pod {pid} (API {code} but our pod exists)"); return pid
        print(f"[create] no pod (code {code}, try {i+1}/{max_tries}) — retry {delay}s"); time.sleep(delay)
    sys.exit("create failed")

def _opts(pid, node, field):
    try:
        info = json.loads(proxy_get(pid, f"/object_info/{node}", timeout=10))
        v = info.get(node,{}).get("input",{}).get("required",{}).get(field,[[]])
        return v[0] if v and isinstance(v[0],list) else []
    except Exception:
        return []

def wait_ready(pid, boot_timeout=2400):
    t0=time.time(); up=False
    while time.time()-t0 < boot_timeout:
        el=int(time.time()-t0)
        if not up:
            try: proxy_get(pid,"/system_stats",timeout=10); up=True; print(f"[ready] ComfyUI up at ~{el}s")
            except Exception:
                g,_=api("GET",f"/pods/{pid}"); ds=g.get("desiredStatus") if isinstance(g,dict) else "?"
                print(f"[ready] waiting… {el}s (status={ds})", flush=True); time.sleep(10); continue
        cnames=_opts(pid,"ControlNetLoader","control_net_name")
        ck=CKPT in _opts(pid,"CheckpointLoaderSimple","ckpt_name"); cy=CANNY in cnames
        print(f"[ready] {el}s sdxl={ck} canny={cy}", flush=True)
        if ck and cy: print(f"[ready] PASS at ~{el}s (sdxl+canny confirmed)"); return True
        time.sleep(10)
    return False

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--terminate-only", default=None)
    ap.add_argument("--render-script", default="balloon_pod_render.py")
    a = ap.parse_args()
    if a.terminate_only: terminate(a.terminate_only); return
    # scope guard: only abort if OUR name already has a pod (leave other agents' pods alone)
    mine = my_pods()
    if mine:
        print(f"[guard] our pod already exists {[p['id'] for p in mine]} — terminate-only first"); sys.exit(2)
    pid = create_pod(); rc=1
    try:
        if not wait_ready(pid): raise RuntimeError("pod did not reach ready")
        print(f"[render] {a.render_script} --pod {pid}", flush=True)
        rc = subprocess.run([sys.executable, str(HERE/a.render_script), "--pod", pid], cwd=str(HERE)).returncode
        print(f"[render] exited {rc}")
    finally:
        print("[finally] tearing down OUR pod (scoped)"); terminate(pid)
    sys.exit(rc)

if __name__ == "__main__":
    main()
