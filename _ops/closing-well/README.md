# `_ops/closing-well/` — Closing Well Agent machinery

The operational machinery behind the [[Closing Well Ceremony]] — the `close well`
trigger's enchanted mechanism. The ceremony card *dispatches*; this directory holds
what it dispatches *with*. Build status is tracked in
[[Closing Well — production plan]]; the design is [[Closing Well]] § Closing Well,
Enchanted.

## What's built (Phases 3–4 — arc reader + close map)

The Agent now reads a spent session cold (Phase 3) and, after a short interview,
drafts the **close map** for Loudon's signature (Phase 4). The **executors** — turning
a signed row into an actual deposit / baton / board post — are Phase 5 and **not built
yet**; until then a signed map is executed by hand through the existing ceremonies.

| File | Role |
|---|---|
| `transcript-reader.mjs` | Resolves the current session's transcript on disk and distills it into a readable arc. Two verbs: `--resolve`, `--distill`. |
| `prompts/closing-well-agent.md` | **Pass 1** — the enchantment that runs [[Closing Well]] as a fresh subagent, reads the arc, returns a structured analysis ending in the "gaps a cold reader can't fill" list. |
| `close-map-format.md` | The typed close-map schema: three species, the `status` column, "deposit: none" as first-class, the template, and how the map renders as the single sign gate. |
| `prompts/closing-well-agent-map.md` | **Pass 2** — the enchantment that takes the arc analysis + the interview answers + the working Claude's view, triangulates them, and drafts the close map. |

## The dispatch (how `close well` runs today, Phases 3–4)

Run by the working Claude (the ceremony card points here). Two passes of the Agent
with a short interview between them.

### Pass 1 — read the session cold (Phase 3)

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
   It returns the arc analysis, ending in a **gaps** list.

### The interview (Phase 4) — stays in the room

You never speak to a subagent directly, so the interview stays between **Loudon and
the working Claude** — the parties who hold the channel and were in the room. The
Agent authored the gaps; the main loop asks them.

4. Put to Loudon **one framing question** — *what mattered most in this arc, what (if
   anything) is canon, what's the next move?* — plus the Agent's 2–4 specific gaps.
   Keep it to those; the relay must stay a rounding error against the authoring it
   saves. This is the whole human cost of the close.
5. Gather two tacit halves the transcript can't show: **Loudon's answers** (the human
   judgment) and **the working Claude's own in-room view** (what it knows that the
   transcript doesn't record). Distil each to a few lines — the Agent gets the
   distillation, not the dialogue.

### Pass 2 — draft the close map (Phase 4)

6. **Dispatch the Agent again** (Agent tool, **Sonnet**, one call): paste
   `prompts/closing-well-agent-map.md`, filling `{{CLOSING_WELL_PATH}}`,
   `{{CLOSE_MAP_FORMAT_PATH}}` (→ `close-map-format.md`), `{{ARC_ANALYSIS}}` (pass 1's
   output), `{{WORKING_CLAUDE_VIEW}}`, and `{{LOUDON_ANSWERS}}`. It **triangulates**
   the three readings and returns the filled close map + a short drafting note.
7. **Show the map to Loudon — the single gate.** He signs: `approve`, or `revise`
   naming the rows. On approve, each `candidate` row executes through its own existing
   ceremony (by hand until Phase 5). `landed` and `none` rows execute nothing.

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

- **Executors** — turning a signed `candidate` row into an actual deposit commit /
  baton file / artifact index / board post, each delegating to its existing ceremony,
  honoring canon-to-owner and baton-per-worktree. Until Phase 5, a signed map is
  executed **by hand** through the existing ceremonies, and the map says so.
- **Gotcha ledger wiring** — [[Closing Well — gotchas]] exists; the Agent appending
  to it per close is Phase 6.
