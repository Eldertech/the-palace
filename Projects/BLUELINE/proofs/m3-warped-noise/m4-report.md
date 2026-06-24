# BLUELINE M4 — hyperreal impact: identity across the style jump (reconnaissance report)

**Date:** 2026-06-19 · Mac-side Claude Code (feature/blueline-m3 worktree) · the M4 look-ahead spike
([[BLUELINE — Claude Code Job]] Session 4: "one comic↔hyperreal pair, do not over-build").
**Question:** M4's load-bearing risk is **"identity across the style jump"** ([[BLUELINE — Deposit Map]]):
the same board rendered in the **comic register** and the **hyperreal register** — does it read as the *same*
character/scene? Here measured at **baseline (no identity model)** — so this is the bar Track II's
PuLID/FaceID must clear, not the finished answer.

## The test

Two boards (A coil, B leap). Each rendered twice — **same pose (ControlNet) + same noise `N_A`**, only the
style prompt changes:

- **hyper** — `…hyperreal cinematic photograph, volumetric haze, film grain, shallow DoF, photorealistic skin…`
- **comic** — `…bande dessinée comic panel, bold black ink outlines, flat cel-shaded color, screen-tone…`

Scored comic-vs-hyper with the consistency ruler. `m3.7_pod_render.py` (M4 frames) / `m4_score.py`.

## Result — identity/scene survives the jump at baseline ✅ (palette flips, as it should)

| board | comic↔hyper `embed_cos` | `color_corr` |
|---|---|---|
| A (coil)  | 0.689 | −0.006 |
| B (leap)  | 0.752 | +0.018 |
| **mean**  | **0.721** | ~0.00 |

**Mean `embed_cos` 0.721 — above Track II's identity-drift target of 0.60**, with *no* identity model: just
shared pose + shared noise + matched subject prompt. The two registers read as the same scene/subject
(montage `renders-m4/m4-pairs.png`). `color_corr ≈ 0` is **correct and expected** — the whole point of the
style jump is that the palette/rendering changes (flat cel color vs cinematic grade), so colour
*should* decorrelate; identity is carried by `embed_cos`, not colour.

**Two honest caveats:**
1. `embed_cos` is a whole-scene CLIP/DINO similarity, *helped* by the shared pose+noise — it is not a
   rigorous **face**-identity metric. A true face-ID test (InsightFace cosine, already loaded for PuLID) is
   Track II's `assess.py` job. Read 0.72 as "same composition/subject survives," the structural precondition
   for identity, not "same face proven."
2. **The comic register is soft.** FLUX from a prompt alone yields a *stylized/graphic* look, not crisp flat
   BD ink — the model resists hard cel-shading without a **style LoRA**. That gap is exactly Track II's style-LoRA
   reason for existing; M4's crisp two-register transduction depends on it.

## What this means for BLUELINE

The "**same face in two registers**" risk is **tractable** — the structural baseline already clears the 0.6 bar
before any identity model, so PuLID/FaceID (Track II) has headroom to push it higher, and the comic↔hyperreal
*impact-expansion* (a panel blowing up into a hyperreal money-shot) is viable. The dependency is named: a
**style LoRA** for a crisp comic register and **PuLID** for rigorous face-hold — both Track II. M4 is **green
at the spike level**; full M4 waits on Track II's two assets.

## Ships to the palace

- `m4_score.py` (comic↔hyper identity-hold scorer + 2×2 montage) + `renders-m4/` (4 frames + montage + verdict).
- The two-register prompt pair (hyper / comic) as the M4 recipe seed.
- Finding → [[BLUELINE — Render Backend]]'s "identity across the base swap" line: baseline 0.72; Track II to beat it.

## Cost

M4 shared the M3.7 pod (4 of 15 frames). Marginal cost ≈ **$0.03**. Cumulative M3+M3.5+M3.6+M3.7+M4 ≈
**~$0.62** (six pods; three early aborts on the now-hardened proxy, one capacity-retry ride-out).

## Status

M4 reconnaissance **done, green**: identity/scene survives the comic→hyperreal jump at baseline (0.72 ≥ 0.6).
Full M4 (crisp comic register + rigorous face-hold) is **gated on Track II** (style LoRA + PuLID), not on any
new unknown. The "two registers" risk is retired as a *blocker*; it's now a *build*.
