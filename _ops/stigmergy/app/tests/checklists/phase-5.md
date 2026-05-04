# Phase 5 — Visual Validator Checklist

Applies to screenshot(s):
- `screenshots/phase-5/empty.png` (Trickster inbox with no pending requests)
- `screenshots/phase-5/populated.png` (Trickster inbox with at least one paired and one unpaired RESOURCE_REQUEST in fixture data)

Apply this checklist to **each** screenshot.

## What this phase delivers
A read-only Trickster inbox surface for pending RESOURCE_REQUESTs. The algorithm: scan all messages, build `{ request_id → response? }` map, return requests with no matching response. The TRICKSTER tab shows a `(N PENDING)` counter when there are unanswered requests. Response options from Infrastructure Spec §2.6 are displayed as a list but are NOT interactive — captioned with the exact path to edit `_ops/swarm/persistent/blackboard.jsonl`.

## Items to verify

### Pending requests rendering (populated screenshot)
1. **Pending requests visible.** At least one pending RESOURCE_REQUEST is rendered in the inbox area when on the TRICKSTER tab.
2. **Per-request fields shown.** Each pending item displays: `from`, `ts`, `resource`, `rationale`, `blocking` flag (true/false), `agent_health` (green/yellow/red color-coded), `agent_context_pct`, `agent_status`.
3. **Response options listed.** Each pending item shows the four response options from Infrastructure Spec §2.6: Grant — limited, Grant — unlimited, Deny — use palace only, Custom response.
4. **Response options NOT interactive.** The response options are styled as a static list, not as buttons or clickable links. They do NOT appear to invite clicks. (If they look like buttons, that's a fail — v0.1 is read-only.)
5. **Edit-the-file caption present.** Below the response options or at the inbox header, the caption reads exactly: `EDIT _ops/swarm/persistent/blackboard.jsonl TO RESPOND` (with the actual path) — directing the human to file-edit, not UI-click.

### Empty state (empty screenshot)
6. **Empty inbox copy.** When there are no pending requests, the copy reads: `NO PENDING REQUESTS. ALL AGENTS UNBLOCKED.` (or visually equivalent).
7. **No fake/placeholder requests.** The empty state does NOT show stub or example items. It's actually empty.

### Counter on TRICKSTER tab
8. **Pending counter on populated.** When the inbox has pending items, the TRICKSTER tab label shows `TRICKSTER (N PENDING)` where N is the actual count. Verify the count is correct for the screenshot.
9. **No counter on empty.** When the inbox is empty, the TRICKSTER tab shows just `TRICKSTER` — no `(0 PENDING)` clutter.

### Algorithm correctness (cross-checked against fixture)
10. **Paired request not shown.** If the fixture contains a RESOURCE_REQUEST with a matching RESOURCE_GRANT or RESOURCE_DENY (correlated by `re:` matching `request_id`), that request must NOT appear in the inbox.
11. **Unpaired request shown.** If the fixture contains a RESOURCE_REQUEST with no matching response, that request MUST appear in the inbox.

### Visual non-negotiables maintained
12. **Phosphor / amber / red palette only.** Inbox uses phosphor for primary, amber for FLAGS-style highlights, red for blocking flags or denies, cyan for handles. No off-palette colors.
13. **Single rendering mode for borders and rules.** Inbox cards (single-line CSS-bordered boxes per pending request), the `TRICKSTER INBOX · N pending` rule above them, and the title-bar inside each card all use the same CSS-border approach as the rest of the app. Rule lines fill the inbox column exactly — no overflow into the agents sidebar, no underflow short of the column edge. No character-cell `═══` or `───` rule fragments rendered as text.
14. **No rounded corners.**
15. **Monospace everywhere.**
16. **No emoji.**

### Smell test
17. **The inbox feels operational, not decorative.** Can you imagine actually using this to triage a queue of agent questions? Or does it feel like a mockup? The inbox should feel like a tool, not a screenshot.

## Return format

For each numbered item per screenshot, return:
```
[empty|populated] N. pass — <one-line citation>
[empty|populated] N. fail: <reason> — fix: <suggested change>
[empty|populated] N. n/a — <why not applicable>
```

End with:
- `[empty] verdict: pass | fail (<count>)`
- `[populated] verdict: pass | fail (<count>)`
- `OVERALL: pass` or `OVERALL: fail`
