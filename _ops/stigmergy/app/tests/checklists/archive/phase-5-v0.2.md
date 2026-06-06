# Phase 5 v0.2 — Visual Validator Checklist

Applies to screenshot(s):
- `screenshots/phase-5-v0.2/live-connected.png`
- `screenshots/phase-5-v0.2/live-message-arrived.png`

## What this phase delivers

Live Tail Integration: the message list auto-updates without a page reload via SSE. The static `uplink ok` text in the status bar has been replaced with a real connection-state indicator showing `LIVE` (phosphor green), `RECONNECTING` (amber), or `OFFLINE` (red). Tab badges for FLAGS and TRICKSTER reflect incoming messages even when those boards are not active.

`live-reconnecting.png` is SKIPPED for v0.2. Capturing a genuine RECONNECTING state requires killing the dev server mid-test, which is out of scope. The `data-state="reconnecting"` attribute path is verified structurally in `live-tail.spec.js`. Manual smoke-test can confirm the amber indicator.

## Items to verify

For each item below, return one of:
- `pass` — with a one-line citation (what you saw in the screenshot that confirmed it)
- `fail: <reason>` — with the specific failure and a fix suggestion
- `n/a` — with a brief note

### Live indicator

1. **LIVE indicator is visible.** The status bar shows a connection state indicator — either `● LIVE`, `● RECONNECTING`, or `● OFFLINE`. The bullet character `●` precedes the state label. The indicator is present in both screenshots.

2. **LIVE indicator color is phosphor green when connected.** On `live-connected.png`, the indicator should read `● LIVE` in the same phosphor green (`#33ff66`-family) as body text, with CRT bloom. Not amber, not red.

3. **LIVE indicator placement consistent with prior `uplink ok` slot.** The indicator occupies the right side of the status bar, flush right, in the same position the former `uplink ok` text occupied. No other status-bar element has shifted or disappeared.

4. **Dot character is visible.** The `●` (unicode BULLET, U+25CF) is rendered in the indicator. Not replaced by a `*`, not missing, not an emoji circle.

### Tab badges

5. **FLAGS tab badge reflects message count correctly.** On `live-message-arrived.png`, the FLAGS tab badge shows a count greater than it had before the live message was appended. The badge format is consistent with the existing non-live badge format (e.g., `(N)` style).

6. **No stale `(N PENDING)` text on TRICKSTER when not relevant.** On both screenshots: if no unresponded RESOURCE_REQUESTs exist, the TRICKSTER tab shows no `PENDING` counter. If they do exist, the counter is present and matches the actual count.

### Live-arrived message

7. **Live-arrived message visible in FLAGS board.** On `live-message-arrived.png`, the FLAGS board is the active view and shows the newly appended FLAG message. The message appeared without a manual page reload.

8. **Newest message at the top.** The live-arrived message appears at or near the top of the message list (newest-first ordering, sorted by `ts`). A test message with a fresh `ts` should be the topmost or one of the topmost entries.

### Non-negotiable design rules

9. **Voice: lowercase body, UPPERCASE system.** Body copy is lowercase. System chrome, hotkeys, and banners are UPPERCASE. No mixed-case sentences in system chrome.

10. **No center-justification anywhere.** No message body, no indicator label, no metadata line is center-aligned. Left-aligned throughout.

11. **No rounded corners.** Every box, button, and container has `border-radius: 0`. Applies to the live indicator span as well — it must not have a pill shape.

12. **No em dashes.** If a dash appears in any copy, it is `--`, not `—`.

13. **No emoji.** Zero emoji anywhere on screen, including inside the live indicator label.

14. **Phosphor green primary text with CRT bloom.** Active text has the characteristic soft glow. The LIVE indicator participates in this aesthetic.

15. **Terminal black background.** Background is near-black, no white or light-gray panels.

### Smell test

16. **The spell.** Looking at both screenshots holistically: does the live indicator read as native BBS chrome, or does it feel like a modern "status pill"? It should feel like a CRT system readout, not a SaaS connectivity badge. If the indicator's styling breaks the terminal aesthetic — wrong color, rounded edges, too large, too styled — call it out.

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
