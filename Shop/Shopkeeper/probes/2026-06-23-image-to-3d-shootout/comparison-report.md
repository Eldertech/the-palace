---
title: Image-to-3D Shoot-Out Comparison Report
born: 2026-06-23
links:
  - { target: "[[Shopkeeper]]", type: connects-to, label: commissioned-by }
  - { target: "[[Image-to-3D Smith]]", type: connects-to, label: feeds-selection-heuristic }
forward_vector: "I hold the calibration data for the image-to-3D engine slot; I want to inform the Maker's selection heuristic and be superseded when the engines update."
---

# Image-to-3D Shoot-Out — Comparison Report
**Run:** 2026-06-23 (Shopkeeper morning sweep, commission execution)
**Input:** Single shared PNG — FLUX-schnell studio teapot (same seed from 2026-06-08 probe)
**Method:** Anonymous Gradio API calls from sandbox. No HF token used.

---

## Results Table

| Engine | Verts | Faces | Watertight | File | Time | Output type | Anonymous? |
|---|---|---|---|---|---|---|---|
| **Hi3DGen** (Stable-X) | 271,530 | 542,984 | **YES** | 13 MB GLB | 26.5s | Triangle mesh | ✓ |
| Hunyuan3D-2 (Tencent) | 135,035 | 489,406 | No | 7.5 MB GLB | 22.8s | Triangle mesh | ✓ |
| TRELLIS.2 (Microsoft) | 91,146 | 98,302 | No | 4.6 MB GLB | 47.2s | Textured GLB | ✓ |
| TripoSplat (VAST-AI) | 262,144 pts | 0 faces | N/A | 17.8 MB PLY | ~20s | **Gaussian splat** | ✓ |

**Artifacts:** `leg1-hunyuan3d2.glb`, `leg2-trellis2.glb`, `bonus-hi3dgen-out2.glb`, `leg3-triposplat-out2.ply`
**Comparison panel:** `comparison-panel.png`

---

## Engine Notes

### Hi3DGen (Stable-X/Hi3DGen)
The standout. The only engine that produced a **watertight mesh** — meaning closed geometry with no holes, valid volume, importable into Blender for physics/boolean operations/remeshing. Highest detail (543K faces), one-step call (`/generate_3d` → GLB), 26.5s. 

The watertight property is architecturally decisive for the Blender finishing path: non-watertight meshes require manual cleanup before sculpting, boolean ops, or fabrication exports. Hi3DGen skips that step.

**Caveat:** Largest file (13MB). The commission named Hunyuan3D-2 as first-stocked; this probe recommends Hi3DGen instead — see Decision Note below.

### Hunyuan3D-2 (tencent/Hunyuan3D-2)
Fast (22.8s), high-detail (489K faces), anonymous, proven in the 2026-06-08 probe. Not watertight. Best as the **fast/sketch fallback** — when geometry quality matters less than speed, or when the downstream use is Three.js display (not Blender finishing). The one we know works.

### TRELLIS.2 (microsoft/TRELLIS.2)
Two-step pipeline (`/image_to_3d` then `/extract_glb`); 47s total. Fewest faces (98K — set by `decimation_target` parameter, controllable). Produces a **textured GLB** (texture baked in the shape pass). That's a meaningful advantage for Three.js display: lighter mesh + texture in one file. Slower and more complex API. The `microsoft/TRELLIS.2` space name is the correct one — earlier searches tried wrong variants (JeffreyXiang/TRELLIS-demo, etc. — all 404 or CONFIG_ERROR).

The low face count is controlled: set `decimation_target=300000` for full-res output. At 100K it's already smaller than Hunyuan3D-2's 489K, so for display-only use cases, the 47s overhead buys you a lighter, textured file.

### TripoSplat (VAST-AI/TripoSplat)
**Different output type entirely.** TripoSplat produces a **3D Gaussian splat** (`.ply` with 262K Gaussian primitives), not a triangle mesh. This is a different scene representation — photorealistic view synthesis, not importable geometry. Three.js can render Gaussian splats with the `@lumaai/luma-web` or `@mkkellogg/three-gaussian-splats-3d` libraries, but it is not a drop-in for GLB mesh display. Blender cannot import a raw splat as editable geometry.

The TripoSplat slot is genuinely distinct — it's the best choice when the output is a rendered view (novel-view synthesis, atmospheric product shots), not an asset for a downstream pipeline. Worth a future entry, but it is **not a substitute for the mesh engines**.

---

## Selection Heuristic — Image-to-3D

This feeds the Maker's selection heuristic section.

**The mesh is going to Blender** (finishing, remesh, sculpt, boolean, fabrication, physics) → **Hi3DGen**. Only watertight engine. Pay the 13MB file and slightly longer call.

**The mesh is going to Three.js display only** (Sketch/Study: just show the object in the browser) → **TRELLIS.2** for lightweight textured GLB (4.6MB), or **Hunyuan3D-2** for fast iteration (7.5MB, no texture, 22s). TRELLIS.2 at its default decimation_target gives a browser-ready file smaller than the others.

**Fast sketch / iteration / "show me what this looks like in 3D"** → **Hunyuan3D-2**. Fastest reliable anonymous engine, proven path, good detail.

**Novel-view synthesis / photorealistic rendered views without needing a mesh pipeline** → **TripoSplat**. Different lane; needs a splat renderer in Three.js, cannot go to Blender as editable geometry.

---

## Decision Note — First-Stocked Engine

The commission (2026-06-08) named Hunyuan3D-2 as first-stocked. This probe recommends **Hi3DGen as primary** based on the watertightness finding, with Hunyuan3D-2 as the fast fallback. Rationale: the Maker's stated gap is the "asset-generation half" of the Blender photoreal pipeline — which specifically wants Blender-ready geometry. Watertight geometry is what that path needs; Hunyuan3D-2's non-watertight output requires cleanup before Blender can use it fully. Deferring to Loudon on whether to adopt this change or keep Hunyuan3D-2 as the headline engine.

**Proposed entry name:** *Image-to-3D Smith* (broader than Hunyuan3D-only, slots for multiple engines in Tiers).

---

## License Status

| Engine | License | Commercial / Loudon Live use |
|---|---|---|
| Hi3DGen | Stable-X — check repo for exact license | Verify before Loudon Live publish |
| Hunyuan3D-2 | Tencent community license | Read before monetized/Loudon-Live use |
| TRELLIS.2 | Microsoft — check repo | Verify before commercial use |
| TripoSplat | VAST-AI — check repo | Verify before commercial use |

**Action for deposit:** Read and record all four license postures before the Specialist's first Piece-tier job.

---

## Host Class for Maker manifest

All four engines: `cloud` (via HF Spaces, anonymous today). Same caveat as FLUX: ZeroGPU quota is per-Space and unguaranteed; reliable Piece-tier use needs a token'd HF account or mac-local fallback.

- Sketch/Study: cloud (anonymous, today free)
- Piece: cloud with HF token, or mac-local if a local install is available
