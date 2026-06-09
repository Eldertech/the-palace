"""
Séance Cat Probe — ComfyUI render driver (Retrospective Delay, Stage 4 character).

Queues the Gorey-Ink Pose-3 workflow against a locally-running ComfyUI
server, waits out the cold checkpoint load, polls to completion, copies the
PNG into this probe folder, and writes the report JSON the dispatch sheet
specifies. With --cyberpunk it fires the alternate style lock in the SAME
warm session (the dispatch sheet's "optional second run, time allowing").

This is the render.py the dispatch sheet (section 4) promised. It adapts the
proven fireflies-pond-render.py polling pattern and adds two things that
matter for an unattended cold start:
  1. wait_for_server() rides out the 90-120 s MPS checkpoint load instead of
     letting the first POST fail against a not-yet-ready server;
  2. --cyberpunk swaps the two CLIPTextEncode prompt strings in memory so the
     same script renders both style locks without editing the workflow file.

Run from the palace root (or anywhere — paths are resolved from this file):

    cd "/Users/loudonstearns/Documents/The Palace/_tools/ComfyUI"
    source venv/bin/activate
    python main.py --listen 127.0.0.1 --port 8188        # in one terminal

    python "Projects/Retrospective Delay/stage-4-character/probe-2026-06-07/render.py"
    python "Projects/Retrospective Delay/stage-4-character/probe-2026-06-07/render.py" --cyberpunk

Prerequisites (per dispatch.md):
  - ComfyUI at _tools/ComfyUI/ with its venv populated.
  - sd_xl_base_1.0.safetensors in _tools/ComfyUI/models/checkpoints/.
  - The server running on 127.0.0.1:8188.
No ControlNet, no IP-Adapter, no custom nodes — pure txt2img SDXL base.
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BUNDLE = Path(__file__).parent
WORKFLOW = BUNDLE / "gorey-ink-pose-3-probe.workflow.json"
PALACE_ROOT = BUNDLE.parents[3]  # probe-… / stage-4-character / Retrospective Delay / Projects / <root>
COMFY_OUTPUT_DIR = PALACE_ROOT / "_tools" / "ComfyUI" / "output"

COMFY_HOST = "http://127.0.0.1:8188"
POLL_INTERVAL_SEC = 2.0
RENDER_TIMEOUT_SEC = 600      # 10 min — SDXL on Mac MPS is slow
SERVER_WAIT_SEC = 180         # ride out the 90-120 s cold checkpoint load

# --cyberpunk swaps these into CLIPTextEncode nodes 6 (positive) / 7 (negative).
# Verbatim from dispatch.md section 3 so the two scripts and the sheet agree.
CYBERPUNK_POSITIVE = (
    "cyberpunk séance cat, dark synth atmosphere, small upright cat with arms "
    "stretched wide overhead in summoning pose, neon rim lighting in magenta and "
    "electric blue, ectoplasm rendered as glowing neon plasma wisps, stars and "
    "circuit-trace patterns in wide glowing eyes, dark background, high contrast, "
    "neon-on-black, detailed fur with subsurface neon glow, cinematic mood, "
    "digital painting style"
)
CYBERPUNK_NEGATIVE = (
    "daylight, bright colors, pastel, watercolor, ink, sketch, cartoon, flat, "
    "low contrast, blurry, watermark, text, deformed"
)


def wait_for_server(deadline_sec: float = SERVER_WAIT_SEC) -> bool:
    """Poll /system_stats until the server answers (covers the cold MPS load)."""
    started = time.time()
    while time.time() - started < deadline_sec:
        try:
            with urllib.request.urlopen(f"{COMFY_HOST}/system_stats", timeout=5) as resp:
                stats = json.loads(resp.read())
                dev = "?"
                for d in stats.get("devices", []):
                    dev = d.get("type", d.get("name", "?"))
                print(f"server ready ({time.time() - started:.0f} s) · device={dev}")
                return True
        except (urllib.error.URLError, OSError, json.JSONDecodeError):
            print(f"  …waiting for server ({time.time() - started:.0f} s)")
            time.sleep(POLL_INTERVAL_SEC)
    print(
        "server never answered — is ComfyUI running on 127.0.0.1:8188? "
        "See dispatch.md section 1.",
        file=sys.stderr,
    )
    return False


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
        return json.loads(resp.read()).get(prompt_id)


def main() -> int:
    parser = argparse.ArgumentParser(description="Render the séance-cat probe.")
    parser.add_argument(
        "--cyberpunk", action="store_true",
        help="swap in the cyberpunk style lock instead of Gorey-ink.",
    )
    args = parser.parse_args()
    style = "cyberpunk" if args.cyberpunk else "gorey-ink"

    workflow = json.loads(WORKFLOW.read_text())
    workflow_for_api = {k: v for k, v in workflow.items() if not k.startswith("_")}

    if args.cyberpunk:
        workflow_for_api["6"]["inputs"]["text"] = CYBERPUNK_POSITIVE
        workflow_for_api["7"]["inputs"]["text"] = CYBERPUNK_NEGATIVE
        workflow_for_api["9"]["inputs"]["filename_prefix"] = "cyberpunk-pose-3-probe"

    out_png = BUNDLE / f"{style}-pose-3-probe.png"
    out_report = BUNDLE / f"{style}-pose-3-probe.report.json"

    if not wait_for_server():
        return 1

    print(f"queueing {style} workflow against {COMFY_HOST} …")
    started = time.time()
    prompt_id = post_prompt(workflow_for_api)
    print(f"prompt_id={prompt_id}")

    while True:
        time.sleep(POLL_INTERVAL_SEC)
        elapsed = time.time() - started
        if elapsed > RENDER_TIMEOUT_SEC:
            print("render timed out", file=sys.stderr)
            return 1
        entry = poll_history(prompt_id)
        if entry is None:
            print(f"  …queued ({elapsed:.0f} s)")
            continue
        status = entry.get("status", {})
        if status.get("status_str") == "error":
            print("ComfyUI reported an error:", json.dumps(status, indent=2), file=sys.stderr)
            return 1
        if status.get("completed"):
            break
        print(f"  …running ({elapsed:.0f} s)")

    outputs = entry["outputs"]
    save_node = outputs.get("9") or next(iter(outputs.values()))
    image_info = save_node["images"][0]
    src = COMFY_OUTPUT_DIR / image_info.get("subfolder", "") / image_info["filename"]
    shutil.copyfile(src, out_png)

    render_time = time.time() - started
    report = {
        "dimensions": f'{workflow_for_api["5"]["inputs"]["width"]}x{workflow_for_api["5"]["inputs"]["height"]}',
        "model_used": workflow_for_api["4"]["inputs"]["ckpt_name"],
        "seed": workflow_for_api["3"]["inputs"]["seed"],
        "steps": workflow_for_api["3"]["inputs"]["steps"],
        "cfg": workflow_for_api["3"]["inputs"]["cfg"],
        "sampler": f'{workflow_for_api["3"]["inputs"]["sampler_name"]}/{workflow_for_api["3"]["inputs"]["scheduler"]}',
        "tier_used": "Sketch",
        "style": style,
        "prompt_final": workflow_for_api["6"]["inputs"]["text"],
        "render_time_sec": round(render_time, 2),
        "comfy_filename": image_info["filename"],
        "output_png": out_png.name,
        "gotchas_hit": [],
        "status": "ok",
        "notes": "",
    }
    out_report.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    print(f"\nSaved → {out_png}")
    print("Inspect against dispatch.md section 8 (does it read as the style? is the cat legible? ectoplasm present?).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
