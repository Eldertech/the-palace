# Closing Well Agent — the thin dispatch (Phase 5)

The close runs two Agent passes and (on assent) the executors. The **thin waist**: only a
*pointer + slot values* cross the boundary into each subagent — the subagent reads its own
prompt template off disk. ~10 lines dispatched, not ~80 pasted. Proven cheaper and less
error-prone in the Phase-4 build; this is the standard form.

> Why thin: the prompt templates (`prompts/closing-well-agent.md`,
> `prompts/closing-well-agent-map.md`) are the single source of the Agent's instructions.
> Pasting them copies that source into the dispatch, where it silently goes stale when the
> template changes. A pointer never drifts. Fill only the `{{...}}` slots.

## Pass 1 — homework + coaching

Resolve + distill this session's transcript first (the main loop resolves, never the
subagent — see README § Why the main loop resolves):

```bash
node _ops/closing-well/transcript-reader.mjs --resolve
node _ops/closing-well/transcript-reader.mjs --distill --out <scratch>/session-arc.md
```

Then dispatch (Agent tool, **Sonnet**, one call). The whole task:

```
You are Closing Well, run as an agent — the moderator of this session's close.
Read _ops/closing-well/prompts/closing-well-agent.md and follow its "Task" section as
your instructions, with these slot values:
  {{CLOSING_WELL_PATH}} = <abs path to Closing Well.md>
  {{ARC_PATH}}          = <abs path to the distilled arc from above>
Return exactly the two parts it specifies (Part A homework, Part B coaching); nothing else.
```

Take Part B (the coaching) and moderate the panel with Loudon; keep Part A (the homework)
for pass 2.

## Pass 2 — reckoning + backstage checklist

After the panel, distil Loudon's judgment and the working Claude's witness to a few lines
each (or use the `UNFILLED` sentinel if no panel happened — never fabricate the human
channel). Dispatch (Agent tool, **Sonnet**, one call):

```
You are Closing Well, the moderator of this session's close.
Read _ops/closing-well/prompts/closing-well-agent-map.md and follow its "Task" section,
with these slot values:
  {{CLOSING_WELL_PATH}}   = <abs path to Closing Well.md>
  {{HOMEWORK}}            = <Part A from pass 1, verbatim>
  {{WORKING_CLAUDE_VIEW}} = <the working Claude's distilled in-room witness, or "UNAVAILABLE ...">
  {{HUMAN_READING}}       = <Loudon's distilled judgment, or "UNFILLED — no interview has happened">
Return the reckoning (front of house) then the backstage checklist; nothing else.
```

Show the **reckoning** to Loudon — the single gate. He assents or names revisions.

## On assent — Pass 3, the backstage execution (a subagent, not the main loop)

The mechanism is the moderator's alone — so execution is a **third dispatch**, not work the
spent working instance does. Dispatch the backstage moderator (Agent tool, **Sonnet**, one
call); it reads `executor.md`, places each assented `candidate` row through its ceremony, and
returns a placement report:

```
You are Closing Well, run as an agent — the moderator, backstage.
Read _ops/closing-well/prompts/closing-well-executor.md and follow its "Task" section.
Resolve its relative paths against <worktree-dir>. Slot values:
  {{EXECUTOR_PATH}}      = <worktree>/_ops/closing-well/executor.md
  {{BACKSTAGE_CHECKLIST}}= <the assented backstage checklist from pass 2, verbatim>
  {{OWNER}}              = <owner root>
  {{WORKTREE_DIR}}       = <this worktree>
  {{WORKTREE_BRANCH}}    = <branch>
  {{SESSION_ID}}         = <slug>
Return only the placement report; place what was assented, re-decide nothing.
```

The executors it runs (deposit → owner committer; baton → `baton-executor.mjs`; artifact →
bundle + index) and the two routing rules live in `executor.md`. `landed` / `provisional` /
`none` rows execute nothing. The working instance's whole job by now is to relay the report.
