---
title: "Closing Well — Context"
born: 2026-05-26
links:
  - target: "[[Closing Well]]"
    type: connects-to
    label: context-of
forward_vector: "I hold Closing Well's history and session log so the entry stays about the practice, not its past — accumulating origin, catches, and close-records across sessions."
---

# Closing Well — Context

History and session log for [[Closing Well]]. The entry itself stays about the
practice; its past and its accumulating close-records live here.

## Origin

Closing Well was deposited at the close of [[Kuramoto Coupling]]'s Round 1 — a long
session where Loudon caught five things Claude had declared complete: frozen phase
arrows; a silent title card that broke the accessibility rule; "keromoto"
pronunciation; a kerning gap in *arriving*; an outdated Stable Audio model. Each
catch revealed a practice that should have been there and wasn't. The three
sub-practices — the Closing Punchlist, Dual-Channel Comprehensibility, Verify To
Your Best Ability — are the codification of those catches.

The deeper observation Loudon named during that deposit: *every one of these
practices came from your correction, not my anticipation.* The asymmetry is the
seed. Closing Well is the practice that aims to flip it — to make the discipline
that catches errors live on Claude's side of the boundary before Loudon has to
perform it.

## Session log

- **2026-07-03 — the enchantment design.** A long conversation gamed out Closing
  Well as an enchantable *agent*, not only a discipline. The [[Baton Ceremony|baton]]
  and the [[Deposit Ceremony|deposit]] were recognized as two directions of one
  close, joined by indexed artifacts into a single **close map** — three species:
  memory (deposit), message (baton), evidence (artifact). The load-bearing frame:
  *the palace is a graph that lives in a repo* — a deposit writes into the graph, a
  baton into the repo but out of the graph, deleted on pickup. The channel question
  resolved to keeping the interview between Loudon and the working Claude while the
  Agent authors; the fresh-session and board fallbacks were deliberately left
  unbuilt — a bridge to cross if needed. Four explanatory diagrams were built inline
  (the atom, the baton, the steward, the scribe-sequence) and remain candidate
  bundle artifacts. Produced the "Closing Well, Enchanted" section on the entry and
  this Context split.
- **2026-07-03 — Phase 2 built, and the first real `close well`.** A session that
  began catching the Phase-2 baton surfaced a live gap in the handoff mechanism: a
  baton's *worktree coordinate* was dropped between the [[STIGMERGY]] board and the
  paste into a fresh session, so a catcher landed blind at the palace root. Fixed it
  (worktree threaded through the launch prompt; a **copy-prompt** button added to the
  handoff card) and merged to `main`. Then caught the baton and built **Phase 2**: the
  `close well` trigger and the [[Closing Well Ceremony]] card (recognition + dispatch),
  ratified as the **v1.15 Schema Ceremony** — the first ceremony added since the
  practice was born. This close is itself the first invocation of `close well`: the
  practice closing its own construction, run by hand because the enchanted mechanism
  (Phase 3+) is not built. Its honest map was "everything already landed mid-session;
  the only work owed was drift-cleanup" — modelling the *deposit: none* outcome the
  ceremony insists is first-class.
- **2026-07-03 — Phase 3 built: the arc reader.** A session that opened catching the
  Phase-2 baton found it stale (the branch had already merged to `main`), reported the
  staleness instead of executing, and on Loudon's word pivoted to Phase 3 in a fresh
  worktree (`feature/closing-well-phase3`). Built the Agent's first faculty in
  `_ops/closing-well/`: `transcript-reader.mjs` (resolve the current session's `.jsonl`
  + *mechanically* distill it into a readable arc — a projection, not a summary, so the
  cold read stays the Agent's job) and `prompts/closing-well-agent.md` (the enchantment
  → a structured arc analysis). The verify gate was **self-referential**: a cold Sonnet
  subagent, handed only the distilled transcript of *this very build session*,
  reconstructed its arc faithfully — the stale-baton pivot, the `git checkout` guardrail
  catch, the narrow scoping — and honestly flagged the transcript's own truncation as
  `(inferred)`, since the arc was distilled *before* the dispatch and so couldn't
  contain it. Two traps the build itself taught: (a) a running subagent writes its own
  top-level `.jsonl`, so "newest file" grabs it — fixed with an `origin.kind == 'human'`
  discriminator, and the reason the main loop resolves *before* dispatch; (b) thinking is
  redacted to an empty string in the persisted transcript, so `--thinking` is a no-op and
  the arc is reconstructed from text and actions alone. The seam to Phase 4 is already
  cut: the arc analysis ends in a "gaps a cold reader can't fill" list — that *is* the
  interview's question set.
