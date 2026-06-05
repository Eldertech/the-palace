---
title: "STIGMERGY v1.0 — Trickster Deck — handoff"
type: handoff
pillars:
  - tools
  - practice
born: 2026-06-05
stage: in-progress
forward_vector: "I hand off a half-completed migration: STIGMERGY needs ONE Trickster surface, not two, and it should be native React reusing the existing BBS code — not an iframe of a hand-authored static page. The next Claude lands with all the upstream work done (voice rules, lexicon, catchup overrides, the fourth deck slot) and a clear sequenced path to converge the two surfaces. I want the handoff to be short enough that the next Claude executes from it without re-reading the four-hour conversation behind it."
links:
  - target: "[[STIGMERGY v1.0 — Palace Front-End]]"
    type: connects-to
    label: in-progress-move-on
  - target: "[[Speak Like a Person, Log Like a Protocol]]"
    type: connects-to
    label: enforces
  - target: "[[BBS Rich Content — handoff]]"
    type: mirrors
    label: sibling-handoff
  - target: "[[BBS Design System]]"
    type: connects-to
    label: surface-of
  - target: "[[Trickster]]"
    type: connects-to
    label: the-decision-surface
---
# Handoff: STIGMERGY Trickster Deck — converge two surfaces into one

## Move

Replace the iframe-based `[T] TRICKSTER` deck (commit `833825a` + `3b450bf`)
with a native React component that fetches pending requests from
`/api/persistent`, renders the catchup-first card layout the standalone
`trickster.html` proved, and reuses the existing `buildInbox()` derivation,
`postMessage()` BBS POSTer, lexicon helpers, and `buildRequestOptionResponse()`
message builder. Once the native deck reaches parity, delete the standalone
`/trickster.html` page and the `TricksterDeck` iframe wrapper.

## Why this move matters

The actual reason (not the obvious "iframes are inelegant" one): **two
parallel surfaces with different content sources just cost Loudon real
work**. On the 2026-06-05 session he believed he'd filed responses to all
14 currently-pending Trickster requests. The audit showed only **1** had
landed — the standalone page had eight hand-coded `request_id`s baked in
from an earlier snapshot, seven of those were already resolved, and the
thirteen actually-pending requests weren't on the page at all. They only
show up in the React `TricksterInbox` because the `catchup-overrides.js`
backfill threads them in there.

Worse: the one that DID land (`preset-steward-007`) was filed with the
steward's recommended option (`LOADS-AND-DARK → PERCEPTUAL-BY-EAR`), which
means "the .adv loaded in Ableton and sounded darker than factory." Loudon
likely hit `FILE ALL N` without actually doing the 30-second Ableton test —
the steward will now build perceptual labels on a write-path that was never
verified. False positive on the BBS. A self-updating dynamic page that
asked the question with the right options for the *current* state would
have prevented this.

The fourth-deck iframe was the right move for *that hour* — it got Loudon
to the catchup-first experience inside STIGMERGY without retrofitting the
QUEUE renderer. But the iframe inherits the standalone page's staleness
and adds a sandbox layer that has already cost us `allow-downloads`
(commit `3b450bf`). The architecturally right move is now overdue.

## Tried and rejected

- **Retrofit the QUEUE deck (`QueueItem.jsx`) to render catchup-first.**
  Considered after Loudon's screenshot showed the Queue deck's "RESOURCE
  REQUEST" pill and full rationale. Rejected mid-stream: the Queue renderer
  has its own `ask` / `rationale` / `stale_if` shape, its own
  vector-proposal and weave-flag cases, its own action chips, and several
  e2e tests asserting its current layout. The surgery was too large for
  the moment; Loudon pivoted us to "add a fourth tab."

- **Build a fully dynamic standalone page.** Considered when Loudon's
  filings didn't land. Rejected — the standalone page would still be
  parallel to the React inbox; doing the same dynamic-fetch work *inside*
  the React app lets us reuse `buildInbox()`, `postMessage()`, `lexicon`,
  and the existing test infrastructure. Two surfaces, one of them dynamic,
  is still two surfaces.

