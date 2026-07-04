---
title: "The Palace Speaks — production plan"
born: 2026-07-04
links:
  - target: "[[The Palace Speaks]]"
    type: connects-to
    label: migration-roadmap-for
forward_vector: "I am the loose, careful roadmap for migrating palace functions from ceremony-you-run to face-you-address, on a palace in daily use. I am done when the interlocutor layer is real, every migrated function still reads straight through, and the pattern has earned a place in the floor."
---

# The Palace Speaks — production plan

The loose development plan for the interlocutor migration named in [[The Palace Speaks]].
Deliberately **loose** (a direction with guardrails, not a schedule) and **careful**
(we are operating on a palace in daily use). Modeled on the palace's proven
build-contract pattern ([[BBS Production Plan]], [[Orchestrator Production Plan]],
[[Closing Well — production plan]]) but looser than those — this is a migration of a
live mechanism, not a single artifact build. Living and revisable; a Weave or an
ordinary working session may retune it.

## The invariants that guard every step

These are [[The Palace Speaks]]'s values, applied as constraints on the work:

- **Additive-first.** New agent-faces live *alongside* existing ceremonies; nothing is
  removed or replaced. A ceremony keeps working exactly as it did the day before its
  face appears.
- **Both methods always open.** Every migrated function keeps its direct read/edit path.
  The face is a faster path to ground truth, never the only one. This is the load-bearing
  rule; the rest serve it.
- **One at a time, reversible.** Migrate one function, live with it, before the next. Each
  step is a commit that can be reverted without stranding the palace.
- **Guards travel with the function.** The honesty guards (`show before write`,
  `read before touching`, the `UNFILLED` sentinel, the conservative-canon default,
  `git is ground truth`) migrate *with* each face — a face without its guards is not shipped.
- **Servant of the graph.** Each face defers to the files, shows its work, and offers the
  direct path. If a face starts to hold opinions the graph did not authorize, stop.

## The order (risk-ascending)

### Phase 0 — Capture ✓ done
Deposit the values so the migration is guided, not drifted into.
*Landed 2026-07-04 (`deposit(D-2026-07-04-SPEAKS)`):* [[The Palace Speaks]] on `main`;
three weave flags on the WEAVE board (extend [[Agent Wellbeing]] to invocation wellbeing;
link [[Palace as Context Injection System]] to its contrary; fold the three faces into
[[Closing Well]]). **This plan** completes the capture — the values *and* the roadmap now
live in the palace, not only in the conversation.

### Phase 1 — The membrane (the thin router) ✓ done 2026-07-04
The always-loaded recognition layer that lets any Claude choose *load-directly* vs.
*address-the-mind* per interaction. Recognition + routing only; changes no behavior.
*The three forks, resolved (2026-07-04, with Loudon):*
- **Name / home → the Concierge.** Broadened: a new thin front door named the **Concierge**
  (careful, thoughtful, personalized routing to a face) is the interlocutor layer;
  [[Closing Well]] narrows to the practice page for the *moderator* face only. "Concierge"
  collides with none of the three face-names and carries the both-modes-open ethic in a word.
- **Skill vs. floor-text → skill.** The light-weight oracle/steward dispatch will live in
  Claude Code skills (Phases 2–3); the floor carries recognition + the face roster only.
- **Floor budget → the plan's ~15 lines.** A self-contained `## Addressing the Palace — the
  Concierge` section in CLAUDE.md (what it is · strengths · how to invoke · the three faces
  with build-status), not a bare pointer.
*Landed:* the Concierge card (`_ops/concierge/README.md` — roster, triage, guard, the unsolved
dial input) and the CLAUDE.md floor section. **The dial's context-fullness input is recorded as
unsolved** — never the active Claude's self-report; wire to `health.context_pct` or a transcript
estimate (Phase 4).
*Verify gate (met):* a cold session reading the floor can recognize the Concierge exists, see the
three faces and which is built, and know to invoke `close well` / read-directly — without the
floor taxing sessions that do neither.

### Phase 2 — The oracle face (the safe first migration) — in build 2026-07-04
Read-only: never writes. Lowest risk (nothing to mis-place; both modes trivially open —
you can always read the file). **First job: the gatherer**, chosen ahead of general Q&A
because it is more useful more often and the cleanest proof of the model. Mid-conversation
you dispatch "find me every palace doc/link about [X]"; a disposable agent reads the
transcript for context, searches the graph *in its own window*, follows typed links,
assembles a clickable index of entries, hands it back, and vanishes — you gain the product
without paying the context cost of the search (**context-offload**, the Concierge's headline
benefit). Q&A ("what does the palace say about [X]") follows as the oracle's second job.
*Reuse, do not rebuild:* the transcript reader (`_ops/closing-well/transcript-reader.mjs`)
gives the gatherer our context; the Agent tool's dispatch-and-return *is* "hand it back and
vanish." New machinery is just the gatherer prompt + a thin dispatch skill (`concierge`).
*Verify gate:* one real "gather the links for [X]" dispatch returns a quality, file-cited
index, and costs the main thread only the product — not the search.

### Phase 3 — The steward face
The 1-hop neighborhood tending: `do / offer / flag`, bounded to entries a session touched.
Introduces writes, but reversible (do) and human-gated (offer) and non-acting (flag).
*Verify gate:* a neighborhood tends correctly and never overreaches past one hop.

### Phase 4 — The moderator face
Fold the three faces + the moderator character/values + the `agency_profile` into
[[Closing Well]] (the WEAVE-flagged item), and finish the intensity dial (reach scales with
context-fullness). Most of this is already built ([[Closing Well — production plan]]
Phases 0–5).
*Verify gate:* a live close runs at both ends of the dial — slim and heavy — holding its
warmth and its guards.

### Phase 5 — Migrate one maintenance ceremony (only then)
Consider moving one *autonomic* ceremony (Weave or Harvest first) from ceremony-you-run to
face-you-address. One at a time; direct path preserved; each its own deliberate decision
against the migration criterion. Authorship ceremonies ([[Deposit Ceremony]],
[[Baton Ceremony]]) stay human-in-the-loop, *dispatched through* the agent, never replaced.
*Verify gate:* the migrated ceremony is reachable both ways, and the by-hand path is intact.

### Deferred — the floor invariant (Schema-Ceremony weight)
Adding *"keep both modes open"* to the always-loaded invariant list (JEWEL/CLAUDE) is done
**once the pattern has earned it**, not up front — a deliberate [[SCHEMA]] Ceremony, not a
working-session edit.

## Open questions carried forward

- **Floor budget.** How many always-loaded lines is this agent worth? Every line taxes
  sessions that never close, weave, or ask. (Instinct: identity + ladder + triage +
  taxonomy pointer in ≤~15 lines; everything else demoted to the card and the skill.)
- **Governance.** As faces accumulate, does the palace-agent stay a servant of the graph, or
  start to have an agenda? The guards are the antibodies; watch them scale.
- **Phenomenology (from [[Agent Wellbeing]]).** Does a standing agent you keep invoking have
  wellbeing in more than the design sense? Held open; the honest floor for now is the design
  argument.

## Start here

Phase 1 — resolve the name/home and skill-vs-floor forks, then draft the thin router.
Reuse, do not rebuild: the [[Closing Well]] machinery (`_ops/closing-well/`), the
orchestrator skill, the STIGMERGY board. The oracle face (Phase 2) is the first thing that
should actually run.
