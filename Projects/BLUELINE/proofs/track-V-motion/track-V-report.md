# BLUELINE Track V — Motion Coherence (report, first rung)

**Date:** 2026-06-14 · Mac-side Claude Code · [[BLUELINE — Production Plan]] Track V — the #1 risk
(closes [[Shop/RunPod GPU Backend]]'s "stitched-stills flicker" horizon). Ran the moment Track I's
backend existed, per the de-risk-early discipline.
**Question:** does frame-to-frame coherence (identity + costume + environment) hold across a motion, or
does independent-frame rendering flicker — and can we get it back cheaply?

## The test (smallest useful, on the warm RunPod backend)

A **2-pose motion pair** — two run-cycle phases as geometric OpenPose skeletons (`runA`/`runB`,
`motion_pair.py` → `draw_pair.py`, projection-only, no render) — rendered **four ways** through the
board-driven pod runner (`pod_runner.py`) on a RunPod **A100** with FLUX-ControlNet-Union, same prompt
throughout ("a young woman warrior running, long copper braid, teal scarf, worn leather armor…"):

| condition | seeds | expectation |
|---|---|---|
| **Independent** (baseline) | A=1001, B=2002 | the stitched-stills **flicker** — identity drifts |
| **Linked** (naive coherence) | A=777, B=777 | the character **holds** across the stride |

Contact sheet: `renders/CONTACT-coherence.png`.

## Result — the flicker is real, and seed-locking substantially defeats it ✅

- **Independent baseline DRIFTS hard.** `indep_A` is a fair-skinned warrior with loose red hair in a
  misty forest; `indep_B` is a darker-skinned warrior with braided hair in a stone temple — **different
  identity, different costume, different environment** frame-to-frame. This *is* the flicker the
  RunPod walk-cycle hit; reproduced cleanly.
- **Shared-seed pair HOLDS.** `linked_A` and `linked_B` are the **same** copper-braided, teal-armored
  warrior in the **same** misty forest — only the stride changes. Same noise seed + same prompt + the
  pose ControlNet anchors identity, costume, *and* environment across the two phases.

**Verdict on the #1 risk: workable.** Frame-to-frame coherence on this backend is achievable; the
flicker is tractable, not fundamental. A confident "yes" on the riskiest BLUELINE bet, surfaced cheaply
(~$0.18 of A100 time).

**Quantified by the consistency ruler** (`render-backend/consistency_ruler.py` — a CNN-embedding +
color-histogram metric, Track II's "assess ruler"):

| pair | `embed_cos` (semantic) | `color_corr` (palette) |
|---|---|---|
| **linked** (shared seed) | **0.880** | **0.935** |
| **independent** (baseline) | 0.818 | 0.173 |

The palette/costume number is the headline: **0.94 vs 0.17** — a 5.4× consistency gap. Seed-locking
holds the look; independent seeds scatter it. The ruler turns the eyeball verdict into a number and is
reusable for Track II (identity across a base-model swap) and M4 (identity across the comic→hyperreal
jump).

## Honest limits (this is the FIRST rung, not full coherence)

- **Seed-locking is the cheapest lever, not the whole answer.** It holds because the two poses are
  *similar* and the shared latent anchors the draw. Across larger pose deltas or a long sequence, FLUX
  re-interprets and seed-locking alone degrades — the published path is **flow-warped noise**
  ([[Go-with-the-Flow]], Session 3's precedent), which warps the *noise itself* along the motion so
  coherence survives big moves. That's the next rung.
- **Facing ambiguity.** The same OpenPose skeleton rendered **front** (`indep_A`) and **back**
  (`linked_A`) — the 2D skeleton doesn't disambiguate front/back; seed/prompt resolved it by luck.
  BLUELINE's fix is already in hand: **add the Blender depth pass** (depth encodes front/back limb
  ordering — the toyxyz recipe's exact point). Depth-conditioning locks facing that pose alone cannot.
- **No dedicated identity model yet.** Stronger identity hold wants IP-Adapter / PuLID-Flux on top —
  not tested here (keeps the rung cheap).

## The coherence stack (named, for M4/M5)

1. **Seed-lock + shared prompt** — proven here; the cheap floor.
2. **+ Depth conditioning** (Blender) — locks facing + limb ordering.
3. **+ Identity** (IP-Adapter / PuLID-Flux) — locks the face/costume across big moves.
4. **+ Flow-warped noise** ([[Go-with-the-Flow]]) — the field-driven top rung for long sequences (this
   is where Track V meets Track III's flow-field spine and the Clock).

## Ships to the palace

- `motion_pair.py` + `draw_pair.py` — emit a multi-phase pose sequence as OpenPose conditioning.
- the coherence finding → the M4 "Hyperreal Impact" / identity-across-frames work, and the recipe for
  *how* to keep a sequence coherent (the stack above). Reuses `pod_runner.py` (Track I) unchanged.
