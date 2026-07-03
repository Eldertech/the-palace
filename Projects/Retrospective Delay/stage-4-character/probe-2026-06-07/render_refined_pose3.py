"""Render the pose-3 (triumphant) frame with the REFINED gorey-ink prompt
— wobble, denser hatching, ink-weight variation — per Loudon's REFINE-INK
greenlight on retrospective-delay-steward-035.

Single pose, single audition. If it reads, next cycle commits the batch
of three (dormant / awakening / triumphant) with the same refined prompt.
"""
from __future__ import annotations

import importlib.util
import json
import shutil
import time
from pathlib import Path

BUNDLE = Path(__file__).parent
spec = importlib.util.spec_from_file_location("render_openpose", BUNDLE / "render-openpose.py")
ro = importlib.util.module_from_spec(spec); spec.loader.exec_module(ro)

REFINED_POSITIVE = (
    "Edward Gorey style pen and ink illustration, hand-drawn wobbly ink line "
    "with visible tremor and irregular weight, dense parallel crosshatching "
    "and stippled shading, varied stroke thickness from hair-fine to bold, "
    "scratchy nib texture, eerie Victorian gothic atmosphere, a small black "
    "cat standing upright with both arms stretched wide overhead in a "
    "summoning pose, ectoplasm wisps rendered as fine wavering ink lines "
    "swirling around outstretched paws, tiny stars in wide round eyes, "
    "séance ritual, candelabra and patterned wallpaper in background, "
    "sparse fussy Victorian interior, deliberate imperfect linework, "
    "black ink on warm cream paper, very high contrast, gothic whimsy, "
    "no color, monochrome, etching quality"
)
REFINED_NEGATIVE = (
    "smooth digital line, vector clean, airbrush, soft gradient, photographic, "
    "anime, cel shading, flat color, blurry, watermark, text, deformed, "
    "low contrast, grey wash"
)

RIG = BUNDLE / "pose-3-openpose-rig.png"
STATE = "triumphant-refined"


def main() -> int:
    workflow = json.loads(ro.WORKFLOW.read_text())
    wf = {k: v for k, v in workflow.items() if not k.startswith("_")}

    ro.COMFY_INPUT_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(RIG, ro.COMFY_INPUT_DIR / RIG.name)
    wf["10"]["inputs"]["image"] = RIG.name
    wf["6"]["inputs"]["text"] = REFINED_POSITIVE
    wf["7"]["inputs"]["text"] = REFINED_NEGATIVE
    wf["9"]["inputs"]["filename_prefix"] = f"gorey-ink-{STATE}-openpose"

    out_png = BUNDLE / f"gorey-ink-{STATE}-openpose.png"
    out_report = BUNDLE / f"gorey-ink-{STATE}-openpose.report.json"

    if not ro.wait_for_server():
        return 1

    print(f"queueing refined gorey-ink pose-3 …")
    started = time.time()
    prompt_id = ro.post_prompt(wf)
    print(f"prompt_id={prompt_id}")

    while True:
        time.sleep(ro.POLL_INTERVAL_SEC)
        elapsed = time.time() - started
        if elapsed > ro.RENDER_TIMEOUT_SEC:
            print("timed out"); return 1
        entry = ro.poll_history(prompt_id)
        if entry is None:
            print(f"  …queued ({elapsed:.0f} s)"); continue
        status = entry.get("status", {})
        if status.get("status_str") == "error":
            print("ComfyUI error:", json.dumps(status, indent=2)); return 1
        if status.get("completed"):
            break
        print(f"  …running ({elapsed:.0f} s)")

    image_info = (entry["outputs"].get("9") or next(iter(entry["outputs"].values())))["images"][0]
    src = ro.COMFY_OUTPUT_DIR / image_info.get("subfolder", "") / image_info["filename"]
    shutil.copyfile(src, out_png)

    report = {
        "state": STATE,
        "rig_png": RIG.name,
        "controlnet": wf["11"]["inputs"]["control_net_name"],
        "controlnet_strength": wf["12"]["inputs"]["strength"],
        "seed": wf["3"]["inputs"]["seed"],
        "steps": wf["3"]["inputs"]["steps"],
        "cfg": wf["3"]["inputs"]["cfg"],
        "sampler": f'{wf["3"]["inputs"]["sampler_name"]}/{wf["3"]["inputs"]["scheduler"]}',
        "style": "gorey-ink-refined",
        "prompt_final": REFINED_POSITIVE,
        "negative_final": REFINED_NEGATIVE,
        "render_time_sec": round(time.time() - started, 2),
        "output_png": out_png.name,
        "status": "ok",
        "refinement_axis": "wobble + hatching density + ink-weight variation",
    }
    out_report.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
