---
title: "Companion Relocate Op — baton"
born: 2026-06-09
links:
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: "baton-for"
  - target: "[[Pages as Agents]]"
    type: connects-to
forward_vector: "I carry the in-progress build of the companion's cross-entry relocate op across the Cowork→Claude-Code boundary, waiting to be caught and deleted once the move is picked up."
session_thread: "Cowork session 2026-06-09 — diagnosed the companion as under-scoped (not over-constrained) for cross-entry moves; drafted the relocate op."
---

# Baton: Companion Relocate Op

## Move
Add a `relocate` op to the STIGMERGY companion so it can move a section out of the entry it's grounded in **into another entry**, as one approved, single-commit transaction.

## Why this move matters
The companion can already *assess* where a misplaced section belongs (it has the typed-link neighborhood with names + vectors) and can already *cut* from the source (a `rewrite` to `""`) — but its enforced write path (`armedWriteEntry`) takes one `relPath` + one op and commits one file, so it has no way to write the second entry. A move is inherently two-entry. This came up twice in real use; the most recent board line (a Closing Well companion turn, 2026-06-09) is literally the companion saying *"I can't move sections across entries from inside this window."* The diagnosis Loudon landed: **not over-constrained — under-scoped.** Every protective rail (body-only, one-edit-per-turn, show-before-write, allow-list gating) is correct and stays; we add one primitive in the gap, we don't loosen anything.

## Tried and rejected
- **Overload `previewEdit`'s `(repoRoot, relPath, op)` single-path shape** → no. Relocate is genuinely two-file; a separate `previewRelocate`/`armedRelocate` pair keeps the battle-tested single-entry path untouched and the lane branches on `op.op === 'relocate'`.
- **A general "edit N entries in one transaction" primitive** → no, YAGNI. Relocate is the named need. The new pair + two-file proof *is* the reusable seam if a broader cross-entry op is ever wanted — generalize then, with a reason.
- **Restrict `dest` to the typed-link neighborhood** → no. The right home may not be linked yet. Allow any allow-list-passing resolvable title; bias toward neighbors via the prompt, not a hard gate.
- **`dest` as a rel path** → no. The worker reasons in palace titles (the prompt shows it neighbor *titles*). Pass a wikilink **title**; resolve title→path in Node via `resolveTitleToPath`.
- **Auto-create a ghost destination** → no. That's frontmatter creation, out of current companion scope. Honest refusal ("isn't an entry yet") instead.
- **Write-rollback on commit failure** → no, for parity with today's `armedWriteEntry` (write-then-commit, git is the backstop). Revisit only if it bites.

## Current state
Server-side is **fully drafted and drop-in** (code below). The one piece left as a *contract, not code*, is the front-end proposal card in `EntryAgentWindow.jsx` — I didn't read that component this session, so I specified its inputs/outputs rather than guessing its structure. `commitSelected` already accepts `paths: [...]` and stages exactly those (never `-A`), so the two-file move is supported at the bottom layer with no change. Undo needs nothing new — a relocate is one commit; reverting one hash restores both files.

### The op shape
```jsonc
{
  "op": "relocate",
  "find": "<exact, unique span copied verbatim from THIS entry's body>",
  "dest": "<destination entry TITLE — the name inside [[...]], not a path>",
  "destOp": "append"   // "append" (end, default) | "prepend" (start)
}
```

### 1) `armed-write.js` — two new functions + one helper
Filesystem-pure over already-resolved paths (the lane does title→path resolution, matching how the rest of this module stays palace-vocabulary-free and temp-repo-testable). No change to `previewEdit` / `armedWriteEntry`.

