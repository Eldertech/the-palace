"""
Shop Header — FLUX (Hugging Face) render driver.

Phase D-2: Midjourney is too expensive; FLUX replaces it as the Shop's
cloud-aesthetic counterpart. Uses the Hugging Face Inference API via
huggingface_hub.InferenceClient against black-forest-labs/FLUX.1-Krea-dev
(the photorealistic-tuned FLUX variant).

Same brief, same prompt, same seed, same dimensions as render.py — the
honest-comparison rule requires the brief be byte-identical so the two
outputs are *legible as the same thing*.

Prerequisites:
  - HF token cached at ~/.cache/huggingface/token (set via `huggingface-cli login`)
  - kokoro venv (which has huggingface_hub installed)
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

from huggingface_hub import InferenceClient


BUNDLE = Path(__file__).parent
OUT = BUNDLE / "shop-header-flux.png"
REPORT = BUNDLE / "shop-header-flux.report.json"

# Same brief as the ComfyUI render. Note: FLUX.1-Krea-dev has no separate
# negative-prompt field, so the "no people" guard is folded into the
# positive prompt (the ComfyUI run used a negative prompt for the same).
PROMPT = (
    "a master printmaker's workshop seen from a slightly elevated angle "
    "at dusk, ordered work surfaces and presses arrayed in disciplined "
    "geometry, warm amber light pouring through tall industrial windows, "
    "dust motes catching the light, dark exposed timber beams, deep "
    "shadows in the corners, painterly cinematic atmosphere, oil "
    "painting quality, no people, mood of focused craft and quiet "
    "discipline, restrained palette of warm amber and deep near-black "
    "indigo"
)
MODEL = "black-forest-labs/FLUX.1-Krea-dev"
SEED = 30
WIDTH = 1536
HEIGHT = 640
GUIDANCE = 4.5
STEPS = 24


def main() -> int:
    client = InferenceClient(model=MODEL)
    print(f"calling {MODEL} (seed={SEED}, {WIDTH}x{HEIGHT}, guidance={GUIDANCE}, steps={STEPS}) …")
    started = time.time()
    try:
        image = client.text_to_image(
            prompt=PROMPT,
            seed=SEED,
            width=WIDTH,
            height=HEIGHT,
            guidance_scale=GUIDANCE,
            num_inference_steps=STEPS,
        )
    except Exception as e:
        print(f"[FAIL] {type(e).__name__}: {e}", file=sys.stderr)
        return 1
    elapsed = time.time() - started
    image.save(OUT)
    size = OUT.stat().st_size
    report = {
        "specialist": "FLUX (Hugging Face)",
        "model": MODEL,
        "duration_sec": round(elapsed, 2),
        "seed": SEED,
        "width": WIDTH,
        "height": HEIGHT,
        "guidance_scale": GUIDANCE,
        "num_inference_steps": STEPS,
        "prompt": PROMPT,
        "output_bytes": size,
        "tier_used": "sketch",
        "comparison_counterpart": "Shop/Maker/comparisons/2026-05-30-shop-header/shop-header-comfyui.png",
        "midjourney_replaced_by": MODEL,
        "status": "ok",
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: v for k, v in report.items() if k != "prompt"}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
