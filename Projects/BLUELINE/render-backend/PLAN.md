# Animatic → Render Pipeline

A two-tier ComfyUI pipeline for turning authored storyboard control into a consistent
animatic (cheap, fast) and then re-rendering the approved boards at high fidelity
(expensive, slow). Built to run on RunPod and be driven from Cowork.

The governing idea: **the board record is the source of truth, not the pixels.**
Each board is a small record — control images + identity reference + descriptor + seed.
SDXL and FLUX are two *renderers* that read the same record at two fidelity tiers.
You never "convert" SDXL output into FLUX; you re-render the record. The locked axes
(angle, character, setting, emotion) live on conditioning wires, not in the prompt text,
which is why they survive both the per-shot variation and the base swap.

| tier | base | job | GPU | when |
|------|------|-----|-----|------|
| **Study** | SDXL | make every decision: timing, blocking, angle, emotion, the cut | RTX 3090/4090 (24 GB), ~$0.40/hr | iterate freely |
| **Piece** | FLUX | execute approved boards at fidelity | A6000/A100, or quantized FLUX on 24 GB | once, batched |

By the time a board leaves the Study tier it has no creative choices left in it. The
Piece tier is pure execution, so it is the only stage you pay FLUX prices for.

---

## Repository layout

```
animatic-pipeline/
  PLAN.md                 ← this file
  board_template.txt      ← the data: BIBLE + one record per board (both tiers)
  runner.py               ← batch runner: parse template → patch workflow → queue → download
  graph_spec.md           ← build sheets for both ComfyUI graphs + the node-title contract
  models_manifest.md      ← exact models + paths + download commands for the network volume
  requirements.txt        ← python deps for the runner (just `requests`)
  graphs/
    sdxl_study.api.json    ← (you export this from ComfyUI: Save (API Format))
    flux_piece.api.json    ← (you export this from ComfyUI: Save (API Format))
  assets/                 ← pose skeletons, depth maps, character sheets (the base-agnostic inputs)
    poses/ depth/ refs/
  out/
    study/ piece/         ← rendered boards land here, named by SHOT_ID
```

## The node-title contract (the integration glue)

The runner does **not** hardcode node IDs — those change every time you re-export.
Instead it finds nodes by their `_meta.title`, which ComfyUI preserves in the API JSON.
In ComfyUI, set the **Title** (right-click → Title) of these nodes in *both* graphs:

| title | node | runner patches |
|-------|------|----------------|
| `POSITIVE` | positive CLIPTextEncode | `inputs.text` ← board POSITIVE |
| `NEG`      | negative CLIPTextEncode | `inputs.text` ← BIBLE GLOBAL_NEG (skipped if absent) |
| `POSE`     | LoadImage → pose ControlNet | `inputs.image` ← uploaded pose PNG |
| `DEPTH`    | LoadImage → depth ControlNet | `inputs.image` ← uploaded depth PNG |
| `IDREF`    | LoadImage → FaceID / PuLID | `inputs.image` ← uploaded character ref |
| `SAMPLER`  | KSampler (study) / seed-bearing node (piece) | `inputs.seed` or `inputs.noise_seed` |
| `SAVE`     | SaveImage | `inputs.filename_prefix` ← SHOT_ID |

Any titled node the board doesn't supply data for is left untouched, so the same runner
drives both tiers. ControlNet strengths and guidance windows are **locked in the graph**,
not set per board — that is the whole point of putting the axes on wires.

---

## RunPod setup (once)

1. Deploy a one-click **ComfyUI** template on an RTX 3090 or 4090, **Secure Cloud**, with a
   **network volume** (≈40 GB for Study only; ≈110 GB if both tiers live on one volume).
   Everything under `/workspace` persists; models download once.
2. Expose HTTP port **8188**. Your endpoint is `https://<podId>-8188.proxy.runpod.net`.
3. Install custom nodes via ComfyUI Manager (see `models_manifest.md` for the list) and
   download models to the volume. They persist across pod restarts.
4. In Cowork, set the endpoint:
   ```bash
   export COMFY_URL="https://<podId>-8188.proxy.runpod.net"
   pip install -r requirements.txt
   ```
