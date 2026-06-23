---
title: sweep-latest
born: 2026-06-23
links:
  - { target: "[[Shopkeeper]]", type: connects-to, label: sweep-record-for }
forward_vector: "I hold the most recent Shopkeeper discovery sweep, overwritten each run; I want to keep surfacing the worthy few for Loudon's attention."
---

# Shopkeeper — Latest Sweep

**Run:** 2026-06-23, morning steward cadence (shadow). Overwritten each run.

**One-line:** Commission executed — Image-to-3D Smith stub deposited; full four-engine shoot-out complete; Hi3DGen is the surprise standout (only watertight engine). Discovery sweep quiet: Stable Audio 3 is the one maintenance note worth acting on; nothing else clears the bar for a new Specialist.

---

## Commission Execution (before discovery sweep)

### ✓ Image-to-3D Smith — STUB deposited

**What was done:**
1. Ran the full four-engine calibration shoot-out on the shared teapot PNG (same subject as the 2026-06-08 probe). All four engines answered anonymous calls.
2. Verified all outputs with trimesh (vertices, faces, watertight, bounds). Rendered a 4×4 comparison panel.
3. Wrote `Shop/Image-to-3D Smith.md` as a **stub** (status: stub), per shadow posture.
4. Added `Image-to-3D Smith` to `Shop/Maker/host-capability.json`.
5. Full comparison report at `Shop/Shopkeeper/probes/2026-06-23-image-to-3d-shootout/comparison-report.md`.

**Shoot-out results:**

| Engine | Verts | Faces | Watertight | Size | Time | Output |
|---|---|---|---|---|---|---|
| **Hi3DGen** (Stable-X) | 271K | 543K | **YES** | 13MB | 26s | Triangle mesh GLB |
| Hunyuan3D-2 (Tencent) | 135K | 489K | No | 7.5MB | 23s | Triangle mesh GLB |
| TRELLIS.2 (Microsoft) | 91K | 98K | No | 4.6MB | 47s | Textured GLB |
| TripoSplat (VAST-AI) | 262K pts | 0 faces | N/A | 18MB | ~20s | Gaussian splat PLY |

**Key finding:** Hi3DGen is the **only watertight engine** — architecturally decisive for the Blender finishing path. The commission named Hunyuan3D-2 as first-stocked; I'm recommending Hi3DGen as primary. Defer to Loudon.

**TripoSplat gotcha:** Gaussian splat output, NOT a triangle mesh. Different lane entirely — needs a splat renderer in Three.js; can't import as editable geometry in Blender. This distinction matters and is now documented in the Specialist entry.

**Selection heuristic (proposed for Maker):**
- Blender-bound → **Hi3DGen** (watertight)
- Three.js display (lightweight textured) → **TRELLIS.2**
- Fast sketch / iteration → **Hunyuan3D-2**
- Novel-view synthesis only → **TripoSplat**

**Loudon's decisions needed:**
1. Approve the stub entry (or revise it before promoting to `alive`)
2. Confirm Hi3DGen as primary or keep Hunyuan3D-2 per original commission
3. Confirm whether TripoSplat earns its own Specialist entry (genuinely different output type)
4. Designate first real job (Study-tier: Sketch → Three.js display, or Study → Blender import)
5. License reads on all four engines before any Piece-tier job

---

## Discovery Sweep (routine)

### Maintenance findings

**Stable Audio 3 is live (stabilityai/stable-audio-3) — action warranted.**
The Roster's audio-generation Specialist is **Stable Audio Open** (the older open model). Stable Audio 3 ships three models: SA3 Medium (music, long-form), SA3 Small Music, SA3 Small SFX. The SA3 Small SFX is directly relevant: the current Stable Audio Open entry is limited to ~47s music clips; SA3 Small SFX is built explicitly for sound design work. Worth a dated gotcha note in [[Stable Audio Open]] and a future probe. *Not a new Specialist yet — just a version-currency flag.*

### Triaged out

**Qwen3-TTS (1978 likes, trending 20)** — strong new TTS with voice design + cloning, multilingual. Better expressive range than Kokoro. But Kokoro is on the Roster for being light, local, and free-forever, not for being best-in-class. Qwen3-TTS is cloud-only. Hold for a future narration Comparison if a Loudon Live brief needs it.

**Zonos 2 (multimodalart/ZONOS2)** — expressive multilingual TTS with voice cloning. Same lane as Qwen3-TTS; same triage.

**Wan2.2 (trending 56, 1813–2793 likes)** — image-to-video, very hot. The Shop has no motion Specialist that can take a still and animate it. Genuinely new door. However: probeable only from a mac-side session (GPU required for meaningful results). Hold for mac-side.

**LTX-2.3 (Lightricks)** — text-to-video with audio, cinematic quality. Relevant to the Debrief Reel pattern. Same probe caveat as Wan2.2. Hold for mac-side.

**Interactive / viz / plumbing**: nothing new that opens a door the current Roster lacks.

### Not worth re-chasing

- Z-Image-Turbo, Qwen-Image, SD3.5 — 2D image, duplicate FLUX slot
- PRX-Pixel (Photoroom) — too narrow

---

## Roster maintenance (light pass)

- **Status drift:** Clean. No change from 2026-06-08 sweep.
- **Stable Audio Open:** needs a dated gotcha note flagging SA3 generation. Propose in TRICKSTER note; add when Loudon confirms.
- **Never-run test plans:** unchanged — Maker's own test plan still TODO; VCV Patch Generator remains the only proven plan. Standing gap.

---

## Run accounting

**Token budget:** Scan used HF MCP (cheap). Probes used 4× anonymous Gradio API calls + trimesh verification (sandbox Python, $0). Well within the "discovery should cost a fraction of a brief" charter.

**Files written this run:**
- `Shop/Shopkeeper/probes/2026-06-23-image-to-3d-shootout/comparison-report.md`
- `Shop/Shopkeeper/probes/2026-06-23-image-to-3d-shootout/comparison-panel.png`
- `Shop/Shopkeeper/probes/2026-06-23-image-to-3d-shootout/leg*.glb` + multiview PNGs
- `Shop/Image-to-3D Smith.md` (STUB)
- `Shop/Maker/host-capability.json` (updated)
- `Shop/Shopkeeper/sweep-latest.md` (this file)
