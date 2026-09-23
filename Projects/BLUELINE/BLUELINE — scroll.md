---
title: "BLUELINE — scroll"
born: 2026-09-23
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: scroll-for
forward_vector: "I am BLUELINE's scroll — the one page that always opens on where the project stands now, then reads down through everything it has made, newest first. My top is regenerated from the board and the palace whenever anyone looks; my standing orders are Loudon's and never regenerated; my trail only ever grows."
---

# BLUELINE — scroll

> The project's front door. **Now** is regenerated on every look; **Standing Orders** are Loudon's; **The making** is the trail, newest first. Rendered in [[STIGMERGY]]'s PROJECTS deck; the entry [[BLUELINE]] stays the considered truth and this is the live one. See [[The Scroll]].

<!-- scroll:now:start -->
## Now

> _Regenerated 2026-09-23T04:36:43.543Z from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — steer the project in **Standing Orders** below, never here._

- **Status:** active · **Stage:** growing · **Steward:** none — this project has no permanent steward yet
- **Waiting on you:** nothing
- **Last shipped:** 2026-06-21 (93 days ago) — result (`blueline-m37-m4-result-2026-06-19`)
- **Last commit touching this project:** 2026-09-03 `1b67a68` — edit(close-2026-09-02): the counter-discipline gets its proof; the deposit sheds what it grew

### Where this stands

**move:** M3.7 cumulative-sequence test + M4 hyperreal-impact reconnaissance (batched, one pod) **verdict:** render_noise_bet_closed; M4_identity_holds_at_baseline **m3 7:** 6-frame coil->leap, seed-lock vs per-step warped chain, scored on adjacent-frame coherence. SEED-LOCK WINS (adjacent embed 0.858 vs 0.809, color +0.596 vs +0.476); the warped chain wanders. Across EVERY regime (single jump M3.6 + sequence M3.7) flow-warped noise never beats seed-lock at the render. 'Move the noise at the render' is RETIRED; the flow field stays the compositional/FX spine (M2). Track V novel-core unknown = clean no. **m4:** comic<->hyperreal pair (same pose+N_A, two style prompts), boards A&B. Identity a…

### Open asks

_None — nothing is waiting on you._

### Decided

_Nothing decided on the board yet._

<!-- scroll:now:end -->

## Standing Orders

<!-- scroll:orders:start -->
_Loudon's standing direction for this project. The steward reads this zone every cycle before anything else, and it is never regenerated. Taste, priorities, "stop asking me about X", "always prefer Y" — write it once here instead of answering it every cycle._
<!-- scroll:orders:end -->

## The making

<!-- scroll:making:start -->
<!-- scroll:entry id="blueline-m37-m4-result-2026-06-19" -->
### 2026-06-21 — M3.7 cumulative-sequence test + M4 hyperreal-impact reconnaissance (batched, one pod)

**move:** M3.7 cumulative-sequence test + M4 hyperreal-impact reconnaissance (batched, one pod)
**verdict:** render_noise_bet_closed; M4_identity_holds_at_baseline
**m3 7:** 6-frame coil->leap, seed-lock vs per-step warped chain, scored on adjacent-frame coherence. SEED-LOCK WINS (adjacent embed 0.858 vs 0.809, color +0.596 vs +0.476); the warped chain wanders. Across EVERY regime (single jump M3.6 + sequence M3.7) flow-warped noise never beats seed-lock at the render. 'Move the noise at the render' is RETIRED; the flow field stays the compositional/FX spine (M2). Track V novel-core unknown = clean no.
**m4:** comic<->hyperreal pair (same pose+N_A, two style prompts), boards A&B. Identity across the style jump = 0.72 mean embed_cos >= 0.60 Track II target, with NO identity model (color~0, expected). 'Same face in two registers' risk is tractable. Caveats: embed=scene-sim not face-ID (Track II assess.py); comic register soft from prompt alone (needs style LoRA). Full M4 gated on Track II, not a new unknown.
**design rule:** panel-render coherence = seed-lock + pose ControlNet + identity + depth + img2img. Flow field = compositional/FX spine, NOT a render-noise mechanism.
**next:** Track II (style LoRA + PuLID) unblocks full M4; M5 sync server; or merge feature/blueline-m3 to main (M3 thread fully closed).
**cost usd cumulative:** 0.62

**Artifacts:**
- [m3.7-report.md](Projects/BLUELINE/proofs/m3-warped-noise/m3.7-report.md)
- [m4-report.md](Projects/BLUELINE/proofs/m3-warped-noise/m4-report.md)
<sub>`blueline-m37-m4-result-2026-06-19` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="blueline-m36-result-2026-06-19" -->
### 2026-06-19 — M3.6 delta sweep (seed-lock vs flow-warped across 48-483px)

Swept the A->B pose at 48/96/169/290/483px (one pod, 11 renders). On embed_cos (identity, primary) seed-lock and flow-warped are TIED at every delta (delta within +-0.035, no trend); color_corr is variance-noise (warp wins at 96px, loses at 169/290). Even white and even at small deltas, flow-warped noise does NOT beat seed-lock for a single staged jump: seed-lock is near-ceiling (0.92-0.96) at small deltas so there's no headroom, and n=1 renders are variance-dominated. The Flow-Field-is-the-Spine bet survives only as a cumulative multi-frame SEQUENCE hypothesis (drift compounds).

**Artifacts:**
- [m3.6-report.md](Projects/BLUELINE/proofs/m3-warped-noise/m3.6-report.md)
<sub>`blueline-m36-result-2026-06-19` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="blueline-m3p5-result-2026-06-19" -->
### 2026-06-19 — M3.5 whiteness-preserving noise warp

M3's collapse was half implementation bug. The correct warp (forward-splat + per-cell L2-normalize + disocclusion hole-fill; HIWYN/Go-with-the-Flow core; nearest splat lag-1 autocorr 0.001 == base white) renders COHERENT, not rainbow (local SDXL + pod FLUX). But at the 482px delta the fixed warp ~TIES seed-lock (embed 0.709/color 0.373 vs 0.744/0.380), it does not beat it. Naive M3 was 0.508/0.016. Reading: warping noise across one giant staged jump (~34% disoccluded) ties the shared latent; GtF's gain is in SMALL incremental motion. The Flow-Field-is-the-Spine bet is a within-shot tool, not between-panel.

**Artifacts:**
- [m3.5-report.md](Projects/BLUELINE/proofs/m3-warped-noise/m3.5-report.md)
<sub>`blueline-m3p5-result-2026-06-19` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="blueline-m3-result-2026-06-18" -->
### 2026-06-19 — M3 flow-warped noise vs seed-lock @ 482px

Inject path proven end-to-end (NoiseFromNPY -> SamplerCustomAdvanced; b64-inline transport, deterministic). At 482px delta: seed-lock degrades gracefully (embed 0.744 / color 0.380) but naive flow-warped noise collapses to incoherent rainbow striping (0.508 / 0.016). The backward-warp+renorm fixes mean/std but breaks the spatial white-noise prior; reproduced on SDXL AND FLUX (method not bug). The Flow-Field-is-the-Spine bet is untested-at-render, not disproven.

**Artifacts:**
- [flux-controlnet-openpose-inject.workflow.json](flux-controlnet-openpose-inject.workflow.json)
- [m3-report.md](Projects/BLUELINE/proofs/m3-warped-noise/m3-report.md)
<sub>`blueline-m3-result-2026-06-18` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->
<!-- scroll:making:end -->
