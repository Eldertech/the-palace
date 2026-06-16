# Remotion — Test Plan

> Phase E rollout. Remotion is the Shop's UI-motion Specialist — React-based mockups, interface walks, palace-navigation reels. Smoke for this round leans on the 2026-05-26 Kuramoto Round 1 `phenomena-walk.mp4` artifact + its source; a fresh Remotion render requires a Node project bootstrap and a Chromium spin (heavy for ceremony).

Last run: **2026-05-30** — Smoke pass via existing artifact verification (`Kuramoto Coupling/phenomena-walk.mp4` + `phenomena-walk/` source directory both present); live re-render deferred to next Remotion brief.

## Smoke

**Existing-artifact verification:**

```sh
test -f "Kuramoto Coupling/phenomena-walk.mp4" \
  && test -d "Kuramoto Coupling/phenomena-walk"
```

**Live re-render** (when a Remotion brief lands):

```sh
# cd into the Remotion project, npm install, npx remotion render <comp> out.mp4
# Determinism check: same React source + same Remotion version → byte-identical
# output (Remotion uses Puppeteer's deterministic-rendering mode by default).
```

- **Automated (cheap):** existing-artifact check above.
- **Last run (2026-05-30):** Kuramoto phenomena-walk artifact + source dir both present.

## Capability Probe

| Capability                          | Last run                                          |
|--------------------------------------|----------------------------------------------------|
| Multi-segment palace-walk UI motion | `phenomena-walk.mp4` (2026-05-26) — OK            |
| React component composition          | covered by phenomena-walk source                  |
| Per-frame data injection (`useCurrentFrame`) | covered by phenomena-walk source         |

- **Last run (2026-05-30):** three of three covered by the Kuramoto Round 1 phenomena-walk.

## Style Probe

Remotion is React-on-canvas — fully author-controlled. The Loudon Live design system's CSS tokens (the `colors_and_type.css` file) drop in via standard React import; the standing pattern is to import the canonical CSS at the top of the root composition and use CSS custom properties (`var(--accent)` etc.) in styled components.

- **Manual:** read a Remotion component, confirm it uses `var(--accent)` style references, not hardcoded hex.
- **Last run (2026-05-30):** Kuramoto phenomena-walk pre-dates the design system (uses the indigo/amber palette directly); future Remotion artifacts should adopt token-based styling.

## Edge Probe

- **Missing Chromium**: Remotion errors loudly at first render (`puppeteer` complains it can't find Chrome). Mitigation: Remotion's first run downloads Chromium if not present; the Specialist requires a non-sandboxed host with disk + network for this.
- **Component throwing inside `Composition`**: the render fails with the React error in the Remotion CLI output. Loud, ✓.

- **Last run (2026-05-30):** edge probes not re-exercised; behaviours documented.

## Speed Bench

Reference host: **mac**. Per Kuramoto Round 1: ~30 s phenomena-walk took ~20 s to render via Remotion's parallel Puppeteer workers. Fast for the medium.

## Determinism

Remotion is *intended* deterministic — Puppeteer's deterministic-rendering mode + fixed React props → byte-identical output. The reproducibility artifact is the source `.tsx` + Remotion version + the input props object.

- **Reproducibility artifact:** Remotion project source + version + props.
- **Last run (2026-05-30):** byte-determinism not exercised this round (would require re-running the project); claim documented from Remotion's contract.
