"""RunPod pod provider — the InstanceProvider for RunPod GPU pods.

Wraps the hard-won RunPod REST surface (create with flaky-500 recover-by-name,
name-scoped list/cull/terminate) behind the Commons InstanceProvider, so every
guard/cull/reap is scoped to THIS agent's slug by construction — an agent can only
ever see and touch pods named `<base>--<slug>` for its own slug.

Ownership is carried in the pod NAME (the only handle RunPod's API gives): a pod is
attributed to `owner_of_name(name)`. Pods without the `--<slug>` marker are treated
as not-Commons-managed (owner None → never reaped).
"""
import json
import os
import ssl
import subprocess
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

from .. import board, identity
from ..provider import InstanceProvider, Resource

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")


def _repo_root() -> Path:
    here = os.path.dirname(os.path.abspath(__file__))
    out = subprocess.run(["git", "-C", here, "rev-parse", "--show-toplevel"],
                         capture_output=True, text=True, timeout=5).stdout.strip()
    return Path(out) if out else Path(here)


def _ctx():
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl._create_unverified_context()


def _created_ts(pod: dict) -> float | None:
    """Best-effort epoch-seconds creation time from a RunPod pod record."""
    for k in ("createdAt", "created_at", "lastStartedAt"):
        v = pod.get(k)
        if isinstance(v, str) and v:
            try:
                return datetime.fromisoformat(v.replace("Z", "+00:00")).timestamp()
            except Exception:
                pass
    rt = pod.get("runtime") or {}
    up = rt.get("uptimeInSeconds")
    if isinstance(up, (int, float)):
        return time.time() - up
    return None


class RunpodPodProvider(InstanceProvider):
    name = "runpod_pod"
    kind = "pod"

    def __init__(self, config_path: str | Path | None = None, api_key: str | None = None,
                 steward: str = "RunPod GPU Backend"):
        self.steward = steward
        self._ctx = _ctx()
        if api_key:
            self.key = api_key
        else:
            cfg = Path(config_path) if config_path else (_repo_root() / "RunPod Images" / "studio" / "config.json")
            self.key = json.load(open(cfg))["api_key"]

    # ── transport ────────────────────────────────────────────────────────────
    def api(self, method: str, path: str, body: dict | None = None, timeout: int = 60):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(
            "https://rest.runpod.io/v1" + path, data=data, method=method,
            headers={"Authorization": f"Bearer {self.key}", "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=self._ctx) as r:
                b = r.read()
                return (json.loads(b) if b else {}), r.status
        except urllib.error.HTTPError as e:
            return {"_error": e.read().decode()[:400]}, e.code

    # ── ownership-scoped views ────────────────────────────────────────────────
    def _to_resource(self, pod: dict) -> Resource:
        name = pod.get("name", "")
        return Resource(
            id=pod.get("id") or pod.get("podId"),
            name=name,
            owner_slug=identity.owner_of_name(name),
            created_ts=_created_ts(pod),
            kind=self.kind,
            provider=self.name,
            raw=pod,
        )

    def list_all(self) -> list[Resource]:
        d, _ = self.api("GET", "/pods")
        pods = d if isinstance(d, list) else []
        return [self._to_resource(p) for p in pods]

    def _named(self, name: str) -> list[Resource]:
        return [r for r in self.list_all() if r.name == name]

    # ── lifecycle ─────────────────────────────────────────────────────────────
    def create(self, spec: dict) -> Resource:
        """spec: {base, image, gpuTypeIds, gpuCount?, ports?, containerDiskInGb, dockerStartCmd,
        max_tries?, delay?}. Returns the created pod as a Resource, owner-tagged in its name."""
        base = spec["base"]
        name = identity.owner_name(base)          # "<base>--<slug>"
        body = {
            "name": name,
            "imageName": spec["image"],
            "gpuTypeIds": spec["gpuTypeIds"],
            "gpuCount": spec.get("gpuCount", 1),
            "ports": spec.get("ports", ["8188/http"]),
            "containerDiskInGb": spec["containerDiskInGb"],
            "dockerStartCmd": spec["dockerStartCmd"],
        }
        # Optional RunPod create fields, forwarded only when the spec sets them (e.g. m3's
        # network volume where its FLUX Union ControlNet lives). Keeps naming/ownership
        # invariant while letting a spec carry whatever the pod actually needs.
        for opt in ("networkVolumeId", "volumeMountPath", "volumeInGb", "env",
                    "allowedCudaVersions", "dataCenterIds", "cloudType"):
            if spec.get(opt) is not None:
                body[opt] = spec[opt]
        max_tries, delay = spec.get("max_tries", 6), spec.get("delay", 30)
        self._heartbeat(base)                     # I'm about to use the account (liveness for the reaper)
        for i in range(max_tries):
            r, code = self.api("POST", "/pods", body)
            pid = (r.get("id") or r.get("podId")) if isinstance(r, dict) else None
            if code in (200, 201) and pid:
                time.sleep(4)
                self._cull_extras(name, keep=pid)
                print(f"[runpod_pod] created {pid} ({name})")
                return self._get_or_synth(pid, name)
            # non-200: flaky-500 may STILL have created the pod — recover by name, don't retry-leak.
            time.sleep(6)
            mine = self._named(name)
            if mine:
                pid = mine[0].id
                self._cull_extras(name, keep=pid)
                print(f"[runpod_pod] recovered {pid} (API {code} but a pod exists)")
                return self._get_or_synth(pid, name)
            print(f"[runpod_pod] no pod (code {code}, try {i+1}/{max_tries}) — retry {delay}s")
            time.sleep(delay)
        raise RuntimeError("runpod_pod create failed: no pod after retries")

    def _get_or_synth(self, pid: str, name: str) -> Resource:
        for r in self._named(name):
            if r.id == pid:
                return r
        return Resource(id=pid, name=name, owner_slug=identity.owner_of_name(name),
                        created_ts=time.time(), kind=self.kind, provider=self.name, raw={})

    def _cull_extras(self, name: str, keep: str) -> None:
        """RunPod's create is flaky (can 500 yet still create). Keep one; DELETE any other
        pod with MY name, so a retry never leaks — scoped to my name, never another agent's."""
        for r in self._named(name):
            if r.id != keep:
                self.api("DELETE", f"/pods/{r.id}")
                print(f"[runpod_pod] culled leaked extra {r.id}")

    def terminate(self, resource: Resource) -> bool:
        pid = resource.id if isinstance(resource, Resource) else resource
        _, code = self.api("DELETE", f"/pods/{pid}")
        print(f"[runpod_pod] DELETE /pods/{pid} -> {code}")
        for _ in range(10):
            g, c = self.api("GET", f"/pods/{pid}")
            if c == 404 or (isinstance(g, dict) and g.get("desiredStatus") in ("TERMINATED", "EXITED")):
                return True
            time.sleep(3)
        print(f"[runpod_pod] WARNING could not confirm {pid} gone — CHECK CONSOLE")
        return False

    # ── liveness (so the reaper protects my live pods) ────────────────────────
    def _heartbeat(self, base: str) -> None:
        try:
            board.post(board.make_message(
                "BROADCAST", "GENERAL",
                {"kind": "commons_liveness", "provider": self.name, "slug": self.slug(),
                 "base": base, "headline": f"{self.steward}: agent '{self.slug()}' active on RunPod."},
                from_=self.steward), silent=True)
        except Exception:
            pass  # liveness is best-effort; never break a render
