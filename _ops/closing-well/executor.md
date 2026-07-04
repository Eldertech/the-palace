# Closing Well Agent — the executors (Phase 5)

The Agent drafts; Loudon assents; the **executors** place each assented row of the
backstage checklist into the palace *through its existing ceremony* — never around it.
This file is the executor protocol: what runs, which real tool carries it, and the two
routing rules that keep a close from stranding work.

> **Execution is a dispatched moderator, not the main loop.** By the moderator model, *the
> mechanism is the moderator's alone; the panelists never see it as work*. So the executors
> below are run by a fresh **backstage** subagent (Pass 3 — `prompts/closing-well-executor.md`),
> not by the spent working instance. This file is that subagent's protocol; the working
> instance only relays its placement report.

> **Reuse, do not rebuild.** Every executor is a thin wrapper over machinery that already
> exists and is trusted. An executor's only new work is *placement + routing + validation*
> — the ceremony's own quality is untouched.

## The two routing rules (load-bearing)

1. **Canon → owner.** A `deposit` writes into the *graph*; it must land on `main` in the
   **owner** tree, never on a feature branch where it would be invisible until merge. From
   a worktree, the committer targets the trunk with `PALACE_ROOT="<owner>"`. A deposit
   committed to a feature branch is the Phase-5 failure mode — check the branch first.
2. **Baton → worktree, announced on the owner board.** A `baton` continuing *feature work*
   lives in that worktree's bundle, on its branch — invisible from every other worktree. So
   a cross-worktree baton **must** be announced on the owner's persistent board (the only
   global rendezvous) and name its worktree coordinate. A baton continuing *canon* work
   lives on the owner, like the deposit.

The `status` column decides what runs: `candidate` executes; `landed` / `provisional` /
`none` execute nothing (`landed` already happened mid-session; `provisional` waits on
Loudon; `none` is a first-class outcome).

## The executors, by species

### keep → deposit  (reuse: the palace committer)
The Deposit Ceremony's own rule holds: **the commit is the record**; use the committer,
never a hand-rolled `git commit`. Run the **owner's** copy of the committer, from the owner
tree — canon lands there (rule 1), and only the owner tree reliably has the committer's deps
(`js-yaml`; a `docs`-profile worktree does not, so the worktree copy throws `ERR_MODULE_NOT_FOUND`).

```bash
# Land canon on the owner's main, using the owner's committer:
node "<owner>/_ops/stigmergy/app/scripts/palace-commit.mjs" \
  --kind deposit --scope <D-YYYY-MM-DD-ID> \
  --paths "<Entry>.md,<Entry>/<links/artifacts touched>" \
  --summary "<synthesis one-liner>" --verify <how> --dry-run   # preview; drop --dry-run to land
```
The committer composes the `deposit(<id>):` subject, derives `Palace-Entry`/`Palace-Stage`/
`Palace-Vector` from the staged diff, and stamps `Palace-Kind: deposit` so the deposit
self-classifies onto the LOG deck's deposit view. The synthesis goes in the commit **body**;
the frozen `Deposit Archive.md` is never appended to. (`--kind`, `--summary`, `--verify` are
required.)
*Executor check:* the commit lands on the owner's `main` (rule 1); links resolve (no ghost
nodes); `--dry-run` subject reads `deposit(<id>): …` before landing.

### hand on → baton  (reuse: `baton-executor.mjs` → `board-post.mjs` + the committer)
One script scaffolds the bundle file (correct §8 frontmatter + the fixed On-pickup
checklist appended, so it is never hand-retyped and never drifts) and posts the validated
`handoff_ready` announcement to the owner board:

```bash
node _ops/closing-well/baton-executor.mjs \
  --entry "<Entry>" --move "<one sentence>" --body-file <drafted-baton.md> \
  --wt-branch <branch> --wt-dir <dir> --wt-profile <profile> \
  --session-id <slug> --owner "<owner>" [--post]      # omit --post to dry-run (validate only)
```
It writes `<Entry>/<Entry> — baton.md`, adds the `## Active Baton` pointer to the parent
entry, validates + (with `--post`) appends the `handoff_ready` line to the owner's persistent
board, and prints the exact `git commit` command to land the file + pointer. A feature-branch
baton is non-canon and committed *in the worktree* with plain git (the commit-msg hook stamps
`Palace-Kind: baton`) — the committer is reserved for deposits, which need its deps and land on
the owner.
*Executor check:* the announce validates (§9); the worktree coordinate is real
(`git worktree list`); the baton file + pointer are committed so git is its archive.

### leave a trace → artifact  (reuse: the bundle + the committer)
File the artifact in the owning entry's bundle (`<Entry>/<Entry> — <type> — <qualifier>.<ext>`,
SCHEMA §8) with its minimal bundle frontmatter for `.md` assets, and index it (a one-line
pointer under the entry's artifacts list, or the bundle's own index). Commit with
`palace-commit --kind ops` (or `artifact`). Non-canon, durable evidence — not a deposit.
*Executor check:* the file is inside the bundle (not the deprecated `Artifacts/`), the index
line points at it, the commit is not mis-stamped `deposit`.

### let go → (nothing to place)
Named in the reckoning, released. No executor — naming what didn't survive is the
reflection's job, not the mechanism's.

## The end-to-end gate (Phase 5 verify)
A signed reckoning executes end to end when: every `candidate` deposit row lands on the
owner's `main` (rule 1); every `candidate` baton is announced and its announce validates
(rule 2); every artifact is filed + indexed; and **nothing is stranded on a feature branch**
(`git -C "<owner>" log --oneline -3` shows the canon; `git worktree list` + a board read show
the baton). Run the check, then say plainly what landed where.
