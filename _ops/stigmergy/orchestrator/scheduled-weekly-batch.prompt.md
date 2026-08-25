# Proposed scheduled task — "palace-steward-weekly-batch"

This file is for review. It is NOT yet registered as a scheduled task.
Once you're happy with the prompt below, I register it with one call and it
starts firing on the cron. Until then nothing runs on a timer.

- **taskId:** `palace-steward-weekly-batch`
- **cron:** `0 6 * * 1`  (every Monday 6:00 AM, local time)
- **where it will live once created:** `/Users/loudonstearns/Documents/Claude/Scheduled/palace-steward-weekly-batch/SKILL.md`
- **what it does:** opens the palace and runs the batch workflow
  (`_ops/orchestrator/batch.md`) — i.e. cycles every
  enchanted, due steward once, then stops.

## How to test it WITHOUT creating the schedule

The cron only controls *when* this fires. The *behavior* is the batch
workflow, which runs on demand. So testing the task == running the batch by
hand:

- **Plan only (no cost, no writes):**
  `node _ops/stigmergy/orchestrator/src/batch-plan.js`
  Shows `due[]`, `skipped[]`, `unenchanted[]`. Add `--min-age-hours 0` to
  see a recently-cycled steward (GSL) move into `due[]`.
- **Full loop (one real cycle per due steward):** run the batch workflow
  by hand against whatever is due. Same actions the scheduled session would
  take — the schedule adds nothing but the timer.

## What success looks like

A Monday run prints which stewards cycled, the message ids each posted, and
any non-blocking questions now waiting on the BBS Trickster board. It then runs
the Automated Trickster (Stage E) in **shadow** mode, producing one ranked
digest of those asks (`_ops/stigmergy/trickster-auto/digest-latest.{json,md}`,
also shown on the STIGMERGY TRICKSTER tab). No board writes from the Trickster
while it is in shadow; no commit.

---

## The prompt body (this is what runs each Monday)

You are running the weekly palace steward batch — Stage C of the Project Stewardship System. The palace is at /Users/loudonstearns/Documents/The Palace (the connected folder). Work there.

GOAL: advance every enchanted, due project-steward by one cycle, leaving any questions on the BBS for Loudon to answer later. This is deliberately thin: a loop over the existing per-steward cycle. Do not invent new structure.

STEPS — follow `_ops/orchestrator/batch.md`, which means:

1. Plan (no model dispatch): run
   `node _ops/stigmergy/orchestrator/src/batch-plan.js`
   It prints JSON with `due[]` (stewards to cycle this run), `skipped[]` (with reasons — leave them alone), and `unenchanted[]` (informational only — never act on these).
   If `due[]` is empty, do nothing, report "nothing due," and stop.

2. For EACH steward in `due[]`, follow `_ops/orchestrator/permanent.md` exactly — one cycle, one subagent:
   - Validate the manifest and run the register-check via `node _ops/stigmergy/orchestrator/src/cli.js`.
   - Run `check-page <home> <state.last_active>`. If the home page's `forward_vector` changed since last activation, do NOT dispatch that steward — post a request to the TRICKSTER board noting the vector changed, and move on.
   - Render the steward system prompt via `prompts.js` (templateName "steward"), build the user-turn (home-entry body + neighborhood frontmatter + state + history-since-last-CYCLE_COMPLETE + the blackboard slice since `last_read_cursor`), and dispatch the project PAGE as a subagent via the Agent tool, model opus. Instruct the subagent to return JSON BBS messages only (omit the health field) plus a short close note.
   - For each returned message: build the health block with `cli.js health '{"total_tokens": N, "model": "claude-opus-4-7"}'`, inject it, validate with `cli.js validate-message --prior-board _ops/swarm/persistent/blackboard.jsonl --agent-id "<home>"`, then append with `cli.js append --target persistent --persistent-path _ops/swarm/persistent/blackboard.jsonl --agent-id "<home>" --prior-board _ops/swarm/persistent/blackboard.jsonl`.
   - Update that steward's `state.json` (iteration, last_active, cursor, pending_requests) and append `history.jsonl` events including a CYCLE_COMPLETE that records a punchlist-grade `next_cycle_action` baton and anything the steward could not verify (Closing Well discipline).
   - One steward's failure must NOT halt the batch — log it and continue to the next.

POSTURE for this unattended run:
- Keep asks NON-BLOCKING. Leave any decisions on the BBS Trickster board; never wait.
- Do NOT edit project pages directly. Stewards propose via the BBS only.
- Do NOT commit and do NOT push. Leave the working tree for Loudon to commit Mac-side.

3. After the batch loop completes, run the Automated Trickster (Stage E) ONCE in
   shadow mode to consolidate the asks into one ranked digest:
   `node _ops/stigmergy/trickster-auto/src/cli.js --shadow`
   This posts NOTHING to the board (shadow); it only writes
   `_ops/stigmergy/trickster-auto/digest-latest.{json,md}`, which STIGMERGY
   renders on the TRICKSTER tab. Do NOT pass `--live` in the unattended run —
   write authority is Loudon's to enable once the shadow proposals match his own
   decisions. The hard rule holds regardless: auditions and irreversible actions
   always escalate, never auto-grant. See `_ops/orchestrator/trickster-auto.md`.

REPORT at the end: one short paragraph — which stewards ran, the message ids each posted, the digest's headline counts (pending / escalate / auto-grant-proposed), and any blocking auditions now at the top of the digest for Loudon. Then stop.
