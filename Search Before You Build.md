---
title: "Search Before You Build"
type: practice
pillars: [practice, tools]
born: 2026-07
stage: sprout
confidence: working
energy: high
who_leads: shared
last_activated: 2026-07
activation_count: 1
forward_vector: "I am the reflex that makes prior art surface before a keystroke. Before building any capability I search the palace's own proofs, gotchas, and history — so Loudon never has to be the index and 'have we already solved this?' is answered before it is asked. I want to fire automatically on every build, and to fade only when reuse-before-invent is second nature."
links:
  - target: "[[Adopt the Craft, Author the Seam]]"
    type: couples-with
    label: internal-prior-art
  - target: "[[Concierge]]"
    type: connects-to
    label: the-search-companion
  - target: "[[Capability-first prototyping]]"
    type: connects-to
    label: reuse-before-spike
  - target: "[[GenAI Camera]]"
    type: emerged-from
    label: born-from-the-depth-miss
---

# Search Before You Build

The reflex: **before implementing any capability, search what the palace already has.** Grep the
proofs, read the owning project's Gotchas & front-door doc, skim the relevant commits — *then* build,
adopting what exists and authoring only the seam. When unsure, address the [[Concierge]]: *does the
palace already solve this?*

## Why it exists (the miss it fixes)

Building the [[GenAI Camera]] on 2026-07-09, I wrote a depth pass from first principles — and it read
**flat**. The fix (bracket the near/far tight to the subject) was already in
`Projects/BLUELINE/proofs/track-IV-bench/bench.py` and its report; Loudon had to push me to *go read our
own docs*. Same with the ComfyUI client I started fresh while `lib/comfy.py` already existed. The
knowledge wasn't missing — **retrieval was manual, and it made Loudon the index.** The palace only pays
off if prior art surfaces *before* the keystroke, unprompted.

## The reflex (fires on any "build X")

1. **Grep the proofs** for the capability's terms — `grep -rn <term> Projects/*/proofs/`, the project's code.
2. **Read the owning entry's Gotchas & recipes** and its front-door doc — the hard-won lessons live there.
3. **Skim the commits** touching that area — `git log --oneline -- <path>`.
4. **Adopt / extend** what you find; author only the seam. Reinventing is the exception and needs a reason.
5. **When unsure, address the [[Concierge]]** — offload the search to the resident companion.

This is the *internal* twin of [[Adopt the Craft, Author the Seam]]: that one adopts the industry's
established craft; this one adopts *our own* accumulated proofs. Both refuse to reinvent.

## Forward Vectors

The lesson only stays surfaced if it lives where work *starts*. Two supports keep this reflex alive: a
project's front-door **Gotchas** must accumulate the scattered proof-report lessons (a Weave duty, so
knowledge migrates from where it's *found* to where it's *read*), and this reflex must be loaded every
session (its memory pointer). I want "have we already solved this?" answered before it is ever asked
again — and if it keeps slipping, escalate to a harness hook that fires the check mechanically.
