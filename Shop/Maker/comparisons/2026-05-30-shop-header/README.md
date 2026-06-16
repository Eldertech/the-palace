# Shop Header — Phase D bundle (closed loop: ComfyUI ↔ FLUX-Krea)

**Phase D of [`SHOP-BUILD-SESSION-2026-05-30.md`](../../../SHOP-BUILD-SESSION-2026-05-30.md), completed as Phase D-2.** Originally this was *meant* to be a Midjourney↔ComfyUI Comparison; Midjourney access was unavailable, and then Loudon flagged the subscription as too expensive. **FLUX-Krea via Hugging Face Inference replaced Midjourney in the Shop**, and the half-comparison became a real two-sided Comparison the same session — closing the Round-1 dangling task properly.

## Re-run either half

```sh
# Local SDXL via ComfyUI (~114 s on Mac MPS):
cd _tools/ComfyUI && ./venv/bin/python main.py --port 8188  # in one shell
python3 "Artifacts/Shop/Maker/comparisons/2026-05-30-shop-header/render.py"

# Cloud FLUX-Krea via HF Inference (~3 s; needs ~/.cache/huggingface/token):
"/Users/loudonstearns/Documents/The Palace/.venvs/kokoro/bin/python" \
  "Artifacts/Shop/Maker/comparisons/2026-05-30-shop-header/render_flux.py"
```

## Bundle contents

| file                                          | what                                                              |
|-----------------------------------------------|-------------------------------------------------------------------|
| `shop-header-workflow.json`                   | ComfyUI workflow (SDXL base, seed 30, 30 steps, CFG 7.0, 1536×640) |
| `render.py`                                   | ComfyUI driver — queues the workflow, polls, copies the PNG       |
| `render_flux.py`                              | FLUX-Krea driver — direct `InferenceClient.text_to_image` call    |
| `shop-header-comfyui.png`                     | the ComfyUI Sketch (~360 KB) — even afternoon light, generic mood  |
| `shop-header-flux.png`                        | the FLUX-Krea Sketch (~573 KB) — dusk, light shafts, dust motes — *on brief* |
| `shop-header.report.json`                     | ComfyUI standards JSON                                            |
| `shop-header-flux.report.json`                | FLUX-Krea standards JSON                                           |
| `shop-header — Maker's Comparison Recommendation.md` | the closed-loop recommendation; revises the Mood/atmospheric Selection Heuristic |
| `README.md`                                   | this file                                                          |

## Honest findings

1. **FLUX-Krea is ~40× faster than local SDXL** at the same dimensions (2.8 s vs 114 s) **and free** on the HF Inference tier. The cost premise that made local-first the reflex default is gone.
2. **FLUX-Krea reads mood-specific prompt details that SDXL flattens.** Same brief, same prompt, same seed — the dusk, the amber light pouring, the dust motes catching the light, the painterly cinematic atmosphere are visibly in the FLUX output and visibly absent from ComfyUI's.
3. **The Selection Heuristic was revised** as a result. "Default to ComfyUI when in doubt — local-first" is retired; the default is now brief-shape-dependent (FLUX-Krea for mood/atmospheric; ComfyUI for palette/seed/ControlNet/offline).
4. **A half-comparison turned out to be generative, not stalled.** The Phase D-1 document's "missing half — what comparison would have told us" section made Midjourney's gap *legible as missing*, which put Loudon in a position to flag its cost and propose FLUX the next moment. A defined-gap is what makes substitution decisions tractable.
