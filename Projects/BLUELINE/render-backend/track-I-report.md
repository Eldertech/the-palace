# BLUELINE Track I — The GPU Substrate (report)

**Date:** 2026-06-14 · Mac-side Claude Code · [[BLUELINE — Production Plan]] Track I — make RunPod
Shop-wide. The unblocker (Tracks II & V wait on it).
**Question:** can a board record drive a remote, self-owned GPU end to end and get the result back —
and does the Study→pod / Piece→serverless routing split hold?

## Account state found (read-only survey)

- Two **serverless** endpoints, both parked at `workersMax=0`: **palace-flux** (`iy3ybd7qjl2trj`,
  image `worker-comfyui:5.8.4-flux1-dev-fp8` — FLUX dev fp8 **baked in**, 70 GB disk, no volume) and
  **palace-comfyui**. **No network volumes, no pods.**
- palace-flux had 92 completed jobs — proven for FLUX txt2img; its image has **no FLUX-ControlNet /
  OpenPose preprocessor** (those need a volume or a custom image — Phase B).

## Phase A — Piece→serverless, PROVEN end to end ✅

`serverless_runner.py` (stdlib-only, reuses the **board contract** from `board_template.txt`) drove
**board 04A** through palace-flux:

1. Parsed the board → built the FLUX payload (POSITIVE + FLUX_SEED + the BIBLE's render dims).
2. `POST /run` → polled `/status` through the **cold start** → `COMPLETED`.
3. Retrieved the base64 image → `out/serverless/04A_piece_serverless.png` (1.4 MB).

**282 s total** (cold boot + draining 3 old queued jobs + ~30 s actual FLUX gen); endpoint re-parked to
`workersMax=0` immediately after. The render is **on-brief** for 04A (Maya, copper undercut, charcoal
flight jacket, derelict greenhouse, blue light) — proving the board → remote-GPU → retrieve loop.

**Honest read:** the result is an eye-level medium shot, **not** the board's `low-angle | wide | 35mm`
— because serverless FLUX is **txt2img**: the ANGLE lived only in the prompt and FLUX took its centered
default. This is the exact front-on default that **Phase B's ControlNet** (the board's POSE/DEPTH
passes) exists to defeat — the [[Blocked, Not Prompted]] lesson, now at the render-backend layer.

**Substrate unknown retired:** a board record *can* drive a remote self-owned GPU end to end and pull
the result back. The runner + transport + retrieval work. Routing: **Piece→serverless confirmed.**

## Phase B — volume + pod + FLUX-ControlNet, PROVEN end to end ✅

The Study/self-owned-worker half + the conditioning. Steps actually run:

1. **Network volume created** — `blueline-models` (`aqm8oev4b0`, 30 GB, EU-RO-1). The persistent store
   the Maker's `runpod` host class points at. **Kept** (holds the ControlNet so future runs skip the
   download) — ~$2/mo storage, deletable anytime.
2. **Pod stood up** — reused the FLUX-baked image `worker-comfyui:5.8.4-flux1-dev-fp8` as a pod on an
   **RTX 4090** (24 GB, SECURE, $0.69/hr), volume mounted at `/workspace`, port 8188/http. A
   `dockerStartCmd` downloaded **FLUX ControlNet Union Pro** (~6.6 GB) onto the volume, symlinked it into
   `/comfyui/models/controlnet`, and started the ComfyUI server. (Community 4090s were sold out in
   EU-RO-1; SECURE had them — gotcha: the volume pins the DC, so GPU availability is DC-bound.)
3. **Drove FLUX-ControlNet via the hardened transport** — `pod-comfyui-client.py` (browser-UA header +
   curl multipart upload) drove `flux-controlnet-openpose.workflow.json` with **Track IV's geometric
   pose** `IV-A_openpose.png` (sword-draw lunge). Output: `out/pod/IV-A_pod_flux_controlnet.png`.
4. **Pod terminated** immediately after (billing stopped). Whole pod life ~10 min ≈ **$0.12**.

**Result:** an armored warrior posed to the skeleton (off-centre, sword arm following the conditioning)
in a dark-fantasy scene — **the blocked composition, not the centered txt2img default of Phase A.**
[[Blocked, Not Prompted]] now holds on a self-owned RunPod GPU, closing the S1 → Track IV → Track I loop
(Blender geometric pose → remote FLUX-ControlNet render). **Study→pod + FLUX-ControlNet confirmed.**

**Gotcha — macOS Python SSL:** `pod-comfyui-client.py`'s urllib calls failed cert verification on
framework Python (no CA roots); fixed by the certifi/unverified-context fallback (the same fix
`palace_studio.py` already had). The curl upload path was unaffected.

## Routing split — confirmed both halves

| Tier | Path | Proof |
|---|---|---|
| **Piece** | serverless (`palace-flux`) | Phase A: board 04A → FLUX txt2img → retrieved (282 s, then re-parked) |
| **Study** | pod (4090 + volume) | Phase B: IV-A pose → FLUX-ControlNet-Union → retrieved (~$0.12, then terminated) |

## Remaining (small, no spend)

- **Merge the title-contract into the hardened-transport client** (make `pod-comfyui-client.py`
  board-driven like `serverless_runner.py` — both already exist; the merge is mechanical).
- Wire the `runpod` host class into `Artifacts/Shop/host-capability.json` **in lockstep with the Maker
  Roster** (per `backend-design.md`).

## Ships to the palace

- `serverless_runner.py` — the Piece→serverless board runner (the Shop's first self-owned-GPU dispatch).
- (Phase B) the board-driven hardened-transport pod runner + the network-volume layout → the `runpod`
  host class for the Maker (in lockstep with `host-capability.json`).
