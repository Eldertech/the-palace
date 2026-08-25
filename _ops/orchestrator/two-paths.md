# Stage F — Two Paths (decide-after-doing)

For a fork a steward cannot resolve alone (it gave options but **no recommendation**)
or whose options are **sensory**, run **both** options to a finished deliverable in
isolated worktrees and present the two completed paths to Loudon. He chooses from
finished work, not imagined options. The engine **produces**; it never picks.

Hard invariants:
- **Loudon always chooses the winner.** Two Paths never auto-picks. The only thing
  that triggers a merge is a `choice_response` from the rich-content ChoiceBlock.
- **Build-both only.** Verdict forks (approve / adjust / reject of one existing
  deliverable) stay single-path Stage E triage — they are not two things to build.
- **Cost box:** each branch is one steward cycle + one concrete artifact. A branch
  that would exceed that posts `status:"oversized"` and stops; the fork falls back
  to plain escalation. Never fork an unbounded path.
- **Default dry-run.** Nothing runs a model, creates a worktree, merges, or edits a
  page until you pass `--execute` / `execute:true`.

## Pipeline (5 phases)

| Phase | Module | What it does |
|---|---|---|
| 0 selection | `trickster-auto/src/two-paths.js` | flags each Stage E escalation `two_paths_eligible` (sensory OR rec=n), excludes verdict forks, extracts the 2 options. Surfaced in `digest.js`. |
| 1 dispatch | `orchestrator/src/two-paths-dispatch.js` | builds two branch directives + isolated worktree targets + cycle prompts. |
| 2 reconcile | `orchestrator/src/two-paths-reconcile.js` | gathers both branches' `branch_result` posts into one deterministic object; `ready_for_choice` when both built. |
| 3 emit | `orchestrator/src/two-paths-card.js` | packages the two deliverables as a rich-content `choice` card → TRICKSTER board. |
| 4 merge | `orchestrator/src/two-paths-merge.js` | on the `choice_response`, auto-merges the winning branch; preserves the loser (branch kept + note on page). |

## Dry-run invocations

```sh
# Phase 0 — which forks are eligible (re-generates the Stage E digest with two_paths fields)
cd _ops/stigmergy/trickster-auto && node src/cli.js --out .

# Phase 1 — print the two-branch dispatch plan for one eligible fork (no models, no writes)
cd _ops/stigmergy/orchestrator && node src/two-paths-dispatch.js --request-id <id> --with-prompts
#   omit --request-id to plan every eligible fork
```

Live execution (branch dispatch, merge) is the opt-in step: dispatch each branch as a
Claude Code subagent with the Agent tool's `isolation: 'worktree'`, feeding the Phase 1
directive as the cycle mandate; after both `branch_result`s land, emit the choice card
(Phase 3) and, on Loudon's pick, run `mergeWinner({ execute: true })` + `preserveLoserOnPage`.

## Not yet wired (deliberate)

- **Daily two-paths run cap.** The cost box bounds each branch; a per-day run cap
  belongs with a future *automated* live dispatcher. Today dispatch is a manual,
  opt-in Agent-tool step, so there is no runtime counter to gate yet.
- **Checkpoints (§10.1).** Branches run a directed fresh cycle ("take option X"),
  not a fork from a stored checkpoint. Checkpoints are a later enrichment.
