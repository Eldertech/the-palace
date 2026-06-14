# RunPod Backend — Palace Shop GPU Compute

A draft backend that gives the Shop a GPU it owns the worker on. RunPod sits as a
new **`runpod` host class** between `cloud` (managed HF Inference / anonymous
Spaces — free but quota-capped and reachability-spotty) and `mac` (full control
but bound to Loudon's machine). It is the durable answer to the wall the
Image-to-3D commission keeps hitting: anonymous HF Spaces reject calls on ZeroGPU
quota, and per-Space reachability is unverified. On RunPod we own the worker, so
there is no quota ceiling we don't control.

This is **compute, not an agent runtime.** It does not touch any Anthropic API.
The Maker decides *what* to dispatch; this backend is *how* the dispatch reaches
a GPU — a plain HTTPS API the agent calls, which fits the
Claude-Code-resident-architecture constraint (no raw API SDK required).

## Files

- `runpod_specialist.py` — the client. Stdlib-only (no pip install). Submit a
  job, poll through scale-to-zero cold start, collect outputs. Verified offline
  via `--mock`.
- `config.example.json` — endpoint ids, network-volume layout, poll defaults.
  Copy to `config.local.json`; the API key never goes here.
- `host-capability.runpod-patch.json` — proposed additions to
  `Artifacts/Shop/host-capability.json` (new `runpod` host class + the
  `Image-to-3D` Specialist + a ComfyUI amendment).
- `workflows/flux_txt2img.api.json` — a reference ComfyUI API-format workflow to
  smoke-test the endpoint.

## Why serverless first

Serverless endpoints scale to zero and bill per second of actual compute. The
Shop's load is spiky — a Specialist commission here, a shoot-out there, nothing
overnight — which is exactly the shape that loses money on an always-on pod and
costs almost nothing on serverless. It also matches the heartbeat optimization
mandate: no GPU sits idle on the meter. A pod is the right tool only for long
interactive iteration; for everything the Maker dispatches programmatically,
serverless wins.

One endpoint serves many Specialists. The endpoint is just "a ComfyUI worker on
a GPU with the model volume mounted." Which Specialist runs is decided by the
**workflow JSON** in the payload, not by standing up a new endpoint per tool.
FLUX text-to-image, SDXL, and the image-to-3D engines all ride the same endpoint
as long as their models live on the shared network volume.

## Architecture — the call flow

```
  Maker (decides tier + Specialist + workflow)
        │  payload = { workflow: <comfy API json>, images: [<base64>] }
        ▼
  runpod_specialist.RunPodEndpoint.run(payload)
        │  POST /v2/{endpoint}/run        ──►  RunPod control plane
        │     ◄── { id, status: IN_QUEUE }      │ boots a worker (cold) or
        │                                        │ reuses a warm one
        │  GET  /v2/{endpoint}/status/{id} ──►   │ worker pulls models from the
        │     ◄── IN_QUEUE / IN_PROGRESS         │ network volume, runs ComfyUI
        │            ... poll w/ backoff ...      │
        │     ◄── COMPLETED + output             ▼
        ▼
  save_outputs(output, dest)  → PNGs (base64) and/or downloaded S3 URLs
        │
        ▼
  Maker brings the work back with a standards report
```

The cold-start grace is the one subtle part. On a scaled-to-zero endpoint the
first request of the session has to boot a worker *and* load models off the
volume before it even reports `IN_PROGRESS`. The poll loop treats a long
`IN_QUEUE` as normal (it logs a note after the grace window but keeps polling to
the full timeout) — the same lesson the ComfyUI Specialist already recorded
about MPS model-load silence, applied to remote cold starts.

## Network-volume layout

A persistent network volume is what makes cold starts tolerable and lets the
three shoot-out engines coexist on one endpoint. Models live on the volume, not
baked into the worker image, so adding an engine is a file copy, not a rebuild.

```
/runpod-volume/
  models/
    checkpoints/        SDXL + FLUX checkpoints
    diffusion_models/   FLUX dev/schnell unet
    3d/
      hunyuan3d-2/      first-stocked engine
      trellis/          TRELLIS.2
      triposplat/       TripoSplat
  output/               meshes / .glb written by 3D nodes
```

Volume storage runs ~$0.07–0.14/GB/month and egress is free, so pulling outputs
back to the palace costs nothing.

## Retrieving meshes (the one gotcha that needs proving)

`worker-comfyui` returns *images* inline as base64 cleanly. **3D meshes are the
open question.** Hunyuan3D/TRELLIS ComfyUI nodes write a `.glb` to the ComfyUI
output dir; that file is on the worker/volume, not automatically in the JSON
response. Three paths, in preference order:

1. Add a node to the workflow that base64-encodes the `.glb` into the response
   (cleanest — the client already decodes arbitrary file entries).
2. Configure the worker to push outputs to S3 and return URLs (the client
   already downloads `s3_url`/`http` entries).
3. Read the `.glb` off the network volume directly.

`save_outputs` handles cases 1 and 2 today and dumps the raw `output.json` plus a
clear note when it finds no inline file — so a 3D job won't silently "succeed"
with nothing retrieved. **This is the thing to verify on the first live 3D run**;
record the working path as a gotcha in the Image-to-3D Specialist entry.

## Cost estimate — the three-model shoot-out

The calibration shoot-out is Hunyuan3D-2 vs TRELLIS.2 vs TripoSplat on one shared
input image. Geometry stage, single subject, plus a few warm reruns for texture
and sanity. Order-of-magnitude on a 48GB L40S/A100-class serverless worker
(~$0.0008–0.0011/sec, i.e. ~$3–4/hr equivalent):

| Phase | What | Time (incl. cold boot) | Approx cost |
|---|---|---|---|
| Subject gen | One FLUX-schnell PNG (24GB GPU) | ~1–2 min first, secs after | < $0.05 |
| Cold start | Boot worker + load 3D models | ~2–4 min, billed | ~$0.10–0.25 |
| 3 geometry runs | one mesh per engine | ~1–3 min each | ~$0.15–0.40 |
| Texture passes | second call per engine, if tested | ~1–3 min each | ~$0.15–0.40 |
| Reruns / verify | seed checks, trimesh inspection | a few min | ~$0.10–0.25 |

**Whole shoot-out: roughly $0.50–1.50 of compute** plus a few cents of volume
storage. The first run is dominated by cold-start and one-time model download to
the volume; repeats are far cheaper because the volume stays warm. For
comparison, this is the kind of run that bounces on free HF ZeroGPU quota and
would otherwise force a Mac handoff.

## Secret handling

The `RUNPOD_API_KEY` lives **only** in the environment, never in a palace file —
same rule as the HF token in the commission baton. The client reads
`RUNPOD_API_KEY` (or takes `api_key=` explicitly for a present-session paste) and
persists nothing. `config.local.json` names endpoints, not secrets, and should
still be gitignored out of habit. If a key ever lands in a tracked file, treat it
as burned and rotate it in the RunPod console.

## Quickstart

```bash
# 0. prove the flow with no key, no endpoint:
python3 runpod_specialist.py --mock

# 1. once an endpoint exists:
export RUNPOD_API_KEY=...            # never written to disk
export RUNPOD_ENDPOINT_ID=...

python3 runpod_specialist.py --health
python3 runpod_specialist.py \
    --workflow workflows/flux_txt2img.api.json \
    --out ./runpod-out
```

From the Maker (or any dispatch script):

```python
from runpod_specialist import RunPodEndpoint, load_workflow, encode_image

ep = RunPodEndpoint(endpoint_id="...")          # key from RUNPOD_API_KEY
out = ep.run({
    "workflow": load_workflow("workflows/hunyuan3d.api.json"),
    "images": [encode_image("shoot_subject.png")],   # the shared shoot-out input
})
saved = ep.save_outputs(out, "Artifacts/Shop/.../shoot-out/")
```

## What this is NOT, and where it ends

It does not replace `cloud` for cheap routine FLUX images — anonymous HF Spaces
and HF Inference stay the Sketch path. It does not host an agent. And it leaves
two things deliberately unproven until a live run: the **mesh-retrieval path**
(above) and **per-engine reachability/licensing** for TRELLIS.2 / TripoSplat
(the commission baton already flags Hunyuan3D-2 = Tencent community license;
record each engine's posture before any Loudon-Live-published use).

## Suggested palace placement

Tooling/machinery, not a canon knowledge entry — so it belongs in a bundle, not
the root. Natural home: `Shop/Image-to-3D/runpod-backend/` (alongside the
Specialist this first serves) or `_ops/runpod/` if it becomes Shop-wide
infrastructure. Merge `host-capability.runpod-patch.json` into
`Artifacts/Shop/host-capability.json` **in lockstep with the Maker Roster** to
avoid three-place drift. Per the Cowork git-lock hazard, commit Mac-side.

_Loudon Live · Autodidact Polymaths_
