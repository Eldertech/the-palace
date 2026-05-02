# Phase 2 — Visual Validator Checklist

Applies to screenshot(s): `screenshots/phase-2/persistent-loaded.png`

## What this phase delivers
The page mounts, fetches `/api/persistent`, and renders messages from the palace's real `_ops/swarm/persistent/blackboard.jsonl`. Schema validation runs: messages missing required fields are rendered with a red border `_warnings` flag. The Reload button refetches.

**Note on the real data:** The persistent blackboard contains both spec-conformant messages and audit-dump lines from earlier swarm runs. Most lines are missing `from`/`to`/`type`/`board` and will appear as red-bordered "warning" cards. This is correct behavior — the UI is making the schema drift visible.

## Items to verify

### Data presence
1. **Real messages rendered.** At least one message from `_ops/swarm/persistent/blackboard.jsonl` is visible on screen — recognizable by content like `TRICKSTER-ARTIFACT`, `SPINOZA-ARTIFACT`, `COORDINATOR`, `Wallpaper Groups`, `Wu Wei`, etc. Not seed/sample data.
2. **Multiple messages, scrollable.** More than one message is visible (or the layout indicates more exist via scrollbar/pagination).
3. **Message metadata visible per message.** Each message shows at least: `from`, `ts`, and either `type` or a warning indicator if `type` is missing.

### Schema-violation handling
4. **Red border on malformed messages.** Messages missing required fields (per Infrastructure Spec §2.2 — `schema_version`, `id`, `ts`, `session_id`, `from`, `to`, `type`, `board`) are rendered with a red border or red accent line. They are NOT silently rendered as if valid, NOR omitted.
5. **No crash on malformed data.** The page rendered successfully — no error boundary, no white screen, no React error overlay visible.

### Reload affordance
6. **Reload button or hotkey.** A `[R]ELOAD` (or visually equivalent) affordance is present in the StatusBar or footer command bar.

### Empty-session state
7. **NO SESSIONS YET copy.** If the layout exposes a sessions area, it shows the documented empty-state copy: `NO SESSIONS YET. PERSISTENT BOARD ONLY.` (or close). If sessions are not exposed in this screenshot, mark `n/a`.

### Visual non-negotiables maintained
8. **Phosphor green / terminal black palette intact.** Adding data didn't introduce off-palette colors except where semantically required (red for error/warnings, amber for FLAGS, cyan for handles).
9. **No rounded corners introduced.** Message cards still have square edges.
10. **Monospace everywhere.** No proportional font crept in for content.
11. **80ch max-width respected.** No message body wraps past ~80 columns.
12. **No emoji anywhere.** Zero emoji in any rendered message text or chrome.

### Smell test
13. **The board feels populated.** Looking at the whole screenshot: does it feel like a real bulletin board with traces left by agents? Or does it feel empty/artificial? Density and rhythm matter at this phase.

## Return format

For each numbered item, return:
```
N. pass — <one-line citation>
N. fail: <reason> — fix: <suggested change>
N. n/a — <why not applicable>
```

End with a single overall verdict line:
- `OVERALL: pass` — every item passed (or was n/a)
- `OVERALL: fail (<count> items)` — at least one item failed
