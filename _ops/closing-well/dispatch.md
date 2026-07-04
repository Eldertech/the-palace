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

## On assent — the executors

Run each `candidate` backstage row through its executor (see `executor.md` for the full
protocol + the two routing rules). In short:

- **deposit** → `PALACE_ROOT="<owner>" node _ops/stigmergy/app/scripts/palace-commit.mjs --kind deposit --scope <id> --paths … --summary …` (lands canon on the owner's `main`).
- **baton** → `node _ops/closing-well/baton-executor.mjs --entry … --move … --body-file … --wt-branch … --wt-dir … --session-id … --owner "<owner>" --write --post` (scaffolds the file + pointer, announces on the owner board), then run the plain `git commit` line it prints (a feature-branch baton is non-canon; the hook stamps `Palace-Kind: baton`).
- **artifact** → file in the entry's bundle + index line, then `palace-commit --kind ops`.
- **landed / provisional / none** → execute nothing.

Then run the end-to-end gate check in `executor.md` and report plainly what landed where.
