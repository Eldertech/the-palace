"""
Shop Header — ComfyUI render driver (Phase D of SHOP-BUILD-SESSION-2026-05-30).

Adapted from Kuramoto Round 1's `fireflies-pond-render.py`. Loads the
workflow JSON, queues it against a locally-running ComfyUI server, polls
to completion, and copies the rendered PNG into the bundle as
`shop-header-comfyui.png`. The workflow JSON itself is the
reproducibility artifact — re-runnable byte-identically given the same
checkpoint + seed + ComfyUI version.

Phase D was supposed to be a Midjourney↔ComfyUI Comparison Mode; Midjourney
access was unavailable this session per Loudon, so this is the ComfyUI half
only. The recommendation document (`shop-header — Maker's Comparison
Recommendation.md`) names the blocker honestly.

Prerequisites:
  - ComfyUI server running on 127.0.0.1:8188 (start via
    `cd _tools/ComfyUI && ./venv/bin/python main.py --port 8188`).
  - sd_xl_base_1.0.safetensors in _tools/ComfyUI/models/checkpoints/.
"""

from __future__ import annotations

import json
import shutil
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path


BUNDLE = Path(__file__).parent
PALACE = BUNDLE.parents[3]  # …/Shop/Maker/comparisons/<this>/ → palace root
WORKFLOW = BUNDLE / "shop-header-workflow.json"
OUT = BUNDLE / "shop-header-comfyui.png"
REPORT = BUNDLE / "shop-header.report.json"
COMFY_OUTPUT_DIR = PALACE / "_tools" / "ComfyUI" / "output"

COMFY_HOST = "http://127.0.0.1:8188"
POLL_INTERVAL_SEC = 3.0
TIMEOUT_SEC = 600  # 10 minutes — SDXL on Mac MPS is slow


def post_prompt(workflow: dict) -> str:
    body = json.dumps({"prompt": workflow}).encode("utf-8")
    req = urllib.request.Request(
        f"{COMFY_HOST}/prompt", data=body,
        headers={"Content-Type": "application/json"}, method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())["prompt_id"]


def poll_history(prompt_id: str) -> dict | None:
    with urllib.request.urlopen(
        f"{COMFY_HOST}/history/{urllib.parse.quote(prompt_id)}", timeout=10,
    ) as resp:
        data = json.loads(resp.read())
        return data.get(prompt_id)


def main() -> int:
    workflow = json.loads(WORKFLOW.read_text())
    workflow_for_api = {k: v for k, v in workflow.items() if not k.startswith("_")}

    print(f"queueing workflow against {COMFY_HOST} …")
    started = time.time()
    prompt_id = post_prompt(workflow_for_api)
    print(f"prompt_id={prompt_id}")

    while True:
        time.sleep(POLL_INTERVAL_SEC)
        elapsed = time.time() - started
        if elapsed > TIMEOUT_SEC:
            print("timed out", file=sys.stderr)
            return 1
        entry = poll_history(prompt_id)
        if entry is None:
            print(f"  …queued ({elapsed:.0f} s)")
            continue
        status = entry.get("status", {})
        if status.get("completed"):
            break
        if status.get("status_str") == "error":
            print("ComfyUI reported an error:", status)
            return 1
        print(f"  …running ({elapsed:.0f} s)")

    # Find the SaveImage output node (we named it node "9").
    outputs = entry["outputs"]
    save_node = outputs.get("9") or next(iter(outputs.values()))
    image_info = save_node["images"][0]
    src = COMFY_OUTPUT_DIR / image_info["subfolder"] / image_info["filename"]
    shutil.copyfile(src, OUT)

    render_time = time.time() - started
    report = {
        "duration_sec": round(render_time, 2),
        "checkpoint": "sd_xl_base_1.0.safetensors",
        "seed": workflow["3"]["inputs"]["seed"],
        "steps": workflow["3"]["inputs"]["steps"],
        "cfg": workflow["3"]["inputs"]["cfg"],
        "sampler": workflow["3"]["inputs"]["sampler_name"],
        "scheduler": workflow["3"]["inputs"]["scheduler"],
        "width": workflow["5"]["inputs"]["width"],
        "height": workflow["5"]["inputs"]["height"],
        "positive_prompt": workflow["6"]["inputs"]["text"],
        "negative_prompt": workflow["7"]["inputs"]["text"],
        "comfy_filename": image_info["filename"],
        "tier_used": "sketch",
        "midjourney_counterpart": "BLOCKED — no access this session",
        "status": "ok",
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: v for k, v in report.items() if k != "positive_prompt" and k != "negative_prompt"}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
