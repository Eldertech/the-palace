# Phase 3 — Visual Validator Checklist

Applies to screenshot(s):
- `screenshots/phase-3/general.png`
- `screenshots/phase-3/flags.png`
- `screenshots/phase-3/weave.png`
- `screenshots/phase-3/system.png`
- `screenshots/phase-3/trickster.png`
- `screenshots/phase-3/branches.png`

Apply this checklist to **each** screenshot. The border-rendering consistency item (#18) is the highest-stakes check at this phase.

## What this phase delivers
Six channel tabs (GENERAL/FLAGS/WEAVE/SYSTEM/TRICKSTER/BRANCHES). Active tab is inverted. Clicking filters messages by `board`. Each message type from Infrastructure Spec §2.4 has a distinct visual signature.

## Items to verify

### Channel tabs
1. **All six tabs present.** GENERAL, FLAGS, WEAVE, SYSTEM, TRICKSTER, BRANCHES — all six are visible in the tab bar, in this order or a documented order.
2. **Active tab inverted.** The currently-selected tab has black text on phosphor-green fill. Inactive tabs are dim green on terminal black.
3. **Tab labels UPPERCASE.** All tab labels are UPPERCASE.
4. **Tab affordance: brackets or hotkey hint.** Each tab indicates its hotkey via `[1]GENERAL` style bracket-prefix or equivalent.

### Filtering
5. **Messages match the active tab.** Every message visible in the message list has `board` matching the active tab (e.g., on the FLAGS screenshot, every message has `board: "FLAGS"`). NO messages from other boards leak through.
6. **Empty board state.** If the active tab's filter returns no messages, the copy reads: `NO TRACES ON THIS BOARD YET.` (or visually equivalent). If the board is populated, mark `n/a`.

### Message-type signatures (per Infrastructure Spec §2.4)
For whichever message types appear in this screenshot:
7. **BROADCAST** — neutral phosphor, no prefix glyph.
8. **FLAG** — amber accent (`#ffb000`-family) and a `!` prefix glyph.
9. **REPLY** — `> ` prefix; metadata line shows `re:` target id in dim green.
10. **PROOF** — double-line box border (CSS `3px double`, the visual register CP437 `╔═╗ ║ ╚═╝` evoked); proof object visible/expanded.
11. **RESOURCE_REQUEST** — gold/cyan accent on the resource handle; `?` prefix.
12. **RESOURCE_GRANT** — green check or `+` indicator; rendered dim.
13. **RESOURCE_DENY** — red accent (`#ff4136`-family); `x` prefix.
14. **QUERY** — visually distinct from BROADCAST (italic-equivalent in VT323/Plex Mono — likely a styling treatment, since true italic doesn't exist in these fonts).
15. **SESSION_INIT / SESSION_CLOSE** — system-level styling: dim, centered, or otherwise visually marked as system not agent.
16. **PAGE_UPDATE** — dim cyan with a file-path prefix.
17. **HEALTH_NOTICE** — yellow border for `yellow` health, red border for `red` health.

If a type does not appear in this screenshot, mark its item `n/a`.

### Border rendering consistency (HIGHEST-STAKES)
18. **Single rendering mode across the page.** Every box, panel, and horizontal rule on the screen uses the same rendering approach — CSS borders styled to evoke CP437 weight. No fragments of character-cell ASCII rules (`═══` or `───` lines emitted as text) survive alongside CSS-bordered cards. If you see one rule fitting its column cleanly while another rule of the same kind overflows or stretches inconsistently, that is the bug this item exists to catch.
19. **Border weight signals nesting.** Outer cards use double-line (CSS `3px double`); nested cards use single-line (CSS `1px solid`). No mixing within the same nesting depth.
20. **Borders meet flush at corners.** Every card is a complete rectangle: top, right, bottom, left borders all of the same weight, all visible, all meeting at right angles. No missing edges; no stylistic asymmetries.

### Visual non-negotiables maintained
21. **Phosphor green / terminal black palette intact.** Color is reserved for status: amber for FLAGS, red for errors/DENY, cyan for handles/PAGE_UPDATE, dim for metadata. No off-palette colors.
22. **No rounded corners.** Square edges everywhere.
23. **No emoji.** Zero emoji.
24. **80ch max-width respected.** No message wraps past ~80 columns.

### Smell test
25. **The drama is legible.** Looking at this channel: can you tell at a glance what kind of activity is on this board? FLAGS should feel hot. SYSTEM should feel dim/structural. TRICKSTER should feel like the threshold to a human. The visual signatures should make the board readable as a drama.

## Return format

For each numbered item per screenshot, return:
```
[<screenshot-name>] N. pass — <one-line citation>
[<screenshot-name>] N. fail: <reason> — fix: <suggested change>
[<screenshot-name>] N. n/a — <why not applicable>
```

End with a per-screenshot verdict and an aggregate verdict:
- `[<screenshot>] verdict: pass | fail (<count>)`
- `OVERALL: pass` (all six screenshots passed) or `OVERALL: fail (<screenshots that failed>)`
