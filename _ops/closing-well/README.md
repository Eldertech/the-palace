# `_ops/closing-well/` — Closing Well Agent machinery

The operational machinery behind the [[Closing Well Ceremony]] — the `close well`
trigger's enchanted mechanism. The ceremony card *dispatches*; this directory holds
what it dispatches *with*. Build status is tracked in
[[Closing Well — production plan]]; the design is [[Closing Well]] § Closing Well,
Enchanted.

## What's built (Phases 3–4 — the arc reader + the moderator model)

The Agent reads a spent session cold (Phase 3), then closes it as a **moderated panel**
(Phase 4). It does its homework on the arc, hands the active Claude stance and a few
wonderings, and — after the panel — drafts what the day amounted to in two layers: the
**reckoning** (front of house, the four gestures) and the **backstage checklist** (the
in-spec mechanism). The **executors** — turning an approved backstage row into an actual
deposit / baton / board post — are Phase 5, **built and live-gated 2026-07-04** (see
§ Phase 5 below).

**Who the moderator is.** Not a fresh subagent by default — the **resident [[Concierge]]
taking the wheel**, resumed across the close's turns ([[Closing Well]] § A close is a
moderated panel; `_ops/concierge/prompts/companion.md` § At a close). A fresh cold dispatch
is the fallback for when there is no resident. `dispatch.md` carries both paths and the
dial rule that picks between them; it is the runbook, and until 2026-08-26 it described
only the cold path.

| File | Role |
|---|---|
| `dispatch.md` | **The runbook** — the two paths (resume the resident / dispatch cold), which to use, and the thin-waist prompt for each pass. Start here. |
| `transcript-reader.mjs` | Resolves the current session's transcript on disk and distills it into a readable arc. Two verbs: `--resolve`, `--distill`. |
| `prompts/closing-well-agent.md` | **Pass 1** — the moderator's **homework + coaching**: reads the arc cold, returns Part A (the homework — its own read of the day) and Part B (the coaching — stance + two-or-three wonderings handed to the active Claude to moderate the panel with). Written to be run by either a resumed resident or a fresh subagent. |
| `close-map-format.md` | The backstage-checklist schema: the species, the load-bearing `status` column, `provisional`/`none` as first-class, and the template. (The front-of-house reckoning is prose, not a table.) |
| `prompts/closing-well-agent-map.md` | **Pass 2** — the **reckoning + backstage checklist**: takes the homework + the working Claude's witness + Loudon's drawn-out judgment (or the `UNFILLED` sentinel), and drafts the two layers. The moderator never answers for a panelist. |

## The dispatch

> **`dispatch.md` is the runbook — read that, not this section.** What follows is the
> long-form walkthrough of the *cold* path, kept because it explains the reasoning
> (why the main loop resolves, why distill instead of raw JSONL). `dispatch.md` is the
> thin-waist form of the same flow, and since 2026-08-26 it carries the part this
> section does not: **the moderator is normally the resident [[Concierge]] resumed, not
> a fresh subagent** — so the close has two paths, and the cold one below is the
> *fallback*. Choosing between them is a two-invocation dial read; `dispatch.md`
> § First: which moderator has the rule.

Run by the working Claude (the ceremony card points here). Two passes of the moderator
with the panel between them, then the backstage execution on assent.

### Pass 1 — the homework + coaching (read the session cold)

```bash
# 1. Resolve THIS session's transcript. Run from the main loop — its transcript is
#    newest at this moment. (A session's .jsonl lives where the session *process*
#    started — often the palace root even when work happens in a worktree — not
#    under the worktree's mangled project dir. --resolve handles that.)
node _ops/closing-well/transcript-reader.mjs --resolve

# 2. Distill it into a readable arc (mechanical projection, not a summary).
node _ops/closing-well/transcript-reader.mjs --distill --out <scratchpad>/session-arc.md
```

3. **Dispatch the Agent** (Agent tool, **Sonnet**, one call): paste
   `prompts/closing-well-agent.md`, filling `{{CLOSING_WELL_PATH}}` with the absolute
   path to `Closing Well.md` and `{{ARC_PATH}}` with the distilled arc from step 2.
   It returns **Part A** (its homework — its own cold read) and **Part B** (the coaching
   — the stance and the two-or-three wonderings for the panel).

### The panel (Phase 4) — stays in the room

You never speak to a subagent directly, so the panel stays between **Loudon and the
working Claude** — the parties who hold the channel and were in the room. The Agent (the
moderator) did its homework and handed you the coaching; the active Claude now moderates
a short reflective panel, drawing out Loudon's judgment and adding its own in-room
witness. The moderator never answers for a panelist.

4. Moderate the panel using Part B: put the wonderings to Loudon warmly, one at a time
   — not as multiple choice. Keep it light; the relay must stay a rounding error against
   the authoring it saves. This is the whole human cost of the close.
5. Gather two tacit halves the transcript can't show: **Loudon's drawn-out judgment**
   (the human panelist) and **the working Claude's own in-room witness** (what it knows
   that the transcript doesn't record). Distil each to a few lines — the Agent gets the
   distillation, not the dialogue.

