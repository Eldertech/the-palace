#!/usr/bin/env python3
"""
BLUELINE · Track VI — RunPod pod manager, on the PROVEN M3 recipe: mount the blueline-models
network volume (which holds the FLUX union ControlNet), symlink it into ComfyUI, launch. This
is the known-good path (the SDXL-download-to-container recipe never exposed ComfyUI; the volume
recipe is what M3 rendered with on 2026-06-23). FLUX + flux-union-pro (depth/canny/openpose).

  python pod.py --up | --status | --down [pid] | --cleanup
"""
import argparse, json, ssl, time, sys
import urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
CONFIG = ROOT / "RunPod Images" / "studio" / "config.json"
IMAGE = "runpod/worker-comfyui:5.8.4-flux1-dev-fp8"
VOLUME_ID = "aqm8oev4b0"                       # blueline-models (EU-RO-1) — holds flux-union-pro
GPU_IDS = ["NVIDIA GeForce RTX 4090", "NVIDIA L40S", "NVIDIA L40",
           "NVIDIA RTX A6000", "NVIDIA A40", "NVIDIA RTX A5000"]
NAME = "blueline-tVI-layers"
PID_FILE = Path("/tmp/tVI_pod_id")
CN_NAME = "flux-union-pro.safetensors"
CN_HF = ("https://huggingface.co/Shakker-Labs/FLUX.1-dev-ControlNet-Union-Pro/resolve/main/"
         "diffusion_pytorch_model.safetensors")
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
    req = urllib.request.Request(f"https://{pid}-8188.proxy.runpod.net{path}", headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
        return r.read()


def start_script():
    return (
        'set -e\n'
        'mkdir -p /comfyui/models/controlnet\n'
        f'CN=/comfyui/models/controlnet/{CN_NAME}\n'
        'if [ ! -e "$CN" ]; then\n'
        f'  F=$(find /workspace -type f \\( -iname "{CN_NAME}" -o -iname "*union*pro*.safetensors" '
        '-o -iname "*controlnet*union*.safetensors" \\) 2>/dev/null | head -1)\n'
        '  if [ -n "$F" ]; then echo "[tVI] symlink $F"; ln -sf "$F" "$CN"; '
        f'else echo "[tVI] download CN"; wget -q -O "$CN" "{CN_HF}"; fi\n'
        'fi\n'
        'ls -la /comfyui/models/controlnet/ || true\n'
        'echo "[tVI] launch ComfyUI"\n'
        'cd /comfyui && exec python -u main.py --disable-auto-launch --disable-metadata --listen --port 8188\n'
    )


def list_named():
    d, _ = api("GET", "/pods")
    return [p for p in (d if isinstance(d, list) else []) if p.get("name") == NAME]


def cleanup_named():
    pods = list_named(); print(f"[cleanup] {len(pods)} '{NAME}' pod(s): {[p['id'] for p in pods]}")
    for p in pods:
        _, c = api("DELETE", f"/pods/{p['id']}"); print(f"  DELETE {p['id']} -> {c}")
    return len(pods)


def _cull_extras(keep):
    for p in list_named():
        if p["id"] != keep:
            api("DELETE", f"/pods/{p['id']}"); print(f"[create] culled leaked pod {p['id']}")


def create_pod(max_tries=10, delay=30):
    body = {"name": NAME, "imageName": IMAGE, "gpuTypeIds": GPU_IDS, "gpuCount": 1,
            "networkVolumeId": VOLUME_ID, "volumeMountPath": "/workspace",
            "ports": ["8188/http", "22/tcp"], "containerDiskInGb": 25,
            "dockerStartCmd": ["bash", "-c", start_script()]}
    for i in range(max_tries):
        r, code = api("POST", "/pods", body)
        pid = (r.get("id") or r.get("podId")) if isinstance(r, dict) else None
        if code in (200, 201) and pid:
            time.sleep(4); _cull_extras(pid); PID_FILE.write_text(pid); print(f"[create] pod {pid}"); return pid
        err = json.dumps(r)[:200]
        if code == 500 or "no instances" in err.lower() or "no longer any instances" in err.lower():
            time.sleep(6); named = list_named()
            if named:                                  # flaky 500 still created it — recover by name
                pid = named[0]["id"]; _cull_extras(pid); PID_FILE.write_text(pid)
                print(f"[create] recovered pod {pid} (API {code})"); return pid
            print(f"[create] no capacity (try {i+1}/{max_tries} [{code}]): {err} — retry {delay}s"); time.sleep(delay); continue
        sys.exit(f"create failed [{code}]: {json.dumps(r)[:600]}")
    sys.exit("create failed: no capacity after retries")


def terminate(pid):
    r, code = api("DELETE", f"/pods/{pid}"); print(f"[terminate] DELETE /pods/{pid} -> {code}")
    for _ in range(12):
        g, c = api("GET", f"/pods/{pid}")
        if c == 404 or (isinstance(g, dict) and g.get("desiredStatus") in ("TERMINATED", "EXITED")):
            print(f"[terminate] confirmed {pid} gone"); return True
        time.sleep(3)
    print(f"[terminate] WARNING could not confirm {pid} — CHECK RUNPOD CONSOLE"); return False


def _cn_list(pid):
    try:
        info = json.loads(proxy_get(pid, "/object_info/ControlNetLoader", timeout=10))
        v = info.get("ControlNetLoader", {}).get("input", {}).get("required", {}).get("control_net_name", [[]])
        return v[0] if v and isinstance(v[0], list) else []
    except Exception:
        return []


def wait_ready(pid, boot_timeout=900):
    t0 = time.time(); up = False
    while time.time() - t0 < boot_timeout:
        el = int(time.time() - t0)
        if not up:
            try:
                proxy_get(pid, "/system_stats", timeout=10); up = True; print(f"[ready] ComfyUI up ~{el}s")
            except Exception:
                g, _ = api("GET", f"/pods/{pid}"); ds = g.get("desiredStatus") if isinstance(g, dict) else "?"
                print(f"[ready] waiting… {el}s (status={ds})"); time.sleep(8); continue
        cns = _cn_list(pid); has = CN_NAME in cns
        print(f"[ready] {el}s union_cn={has} (have: {cns})")
        if has:
            print(f"[ready] PASS ~{el}s"); return True
        time.sleep(8)
    return False


def ensure():
    named = list_named()
    if named:
        pid = named[0]["id"]; PID_FILE.write_text(pid); print(f"[ensure] reusing {pid}")
    else:
        pid = create_pod()
    if not wait_ready(pid):
        raise RuntimeError("pod did not reach ready")
    return pid


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--up", action="store_true")
    ap.add_argument("--status", action="store_true")
    ap.add_argument("--down", nargs="?", const="__file__")
    ap.add_argument("--cleanup", action="store_true")
    a = ap.parse_args()
    if a.cleanup:
        cleanup_named(); return
    if a.status:
        for p in list_named():
            print(p.get("id"), p.get("desiredStatus"), p.get("machine", {}).get("gpuTypeId", ""))
        return
    if a.down is not None:
        pid = PID_FILE.read_text().strip() if a.down == "__file__" else a.down
        terminate(pid); return
    if a.up:
        pid = ensure(); print(f"POD_READY {pid}"); print(f"URL https://{pid}-8188.proxy.runpod.net")


if __name__ == "__main__":
    main()
