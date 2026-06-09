---
title: "Generative Sample Libraries — lessons — stage-a"
born: 2026-05-03
links:
  - target: "[[Generative Sample Libraries]]"
    type: connects-to
    label: lessons-for
forward_vector: "I am the Stage A pilot lessons breadcrumb — my substance was consolidated into [[Project Stewardship System]] § Stage A. I keep the pointer home in the GSL bundle so the lineage is findable from the entry."
---

# Stage A Pilot — Lessons (migrated to palace entry)

All Stage A pilot findings have been consolidated into [[Project Stewardship System]] § Stage A — Hand-run a permanent agent on one project ✓ Piloted (2026-05-03). That entry now carries:

- What was built
- What the pilot validated
- 9 spec gaps + 4 content findings (full table with priorities)
- What Stage B now needs
- What the pilot did not test
- Recommended next move

This breadcrumb was relocated into the GSL bundle on 2026-06-09 by the Machinery/Content Split (it was a stray `STAGE-A-LESSONS.md` in `_ops`). The substance lives in the palace entry; this file keeps the lineage findable from home.

The runtime artifacts remain in `_ops/agents/permanent/generative-sample-libraries/` — they are operational state (machinery), not knowledge, so the split leaves them in `_ops`:

- `manifest.json` — agent spawn config
- `state.json` — orchestrator working state
- `history.jsonl` — append-only event log for this agent's cycles
- `pending-bbs-append.jsonl` — pre-fix forensic snapshot of BBS messages (pairs with the event log)

The steward's *work state* (open/resolved decisions, done trail) now lives in the bundle's `Generative Sample Libraries — plan.md`, materialized from the board each cycle.

**Palace principle (recorded by Loudon 2026-05-03):** keep as much knowledge in the palace entry as possible until it becomes clearly unmanageable. Auxiliary markdown files for findings/lessons/decisions duplicate palace state — the entry is canonical.
