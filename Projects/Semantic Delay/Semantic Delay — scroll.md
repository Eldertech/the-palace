---
title: "Semantic Delay — scroll"
born: 2026-09-23
links:
  - target: "[[Semantic Delay]]"
    type: connects-to
    label: scroll-for
forward_vector: "I am Semantic Delay's scroll — the one page that always opens on where the project stands now, then reads down through everything it has made, newest first. My top is regenerated from the board and the palace whenever anyone looks; my standing orders are Loudon's and never regenerated; my trail only ever grows."
---

# Semantic Delay — scroll

> The project's front door. **Now** is regenerated on every look; **Standing Orders** are Loudon's; **The making** is the trail, newest first. Rendered in [[STIGMERGY]]'s PROJECTS deck; the entry [[Semantic Delay]] stays the considered truth and this is the live one. See [[The Scroll]].

<!-- scroll:now:start -->
## Now

> _Regenerated 2026-09-23T04:36:43.543Z from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — steer the project in **Standing Orders** below, never here._

- **Status:** active · **Stage:** growing · **Steward:** cycle 7 · last ran 2026-06-25 (90 days ago)
- **Waiting on you:** nothing
- **Ready to advance:** no unread answers
- **Last shipped:** 2026-06-23 (91 days ago) — Stage 3 multi-voice-taps wired and proven against the stub — three spirit converts, three scheduled taps, one rendered WAV. (`semantic-delay-steward-011`)
- **Last commit touching this project:** 2026-09-22 `d812056` — ops(Semantic Delay): flush working proofs, renders + code
- **Signal:** ⚠ the last cycle posted nothing (one barren cycle — the lane will retry before calling it stalled)
- **Drift:** no consolidation marker on the entry — nothing to measure against.

### Where this stands

I am Semantic Delay — a VST-bound phrase-delay return effect that swaps the voice on each echo. Phase 1 is the voice-swap path (SoulX-Singer-SVC; no LLM yet). Stage 0 cleared on M1 Max in April (RTF≈1.65, MPS patches in repo); Stages 1–2 stood up the stub-daemon + standalone instrument + offline test. This cycle shipped Stage 3's spirit-pantheon affordance: for one input phrase the demo dispatches one daemon `convert` per registered spirit and schedules each return as its own tap. Three taps land at 2.21s / 2.71s / 3.21s with a 0.7^k decay; the gap energies confirm the train is clean. Because the daemon stub still passes audio through unchanged, the three taps share timbre — what is proven…

### Open asks

_None — nothing is waiting on you._

### Answered, not yet consumed

_None._

### Decided

- `semantic-delay-steward-012` — directional_steer → GRANTED — option_id=F0-COUPLING; notes: "just a warning, the language here assumes I know what is going on with the project( you are describing phases without clearly describing the phases and the tradeoffs)." (2026-06-25)

<!-- scroll:now:end -->

## Standing Orders

<!-- scroll:orders:start -->
_Loudon's standing direction for this project. The steward reads this zone every cycle before anything else, and it is never regenerated. Taste, priorities, "stop asking me about X", "always prefer Y" — write it once here instead of answering it every cycle._
<!-- scroll:orders:end -->

## The making

<!-- scroll:making:start -->
<!-- scroll:entry id="semantic-delay-steward-011" -->
### 2026-06-23 — cycle 6 — Stage 3 multi-voice-taps wired and proven against the stub — three spirit converts, three scheduled taps, one rendered WAV.
> shipped · wiring proof against stub · timbre comes alive Mac-side at Stage 1.5

I am Semantic Delay — a VST-bound phrase-delay return effect that swaps the voice on each echo. Phase 1 is the voice-swap path (SoulX-Singer-SVC; no LLM yet). Stage 0 cleared on M1 Max in April (RTF≈1.65, MPS patches in repo); Stages 1–2 stood up the stub-daemon + standalone instrument + offline test. This cycle shipped Stage 3's spirit-pantheon affordance: for one input phrase the demo dispatches one daemon `convert` per registered spirit and schedules each return as its own tap. Three taps land at 2.21s / 2.71s / 3.21s with a 0.7^k decay; the gap energies confirm the train is clean. Because the daemon stub still passes audio through unchanged, the three taps share timbre — what is proven here is the **wiring** (parallel spirit dispatch + per-tap scheduling), not the **sound** (that arrives the moment Stage 1.5 wires real SoulX-Singer-SVC behind the same socket, with no surgery to this demo).

**Artifacts:**
- [dry phrase (~0.5–1.4s) + three spirit taps at 0.5s spacing; stub means same timbre, distinct timing+gain.](Projects/Semantic Delay/standalone/demo/stage3-multi-voice-taps-demo.wav)

_energy windows from the demo run_
| window | RMS | what it is |
| --- | --- | --- |
| 0.50–1.40s | 0.1905 | dry phrase |
| 1.91–2.81s | 0.2320 | tap 1 (Anansi) |
| 2.41–3.31s | 0.3292 | tap 2 (Eshu) — overlaps tap 1 tail |
| 2.91–3.81s | 0.2778 | tap 3 (Huehuecoyotl) |
<sub>`semantic-delay-steward-011` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->
<!-- scroll:making:end -->
