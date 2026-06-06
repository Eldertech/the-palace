---
title: "BUG — SSE reconnect replay drops messages (non-monotonic ids)"
born: 2026-06-06
status: fixed
severity: medium
component: stigmergy/app — SSE middleware
links:
  - target: "[[STIGMERGY v1.0 — Palace Front-End]]"
    type: connects-to
    label: documents-bug-in
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: affects-live-feed-of
forward_vector: "I define one defect precisely enough that the palace code audit can fix it in a single pass and prove the fix with a test, then I am consumed."
---

# BUG — SSE reconnect replay silently drops messages when ids are not globally monotonic

> One-line: the live blackboard stream replays missed messages on reconnect by a
> **lexicographic** `id` comparison, but palace message ids are **per-steward
> namespaced** (not globally ordered), so a genuinely-newer message whose id sorts
> before the client's last-seen id is permanently skipped from the live feed until
> a full reload.

## Severity & impact

- **Severity:** medium. No data loss on disk; the board is always correct. The
  loss is *display-only* and *recoverable by `[R] RELOAD`*.
- **User-visible symptom:** a steward's new `RESOURCE_REQUEST` (its next decision)
  fails to appear in the Trickster inbox after the steward advances — intermittently.
  The operator perceives the inbox as "not updating" even though the request is on
  the board.
- **Frequency:** intermittent. Only triggers when the `EventSource` silently
  auto-reconnects *without* a full page reload (network blip, laptop sleep/wake,
  brief dev-server hiccup, any `es.onerror`). A real page reload masks it because
  `App.loadAll()` re-fetches the whole board on mount.

## Location

`_ops/stigmergy/app/server/middleware.js` — function `setupSseStream(req, res, filePath)`,
the Last-Event-ID replay branch (≈ line 275 at time of writing):

```js
const lastEventId = req.headers['last-event-id'] ?? null;
const seenIds = new Set();

const initialMessages = readJsonlMessages(filePath);
for (const msg of initialMessages) {
  if (msg.id !== undefined) {
    if (lastEventId !== null && msg.id > lastEventId) {   // ← BUG: lexicographic compare
      emitMessage(res, msg);                              //   assumes ids are globally monotonic
    }
    seenIds.add(msg.id);                                  // ← skipped msgs still marked seen, so the
  }                                                       //   steady-state watcher never re-emits them
}
```

**Affected surfaces:** `setupSseStream` backs *both* `GET /api/persistent/stream`
(the one that feeds the Trickster inbox) and `GET /api/sessions/:id/stream`. Both
inherit the bug.

## Root cause

1. The SSE `id:` field is set to the **message id** (`emitMessage` → `id: ${msg.id}`),
   so the browser's `Last-Event-ID` on reconnect is a message id.
2. Replay decides "is this message after the client's cursor?" with `msg.id > lastEventId`
   — a **string comparison** that is only correct if ids are globally monotonic.
3. Palace message ids are **not** globally monotonic. They are per-steward
   sequences: `waveguide-synthesizer-steward-005`, `crystal-synth-steward-014`,
   `torus-steward-013`, `2d-torus-steward-001`. Ordering by id orders by *steward
   name first*, not by time.
4. Any message appended during the disconnect whose id sorts lexicographically
   **before** `lastEventId` is not emitted on replay — and because it is still added
   to `seenIds`, the steady-state `fs.watch` loop (which emits only ids not in
   `seenIds`) never re-emits it either. The message is lost from this connection
   for its lifetime.

Concrete check (last-seen = `waveguide-synthesizer-steward-005`):

| Incoming id | `id > lastEventId` | Replayed? |
|---|---|---|
| `crystal-synth-steward-014` | false | **DROPPED** |
| `torus-steward-013` | false | **DROPPED** |
| `2d-torus-steward-001` | false | **DROPPED** |
| `waveguide-synthesizer-steward-006` | true | replayed (same steward, by luck) |

Only the *same steward's* next id survives; cross-steward updates drop ~half the
time (whenever the new steward's name sorts before the last-seen steward's name).

## What is NOT broken (scope boundary)

- **Steady-state push is fine.** While the connection stays open, the `fs.watch`
  callback emits any `!seenIds.has(msg.id)` message — order-independent, works for
  any id scheme. The reap appends in-place (`appendFileSync`) to the same file the
  watcher is on, so the watcher fires reliably.