```js
// Cut one exact, unique span out of a body and heal the seam. Same exact+unique
// rule as rewrite. Returns { ok, body, moved } or { ok:false, error }.
function cutSpan(body, find) {
  const b = typeof body === 'string' ? body : '';
  const f = typeof find === 'string' ? find : '';
  if (!f) return { ok: false, error: 'relocate: missing "find" (the section to move)' };
  const first = b.indexOf(f);
  if (first === -1) return { ok: false, error: 'relocate: "find" text not present in the source entry' };
  if (b.indexOf(f, first + f.length) !== -1) {
    return { ok: false, error: 'relocate: "find" is ambiguous (appears more than once) — be more specific' };
  }
  const before = b.slice(0, first).replace(/\s+$/, '');
  const after = b.slice(first + f.length).replace(/^\s+/, '');
  let joined;
  if (before && after) joined = `${before}\n\n${after}`;
  else joined = before || after; // section was at the top or the bottom
  if (joined && !joined.endsWith('\n')) joined += '\n';
  return { ok: true, body: joined, moved: f.trim() };
}

/**
 * Validate a relocate against the LIVE source + destination WITHOUT writing.
 * Both paths allow-list gated (canon / machinery refused on EITHER side).
 * Returns { ok, op, src:{path,before,after}, dest:{path,before,after,op}, moved }
 * or { ok:false, status, error }.
 */
export function previewRelocate(repoRoot, srcRel, destRel, op) {
  if (!repoRoot) return { ok: false, error: 'no repo configured' };
  if (!srcRel || !destRel) return { ok: false, status: 400, error: 'relocate needs a source and a destination entry' };

  const srcAbs = resolve(repoRoot, srcRel);
  const dstAbs = resolve(repoRoot, destRel);
  if (srcAbs === dstAbs) {
    return { ok: false, status: 422, error: 'relocate: source and destination are the same entry — use rewrite to move text within one entry' };
  }
  const aSrc = checkAllowList(srcRel);
  if (!aSrc.allowed) return { ok: false, status: 403, error: `source: ${aSrc.reason}` };
  const aDst = checkAllowList(destRel);
  if (!aDst.allowed) return { ok: false, status: 403, error: `destination: ${aDst.reason}` };

  for (const [abs, label] of [[srcAbs, 'source'], [dstAbs, 'destination']]) {
    if (abs !== resolve(repoRoot) && !abs.startsWith(resolve(repoRoot) + '/')) {
      return { ok: false, status: 400, error: `${label} path escapes the repo` };
    }
    if (!existsSync(abs)) return { ok: false, status: 404, error: `${label} entry not found` };
  }

  const srcBefore = readFileSync(srcAbs, 'utf8');
  const dstBefore = readFileSync(dstAbs, 'utf8');
  const { fmBlock: srcFm, body: srcBody } = splitRawFrontmatter(srcBefore);
  const { fmBlock: dstFm, body: dstBody } = splitRawFrontmatter(dstBefore);

  const cut = cutSpan(srcBody, op && op.find);
  if (!cut.ok) return { ok: false, status: 422, error: cut.error };
  if (cut.body.trim() === '') {
    return { ok: false, status: 422, error: 'relocate would empty the source entry — move a section, not the whole body' };
  }
  if (!cut.moved) return { ok: false, status: 422, error: 'relocate: the section to move is empty' };

  const destOp = op && op.destOp === 'prepend' ? 'prepend' : 'append';
  const applied = applyOp(dstBody, { op: destOp, text: cut.moved });
  if (!applied.ok) return { ok: false, status: 422, error: `relocate into destination: ${applied.error}` };

  return {
    ok: true,
    op,
    src: { path: srcRel, before: srcBefore, after: srcFm + cut.body },
    dest: { path: destRel, before: dstBefore, after: dstFm + applied.body, op: destOp },
    moved: cut.moved,
  };
}

/**
 * Apply an APPROVED relocate: write BOTH entries and commit them in ONE commit.
 * Re-previews first (a stale proposal fails honestly). Never throws. Mirrors
 * armedWriteEntry; the essential difference is paths:[srcRel, destRel].
 */
export async function armedRelocate({
  repoRoot, srcRel, destRel, op, summary, verify = 'unverified',
  author = 'claude', bodyMessage = '', scope,
}) {
  const pv = previewRelocate(repoRoot, srcRel, destRel, op);
  if (!pv.ok) return pv;

  const srcAbs = resolve(repoRoot, srcRel);
  const dstAbs = resolve(repoRoot, destRel);
  try {
    mkdirSync(dirname(dstAbs), { recursive: true });
    clearStaleLocks(repoRoot);
    writeFileSync(srcAbs, pv.src.after, 'utf8');
    writeFileSync(dstAbs, pv.dest.after, 'utf8');
  } catch (e) {
    return { ok: false, error: `relocate write failed: ${e.message}` };
  }

  const commit = await commitSelected(repoRoot, {
    paths: [srcRel, destRel],
    kind: 'edit',
    scope: scope || `${basenameNoMd(srcRel)}→${basenameNoMd(destRel)}`,
    summary: summary || `companion relocate → ${basenameNoMd(destRel)}`,
    verify,
    body: bodyMessage,
    author,
  });
  if (!commit.ok) return { ok: false, error: `relocate commit failed: ${commit.error}`, message: commit.message };
  return {
    ok: true, op: 'relocate', shortHash: commit.shortHash, subject: commit.subject,
    message: commit.message, moved: pv.moved, src: pv.src.path, dest: pv.dest.path,
  };
}
```

