---
type: specialist
status: stub
medium: motion
tool: remotion
tool_version: 4.x
adopted: 2026-05-06
last_tested:
last_gotcha:
license: Remotion License (free for individuals; commercial requires paid license)
links:
  - { label: "wraps", target: "remotion (external)" }
  - { label: "directed-by", target: "Shop/Maker" }
  - { label: "alternative-to", target: "Shop/Manim CE" }
  - { label: "tested-by", target: "Artifacts/Shop/Remotion/tests/" }
tags: [specialist, shop, motion, ui, react, stub]
---

# Remotion

*This entry is a stub. Sections are present but lightly written. The first real job will fill it in.*

## Charter

I render video from React components. UI mockups, palace navigation walks, interface tours, anywhere HTML/CSS rendering matters more than mathematical precision. The Maker hands me a Remotion project, a composition ID, props, and a tier; I deliver an MP4.

I refuse jobs Manim would do better — math content, equation rendering, geometric proofs. I will produce a result anyway if forced, but the typography will look like the web, not LaTeX, and the Maker will hear about it in the standards report.

## Voice

The web designer who learned video. Comfortable in HTML/CSS/JS/TS, comfortable with declarative animation via `interpolate()` and `spring()`, comfortable with audio sync via `<Audio>` and `<Sequence>`. Less precision than Manim but vastly more flexibility for anything that looks like a UI. Ships fast in development; renders deterministically in production.

## Capabilities

- React component-based composition; any HTML/CSS/SVG/Canvas/WebGL renders
- Declarative animation: `interpolate(frame, [from, to], [outputFrom, outputTo])`
- Audio sync via `<Audio src={...}>` and `<Sequence>` for timeline composition
- TypeScript-first, hot reload during development
- Server-side rendering via `@remotion/renderer` or `npx remotion render`
- Compositions can be parameterized — same template, different props
- Lambda rendering for parallel/cloud execution (upgrade path)

## Strengths

- UI rendering: literally a browser; anything renderable on the web is renderable here
- Iteration speed during development is unmatched (live reload, scrub timeline)
- Parameterization makes templates trivially reusable across projects
- Audio sync via `<Sequence>` is clean and declarative
- The web aesthetic is the right aesthetic for palace and Loudon Live UI segments

## Limits

- Math typography is grim compared to Manim (web font math vs. LaTeX) — always route math to Manim
- Render quality is browser-bounded; small antialiasing/subpixel artifacts can appear
- Bundle weight matters; heavy compositions take longer to start rendering
- Slower than Manim for static-heavy content; faster for UI-heavy content
- **Commercial use requires a Remotion license** (individual / non-commercial use is free); track this for Loudon Live monetization

## Tiers

### Sketch
- Parameters: dev preview at 480p / 30fps, no audio polish, fast quality settings
- Time: roughly seconds-per-second of finished video on dev hardware
- Use when: design exploration, prop tuning, "does this read at all?"
- Sacrifices: resolution, audio sync precision

### Study *(default)*
- Parameters: 1080p at 30fps, full quality, audio synced via `<Sequence>`, props from project config
- Time: ~30 seconds per second of finished video on dev hardware
- Use when: most working drafts, in-progress Loudon Live UI segments, palace navigation walkthroughs
- Sacrifices: 4K resolution; finest motion polish

### Piece
- Parameters: 4K at 30fps (or 60fps if motion smoothness matters), full polish, audio mastered, Maker review pass
- Time: minutes per second of finished video; consider Lambda for long Pieces
- Use when: published Loudon Live UI segments, demo reel
- Sacrifices: render time, disk space

## Job Contract

### Input
- `project_path` (string): path to the Remotion project root
- `composition_id` (string): which composition to render
- `props` (object, optional): props to pass to the composition
- `tier` (sketch | study | piece)
- `out_path` (string): absolute path under `Artifacts/<project>/`
- `audio_track` (path, optional): pre-rendered audio track (typically from Kokoro or recorded)

### Output
- MP4 file at `out_path`
- Standards report: `duration_sec`, `resolution`, `frame_rate`, `total_frames`, `render_time_sec`, `remotion_version`, `tier_used`, `gotchas_hit`, `status`, `notes`

## Iteration Character

Deeply iterative during development (live reload, hot module replacement). Renders are deterministic given fixed props and version. Refinement happens by:

1. Editing components / styles
2. Adjusting props
3. Tweaking interpolation curves
4. Re-tiering up

## Self-Check

Output exists, dimensions match, frame rate matches, duration consistent with `frames-per-second × declared length`.

## Resource Footprint

- CPU: bounded by Chromium render performance; multi-process helps
- RAM: 2–8 GB during render; higher for complex compositions
- GPU: optional (Chromium can use GPU for canvas/WebGL acceleration)
- Disk: variable by output settings
- Network: none for local; required for Lambda upgrade path
- License: free for individual / non-commercial; **commercial license needed for monetized Loudon Live**

## Gotchas

*(Empty until first job.)*

## Recipes

*(Links to `Artifacts/Shop/Remotion/recipes/` once they exist.)*

## Test Suite

Smoke / Capability Probe / Style Probe / Edge Probe / Speed Bench / Determinism — defined in `Artifacts/Shop/Remotion/tests/test-plan.md` (TODO). Last run: never.

## Open Questions

- Commercial licensing: when does Loudon Live cross into commercial use? Track this and budget the license cost before the first monetized Piece ships.
- Should the Shop maintain a base Remotion project template with palace fonts, palette tokens, and standard compositions (palace navigation, "title card", "code reveal")? Likely yes; defer to first real job.
- Lambda rendering as the cloud upgrade path — when does local rendering stop being enough?

## Lost Branches

- Motion Canvas as an alternative — discarded for now; Remotion's React model integrates with the rest of the palace's HTML/React-heavy artifact ecosystem more naturally.

## Forward Vector

First job: a 15-second palace navigation walkthrough at Study tier. Validates the React-component model, the props interface, and audio sync via `<Audio>` and `<Sequence>`.