- **Quick static rebuild of `trickster.html` against the current 13
  pending.** Considered explicitly with Loudon ("Quick patch / ~15 min").
  He chose the architecturally right path instead.

- **Author per-card React components by hand.** Implied alternative —
  rejected by precedent. The standalone page builds eight cards from a
  single template; the React port should follow the same shape. Per-card
  bespoke components would re-introduce the staleness problem in a new
  costume.

## Current state

What's already done (do NOT redo any of this):

- **Voice rule 6** in `prompts/shared.md` (commit `36c5ea0`) — every future
  steward cycle will emit `payload.headline` + `payload.ground` natively.
  No further work on the upstream side.
- **`buildInbox()` in `src/lib/inbox.js`** already threads `headline` and
  `ground` from the message payload, falling back to the override map.
  Catchup precedence is `payload.* → override → null`.
- **`catchup-overrides.js`** carries `headline` + `ground` for the 14
  legacy requests. The override file is documented as a temporary bridge
  that ratchets down to empty.
- **`TricksterInbox.jsx`** already renders catchup-first (headline → ground
  → folded rationale + meta rows). The native React reader is *partly*
  done — it just lives in the wrong place (the BOARDS view, not the deck
  view), shows a slightly different layout from the standalone page (no
  lean panel, no `FILE ALL` master, no per-project assets, no audio
  play-all), and shares no code with `trickster.html`.
- **The fourth deck slot exists** (commit `833825a`). `DECKS` includes
  `'TRICKSTER'`, hotkey is `T`, subtitle is `DECIDE -- WHAT NEEDS YOU`.
  `App.jsx` routes deck === 'TRICKSTER' to `<TricksterDeck />`. The current
  `TricksterDeck.jsx` is a 60-line iframe wrapper.
- **`lexicon.js`** carries the natural-register translations for every wire
  term the catchup layout needs. Reuse it everywhere. New translations
  belong in this file, not inline strings.
- **The drift linter** (`tests/integration/voice-register.test.js`) will
  fail any new component that surfaces wire-protocol jargon. The new
  Trickster components must pass it without an allowlist exception.
- **The asset library** — the per-project SVG schematics, the PNG
  screenshots, the audio files, the witness-diagram HTML, the slime-mold
  HTML, the `.adv` file — all live under
  `_ops/stigmergy/app/public/trickster-assets/` and are reachable via vite
  at `/trickster-assets/...`. No need to re-stage anything.

What's broken or fragile right now:

- The `[T] TRICKSTER` deck loads the standalone page in a sandboxed iframe.
  Its content is stale (eight 2026-06-05-morning cards, seven resolved).
  `FILE ALL N ▶` files those stale `request_id`s and the BBS accepts them
  as duplicate/no-op grants. The one truly-pending request that overlaps
  (`preset-steward-007`) got a `RESOURCE_GRANT` Loudon may not have meant.
- The standalone `trickster.html` is ~1450 lines of Python-templated HTML
  + an embedded audio engine + Web Speech narration + scroll-spy
  IntersectionObserver. None of that is reusable from React. Keep it
  around as the visual reference until the native deck reaches parity,
  then delete.

## Next move

Build a phased migration. Each phase ships independently and the native
deck stays usable at every phase boundary. Order by user value, not by
architectural elegance.

### Phase 1 — Dynamic content, native layout, BBS-correct (P0)

Goal: every currently-pending Trickster request renders as a card in the
new deck, with the catchup-first layout, the inline options grid, and a
working `file ▶` button that POSTs the right `RESOURCE_GRANT` to
`/api/persistent`. No assets, no lean panel, no master `FILE ALL`. Just
the dynamic skeleton, correct against the live BBS.

- Rewrite `src/components/TricksterDeck.jsx` from iframe wrapper to native
  list. The component owns:
  - Mount-time `fetch('/api/persistent')` → `buildInbox(messages)`
  - Map over `pending_requests` to render one `<TricksterCard />` each
  - SSE subscription to `/api/persistent` for live updates (the BOARDS
    view already does this in `App.jsx`; lift the same hook into the deck
    or share a `usePersistentMessages()` hook)
  - On a card's `file ▶`: build a grant via `buildRequestOptionResponse()`
    from `src/lib/response-builder.js`, POST via `postMessage()` from
    `src/adapters/blackboard.js`, optimistically remove from the list,
    refetch on error.
