---
title: next-run-commission
born: 2026-06-08
links:
  - { target: "[[Shopkeeper]]", type: connects-to, label: commission-for }
forward_vector: "I carry the approved commission for an Image-to-3D Specialist; I want to be executed on the next Shopkeeper run and then retired into a real entry."
---

# Next-Run Commission — Image-to-3D Specialist

**Status:** EXECUTED 2026-06-23 (Shopkeeper morning sweep). Stub entry deposited at `Shop/Image-to-3D Smith.md`. Full shoot-out in `probes/2026-06-23-image-to-3d-shootout/`. Five decisions posted to TRICKSTER board (id: e2c20da5-7677-4008-add2-4164a7af1829). This file can be deleted once Loudon has reviewed the decisions.

This is a durable baton: `sweep-latest.md` is overwritten each run, so the approval lives here. Delete or mark this file done once the commission is complete.

## What was approved
1. **Deposit a new Specialist** — provisional **Image-to-3D smith** (Hunyuan3D-2 first-stocked engine). Per the show-before-writing discipline, draft the entry and show Loudon before writing if he's present; if unattended, write the entry as a **stub** (status: stub) per the Roster taxonomy and surface it in the dossier for his review — do not silently promote to alive.
2. **Run the calibration Comparison** — Flocking-pattern shoot-out: **Hunyuan3D-2 vs TRELLIS.2 vs TripoSplat** on ONE shared input image (same seed/subject for all three), so the three are legible as the same thing. Produce a Maker-style Comparison Recommendation feeding a new image-to-3D Selection Heuristic.

## Concrete starting points (proven 2026-06-08)
- Reachable tokenless path: `tencent/Hunyuan3D-2` Space, `/shape_generation` endpoint, anonymous Gradio API. Working call archived in this bundle's `probe-log.md` and `probes/2026-06-08-image-to-3d/`.
- `pip install --break-system-packages gradio_client trimesh matplotlib`. Verify meshes with trimesh (vert/face counts, bounds); render point-cloud multiviews with Matplotlib (no GPU needed).
- Shared input for the shoot-out: generate one clean studio subject via FLUX-schnell (anonymous), reuse the exact PNG for all three engines.

## Caveats to carry into the entry
- **Reachability is per-Space.** Stable-Fast-3D rejected the anonymous call (likely ZeroGPU quota); TRELLIS.2 / TripoSplat reachability is UNVERIFIED — confirm in the run, and if a Space rejects anonymous, note "needs HF token or mac handoff" rather than faking it.
- Geometry/shape stage only was probed; texture is a second call — test or flag it.
- **License:** Hunyuan3D-2 = Tencent community license. Read and record the license posture for each engine before any monetized/Loudon-Live-published use. This belongs in the entry's honest-cost section.
- Host class: cloud-via-HF (free today) for Sketch/Study; token'd HF or mac/local GPU for Piece-grade reliability. Add to `Shop/Maker/host-capability.json` when the Specialist is deposited.

## If a Space needs an HF token (instructions Loudon approved 2026-06-08)

Try anonymous first (Hunyuan3D-2 works anonymously). If TRELLIS.2 / TripoSplat / Stable-Fast-3D reject the anonymous call with a quota/auth error, do NOT fake it. Surface it to Loudon with these exact steps:

**Create the token:** huggingface.co (signed in as Loudon) → avatar → Settings → Access Tokens (huggingface.co/settings/tokens) → **+ Create new token** → type **Read** → name `cowork-shop-3d` → Create → copy the `hf_…` value (shown once). A free logged-in token grants some ZeroGPU quota; if it still hits limits, **HF PRO ($9/mo)** raises ZeroGPU quota (Settings → Billing, no new token needed).

**Secret handling — do NOT write the token to any palace file (it would be committed to git).** Two clean paths:
- *Token path (best when Loudon is present):* he pastes `hf_…` into chat; use it for that session only via `Client(space, hf_token="hf_...")`; never persist it.
- *Mac handoff (best for unattended runs):* the Mac's local GPU runs the 3D models with no token and no quota ceiling — preferred fallback for any leg that rejects anonymous.

For an unattended run: attempt anonymous, complete whatever legs work (Hunyuan3D-2 at minimum), and report which legs need a token-or-mac so Loudon can finish them. Never block the whole commission on the token.

## Done-when
- Image-to-3D smith entry exists (stub or, if Loudon present and approves, alive on the shoot-out job).
- Comparison bundle + recommendation written; image-to-3D Selection Heuristic drafted for the Maker.
- Maker's Roster + frontmatter updated in the same move (avoid three-place drift) — propose in dossier; Loudon commits Mac-side.
