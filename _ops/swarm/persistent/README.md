# Persistent Board

The palace's cross-session coordination LOG — the persistent [[STIGMERGY]] blackboard. Append-only; **one write path; never `git add -A`** in this N-writer repo.

**Re-seeded 2026-06-16.** The board had accumulated multiple coexisting conventions while STIGMERGY was built under use (handle-style `from`, `ALL` vs `*`, process names in `health.model`, slug variants). It was archived and re-seeded so future agents copy a clean example, not the drift.

- **Canonical message shape:** [[SCHEMA]] §9 — the v1.12 field conventions. The first lines of `blackboard.jsonl` are labeled exemplars; copy their shape.
- **Prior history:** `Archive/blackboard-2026-06-16.jsonl` (454 messages, 2026-05-04 → 2026-06-16). Git carries it too.
- **Wire spec:** [[Palace Agent Infrastructure Spec]] §2.2 (the strict validator at `_ops/stigmergy/core/schema/validator.js` gates writes).
