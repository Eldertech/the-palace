# Batch mode — cycle the folder once

This is Stage C of [[Project Stewardship System]], kept deliberately thin:
*cycle through the folder on a schedule.* One run advances every enchanted
steward that is due, then stops. It adds no new substrate — it is a loop
around the v0.1 `permanent.md` cycle.

A weekly scheduled task invokes this workflow. You can also run it by hand
("run my steward batch").

## What "enchanted" means here

A project is stewarded only if it has a directory at
`_ops/agents/permanent/<name>/` with a `manifest.json` (`mode:
long_duration_background`). Creating that directory — *enchanting a
project* — is a deliberate, one-at-a-time act (see "Enchant a new steward"
below). **Batch never auto-spawns.** It loops what is already enchanted.

## Workflow

### Step 1 — Plan (deterministic, no dispatch)

```bash
node _ops/stigmergy/orchestrator/src/batch-plan.js
```

Returns JSON with:

- `due[]` — enchanted, active, non-dormant stewards whose last cycle is
  older than the debounce window. These get a cycle this run.
- `skipped[]` — with a `reason` each (dormant/composting page, non-active
  status, or cycled too recently). Don't touch these.
- `unenchanted[]` — active project pages with no steward. **Informational
  only.** Surface them to Loudon if he asks "what's not being tended?" —
  never act on them in batch.

If `due[]` is empty, there is nothing to do. Report that and stop.

### Step 2 — Confirm (interactive runs only)

In an interactive session, show Loudon the `due[]` list one line each and
confirm before dispatching — each cycle costs a real subagent. In a
**scheduled run, skip confirmation** and proceed; the schedule is the
standing consent.

### Step 3 — Cycle each due steward

For each entry in `due[]`, follow `permanent.md` exactly — one cycle, one
subagent, validate-and-append via the CLI, then post-process with
`process-cycle.js`, which updates that steward's `state.json` +
`history.jsonl` **and materializes the bundle-local `[Entry] — plan.md`
read-model** from the cycle's decisions (Bundle-Local Stewardship,
2026-06-09 — see [[Bundle-Local Stewardship — Production Plan]]). The plan
write is part of every cycle, not an optional extra: use the
`process-cycle.js` helper so it always happens — don't hand-roll
post-processing and silently skip it, or the bundle read-models go stale.
The order is the `due[]` order.

One steward's failure does not halt the batch. If a cycle errors or its
output is rejected, note it and move to the next steward.

### Step 4 — Summarize

One short paragraph: which stewards ran, what each posted (ids), and any
that left a question on the Trickster board for Loudon. That is the whole
report — **do not write a digest file.** The per-cycle BBS messages are the
record; STIGMERGY shows them.

## Posture for unattended runs

- Stewards default to non-blocking asks in growing/mature posture, so a
  scheduled batch leaves questions on the Trickster board and never waits.
  A blocking sensory-audition ask is fine to post — it simply waits for
  Loudon; the batch keeps going.
- **Do not edit canon directly** in an unattended run: never touch a project
  entry's `.md` body or frontmatter. Stewards propose page edits via the BBS;
  Loudon (or a later interactive cycle) deposits. Writing the bundle-local
  `[Entry] — plan.md`, the steward machinery (`state.json`/`history.jsonl`),
  and board messages is **expected** — that is the cycle's normal output, not
  a canon edit.
- **The subagent never commits.** Under the Mac-side heartbeat the *wrapper*
  makes one scoped, lock-safe commit after the batch returns — machinery +
  `plan.md`, text-only, via the palace committer (`_ops/heartbeat/`,
  `palace-commit.mjs`; never `git add -A`). An interactive batch leaves the
  working tree for Loudon to commit. Either way the agent itself runs no git.

## Enchant a new steward (the one-at-a-time act, done by hand)

Batch only loops what exists. To add a project to the rotation, create its
steward directory once. The durable helper does steps 1-3 in one call (reads
the page's frontmatter, writes the dir, validates the manifest, registers it):

```bash
node _ops/stigmergy/orchestrator/src/enchant.js "<Page Title>"
```

It enchants exactly one project (deliberate, one-at-a-time) and is a no-op if
the steward dir already exists. The manual equivalent, for reference:

1. `mkdir _ops/agents/permanent/<kebab-name>/`
2. Write `manifest.json` modeled on
   `_ops/agents/permanent/generative-sample-libraries/manifest.json`:
   `agent_id` = `home` = the page title (Finding 11), `mode:
   long_duration_background`, `model` (opus for richer voice), the
   neighborhood from the page's YAML links, and a `stewardship` block
   (stage + vector at spawn).
3. Initialize `state.json` (`{"iteration": 0, "last_active": null,
   "last_read_cursor": null, "pending_requests": []}`) and an empty
   `history.jsonl`.
4. Next batch run picks it up (first activation reads the full board and
   sets the cursor — Gap 6).

Keep this manual and deliberate. The point of stewardship is to tend
projects at the rhythm each one wants, not to enchant the whole folder at
once.

## What batch deliberately does NOT do

Per the thin-Stage-C decision (see [[Project Stewardship System]]), batch
has **no cadence enum** (the cron is the cadence), **no digest writer**
(the BBS is the record; the human-readable review digest is a separate
`trickster-auto` product — `heartbeat-latest.md` — not a batch output),
**no retire/pause/resume lifecycle** (delete the dir to retire), **no
auto-spawn**, and **no lock file**. Each of those was
in the v0.2 plan; none is built. If a real run makes one necessary, let it
earn its way in then.
