# `_ops/closing-well/` — Closing Well Agent machinery

The operational machinery behind the [[Closing Well Ceremony]] — the `close well`
trigger's enchanted mechanism. The ceremony card *dispatches*; this directory holds
what it dispatches *with*. Build status is tracked in
[[Closing Well — production plan]]; the design is [[Closing Well]] § Closing Well,
Enchanted.

## What's built (Phase 3 — the arc reader)

Phase 3 gives the Closing Well Agent its first faculty: reading a spent session's
transcript, cold, and reconstructing its arc. The close map (Phase 4), the interview
loop (Phase 4), and the executors (Phase 5) are **not built yet** — this stops at a
faithful *arc analysis*.

| File | Role |
|---|---|
| `transcript-reader.mjs` | Resolves the current session's transcript on disk and distills it into a readable arc. Two verbs: `--resolve`, `--distill`. |
| `prompts/closing-well-agent.md` | The enchantment prompt — runs [[Closing Well]] as a fresh subagent that reads the arc and returns a structured analysis. |

## The dispatch (how `close well` runs today, Phase 3)

Run by the working Claude (the ceremony card points here). Four steps:

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
4. **Relay** the returned arc analysis to Loudon. In Phase 3 that *is* the output;
   from Phase 4 on, the analysis feeds the close-map draft and the interview.

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

## Not built yet (Phases 4–6)

- **Close map + interview** — the typed deposit/baton/artifact map, the one signature
  gate, and the "gaps a cold reader can't fill" → interview loop with the working
  Claude. Phase 3's arc analysis already emits the gaps list as the seed.
- **Executors** — deposit / baton / artifact-index / board-post / commit, each
  delegating to its existing ceremony, honoring canon-to-owner and baton-per-worktree.
- **Gotcha ledger wiring** — [[Closing Well — gotchas]] exists; the Agent appending
  to it per close is Phase 6.
