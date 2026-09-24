---
title: "Weave 2026-09-24 — newcomers and the unreachable (preliminary)"
born: 2026-09-23
links:
  - target: "[[Weave Ceremony]]"
    type: connects-to
    label: this-run-input
forward_vector: "I am tonight's measurement of who the palace can't reach yet. The morning's fresh map replaces me; if the counts shift, the shift is what happened since tonight."
---

# Newcomers and the unreachable (preliminary, 2026-09-23)

**How this was measured.** `new-entry-catchup.py --since-last-weave` (the fixed, inbound-only version) on a scratch map built by `build-map-2026-09-24.py`, **with ceremonies woven in as nodes**: 351 nodes. The median inbound for established entries is **5**, so the catch-up target is about **4**. Tomorrow's map will be fresher; re-run it and read any difference as what changed overnight.

**Workers see only "currently N inbound"** (`--block`), never the deficit. The deficit is for the coordinator's table.

## Born since July, under target (25)

| inbound | entry |
|---|---|
| 0 | Agent Toolbox · OBS |
| 1 | GenAI Camera · LDN RTM · Reflective Practice · Return Ceremony · Search Before You Build · The Palace Voice · The Practice Rediscovers Its Philosophy · Tool Builder · Weaving Memory into the Palace · Zoom Out to the Structure |
| 2 | Bring In a Bigger Mind · ControlNet as Topology · Making a Palace Citizen · Martin Buber · No Mind Checks Itself · SCHEMA — Reference · Skills Are Enchantable Pages · The Remembering Page |
| 3 | ELDER · Iain McGilchrist · Martin Heidegger · The Aftermath Frame · The Palace Hardens Around Values |

## No inbound link in the graph, any age (20)

Agent Toolbox · Andrei Tarkovsky *(composting)* · Annie Dillard · Audition Gate · Block It in Blender, Ink It in genAI · Buckminster Fuller · Does Personifying an Agent Change What It Does · Gemma 4 — Local Coordination Guide · LoRA Trainer · Media Library *(composting)* · OBS · Quadratic Interpolation in DSP · SMPTE LTC · Slime Mold Delay · Terrence Malick *(composting)* · The Adjacent Affordance · The Substrate Drifts · Tract Mirror · Worktree Practice · control-vocabulary-math

The composting ones are decided in the composting block, not by the walk. The other 17 go to the lifecycle walk, which proposes link, merge, or compost for each.

## Unreachable `_ops/` files wearing entry frontmatter (5) — bundle-hygiene decision, not the walk

Artifacts to Projects Migration — handoff · Graffiti Pass — Handoff 2026-05-02 — Session 2 · Map Log · Schema Ceremony Proposal — exemplifies + member-of · Technical Diagram Standard

These showed up the moment ceremonies became nodes. They're handoffs, a log, a proposal and a standard. The question for each is whether to demote it to a bundle file (minimal SCHEMA §8 frontmatter) or give it a real home.

## What tonight's two counting methods taught

- **Total degree hid the gap.** OBS read as degree 7 with 0 inbound. The script now counts inbound only.
- **Ceremony links didn't count** until ceremonies became nodes. Weaving Memory into the Palace and Search Before You Build looked unreachable, but ceremonies point to both.
- **Links from bundle files don't count, and shouldn't.** Annie Dillard, Buckminster Fuller, Slime Mold Delay, Tract Mirror, SMPTE LTC and Gemma 4 are pointed to only from bundle files (dossiers, batons, scrolls). Bundle files aren't graph nodes, so in the graph's terms these entries are unreachable, and the walk should find them a real neighbour.
