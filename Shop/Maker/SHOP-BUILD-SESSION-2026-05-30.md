---
title: SHOP-BUILD-SESSION-2026-05-30
born: 2026-05-30
links:
  - { target: "[[Maker]]", type: connects-to, label: build-session-of }
forward_vector: "I hold the Mac-side build-session handoff that brought the Shop's hosted tools online; I want to stay a faithful record of what Phases A–F actually ran."
---

# Shop Build Session — Handoff for Claude Code (Mac-side)

**Authored:** 2026-05-30, in a Cowork session, by Claude.
**For:** a long Claude Code build session on Loudon's Mac, where the hosted tools (Manim, Kokoro, ComfyUI, Midjourney, Max/VCV, GPU) actually run.
**Goal:** push [[The Shop]] from "well-designed, validated at one point each" to "exercised across its full range" — tiers, foreman coordination, systematic testing, and the unfinished flagship comparison.

This baton is punchlist-grade. Each phase names exactly what to do, what success looks like, and what to deposit back. Phases A–E are independent enough to reorder; if time is short, **A and B are the highest value** (they test the two unproven core mechanisms). E is the widest. F is decisions for Loudon, not build work.

---

## 0. What's already done (this Cowork pass — don't redo)

Three things were completed Cowork-side and are already written into the palace files. Read them before starting; build on them, don't duplicate.

