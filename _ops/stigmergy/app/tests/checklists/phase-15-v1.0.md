# v1.0 Phase 4 — QUEUE reframe · Visual Validator Checklist

Applies to screenshots in `screenshots/phase-15-v1.0/`:
- `queue-inbox.png` — the QUEUE deck with the unified ranked inbox (open + looks-done items)
- `queue-resolved.png` — a handoff_ready item that has self-cleared against real git

## What this phase delivers

QUEUE reframed as the prospective deck: ONE ranked inbox of everything open, not six round-robined board tabs. Built on the existing actuator panel (top) + the Stage E digest. The new `QueuePanel`:

- **Unified honest items.** Each item asserts an act at a time from a vantage (`announced HH:MM:SSZ, from X`), names its `stale_if` git-condition, and points to live state (a STATE entry or a board) -- it never declares present truth.
- **Item types.** Unanswered `RESOURCE_REQUEST`s and `handoff_ready` BROADCASTs become items (the type set is open; proposals + audition gates come later).
- **Git reconciliation.** A `handoff_ready` self-clears when git satisfies its `stale_if`: a commit carries `Palace-Resolves: <id>`, OR a commit touches its entry after it was posted. The resolved item greys with "looks done -- <reason>. clear it?" -- the human confirms; nothing self-deletes silently.
- **Boards as lanes.** The six boards render as filter chips, not tabs.

## Items to verify

Return `pass` / `fail: <reason>` / `n/a` per item with a one-line citation.

### QUEUE panel chrome (`queue-inbox.png`)

1. **The QUEUE panel renders** inside a `3px double` bordered box titled `queue -- the ranked inbox` (no em dashes; `--` only).
2. **A summary line** shows `N open` (phosphor count) and, when present, `N looks-done`, plus a `reconcile` link (cyan).
3. **Board lane chips** render after `lanes:` -- an `all (N)` chip plus one chip per board (e.g. `general (N)`), the active one inverted (black-on-phosphor).
4. **The actuator panel still sits above the queue panel** (Phase 2.5 is intact) -- a `1px solid` box titled `ACTUATOR -- fire a claude -p worker`.

### Honest items (`queue-inbox.png`)

5. **At least one handoff_ready item renders** as a bordered card with a `HANDOFF READY` kind badge (amber) down a colored left edge.
6. **Each item shows its vantage** -- a dim line `announced <time>, from <source>` (an act at a time, never "is true now").
7. **Each item names its stale_if** -- a dim italic line `stale if: <condition>`.
8. **A handoff item shows its handoff path** -- a dim line `handoff: <path>` with the path in cyan.
9. **Each item shows a live-state pointer** -- a dashed chip like `STATE: <entry>` (cyan) for jumping to the entry.

### Reconciliation / self-clear (`queue-resolved.png`)

10. **A resolved (looks-done) item is visually distinct** -- greyed/dimmed (reduced opacity), its summary struck through, its left edge dimmed.
11. **The resolved item states why** -- a phosphor line `looks done -- <reason>` naming the resolving commit (e.g. `a commit (abc1234) touched Two Batons, One Board after this was posted` or `resolved by commit ...`).
12. **The resolved item offers `clear it?`** -- an underlined affordance (the human confirms; the item is not silently removed).
13. **Resolved items group separately** -- under a `[-] N looks-done (git resolved)` collapsible header, distinct from the open list.

### Locked aesthetic (regression)

14. **No emoji**, **no rounded corners**, **no em dashes** (`--` only) anywhere in the panel.
15. **CP437-evoked borders**: the queue box is `3px double`; item cards are `1px solid` with a `3px` colored left edge; lane/pointer chips use `1px` solid/dashed. No character-cell box-drawing.
16. **Phosphor palette holds** -- green primary, cyan for pointers/links/hashes, amber for the handoff-ready badge and blocking, dim phosphor for resolved/greyed. No SaaS blue, no sans-serif.

### The spell

17. **Does it read as a phosphor BBS terminal that turned the board into a ranked decision queue?** One honest list, each item naming what would retire it, the done ones greying out against git. Call out anything modern/SaaS or any item that asserts present truth rather than an act-at-a-time.

## Return format

```
N. pass — <one-line citation>
N. fail: <reason> — fix: <suggested change>
N. n/a — <why not applicable>
```

End with:
- `OVERALL: pass` — every item passed (or was n/a)
- `OVERALL: fail (<count> items)` — at least one item failed
