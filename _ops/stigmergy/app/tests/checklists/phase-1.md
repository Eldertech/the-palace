# Phase 1 — Visual Validator Checklist

Applies to screenshot(s):
- `screenshots/phase-1-v0.2/general.png`
- `screenshots/phase-1-v0.2/flags.png`
- `screenshots/phase-1-v0.2/system.png`
- `screenshots/phase-1-v0.2/trickster.png`

## What this phase delivers

Foundation cleanup: v0.1.x polish items and design-system v0.2 findings landed on the board screen. The login screen has been removed; these screenshots show the board view directly. This phase verifies that the non-negotiable design rules hold across all four board views, and that the v0.1.x polish items (command-bar active state, no center-justified SYSTEM messages, FLAG render parity) are in place.

## Items to verify

For each item below, return one of:
- `pass` — with a one-line citation (what you saw in the screenshot that confirmed it)
- `fail: <reason>` — with the specific failure and a fix suggestion
- `n/a` — with a brief note

### Color & background
1. **Phosphor green primary text.** Active text reads as `#33ff66`-family green (slight bloom). Not lime, not neon-yellow, not muted forest green.
2. **Terminal black background.** Background is near-black with a faint green cast (`#050a06`-family). Not pure `#000000`, not gray, not navy.
3. **CRT bloom on text.** Active text has a soft glow (text-shadow), not a hard edge. Faint, not heavy.
4. **No gradients.** No CSS gradients anywhere except the optional CRT vignette at screen edges.

### Typography
5. **VT323 banner.** The board-title banner uses VT323 (or close — pixel-accurate terminal display font). Not a generic monospace fallback like Menlo or Courier.
6. **IBM Plex Mono body.** All UI/body text uses IBM Plex Mono (or the documented fallback chain). Should NOT visibly fall back to Menlo or system mono — the character widths and stroke weights should match the IBM Plex specimen.
7. **No proportional fonts.** Nothing on screen uses a proportional/sans-serif font. Everything is monospace.

### Layout & shape
8. **Page fills the viewport; per-line body wraps at ~78ch.** The board screen expands to use the full viewport width on a wide window — no max-width cap on the page. Within that, individual message body text still wraps at ~78ch for line-length readability. The two rules are distinct: page = viewport-wide; body line = 78ch.
9. **No rounded corners.** Every box, button, and input has `border-radius: 0`. No pill shapes, no soft corners.
10. **No drop shadows.** No box-shadows on cards or buttons (CRT bloom on text is allowed and expected).
11. **Single rendering mode for borders and rules.** All boxed regions and horizontal rules use the same rendering approach across the screen — CSS borders styled to evoke CP437 weight (`3px double` for primary containers, `1px solid` for nested or rules). Do NOT mix CSS-bordered and character-cell (`╔═╗ ║ ╚═╝` or `┌─┐ │ └─┘`) borders within the app — that mismatch is a v0.1.x bug. Double vs single line weight is preserved as a visual register; the character-cell approach has been retired.

### Brand & content voice
12. **STIGMERGY name visible.** The product name "STIGMERGY" appears in the status bar. The name "BBS Blackboard" should NOT appear in user-facing copy (internal-only term).
13. **Cracked-shareware tone.** The status bar has the "cracked by tRiCKSTER" or equivalent framing, in amber/red accents against phosphor.
14. **Lowercase body, UPPERCASE system.** Body copy is lowercase. System headers, banners, hotkey labels are UPPERCASE. No mixed-case sentences in system chrome.
15. **No emoji.** Zero emoji anywhere on screen. No 🚀, no ✅, no ⚠️. ASCII glyphs only.
16. **No em dashes in copy.** If a dash appears, it is `--`, not `—`.

### Motion
17. **No bounce/spring artifacts.** `n/a-by-default` for the board screen — these screenshots are static views with no login animation to capture. If any animation is visible in the screenshot, it must use discrete `steps()` easing, never cubic-bezier.

### Polish — command-bar active state
18. **Command-bar active-state highlighting.** The bottom command bar's `[N]LABEL` item for the currently active board is rendered in the inverted treatment (black text on phosphor-green fill), mirroring the top channel tab inversion. On the `general.png` screenshot, `[1]general` should be inverted. On `flags.png`, `[2]flags` should be inverted. On `system.png`, `[4]system`. On `trickster.png`, `[5]trickster`. Non-category keys (`[R]RELOAD`, `[V]VISUAL`) are NOT inverted.

### Polish — SYSTEM message rendering
19. **SYSTEM messages are not center-justified.** On `system.png`, SESSION_INIT and SESSION_CLOSE messages are dim and visually distinct as system, but their text is left-aligned, NOT center-aligned. Center justification was the v0.1 treatment and has been removed.

### Polish — FLAG message rendering
20. **FLAG messages render claim/targets/confidence.** On `flags.png`, any FLAG message that carries `payload.claim` renders it as the headline body (not JSON). `payload.target_entries` appears as a small dim-cyan metadata line prefixed `→`. `payload.confidence` appears as a colored inline tag (green for `high`, amber for `medium`, red for `low`).

### Smell test
21. **The spell.** Looking at the whole screenshot: does it read as a 1988 phosphor BBS terminal? If something feels modern/SaaS — round button, soft shadow, sans-serif fragment, blue link — call it out. The validator's eye for "wrongness" is the most valuable signal at this phase.

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
