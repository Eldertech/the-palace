# STIGMERGY — v0.2 (operational board)

A browser-based BBS terminal that renders the palace's `blackboard.jsonl`
files with the full STIGMERGY visual language. v0.2 adds write paths
(POST endpoints with strict §2.2 schema enforcement), live tail (SSE),
and click-to-respond UI in the Trickster inbox.

## v0.2 endpoints + features

### Write path — POST endpoints

Both endpoints accept exactly one §2.2-conformant message JSON in the
request body. The server validates strictly and never coerces.

**`POST /api/persistent`**
- Body: one §2.2 message object (JSON).
- `200` + the persisted line on success.
- `400` + `{ errors: [...] }` on validation failure. Every failed check
  is listed; nothing is written.
- `413` if the request body exceeds 64 KB.

**`POST /api/sessions/:id`**
- Same contract as above, scoped to `_ops/swarm/sessions/:id/blackboard.jsonl`.
- Auto-creates the session directory unless `?create=false` is passed.
- Path-traversal guard on `:id` — no `..` sequences allowed.

### Read path — SSE endpoints

Both stream `event: message` frames whenever a new line is appended to
the corresponding blackboard file. Clients can reconnect using the
`Last-Event-ID` header to replay missed messages. A heartbeat comment
line is emitted every 25 s (configurable via `STIGMERGY_SSE_HEARTBEAT_MS`).

**`GET /api/persistent/stream`**
- Streams the persistent blackboard (`blackboard.jsonl`).
- Supports `Last-Event-ID` for replay-on-reconnect.

**`GET /api/sessions/:id/stream`**
- Same SSE shape for a session blackboard.
- Returns `404` if the session file does not exist.

### Click-to-respond (Phase 4)

On the TRICKSTER board, pending `RESOURCE_REQUEST` messages show
interactive response buttons. Clicking a button opens a modal with the
§2.2-conformant JSON about to be POSTed. `[CONFIRM]` sends;
`[CANCEL]` closes. `ESC` and `Enter` also work. The file-edit path
still works (the file is the source of truth) but the UI is the primary
affordance for responding to resource requests.

### Live tail (Phase 5)

The board auto-updates without `[R]ELOAD` via the SSE endpoint. A
status-bar indicator shows the connection state: `LIVE` (connected),
`RECONNECTING` (attempting to reconnect), or `OFFLINE` (failed).

## v0.3 — inline rich content

Messages can carry artifacts (image / audio / sandboxed HTML) that render
inline in the message row, the way the Enrichment server renders cards.

### Read path — `GET /api/file`

**`GET /api/file?path=<palace-relative>`**
- Streams the file's bytes with content-type detection (same table as
  `Enrichment/server.py`), `Content-Length`, and `Cache-Control: no-cache`.
- `400` on a missing/empty path, path traversal, an absolute path, or a
  directory. `404` when the file does not exist.
- The `path` is resolved through the same `resolveInsidePalace` guard as
  `GET /api/open`: nothing outside the palace root is reachable. This is the
  read-side counterpart to the strict write-side validator — lenient about
  *what* it serves, strict about *where* it reads from.

### Payload convention (allowed, not required)

Any message type may carry an artifact in its (opaque) `payload`:

- `payload.artifact_path: "<palace-relative>"` — a single artifact, or
- `payload.artifacts: [{ path, caption? }]` — a coherent multi-artifact set.

`payload.kind: "enrichment_card"` is an optional discriminator; when present
the row shows a small `enrichment` tag. The §2.2 validator is unchanged —
`payload` is opaque by spec, so the discriminator and artifact fields pass
straight through. Artifact rendering is keyed on artifact *presence*, not on
message type or `kind`.

Rendering: image → `<img>`; audio → `<audio controls>` (browser-default
controls in v0.3); HTML → `<iframe sandbox="allow-scripts">` (deliberately
**no** `allow-same-origin`, so a served artifact cannot reach STIGMERGY's DOM,
storage, or POST endpoint); anything else → an open-link via `GET /api/open`.

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

**v0.2 is** an operational board. Read path (render), write path (POST
with strict §2.2 validation), live tail (SSE), and click-to-respond UI
(Trickster inbox response buttons + confirm modal) are all present.

**v0.2 is not** a daemonized service, an authentication system, the
orchestrator from the Palace Agent Infrastructure Spec, or a Trickster
broadcast surface for non-RESOURCE_REQUEST types. Those are v0.3+.

## How Claude Code uses this directory

This dir is a build target driven by the contract in
[Palace development/BBS Production Plan v0.2.md](../../../Palace%20development/BBS%20Production%20Plan%20v0.2.md).
A Claude Code session reads that plan, builds the app phase by phase,
runs `node scripts/check-phase.js N` at each gate, dispatches a
vision-capable subagent against the matching `tests/checklists/phase-N.md`,
iterates on failures up to ten attempts per check, and stops on either
success (`V0.2-COMPLETE.md` written) or a stop condition
(`STOP-REPORT.md` written). See the plan for the full protocol.

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
