"""
Séance Cat Probe — ComfyUI render driver WITH OpenPose ControlNet.

Adapts render.py to the openpose-pose-3.workflow.json which inserts a
ControlNet (LoadImage → ControlNetLoader → ControlNetApply, nodes 10/11/12).
Copies the rig PNG into ComfyUI's input/ before queueing so LoadImage finds
it. Runs Gorey-Ink first; --cyberpunk swaps prompts and the filename prefix.

    python "Projects/Retrospective Delay/stage-4-character/probe-2026-06-07/render-openpose.py"
    python "Projects/Retrospective Delay/stage-4-character/probe-2026-06-07/render-openpose.py" --cyberpunk
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
WORKFLOW = BUNDLE / "openpose-pose-3.workflow.json"
RIG_PNG = BUNDLE / "pose-3-openpose-rig.png"
PALACE_ROOT = BUNDLE.parents[3]
COMFY_OUTPUT_DIR = PALACE_ROOT / "_tools" / "ComfyUI" / "output"
COMFY_INPUT_DIR = PALACE_ROOT / "_tools" / "ComfyUI" / "input"

COMFY_HOST = "http://127.0.0.1:8188"
POLL_INTERVAL_SEC = 2.0
RENDER_TIMEOUT_SEC = 600
SERVER_WAIT_SEC = 180

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
    print("server never answered.", file=sys.stderr)
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


def ensure_rig_in_input() -> None:
    COMFY_INPUT_DIR.mkdir(parents=True, exist_ok=True)
    dst = COMFY_INPUT_DIR / RIG_PNG.name
    shutil.copyfile(RIG_PNG, dst)
    print(f"rig PNG → {dst}")


def main() -> int:
    parser = argparse.ArgumentParser(description="OpenPose-conditioned séance cat probe.")
    parser.add_argument("--cyberpunk", action="store_true",
                        help="swap in the cyberpunk style lock.")
    args = parser.parse_args()
    style = "cyberpunk" if args.cyberpunk else "gorey-ink"

    workflow = json.loads(WORKFLOW.read_text())
    workflow_for_api = {k: v for k, v in workflow.items() if not k.startswith("_")}

    if args.cyberpunk:
        workflow_for_api["6"]["inputs"]["text"] = CYBERPUNK_POSITIVE
        workflow_for_api["7"]["inputs"]["text"] = CYBERPUNK_NEGATIVE
        workflow_for_api["9"]["inputs"]["filename_prefix"] = "cyberpunk-pose-3-openpose"

    out_png = BUNDLE / f"{style}-pose-3-openpose.png"
    out_report = BUNDLE / f"{style}-pose-3-openpose.report.json"

    ensure_rig_in_input()
    if not wait_for_server():
        return 1

    print(f"queueing {style} openpose workflow …")
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
        "controlnet": workflow_for_api["11"]["inputs"]["control_net_name"],
        "controlnet_strength": workflow_for_api["12"]["inputs"]["strength"],
        "rig_png": RIG_PNG.name,
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
        "status": "ok",
    }
    out_report.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    print(f"\nSaved → {out_png}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
