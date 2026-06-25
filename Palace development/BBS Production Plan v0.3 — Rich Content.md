---
title: BBS Production Plan v0.3 — Rich Content
type: project
pillars:
  - tools
  - practice
born: 2026-05-29
last_activated: 2026-05-29
activation_count: 1
stage: seed
energy: high
forward_vector: >
  I am the executable contract that gives STIGMERGY inline rich-content
  rendering — image, audio, and sandboxed HTML, rendered inside the message
  the way Enrichment/server.py already renders cards. I keep the move small:
  the Enrichment server stays the lab, STIGMERGY absorbs the rendering
  capability only, no data-model unification, no UX consolidation. A Claude
  Code session reading this file knows what to build, what to verify, when to
  retry, when to stop, and what to hand back when v0.3 is ready for Loudon's
  smoke-test. Loudon is absent during the run.
links:
  - target: "[[BBS Production Plan v0.2]]"
    type: emerged-from
    label: build-contract-template
  - target: "[[BBS Rich Content — handoff]]"
    type: emerged-from
    label: this-move
  - target: "[[BBS Blackboard]]"
    type: enables
    label: rich-render-target
  - target: "[[BBS Design System]]"
    type: enables
    label: aesthetic-authority
  - target: "[[Enrichment]]"
    type: connects-to
    label: rendering-reference
  - target: "[[Oblique Enrichment]]"
    type: connects-to
    label: convergence-problem
  - target: "[[Pages as Agents]]"
    type: connects-to
    label: from-is-page-title
---

# BBS Production Plan v0.3 — Rich Content

![[BBS Production Plan v0.3 — Rich Content — hero.png]]

The architecture is in [[BBS Blackboard]]. The visual language is in [[BBS Design System]] (STIGMERGY uses the BBS aesthetic, not Loudon Live — `CLAUDE.md § Artifact Aesthetic` carves this out). The move, the decided constraints, and the do-not-relitigate list are in [[BBS Rich Content — handoff]] — read it first; it is the source of this plan's authority. The build-contract pattern is [[BBS Production Plan v0.2]]. This document is the executable bridge: it turns the rendering capability proven in `Enrichment/server.py` into a STIGMERGY capability, with §2.2-clean tests and the BBS aesthetic.

## The move

Give STIGMERGY the ability to render **image, audio, and sandboxed HTML artifacts inline inside messages**. This is the first deliberate **lab → integration** crossing. The Enrichment server stays the experimental surface; STIGMERGY absorbs the rendering pattern only. No new message types, no data-model migration, no `claude -p` worker change, no schema edits.

## What's decided (from the handoff — do not re-litigate)

- **Reuse existing §2.2.** Artifact-bearing messages are ordinary messages (`BROADCAST`, `FLAG`, …) carrying a `payload.kind: "enrichment_card"` discriminator. The §2.2 validator is **untouched** — `payload` is already opaque-object by spec.
- **Payload convention** (allowed, not required): `payload.artifact_path: "<palace-relative>"` for a single artifact, or `payload.artifacts: [{path, caption?}]` for a coherent multi-artifact set. Both palace-relative, both resolved through the existing `resolveInsidePalace`.
- **Rendering is keyed on artifact presence, not message type.** A `BROADCAST` with `artifact_path` renders the artifact; a `FLAG` with `artifact_path` does too. The artifact slot lives **alongside** the existing type-specific payload rendering (PROOF / FLAG / body), not inside it.
- **`GET /api/file?path=<palace-rel>`** is the new file-serving endpoint. Streams bytes with content-type detection. Refuses anything outside palace root, any traversal, any directory. Mirrors `Enrichment/server.py:_serve_file` for the content-type table and `Cache-Control: no-cache`. Built on the existing `resolveInsidePalace` guard.
- **Iframe sandbox is `allow-scripts` only — *not* `allow-same-origin`.** Palace HTML artifacts need scripts; they must not reach into STIGMERGY's DOM/storage or make same-origin calls against the orchestrator's POST endpoint. The Enrichment server uses `allow-scripts allow-same-origin` because that constraint does not apply to it; the stricter choice is correct here.
- **Page-agent identity carries through.** On an emitted enrichment card, `from:` is the target entry's title (e.g. `"Kuramoto Coupling"`), not an invented handle. [[Pages as Agents]].
- **Decks deferred.** `payload.deck_id` grouping across messages, a `?deck=` board filter, and cross-origin `postMessage` from artifacts are all out of scope. A multi-artifact *set within one message* (`payload.artifacts`) renders; grouping *across* messages does not.
- **Strict on writes, lenient on reads.** The new GET endpoint enforces path safety strictly. The write-side validator does not learn the artifact convention — it does not need to. The browser fetches only what the renderer asks for.

## What v0.3 is and is not

