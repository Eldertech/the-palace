# The Living Balloon — findings + ready-to-run membrane experiment

**2026-07-02.** Crossing the balloon catalog with the Lettering specialist's gen-AI
pipeline so the **bubble and its word are one gen-AI material object**, not a flat mask.

## The move (works)
Build ONE canny guide = the balloon OUTLINE + the word skeleton (voice font) inside it,
on black; feed to SDXL + `controlnet-canny-sdxl` and let diffusion render the whole thing
out of the same living material (bleeding ink, flame). [[Blocked, Not Prompted]] applied
to the balloon, not just the letterform. Bench: `../balloon_material.py`, `../balloon_sweep.py`,
`../../new-story/balloon_pod_render.py`. First real render (`sweep/cn0.35_end0.4.png`) is
dramatic living pen-and-ink with a blood splatter through a legible "TOO LATE".

## Finding 1 — the canny sweet spot (partial local sweep)
Swept control **strength × end_percent** on the bleeding "too late" bubble. Completed
cells (`sweep/`): cn {0.35, 0.5} × end {0.4, 0.7}. Result:
- **cn=0.35 (too loose):** max drama, but the **bubble shape dissolves** into the ink
  field — an abstract word-in-swirl, not a speech balloon.
- **cn=0.5 (holds):** the speech balloon reads as a proper shape, the word is legible,
  and there's real drama — **but the drama is in the *interior*** (blood splatter, drips,
  grungy paper). `end=0.4` vs `0.7` is a minor rim-roughness difference.
- **Sweet spot for a dramatic bubble that still reads as a bubble: cn ≈ 0.5.**
- (Higher strengths 0.65/0.8/1.0 not yet rendered — predicted to hold the bubble but with
  progressively *cleaner* rims.)

## Finding 2 — the membrane needs a different lever (THE queued experiment)
At the strength that keeps the bubble legible, the **rim stays a clean drawn line** — the
membrane does *not* bleed. Canny strength alone can't fix this: raise it → cleaner rim;
lower it → the whole bubble melts. **Making the membrane itself living material needs a
thicker/rougher rim in the guide** (giving diffusion a band to render as material).

**Ready to run:** `../../new-story/balloon_pod_render.py` already builds this —
`build_guide(..., rim=30, rough=True)` — and the batch is:
1. **Membrane:** thick rough-rim guide, cn {0.4, 0.5, 0.6}, end 0.4 — does the membrane bleed?
2. **Backfill:** thin rim, higher strengths cn {0.65, 0.8, 1.0}, end 0.4.
3. **Range:** sweet spot (cn0.5) across materials — flaming "BURNING", shattering "THOOM".

**How to run when GPU is stable:**
- *RunPod (when not flaky):* `cd Projects/BLUELINE/proofs/new-story && POD_CANNY=1 <comfy venv>/python pose_pod_orchestrator.py --render-script balloon_pod_render.py`
  (the orchestrator now gates readiness on **SDXL + canny both present**).
- *Local MPS (when ComfyUI is back on GPU):* point `balloon_pod_render`'s proxy at
  `127.0.0.1:8188`, or run `balloon_sweep.py` / `balloon_material.py` directly.

## Infrastructure notes (hard-won this session)
- **Local ComfyUI dropped from MPS (~180s/render) to CPU (~13 min/render)** and the
  `end=1.0` cells timed out at 900s. A wedge from an orphaned prompt compounded it;
  `/queue clear` does **not** flush ComfyUI's node cache (a re-submitted identical prompt
  returns in ~2s from cache — not a failure).
- **RunPod pod boot is flaky:** a pod went RUNNING then the container exited ~2 min in and
  ComfyUI never served (bad host / CUDA init crash). Add a CUDA≥12.6 host filter before
  retrying.
- **RunPod create can leak a SECOND untracked pod.** The orchestrator tore down the pod it
  recorded (404, confirmed) but a sibling was left RUNNING and billing; only a post-run
  `GET /v1/pods` sweep caught it. **Rule reinforced: always sweep `/v1/pods` after any pod
  run and DELETE anything named `blueline-sdxl-pose-cn`** — don't trust the orchestrator's
  own teardown alone. (Deposited into [[RunPod GPU Backend]].)

## Status
Paused on infra (RunPod flaky + local CPU). Findings banked; the membrane experiment is
queued and ready. Resume when a GPU is stable — no code changes needed, just run the batch.
