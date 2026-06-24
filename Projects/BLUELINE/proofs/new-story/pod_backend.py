#!/usr/bin/env python3
"""
BLUELINE · FRAME DESIGNER — POD/LOCAL render backend. One drop-in so a pipeline renders against either a
local ComfyUI (:8189) or a RunPod pod (proxy :8188), without changing the workflow JSON. The Pod transport
is the PROVEN one from m3_pod_render (browser-UA + curl multipart to beat the RunPod proxy WAF; curl submit
with retry because the proxy resets large bodies; poll /history; fetch /view).

  BK = Backend(pod_id_or_None)
  name = BK.upload(path)          # same return as render_shot.upload
  dt   = BK.run(workflow, dest)   # same return as render_shot.run
RS.graph(...) (pure workflow JSON) is unchanged and used directly by callers.
"""
import json, os, ssl, subprocess, tempfile, time, urllib.request, urllib.parse, uuid
from pathlib import Path
import render_shot as RS

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
try:
    import certifi; CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    CTX = ssl._create_unverified_context()

class Pod:
    """RunPod ComfyUI proxy transport (port 8188). Copied from the proven m3_pod_render.Pod."""
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
                "-H", f"User-Agent: {UA}",
                "-F", f"image=@{path};type=image/png;filename={name}", "-F", "overwrite=true",
                f"{self.B}/upload/image"], capture_output=True, text=True, timeout=80)
            body, _, code = out.stdout.rpartition("\n")
            if '"name"' in body: return json.loads(body).get("name", name)
            last = f"try {i+1} [{code.strip()}] body={body[:150]!r} err={out.stderr[:150]!r}"
            print(f"  upload retry: {last}", flush=True); time.sleep(6)
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
                last = f"try {i+1} HTTP[{code.strip()}] body={body[:200]!r} err={out.stderr[:200]!r}"
                print(f"  submit retry: {last}", flush=True); time.sleep(6)
            raise RuntimeError(f"submit failed after {tries}: {last}")
        finally:
            os.unlink(tmp)
    def wait(self, pid, timeout=600):
        t0 = time.time()
        while time.time() - t0 < timeout:
            h = json.loads(self._req("GET", f"/history/{pid}"))
            if pid in h:
                st = h[pid].get("status", {})
                if st.get("status_str") == "error": raise RuntimeError(json.dumps(st)[:300])
                return h[pid]
            time.sleep(2)
        raise TimeoutError(pid)
    def fetch(self, hist, dest):
        for out in hist.get("outputs", {}).values():
            for img in out.get("images", []):
                q = urllib.parse.urlencode({"filename": img["filename"], "subfolder": img.get("subfolder", ""),
                                            "type": img.get("type", "output")})
                Path(dest).write_bytes(self._req("GET", "/view?" + q)); return dest
        raise RuntimeError("no image in history outputs")

class Backend:
    """Render against a pod (if pid given) or the local ComfyUI (render_shot)."""
    def __init__(self, pid=None):
        self.pod = Pod(pid) if pid else None
    def upload(self, path):
        return self.pod.upload(path) if self.pod else RS.upload(path)
    def run(self, wf, dest):
        if not self.pod: return RS.run(wf, dest)
        t0 = time.time(); pr = self.pod.submit(wf); hist = self.pod.wait(pr); self.pod.fetch(hist, dest)
        return time.time() - t0