- **The optimistic path is fine.** The grant the operator files on FILE & RUN is
  merged optimistically (`onConfirmed`), so the answered card disappears instantly
  regardless of SSE.
- **On-disk state is always correct.** This is purely a live-delivery gap;
  `[R] RELOAD` (`App.loadAll()`) always recovers the true board.

## Reproduction

The shipped test masks the bug by using synthetic monotonic ids
(`rec-001…rec-005`) — see `tests/integration/sse-middleware.test.js`, test
*"reconnect with Last-Event-ID: only messages after that id are replayed"*. With
realistic per-steward ids it fails. Drop this into
`_ops/stigmergy/app/tests/integration/` and run
`npx vitest run <file>` — it FAILS against current code (the assertion is the
*correct* behavior):

```js
test('a genuinely-newer message from a DIFFERENT steward is replayed after reconnect', async () => {
  // Client saw this last, then disconnected (its Last-Event-ID).
  appendFileSync(bb, JSON.stringify(makeMsg('waveguide-synthesizer-steward-005', '2026-06-06T16:57:00-04:00')) + '\n');
  // Appended WHILE disconnected — genuinely newer in time, different steward,
  // so its id sorts lexicographically BEFORE the last-seen id ('c' < 'w').
  appendFileSync(bb, JSON.stringify(makeMsg('crystal-synth-steward-015', '2026-06-06T17:05:00-04:00')) + '\n');

  const { frames } = await collectSseFrames({
    port,
    path: '/api/persistent/stream',
    headers: { 'Last-Event-ID': 'waveguide-synthesizer-steward-005' },
    until: (f) => f.some((fr) => fr.id === 'crystal-synth-steward-015'),
    timeoutMs: 1500,
  });

  const replayed = frames.filter((f) => f.data).map((f) => f.id);
  expect(replayed).toContain('crystal-synth-steward-015'); // ← FAILS: replayed is []
});
```

Observed result against current code: `AssertionError: expected [] to include 'crystal-synth-steward-015'`.

## Proposed fix

**Guiding principle:** the client (`src/lib/live-feed.js` `mergeLive`) dedupes by
`id`, so **over-replaying is harmless** (re-sent messages are deduped) while
**under-replaying is the bug**. When in doubt, replay more, not less.

Replace lexicographic comparison with **positional** replay:

1. On connect with a `Last-Event-ID`, find the **index** of the message whose
   `id === lastEventId` in the current file.
2. If found at index `i`: emit every message after `i` (by file order, which is
   true append/time order).
3. If **not found** (id never persisted, file truncated/rotated): emit **all**
   messages — the client dedupes, so this is safe and avoids silent drops.
4. Keep seeding `seenIds` from the full file so the steady-state watcher does not
   re-emit what replay already sent.

This keeps the message id as the SSE `id:` (no wire change) and removes the
monotonic-id assumption entirely. (An alternative — make the SSE `id:` a monotonic
line cursor / sequence number — is cleaner long-term but is a larger change and not
required to fix the defect.)

## Regression test to add

Add a realistic-id case to `tests/integration/sse-middleware.test.js` alongside the
existing reconnect test: seed two messages from *different* stewards where the
second steward's id sorts lexicographically *before* the first, reconnect with the
first as `Last-Event-ID`, and assert the second is replayed. (The repro above is
exactly this, ready to paste.)

## Adjacent items worth a glance during the same refactor (not this bug)

- **Mixed `ts` formats.** Live messages carry offset timestamps
  (`...-04:00`) while UI-generated responses use `...Z`. `mergeLive`'s
  `getTsSortKey` sorts by raw string after a `Date.parse` validity check, so mixed
  formats can mis-order display (cards still appear; `buildInbox` re-sorts by `ts`
  desc independently). Cosmetic, but the same audit could normalize to epoch-ms
  sort keys.
- **`emitMessage` id fallback.** `const id = msg.id ?? ''` — a message without an
  id emits `id:` empty; combined with the positional fix, ensure empty ids never
  match a real `Last-Event-ID`. (All §2.2 messages require an id, so this is
  defensive only.)
```
