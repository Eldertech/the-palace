#!/usr/bin/env python3
"""
BLUELINE · SDXL pose run — VOLUME-FREE pod lifecycle owner. SDXL keeps the hand-drawn ink quality FLUX
smoothed away. Uses the PROVEN worker-comfyui image (guaranteed ComfyUI) and downloads sd_xl_base_1.0 into
it (no dependency on a prebuilt sdxl tag, no network volume -> any datacenter). Create-retry + GATE on
(ComfyUI up + SDXL checkpoint present) + ALWAYS terminate in finally.

  python3 sdxl_orchestrator.py --render-args "--n 100 --vary-cast"
  python3 sdxl_orchestrator.py --terminate-only <podId>

MULTI-AGENT (2026-07-02): the pod is per-agent-namespaced — "blueline-sdxl-pose-<slug>" (see
_ops/runpod/agent_ns.py). Guard/create/cull/terminate all scope to that name, so this is safe to
run concurrently with other Claudes on the same RunPod account.
"""
import argparse, json, ssl, subprocess, sys, time
import urllib.request, urllib.error
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
from agent_ns import SLUG, pod_name, pod_id_file

PALACE = Path("/Users/loudonstearns/Documents/The Palace")
CONFIG = PALACE / "RunPod Images" / "studio" / "config.json"
HERE = Path(__file__).resolve().parent
IMAGE = "runpod/worker-comfyui:5.8.4-flux1-dev-fp8"   # proven to boot with ComfyUI; we add SDXL below
GPU_IDS = ["NVIDIA GeForce RTX 4090","NVIDIA GeForce RTX 3090","NVIDIA RTX A5000","NVIDIA L40","NVIDIA L40S",
           "NVIDIA RTX A6000","NVIDIA A40"]
CKPT = "sd_xl_base_1.0.safetensors"
CKPT_URL = "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors"
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

# Launch ComfyUI IMMEDIATELY; pull SDXL in the BACKGROUND (so HTTP comes up fast and readiness can poll for
# the ckpt to appear). Size-guard: only publish the file once it's a real >1GB download (a gated/404 wget
# writes a tiny HTML page — never let that masquerade as the checkpoint). ComfyUI re-scans the folder on
# /object_info, so the ckpt shows up mid-run once the download lands.
START = ('set -e\nmkdir -p /comfyui/models/checkpoints\n'
         f'CK=/comfyui/models/checkpoints/{CKPT}\n'
         '( if [ ! -e "$CK" ]; then echo "[sdxl] bg download sd_xl_base (~6.6GB)"; '
         f'wget -q -O "$CK.part" "{CKPT_URL}"; '
         'SZ=$(stat -c%s "$CK.part" 2>/dev/null || echo 0); '
         'if [ "$SZ" -gt 1000000000 ]; then mv "$CK.part" "$CK"; echo "[sdxl] checkpoint ready ($SZ bytes)"; '
         'else echo "[sdxl] DOWNLOAD FAILED — only $SZ bytes (gated/404?)"; rm -f "$CK.part"; fi; fi ) &\n'
         'echo "[sdxl] launch ComfyUI (download running in background)"\n'
         'cd /comfyui && exec python -u main.py --disable-auto-launch --disable-metadata --listen --port 8188\n')

NAME = pod_name("blueline-sdxl-pose")   # per-agent: "...-<slug>", never shared across agents
POD_ID_FILE = pod_id_file()             # "/tmp/pod_id-<slug>", never the shared "/tmp/pod_id"

def list_named():
    d, _ = api("GET", "/pods")
    return [p for p in (d if isinstance(d, list) else []) if p.get("name") == NAME]

def create_pod(max_tries=12, delay=30):
    body = {"name": NAME,"imageName":IMAGE,"gpuTypeIds":GPU_IDS,"gpuCount":1,
            "ports":["8188/http"],"containerDiskInGb":40,"dockerStartCmd":["bash","-c",START]}
    for i in range(max_tries):
        r, code = api("POST", "/pods", body)
        if code in (200,201):
            pid = r.get("id") or r.get("podId")
            if not pid: sys.exit(f"create: no id {json.dumps(r)[:300]}")
            POD_ID_FILE.write_text(pid)
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

def wait_ready(pid, boot_timeout=1500):
    t0 = time.time(); up = False
    while time.time() - t0 < boot_timeout:
        el = int(time.time()-t0)
        if not up:
            try: proxy_get(pid, "/system_stats", timeout=10); up = True; print(f"[ready] ComfyUI HTTP up at ~{el}s")
            except Exception:
                g,_ = api("GET", f"/pods/{pid}"); ds = g.get("desiredStatus") if isinstance(g,dict) else "?"
                print(f"[ready] waiting… {el}s (status={ds})"); time.sleep(10); continue
        try:
            ck = json.loads(proxy_get(pid, "/object_info/CheckpointLoaderSimple", timeout=10))
            opts = ck.get("CheckpointLoaderSimple",{}).get("input",{}).get("required",{}).get("ckpt_name",[[]])
            lst = opts[0] if opts and isinstance(opts[0],list) else []
            has = CKPT in lst
            print(f"[ready] {CKPT} present={has} (have {len(lst)} ckpts: {lst[:4]})")
            if has: print(f"[ready] PASS at ~{el}s"); return True
        except Exception as e:
            print(f"[ready] ckpt probe retry ({el}s): {repr(e)[:100]}")
        time.sleep(10)
    return False

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--terminate-only", default=None)
    ap.add_argument("--render-args", default="--n 100 --vary-cast")
    a = ap.parse_args()
    print(f"[ns] agent slug={SLUG}  pod name={NAME}")
    if a.terminate_only: terminate(a.terminate_only); return
    mine = list_named()
    if mine:
        print(f"[guard] my pod '{NAME}' already exists {[p.get('id') for p in mine]} — abort. Run --terminate-only to remove it first."); sys.exit(2)
    pid = create_pod(); rc = 1
    try:
        if not wait_ready(pid): raise RuntimeError("pod did not reach ready")
        print("[render] starting sdxl_pose_render.py")
        rc = subprocess.run([sys.executable, str(HERE/"sdxl_pose_render.py"), "--pod", pid] + a.render_args.split(), cwd=str(HERE)).returncode
        print(f"[render] sdxl_pose_render exited {rc}")
    finally:
        print("[finally] tearing down pod (guaranteed)"); terminate(pid)
    sys.exit(rc)

if __name__ == "__main__":
    main()
