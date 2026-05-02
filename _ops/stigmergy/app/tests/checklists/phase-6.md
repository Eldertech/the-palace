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
17. **CP437 box-drawing aligned across all views.** No broken joints in any rendered card.
18. **80ch max-width on all body text.** No wrapping past 80 columns.

### Voice
19. **Lowercase body, UPPERCASE system.** Consistent across all views.
20. **No em dashes in copy.** Use of `--` only.
21. **No emoji anywhere.** Sweep all screenshots — zero emoji.

### Layout
22. **Two-pane layouts respect 120ch combined width.** No overflow.
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
