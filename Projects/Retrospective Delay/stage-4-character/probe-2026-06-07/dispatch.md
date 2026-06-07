# Séance Cat Probe — Dispatch Sheet
**Date:** 2026-06-07
**Status:** Server down at time of authoring — run this when ComfyUI is live.

---

## 1. Start the Server

```bash
cd /Users/loudonstearns/Documents/The\ Palace/_tools/ComfyUI
source venv/bin/activate
python main.py --listen 127.0.0.1 --port 8188
```

**Expected cold-load time:** 90–120 s (MPS checkpoint load for SDXL ~7 GB into unified memory). Watch for `To see the GUI go to: http://127.0.0.1:8188` — that line means the server is ready. Do not queue before it appears.

Verify readiness:
```bash
curl -s http://127.0.0.1:8188/system_stats | python3 -m json.tool | grep device
```
Should return `"device": "mps"`.

---

## 2. Workflow File

```
Projects/Retrospective Delay/stage-4-character/probe-2026-06-07/gorey-ink-pose-3-probe.workflow.json
```

Absolute path:
```
/Users/loudonstearns/Documents/The Palace/Projects/Retrospective Delay/stage-4-character/probe-2026-06-07/gorey-ink-pose-3-probe.workflow.json
```

---

## 3. Prompt Strings

### Gorey-Ink (the probe)
**Positive:**
```
Edward Gorey style pen and ink illustration, fine crosshatch shading, eerie Victorian atmosphere, a small black cat standing upright with both arms stretched wide overhead in a summoning pose, ectoplasm wisps swirling around outstretched paws, stars in its wide round eyes, séance ritual, floating candles in background, sparse Victorian room, delicate fine line work, black ink on cream paper, high contrast, gothic whimsy, no color, monochrome
```

**Negative:**
```
color, photograph, photorealistic, 3d render, cartoon, anime, manga, watermark, text, blurry, low quality, ugly, deformed, modern, flat design, vector art, gradient
```

### Cyberpunk (optional second run, same session if time allows)
**Positive:**
```
cyberpunk séance cat, dark synth atmosphere, small upright cat with arms stretched wide overhead in summoning pose, neon rim lighting in magenta and electric blue, ectoplasm rendered as glowing neon plasma wisps, stars and circuit-trace patterns in wide glowing eyes, dark background, high contrast, neon-on-black, detailed fur with subsurface neon glow, cinematic mood, digital painting style
```

**Negative:**
```
daylight, bright colors, pastel, watercolor, ink, sketch, cartoon, flat, low contrast, blurry, watermark, text, deformed
```

---

## 4. Python Invocation

Use the reference render driver pattern from `Kuramoto Coupling/fireflies-pond-render.py`, adapted for this probe:

```bash
cd /Users/loudonstearns/Documents/The\ Palace
python "Projects/Retrospective Delay/stage-4-character/probe-2026-06-07/render.py"
```

Or queue the workflow directly via the ComfyUI API:

```python
import json, urllib.request, time, urllib.parse

COMFY_HOST = "http://127.0.0.1:8188"
WORKFLOW_PATH = "Projects/Retrospective Delay/stage-4-character/probe-2026-06-07/gorey-ink-pose-3-probe.workflow.json"

with open(WORKFLOW_PATH) as f:
    workflow = {k: v for k, v in json.load(f).items() if not k.startswith("_")}

body = json.dumps({"prompt": workflow}).encode("utf-8")
req = urllib.request.Request(f"{COMFY_HOST}/prompt", data=body,
    headers={"Content-Type": "application/json"}, method="POST")
with urllib.request.urlopen(req, timeout=10) as resp:
    prompt_id = json.loads(resp.read())["prompt_id"]

print(f"Queued: {prompt_id}")
# Poll /history/{prompt_id} every 2 s — see fireflies-pond-render.py for full loop.
# Output lands in _tools/ComfyUI/output/ as gorey-ink-pose-3-probe_XXXXX_.png
# Copy to probe-2026-06-07/gorey-ink-pose-3-probe.png when done.
```

Full polling loop: copy from `/Users/loudonstearns/Documents/The Palace/Kuramoto Coupling/fireflies-pond-render.py` lines 61–110.

---

## 5. Parameters

| Parameter | Value |
|---|---|
| Model | sd_xl_base_1.0.safetensors |
| Seed | 42 |
| Steps | 30 |
| CFG | 7.5 |
| Sampler | euler / normal |
| Dimensions | 1024 × 1024 |
| Tier | Sketch |
| ControlNet | None (prompt-described pose) |

---

## 6. Expected Wall-Clock

- First render after cold server start: **~110–140 s** (MPS, SDXL, 30 steps, 1024²)
- Warm render (checkpoint already in unified memory): **~30–50 s**

---

## 7. Output Targets

Copy ComfyUI output file to:
```
Projects/Retrospective Delay/stage-4-character/probe-2026-06-07/gorey-ink-pose-3-probe.png
```

Then create:
```
Projects/Retrospective Delay/stage-4-character/probe-2026-06-07/gorey-ink-pose-3-probe.report.json
```

With this structure:
```json
{
  "dimensions": "1024x1024",
  "model_used": "sd_xl_base_1.0.safetensors",
  "seed": 42,
  "steps": 30,
  "cfg": 7.5,
  "sampler": "euler/normal",
  "tier_used": "Sketch",
  "prompt_final": "<paste positive prompt>",
  "render_time_sec": 0.0,
  "vram_peak_mb": 0,
  "gotchas_hit": [],
  "status": "ok",
  "notes": ""
}
```

---

## 8. What to Inspect

1. **Does it read as Gorey?** Look for: fine line crosshatch (not painterly wash), cream/white ground with black ink marks, high-key contrast, no color. If SDXL renders painterly instead of linework, the prompt needs "pen and ink, crosshatch, stipple" pushed harder — or a Gorey LoRA is the fix.
2. **Is the cat character recognizable?** Arms-up summoning pose must be legible. If the limbs are confused (SDXL struggles with non-quadruped cat anatomy at times), add "anthropomorphic cat standing on two legs" to positive and "quadruped, on all fours" to negative.
3. **Are the ectoplasm wisps present?** These are critical for the gain-peak pose. If absent, they'll need ControlNet scribble input from the seed SVG in the next probe.
4. **Is it séance-atmospheric?** Stars in eyes, Victorian room, floating candles. Missing any of these: adjust prompt weights.

---

## 9. Seed SVG Reference (for ControlNet in next probe)

```
Projects/Retrospective Delay/proofs/2026-05-04-seance-cat-poses-v2-7frames.svg
```

Pose 3 is the center frame (arms raised). Export that frame as a 1024×1024 PNG, feed as ControlNet-scribble input in the Study-tier follow-up if the Sketch reads.
