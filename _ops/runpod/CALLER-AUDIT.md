---
title: RunPod Caller Audit — Multi-Agent Safety
born: 2026-07-02
links:
  - target: "[[RunPod GPU Backend]]"
    type: connects-to
    label: audit-of
forward_vector: "I record which RunPod callers were single-tenant and what became of each, so the next agent auditing this account can trust the fix is total, not partial."
---

# RunPod Caller Audit — Multi-Agent Safety (2026-07-02)

Retrofit of every RunPod-touching script in the palace after the 2026-07-02 "dud node"
outage — which was two Claudes on one account strangling each other's pods, not a RunPod
failure. Principle: [[assume multi-agent]]. The single-sourced namespace lives at
`_ops/runpod/agent_ns.py` (slug: `$RUNPOD_AGENT_SLUG` → git worktree name → host); the
optional cooperative capacity lease at `_ops/runpod/gpu_lease.py`; the proof at
`_ops/runpod/test_multi_agent.py` (14 checks, two slugged agents cannot see each other's pods).

## The three collision points (all now closed in the fixed scripts)

1. **Shared pod NAME** — one hardcoded name per orchestrator; `list_named`/`cleanup`/`_cull_extras`
   deleted *by name* → killed the other agent's pod. Now `NAME = pod_name("<base>")` → `<base>-<slug>`.
2. **Account-wide startup guard** — `GET /pods` → abort if *any* pod exists → the other agent's
   booting pod aborted this one. Now the guard uses `list_named()` (my namespaced name only).
3. **DELETE-all sweeps / shared `/tmp/pod_id`** — blind sweeps and a shared pod-id handoff file
   raced. Sweeps/culls are name-scoped; the handoff file is `/tmp/pod_id-<slug>`.

## Verdict per caller

### FIXED — pod-lifecycle orchestrators (create + delete pods; the real landmines)

| File | Pod name base | Was | Now |
|---|---|---|---|
| `Projects/BLUELINE/proofs/new-story/pose_pod_orchestrator.py` **(primary)** | `blueline-sdxl-pose-cn` | shared name, all-pods guard, name-cull, `/tmp/pod_id` | namespaced name + scoped guard/cleanup/cull + `/tmp/pod_id-<slug>` + optional `gpu_lease` |
| `Projects/BLUELINE/proofs/m3-warped-noise/sdxl_orchestrator.py` | `blueline-sdxl-pose` | all-pods guard (L111), `/tmp/pod_id` (L66) | namespaced + scoped guard + slugged pod-id |
| `Projects/BLUELINE/proofs/m3-warped-noise/m3_pod_orchestrator.py` | `blueline-m3` | all-pods guard (L148), `/tmp/pod_id` (L86) | namespaced + scoped guard + slugged pod-id |
| `Projects/BLUELINE/proofs/m3-warped-noise/flux_orchestrator.py` | `blueline-flux-pose` | all-pods guard (L100), inline name, `/tmp/pod_id` (L55) | namespaced + added `list_named()` + scoped guard + slugged pod-id |
| `Projects/BLUELINE/proofs/style-lock/instantid_orchestrator.py` | `blueline-instantid` | all-pods guard (L174), `/tmp/pod_id` (L114) | namespaced + scoped guard + slugged pod-id |

### FIXED — transport/worker scripts (drive a pod by id; shared-state race only)

These are always handed `--pod <id>` by their orchestrator, so the race only bit a standalone
human run. Now read via `agent_ns.read_pod_id()` (explicit `--pod` → `/tmp/pod_id-<slug>` →
legacy `/tmp/pod_id` → error, never the wrong pod silently).

- `Projects/BLUELINE/proofs/m3-warped-noise/m3_pod_render.py`, `m3.6_pod_render.py`, `m3.7_pod_render.py`
- `Projects/BLUELINE/proofs/style-lock/instantid_gaze_render.py`, `instantid_composite_regen.py`, `instantid_inpaint_render.py`
- `Projects/BLUELINE/render-backend/pod_runner.py`
- `Shop/RunPod GPU Backend/pod-comfyui-client.py` (module-level `PID` read)
- `Shop/RunPod GPU Backend/walkcycle-movie-batch.py` (`/tmp/walkmovie.json` → `/tmp/walkmovie-<slug>.json`)

### SAFE — no change (verified, not assumed)

| File | Why safe |
|---|---|
| `Projects/BLUELINE/proofs/new-story/pod_backend.py` | Transport bridge; takes a pod id, no lifecycle, no account state. (Task's "probably fine" — confirmed.) |
| `Projects/BLUELINE/render-backend/runner.py` | Targets a pod by `COMFY_URL` env var; never lists/creates/deletes. |
| `Projects/BLUELINE/proofs/blender-handdrawn/followups/rig-openpose/build_deposit.py` | Pure local asset/HTML processing; zero RunPod calls. |
| `Shop/Hero and Avatar Maker/regen_one.py`, `make_faces.py` | Serverless **endpoint** (shared managed infra), scale-to-zero; no single-tenant pod. |
| `Shop/RunPod GPU Backend/serverless-client.py` | Serverless v2 job dispatch by endpoint id; job-scoped, inherently concurrent-safe. |
| `Shop/RunPod GPU Backend/walkcycle-pose-generator.py` | Stateless local pose geometry; no RunPod, no state file. |
| `Projects/BLUELINE/proofs/new-story/{layer_render,render_shot,rich_pipeline,scene_pipeline}.py` | Render scripts invoked with `--pod`; no pod lifecycle. (`pod_backend` covers their transport.) |

## Residual notes / open edges

- **`gpu_lease` is advisory, not a hard mutex.** Namespacing fully prevents pod *destruction*;
  the lease only reduces *capacity contention* and can still be raced (TOCTOU). True serialization
  = a human-brokered TRICKSTER `RESOURCE_REQUEST` with `blocking:true`. Default OFF (`RUNPOD_LEASE=1`).
- **Same-worktree, same-slug caveat.** Two agents in the *same* worktree with no `$RUNPOD_AGENT_SLUG`
  override share a slug and would still collide. Palace discipline is worktree-first (one agent per
  worktree), and the STIGMERGY `session_id` is the intended override for the shared-tree case.
- **The interrupted-orchestrator sweep must now be name-scoped** — see the updated gotcha in
  `Shop/RunPod GPU Backend.md`. A blind `GET /pods → terminate all RUNNING` sweep is itself a
  cross-agent kill.
