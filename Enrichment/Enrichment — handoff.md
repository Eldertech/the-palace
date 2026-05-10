---
title: "Enrichment — handoff"
born: 2026-05-05
links:
  - target: "[[Enrichment]]"
    type: connects-to
    label: "handoff-for"
forward_vector: "I carry the in-progress move on [[Enrichment]] across an instance boundary — specifically the v1 → v1.5 calibration window, where we just shipped trigger-fired supervision and now learn from real runs what the validator catches and misses."
---

# Handoff: Enrichment

## Move

**Calibrating Enrichment v1 from real runs** — observing what the `card-validator` catches and misses, what verbose-mode reveals about the iteration loop's actual value, and what the trigger-fired flow feels like in extended use, so the v1.5 / v2 boundary can be drawn from data rather than guess.

## Why this move matters

We shipped v1 deliberately small (trigger + critic only, text-only artifacts, no maker subagents) after Loudon pulled back from the original "full guns" plan that would have built image-maker / audio-maker / brief-distillation in one go. The v1 → v1.5 boundary is where the architecture decides what specialization is actually load-bearing. Without real-run data on validator behavior, we'd be designing the makers blind. The studio-visit ethos of Enrichment fights premature complexity; this is exactly the kind of place where *letting categories emerge before locking them down* is the discipline.

## Tried and rejected

- **The "full guns" v1.** Loudon green-lit it briefly, then explicitly pulled back to "trigger and critic only" before any code was written. Full version had image-maker, audio-maker, text-maker, and critic in one shot. Reason for pullback: too many places to debug at once before knowing the trigger+critic loop felt right. Don't restart this until v1 calibration is done.
- **The "no critic" version.** Considered as the absolute smallest delta — just close the latency gap, no iteration. Rejected because it wouldn't exercise the subagent-iteration claim Loudon wanted to test.
- **`proofs/` subfolder for deposits.** Used in initial v1 ship; retired same session after Loudon pushed back. Reasoning lives in `Enrichment.md § When approving — the placement protocol` and in the *Naming note* near the commit-message section. Existing `proofs/` artifacts are NOT being moved — relocation is a separate ceremony.
- **Pull-based round trigger ("type next round in Claude Code").** Replaced by server-fired headless worker. Don't reinstate. The continuous flow is what the original ceremony spec always wanted.
- **Open-ended iteration on critic verdicts.** Capped at 1 round. Reason: queue must keep moving; an unbounded loop on stubborn cards stalls review pace and balloons token cost.
- **Surfacing kill verdicts in the BBS UI.** Discussed and deferred to v1.5. Currently kill is silent — killed card doesn't appear; a different one takes its slot. Worth surfacing only if real-run data shows the killer is doing meaningful work.

## Current state

- **v1 is live** and has produced multiple successful enrichment rounds. Git log evidence: `34c1596` (recovery round — 3 deposits + 3 FV tweaks), `e0702db` (Slime Mold petri prompt + Blood Compressor card), `3d6ee72` (Wallpaper Groups p3 + cultural mapping section), `3949958` (Metric Modulation ↔ Wallpaper Groups bidirectional typed link), `2885ce3` (Portamento listening exercise card).
- **Verbose mode is on**: every card carries `validator_verdict`, `validator_note`, `validator_iterations` in `card.md` frontmatter, rendered as a strip beneath the artifact in the BBS. Hide on plain passes only after calibration is proven.
- **Two bugs found and fixed** this session, both with code comments in `Enrichment/server.py`:
  1. Headless `claude -p` stalls on Write/Edit permission prompts without `--permission-mode bypassPermissions`. Fix in `_fire_worker`.
  2. Stale `.worker.pid` masked dead workers due to PID reuse — `os.kill(pid, 0)` would return alive on any reused PID. Fixed by `_pid_is_our_worker` (probes `ps` output for our spawn signature) plus a daemon-thread cleanup that removes the pid file when the subprocess exits.
- **Deposit placement convention is new** as of 2026-05-05. New deposits go to `<EntryFolder>/<descriptive-slug>.<ext>` — bundle root, no `proofs/` subfolder. Multi-file coherent sets get a folder named for what the *set* is. The supervisor prompt (`Enrichment/supervisor-prompt.md`) was updated mid-session to reflect this; the next worker run will use it.

## Next move

Run real Enrichment sessions over the coming days and observe:

1. Does the verbose validator strip surface useful patterns — generic-output catches, overspecific kills, surprising passes?
2. Is auto-iterate-once landing v2 better than v1 most of the time, or about the same?
3. Is the queue keeping pace with review (the "5 cards always live" intent of the original spec)?
4. When does a card *want* to be media (image / audio / interactive) and the supervisor punts to a text prompt? Those moments are the strongest signal for which v2 maker subagent earns its slot first.

When patterns are clear (probably after a week of real sessions), draft a v1.5 RFC naming exactly which calibration tweaks are warranted (validator strictness, iteration cap, kill-and-replace visibility) and which v2 makers ship first. Until then, don't tune.

## Calibrations from this session

- *No `proofs/` subfolder.* Deposits go to the entry's bundle root with descriptive filenames. Multi-file coherent sets get a folder named for the *set*, not a generic category. Captured in `Enrichment.md` and `Enrichment/supervisor-prompt.md`.
- *Verbose mode is intentionally noisy* during testing. Don't preemptively quiet it; the noise IS the calibration signal.
- *Kill verdicts are invisible* in the BBS by design. Don't surface them yet — wait for data showing the killer is doing real work.
- *`bypassPermissions` for the supervisor is a deliberate trust-scope decision.* The supervisor operates only inside the palace ceremony, with git as the safety net. Do NOT default to bypassPermissions elsewhere — it's specific to this trusted ceremony surface.
- *Single global worker, sequential.* The inbox is the queue. Multi-worker coordination on git/inbox was deliberately avoided in v1.
- *Existing `proofs/` artifacts stay put.* Inconsistency between old and new placements is acceptable. A future Walk or Weave session may decide to relocate the legacy ones.

## Load these files first

1. `Enrichment.md` — ceremony spec. Especially *§ v1 — trigger-fired supervisor* and the new *§ When approving — the placement protocol*.
2. `Enrichment/supervisor-prompt.md` — what the headless `claude -p` worker runs as.
3. `.claude/agents/card-validator.md` — the critic's instructions and three worked examples (pass / revise / kill).
4. `Enrichment/server.py` — server + worker management. Code comments on `_pid_is_our_worker` and `_fire_worker` explain the bug fixes.
5. `Enrichment/.worker.log` — recent run history. If something's wrong, look here first.
6. `Enrichment/supervisor-flow.svg` — architecture diagram. Note: this diagram shows the *v2 target* architecture (supervisor + image-maker + audio-maker + text-maker + critic). v1 is the trigger + critic + text-only subset.

(Reference, not load: `_ops/Substrate Skill.md`, `JEWEL.md`, `CLAUDE.md` — the supervisor itself loads these on each run; the incoming Claude likely already has them.)