**v0.3 is** inline rendering of image / audio / sandboxed-HTML artifacts inside STIGMERGY message rows, served by a path-safe `GET /api/file` endpoint, keyed on the `payload.artifact_path` / `payload.artifacts` convention, styled to the BBS Design System.

**v0.3 is not** a data-model unification with the Enrichment lab, a response-vocabulary migration (enrichment-card responses through STIGMERGY are out of scope — these are `BROADCAST`s, not `RESOURCE_REQUEST`s, so they never enter the Trickster inbox flow), a deck-as-board view, a steward change, or any §2.2 / SCHEMA edit.

## Autonomous build contract

Same four commitments as v0.2 (read [[BBS Production Plan v0.2]] § Autonomous Build Contract). Summary:

1. **Every phase is self-verifiable.** `npm run check:phase-N` exits 0 on pass.
2. **Visual quality is reviewed by a vision-capable subagent** against a per-phase checklist; pass/fail with reasoned justifications. Visual fails are treated identically to test fails.
3. **Failures iterate up to ten attempts per failing check, then stop** with a full-context `STOP-REPORT.md`.
4. **Loudon is absent until v0.3 is declared complete.** No phase-by-phase approvals. On success write `_ops/stigmergy/app/V0.3-COMPLETE.md`; on a stop condition write `STOP-REPORT.md`.

## Phase / gate map

v0.3 adds three phases to the existing `check-phase.js` harness. To avoid renumbering v0.2's phases 1–6, the v0.3 gates reuse the next integer keys:

| v0.3 phase | `check-phase.js` key | npm script | Gate |
|---|---|---|---|
| Phase 1 — File Endpoint | `7` | `npm run check:phase-7` | unit + integration |
| Phase 2 — Inline Render | `8` | `npm run check:phase-8` | unit + e2e + screenshots → visual-validator |
| Phase 3 — Round-trip + Sweep | `9` | `npm run check:phase-9` | full regression + round-trip + screenshots → visual-validator |

`npm run check:all` is extended to loop 1→9 so the cumulative gate covers everything.

## Directory layout (delta from v0.2)

```
_ops/stigmergy/app/
├── server/
│   └── middleware.js                 ← extended: ADD GET /api/file + content-type table
├── src/
│   ├── lib/
│   │   ├── artifact.js               ← NEW: pure render-side helpers (type detection, URL, payload→list)
│   │   └── demo-data.js              ← extended: ADD enrichment-card demo messages
│   └── components/
│       ├── ArtifactSlot.jsx          ← NEW: renders the artifact list (image/audio/iframe/fallback)
│       └── MessageList.jsx           ← extended: mount <ArtifactSlot> + enrichment tag
├── tests/
│   ├── unit/
│   │   └── artifact.test.js          ← NEW
│   ├── integration/
│   │   └── file-middleware.test.js   ← NEW
│   ├── e2e/
│   │   ├── rich-content.spec.js      ← NEW
│   │   └── rich-content-roundtrip.spec.js ← NEW
│   └── checklists/
│       ├── phase-8-v0.3.md           ← NEW
│       └── phase-9-v0.3.md           ← NEW
├── scripts/check-phase.js            ← extended: phases 7/8/9 + all→1..9
└── V0.3-COMPLETE.md                  ← written on Phase 3 success
```

## Phases

### Phase 1 — File Endpoint (gate `7`)

Goal: a path-safe `GET /api/file` and the pure render-side helpers, fully unit/integration tested. No UI change.

- [ ] `server/middleware.js`: `GET /api/file?path=<palace-rel>`. Resolve via `resolveInsidePalace`; 400 on invalid/missing/traversal/absolute; 404 on nonexistent; 400 on a directory. On success: 200, `Content-Type` from a table mirroring `_serve_file._guess_type`, `Content-Length`, `Cache-Control: no-cache`, stream the bytes. Attach a stream `error` handler so a mid-stream failure never crashes the dev server.
- [ ] `src/lib/artifact.js`: `extOf(path)`, `detectArtifactType(path)` → `audio | image | iframe | file`, `fileUrl(path)` → `/api/file?path=<encoded>`, `artifactsFromPayload(payload)` → normalized `[{path, caption}]` from either `artifact_path` or `artifacts` (returns `[]` when neither/ malformed).
- [ ] `tests/unit/artifact.test.js`: extension→type table (incl. unknown→`file`, dotfiles, no-ext), URL encoding (paths with spaces), payload normalization for both conventions + malformed inputs.
- [ ] `tests/integration/file-middleware.test.js`: serves an image / audio / html fixture with correct content-type + bytes; 400 on `../` traversal, absolute path, missing `path`; 404 on nonexistent; 400 on a directory; `Cache-Control: no-cache` present.

**Verify:** `npm run check:phase-7` green. No screenshots (plumbing phase).

### Phase 2 — Inline Render (gate `8`)

Goal: artifacts render inline in the message row, in the BBS aesthetic.

