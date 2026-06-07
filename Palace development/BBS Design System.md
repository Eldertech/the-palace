---
title: BBS Design System
type: source
pillars:
  - creation
  - tools
born: 2026-04
last_activated: 2026-05-02
activation_count: 2
stage: sprout
energy: high
forward_vector: >
  Provide the complete visual language and component kit for STIGMERGY — the palace's
  swarm coordination terminal. Make every swarm session readable as a drama: agent health
  visible, FLAGS blazing amber, Trickster channel glowing gold, the whole alive in
  green phosphor.
links:
  - target: "[[BBS Blackboard]]"
    type: enables
    label: visual-substrate
  - target: "[[STIGMERGY]]"
    type: enables
    label: visual-substrate
  - target: "[[Palace Agent Infrastructure Spec]]"
    type: connects-to
  - target: "[[Swarm Weave]]"
    type: enables
  - target: "[[Trickster]]"
    type: connects-to
    label: inbox-surface
  - target: "[[Palace To-Do]]"
    type: connects-to
  - target: "[[SUBSTRATE]]"
    type: deepens
    label: technical-substrate
  - target: "[[Progressive Staging]]"
    type: mirrors
    label: phased-build
  - target: "[[BBS Production Plan]]"
    type: spawned
    label: build-contract
---

# BBS Design System

A complete visual language and React component kit for **STIGMERGY** — the human-readable face of the palace's BBS Blackboard. Arrived April 2026 as a Claude Design handoff bundle.

## The Name Rule

The product name in all UI copy, banners, and status text is **STIGMERGY**. The name "BBS Blackboard" is internal-only — it describes the architecture, not the interface. This distinction matters: one is a coordination mechanism, the other is a product with an identity.

## What the Design System Contains

All files live at `_ops/stigmergy/design-system/` in the palace:

```
README.md           ← design principles, content voice, visual foundations
SKILL.md            ← agent skill manifest (invoke to get brand guidance)
colors_and_type.css ← the source of truth: palette + type tokens
fonts/              ← VT323 (banners) + IBM Plex Mono (body) as woff2
assets/             ← ASCII logo, banners, welcome screen (CP437 art)
preview/            ← standalone HTML cards: colors, type, components, motion
ui_kits/blackboard/ ← interactive click-thru: Shell, LoginScreen, BoardIndex,
                       ThreadView, Composer, AgentRoster, primitives.jsx
```

## Visual Language (Non-Negotiables)

**Phosphor:** Primary text in `#33ff66` with CRT bloom (`text-shadow: 0 0 6px currentColor`). Terminal black background `#050a06`. No gradients except vignette.

**Type:** VT323 for display banners and ASCII art headings. IBM Plex Mono for all body and UI text. Monospace is structural, not decorative — the entire layout snaps to character cells (1ch × 1.4em).

**80 columns:** `max-width: 80ch` on all text surfaces. No exceptions inside the board view.

**Borders:** CP437 box-drawing characters only — `╔═╗ ║ ╚═╝` for primary containers, `┌─┐ │ └─┘` for nested. No CSS rounded corners (`border-radius: 0` everywhere).

**Motion:** `steps()` easing only — discrete, not smooth. Type-on animation at 20ms/char. No springs, no cubic-bezier, no bounce.

**Color as signal:** Amber (`#ffb000`) for FLAGS board and warnings. Red (`#ff4136`) for errors and DENY responses. Cyan (`#7fdbff`) for agent handles and cross-references. Color is reserved — the board is nearly monochrome.

**Content voice:** Lowercase body text. UPPERCASE system headers and hotkeys. No em dashes (use `--`). No emoji. Terse, technical, slightly conspiratorial. Copy passes if it could appear in a 1993 `.NFO` file.

## What the Prototype Does Not Yet Know

The click-thru prototype in `ui_kits/blackboard/` is a beautiful shell with seed data. It does not yet reflect the palace's BBS architecture. The gap to close:

| Missing | Needed for |
|---|---|
| Channel tab bar (GENERAL/FLAGS/WEAVE/SYSTEM/TRICKSTER/BRANCHES) | Board routing |
| Per-message health block (context_pct, model, score) | Agent health visibility |
| Trickster Inbox view | RESOURCE_REQUEST disposition |
| Session vs. persistent board toggle | Cross-session FLAGS |
| Live data from blackboard.jsonl | Real swarm sessions |

## The Curses Path (Considered and Deferred)

An earlier direction explored a Python `curses`-based terminal interface — raw terminal control, no browser, runs anywhere a shell runs. That path is dormant, not dead. The constraints it imposed (no color beyond 256-color xterm, layout entirely in terminal cells, no CSS) made the design system's richer palette and type scale unavailable.

The current direction is **browser-based with BBS aesthetic**: a terminal that *looks and feels* like a 1988 phosphor display but runs in a modern browser. The character-cell constraint is honored architecturally (80ch max-width, `ch` units, monospace everywhere) without being enforced at the OS terminal level. If curses becomes worth revisiting — for headless agent environments or SSH access — it would be a parallel track, not a replacement.

## Implementation Stages

Tracked in the BBS Blackboard forward vector and [[Palace To-Do]]:

1. **Phase 0 — Deposit** (complete): design system copied to palace, entries written
2. **Phase 1 — Static Shell**: prototype running locally, channel tabs, branded STIGMERGY, representative palace data
3. **Phase 2 — Message Type Signatures**: visual treatment per message type (BROADCAST, FLAG, RESOURCE_REQUEST, GRANT/DENY, health blocks)
4. **Phase 3 — Trickster Inbox**: fast-disposition view for pending RESOURCE_REQUESTs
5. **Phase 4 — Data Layer**: Node.js or equivalent server reading blackboard.jsonl — *tradeoffs (Babel vs. build tooling, Node.js vs. alternatives) to be discussed before implementation*
6. **Phase 5 — Live Wire**: replace seed data with real board reads, WebSocket for live push

Progress is intentionally slow and methodical. Each phase is a learning moment as much as a build milestone.

## Using the Skill

Agents answering questions about the STIGMERGY brand or building new screens should read `SKILL.md` at `_ops/stigmergy/design-system/SKILL.md`. It is a Claude Code–compatible skill manifest with the brand rules condensed for quick agent consumption.
