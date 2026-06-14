#!/usr/bin/env python3
"""
runpod_specialist.py — Palace Shop backend for RunPod serverless endpoints.

The agent (Claude Code / Cowork) drives RunPod over plain HTTPS. This module is
the thin, dependency-light client that turns "run this ComfyUI workflow" into
"submit job -> poll -> collect outputs", with the scale-to-zero cold-start
behaviour handled so the poll loop never mistakes a booting worker for a failure.

It is a backend, not an agent runtime. No Anthropic API is touched here. The
Maker decides *what* to dispatch; this module is *how* the dispatch reaches a GPU.

Design choices worth knowing:
  - Serverless-first. Endpoints scale to zero; you pay per second of compute.
  - One endpoint can serve many Specialists (FLUX text-to-image, SDXL, the
    image-to-3D engines) as long as they share a worker image + network volume.
    The workflow JSON selects the behaviour; the endpoint is just the GPU.
  - Secrets never touch a palace file. The key is read from RUNPOD_API_KEY (or
    passed explicitly). Nothing is persisted to disk. This matches the palace's
    no-token-in-git rule (see Shopkeeper/next-run-commission.md).
  - --mock runs the entire call flow against a fake transport, so the client can
    be smoke-tested with no key and no live endpoint.

Stdlib only (urllib). No pip install required to run the client itself.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Optional

API_ROOT = "https://api.runpod.ai/v2"

# Terminal job states reported by the RunPod serverless API.
_TERMINAL_OK = {"COMPLETED"}
_TERMINAL_BAD = {"FAILED", "CANCELLED", "TIMED_OUT"}
_PENDING = {"IN_QUEUE", "IN_PROGRESS"}


class RunPodError(RuntimeError):
    """Any failure talking to RunPod or any job that ends in a bad state."""


@dataclass
class PollPolicy:
    """How patiently to wait on a scale-to-zero endpoint.

    A cold endpoint has to boot a worker and load models off the network volume
    before it reports IN_PROGRESS, so the first poll of the day can sit in
    IN_QUEUE for a while. cold_start_grace is how long we tolerate IN_QUEUE
    before treating a stuck queue as suspicious (we still keep polling up to
    total_timeout — the grace only changes the warning, never aborts early).
    """

    interval_seconds: float = 3.0
    total_timeout_seconds: float = 900.0   # 15 min: cold boot + heavy 3D job
    cold_start_grace_seconds: float = 240.0
    backoff_max_seconds: float = 10.0


@dataclass
class Transport:
    """HTTP seam. Real transport hits RunPod; a fake one is injected for --mock."""

    api_key: str
    timeout: float = 60.0
    _request: Optional[Callable[[str, str, Optional[dict]], dict]] = field(
        default=None, repr=False
    )

    def request(self, method: str, url: str, body: Optional[dict] = None) -> dict:
        if self._request is not None:        # injected fake (mock/testing)
            return self._request(method, url, body)
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Authorization", f"Bearer {self.api_key}")
        req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                raw = resp.read().decode()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")
            raise RunPodError(f"HTTP {e.code} from {url}: {detail}") from e
        except urllib.error.URLError as e:
            raise RunPodError(f"network error reaching {url}: {e.reason}") from e


class RunPodEndpoint:
    """A single serverless endpoint, addressed by its endpoint id.

    Typical use from the Maker / a dispatch script:

        ep = RunPodEndpoint(endpoint_id="abc123")     # key from env
        result = ep.run({"workflow": comfy_api_json, "images": [...]})
        saved = ep.save_outputs(result, "./out")
    """

    def __init__(
        self,
        endpoint_id: str,
        api_key: Optional[str] = None,
        poll: Optional[PollPolicy] = None,
        transport: Optional[Transport] = None,
        log: Callable[[str], None] = lambda m: print(m, file=sys.stderr),
    ):
        if not endpoint_id:
            raise ValueError("endpoint_id is required")
        self.endpoint_id = endpoint_id
        self.poll = poll or PollPolicy()
        self.log = log
        if transport is not None:
            self.t = transport
        else:
            key = api_key or os.environ.get("RUNPOD_API_KEY")
            if not key:
                raise RunPodError(
                    "no RunPod key: set RUNPOD_API_KEY or pass api_key=. "
                    "Never write the key into a palace file."
                )
            self.t = Transport(api_key=key)

    # -- low level ---------------------------------------------------------

    def _url(self, suffix: str) -> str:
        return f"{API_ROOT}/{self.endpoint_id}/{suffix}"

    def health(self) -> dict:
        """Worker / queue counts. Cheap; good for a preflight readiness check."""
        return self.t.request("GET", self._url("health"))

    def submit(self, payload: dict) -> str:
        """POST /run (async). Returns the job id."""
        resp = self.t.request("POST", self._url("run"), {"input": payload})
        job_id = resp.get("id")
        if not job_id:
            raise RunPodError(f"/run returned no job id: {resp}")
        self.log(f"[runpod] submitted job {job_id} (status {resp.get('status')})")
        return job_id

    def status(self, job_id: str) -> dict:
        return self.t.request("GET", self._url(f"status/{job_id}"))

    def cancel(self, job_id: str) -> dict:
        return self.t.request("POST", self._url(f"cancel/{job_id}"))

    # -- high level --------------------------------------------------------

    def run(self, payload: dict) -> dict:
        """Submit, then poll to completion. Returns the job's `output` block.

        Raises RunPodError on a bad terminal state or on timeout (after a best
        effort cancel, so a runaway worker doesn't keep billing).
        """
        job_id = self.submit(payload)
        return self.wait(job_id)

    def wait(self, job_id: str) -> dict:
        p = self.poll
        deadline = time.monotonic() + p.total_timeout_seconds
        warned_cold = False
        interval = p.interval_seconds
        started = time.monotonic()

        while True:
            s = self.status(job_id)
            state = s.get("status", "UNKNOWN")

            if state in _TERMINAL_OK:
                self.log(f"[runpod] job {job_id} COMPLETED")
                return s.get("output", {})
            if state in _TERMINAL_BAD:
                raise RunPodError(
                    f"job {job_id} ended {state}: {s.get('error') or s}"
                )
            if state not in _PENDING:
                self.log(f"[runpod] job {job_id} unknown state {state!r}; still waiting")

            now = time.monotonic()
            if now > deadline:
                self.log(f"[runpod] job {job_id} timed out; cancelling")
                try:
                    self.cancel(job_id)
                except RunPodError:
                    pass
                raise RunPodError(
                    f"job {job_id} exceeded {p.total_timeout_seconds}s "
                    f"(last state {state})"
                )
            if (state == "IN_QUEUE" and not warned_cold
                    and now - started > p.cold_start_grace_seconds):
                warned_cold = True
                self.log(
                    f"[runpod] job {job_id} still IN_QUEUE after "
                    f"{int(now - started)}s — cold worker boot / model load is "
                    "normal on a scaled-to-zero endpoint; continuing to poll."
                )

            time.sleep(interval)
            interval = min(interval * 1.3, p.backoff_max_seconds)  # gentle backoff

    # -- output handling ---------------------------------------------------

    def save_outputs(self, output: dict, dest_dir: str) -> list[str]:
        """Persist whatever the worker returned into dest_dir.

        Handles the worker-comfyui shapes seen in the wild:
          - {"images": [{"filename": ..., "type": "base64", "data": "..."}]}
          - {"images": [{"filename": ..., "type": "s3_url", "data": "https://..."}]}
          - {"message": "..."} / arbitrary file lists under other keys.
        Returns the list of written file paths.
        """
        dest = Path(dest_dir)
        dest.mkdir(parents=True, exist_ok=True)
        written: list[str] = []

        items = []
        if isinstance(output, dict):
            for key in ("images", "files", "outputs", "meshes"):
                v = output.get(key)
                if isinstance(v, list):
                    items.extend(v)

        for i, item in enumerate(items):
            if not isinstance(item, dict):
                continue
            name = item.get("filename") or item.get("name") or f"output_{i}"
            kind = (item.get("type") or "").lower()
            data = item.get("data") or item.get("image") or item.get("url")
            if data is None:
                continue
            target = dest / name
            if kind in ("base64", "") and _looks_like_base64(data):
                target.write_bytes(base64.b64decode(data))
            elif kind in ("s3_url", "url") or str(data).startswith("http"):
                _download(str(data), target)
            else:
                # last resort: treat as base64
                try:
                    target.write_bytes(base64.b64decode(data))
                except Exception:
                    self.log(f"[runpod] could not decode output {name!r}; skipped")
                    continue
            written.append(str(target))
            self.log(f"[runpod] wrote {target}")

        if not written:
            # Some workers (esp. 3D) write meshes to the network volume / S3 and
            # only return a message. Surface that rather than silently succeeding.
            self.log(
                "[runpod] no inline file outputs found. If this is a 3D job, the "
                "mesh is likely on the network volume or S3 — see README "
                "'Retrieving meshes'. Raw output dumped to output.json."
            )
            (dest / "output.json").write_text(json.dumps(output, indent=2))
            written.append(str(dest / "output.json"))
        return written


# -- helpers ---------------------------------------------------------------

def _looks_like_base64(s: Any) -> bool:
    return isinstance(s, str) and not s.startswith("http") and len(s) > 64


def _download(url: str, target: Path) -> None:
    with urllib.request.urlopen(url, timeout=120) as r:
        target.write_bytes(r.read())


def encode_image(path: str) -> dict:
    """Build a worker-comfyui input image entry from a local file."""
    p = Path(path)
    return {
        "name": p.name,
        "image": base64.b64encode(p.read_bytes()).decode(),
    }


def load_workflow(path: str) -> dict:
    return json.loads(Path(path).read_text())


# -- mock transport (for --mock and unit tests) -----------------------------

def make_mock_transport(scenario: str = "image") -> Transport:
    """A fake transport that walks a job through IN_QUEUE -> IN_PROGRESS ->
    COMPLETED, returning a tiny base64 PNG so the full flow is exercised offline.
    """
    # 1x1 transparent PNG
    tiny_png = (
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
    )
    state = {"polls": 0}

    def handler(method: str, url: str, body: Optional[dict]) -> dict:
        if url.endswith("/health"):
            return {"workers": {"idle": 0, "ready": 0}, "jobs": {"inQueue": 0}}
        if url.endswith("/run"):
            state["polls"] = 0
            return {"id": "mock-job-001", "status": "IN_QUEUE"}
        if "/status/" in url:
            state["polls"] += 1
            if state["polls"] == 1:
                return {"status": "IN_QUEUE"}
            if state["polls"] == 2:
                return {"status": "IN_PROGRESS"}
            return {
                "status": "COMPLETED",
                "output": {
                    "images": [
                        {"filename": "mock_result.png", "type": "base64", "data": tiny_png}
                    ]
                },
            }
        if "/cancel/" in url:
            return {"status": "CANCELLED"}
        return {}

    t = Transport(api_key="MOCK")
    t._request = handler
    t.timeout = 1.0
    # mock should poll fast
    return t


# -- CLI --------------------------------------------------------------------

def _build_payload(args: argparse.Namespace) -> dict:
    payload: dict[str, Any] = {}
    if args.workflow:
        payload["workflow"] = load_workflow(args.workflow)
    if args.image:
        payload["images"] = [encode_image(p) for p in args.image]
    if args.input_json:
        payload.update(json.loads(Path(args.input_json).read_text()))
    return payload


def main(argv: Optional[list[str]] = None) -> int:
    ap = argparse.ArgumentParser(description="Dispatch a job to a RunPod serverless endpoint.")
    ap.add_argument("--endpoint", default=os.environ.get("RUNPOD_ENDPOINT_ID"),
                    help="RunPod endpoint id (or env RUNPOD_ENDPOINT_ID).")
    ap.add_argument("--workflow", help="Path to a ComfyUI API-format workflow JSON.")
    ap.add_argument("--image", action="append", default=[],
                    help="Input image file (repeatable) — e.g. the shared image-to-3D subject.")
    ap.add_argument("--input-json", help="Extra raw input fields merged into the payload.")
    ap.add_argument("--out", default="./runpod-out", help="Directory for outputs.")
    ap.add_argument("--timeout", type=float, default=900.0, help="Total poll timeout (s).")
    ap.add_argument("--health", action="store_true", help="Just print endpoint health and exit.")
    ap.add_argument("--mock", action="store_true",
                    help="Run against a fake transport (no key/endpoint needed).")
    args = ap.parse_args(argv)

    transport = make_mock_transport() if args.mock else None
    endpoint_id = args.endpoint or ("mock-endpoint" if args.mock else None)
    if not endpoint_id:
        ap.error("--endpoint (or RUNPOD_ENDPOINT_ID) is required unless --mock")

    ep = RunPodEndpoint(
        endpoint_id=endpoint_id,
        poll=PollPolicy(total_timeout_seconds=args.timeout,
                        interval_seconds=0.05 if args.mock else 3.0),
        transport=transport,
    )

    if args.health:
        print(json.dumps(ep.health(), indent=2))
        return 0

    payload = _build_payload(args)
    if not payload and not args.mock:
        ap.error("nothing to submit: pass --workflow and/or --input-json")
    if args.mock and not payload:
        payload = {"workflow": {"_mock": True}}

    try:
        output = ep.run(payload)
    except RunPodError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

    written = ep.save_outputs(output, args.out)
    print(json.dumps({"saved": written}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