- Build `src/components/trickster/TricksterCard.jsx` (new directory, per
  the `queue/`, `log/`, `state/` precedent). Layout: project name + req
  pill + pause pill → bold body-font headline → mono dim ground → options
  grid + freeform notes → `▸ more from the steward` fold → field rows +
  rationale + intent. Reuse `lexicon.js` for every label. Reuse
  `pauseShort()` / `pauseLong()` for pause states.
- Throw away the iframe-specific bits of the current `TricksterDeck.jsx`
  (sandbox tokens, "open standalone ↗" link, height calc). The new deck
  fills the same layout box the QUEUE/LOG/STATE decks do.
- Write unit tests at `tests/unit/trickster-card.test.js` covering: card
  renders headline when present, falls back to "no catchup written" pill
  when absent, picks option on click, captures notes, builds correct
  grant message via `buildRequestOptionResponse()`, fires `onFile`.
- The standalone `trickster.html` stays live during Phase 1 (Loudon's
  in-flight session may want it). The fourth-deck iframe gets *replaced*
  by the native list; the standalone page is reachable at `/trickster.html`
  for one more cycle.

### Phase 2 — The `FILE LEAN` and `FILE ALL N` affordances (P1)

Goal: per-card lean panel + master quickbar. This is the actual
ergonomic payoff from the standalone page — the workflow that took Loudon
from ~60 seconds of reading to one click.

- Add a recommended-option detector. The wire schema doesn't carry a
  `recommended: true` flag yet (none of the existing steward outputs set
  it). Until voice-rule-7 lands, infer recommendation by parsing the
  option `label` for the heuristic strings `'(recommended)'`,
  `'(my lean)'`, `'(my pick)'`, `'(expected)'`. The detector lives in
  `inbox.js` next to the catchup precedence; tag each option with
  `recommended: true` in the inbox view.
- Build `src/components/trickster/LeanPanel.jsx` — the amber panel above
  the options grid, with "steward leans X · space ↵" + the FILE LEAN
  button. Wired to the same captureCard path as the options grid.
- Build `src/components/trickster/QuickBar.jsx` — the master "▶ FILE ALL N
  ▶" bar at the top of the deck, with the lean summary ("1) APPROVE-PLAN
  · 2) ARCHITECTURE-VERIFIED · ..."). On click, iterates non-filed cards
  with leans and POSTs each sequentially (350 ms gap between POSTs so the
  visual flashes register one at a time, same pattern as the standalone
  page).
- Keyboard layer: `space` files the focused card's lean, `1-N` picks an
  option from the options grid, `Enter` files the current pick. The
  existing `App.jsx` keyboard handler is the place to add these (it
  already handles deck-level shortcuts); guard on `deck === 'TRICKSTER'`.
- Tests at `tests/unit/lean-panel.test.js` + `tests/integration/
  trickster-file-all.test.js`. The latter mocks `postMessage` and asserts
  the right grants get built per recommended option.

### Phase 3 — Per-project inline assets (P1)

Goal: every card that has a relevant audio file / iframe / download
button surfaces it inline, the way the standalone page does. This is
where the "make it as easy as possible to give the information" goal
actually pays off — Loudon hears the audition without leaving the page,
drops the `.adv` into Ableton with one click, sees the Witness Diagram
without losing context.

