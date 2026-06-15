---
title: "BLUELINE — baton"
born: 2026-06-14
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the BLUELINE technical spike across a context boundary — five tracks proven, two threads still open (the M4L bug-fix test and the Track II LoRA train) — waiting to be caught Mac-side and deleted once the move is picked up."
session_thread: "Mac-side Claude Code 2026-06-14 — Tracks I/III/IV/V proven, Track II dataset, M4L device live"
---

# Baton: BLUELINE — spike complete, two open threads

## Move
The technical spike is **done across all five tracks** — the substrate is proven end to end. Pick up the
**two open threads**, then begin production (M0):
1. **Test the M4L `qmetro` fix** (Loudon, in Max) — see Open Thread A.
2. **Train the Track II character LoRA** (needs an SSH pod) — see Open Thread B.

## Why this move matters
Every novel BLUELINE bet has now been exercised at small scale and held: blocking defeats the front-on
default (S1), language→editable Blender scene (S2/Blender-MCP), one flow field → three resolutions (S3),
GPU render on a self-owned worker (Track I), the beat-locked clock driven by **live Ableton** (Track III),
the pose/camera/environment bench (Track IV), and frame-to-frame coherence (Track V, the #1 risk). M0
production can start; only the two threads below are unfinished.

## DONE this session (all committed on main — see `git log --grep BLUELINE`)
- **Track I — GPU substrate ✅ both tiers.** Phase A: board→serverless FLUX→retrieved (`serverless_runner.py`,
  palace-flux endpoint, re-parked). Phase B: network volume + pod (4090) → **FLUX-ControlNet via the
  WAF-hardened transport** (`pod_runner.py` = the board-driven merge), geometric pose enforced. `runpod`
  host class wired into `host-capability.json`. Reports: `render-backend/track-I-report.md`.
- **Track III — Clock ✅ LIVE-VALIDATED.** Determinism recipe + relay + browser client; **Loudon's M4L
  device drives it from real Ableton** (120@24 → 12 fpb, beats on whole frames, ~5 ms σ jitter). The
  device build spec + the live-test fixes are in `track-III-clock/`.
- **Track IV — Bench ✅** pose library + camera-grammar solvers + **true-OTS environment** (IV-D alley) →
  board records. `proofs/track-IV-bench/`.
- **Track V — Motion coherence ✅ (the #1 risk, workable).** Seed-locking defeats the stitched-stills
  flicker (quantified: linked color_corr **0.94** vs independent **0.17**). First rung; the full stack is
  named (seed → +depth → +identity → +flow-warp/Go-with-the-Flow). `proofs/track-V-motion/`.
- **Track II — assess ruler ✅ + character dataset ✅.** `consistency_ruler.py` (CNN-embed + color metric).
  8-image consistent "r4ng3r" ranger dataset (shared-seed method, ruler-validated embed 0.93) +
  captions. Training **kit ready, not run**. `proofs/track-II-lora/`.

## Open thread A — the M4L `qmetro` fix (untested)
Loudon's device froze Live (fixed: reuse LiveAPI) and then threw `jsliveapi: no valid object set` +
`SendMessage error 2` **only with the edit window closed**. Diagnosed as **LiveAPI on the high-priority
scheduler thread**. Fix shipped in `track-III-clock/M4L-DEVICE-SPEC.md` (committed `a946b61`,
`Palace-Verify: unverified`): **`[qmetro]` not `[metro]`** for the poll + a `valid()`/`init()` self-heal
guard in `transport.js`. **Next: Loudon pastes the updated `transport.js`, swaps metro→qmetro, confirms
the device runs with the editor closed.** If qmetro alone doesn't cure it, the guard at least stops the
errors; escalate to `plugsync~` (spec §5, signal-rate, no LiveAPI in the poll).

## Open thread B — train the Track II LoRA (needs an SSH pod)
The render pods expose only ComfyUI HTTP; a trainer needs **shell access (an SSH-enabled pod)**. The
turnkey kit is `proofs/track-II-lora/TRAIN.md` (ai-toolkit FLUX config `train_flux_lora.yaml`, trigger
`r4ng3r`, ~1200 steps; + an SDXL/kohya fallback). **Next: spin an SSH pod (PUBLIC_KEY), scp the dataset,
train, download the LoRA, then run the grading test** — render `r4ng3r` across **different seeds**, ruler
it, beat Track V's independent-seed drift (0.82). **One unknown:** FLUX.1-dev is gated — confirm the HF
token has access, else use the SDXL fallback. ~$1–2, ~45 min.

## Tried and rejected (negative space — don't re-explore)
- **Animal motion** — out of scope; humanoid only.
- **2D pose estimator (DWPose) on a greybox proxy** — returns black; emit the OpenPose skeleton
  geometrically (projected bones). Settled.
- **Standalone SDXL lineart ControlNet** — none strong; use **canny** on SDXL, one ControlNet per channel.
- **FLUX via the HF-Inference Specialist for ControlNet** — it's cloud txt2img only; FLUX-ControlNet runs
  **local on a RunPod pod** (proven). The transport must be **browser-UA + curl upload** or the proxy WAF 403s.
- **`[metro]` for the M4L poll** — high-priority thread → LiveAPI errors when the editor's closed. Use `[qmetro]`.
- **`new LiveAPI()` inside the poll** — froze Ableton. Create once, reuse, guard with `api.id`.
- **Strong "one untouched flow field" claim** — falsified (S3); shared-source + thin per-leg mapping holds.
- **Blender-MCP vs SceneCraft as rivals** — they're layers over one shared spec: MCP = interactive
  hand-authoring primary (live-tested), SceneCraft = headless backend, Three.js = preview. (#4 resolved.)
- **Seed-locking as a full coherence answer** — it holds with the *same* seed (Track V); cross-seed needs the LoRA.

## State / receiving environment
- **RunPod:** account **clean** (0 pods running). Network volume **`blueline-models`** (id `aqm8oev4b0`,
  30 GB, EU-RO-1) holds `flux-union-pro.safetensors` — keep it (the model store; ~$2/mo; makes pods boot
  fast). `palace-flux` serverless endpoint parked at `workersMax=0`. Key + endpoint in
  `RunPod Images/studio/config.json` (gitignored). Helpers (`/tmp/rp_*.py`) were scratch — re-derive from
  `track-I-report.md` / `pod_runner.py`. **Spend this session ≈ $0.65 of a $20/day budget.**
- **Relay:** `osc_ws_relay.py` was running (`http://127.0.0.1:8770`, OSC :9001) — restart with
  `_tools/ComfyUI/venv/bin/python "Projects/BLUELINE/proofs/track-III-clock/osc_ws_relay.py"` (needs the
  venv for aiohttp; only one process can hold :9001).
- **Mac:** Blender 5.1.2, local ComfyUI at `_tools/ComfyUI` (SDXL + ControlNet aux + xinsir CNs from S1),
  Blender-MCP add-on can be connected (port 9876). Normal git.

## Calibrations from this session
- **Capability-first**: prove the workflow at small scale before optimizing.
- **Each track ships a reusable tool**, not project-local scratch (pod_runner, the ruler, the pose libs).
- **Terminate pods promptly** after a render/train; the volume persists models so re-boot is cheap.
- **The spec is the interchange** (staging spec, board record) — front-ends and backends decouple through it.
- Loudon builds the Max patches himself; give **precise, testable** Max guidance (he can't paste-and-pray).

## Load these files first
1. `Projects/BLUELINE/BLUELINE — Production Plan.md` (the five tracks) + `BLUELINE.md` (the face).
2. The track reports: `render-backend/track-I-report.md`, `proofs/track-III-clock/track-III-report.md` +
   `M4L-DEVICE-SPEC.md`, `proofs/track-IV-bench/track-IV-report.md`, `proofs/track-V-motion/track-V-report.md`,
   `proofs/track-II-lora/track-II-report.md` + `TRAIN.md`.
3. `Shop/RunPod GPU Backend.md` (+ `pod-comfyui-client.py`) and `render-backend/pod_runner.py` for the backend.

## On pickup (the catcher's checklist)
1. State the move back in one sentence (test the qmetro fix + train the LoRA, then M0). If you can't, the
   baton wasn't caught — stop and ask Loudon.
2. This baton was authored Mac-side and is committed — that commit is its archive.
3. Mark it caught: delete this baton file (git is the archive) and remove any "Active Baton" marker from `BLUELINE.md`.
4. Act on the move, holding the calibrations above.
