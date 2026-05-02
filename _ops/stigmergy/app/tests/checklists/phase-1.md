# Phase 1 — Visual Validator Checklist

Applies to screenshot(s): `screenshots/phase-1/login.png`

## What this phase delivers
A working dev server that boots and shows the STIGMERGY login screen rendered with the design system's tokens. No data, no channel tabs — just: "the spell is on." The page reads as a 1988 phosphor terminal, not a 2026 SaaS.

## Items to verify

For each item below, return one of:
- `pass` — with a one-line citation (what you saw in the screenshot that confirmed it)
- `fail: <reason>` — with the specific failure and a fix suggestion

### Color & background
1. **Phosphor green primary text.** Active text reads as `#33ff66`-family green (slight bloom). Not lime, not neon-yellow, not muted forest green.
2. **Terminal black background.** Background is near-black with a faint green cast (`#050a06`-family). Not pure `#000000`, not gray, not navy.
3. **CRT bloom on text.** Active text has a soft glow (text-shadow), not a hard edge. Faint, not heavy.
4. **No gradients.** No CSS gradients anywhere except the optional CRT vignette at screen edges.

### Typography
5. **VT323 banner.** The STIGMERGY ASCII banner uses VT323 (or close — pixel-accurate terminal display font). Not a generic monospace fallback like Menlo or Courier.
6. **IBM Plex Mono body.** All UI/body text uses IBM Plex Mono (or the documented fallback chain). Should NOT visibly fall back to Menlo or system mono — the character widths and stroke weights should match the IBM Plex specimen.
7. **No proportional fonts.** Nothing on screen uses a proportional/sans-serif font. Everything is monospace.

### Layout & shape
8. **80-column discipline.** The main content sits within an 80ch (or visually equivalent) max-width column, centered or left-aligned in the viewport. Not edge-to-edge on a wide monitor.
9. **No rounded corners.** Every box, button, and input has `border-radius: 0`. No pill shapes, no soft corners.
10. **No drop shadows.** No box-shadows on cards or buttons (CRT bloom on text is allowed and expected).
11. **CP437 box-drawing on any drawn cards.** If the login screen renders any boxed regions, they use `╔═╗ ║ ╚═╝` or `┌─┐ │ └─┘` characters, not CSS borders alone.

### Brand & content voice
12. **STIGMERGY name visible.** The product name "STIGMERGY" appears in the banner area or status bar. The name "BBS Blackboard" should NOT appear in user-facing copy (internal-only term).
13. **Cracked-shareware tone.** The opening screen has the "cracked by tRiCKSTER" or equivalent intro framing, in amber/red accents against phosphor.
14. **Lowercase body, UPPERCASE system.** Body copy is lowercase. System headers, banners, hotkey labels are UPPERCASE. No mixed-case sentences in system chrome.
15. **No emoji.** Zero emoji anywhere on screen. No 🚀, no ✅, no ⚠️. ASCII glyphs only.
16. **No em dashes in copy.** If a dash appears, it is `--`, not `—`.

### Motion (static screenshot can only verify what's frozen)
17. **No bounce/spring artifacts.** If any animation is mid-flight in the screenshot, it is a discrete frame consistent with `steps()` easing — not a smooth in-between of a cubic-bezier. (If nothing is animating in the screenshot, mark this item `n/a` rather than pass/fail.)

### Smell test
18. **The spell.** Looking at the whole screenshot: does it read as a 1988 phosphor BBS terminal? If something feels modern/SaaS — round button, soft shadow, sans-serif fragment, blue link — call it out. The validator's eye for "wrongness" is the most valuable signal at this phase.

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
