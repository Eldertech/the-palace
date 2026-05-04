# Phase 6 — Visual Validator Checklist

Applies to screenshot(s):
- `screenshots/phase-6/login.png`
- `screenshots/phase-6/general.png`
- `screenshots/phase-6/flags.png`
- `screenshots/phase-6/trickster-inbox.png`
- `screenshots/phase-6/scanlines-off.png`

This is the comprehensive sweep. It re-checks every non-negotiable across the application's main views and verifies the polish features specific to Phase 6: type-on motion, scanline overlay, hotkey footer, status bar, full hotkey behavior.

Apply the relevant items to each screenshot. Some items only apply to specific screenshots (noted inline).

## Polish features (specific to Phase 6)

### Type-on motion
1. **Login banner uses type-on.** [login.png] If the login screenshot was captured mid-animation, the banner shows a partial type-in (only the first N characters visible). If captured after completion, the full banner shows. Either is acceptable. What's NOT acceptable: any easing artifact suggesting cubic-bezier or smooth interpolation.
2. **Steps() motion only.** If any animation appears mid-frame in any screenshot, it shows discrete `steps()` behavior — never smooth fade or slide.

### Scanlines
3. **Scanlines on by default.** [login, general, flags, trickster-inbox] Subtle horizontal scanline overlay is visible (~2px stripes at low opacity). Should be present, faint, not distracting.
4. **Scanlines off when toggled.** [scanlines-off.png] The scanline overlay is fully gone. Background is clean phosphor/black with no horizontal striping.
5. **Toggle affordance present.** A `[V]` hotkey or `[V]ISUAL OFF` link is visible in the command bar in all states.

### Status bar (header)
6. **Status bar pinned to top.** [all] A status bar is at the top of the viewport in every view.
7. **Status bar contents.** Status bar shows (in some order): `BLACKBOARD` or `STIGMERGY`, `NODE 01` (or equivalent), `@<handle>`, current time, and `[N] NEW` or `[N] PENDING` indicator if applicable.

### Command bar (footer)
8. **Command bar pinned to bottom.** [all] A command bar is at the bottom of the viewport in every view.
9. **Hotkey list shown.** Command bar lists at minimum: `[1-6] CHANNEL  [R]ELOAD  [V]ISUAL  [Q]UIT`. Each hotkey letter is wrapped in brackets.
10. **Hotkey label casing.** All hotkey labels UPPERCASE.

### README
11. **README updated.** [n/a — verify by file inspection if needed] `_ops/stigmergy/app/README.md` includes screenshots or ASCII captures of major views. (The validator may mark this `n/a` and let the gate verify by file existence — but flag if the README is missing entirely.)

## Comprehensive non-negotiables sweep

For ALL screenshots, verify:

### Color
12. **Phosphor green primary, terminal black background.** Across all views, the palette is consistent.
13. **Color reserved for signal.** Amber appears only on FLAGS or warnings, red only on errors/DENY/red-health, cyan only on handles/links/PAGE_UPDATE. No decorative off-palette color.

### Typography
14. **VT323 banners, IBM Plex Mono body.** No unexpected font substitutions visible.
15. **No proportional fonts.** All text monospace.

### Shape
16. **`border-radius: 0` everywhere.** No rounded corners in any view.
17. **Single rendering mode for borders and rules across all views.** Every box, panel, and horizontal rule on every screenshot uses the same CSS-border rendering approach. No view contains character-cell ASCII rule fragments (`═══`, `───`) rendered as text alongside CSS-bordered cards. Rules and box edges fill their containers exactly; no rule overflows its column or stops short of the column edge. Double vs single line weight is preserved as a visual register (CSS `3px double` vs `1px solid`).
18. **Per-message body wraps at ~78ch for readability.** Long lines of message body text break at ~78ch even when the containing card is wider — that's the line-length readability rule, separate from page width. The page itself fills the viewport (see #22).

### Voice
19. **Lowercase body, UPPERCASE system.** Consistent across all views.
20. **No em dashes in copy.** Use of `--` only.
21. **No emoji anywhere.** Sweep all screenshots — zero emoji.

### Layout
22. **Page fills the viewport.** The board screen has no max-width cap — content (status bar, board title, channel tabs, message list + agents pane, command bar) all expand to use the full viewport width on a wide window. Empty letterboxing on either side of the content is a fail.
23. **No drop shadows.** No box-shadows on any element. CRT bloom (text-shadow) on text is allowed.

## Smell test (the most important item)
24. **The spell is unbroken.** [all] Looking at the full set of screenshots: do they read as a unified, consistent 1988 phosphor BBS terminal? Or does some view feel like a different product? Coherence across views is the v0.1 acceptance test — this is what Loudon will look at first.

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
