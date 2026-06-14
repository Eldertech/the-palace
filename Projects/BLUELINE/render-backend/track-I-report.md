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

## Phase B — volume + FLUX-ControlNet (in progress)

The remaining proof: the board's **POSE/DEPTH conditioning** enforcing composition on a self-owned
worker. Needs the FLUX **ControlNet Union Pro** model (`flux-union-pro.safetensors`, ~6.6 GB) reachable
to a ComfyUI worker. The scaffolding exists: `flux-controlnet-openpose.workflow.json` (FLUX + Union
ControlNet set to openpose, applies a pose image) and `pod-comfyui-client.py` (the **hardened
transport** — browser-UA header + curl multipart upload that beats the RunPod proxy WAF). The merge:
make the hardened-transport client **board-driven** (title-contract patching, like `runner.py`), then
drive a Track IV pose (`IV-A_openpose.png`) through a pod and confirm the blocked composition survives.

Budget for this round: **$20** (Loudon). Plan: create a network volume, stand a ComfyUI pod (reuse the
FLUX-baked image where possible), put the ControlNet model on the volume, drive one board via the
hardened transport, retrieve, **tear the pod down** (stop billing). Status appended as it completes.

## Ships to the palace

- `serverless_runner.py` — the Piece→serverless board runner (the Shop's first self-owned-GPU dispatch).
- (Phase B) the board-driven hardened-transport pod runner + the network-volume layout → the `runpod`
  host class for the Maker (in lockstep with `host-capability.json`).