5. Sanity check: `python runner.py --ping`

> Cost-shape: keep the Study volume on a cheap card for all iteration. Only spin up the
> big card (or attach the FLUX volume) for the final Piece batch.

## Driving it from Cowork

```bash
# Study tier — render a whole scene's boards from the template
python runner.py --workflow graphs/sdxl_study.api.json --profile study \
                 --assets ./assets --out ./out/study

# Just two shots (e.g. a push-in pair)
python runner.py --workflow graphs/sdxl_study.api.json --profile study --shots 04A,04B

# Piece tier — re-render approved boards at FLUX fidelity
python runner.py --workflow graphs/flux_piece.api.json --profile piece \
                 --assets ./assets --out ./out/piece --shots 04A,04B
```

The runner uploads each board's control + identity PNGs to the pod, patches the workflow
by title, queues it, polls `/history`, and downloads results to `out/<tier>/<SHOT_ID>_*.png`.

---

## Test ladder (the assessment plan)

Run these in order. Each gate de-risks the next; do not advance on a failed gate.

| gate | proves | run | pass criteria | if it fails |
|------|--------|-----|---------------|-------------|
| **0 · Env up** | pod reachable, ComfyUI alive | `runner.py --ping` | `/system_stats` returns GPU | wrong COMFY_URL, port not exposed |
| **1 · Base txt2img** | checkpoint + VAE + sampler sane | minimal graph, no control | one clean image | bad VAE / model path |
| **2 · Control (angle axis)** | Depth+Pose ControlNet obey blocking | 1 board with hand-drawn skeleton + depth | output composition matches the control | wrong-base ControlNet, strength too low |
| **3 · Identity (character axis)** | character holds across angles | same char, 3 different POSE skeletons | same face across all 3 | FaceID weight low / ref too zoomed |
| **4 · Study batch (end-to-end)** | runner + template + axes at Study tier | 5-board mini-scene incl. a push-in pair | 5 coherent boards; pair shares identity & style | template parse / title mismatch |
| **5 · Piece re-drive (the handoff)** | FLUX renders the *record*, identity survives base swap | 1 approved board → flux_piece via depth ControlNet + PuLID-Flux | same blocking + identity, higher fidelity | PuLID ref, FLUX ControlNet mismatch |
| **6 · Piece batch + economics** | production cost is known | all approved boards at Piece tier | full scene rendered; **record $/board and min/board** | OOM → use quantized FLUX |

Gate 5 is the architectural keystone: it confirms that an SDXL-authored board can drive a
FLUX render without losing the character. If 5 passes, the pipeline thesis holds.

## Assessment metrics (make "consistency" measurable, not vibes)

Three numbers turn the visual gates into something you can track across runs:

- **Identity drift** — cosine similarity of InsightFace embeddings between each board's face
  and the character reference. InsightFace is already loaded for PuLID, so it's free to reuse.
  Target ≥ 0.6 within a scene; flag any board that drops below.
- **Composition adherence** — similarity between the *control* depth map and a depth map
  re-extracted from the rendered board. Tells you the ControlNet actually held the framing.
- **Style coherence** — CLIP-embedding similarity across all boards in a scene; a low outlier
  is a board that drifted off-style.

`assess.py` (next artifact, not yet built) would compute these over an `out/` folder and emit
a per-scene report. Say the word and I'll add it.

## Cost model

- **Study**: ~$0.40/hr, a few seconds/board → cents per board. Iterate without thinking about it.
- **Piece**: big card or quantized FLUX, ~20–60 s/board depending on resolution and ControlNet
  stacking. Gate 6 measures the real number so you can budget a full film. Render at a modest
  long edge (1024–1344) and upscale as a separate pass rather than generating huge.

## Commit before you scale

1. One **house-style** SDXL checkpoint (and later its FLUX style-LoRA twin) so STYLE_LOCK is real.
2. Each lead's **turnaround sheet** → drives FaceID now, trains the LoRA later, feeds PuLID at Piece.
3. The two **exported API JSON** graphs matching the title contract above.
