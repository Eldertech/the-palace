# Phase 4 — Visual Validator Checklist

Applies to screenshot(s): `screenshots/phase-4/with-roster.png`

## What this phase delivers
Each message displays its `health` block (context_pct, model, score). Score colors map to phosphor/amber/red. An agent roster panel on the right lists every unique agent with latest health, latest context_pct, last message ts. Climbing context_pct renders as an inline trend (e.g., `18% ↗ 34% ↗ 61%`). Clicking an agent filters the message list to that agent.

## Items to verify

### Per-message health block
1. **Health block visible per message.** Each message that has a `health` block in its data shows it inline — typically formatted as `[ctx 18% · qwen3:14b · green]` or visually equivalent in metadata position.
2. **Green-score messages render in phosphor.** Messages where `health.score === "green"` use phosphor green for their score indicator. No off-palette greens.
3. **Yellow-score messages render in amber.** Messages where `health.score === "yellow"` use amber (`#ffb000`-family) for their score indicator.
4. **Red-score messages render in red.** Messages where `health.score === "red"` use red (`#ff4136`-family) for their score indicator.
5. **Missing-health messages.** If a message has no `health` block (likely the case for the audit-dump persistent data), the message either shows `[no health]` placeholder or omits the health block entirely — but does NOT show a misleading default like "green" with empty values.

### Agent roster panel
6. **Roster panel present.** A panel on the right (or visually distinct location) lists agents.
7. **Per-agent fields shown.** For each agent: `agent_id` (handle), latest health score (color-coded), latest context_pct, last message timestamp.
8. **Sort order: most recent first.** The agent whose most recent message has the latest ts appears at the top.
9. **Click-to-filter affordance.** The roster items appear clickable (cursor change on hover, or a documented hotkey). The screenshot may not show the click-state, but the interactivity affordance should be visible.
10. **Trend display for climbing context.** If any agent has 3+ messages with rising `context_pct`, the inline trend (e.g., `18% ↗ 34% ↗ 61%`) appears. NO chart library — just numbers and arrow glyphs. If no climbing trend exists in the data, mark `n/a`.

### Layout integrity
11. **Two-pane layout respects the grid.** Message list and roster pane each respect monospace columns. Combined width ≤ 120ch (per design-system rule).
12. **80ch maintained on the message column.** Even with the roster on the side, the message column still respects an 80ch (or visually equivalent) max-width for body text.

### Visual non-negotiables maintained
13. **Phosphor / terminal-black palette intact.** Health colors are the only new non-phosphor accents; no other colors introduced.
14. **CP437 borders aligned.** If the roster panel is drawn with box-drawing characters, alignment is exact.
15. **No rounded corners.**
16. **Monospace everywhere.**
17. **No emoji.**

### Smell test
18. **Agent state legible at a glance.** Can you tell at a glance which agents are healthy and which are degrading? Is the trend visible without squinting? Does climbing context_pct read as a "degradation curve" the way Infrastructure Spec §2.2 describes it? If yes — the phase is doing its job.

## Return format

For each numbered item, return:
```
N. pass — <one-line citation>
N. fail: <reason> — fix: <suggested change>
N. n/a — <why not applicable>
```

End with:
- `OVERALL: pass` or `OVERALL: fail (<count> items)`
