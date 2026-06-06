# Phase 6 — Visual Validator Checklist

Applies to screenshot(s):
- `screenshots/phase-6-v0.2/general.png`
- `screenshots/phase-6-v0.2/flags.png`
- `screenshots/phase-6-v0.2/system.png`
- `screenshots/phase-6-v0.2/trickster.png`
- `screenshots/phase-6-v0.2/scanlines-off.png`
- `screenshots/phase-6-v0.2/live-connected.png`

This is the comprehensive sweep. It re-checks every non-negotiable across the application's main views and verifies the polish features specific to Phase 6: type-on motion on the board-title banner, scanline overlay, hotkey footer with active-state highlight, status bar with live-tail indicator, full hotkey behavior.

Apply the relevant items to each screenshot. Some items only apply to specific screenshots (noted inline).

## Polish features (specific to Phase 6)

### Type-on motion
1. **Type-on motion on the board-title banner.** [general, flags, system, trickster] The board title banner (e.g. "general board") types in character by character on first paint. If the screenshot was captured mid-animation, it shows a partial sequence. If captured after completion, the full title shows. What is NOT acceptable: any easing artifact suggesting cubic-bezier or smooth interpolation.
2. **Steps() motion only.** If any animation appears mid-frame in any screenshot, it shows discrete `steps()` behavior — never smooth fade or slide.

### Scanlines
3. **Scanlines on by default.** [general, flags, system, trickster, live-connected] Subtle horizontal scanline overlay is visible (~2px stripes at low opacity). Should be present, faint, not distracting.
4. **Scanlines off when toggled.** [scanlines-off.png] The scanline overlay is fully gone. Background is clean phosphor/black with no horizontal striping.
5. **Toggle affordance present.** A `[V]ISUAL` item is visible in the command bar in all states.

### Status bar (header)
6. **Status bar pinned to top.** [all] A status bar is at the top of the viewport in every view.
7. **Status bar contents.** Status bar shows (in some order): `STIGMERGY`, `NODE 01` (or equivalent), current time, and an unread/pending indicator if applicable.

### Command bar (footer)
8. **Command bar pinned to bottom.** [all] A command bar is at the bottom of the viewport in every view.
9. **Hotkey list shown.** Command bar lists at minimum: `[1]GENERAL  [2]FLAGS  [3]WEAVE  [4]SYSTEM  [5]TRICKSTER  [6]BRANCHES  [R]ELOAD  [V]ISUAL`. Each hotkey letter is wrapped in brackets.
10. **Hotkey label casing.** All hotkey labels lowercase (matching the board name convention) or UPPERCASE (if that is the chosen treatment) — consistent across all views.
11. **Command-bar active-state highlight.** [all board screenshots] The command-bar item corresponding to the active board is inverted (black text on phosphor-green fill), mirroring the top channel-tab inversion. Cross-reference Phase 1 #18. Non-category keys (`[R]`, `[V]`) are NOT inverted.

### Live-tail indicator
12. **Live-tail connection indicator.** [live-connected.png] The status bar (or a dedicated indicator area) shows `LIVE` (or equivalent) in phosphor green when the SSE connection is active. The prior `uplink ok` text has been replaced by this real connection state. `RECONNECTING` and `OFFLINE` states are also defined but may not be visible in a single screenshot — they should be documented in code.

### README
13. **README updated.** [n/a — verify by file inspection if needed] `_ops/stigmergy/app/README.md` includes documentation of the new POST and SSE endpoints and the click-to-respond flow. The validator may mark this `n/a` and let the gate verify by file existence — but flag if the README is missing entirely.

## Comprehensive non-negotiables sweep

For ALL screenshots, verify:

### Color
14. **Phosphor green primary, terminal black background.** Across all views, the palette is consistent.
15. **Color reserved for signal.** Amber appears only on FLAGS or warnings, red only on errors/DENY/red-health, cyan only on handles/links/PAGE_UPDATE. No decorative off-palette color.

### Typography
16. **VT323 banners, IBM Plex Mono body.** No unexpected font substitutions visible.
17. **No proportional fonts.** All text monospace.

### Shape
18. **`border-radius: 0` everywhere.** No rounded corners in any view.
19. **Single rendering mode for borders and rules across all views.** Every box, panel, and horizontal rule on every screenshot uses the same CSS-border rendering approach. No view contains character-cell ASCII rule fragments (`═══`, `───`) rendered as text alongside CSS-bordered cards. Rules and box edges fill their containers exactly; no rule overflows its column or stops short of the column edge. Double vs single line weight is preserved as a visual register (CSS `3px double` vs `1px solid`).
20. **Per-message body wraps at ~78ch for readability.** Long lines of message body text break at ~78ch even when the containing card is wider — that is the line-length readability rule, separate from page width. The page itself fills the viewport (see #24).

### Voice
21. **Lowercase body, UPPERCASE system.** Consistent across all views.
22. **No em dashes in copy.** Use of `--` only.
23. **No emoji anywhere.** Sweep all screenshots — zero emoji.

### Layout
24. **Page fills the viewport.** The board screen has no max-width cap — content (status bar, board title, channel tabs, message list + agents pane, command bar) all expand to use the full viewport width on a wide window. Empty letterboxing on either side of the content is a fail.
25. **No drop shadows.** No box-shadows on any element. CRT bloom (text-shadow) on text is allowed.

### SYSTEM message rendering
26. **SYSTEM messages are not center-justified.** On `system.png`, SESSION_INIT and SESSION_CLOSE messages are dim and visually distinct, but their text is left-aligned, NOT center-aligned.

### FLAG message rendering
27. **FLAG messages render claim/targets/confidence.** On `flags.png`, FLAG messages with structured payloads show `claim` as the headline body, `target_entries` as a dim-cyan `→ entry, entry` line, and `confidence` as a colored tag.

## Smell test (the most important item)
28. **The spell is unbroken.** [all] Looking at the full set of screenshots: do they read as a unified, consistent 1988 phosphor BBS terminal? Or does some view feel like a different product? Coherence across views is the v0.2 acceptance test — this is what Loudon will look at first.

## Return format

For each item, return per-screenshot results where applicable:
```
[<screenshot-name>] N. pass — <one-line citation>
[<screenshot-name>] N. fail: <reason> — fix: <suggested change>
[<screenshot-name>] N. n/a — <why not applicable>
```

For items that apply across all screenshots (the comprehensive sweep), one verdict per item is enough — call out which screenshots had problems if any.

End with:
- Per-screenshot verdicts
- `OVERALL: pass` (the spell is unbroken, every item passed) or `OVERALL: fail (<reasons>)`