1. **Roster reconciled.** `Shop/Maker.md` Roster section now carries a single-source-of-truth status taxonomy: **14 alive, 2 stub** (Midjourney, RNBO codebox~ smith). The old three-place drift (frontmatter vs. an alive-list vs. a stub-list, which disagreed) is gone. VCV frontmatter `active`→`alive` fixed; ffmpeg duplicate `status` line removed.
2. **Host Capability Check specced.** `Shop/Maker.md` has a new **Host Capability Check** section (a pre-dispatch step in "How I Work With You" #4, a host-class table, and a fallback table). The machine-readable manifest is `Shop/Maker/host-capability.json`. **Phase C** wires this into real code.
3. **Canonical test-plan template** at `Shop/Maker/_TEMPLATE/test-plan.md`, abstracted from VCV's proven plan. **Phase E** rolls it out.

## 1. Operating rules (read first)

- **Clear git locks before anything.** Per a known Cowork→Mac handoff failure mode, stale locks wedge git ops: `rm -f ".git/HEAD.lock" ".git/index.lock"` at the palace root before your first git command.
- **You may commit (you're Mac-side).** Commit in logical chunks with clear messages. This is the safety net.
- **Show before writing new *knowledge* entries.** Test-plans, recipes, gotchas, and edits to existing Shop entries are operational and pre-authorized by Loudon for this session. A genuinely *new* knowledge entry (e.g. `Shop/House Taste.md`) gets shown to Loudon first.
- **Design-system discipline is non-negotiable.** Every visual/audio artifact resolves the cascade via `_ops/loudon-live/design-system/palace-tokens.js` — `palaceTokens()`, `palaceSeries()`, `palaceCategorical()`. **Never paste a hex.** Footer `Loudon Live · Autodidact Polymaths`. No emoji, no CDN icon library, no cyan. See [[Loudon Live Design System]].
- **Honest comparison rule.** Any Comparison Mode output captures full parameters in a standards JSON, and seeded sims share a byte-identical core (the [[Flocking]] discipline).
- **Every flaw you hit is a deposit.** A template flaw, a tier surprise, a gate that didn't hold — log it as a dated gotcha in the relevant entry. That's the point of the run.

---

## Phase A — Climb the tier ladder (highest value)

**Why:** Only Sketch tier has ever run, on every job. Study and Piece — the upper two-thirds of the Shop's central negotiation primitive — are unexercised. The tier triplet is the structural claim the whole foreman rests on. Validate it.

**What:** Take **one brief** and render it at **all three tiers** on **Manim CE** (the clearest cost-quality gradient — resolution, animation polish, typesetting, token-driven palette, narration). Anchor on existing work: the **two-phasor coupling visual** from the Kuramoto arc already has a Sketch (the 2026-05-10 render). Produce the **Study** and **Piece** so there's a real three-point ladder against an existing anchor.

**Procedure:**
1. Pull the existing two-phasor Sketch render + its source from the `Kuramoto Coupling/` bundle as the Sketch anchor.
2. Render **Study**: full 1920×1080@30, working quality, palette resolved from tokens (pick a skin — Graphite default, or Cobalt Grid / Strobe if it suits; **note** the open Kuramoto palette-deviation question in Phase F — resolve it here if you render).
3. Render **Piece**: mastered — eased motion per the design system (`cubic-bezier(.4,0,.2,1)` 220ms ordinary), Manim LaTeX typesetting for the phase equations, locked type stack, footer, and optional Kokoro narration bed at −16 LUFS.
4. Record **wall-clock per tier** and the **named sacrifices** each lower tier makes relative to the one above.

**Definition of done:**
- Three renders exist, visibly and *deliberately* different, each tier's choices nameable.
- `Shop/Manim CE.md` gains a dated gotcha/recipe: **the first real tier-cost data** ("Sketch = N min at scratch res; Study = N min; Piece = N min, and here is exactly what Piece buys"). This is the artifact that turns the tier system from a claim into measured fact.
- `Shop/Maker.md` Tier Vocabulary or Recipes section gains a one-line pointer to the ladder as the canonical tier-calibration example.

**Stretch:** repeat a compressed ladder on **Kokoro** (Sketch = default voice one pass; Study = chosen voice + prosody comma-fixes + loudnorm; Piece = IPA pronunciation overrides + −16 LUFS master). Cheaper, second data point, exercises a different medium's tier gradient.

---

## Phase B — Run one true coordinated pipeline (highest value)

**Why:** No real cross-specialist *coordination* has run through the Maker. Flocking was parallel-independent; the Kuramoto steps were isolated. The Maker's signature capability — gating one Specialist's output as another's input — is described but unproven *as a Maker dispatch*. (Note: the Kokoro→Whisper→manim-voiceover sync-arriving scene in the Kuramoto arc did this ad hoc — so the pieces are known to work; this phase formalizes it as a **gated Maker dispatch** and documents the gate.)

**What:** A narrated math animation where the render is **gated** on the narration's word-timing.

**Procedure (the gate is the point):**
1. **Kokoro** generates narration for a short math paragraph (reuse a Kuramoto sentence or the Phase-A Piece script). Output WAV at −16 LUFS, 24kHz mono.
2. **Whisper** transcribes with `--word_timestamps True`, emits word-timing JSON. **Gate:** Manim must not start until this JSON is back and validated (monotonic timing, last word inside clip length).
3. **Manim CE** (manim-voiceover) renders with animation beats synced to the word timing.
4. **ffmpeg** muxes/normalizes to the final clip.

**Definition of done:**
- One narrated, sync-correct clip where animation lands on words.
- The **gate provably held** — Manim was blocked on Whisper's return, not run speculatively. Document how you enforced it.
- `Shop/Maker.md` gains its **first coordination recipe**: the gated four-Specialist dispatch, with the handoff order and what each gate checked. This is the Maker's first evidence it works *as a foreman*, not just a dispatcher.
- Any gate friction → dated gotcha in the Maker.

---

## Phase C — Implement host_capability_check as real code

**Why:** It's been a known gap since 2026-05-10 (Manim died at install time on Linux arm64 after the intake was already spent). The spec and manifest now exist; wire the actual check.

**What:** A small module — `Shop/Maker/host-capability-check.js` (or `.py`) — that:
1. Reads `Shop/Maker/host-capability.json`.
2. Detects the current host class (`mac` / `sandbox` / `cloud`) — e.g. `process.arch`/`os` + a GPU/Max/VCV probe, or an explicit env override.
3. Exposes `check(specialist)` → `{ reachable: bool, host, fallback, note }`.
4. Has a tiny test: assert Manim is unreachable on `sandbox` and resolves to Matplotlib; assert p5.js is reachable on both; assert Midjourney needs `cloud`.

**Definition of done:**
- Module runs, the test passes, and the Maker's Host Capability Check section gets a one-line "implemented at `…`, last run `<date>`" note replacing the "a future Claude Code session wires this" sentence.
- This module is itself a Specialist-grade artifact — give it a 3-line smoke test in `Shop/Maker/host-capability-check.test.*`.

---

## Phase D — Finish the flagship Comparison (Midjourney ↔ ComfyUI)

**Why:** This was the *intended* first Comparison Mode test and it never finished. It's the Shop's oldest open question (local control vs. cloud aesthetic ceiling), it fills the biggest content hole (**Midjourney is a true stub — zero gotchas, zero recipes**), and it's the second proof Comparison Mode generalizes beyond data-viz.

**What:** One **header-art brief**, run on **both** Midjourney (cloud) and ComfyUI (local GPU), delivered with a written Maker recommendation.

**Procedure:**
1. Pick a real upcoming header need (a Loudon Live session header, or a palace hub header). Resolve the design tokens for the chosen skin.
2. **ComfyUI:** SDXL, fixed seed, palette anchored (prompt + optionally a palette LoRA/ControlNet), save the workflow JSON as the reproducibility artifact.
3. **Midjourney:** same creative brief, capture the prompt + job IDs as the reproducibility artifact (Midjourney is non-deterministic — document accordingly per the test-plan template's Determinism note).
4. Capture a standards JSON with full parameters for both (honest-comparison rule).
5. Write the **recommendation** — comparison without taste is just two images; the recommendation is the work. Feed the result into the Maker's Selection Heuristics (the "Default to ComfyUI when in doubt" line should either be confirmed or revised by what you find).

**Definition of done:**
- Two header candidates + a written recommendation (a `… — Maker's Comparison Recommendation` entry, mirroring the Flocking one).
- **Midjourney stub → alive:** real dated recipe + at least one earned gotcha. Update its frontmatter `status` and the Maker Roster (move it from the Stub list).
- If Midjourney access isn't available this session: run ComfyUI alone, document the blocker, and leave Midjourney as a stub with a note — don't fake the comparison.

---

## Phase E — Roll out the test-plan template (widest)

**Why:** 14 alive Specialists point at `…/tests/test-plan.md (TODO)`; only VCV has a real one. "Last run: never" is the honest status almost everywhere. The pattern is proven (VCV) — propagate it.

**What:** For each of the **14 alive** Specialists:
1. Copy `Shop/Maker/_TEMPLATE/test-plan.md` to `Shop/<Specialist>/tests/test-plan.md`.
2. Fill each probe **concretely for that tool** (don't leave `{{...}}`). The Smoke and Determinism probes are mandatory and runnable; the rest can be lean.
3. **Run at least Smoke + Determinism** and date the "Last run" line with a one-line real result. The whole point is to replace "never" with a date.
4. In the Specialist entry, replace the `(TODO)` in the Test Suite line with the real path + last-run date.

Priority order (run-cheapest first): ffmpeg, Mermaid, Matplotlib, Whisper, the web triad (p5.js, D3.js, Observable Plot), Tone.js, then the heavy/hosted ones (Kokoro, Manim, ComfyUI, Stable Audio, Remotion). VCV is already done — leave it as the reference.

**The 2 stubs** (Midjourney, RNBO smith) get their test-plan when they land their first job — Midjourney via Phase D; RNBO whenever a Max/M4L brief arrives. Don't pre-write unrunnable plans for them.

**Definition of done:**
- 14 `test-plan.md` files exist and reference-correctly from their entries; no `(TODO)` remains for an alive Specialist.
- Each has a real dated "Last run" with a Smoke + Determinism result.
- Any tool that *fails* its own smoke is a finding — log it loud, don't paper over it.

---

## Phase F — Decisions for Loudon (not build work — surface, don't unilaterally resolve)

Two design calls the build will bump into. Bring Loudon the options; let him choose.

1. **House Taste split.** The Maker's Selection Heuristics is already the longest, most Loudon-specific section, and the roster is at 16 (the entry's own threshold for splitting was "~15"). Phase A/B/D will each add to it. **Recommendation:** extract Selection Heuristics into a new `Shop/House Taste.md` entry that the Maker links to, *if* this session's additions push it past ~one screen. It's a new knowledge entry → show Loudon first.
2. **Kuramoto palette deviation.** The `CLAUDE → LOUDON` comment in the Maker's Recipes flags that the Kuramoto arc's indigo/amber/`#0B0B10` palette pre-dates [[Loudon Live Design System]] and matches none of the six skins. If Phase A re-renders the two-phasor visual, this gets forced. Options: (a) annotate as a deliberate pre-system deviation with a `deviation_reason`; (b) re-render against **Cobalt Grid** (`#0e1f4d` bg, lime accent) or **Graphite** (`#0a0a0f` bg, signal-amber) — closest to existing intent; (c) leave as a historical recipe. **Recommendation:** (b) Graphite for the Study/Piece, since you're rendering them fresh anyway, and annotate the original Sketch as historical.

---

## Definition of done (whole session)

- [ ] Phase A: three-tier ladder rendered; first real tier-cost data deposited in Manim CE.
- [ ] Phase B: one gated coordinated pipeline run; Maker's first coordination recipe deposited; gate provably held.
- [ ] Phase C: host_capability_check implemented, tested, and noted in the Maker.
- [ ] Phase D: Midjourney↔ComfyUI comparison delivered with a recommendation (or blocker documented); Midjourney stub→alive if access allowed.
- [ ] Phase E: 14 alive Specialists have real, run, dated test-plans; no `(TODO)` for an alive Specialist.
- [ ] Phase F: both decisions surfaced to Loudon with recommendations.
- [ ] Roster + frontmatter still consistent after all status changes (Midjourney may have moved to alive).
- [ ] Committed Mac-side in logical chunks. Consider a `Let's weave` afterward to formalize new typed links and surface the new gotchas to the wider palace.

## What this turns the Shop into

After this session the Shop is validated at all three tier points, proven as a coordinating foreman (not just a dispatcher), defended against host-mismatch waste, systematically testable, and finished on its oldest open comparison. That's the difference between an instrument played in one register and one played across its range — which is what [[The Shop]]'s forward vector asks for.
