"""Render dormant + awakening at the SAME refined gorey-ink quality as the
greenlit triumphant frame (gorey-ink-triumphant-refined-openpose.png), per
Loudon's RENDER-SET grant on retrospective-delay-steward-039.

Triumphant already rendered & approved — skipped here unless --all is passed.
Each frame uses the per-state pose clause swapped into the refined style
prompt; rigs are the existing pose-{dormant,awakening,3}-openpose-rig.png.
"""
from __future__ import annotations

import importlib.util
import json
import shutil
import sys
import time
from pathlib import Path

BUNDLE = Path(__file__).parent
spec = importlib.util.spec_from_file_location("render_openpose", BUNDLE / "render-openpose.py")
ro = importlib.util.module_from_spec(spec); spec.loader.exec_module(ro)

STYLE_HEAD = (
    "Edward Gorey style pen and ink illustration, hand-drawn wobbly ink line "
    "with visible tremor and irregular weight, dense parallel crosshatching "
    "and stippled shading, varied stroke thickness from hair-fine to bold, "
    "scratchy nib texture, eerie Victorian gothic atmosphere, "
)
STYLE_TAIL = (
    ", séance ritual, candelabra and patterned wallpaper in background, "
    "sparse fussy Victorian interior, deliberate imperfect linework, "
    "black ink on warm cream paper, very high contrast, gothic whimsy, "
    "no color, monochrome, etching quality"
)
NEGATIVE = (
    "smooth digital line, vector clean, airbrush, soft gradient, photographic, "
    "anime, cel shading, flat color, blurry, watermark, text, deformed, "
    "low contrast, grey wash"
)

POSE_CLAUSES = {
    "dormant": (
        "a small black cat curled asleep on a worn velvet cushion, paws "
        "tucked beneath, eyes shut tight, whiskers drooping, no ectoplasm "
        "yet — only the faintest sleeping breath"
    ),
    "awakening": (
        "a small black cat sitting upright with one front paw lifted "
        "tentatively, ears perked, eyes opening wide with the first spark "
        "of starlight, thin wavering ectoplasm wisps just beginning to "
        "curl up from the floor"
    ),
    "triumphant-refined": (
        "a small black cat standing upright with both arms stretched wide "
        "overhead in a summoning pose, ectoplasm wisps rendered as fine "
        "wavering ink lines swirling around outstretched paws, tiny stars "
        "in wide round eyes"
    ),
}

RIGS = {
    "dormant": "pose-dormant-openpose-rig.png",
    "awakening": "pose-awakening-openpose-rig.png",
    "triumphant-refined": "pose-3-openpose-rig.png",
}


def render_one(state: str) -> dict:
    workflow = json.loads(ro.WORKFLOW.read_text())
    wf = {k: v for k, v in workflow.items() if not k.startswith("_")}

    rig = BUNDLE / RIGS[state]
    ro.COMFY_INPUT_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(rig, ro.COMFY_INPUT_DIR / rig.name)

    positive = STYLE_HEAD + POSE_CLAUSES[state] + STYLE_TAIL
    wf["10"]["inputs"]["image"] = rig.name
    wf["6"]["inputs"]["text"] = positive
    wf["7"]["inputs"]["text"] = NEGATIVE
    wf["9"]["inputs"]["filename_prefix"] = f"gorey-ink-{state}-refined-openpose"

    out_png = BUNDLE / f"gorey-ink-{state}-refined-openpose.png"
    out_report = BUNDLE / f"gorey-ink-{state}-refined-openpose.report.json"

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
            print(f"  …queued ({elapsed:.0f} s)"); continue
        status = entry.get("status", {})
        if status.get("status_str") == "error":
            raise RuntimeError(f"{state}: {json.dumps(status)}")
        if status.get("completed"):
            break
        print(f"  …running ({elapsed:.0f} s)")

    image_info = (entry["outputs"].get("9") or next(iter(entry["outputs"].values())))["images"][0]
    src = ro.COMFY_OUTPUT_DIR / image_info.get("subfolder", "") / image_info["filename"]
    shutil.copyfile(src, out_png)

    report = {
        "state": state,
        "rig_png": rig.name,
        "controlnet": wf["11"]["inputs"]["control_net_name"],
        "controlnet_strength": wf["12"]["inputs"]["strength"],
        "seed": wf["3"]["inputs"]["seed"],
        "steps": wf["3"]["inputs"]["steps"],
        "cfg": wf["3"]["inputs"]["cfg"],
        "sampler": f'{wf["3"]["inputs"]["sampler_name"]}/{wf["3"]["inputs"]["scheduler"]}',
        "style": "gorey-ink-refined",
        "prompt_final": positive,
        "negative_final": NEGATIVE,
        "render_time_sec": round(time.time() - started, 2),
        "output_png": out_png.name,
        "status": "ok",
    }
    out_report.write_text(json.dumps(report, indent=2) + "\n")
    print(f"saved → {out_png.name}  ({report['render_time_sec']} s)")
    return report


def main() -> int:
    if not ro.wait_for_server():
        return 1
    states = ["dormant", "awakening"]
    if "--all" in sys.argv:
        states.append("triumphant-refined")
    reports = [render_one(s) for s in states]
    (BUNDLE / "gorey-ink-refined-set.summary.json").write_text(
        json.dumps(reports, indent=2) + "\n"
    )
    print("\nALL DONE.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
