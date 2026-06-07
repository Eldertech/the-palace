---
name: cowork-git
description: Commit palace changes from a Cowork session safely, despite the sandbox's inability to delete files. Use this EVERY time a commit must be made from Cowork (the connected-folder agent). It wraps the palace's own committer with a rename-based lock sweep, follows the full palace commit spec, leaves a weave flag for litter cleanup, and refuses (handing off instead) when a direct commit would be unsafe. Trigger on any intent to "commit", "git commit", "record this", or "save to the repo" while running in Cowork. Do NOT use from a Mac-side Claude Code session — there, commit normally (or via STIGMERGY's LOG deck), since the unlink restriction does not apply.
---

# cowork-git — lock-safe committing from the Cowork sandbox

## The one fact that creates this skill

The Cowork sandbox mounts the palace on a filesystem that can **create and
rename** files but **cannot `unlink` (delete)** them. A normal `git commit`
writes its objects and refs fine (those land via rename) but then fails to
remove its own `*.lock` files — and the stranded `.git/index.lock` wedges the
*next* git operation. So committing naively from Cowork half-works once, then
jams the repo.

The fix exploits the asymmetry: **rename is allowed**. We relocate the stranded
locks instead of deleting them.

## What it does (and does NOT reinvent)

The palace already has one correct committer: `_ops/stigmergy/app/server/commit.js`
`commitSelected()`. It stages **only the named paths** (never `-A`), derives the
`Palace-*` trailers from the staged diff, and writes a spec-conformant message.
This skill does **not** reimplement any of that. It is a thin wrapper that adds
only the lock handling the sandbox forces on us:

1. **Guard** — refuse if a git transaction is in progress (`MERGE_HEAD`,
   `rebase-merge`, etc.), or if a `*.lock` younger than the threshold (default
   30s) is present — that could be a live op in another sandbox (e.g. the
   scheduled heartbeat) we cannot see. Stale locks (older than the threshold)
   are relocated and we proceed.
2. **Pre-sweep** stale locks → `_ops/scratch/gitlock-junk/` (rename).
3. **Commit** via `commitSelected` — unchanged, the single source of truth.
4. **Post-sweep, forced** — the commit re-creates locks it cannot unlink; those
   are ours and definitionally safe, so we relocate all of them so the next
   commit is not wedged.
5. **Weave flag** — post (idempotently) one `weave_flag` BROADCAST on the `WEAVE`
   board so the next Weave clears the litter Mac-side.

## Usage

```
node _ops/cowork-git/commit.mjs \
  --paths "rel/path/a.js,rel/path/b.md"   # comma list, or repeat --path; palace-relative
  --kind ops                              # deposit|edit|enrich|handoff|steward|weave|schema|ops|merge|mixed
  --scope cowork-git                      # optional subject scope
  --summary "what changed"                # the subject line
  --body "why (optional)"
  --verify unverified                     # verified|unverified|couldnt — BE HONEST (see below)
  [--author claude]                       # Palace-Author; default claude (it's me committing, not Loudon)
  [--lock-threshold 30]                   # seconds; locks younger than this abort to handoff
  [--no-flag]                             # skip the weave cleanup flag
  [--dry-run]                             # validate + show the plan, commit nothing
```

It prints a JSON result: `{ ok, shortHash, subject, committed, movedLocks, weaveFlag }`,
or `{ ok:false, error, handoff:true, ... }` when it refuses.

## When NOT to lock-move — hand off instead

Lock-move is for **small, non-canon changes I authored this session** (code, ops
machinery, deliverables). Do NOT direct-commit — leave a handoff instead — when:

- The change touches **canon**: knowledge entries (`*.md` concepts/projects/hubs),
  `SCHEMA.md`, ceremonies, `CLAUDE.md`, or anything that belongs to the
  **Deposit Ceremony**. Those are Loudon's call and should go through the
  structured pipeline (STIGMERGY LOG deck) or a deliberate deposit.
- The helper **refuses** (`handoff:true`) — a fresh lock or an in-progress
  transaction. Don't force it; that's the one path that can actually corrupt a
  repo.
- The web of changes is **large or multi-commit** and wants human review.

Today the handoff is: report the exact commit plan (paths + kind/scope/summary/
body/verify) to Loudon so he commits Mac-side or via the LOG deck. The
**automated BBS commit-handoff flag + a LOG-deck consumer is layer B** — not yet
built; see the parent conversation. Until then, "handoff" = surface the plan.

## Palace commit requirements (enforced by `commitSelected`, honored here)

- **Stage only named paths**, never `git add -A` (the N-writer lesson).
- **Subject**: `kind(scope): summary`.
- **`Palace-*` trailers** derived from the staged diff: `Palace-Kind`,
  `Palace-Entry`, `Palace-Stage`, `Palace-Vector`, `Palace-Verify`,
  `Palace-Author`.
- **`--verify` honesty (Closing Well)**: pass `verified` only when you actually
  ran the relevant tests/checks for this change; otherwise `unverified` (didn't
  check) or `couldnt` (couldn't, e.g. sandbox can't run it). Never default to
  `verified`.
- **`--author claude`** for Cowork commits, so the LOG stays honest about who
  recorded them.

## The litter it leaves (and how it's cleaned)

- Relocated locks accumulate in `_ops/scratch/gitlock-junk/` — already gitignored
  (`_ops/scratch/` is the established "junk Cowork couldn't delete" area).
- `git add` leaves un-deletable `.git/objects/**/tmp_obj_*` temp objects. These
  live inside `.git` (never tracked) and are harmless to git's operation (`fsck`
  stays clean); they're just clutter only a Mac-side process can remove.
- One open `cowork_litter_sweep` weave flag covers all such commits until a Weave
  sweeps the junk dir and closes it. The flag is idempotent — it won't repost
  while one is open.

## Honest limitations

- **Not auto-registered as a Cowork capability.** This is palace machinery,
  invoked by convention (the `CLAUDE.md` pointer + this skill). Making it an
  auto-loading Cowork skill is a Settings → Capabilities action on Loudon's side.
- **Concurrency is heuristic.** I can't see processes in other sandboxes (the
  heartbeat runs in its own). The lock-age guard is the safety net; when in
  doubt it refuses rather than risk a live op.
- **Verified end-to-end** in a throwaway repo on the palace mount (the real
  unlink-block): four consecutive commits, all `fsck`-clean, locks cleared each
  time, flag idempotent. See the parent conversation for the smoke run.