- Create `src/lib/trickster-assets.js` — a registry keyed by
  `request_id` *prefix* (e.g. `'gsl-steward-'`, `'shepard-steward-'`,
  `'inharmonic-wavetable-'`) so new cycle numbers attach the same asset
  set. Each entry carries:
  ```
  {
    schematicSvg: '<svg>...</svg>',  // or null
    screenshotSrc: '/trickster-assets/topology-overview.png',
    audition: {
      kind: 'audio-sequence',
      tracks: [{ label: 'Pass 1 — flat', src: '/trickster-assets/audio/inharmonic/pass1.wav' }, ...],
    },  // or null
    embed: {
      kind: 'iframe',
      src: '/trickster-assets/witness/witness-diagram.html',
      title: 'Asset 1 — the Witness Diagram',
      tall: false,
    },  // or null
    action: {
      kind: 'download',
      hint: 'drop in your Ableton User Library...',
      src: '/trickster-assets/preset/Aqueous Pad - dark cutoff.adv',
      buttonLabel: '↓ download .adv',
    },  // or null
  }
  ```
- Build `src/components/trickster/AuditionStrip.jsx` (audio rows + the
  PLAY-ALL-IN-SEQUENCE button — port the JS from the standalone page),
  `src/components/trickster/Embed.jsx` (sandboxed iframe), and
  `src/components/trickster/ActionPanel.jsx` (the amber download / hint
  / button row).
- Backfill the registry with the entries for the 13 currently-pending
  request prefixes. Mirror the asset choices Loudon already saw work on
  the standalone page.
- Wire the registry into `TricksterCard` — for each card, look up by
  `request_id` prefix and render any present asset slots between the
  ground line and the options grid.
- The standalone `trickster.html` is now mostly redundant. Delete it,
  delete `_ops/stigmergy/app/public/trickster.html`, delete the import +
  invocations of it from `TricksterDeck.jsx` (the iframe code is already
  gone since Phase 1).

### Phase 4 — Schematics as a reusable component (P2)

Goal: the SVG schematics per project (the torus, the staircase, the
nerve-zip waveform, the slime-mold field, etc.) move from inline strings
in the asset registry to a `<Schematic name="torus" />` component family
that renders the same art and can be reused on STATE-deck entry pages,
LOG cards, etc.

- Convert the eight hand-authored SVGs in `trickster.html` into
  `src/components/trickster/schematics/*.jsx` (one component per
  schematic). Pure SVG, no logic, accept a `tone` prop for color skin.
- Replace `schematicSvg` strings in the asset registry with `schematic:
  'torus'` / `'shepard-stage2'` etc., and have `TricksterCard` look up
  the component by name.

### Phase 5 — Optional narration + sound bed (P3)

Goal: the Trickster speaks each card as it scrolls into focus, ambient
sound bed under the page (the standalone-page experience). Pure quality
of life; skip if it's not paying off.

- Port the audio engine (oscillator pad + filter LFO) from
  `trickster.html` to a `src/lib/phosphor-audio.js`-style module —
  there's already a `PhosphorAudio.jsx` component in the app for
  precedent.
- Port the IntersectionObserver scroll-spy into a `useScrollSpy()` hook
  or the `TricksterCard`'s `ref`.
- Reuse Web Speech API for narration. Hide behind a `[V]oice` button in
  the deck chrome, off by default.

### Phase 6 — Drop the iframe wrapper, drop the standalone page

Goal: one Trickster surface.

- Remove `_ops/stigmergy/app/public/trickster.html`.
- Remove `_ops/stigmergy/app/public/trickster-assets/` from being treated
  as a "page" route. The assets dir stays (the React app references it
  for audio + iframe sources); only the standalone HTML and its hand-
  authored card markup go away.
- Update the `Speak Like a Person, Log Like a Protocol` palace entry to
  point at the native components as the reference implementation, not
  the standalone page.

## Receiving environment

The next Claude lands in **Claude Code** (filesystem read+write, vitest,
git, the running vite dev server). They do NOT need browser access or
the standalone-page environment.

Surface-specific gotchas:
- The dev server may need a restart after Phase 1 to pick up new files
  in `src/components/trickster/`. Vite catches modifications fine; new
  files sometimes need a re-scan.
- The drift linter at `tests/integration/voice-register.test.js` runs
  every component file in `src/components/`. Components in the new
  `trickster/` subdirectory will be scanned automatically — *every
  visible string must already be in the lexicon*, no allowlist entries.
