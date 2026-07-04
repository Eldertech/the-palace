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
deposit / baton / board post — are Phase 5 and **not built yet**; until then an approved
close is executed by hand through the existing ceremonies.

| File | Role |
|---|---|
| `transcript-reader.mjs` | Resolves the current session's transcript on disk and distills it into a readable arc. Two verbs: `--resolve`, `--distill`. |
| `prompts/closing-well-agent.md` | **Pass 1** — the moderator's **homework + coaching**: runs [[Closing Well]] as a fresh subagent, reads the arc cold, returns Part A (the homework — its own read of the day) and Part B (the coaching — stance + two-or-three wonderings handed to the active Claude to moderate the panel with). |
| `close-map-format.md` | The backstage-checklist schema: the species, the load-bearing `status` column, `provisional`/`none` as first-class, and the template. (The front-of-house reckoning is prose, not a table.) |
| `prompts/closing-well-agent-map.md` | **Pass 2** — the **reckoning + backstage checklist**: takes the homework + the working Claude's witness + Loudon's drawn-out judgment (or the `UNFILLED` sentinel), and drafts the two layers. The moderator never answers for a panelist. |

## The dispatch (how `close well` runs today, Phases 3–4)

Run by the working Claude (the ceremony card points here). Two passes of the Agent
with the panel between them. (Phase 5 replaces the pasted prompts below with a **thin
dispatch** — a pointer to each prompt file, not the pasted text — but the flow is the
same.)

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

## Not built yet (Phases 5–6)

- **Executors** — turning an assented `candidate` backstage row into an actual deposit
  commit / baton file + board announcement / artifact index, each delegating to its
  existing ceremony, honoring canon-to-owner and baton-per-worktree. Until Phase 5, an
  assented reckoning is executed **by hand** through the existing ceremonies, and the
  reckoning says so.
- **Thin dispatch wiring** — replacing the pasted prompts in the dispatch above with a
  pointer to each prompt file on disk (the thin waist: ~15 lines cross the boundary, the
  subagent reads its own template). Part of Phase 5.
- **Gotcha ledger wiring** — [[Closing Well — gotchas]] exists; the Agent appending
  to it per close is Phase 6.
