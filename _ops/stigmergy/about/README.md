# The Palace — About / SYSTEM INFO bulletin

A self-contained About page for The Palace, rendered in the STIGMERGY /
cracked-shareware BBS aesthetic. It is the aesthetic descendant of the retired
`LoginScreen`: the dial-in ritual that became an unnecessary entry-step is
redirected here into a sysop "node stats" bulletin you visit on purpose.

## Files
- `build-about.py` — the collector + renderer. Scans the working tree and git,
  computes live statistics (entries, type/stage distribution, typed links,
  commits, disk footprint, uptime, hubs), and bakes them into a self-contained
  `index.html` (no server or build step required to view).
- `index.html` — the generated page. Regenerable; do not hand-edit the numbers.

## Refresh the numbers
```bash
python3 _ops/stigmergy/about/build-about.py
```
Re-run after meaningful palace growth so the bulletin doesn't rot. The footer
stamps the git commit time it was generated against.

## Preview
A static server rooted at the palace root serves it (the page's relative font
paths resolve from there). See the `about` config in `.claude/launch.json`,
then open `/_ops/stigmergy/about/index.html`.

## Design notes
- Uses the [[BBS Design System]] grammar (green phosphor, VT323 + IBM Plex Mono,
  80-column, CP437-weight **CSS** borders, scanline + vignette overlays). This is
  the sanctioned visual-language override; the Loudon Live default does not apply.
- "blackboard" never appears in UI copy — the product name is STIGMERGY.
- The entry-types chart shows non-canonical `type:` values in dim green with a
  note that SCHEMA §1 defines 12 — an honest snapshot that doubles as a drift cue.
