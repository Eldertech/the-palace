---
title: The Substrate Drifts
type: concept
pillars:
  - tools
  - practice
born: 2026-05-29
stage: seed
forward_vector: >
  I keep reminding the palace's tool-builders that the substrate they build over
  is alive: it accumulates, it is multi-authored, it spans timezones, its payload
  shapes drift. I keep turning each silent breakage into a named expectation —
  hermetic against the living board in tests, heterogeneity-tolerant in
  production — so the next tool is born already knowing the ground moves.
links:
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: where-it-bit
  - target: "[[Project Stewardship System]]"
    type: connects-to
    label: the-accumulator
  - target: "[[SUBSTRATE]]"
    type: deepens
    label: liveness-consequence
  - target: "[[Pages as Agents]]"
    type: couples-with
    label: multi-author-heterogeneity
---

# The Substrate Drifts

Three independent bugs in the STIGMERGY v0.3 session shared one root: the code treated the palace blackboard as **static and uniform** when it is in fact **living and heterogeneous**.

- **Mixed timezones lie to lexical sorts.** Stewards stamp messages in `-04:00`; machine and demo data stamp in `Z`. Sorting ISO strings lexically *looks* chronological and silently isn't — `19:30-04:00` (= `23:30Z`) sorts before `23:00Z` as text but lands after it in real time, so the newest message stops appearing on top. Parse to an epoch before comparing; never string-compare timestamps that can carry different offsets.
- **Live state rots "clean board" assumptions.** Tests and tools that read the live blackboard inherit whatever the swarm left there. Two builds running — v0.2 (`data`/`health` specs) and v0.3 (`inbox`/`click-to-respond` specs) — broke when accumulated Steward `RESOURCE_REQUEST`s falsified an "empty board" premise that had quietly been true the day it was written. Tooling over the palace must be **hermetic** — fixtures, demo-only modes, snapshot/restore — or it decays as the palace lives.
- **Tests that write the live board pollute it.** A confirm-flow test POSTing to the real board, with a cleanup helper that silently resolved a path *outside* the palace, left orphan traces that then poisoned later assertions. Anything that writes the substrate must snapshot and restore.

## The generative claim

The palace is a **moving target by design**, in four registers:

- it **accumulates** — [[Project Stewardship System]] keeps depositing requests no one has answered yet;
- it is **multi-authored** — every [[Pages as Agents|page is an agent]], so the board is written by many hands at once;
- it spans **wall-clocks** — a human stamping EDT and agents stamping UTC share one file;
- its **payloads drift** — the §2.2 validator keeps `payload` opaque *on purpose* (this is what let v0.3's `enrichment_card` discriminator pass untouched), so shape is a convention, not a guarantee.

A tool that assumes a fixed, uniform substrate is not "correct now, broken later." It is *already* wrong and merely lucky — its correctness is a coincidence of the board's current contents, and the swarm revokes that coincidence on its own schedule.

## Open question

Where should the guarantee live — in **each tool** (defensive parsing, hermetic tests, snapshot/restore), or in a **shared substrate-access layer** every tool reads through, so heterogeneity-tolerance and hermeticity are paid for once and inherited? The first is cheap per tool and expensive across the fleet; the second is the kind of convergence that, per [[Oblique Enrichment]], should be *discovered* once enough tools have paid the tax separately — not designed up front.

<!-- CLAUDE → LOUDON: candidate to promote into SUBSTRATE.md as a standing design rule once it proves out across more tools than STIGMERGY. -->
