---
name: bbs-blackboard-design
description: Use this skill to generate well-branded interfaces and assets for BBS Blackboard (codename Stigmergy) — a peer-to-peer agent coordination terminal with a green-phosphor, CP437, 80-column BBS aesthetic. Use for production code or throwaway prototypes, mocks, and slides.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes), copy assets out of `assets/` and `fonts/`, reference `colors_and_type.css`, and create static HTML files. The UI kit in `ui_kits/blackboard/` contains ready-to-lift components (Shell, LoginScreen, BoardIndex, ThreadView, Composer, AgentRoster, primitives).

If working on production code, treat `colors_and_type.css` as the source of truth for color + type tokens. Spacing (1ch × 1.4em, 80ch max width), borders (CSS styled to evoke CP437 weights: `3px double var(--phosphor-dim)` for primary containers, `1px solid var(--phosphor-dim)` for nested cards and rules; `border-radius: 0`), motion (steps() only — no bezier, no springs; use `--dur-type` for short headers, `--dur-type-banner` for full-screen banners), iconography (typed glyphs only — no emoji, avoid SVG icons), and tone (terse, lowercase body, UPPERCASE system, no em dashes) are all documented in the README.

Non-negotiables:
- Monospace everywhere. VT323 for banners, IBM Plex Mono for body.
- No rounded corners. No drop shadows (CRT bloom via `text-shadow` only).
- No emoji. No photographic imagery (1-bit dither if you must).
- ASCII art must align — always render via a single `<pre>` and count columns.

If the user invokes this skill without further guidance, ask what they want to build, ask a few questions about scope and whether they want variations, then act as an expert designer producing HTML artifacts or production code.
