---
type: meta
status: growing
links:
  - target: "[[The Shop]]"
    type: connects-to
    label: hub-header-brief
  - target: "[[Shop/Maker]]"
    type: directed-by
  - target: "[[Shop/ComfyUI]]"
    type: produced-by
  - target: "[[Shop/Midjourney]]"
    type: missing-counterpart
  - target: "[[Flocking — Maker's Comparison Recommendation]]"
    type: mirrors
    label: prior-comparison-shape
tags: [meta, shop, maker, comparison, recommendation, header, half-comparison]
forward_vector: "I am the half-comparison Phase D could deliver: ComfyUI's local-control side ran, Midjourney's cloud side did not, and the recommendation is honest about that absence rather than pretending the missing half doesn't matter. Pick me up when Midjourney access lands and I become a proper two-sided Comparison."
---

# Shop Header — Maker's Comparison Recommendation (half — Midjourney blocked)

**Authored 2026-05-30** as Phase D of [`SHOP-BUILD-SESSION-2026-05-30.md`](../../../SHOP-BUILD-SESSION-2026-05-30.md). This document follows the shape of the [[Flocking — Maker's Comparison Recommendation]] (the only prior Maker-authored Comparison) — but with one half missing on purpose.

## The brief

A header for [[The Shop]] itself — the front-door entry whose forward vector is *"validated at all three tier points, proven as a coordinating foreman, defended against host-mismatch waste, systematically testable, and finished on its oldest open comparison."* The header should evoke: ordered craft discipline, focused light on disciplined work surfaces, the spirit of a master printmaker's studio. No figures (the Shop is the *space and the tools*, not a person). Banner dimensions for a hub-entry header (12:5, 1536×640 SDXL-friendly).

## What ran

| Specialist | Outcome | Cost | Reproducibility artifact |
|---|---|---|---|
| **[[Shop/ComfyUI|ComfyUI]]** (SDXL base, seed 30, 30 steps, CFG 7.0, euler/normal, 1536×640) | One Sketch-tier image, palette in family with Graphite skin (warm amber + deep near-black), composition reading as a workshop interior at dusk with disciplined rows of work surfaces and tall industrial windows | 114.4 s wall-clock on Mac MPS | `shop-header-workflow.json` + `shop-header.report.json` |
| **[[Shop/Midjourney|Midjourney]]** | **DID NOT RUN — access unavailable this session** (per the 2026-05-30 brief intake, Loudon confirmed no working Midjourney path; the handoff explicitly anticipated this and instructed *do not fake the comparison*) | — | — |

## The ComfyUI result, read honestly

The output (`shop-header-comfyui.png`) shows a workshop interior from a slightly elevated angle: tall industrial windows on the left and back walls pour warm amber light onto a foreground of long benches and presses arrayed in disciplined geometry; timber beams overhead; deep shadows in the corners; no figures.

What the prompt asked for that *landed*:
- Composition reads as the studio space, not as an object or a scene-of-action.
- Ordered geometry — the benches are in rows, the windows are regular; this looks like a place where craft happens, not a romantic ruin.
- Palette in the right family (amber + dark) for the [[Loudon Live Design System]] Graphite skin.
- No figures (negative prompt held).

What didn't land:
- The dust motes / light rays the prompt asked for are muted — the painterly atmosphere is more "even soft light" than "ray-casting the dust."
- The benches read as *empty* — no in-progress work visible. The prompt didn't insist on tools on the surfaces, and SDXL filled them in clean. The header would benefit from a second prompt pass that names a few specific tools (a press, paper stock, a roller) without breaking the no-figures rule.
- The amber is in family with `#e8b84a` but warmer / browner — closer to wood tone than to Graphite-accent. A palette LoRA or a stricter prompt color anchor would tighten this.

**My read as foreman:** this is a *Sketch-tier first-try* that proves the brief is well-formed and the workflow is correct. It's usable as a placeholder header. Promotion to Piece would want two more seeds (compare composition variance), a refined prompt naming specific tools on the surfaces, and possibly a Graphite-skin palette LoRA. Standard refinement loop, not a re-think.

## The missing half — what comparison would have told us

The whole *point* of the Phase D Midjourney↔ComfyUI Comparison is to sharpen one of the Maker's load-bearing Selection Heuristics:

> *"Mood, atmospheric, narrative imagery → Midjourney for highest aesthetic ceiling, ComfyUI when palette discipline, seed reproducibility, structural control (ControlNet), or local execution matters more than ceiling. Default to ComfyUI when in doubt — local-first is the house preference."*

Specifically, the Comparison would have told us:

1. **Does Midjourney clear the ceiling ComfyUI can't reach on atmospheric/painterly briefs?** If Midjourney's first-try is *visibly more cinematic* than ComfyUI's Sketch (without three reroll passes), the "highest aesthetic ceiling" claim is real. If they're comparable on first try, that claim is rhetorical and the heuristic should drop the "ceiling" framing.
2. **What does Midjourney's *cost* look like in this brief register?** Credits, time, prompt-iteration friction.
3. **Does the "Default to ComfyUI when in doubt" line survive a real head-to-head?** A confident default needs at least one real comparison behind it.

Without the Midjourney half, the heuristic stays as-stated — *unrevised and unconfirmed*. This is a real gap.

## My recommendation

**Use the ComfyUI Sketch as a placeholder** for any header need on [[The Shop]] that surfaces in the next session or two. It is good enough to ship as the working-draft hub header — it carries the brief's spirit (ordered workshop, focused light) and honours the Graphite-skin family.

**Do NOT update the "Default to ComfyUI when in doubt" Selection Heuristic** on the basis of this half-comparison. A heuristic about *defaults* needs evidence from *both* candidates; with only the ComfyUI side run, the only honest update would be "we still don't know," which is what we already had.

**The deferred Midjourney↔ComfyUI Comparison is now Phase D's outstanding work**, not done. When Midjourney access lands, re-run *this same brief* (same prompt, same dimensions, same target use) on Midjourney; bring the result back here and finish the recommendation. The brief + the ComfyUI artifact + this document are the reproducibility package for the deferred half.

## Roster + frontmatter implication

[[Shop/Midjourney|Midjourney]] **stays a stub** — no real job landed for it this session. The Roster's `stub (2)` line is unchanged. The Roster's drift watch holds.

## What this Comparison taught about Comparisons

Even a half-comparison is worth running — it surfaces what the missing half would have *told* you, which makes the gap legible. The unfinished Round-1 Midjourney↔ComfyUI Comparison sat as a quiet "we never got to it" for two weeks; this document turns it into a named, dated, scoped piece of outstanding work with a reproducibility package already half-built. That's a different shape of "unfinished."
