# Shopkeeper — Latest Sweep

**Run:** 2026-06-08, ~10:30 UTC (every-other-morning steward cadence, shadow). Overwritten each run.

**One-line:** One candidate cleared the bar — **image/text-to-3D mesh generation** (Hunyuan3D-2), which opens the 3D-*asset* door the Roster has never had and Three.js can't fill. I probed it end-to-end from the sandbox and got a real, verifiable mesh back.

---

## Dossier — cleared the bar

### Image-to-3D mesh generation (Hunyuan3D-2)

**What it is / the door it opens.** A diffusion model that turns a single image (or a text→image→3D chain) into a watertight-ish triangle mesh with geometry you can export as `.glb`. The Shop can already *make* 2D (FLUX, ComfyUI, Matplotlib…) and *render* 3D it's handed (Three.js), but it has never been able to *create* a 3D asset. This is the first half of the Maker's named **Blender / offline-photoreal-3D** gap — not the rendering half (that's still Blender/mac), but the **asset-generation** half. Natural pairing: Shopkeeper-generated mesh → Three.js displays it (the existing R3F/drei path), or → handed to Blender on the Mac for photoreal finishing.

**The probe (real artifact, sandbox-only, tokenless).** Full chain ran in this Linux sandbox with no HF token, the same cloud pattern that put FLUX on the Roster:

1. FLUX-schnell (anonymous Gradio API) → clean studio photo of a vintage ceramic teapot — `probes/2026-06-08-image-to-3d/01-input-teapot-flux-schnell.png`
2. Hunyuan3D-2 `/shape_generation` (anonymous Gradio API) → mesh in **5.8 s server-side**: **77,519 vertices · 273,504 faces**, 4.2 MB `.glb` — `probes/2026-06-08-image-to-3d/02-output-mesh-hunyuan3d-2.glb`
3. Verified with `trimesh` (loads clean, sane bounds ≈ 1.98 × 1.50 × 1.20 units) and rendered a 3-view point cloud — `probes/2026-06-08-image-to-3d/03-verify-mesh-multiview-pointcloud.png`. The reconstruction faithfully recovers body, spout, handle, lid knob, **and even the thin wire bail** — not a billboard, genuine closed-ish geometry.

**Where it would live.** A new Specialist — provisional name **Hunyuan3D smith** (or a broader *Image-to-3D smith* slot, with Hunyuan3D-2 as the first-stocked engine and TRELLIS.2 / TripoSplat / Stable-Fast-3D as comparison candidates). Selection heuristic it would feed: *brief needs a 3D mesh/asset* → image-to-3D smith; *brief needs to display/animate existing 3D* → Three.js; *brief needs photoreal offline render* → still Blender (mac, unfilled).

**Honest cost.**
- *Host class:* effectively **cloud** via HF Spaces (free, tokenless today — Hunyuan3D-2 answered anonymous calls; Stable-Fast-3D **rejected** the anonymous call, likely ZeroGPU quota, so reachability is per-Space, not guaranteed). For reliability under load it wants either an HF token or a **mac handoff** (local GPU) — flag this exactly like the FLUX free-tier caveat.
- *Output is shape-only here:* I ran the geometry stage; the texture stage is a second call. Mesh is not yet watertight (expected for the raw shape pass).
- *License:* Hunyuan3D-2 ships under Tencent's community license — **needs a read before any monetized/Loudon-Live-published use.** Note for the entry.
- *Footprint:* trivial on our side (we're a thin client); the GPU cost lives on the Space.

**My read.** Yes — I'd bet a real brief on this, with one guardrail: confirm a reliable host (token'd HF or mac) before promising it for a Piece. As a Sketch/Study door it's already real today, and it's the cleanest fit to a named gap I've found. Recommend Loudon green-light a proper Specialist deposit + a small Comparison (Hunyuan3D-2 vs TRELLIS.2 vs TripoSplat) on one shared input to calibrate the slot — exactly the Flocking shoot-out pattern, one seed, many lenses.

---

## Triaged out (logged so I don't re-chase)

- **TRELLIS.2 (microsoft) / TripoSplat (VAST-AI) / Stable-Fast-3D / Pixal3D / InstantMesh** — same door as above; held as *comparison candidates* for the image-to-3D slot rather than separate findings.
- **Magenta RealTime 2 (google)** — real-time/streaming music generation; a door Stable Audio Open (one-shot short clips) lacks. Interesting, but tflite/GPU + a streaming interaction model the sandbox can't honestly probe. **Needs a mac handoff to truly probe.** Re-look if a live-music brief appears.
- **MMAudio** — video→synchronized audio (Foley). Niche vs current SFX coverage; revisit on a video-with-sound brief.
- **Expressive/voice-clone TTS — Higgs-Audio v3, VoxCPM2, IndexTTS-2, OmniVoice, MisoTTS, ResembleAI Chatterbox** — could *improve on* Kokoro (emotion control, cloning), but Kokoro is chosen for being light/local and none of these clears that bar as a *replacement* yet. Candidate for a future narration Comparison, not a new door.
- **Ideogram-4, Z-Image-Turbo, Qwen-Image, Cosmos3 text2image** — strong 2D image models; duplicate the FLUX/ComfyUI slot rather than beat it. No action.
- **LTX-2.3 / Sulphur-2 / JoyAI-Echo / Wan-2.2 (video), gemma-4, DeepSeek-V4, Qwen3.6, Nemotron-3 (LLMs), PaddleOCR-VL, nemotron ASR** — outside the Shop's mediums or duplicative. No action.

---

## Maintenance findings (light pass — note, don't fix)

- **Roster status: clean.** All 19 Specialist frontmatter `status` fields match the Maker's Roster taxonomy (17 alive, 1 stub = RNBO codebox~ smith, 1 deprecated = Midjourney). **No three-place drift.** The drift-watch discipline is holding.
- **Audio-slot version currency:** the Roster's audio Specialist is **Stable Audio Open** (the older open model); **Stable Audio 3** (SA3 Medium / Small Music / Small SFX) is now live as an HF Space. Not palace-drift, but worth a dated note in [[Stable Audio Open]] that a newer generation exists, before the next audio brief.
- **Never-run test plans (pre-existing, unchanged):** Maker's own `Artifacts/Shop/Maker/tests/test-plan.md` is still TODO / "Last run: never." VCV Patch Generator remains the only Specialist with a run test-plan + determinism proof. Not new rot, just the standing gap.

---

## Run accounting

- **Token usage (approx):** ~55k this run (one wide HF trending scan was the bulk; probe + verify were cheap). Within a frugal discovery budget — discovery cost a fraction of a brief, as intended.
- **Probes saved:** `Shop/Shopkeeper/probes/2026-06-08-image-to-3d/` (3 files).
- **Posture:** shadow — proposed, deposited nothing, committed nothing. The Roster decision on the image-to-3D Specialist is Loudon's.