### 2) `companion-prompt.js` — teach the op (in `buildEntryPrompt`)
Add to the **Edit ops** menu:
```
  - relocate: MOVE a section out of THIS entry into ANOTHER entry, in one
             approved step.  {"op":"relocate","find":"<exact section text from THIS body>","dest":"<destination entry title>","destOp":"append"}
             "find" is cut from THIS entry verbatim — include the section heading
             if you mean the whole section — same exact+unique rule as rewrite,
             and added to «dest». "dest" is an entry TITLE (the name inside a
             [[wikilink]]), NOT a path; prefer a destination already in your
             typed-link neighborhood and NAME it. "destOp": "append" (end,
             default) or "prepend" (start). A relocate touches TWO entries, so it
             is NEVER silent — your reply MUST say what you're moving and where
             (old home → new home, and why).
```
Fold `relocate` into the **never-quiet** set in the NARRATION paragraph (alongside `set-vector`). Optional one-liner for the prompt body: after a move, source and destination are often related enough to deserve a typed link — the companion should *suggest* the `connects-to` in prose (links are frontmatter, still out of its write scope), not try to add it.

### 3) `companion-lane.js` — resolve, propose, apply
Imports:
```js
import { assembleGrounding, assembleGroundingByTitle, resolveTitleToPath } from '../src/lib/entry-grounding.js';
import { armedWriteEntry, armedRelocate, revertCommit, previewEdit, previewRelocate } from './armed-write.js';
```
Two new message builders, modeled on `buildEditProposalMessage` / `buildEditProofMessage`:
```js
export function buildRelocateProposalMessage({ title, entryPath, turnId, op, destPath, destTitle, summary, model, ts, id }) {
  const slug = slugify(title);
  return {
    schema_version: '1.0',
    id: id || `${slug}-companion-reloc-proposal-${turnId}`,
    ts, session_id: `companion-${slug}`,
    from: companionFrom(title), to: '*', type: 'BROADCAST', board: 'GENERAL',
    health: { score: 'green', model: model || DEFAULT_MODEL, _orchestrator_metadata: {
      dispatch_mode: 'claude-code-subagent', note: 'Companion proposed relocate (awaiting approval). Path 2 stub health.' } },
    payload: {
      kind: 'companion_relocate_proposed',
      entry: title, entry_path: entryPath,   // the SOURCE
      dest: destTitle, dest_path: destPath,  // the DESTINATION
      turn_id: turnId, op,                    // op carries find/dest/destOp; [approve] sends it to /apply
      summary: summary || `move section → ${destTitle}`,
      status: 'proposed',
    },
  };
}

export function buildRelocateProofMessage({ title, entryPath, turnId, op, destPath, destTitle, shortHash, summary, model, ts, id }) {
  const slug = slugify(title);
  return {
    schema_version: '1.0',
    id: id || `${slug}-companion-reloc-${turnId}`,
    ts, session_id: `companion-${slug}`,
    from: companionFrom(title), to: '*', type: 'PROOF', board: 'GENERAL',
    health: { score: 'green', model: model || DEFAULT_MODEL, _orchestrator_metadata: {
      dispatch_mode: 'claude-code-subagent', note: 'Companion relocate committed to the live palace (approved). Path 2 stub health.' } },
    payload: {
      kind: 'companion_relocate',
      entry: title, entry_path: entryPath,
      dest: destTitle, dest_path: destPath,
      turn_id: turnId, op, commit: shortHash,
      summary: summary || `move section → ${destTitle}`,
      status: 'committed',
    },
  };
}
```
In `reap`, branch the edit handling on relocate (replaces the single `if (hasEdit) { … previewEdit … }`):
```js
if (hasEdit) {
  if (edit.op === 'relocate') {
    const destTitle = typeof edit.dest === 'string' ? edit.dest.trim() : '';
    const destRel = destTitle ? resolveTitleToPath(root, destTitle) : null;
    if (!destRel) {
      postIfValid(buildCompanionMessage({
        title, entryPath, turnId,
        reply: `I can move that out of «${title}», but «${destTitle || '—'}» isn't an entry yet — name an existing destination, or create it first and I'll move the section in.`,
        model: meta.model || model, ts: new Date().toISOString(),
        id: `${slugify(title)}-companion-relocnodest-${turnId}`,
      }));
      editSummary = { ok: false, error: 'relocate destination not found' };
    } else {
      const pv = previewRelocate(root, entryPath, destRel, edit);
      if (pv.ok) {
        postIfValid(buildRelocateProposalMessage({
          title, entryPath, turnId, op: edit, destPath: destRel, destTitle,
          summary: edit.summary || `move section → ${destTitle}`,
          model: meta.model || model, ts: new Date().toISOString(),
        }));
        editSummary = { ok: true, proposed: true, op: 'relocate', dest: destRel };
      } else {
        postIfValid(buildCompanionMessage({
          title, entryPath, turnId,
          reply: `I can't propose that move honestly: ${pv.error}`,
          model: meta.model || model, ts: new Date().toISOString(),
          id: `${slugify(title)}-companion-relocfail-${turnId}`,
        }));
        editSummary = { ok: false, error: pv.error };
      }
    }
  } else {
    // … the existing previewEdit(root, entryPath, edit) body, unchanged …
  }
}
```
In `apply`, branch before the existing `armedWriteEntry` call:
```js
if (op.op === 'relocate') {
  const destTitle = typeof op.dest === 'string' ? op.dest.trim() : '';
  const destRel = destTitle ? resolveTitleToPath(root, destTitle) : null;
  if (!destRel) return { ok: false, msg: `destination «${destTitle || '—'}» isn't an entry` };
  let w;
  try {
    w = await armedRelocate({
      repoRoot: root, srcRel: entryPath, destRel, op,
      summary: op.summary || `move section → ${destTitle}`,
      verify: 'unverified', author: 'claude',
    });
  } catch (e) {
    return { ok: false, msg: `could not relocate: ${e.message}` };
  }
  if (!w.ok) return { ok: false, msg: w.error || 'relocate failed', status: w.status };
  postIfValid(buildRelocateProofMessage({
    title, entryPath, turnId: tid, op, destPath: destRel, destTitle,
    shortHash: w.shortHash, summary: op.summary || `move section → ${destTitle}`,
    model, ts: new Date().toISOString(),
  }));
  return { ok: true, commit: w.shortHash, op: 'relocate', dest: destRel, turnId: tid };
}
// … existing single-entry armedWriteEntry path unchanged …
```
`extractResult` already passes a relocate through (it's an `edit` with an `op`). `/api/entry-agent/apply` already accepts `{ path, op }` — no new route; `path` is the source, the op carries `dest`.

### 4) Front-end — `EntryAgentWindow.jsx` (contract, not code)
- Render `payload.kind === 'companion_relocate_proposed'` as a **two-part proposal card**: "— leaving «`entry`»" (the cut span shown removed) and "→ arriving at «`dest`» (`op.destOp`)" (the span shown added). Reuse the existing proposal card's approve/dismiss affordances.
- **On approve:** `POST /api/entry-agent/apply` with `{ path: entry_path /* the SOURCE */, op, turnId }` — identical shape to a normal edit approval; the op already carries `dest`/`destOp`.
- **On the committed PROOF** (`payload.kind === 'companion_relocate'`): swap the card for a marker — "moved → «`dest`» · `commit`" — with the existing undo control (it reverts the single two-file commit).

## Next move
Spin a worktree, add `cutSpan` + `previewRelocate` + `armedRelocate` to `armed-write.js`, then the lane branches + two message builders, then the prompt menu line. Write the tests below and get them green **before** the JSX. Land the `EntryAgentWindow.jsx` proposal card last, against the contract above. One commit per coherent slice; the relocate is non-canon app code, so commit normally Mac-side.

## Receiving environment
**Claude Code on the Mac, palace root.** Capability deltas that matter for this move:
- Can edit `_ops/stigmergy/app/` — a *denied prefix* for the companion's own allow-list (correct: this is built *for* the companion, not *by* it) and unreachable from Cowork's write discipline in practice.
- Can run the app test suite (`npm test` in `_ops/stigmergy/app/`) — Cowork can't exercise the worker lane.
- **Commits normally** — none of the Cowork git-lock dance; ignore `[[cowork-git]]` here.
- **Gotcha:** confirm `validateMessage` (`@stigmergy/core/schema`, and the app's own `src/lib/schema.js` mirror) accepts the two new `payload.kind` values before trusting `postIfValid`. The existing `companion_edit_proposed` / `companion_edit` kinds validate, which implies `payload.kind` isn't enum-restricted — but verify, or a proposal silently fails to post.

## Calibrations from this session
- The frame Loudon set: **under-scoped, not over-constrained.** Keep every protective rail; add one primitive in the gap. Do not relax body-only, one-edit-per-turn, or show-before-write.
- Build *only* relocate — resist generalizing to an N-entry primitive (he wants the move surgical/minimal).
- `dest` is a **title**, resolved Node-side — keep the worker in palace-native vocabulary.
- A relocate is **never silent** (two entries change) — narration required, like `set-vector`.

## Current state — closing-well punchlist
- `armed-write.js` additions — drafted above, drop-in. **Risk:** `cutSpan` seam-healing on edge positions (span at very top / very bottom) — covered by a test below; eyeball the first real move. *Unverified: not run.*
- `companion-lane.js` branches + builders — drafted, drop-in. *Unverified: not run.*
- `companion-prompt.js` menu line — drafted. *Unverified against a live worker turn.*
- `EntryAgentWindow.jsx` — **contract only, no code** (didn't read the component this session). This is the one open authoring task.
- Schema acceptance of new `payload.kind` — **unverified**; check before relying on `postIfValid`.

## Tests to add
`armed-write.test.js` (pure / temp-repo): `previewRelocate` happy path (cut from A, append to B; both frontmatter blocks verbatim); unique-`find` guard (missing/ambiguous); `dest === src` rejected; relocate-empties-source rejected; allow-list denial on the destination (403); `cutSpan` seam-healing at top/middle/bottom; `armedRelocate` integration — **one** commit touching **two** files, correct `Palace-*` trailers, `revertCommit` of that hash restores both.
`companion-lane.test.js` / `companion-turn.test.js`: reap with resolvable dest → posts `companion_relocate_proposed`; reap with unresolvable dest → honest "isn't an entry yet" reply, no proposal; `apply` with a relocate op → `armedRelocate` runs, posts `companion_relocate`.

## Load these files first
1. `_ops/stigmergy/app/server/armed-write.js` — the write path; `cutSpan`/`previewRelocate`/`armedRelocate` go here.
2. `_ops/stigmergy/app/server/companion-lane.js` — resolve/propose/apply; branch on relocate + the two builders.
3. `_ops/stigmergy/app/server/companion-prompt.js` — `buildEntryPrompt` ops menu + narration set.
4. `_ops/stigmergy/app/server/commit.js` — confirm `commitSelected({paths})` trailers for a two-file commit.
5. `_ops/stigmergy/app/src/lib/entry-grounding.js` — `resolveTitleToPath`.
6. `_ops/stigmergy/app/src/lib/entry-edit.js` — `checkAllowList` (gates both sides).
7. `_ops/stigmergy/app/src/components/state/EntryAgentWindow.jsx` — the UI proposal card (build to the contract above).
8. Tests: `_ops/stigmergy/app/tests/unit/armed-write.test.js`, `tests/unit/companion-lane.test.js`, `tests/integration/companion-turn.test.js`.

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
*Identical in every baton. It rides along because you load the baton and the entry, not the Baton Ceremony spec — so the catcher's obligations live where you'll see them. Omit nothing here.*
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. If this baton or its board line is still uncommitted (it was authored in Cowork, which couldn't commit), commit them first. That commit is the git archive deletion relies on. There may be a stale `.git/index.lock` from the Cowork session — `rm -f .git/index.lock` before committing.
3. Mark it caught: this baton has no parent entry, so post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id `companion-relocate-op-handoff-ready-2026-06-09`) to close the announcement on the board.
4. Delete the baton file (git is its archive) once the move has landed.
5. Act on the move, holding the calibrations above.
