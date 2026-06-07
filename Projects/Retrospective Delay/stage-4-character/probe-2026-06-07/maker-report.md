# Maker Report — Séance Cat Probe
**Date:** 2026-06-07
**Probe:** gorey-ink-pose-3, Sketch tier, SDXL base, seed 42

---

## Decision: What I Picked and Why

**One pose. One style. No ControlNet. Prompt-described pose only.**

The brief asks for two styles × five poses = ten images at character-consistency grade. Before investing in IP-Adapter or ControlNet-scribble plumbing, I need to know whether SDXL can produce a Gorey-ink-reading cat character at all — not whether the pipeline is wired correctly. That's the blocking question. If SDXL can't render fine crosshatch linework from a text prompt alone, no amount of pipeline sophistication fixes it.

**Pose 3 is the right test pose.** It's the most visually loaded frame — arms outstretched, ectoplasm swirling, stars in eyes. If the gain-peak pose reads, the dormant/sleeping pose (Pose 1) will be easier. Testing the hardest pose first surfaces the real constraints first.

**Gorey-Ink before Cyberpunk.** The Gorey style is harder for SDXL. Ink crosshatch from a diffusion model is a genuine ask — diffusion models are trained on photographs and painterly work; fine pen linework is underrepresented. Cyberpunk neon-on-dark is easy for SDXL (heavily represented in training data). If Gorey fails, the fallback path is clear. If it succeeds, we know the model ceiling is high enough to attempt both.

**Seed 42, locked.** This seed travels to every subsequent pose. Character consistency across poses depends on the seed being the same token the model uses as its "personality draw" for the character. Lock it now, never change it within a pose-set unless the Gorey-ink style itself changes.

**1024×1024 square.** The cat is a UI character that will appear at various sizes in the Retrospective Delay instrument. Square gives maximum re-crop flexibility. The Kuramoto arc used 1216×832 for a landscape scene — irrelevant here.

**No ControlNet this round.** The seed SVGs are scribble-grade, not lineart-grade. Running them through ControlNet-scribble without first knowing if the base model can render the style is backwards. The correct order is: (1) confirm style renders from prompt alone, (2) confirm pose reads from prompt alone, (3) if pose is ambiguous, add ControlNet-scribble from the SVG to constrain it.

---

## Server Status

**Down at probe time.** `curl -s http://127.0.0.1:8188/system_stats` returned no output. ComfyUI was not running.

Start command:
```bash
cd /Users/loudonstearns/Documents/The Palace/_tools/ComfyUI && source venv/bin/activate && python main.py --listen 127.0.0.1 --port 8188
```

Expected cold-load: 90–120 s. SDXL checkpoint (sd_xl_base_1.0.safetensors) confirmed present in `_tools/ComfyUI/models/checkpoints/`.

---

## What Was Produced

Since the server was down, this round produces the dispatch-ready package. No PNG was rendered.

| File | Purpose |
|---|---|
| `gorey-ink-pose-3-probe.workflow.json` | Complete ComfyUI workflow JSON, ready to queue |
| `dispatch.md` | Full re-start instructions, prompts for both styles, Python invocation, what to inspect |
| `maker-report.md` | This file — decision rationale, server status, next-step spec |

The workflow JSON is self-contained: SDXL base, seed 42, 30 steps, CFG 7.5, euler/normal, 1024×1024. No custom nodes, no ControlNet nodes, no IP-Adapter nodes. It will queue cleanly against the existing ComfyUI install.

---

## What I Learned (from Prior Art)

The fireflies-pond recipe (2026-05-26) confirmed: first SDXL render on Mac MPS takes ~110 s; warm renders drop to ~30 s. The polling loop in `fireflies-pond-render.py` is the right dispatch pattern — it handles the 100 s "queued" silence without false-timing-out. That loop is the template for the render driver here.

One new constraint this brief adds that fireflies did not: **character identity across frames**. The fireflies job was a single-image scene. The séance cat is a character who must be recognizably the same cat across five poses. Seed-locking is necessary but not sufficient for that — it's sufficient for SDXL's "random draw" of a face/character shape, but it won't hold style tightly if the prompt changes substantially between poses. IP-Adapter is the real answer; this probe tests whether the base generation is worth anchoring.

---

## Next Probe

**If Gorey-ink reads (fine crosshatch, character legible, pose clear):**
Run the Cyberpunk version with the same seed. Confirm both styles produce a recognizable cat. Then take the Gorey-ink result as the IP-Adapter reference image for Poses 1, 2, 4, 5 — this locks character identity across the pose-set. The Study tier with IP-Adapter is the next real job.

**If Gorey-ink does not read (renders painterly, no crosshatch, wrong aesthetic):**
Two options:
1. Drop to a flatter, more cartoon-styled brief — "Edward Gorey-inspired, bold ink outlines, minimal crosshatch, flat black and white areas" — which SDXL handles more reliably than full fine-crosshatch.
2. Source or train a Gorey LoRA. A 15–20 image LoRA trained on Gorey scans would solve this problem definitively. The brief warrants it if Gorey-ink is truly the chosen direction.

**If the pose is ambiguous (arms unclear, cat anatomy confused):**
Add the seed SVG Pose 3 frame as ControlNet-scribble input. Export `2026-05-04-seance-cat-poses-v2-7frames.svg` frame 4 (center, arms raised) as a 1024×1024 PNG, wire it into the workflow's ControlNet-Scribble node. ControlNet-Union is not confirmed installed — check `_tools/ComfyUI/models/controlnet/` before assuming it's available.

**The honest stopping condition for this probe:** if both Gorey-ink and Cyberpunk produce a legible upright cat with something reading as raised arms and something reading as eerie atmosphere, the pipeline is proven and the next investment is IP-Adapter for cross-pose consistency. If neither does, the constraint is the base model's style ceiling, not the pipeline design.
