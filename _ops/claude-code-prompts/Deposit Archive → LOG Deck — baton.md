---
title: "Deposit Archive → LOG Deck — baton"
born: 2026-06-19
links:
  - target: "[[Deposit Ceremony]]"
    type: connects-to
    label: "baton-for"
  - target: "[[Deposit Archive]]"
    type: connects-to
  - target: "[[STIGMERGY]]"
    type: connects-to
forward_vector: "I carry the migration of the deposit record into the LOG deck across the Cowork→Claude-Code boundary, waiting to be caught by the next Claude and deleted once the move is executed and committed."
session_thread: Cowork session 2026-06-19 (STIGMERGY ↔ ceremonies review)
---

# Baton: Deposit Archive → LOG Deck

## Move
Fold the deposit's record into the LOG deck: a deposit's commit *is* its archive entry (`Palace-Kind: deposit` + synthesis in the commit body), `Deposit Archive.md` is frozen as the pre-spec record, and the deposit ceremony stops hand-appending a table row. Land the freeze header first so it intercepts any in-flight session still running the old logic.

## Why this move matters
The Deposit Archive is a hand-edited markdown table that *duplicates* what the deposit's git commit already records — a third log next to git and the blackboard, append-only in name only, drift-prone. STIGMERGY is now Loudon's legibility window, and the LOG deck already parses every Palace-* trailer, already knows `deposit` as a first-class kind (brightest card color), and already returns full commit bodies. So the archive doesn't need a better format — it needs to *dissolve into the log Loudon already reads*. The honest creed ("nothing is real until it lands in LOG; git is ground truth; one write path") becomes literally true of the deposit record.

## Tried and rejected (this session's negative space — do not re-explore)
- **Append-only `Deposit Archive.jsonl` sidecar** — rejected. Better-disciplined than the markdown table, but still a second log duplicating git. Loudon: "STIGMERGY is my legibility window" — a sidecar would need new ingestion plumbing; the LOG deck needs none.
- **Posting completed deposits to the persistent board** — rejected. The board is QUEUE (present coordination / future action). A completed deposit needs no future action (its weave flags do, and those already go to the board). A full historical ledger on the live field would bloat it. Completed deposit = LOG, not QUEUE.
- **Rendering a markdown read-model from git** — rejected. No markdown view is wanted; STIGMERGY *is* the view.
- **Full backfill of the ~30 legacy rows** (e.g. git notes) — rejected as heavy. Freeze the existing table in place instead; old summaries stay where they are.

## Current state
The change is four approved-in-principle drafts, not yet written. Reproduced verbatim — this is the irrecoverable content:

**Draft A — `_ops/Deposit Ceremony.md`, replace the entire "Step 7b: Record and commit" block with:**

> **Step 7b: Record and commit**
>
> The deposit's record *is its commit*. There is no separate archive file to append to — the [[Deposit Archive]] is now a view of the LOG deck, filtered to `Palace-Kind: deposit`, read through STIGMERGY (§ The Archive Is the LOG Deck). What was once a hand-written table row is now the commit's **body**: write the synthesis there, where it becomes legible natively.
>
> Compose the commit through the palace committer (`POST /api/commit/create` when the STIGMERGY server is up, or `_ops/cowork-git/commit.mjs` from Cowork). Pass:
> - `--kind deposit` — stamps `Palace-Kind: deposit` and colors the card the brightest phosphor on the deck.
> - `--scope <deposit-id>` — the human ID (e.g. `D-2026-06-19-ARCHIVE`). The committer composes the spec subject `deposit(<id>): <summary>`, which is what makes the commit self-classify onto the deposit view. *(The old `Deposit — …` em-dash subject is retired — it does not self-classify.)*
> - `--summary "<one line, observational past tense>"` — the subject's summary half.
> - `--body "<the synthesis>"` — everything the archive row used to carry: what was created, the through-line, lost branches, and a `Weave flags:` line naming any flags posted (provenance, not queue — the flags live on the board). Unlimited length; **this body is the archive entry.**
> - `--verify <verified|unverified|couldnt>` — the honest state.
>
> The committer derives `Palace-Entry:` from the staged `.md` paths; add an explicit `Palace-Entry: <Title>` for any *updated* (not newly-added) entry so it appears on the card. Optional `Palace-Source: <conversation ref>` preserves provenance.
>
> Then the weave flags, unchanged: for each weave flag named in the deposit, append a `weave_flag` BROADCAST to the **owner's** `_ops/swarm/persistent/blackboard.jsonl` (never a worktree branch copy; § Where the Deposit Lands), `payload.kind: 'weave_flag'` per [[STIGMERGY — Weave Flag Item Type Build Plan]] § Data shapes — with `source_deposit_id` set to the commit's deposit ID. Show Loudon the message bodies before writing; commit only on his approval.
>
> Commit on the owner's `main` (`git -C "<owner>"` when the session runs in another worktree). The commit *is* the archive record; once it lands in LOG, the deposit is on the shelf.

**Draft B — same file, Completion Signal: replace conditions 4–7 with:**

> 4. The deposit is committed in spec form — subject `deposit(<id>): …`, the synthesis in the commit **body**, `Palace-Kind: deposit` + `Palace-Entry:` trailers present — so it lands natively on the LOG deck's deposit view. *(Replaces "row appended to the archive": the commit is the record, not a duplicate of it.)*
> 5. At least one link in the new entries carries a `label` — the semantic compression step, not just structural registration.
> 6. Weave flags, if any, on the persistent board as `payload.kind: 'weave_flag'` BROADCASTs with `source_deposit_id` matching the commit's deposit ID — not left as prose in the commit body alone.

