# Probe log — Image-to-3D (2026-06-08)

**Question:** Can the Shop generate a real 3D *asset* from a prompt/image, reachable from a tokenless sandbox the way FLUX is?

**Answer: yes**, via Hunyuan3D-2's HF Space, anonymous Gradio API.

## Chain
1. **FLUX-schnell** (`evalstate/flux1_schnell`, anonymous) — prompt → studio teapot photo, seed 7, 1024², 4 steps → `01-input-teapot-flux-schnell.png`.
2. **Hunyuan3D-2** (`tencent/Hunyuan3D-2`, `/shape_generation`, anonymous) — image → mesh. steps 20, guidance 5.0, seed 7, octree 192, rembg on.
   - Server time: 5.8 s (rembg 1.0 s · shape 4.8 s · export 0.04 s).
   - Output: `white_mesh.glb`, 4.2 MB → `02-output-mesh-hunyuan3d-2.glb`.
   - Reported stats: 77,519 vertices, 273,504 faces.
3. **Verify** (`trimesh` + Matplotlib, sandbox) — loads clean; bounds ≈ [-1.01,-0.77,-0.62]→[0.97,0.73,0.59], extents ≈ 1.98×1.50×1.20; not watertight (shape-only stage). 3-view point cloud → `03-verify-mesh-multiview-pointcloud.png`.

## Caveats / reachability
- **Stable-Fast-3D** (`stabilityai/stable-fast-3d`) **rejected** the anonymous call (upstream AppError — likely ZeroGPU quota). Reachability is **per-Space**, not a blanket guarantee. For reliability: HF token or mac/local GPU.
- Geometry stage only; texture is a second call.
- License: Tencent community license — read before monetized/published use.

## Reproduce
Scripts archived in scratch (`outputs/probe-3d/`): `gen2.py` (image), `run_hy3d2.py` (mesh), point-cloud render inline. `pip install gradio_client trimesh matplotlib`.
