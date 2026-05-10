# Stage A Pilot — Lessons (migrated to palace entry)

All Stage A pilot findings have been consolidated into [[Project Stewardship System]] § Stage A — Hand-run a permanent agent on one project ✓ Piloted (2026-05-03). That entry now carries:

- What was built
- What the pilot validated
- 9 spec gaps + 4 content findings (full table with priorities)
- What Stage B now needs
- What the pilot did not test
- Recommended next move

This file is preserved as a redirect so any reference to `STAGE-A-LESSONS.md` resolves cleanly.

The runtime artifacts in this directory remain — they are operational state, not knowledge:

- `manifest.json` — agent spawn config
- `state.json` — orchestrator working state
- `history.jsonl` — append-only event log for this agent's cycles
- `pending-bbs-append.jsonl` — pre-fix forensic snapshot of BBS messages

**Palace principle (recorded by Loudon 2026-05-03):** keep as much knowledge in the palace entry as possible until it becomes clearly unmanageable. Auxiliary markdown files for findings/lessons/decisions duplicate palace state — the entry is canonical.
