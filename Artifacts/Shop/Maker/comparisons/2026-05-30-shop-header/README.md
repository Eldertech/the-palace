# Shop Header — Phase D bundle (half-comparison)

**Phase D of [`SHOP-BUILD-SESSION-2026-05-30.md`](../../../SHOP-BUILD-SESSION-2026-05-30.md).** This is the *unfinished* Midjourney↔ComfyUI Comparison — ComfyUI half ran (locally on Mac MPS), Midjourney half did not (access unavailable this session, per the 2026-05-30 brief intake). The handoff explicitly anticipated this fallback and instructed *don't fake the comparison*.

## Re-run the ComfyUI half

```sh
# 1. Start ComfyUI (port 8188) — Mac-only, needs the venv at _tools/ComfyUI/venv/
cd _tools/ComfyUI && ./venv/bin/python main.py --port 8188
# 2. In another shell, run the driver against the workflow JSON
python3 "Artifacts/Shop/Maker/comparisons/2026-05-30-shop-header/render.py"
```

Output lands at `shop-header-comfyui.png`; standards JSON at `shop-header.report.json`.

## Picking up the deferred half

When Midjourney access is available, the brief + the existing artifact + the recommendation document are the half-built reproducibility package. The same prompt (in `shop-header-workflow.json` node `"6"`, `inputs.text`) is meant to be re-used verbatim on Midjourney. Bring the Midjourney output back into this bundle as `shop-header-midjourney.png` + a `shop-header-midjourney.report.json` (capture the Midjourney prompt, version flags, job ID, credit cost). Then finish [[shop-header — Maker's Comparison Recommendation]] by deleting the *"missing half"* section and writing the real recommendation with both results in hand.

## Bundle contents

| file                                          | what                                                              |
|-----------------------------------------------|-------------------------------------------------------------------|
| `shop-header-workflow.json`                   | ComfyUI workflow (SDXL base, seed 30, 30 steps, CFG 7.0, 1536×640) |
| `render.py`                                   | driver — queues the workflow, polls, copies the PNG into the bundle |
| `shop-header-comfyui.png`                     | the rendered Sketch-tier header (~360 KB)                          |
| `shop-header.report.json`                     | standards JSON — all generation params + Midjourney-counterpart blocker note |
| `shop-header — Maker's Comparison Recommendation.md` | the half-comparison recommendation document, in the shape of [[Flocking — Maker's Comparison Recommendation]] |
| `README.md`                                   | this file                                                          |

## Honest findings

1. **ComfyUI 1536×640 SDXL render took 114 s on Mac MPS** (seed 30, 30 steps, CFG 7.0, euler/normal). That's the cost of a Sketch-tier banner-aspect generation; budget accordingly.
2. **A half-comparison is still worth running.** The recommendation document names *what the missing half would have told us*, which converts a quiet "we never got to it" into a named, dated, scoped piece of deferred work with a reproducibility package already half-built. Different shape of "unfinished" than the prior Round-1 dangling task.
3. **The Selection Heuristic about Midjourney vs. ComfyUI stays unrevised** — a heuristic about *defaults* requires evidence from both candidates. The Phase D recommendation explicitly *does not* update the Maker's "Default to ComfyUI when in doubt" line on the basis of single-vendor evidence.