- [ ] `src/components/ArtifactSlot.jsx`: for each artifact, detect type and render — image → `<img loading="lazy">`; audio → `<audio controls preload="none">` (browser-default controls are an accepted v0.3 break; phosphor control strip is v0.4); html → `<iframe sandbox="allow-scripts" loading="lazy">` (**no** `allow-same-origin`); other → a phosphor "open" link via `/api/open`. Each artifact framed `1px solid var(--phosphor-dim)`, `border-radius: 0`, dim-mono type label + filename, optional dim caption (`max-width: 78ch`). `data-testid="artifact"` + `data-artifact-type`.
- [ ] `MessageList.jsx`: mount `<ArtifactSlot payload={msg.payload} />` after the body/PROOF/FLAG block, for every message type. When `payload.kind === 'enrichment_card'`, show a small `enrichment` `<Tag>` beside the type label.
- [ ] `src/lib/demo-data.js`: add a single-artifact enrichment card (image via `artifact_path`) and a multi-artifact card (image + audio + html via `artifacts`, with captions), both `from:` a real page title, on a board chosen so existing count-assertions do not regress (verify against the e2e suite; adjust the affected spec only if a count is hard-coded).
- [ ] `tests/e2e/rich-content.spec.js`: in `?demo=1`, the artifact slot renders `<img>` / `<audio>` / `<iframe>`; the iframe's `sandbox` attribute is exactly `allow-scripts` (asserts the absence of `allow-same-origin`); captions render; the `enrichment` tag shows.
- [ ] `tests/checklists/phase-8-v0.3.md`: visual checklist (phosphor frame, no rounded corners, no emoji, readable image/audio/iframe, caption legibility, aesthetic coherence with the rest of the board).

**Verify:** `npm run check:phase-8` green; capture `phase-8-v0.3/{general-artifacts,iframe-artifact}.png`; dispatch the visual-validator against `phase-8-v0.3.md`.

### Phase 3 — Round-trip + Final Sweep (gate `9`)

Goal: full regression green, one true write→read round-trip, V0.3-COMPLETE.md.

- [ ] `tests/e2e/rich-content-roundtrip.spec.js`: save the persistent blackboard; **POST** one enrichment-shaped §2.2 message (a `BROADCAST` from a real page title, `payload.kind: "enrichment_card"` + `artifact_path` to a real palace image) to `/api/persistent` — proving the discriminator passes the **untouched** strict validator; reload; assert the artifact renders inline; restore the file in `finally`.
- [ ] Full regression: every v0.1 / v0.2 / v0.3 unit, integration, and e2e test green (`check:phase-9` runs the union; `check:all` loops 1→9).
- [ ] `_ops/stigmergy/app/README.md`: document `GET /api/file` and the `payload.artifact_path` / `payload.artifacts` convention.
- [ ] `_ops/stigmergy/design-system/README.md`: note the inline-artifact rule (phosphor frame, `allow-scripts`-only sandbox, browser-default audio controls as the v0.3 break).
- [ ] `tests/checklists/phase-9-v0.3.md`: comprehensive final-sweep visual checklist.
- [ ] `_ops/stigmergy/app/V0.3-COMPLETE.md`: every gate run, every fix, screenshots, deferred-to-v0.4 items, decisions for Loudon.

**Verify:** `npm run check:phase-9` and `npm run check:all` green; comprehensive captures; visual-validator passes `phase-9-v0.3.md`.

**On Phase 3 success:** branch `stigmergy-v0.3-rich-content` ready for Loudon's smoke-test. **Do not push.**

## Self-verification & iteration protocol

Same as v0.2 (read [[BBS Production Plan v0.2]] § Self-Verification & Iteration Protocol). Up to ten attempts per failing check, escalating naive fix → full-context fix → alternate-approach fix → stop-report. `build-log.jsonl` accumulates every gate run and fix attempt.

## Stop conditions

Same as v0.2, plus:

- **A real palace HTML artifact requires `allow-same-origin` to render at all** — this is the convergence tension surfacing as a concrete engineering fact. Stop and surface it; do not loosen the sandbox unilaterally.
- **The strict validator rejects an enrichment-shaped message** — would mean the discriminator-in-payload approach has a hidden conflict with §2.2. Stop; the decision to leave the validator untouched is load-bearing.

Phase 3 success is a stop-on-success.

## What's deferred (v0.4+)

- Phosphor-styled audio control strip (browser-default `<audio>` is the v0.3 break).
- Deck grouping (`payload.deck_id`) and a `?deck=` board filter.
- Cross-origin `postMessage` from sandboxed artifacts (facets that respond from inside the artifact).
- Inline text/markdown artifact rendering (`<pre>`); v0.3 falls back to an open-link for non image/audio/html types.
- Response-vocabulary migration from the Enrichment lab (tap-a-label, free-prose textarea per card).

---

*"v0.1 was the spell. v0.2 was the spell answering back. v0.3 is the spell learning to show."*
