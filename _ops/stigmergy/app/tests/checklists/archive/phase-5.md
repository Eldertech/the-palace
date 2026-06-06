# Phase 5 (v0.2) -- Visual Validator Checklist

Applies to screenshots (Phase 4 v0.2 -- click-to-respond UI):
- `screenshots/phase-4-v0.2/inbox-pending.png` -- TRICKSTER tab with pending requests; interactive response buttons visible
- `screenshots/phase-4-v0.2/inbox-modal-preview.png` -- TRICKSTER tab with the response modal open; preview JSON visible
- `screenshots/phase-4-v0.2/inbox-after-respond.png` -- TRICKSTER tab after a successful confirm; the responded-to request is gone

Apply this checklist to **each** screenshot.

## What this phase delivers

An interactive Trickster inbox. Clicking a response option button opens a modal showing the auto-generated, §2.2-conformant JSON about to be POSTed. The human reviews it, optionally types custom constraints, then confirms or cancels. On confirm, the request disappears from the pending list immediately (optimistic update). The old "EDIT the file" caption is removed -- the UI is now the canonical response path.

## Items to verify

### Pending inbox view (inbox-pending screenshot)

1. **Pending requests visible.** At least one pending RESOURCE_REQUEST is rendered in the inbox area.
2. **Per-request fields shown.** Each pending item displays: `from`, `ts`, `resource`, `rationale` (if present), `blocking` flag, `agent_health`, `agent_context_pct`, `agent_status`.
3. **Response options are interactive buttons.** Each pending item shows 4 clickable `[Button]` primitives, one per option: `[1] Grant -- limited`, `[2] Grant -- unlimited`, `[3] Deny -- use palace only`, `[4] Custom response`. They must look like buttons (bordered, with hotkey label), not a static text list.
4. **No edit-the-file caption.** The `EDIT _ops/swarm/persistent/blackboard.jsonl TO RESPOND` caption is ABSENT. The UI is the canonical path now.
5. **Pending counter on TRICKSTER tab.** The TRICKSTER tab label shows `TRICKSTER (N PENDING)` where N matches the visible count.

### Modal preview (inbox-modal-preview screenshot)

6. **Modal overlay visible.** A semi-transparent backdrop covers the board; a centered card sits on top.
7. **Title bar shows option label.** The top of the modal reads `RESPOND -- <option label>` (e.g. `RESPOND -- GRANT -- LIMITED`).
8. **Request summary block.** A compact metadata block shows `from`, `request_id`, `resource`, `blocking` with aligned colons -- same monospace style as the inbox.
9. **JSON preview present.** A bordered, scrollable block shows the full §2.2-conformant message in pretty-printed JSON (2-space indent). The JSON must contain `"type": "RESOURCE_GRANT"` or `"RESOURCE_DENY"`, a `"re"` field, `"schema_version"`, `"health"`, and `"payload"`. The text is phosphor-colored.
10. **Action buttons at the bottom.** A `[CANCEL]` button and a `[CONFIRM]` button are visible in the action row. Both use the primitives Button style (bordered, uppercase, no rounded corners).
11. **No rounded corners anywhere in the modal.** Modal card, buttons, and JSON preview block all have square corners only.
12. **Backdrop is darkened.** The board behind the modal is visibly dimmed -- readable but subordinate. The modal card itself is not semi-transparent.

### After respond (inbox-after-respond screenshot)

13. **Responded request is gone.** The request that was confirmed is no longer in the pending list. If there was only 1 pending request before, the inbox now shows the empty state (`NO PENDING REQUESTS. ALL AGENTS UNBLOCKED.`).
14. **Modal is closed.** No modal overlay visible.
15. **TRICKSTER tab counter updated.** If all requests are answered, the tab shows just `TRICKSTER` with no `(N PENDING)` badge.

### Visual non-negotiables (all three screenshots)

16. **Phosphor palette.** Primary text `var(--phosphor)`, dim text `var(--phosphor-dim)`, error `var(--error)`. No off-palette colors in the inbox or modal.
17. **CSS borders, not character-cell box-drawing.** All borders are CSS (`3px double` or `1px solid var(--phosphor-dim)`). No `═══`, `╔`, `╗`, `│`, `└`, `─` fragments rendered as text.
18. **No rounded corners.** Zero rounded corners on any element in any screenshot.
19. **Monospace everywhere.** All text in inbox, modal, preview JSON, and action buttons uses the monospace font stack.
20. **No emoji.** No emoji characters anywhere in the visible UI.
21. **No center-justification.** All text is left-aligned. No `text-align: center` in any message body, inbox item, or modal section.
22. **No em dashes.** No `--` rendered as `--` typographic em dashes. All separators are literal `--` or `·`.

### Smell test

23. **The modal feels like an inspection surface.** The JSON preview is a genuine pre-flight check -- dense, detailed, and legible as data. It does not feel like a decorative code block. The action buttons are visually authoritative (this is a real confirm step, not a formality).
24. **The inbox-after-respond screenshot feels complete.** Either the inbox is empty (satisfying) or remaining requests are clearly actionable. No orphaned UI elements or residue from the closed modal.

## Return format

For each numbered item per screenshot, return:
```
[inbox-pending|inbox-modal-preview|inbox-after-respond] N. pass -- <one-line citation>
[inbox-pending|inbox-modal-preview|inbox-after-respond] N. fail: <reason> -- fix: <suggested change>
[inbox-pending|inbox-modal-preview|inbox-after-respond] N. n/a -- <why not applicable>
```

End with:
- `[inbox-pending] verdict: pass | fail (<count>)`
- `[inbox-modal-preview] verdict: pass | fail (<count>)`
- `[inbox-after-respond] verdict: pass | fail (<count>)`
- `OVERALL: pass` or `OVERALL: fail`
