"""Render the 3-state séance-cat sheet (dormant / awakening / triumphant)
in gorey-ink style using the openpose ControlNet workflow.

Reuses render-openpose.py machinery via subprocess-style import: we
patch RIG_PNG + output filenames per pose and call main()-like logic.
"""
from __future__ import annotations

import importlib.util
import json
import shutil
import sys
import time
import urllib.request
from pathlib import Path

BUNDLE = Path(__file__).parent

# Load render-openpose.py as a module (hyphen in name → import via spec).
spec = importlib.util.spec_from_file_location(
    "render_openpose", BUNDLE / "render-openpose.py",
)
ro = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ro)

POSES = [
    ("dormant", BUNDLE / "pose-dormant-openpose-rig.png"),
    ("awakening", BUNDLE / "pose-awakening-openpose-rig.png"),
    ("triumphant", BUNDLE / "pose-3-openpose-rig.png"),
]


def render_one(state: str, rig: Path) -> dict:
    workflow = json.loads(ro.WORKFLOW.read_text())
    wf = {k: v for k, v in workflow.items() if not k.startswith("_")}

    # Copy rig into ComfyUI input/ and point LoadImage at it.
    ro.COMFY_INPUT_DIR.mkdir(parents=True, exist_ok=True)
    dst = ro.COMFY_INPUT_DIR / rig.name
    shutil.copyfile(rig, dst)
    # LoadImage node 10 — set its image to this rig's filename.
    wf["10"]["inputs"]["image"] = rig.name
    wf["9"]["inputs"]["filename_prefix"] = f"gorey-ink-{state}-openpose"

    out_png = BUNDLE / f"gorey-ink-{state}-openpose.png"
    out_report = BUNDLE / f"gorey-ink-{state}-openpose.report.json"

    print(f"\n=== {state} → {rig.name} ===")
    started = time.time()
    prompt_id = ro.post_prompt(wf)
    print(f"prompt_id={prompt_id}")

    while True:
        time.sleep(ro.POLL_INTERVAL_SEC)
        elapsed = time.time() - started
        if elapsed > ro.RENDER_TIMEOUT_SEC:
            raise RuntimeError(f"{state} timed out")
        entry = ro.poll_history(prompt_id)
        if entry is None:
            print(f"  …queued ({elapsed:.0f} s)")
            continue
        status = entry.get("status", {})
        if status.get("status_str") == "error":
            raise RuntimeError(f"{state}: {json.dumps(status)}")
        if status.get("completed"):
            break
        print(f"  …running ({elapsed:.0f} s)")

    outputs = entry["outputs"]
    save_node = outputs.get("9") or next(iter(outputs.values()))
    image_info = save_node["images"][0]
    src = ro.COMFY_OUTPUT_DIR / image_info.get("subfolder", "") / image_info["filename"]
    shutil.copyfile(src, out_png)

    render_time = time.time() - started
    report = {
        "state": state,
        "rig_png": rig.name,
        "dimensions": f'{wf["5"]["inputs"]["width"]}x{wf["5"]["inputs"]["height"]}',
        "model_used": wf["4"]["inputs"]["ckpt_name"],
        "controlnet": wf["11"]["inputs"]["control_net_name"],
        "controlnet_strength": wf["12"]["inputs"]["strength"],
        "seed": wf["3"]["inputs"]["seed"],
        "steps": wf["3"]["inputs"]["steps"],
        "cfg": wf["3"]["inputs"]["cfg"],
        "sampler": f'{wf["3"]["inputs"]["sampler_name"]}/{wf["3"]["inputs"]["scheduler"]}',
        "style": "gorey-ink",
        "prompt_final": wf["6"]["inputs"]["text"],
        "render_time_sec": round(render_time, 2),
        "output_png": out_png.name,
        "status": "ok",
    }
    out_report.write_text(json.dumps(report, indent=2) + "\n")
    print(f"saved → {out_png.name}  ({render_time:.1f} s)")
    return report


def main() -> int:
    if not ro.wait_for_server():
        return 1
    reports = []
    for state, rig in POSES:
        reports.append(render_one(state, rig))
    summary = BUNDLE / "gorey-ink-3state-openpose.summary.json"
    summary.write_text(json.dumps(reports, indent=2) + "\n")
    print(f"\nALL DONE. Summary → {summary.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