- `_ops/stigmergy/app/src/lib/inbox.js` is shared between the existing
  `TricksterInbox.jsx` (BOARDS view) and the new `TricksterDeck`. Don't
  fork the derivation; extend `buildInbox()` if you need new fields.
- The BBS uses append-only JSONL at `_ops/swarm/persistent/blackboard.jsonl`.
  Tests must NOT touch this file. Use the fixture pattern in
  `tests/fixtures/_ops/swarm/persistent/blackboard.jsonl` and the
  `PALACE_ROOT` env override.

## Calibrations from this session

Standing preferences that diverged from defaults this session:
- **Natural-register rule is enforced.** Visible strings go through the
  lexicon. The drift linter fails the build if not. See
  `Speak Like a Person, Log Like a Protocol`.
- **Trust the steward's recommended option as the one-click default.**
  The lean panel is what the user reaches for first; everything else is
  the override path.
- **No batches.** Each card POSTs its own grant when filed. No queue,
  no buffer, no "save all" — the BBS is the source of truth and every
  click should land independently.
- **The BBS data layer keeps its protocol terms exact.** `m.type ===
  'BROADCAST'` and `payload.blocking === true` are fine in code. Only
  visible strings get translated.
- **Spec-clean commits**, one prong per commit when the work spans the
  schema, the renderer, and the data layer. `mixed` kind when a single
  commit straddles. Use `palace-orch`-style trailers:
  `Palace-Kind`, `Palace-Verify`, `Palace-Author`. Validator at
  `_ops/stigmergy/app/src/lib/commit-spec.js`.

## Load these files first

Tiered context list. Read in this order; the first three are the spine.

**Tier 1 (the spine — must read):**
1. This handoff.
2. `_ops/stigmergy/app/src/lib/inbox.js` — `buildInbox()`. The data
   derivation the native deck will reuse.
3. `_ops/stigmergy/app/src/components/TricksterInbox.jsx` — the existing
   catchup-first React reader. Phase 1's `TricksterCard` is a closer
   cousin to this than to the standalone page.

**Tier 2 (the asset references):**
4. `_ops/stigmergy/app/public/trickster.html` — the visual reference
   implementation. Read for layout choices, asset bindings, lean-button
   behavior. Don't port code; port intent.
5. `_ops/stigmergy/app/src/lib/catchup-overrides.js` — the legacy
   backfill model. The new card list reads through this transparently.
6. `_ops/stigmergy/app/src/lib/lexicon.js` — every visible-string
   translation. Extend here, not in components.

**Tier 3 (the contracts):**
7. `_ops/stigmergy/app/src/adapters/blackboard.js` — `postMessage()`,
   `fetchPersistent()`, SSE subscription.
8. `_ops/stigmergy/app/src/lib/response-builder.js` — `buildGrant()`
   and `buildRequestOptionResponse()`. These build the wire-conformant
   grant messages.
9. `_ops/stigmergy/app/tests/integration/voice-register.test.js` — the
   drift linter the new components must pass.

**Tier 4 (the rule book):**
10. `[[Speak Like a Person, Log Like a Protocol]]` — the natural-register
    rule.
11. `.claude/skills/palace-orchestrator/prompts/shared.md` voice rules
    5 and 6 — the upstream rules every steward will eventually emit
    against.
12. The handoff exemplars in `Palace development/` (especially
    `BBS Rich Content — handoff.md` and `Project Stewardship System —
    handoff.md`) — for the in-house handoff style.

## What this handoff does NOT do

Per the pace obligation: no project summary (the entries do that), no
re-explanation of palace conventions (the next Claude reads
`CLAUDE.md`), no speculation past Phase 6.

If the next Claude needs the *why* behind the natural-register rule or
the catchup pattern, the palace concept entries are where to go. This
handoff is just the move: convert the iframe deck to a native React
list, in five phases, with the contracts and the asset library already
in place.

<!-- CLAUDE → LOUDON: this handoff assumes the next Claude is fluent in
React + vitest + the existing STIGMERGY codebase. If the receiving
session is fresh, add a Tier 0 entry: read `CLAUDE.md`, read the
`STIGMERGY v1.0 — Palace Front-End` entry, then return here. -->