> **Never answer for the human panelist.** If no live panel happens — an autonomous
> run, a background close, Loudon away — pass the sentinel `UNFILLED — no interview has
> happened`, **never** invented answers attributed to Loudon. A close with no human
> panelist produces a *provisional* reckoning (canon rows marked `provisional`, ended
> with the open wonderings instead of an assent line), which is honest and fine.
> Inventing his judgment is a forgery, not a draft — it is the confabulation-of-the-
> human-channel failure the autonomous Phase-4 run walked into, and this rule closes it.
> The gate needs his real assent regardless, so `UNFILLED` costs nothing and a
> fabrication buys nothing but risk.

### Pass 2 — the reckoning + backstage checklist (Phase 4)

6. **Dispatch the Agent again** (Agent tool, **Sonnet**, one call): paste
   `prompts/closing-well-agent-map.md`, filling `{{CLOSING_WELL_PATH}}`, `{{HOMEWORK}}`
   (Part A from pass 1), `{{WORKING_CLAUDE_VIEW}}` (the working Claude's distilled
   in-room witness), and `{{HUMAN_READING}}` (Loudon's distilled judgment **or** the
   `UNFILLED` sentinel — never fabricated). It returns **Part A — the reckoning** (front
   of house, the four gestures, prose) and **Part B — the backstage checklist** (the
   in-spec mechanism, a table with the `status` column); with the human reading
   `UNFILLED` the reckoning is *provisional* and ends on the open wonderings.
7. **Show the reckoning to Loudon — the single gate.** He assents, or names what to
   revise. On assent, each `candidate` backstage row executes through its own existing
   ceremony (by hand until Phase 5). `landed`, `provisional`, and `none` rows execute
   nothing (`provisional` waits on Loudon).

### Why the main loop resolves, not the subagent

When the main loop spawns the Agent, the subagent's turns are `isSidechain: true`
and may append to a fresh file. If the subagent ran `--resolve` itself it could grab
the wrong (its own) transcript. So the main loop resolves and passes the path
explicitly; the reader also skips sidechain-only files as a backstop.

### Why distill instead of feeding raw JSONL

A raw session transcript is large and mostly tool-output noise. Distillation is a
**mechanical projection** — text kept verbatim, tool calls collapsed to one-liners,
output truncated, thinking dropped by default. It strips noise; it never interprets.
(`--thinking` exists to keep a truncated form, but note: Claude's thinking is
usually **redacted to an empty string** in the persisted transcript — only a
signature survives — so the flag is a harmless no-op on most sessions. Thinking is
not reconstructable from the transcript; the cold read works from text and actions.) That line is load-bearing: the Agent
must reconstruct the arc itself, or the "cold, from the transcript alone" test is
meaningless. `--max-turns N` elides interior beats (keeping head and tail) for very
long sessions.

## transcript-reader.mjs — reference

```
--resolve                      print the current session's transcript path
--resolve --cwd <path>         restrict resolution to a session that started in <path>
--distill                      resolve + distill to stdout
--distill --file <path>        distill a specific transcript
--distill --session <id>       distill by session id
--distill --out <path>         write the arc to a file (prints the path)
--distill --thinking           include truncated thinking blocks
--distill --max-turns N        elide interior beats past N (keeps opening + close)
```

Exit codes: `0` ok · `1` usage / not-found · `2` parse failure.

## Phase 5 — built, and its live gate passed (2026-07-04)

- **Executors** (`executor.md` + `baton-executor.mjs`) — turning an assented `candidate`
  backstage row into an actual deposit commit / baton file + board announcement / artifact
  index, each delegating to its existing ceremony, honoring the two routing rules
  (canon → owner/main; baton → worktree + announced on the owner board). Deposit and
  artifact reuse the committer directly.
- **The baton executor's tests** — `tests/baton-executor.test.mjs` (`node --test
  _ops/closing-well/tests/baton-executor.test.mjs`). Until 2026-08-26 this README claimed
  the executor was "unit-tested end to end"; it was not — the only check had been a manual
  run at build time (`c4c2fdf`), and nothing in the repo referenced the script. That gap is
  why its hardcoded On-pickup checklist went stale for seven weeks. The tests now cover the
  seam that broke: a written baton carries the ONE canonical checklist
  (`_ops/Baton Ceremony/Baton Ceremony — on-pickup.md`) verbatim, that checklist still names
  both lifecycle beats, the pre-2026-07-07 delete-at-pickup text is gone, and a missing
  fragment makes the executor refuse rather than write a footerless baton. Paired with
  `_ops/swarm/lint-baton-footer.py`, which fails if a second copy of the text reappears
  anywhere or if a live baton drifts from it.
- **Backstage execution** (`prompts/closing-well-executor.md`) — execution is a *third
  dispatch*, a fresh backstage moderator that places the assented rows, so the spent working
  instance never runs the mechanism.
- **Thin dispatch** (`dispatch.md`) — the pasted prompts above replaced by ~10-line pointer
  prompts (the subagent reads its own template).
- **Live gate — passed.** The first live `close well` (this dir's own maker session,
  2026-07-04) ran the full flow end to end — homework → panel → reckoning → assent → the
  backstage moderator placing every row — and landed canon on `main` (`40c8dd9`) with nothing
  stranded. The Agent is built end to end (Phases 0–5).

## Not built yet (Phase 6)

- **Gotcha ledger wiring** — [[Closing Well — tuning]] exists and is hand-appended; the
  Agent appending to it *automatically* per close is Phase 6.
