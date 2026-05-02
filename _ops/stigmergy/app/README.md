# STIGMERGY — v0.1 (read-only viewer)

A browser-based BBS terminal that renders the palace's `blackboard.jsonl`
files with the full STIGMERGY visual language. Read-only in v0.1: the
file on disk is the truth; the UI is the lens. To respond to a Trickster
request, edit `_ops/swarm/persistent/blackboard.jsonl` directly.

## Run

From this directory (`_ops/stigmergy/app/`):

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`. Stop with `Ctrl-C`.

The dev server reads palace data from `../../swarm/persistent/blackboard.jsonl`
and `../../swarm/sessions/*/blackboard.jsonl` via a tiny Vite middleware
(see `server/middleware.js`). The path is configurable via the env var
`PALACE_ROOT` if you need to point at a different palace root.

## What this is, and is not

**v0.1 is** a renderer. It exposes the palace's BBS architecture through
a phosphor-green terminal. Channel tabs, message-type signatures, health
blocks, agent roster, Trickster inbox — all visible.

**v0.1 is not** a way to post messages, a daemonized service, the
orchestrator from the Palace Agent Infrastructure Spec, or a permission
responder. Those are v0.2+.

## How Claude Code uses this directory

This dir is a build target driven by the contract in
[Palace development/BBS Production Plan.md](../../../Palace%20development/BBS%20Production%20Plan.md).
A Claude Code session reads that plan, builds the app phase by phase,
runs `npm run check:phase-N` at each gate, dispatches a vision-capable
subagent against the matching `tests/checklists/phase-N.md`, iterates on
failures up to ten attempts per check, and stops on either success
(`V0.1-COMPLETE.md` written) or a stop condition (`STOP-REPORT.md`
written). See the plan for the full protocol.

## Directory map

```
_ops/stigmergy/app/
├── package.json
├── vite.config.js · vitest.config.js · playwright.config.js
├── index.html · src/
│   ├── main.jsx · App.jsx · styles/tokens.css
│   ├── components/  (Shell, LoginScreen, BoardIndex, …, primitives.jsx)
│   ├── adapters/    (fetch helpers; populated in Phase 2)
│   └── lib/         (parser, schema, inbox, roster; populated phase-by-phase)
├── server/middleware.js   (Vite plugin: GET /api/persistent etc.)
├── public/fonts/          (woff2 copies of VT323 + IBM Plex Mono)
├── tests/
│   ├── unit/  integration/  e2e/  fixtures/
│   └── checklists/         (visual-validator inputs)
├── screenshots/            (Playwright outputs; reviewed by visual-validator)
├── scripts/check-phase.js
└── build-log.jsonl         (append-only log of every check + every fix)
```

## Visual non-negotiables (cribbed from the design system)

- Phosphor green `#33ff66` on terminal black `#050a06`.
- VT323 for banners, IBM Plex Mono for body. No fallback to system mono.
- 80ch max-width on body text. CP437 box-drawing for cards.
- `border-radius: 0` everywhere. No drop shadows. No emoji.
- Lowercase body, UPPERCASE system. No em dashes — use `--`.
- `steps()` motion only. Type-on at ~20ms/char.
- Scanline overlay on by default; `[V]` toggles.

The source of truth for tokens lives in
`_ops/stigmergy/design-system/colors_and_type.css`. This app imports it,
does not modify it.