**Draft C — same file, two consistency touch-ups:**
- In § Where the Deposit Lands, strike "the [[Deposit Archive]] row" from the "Write all new entries, bundle files, the [[Deposit Archive]] row, and any weave_flags…" list.
- Add a short new subsection "§ The Archive Is the LOG Deck" near Step 7b stating the LOG-deck-filter definition (referenced by Step 7b above): the Deposit Archive is the LOG deck filtered to `Palace-Kind: deposit`, each row's synthesis read from the commit body; there is no file to append.

**Draft D — `_ops/Deposit Archive.md`, replace the header (the three lines under `# Deposit Archive`, above the table) with:**

> **Frozen 2026-06-19 — pre-spec record only.** A completed deposit's record is now *its commit*: STIGMERGY renders the Deposit Archive as the LOG deck filtered to `Palace-Kind: deposit`, reading each synthesis from the commit body. There is no row to append — the deposit ceremony writes the summary into the commit (see [[Deposit Ceremony]] § Step 7b).
>
> The table below is preserved unedited as the historical archive of every deposit committed *before* the migration. These commits predate the `deposit(<scope>):` subject spec and do not all self-classify on the LOG deck, so their hand-written summaries live here and nowhere else. **Do not append to it.**

## Next move
Execute in this order so the intercept exists before anything else changes:
1. **Land Draft D first** (the freeze header) — this is the in-flight-session intercept. Commit it alone if you want the wall up immediately.
2. Land Drafts A–C (the ceremony spec).
3. **Post the steward-notice BROADCAST** (below) so running sessions get proactive notice — only *after* A–D are committed, or the notice points at text that isn't there yet.
4. **Verify** (don't skip — this is the whole point): make a throwaway commit with `--kind deposit --scope TEST`, hit `GET /api/log`, confirm the card returns `kind: "deposit"`, `kindSource: "trailer"`, and the body renders; then drop the test commit. Confirm the LOG card actually *displays the body* inline for deposit cards — if it only shows on drill-in, that's the one client gap to close (or note it as a follow-up).

Optional dogfood: record this very migration as the first new-form deposit — `deposit(D-2026-06-19-ARCHIVE): folded the deposit archive into the LOG deck` — so the new flow's first entry is the change itself.

## Receiving environment
**Claude Code, Mac, palace root, owner/main.** Capability deltas that matter here: (1) can commit canon directly — no cowork-git lock dance; this *is* a canon edit (Deposit Ceremony is `type: practice`), so it belongs on your surface, which is why it's being handed over. (2) Can delete (this baton self-deletes on pickup). (3) Can run the STIGMERGY dev server to do the verify step — Cowork cannot. Gotcha: confirm the primary checkout is on `main` before committing (§ Where the Deposit Lands precondition). No worktree — this lands on the owner.

## Calibrations from this session
- STIGMERGY is Loudon's legibility window — no markdown render, no sidecar; the LOG deck is the view.
- A deposit's record = its commit. The synthesis moves from a table cell to the commit body.
- In-flight sessions are intercepted *structurally* by the freeze header, not just by a notice — land Draft D first.
- Don't post the steward-notice before the spec change lands (it would point at stale text).

## The steward cache-invalidation notice (post on landing, after A–D commit)
A `BROADCAST` to `GENERAL`, `from: "Deposit Ceremony"`, `payload.kind: "note"`:

```json
{
  "schema_version": "1.0",
  "id": "deposit-logic-change-notice-001",
  "ts": "<stamp at post time>",
  "session_id": "handoff-2026-06-19",
  "from": "Deposit Ceremony",
  "to": "*",
  "type": "BROADCAST",
  "board": "GENERAL",
  "health": { "score": "green", "model": "claude-opus-4-8",
    "_orchestrator_metadata": { "dispatch_mode": "claude-code", "note": "Path 2 stub." } },
  "payload": {
    "kind": "note",
    "note": "Deposit recording changed (2026-06-19). The Deposit Archive is no longer a hand-appended table — a deposit's record IS its commit: commit --kind deposit with the synthesis in the commit BODY; STIGMERGY renders the archive as the LOG deck filtered to Palace-Kind: deposit. Before your next deposit, re-read Deposit Ceremony.md § Step 7b. Do NOT append to Deposit Archive.md (now frozen)."
  }
}
```

## Load these files first
1. `_ops/Deposit Ceremony.md` — the file you're editing (Drafts A–C).
2. `_ops/Deposit Archive.md` — Draft D; skim the legacy table once, don't migrate it.
3. `_ops/stigmergy/app/src/lib/commit-parse.js` — confirms `deposit` kind + trailer parsing already exist (no server work expected).
4. `_ops/stigmergy/app/server/git.js` + `server/api/log.js` — how the LOG deck reads bodies/trailers; where a `?kind=deposit` filter would go if wanted.
5. `_ops/stigmergy/app/server/commit.js` — the committer (`commitSelected`) that composes the spec subject from kind/scope/summary.
6. `STIGMERGY.md` — the three-deck framing, if you need the why.

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. If this baton or its board line is still uncommitted (authored in Cowork), commit them first. That commit is the git archive.
3. Mark it caught: this baton has no parent entry — post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id `deposit-archive-logdeck-handoff-001`) to the board.
4. Delete the baton file (git is its archive).
5. Confirm the receiving-surface deltas hold before relying on them (on `main`, server runnable). A build that can't run here is a finding to report, not hide.
6. Act on the move, holding the calibrations above.
