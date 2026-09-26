---
title: "Generative Audio Devices — scroll"
born: 2026-09-23
links:
  - target: "[[Generative Audio Devices]]"
    type: connects-to
    label: scroll-for
forward_vector: "I am Generative Audio Devices's scroll — the one page that always opens on where the project stands now, then reads down through everything it has made, newest first. My top is regenerated from the board and the palace whenever anyone looks; my standing orders are Loudon's and never regenerated; my trail only ever grows."
---

# Generative Audio Devices — scroll

> The project's front door. **Now** is regenerated on every look; **Standing Orders** are Loudon's; **The making** is the trail, newest first. Rendered in [[STIGMERGY]]'s PROJECTS deck; the entry [[Generative Audio Devices]] stays the considered truth and this is the live one. See [[The Scroll]].

<!-- scroll:now:start -->
## Now

> _Regenerated 2026-09-25T20:56:04-04:00 from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — the project is steered by the **Plan** and **Standing Orders** below, never here._

- **Status:** active · **Stage:** sprout · **Steward:** cycle 0 · last ran —
- **Plan:** agreed 2026-09-25 (today) · 0 made things since
- **Waiting on you:** nothing
- **Ready to advance:** no unread answers
- **Last shipped:** nothing on the board yet
- **Last commit touching this project:** 2026-09-25 `65af5aba` — edit(plans): the generative family's plans move into their scrolls
- **Signal:** steady
- **Drift:** no consolidation marker on the entry — nothing to measure against.

### Where this stands

_The steward has not spoken yet._

### Open asks

_None — nothing is waiting on you._

### Answered, not yet consumed

_None._

### Decided

_Nothing decided on the board yet._

<!-- scroll:now:end -->

## Plan

<!-- scroll:plan:start -->
**Paused** (Loudon, 2026-09-25). Nothing has moved since May, and he has set the project down for now; the moves below are the path to pick up when it wakes.

**Where this is going.** A pipeline that turns a plain description of a sound into a loadable instrument for any modular or DSP environment: English in, a target-neutral patch language (PDL) in the middle, and one verified vocabulary per target on the way out. VCV Rack is the first target, and the whole chain has worked there since May 2026: [[PDL Generation Prompt]] writes two or three candidate patches, [[PDL Renderer]] emits a `.vcv` that loads, and fresh agents went nine for nine. Nothing has moved since then, and the next step is Loudon's ear.

**The moves ahead**

1. **Hear it in Rack.** On the Mac, Loudon writes a description through the prompt, picks a candidate, emits it, loads it in Rack, and says whether the revised archetypes sound usable and the two-row layout matches his muscle memory. Starting material is in `Shop/VCV Patch Generator/recipes/` and `Shop/VCV Patch Generator/t6-runs/`. The second target waits on this.
2. **Prove it on a second target.** A second environment gets its own vocabulary file and emitter, not a new architecture, and it passes when the same PDL that makes a VCV patch makes a working artifact there. Pure Data is the safest choice; RNBO codebox~ has the most reach and forces the real question, whether a code-emitting target fits a graph-shaped language. One target at a time.
3. **Search the modules by feel.** A search box in the renderer's module sidebar that lights up every module whose description words match what you type. It passes when "bright" lights the oscillator and filter, "breathing" lights the LFO and envelope, and "kick" lights nothing, which is the sign the vocabulary still needs percussive words.
4. **Give PDL its own page.** Move the grammar, the signal types and the port-resolution order out of [[Generative Audio Devices]] into a `PDL Spec` entry the project links to.

The last two are side moves with no fixed place: the search box was marked medium priority and the PDL page low, and either can go whenever there is a spare hour. Two gaps are named and deliberately deferred, and neither may hold up the second target. One is polyphony, which the project's three layers can't yet represent: the keyboard module carries one voice, and Loudon labelled his warm-pad refinement in `recipes/` "should be polyphonic!" The other is a recount of the oscillator and filter parameters against Rack's own source, since patches Rack re-saves carry more parameter slots than the vocabulary lists.
<!-- scroll:plan:end -->

## Standing Orders

<!-- scroll:orders:start -->
_Loudon's standing direction for this project. The steward reads this zone every cycle before anything else, and it is never regenerated. Taste, priorities, "stop asking me about X", "always prefer Y" — write it once here instead of answering it every cycle._
<!-- scroll:orders:end -->

## The making

<!-- scroll:making:start -->
<!-- scroll:entry id="plan-2026-09-25T20-56-04-04-00" -->
### 2026-09-25 — Plan agreed: carried over from the Roadmap, and paused

Carried over on 2026-09-25 from the entry's Roadmap and the forward half of Pick Up Here, when Loudon asked that every plan fold into its scroll (SCHEMA v1.25). Order from Pick Up Here: hear it in Rack, then prove it on a second target; the search box and the PDL page are side moves with no fixed place; the two deferred gaps (polyphony, the parameter recount) are named at the end. Nothing has moved since 2026-05-29 (f1ff24c2), and the same day Loudon called the project paused: the entry's stage is now dormant, and the plan is the path to pick up when it wakes.
<sub>`plan-2026-09-25T20-56-04-04-00` · plan agreed · agreed 2026-09-25T20:56:04-04:00 · carried over by an elder on Loudon's word</sub>
<!-- /scroll:entry -->

_Nothing made yet — the first shipped thing will open the trail._
<!-- scroll:making:end -->
