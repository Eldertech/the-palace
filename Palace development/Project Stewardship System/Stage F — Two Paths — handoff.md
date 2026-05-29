---
title: "Stage F — Two Paths — handoff"
born: 2026-05-29
last_updated: 2026-05-29
links:
  - target: "[[Project Stewardship System]]"
    type: connects-to
    label: stage-f-build-contract
  - target: "[[Stage E — Automated Trickster — handoff]]"
    type: connects-to
    label: extends-the-triage-layer
  - target: "[[Palace Agent Infrastructure Spec]]"
    type: connects-to
    label: wires-branch-exploration
  - target: "[[Palace Conatus]]"
    type: connects-to
    label: attention-is-the-bottleneck
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: branches-board
  - target: "[[Trickster]]"
    type: connects-to
    label: choose-from-finished-work
  - target: "[[BBS Rich Content — handoff]]"
    type: couples-with
    label: choice-interaction-type
forward_vector: "I carry the design of Two Paths — the decide-after-doing mode — across the conversation→build boundary: where a steward cannot choose or the choice is sensory, the palace runs both branches to a finished deliverable and lets Loudon pick from completed work rather than imagined options. I keep the human as the chooser while spending compute to save his attention."
session_thread: "Cowork/Claude-Code session 2026-05-29 — built Stage E (Automated Trickster), and on Loudon's first shadow review he proposed a new mode: present two completed paths instead of asking which work to do. This handoff is its first design pass."
---

# Handoff: Stage F — Two Paths (decide-after-doing)

This is a **fresh build handoff**, drafted right after Stage E shipped. It hands a
future Claude Code session a build contract for a new stewardship mode Loudon
proposed: instead of escalating *which* work to do, **run both branches to a
finished deliverable and present the completed paths for Loudon to choose
between.** Read it, confirm the move, run Phase 0, then take the open questions to
Loudon before building.

## Move

**Build Two Paths: for a fork the steward can't resolve alone or whose options
are sensory, the orchestrator forks the steward, runs both options to a real
deliverable in isolated worktrees, and presents Loudon two completed paths to
choose between — he judges finished artifacts, not prose.** The human stays the
chooser; the engine never auto-picks a winner.

## Why this move matters

Stage E fixed *triage* bandwidth (one ranked digest instead of seventeen pings).
But it left a residue: forks where the steward posted options and **no
recommendation** — it was genuinely torn — still escalate as a blind choice to
Loudon, and sensory forks escalate as *"which should I build?"* before either
thing exists. In both cases Loudon is asked to decide in the abstract.

Two Paths inverts that. [[Palace Conatus]]'s premise is that **Loudon's attention,
not compute, is the bottleneck.** On Path 2 (Claude Code subagents, no API key) a
branch is just another Agent-tool dispatch — cheap relative to his serial
deliberation. So spend the compute: build both, and turn the question from *"pick
a direction you can only imagine"* into *"pick the one that actually came out
better."* For sensory forks this is strictly better — it makes the audition
**comparative** (hear both, then choose) instead of speculative.

This is also the principled home for Stage E's hardest escalation category. Stage
E correctly refuses to auto-grant a fork the steward itself wouldn't commit to
(no recommendation → escalate) — because the engine choosing where the steward
hesitated is a real loosening. Two Paths dissolves that tension: don't make the
engine choose and don't make Loudon choose blind — **run both.**

## This is mostly latent in the spec already

Two Paths is **§10.2 Branch Exploration** crossed with **§4.5 Speculative
Execution**, finally given a purpose in the stewardship loop:

- **Checkpoints (§10.1)** — the branch point: fork a steward from a clean ancestor.
- **Branch workers (§10.2)** — "each a new temporary agent directory… no branch
  contaminates the others," reconciled by *convergence / contradiction /
  orthogonality.*
- **The `BRANCHES` board channel (§2.3)** already exists *specifically* for
  "branch exploration results for reconciliation." It has never been written to.
- **Git branch-and-merge** (§4.6, §5) — the winner merges; the loser is kept as a
  tension or discarded.

Stage F does not invent a substrate. It wires existing, unbuilt plumbing into the
steward → Trickster flow and emits its two finished paths to the rich-content
`choice` surface (built by the parallel v0.4 session) — it does **not** build its
own comparison view.

## What Stage F is (and is not)

**Is:** an orchestrator-side *production* layer that (1) reads the Stage E digest,
(2) selects forks eligible for two-paths, (3) forks the steward into two isolated
branch workers — one per option — each producing a real deliverable and a
`BRANCHES` post, (4) packages the two deliverables as a rich-content **`choice`
card** (two `options[]`, each with its `artifact_path`), (5) lets the existing
`ChoiceBlock` renderer present them for Loudon's pick, and (6) on the resulting
`choice_response` merges the winner, preserving the loser as an alternative/tension.
Steps 4–5 are the rich-content v0.4 `choice` primitive — Two Paths *produces* the
card; it does not build the surface.

**Is not:** an auto-decider (the human ALWAYS picks the winner — Two Paths never
resolves a fork itself), a replacement for Stage E's triage (it consumes Stage E's
digest), an always-on service, or something that runs on every fork (it is 2× the
work — gated, opt-in, budgeted).

## Decisions (made with Loudon this session — build to these)

| Decision | Choice | Reason |
|---|---|---|
| Trigger scope | **Two categories only: (a) the steward gave options but NO recommendation (genuinely torn), and (b) the fork is sensory (its paths produce a sensory deliverable).** | Loudon's call (2026-05-29). These are exactly Stage E's two "unsatisfying escalation" buckets — the rec=n defers and the audition escalations. Everything else stays single-path triage. |
| Number of paths | **Two.** Pick the two most distinct concrete options; exclude meta-options (`YOU-DEFINE`, `YOU-DECIDE`). | Loudon's framing. Keep it thin; 2 is the comparison a human can hold. |
| Who chooses | **Loudon always chooses the winner. Two Paths NEVER auto-picks.** | This is the audition gate's spirit extended: the human makes the sensory/directional call. The engine produces; it does not decide. |
| Isolation | **Git worktrees** (the Agent tool's `isolation: 'worktree'`; §10.2 "temporary agent directory"). | Branches must not contaminate each other or the working tree. Clean ancestor, independent divergence. |
| Losing branch | **Preserved as a tension/alternative** (§10.2 contradiction-as-finding), not silently discarded. | Sunk work becomes a recorded alternative the page can revisit; honors the palace's "contradictions are generative." |
| Reuse | **Stage E digest (candidate source) + orchestrator dispatch (Path 2 Agent tool) + the BBS write path + the STIGMERGY surface.** No new substrate. | Same one-boundary discipline as Stage E. The `BRANCHES` board finally gets its writer. |
| **Comparison surface = the rich-content `choice` interaction type** | **Do NOT build a bespoke side-by-side view. Two Paths EMITS a `choice` card (`payload.kind:"choice"`, `choice_mode:"pick"`, two `options[]` each with `artifact_path` = its branch deliverable + a caption) and CONSUMES the resulting `choice_response` REPLY (`payload.choice` = winning option id) to pick the branch to merge.** | The STIGMERGY v0.4 rich-content session is already building exactly this primitive (`src/lib/richcontent.js` `choiceFromPayload` + `buildChoiceResponse`, `components/ChoiceBlock.jsx`, wired in `MessageList.jsx`; `rich-content2.spec.js` proves a choice card renders options each carrying an inline audio artifact with a SEND-PICK action). Its demo case is a comparative audition — Two Paths' sensory case. Loudon's call (2026-05-29): Two Paths is a *producer* of `choice` cards; rich content owns their rendering + the pick. |
| Cost gate | **Opt-in + budgeted** (extend Stage E's daily budget with a two-paths run cap). Never fork an unbounded/expensive path. | 2× compute is real. Forking a multi-day path is wrong; bound each branch to one cycle / one deliverable. |

## Open questions (decide WITH Loudon before or during build — do not guess)

1. **Branch granularity / "what counts as a finished path."** For a sensory fork,
   both branches render the deliverable — clear. For a non-sensory rec=n fork
   (e.g. "what to open next cycle"), is a "finished path" one full steward cycle
   down each option? That could be large. Propose: time/token-box each branch to
   one cycle + one concrete artifact, and let the steward self-estimate cost so an
   expensive fork falls back to plain escalation. **Loudon decides the box.**
2. **Checkpoint vs fresh-directed cycle.** Do branches fork from a §10.1 checkpoint
   of the steward's history (unbuilt), or just run a normal cycle with a directive
   "take option X"? Thin path: the directed cycle. Checkpoints can come later.
3. **The comparison surface — now a DEPENDENCY, not a build.** Resolved to the
   rich-content `choice` type (see Decisions). What remains to confirm: (a) which
   board the `choice` card lands on — TRICKSTER (so it's a triage decision) or
   GENERAL (rendered card) — and whether/how it also surfaces in the Stage E
   digest; (b) `pick` vs `rank` mode (Two Paths is `pick`); (c) the v0.4 `choice`
   type must have *landed* on the branch before Stage F Phase 3 runs — it is
   in-progress (`ChoiceBlock.jsx` + `richcontent.js` exist, `rich-content2.spec.js`
   green) but not yet merged/shipped. Coordinate, don't fork your own renderer.
4. **Where the loser rests, and who triggers the merge.** Phase 4 nails the merge
   *trigger* (the `choice_response` → winner's worktree merges). Still open: does
   the losing branch live as an explicit alternative note on the page, or does its
   `BRANCHES` post simply stand as the record? And does a human run the merge step
   or does the orchestrator do it automatically on seeing the `choice_response`?
5. **Eligibility precision + the audition rule.** A sensory two-paths run produces
   two sensory deliverables and STILL escalates the choice to Loudon — consistent
   with the hard rule (never auto-resolve an audition). Confirm: Two Paths may
   *build* both sides of an audition but must *never* pick the winner. And confirm
   how it reads "sensory" — reuse Stage E's audition gate as the eligibility
   signal.

## Build contract (autonomous-build shape, à la BBS Production Plan / Stage E)

Sibling to the orchestrator and Stage E. Each phase self-verifiable; up to 10
attempts per failing check, then a `STOP-REPORT.md`. Write `STAGE-F-COMPLETE.md`
on success. Default to a **dry-run** (plan the branch dispatches; do not run
models or merge) until Loudon opts into live execution.

**Build order under the v0.4 dependency (the one thing the rich-content coupling
changes about *how* to build this).** Phases 0–2 — candidate selection, branch
dispatch, reconciliation — touch only Stage E + the orchestrator and are buildable
**now, autonomously**, regardless of rich content. Phases 3–4 — emit the `choice`
card, consume the `choice_response` — are **gated on the v0.4 `choice` type having
landed/merged** (it is in progress, not shipped). So this is NOT a single
cold-start autonomous build: do 0–2 now; pause before 3 until the `choice` type is
on the branch (or confirm with Loudon). A cold session cannot "coordinate" with a
parallel one — it can only check whether `choiceFromPayload`/`ChoiceBlock` are
present and stop if not.

- **Phase 0 — Candidate selection.** Extend the Stage E digest so each escalation
  carries a `two_paths_eligible` flag (rec=n OR sensory) and the two concrete
  options extracted (meta-options excluded). *Verify:* over the live board, the
  eligible set and the 2 options per eligible fork are identified correctly; unit
  tests cover rec=n, sensory, and not-eligible.
- **Phase 1 — Branch dispatch (dry-run first).** Given an eligible fork, construct
  two branch directives (option A / option B), two isolated worktrees, and the
  steward-cycle prompts that send the page down each path. *Verify:* dry-run
  prints the two dispatch plans + worktree paths; no models run, no writes.
- **Phase 2 — Reconciliation object.** Collect both branches' deliverables and
  `BRANCHES` posts into one deterministic reconciliation object (convergence /
  contradiction / orthogonality per §10.2). This object is the *input* the Phase 3
  `choice` card is built from — not a separate rendered surface. *Verify:* the
  reconciliation object is deterministic from a fixture of two branch results.
- **Phase 3 — Emit the `choice` card (reuse, don't build a surface).** Package the
  two finished branch deliverables as a rich-content `choice` card
  (`payload.kind:"choice"`, `choice_mode:"pick"`, `options:[{id, label,
  artifact_path, caption}, …]`) and post it via the existing validated append.
  Rendering + the SEND-PICK action are already owned by `ChoiceBlock.jsx`. *Verify:*
  the emitted card passes the strict §2.2 validator and `choiceFromPayload`
  normalizes it; in the app, the two paths render side-by-side with their artifacts
  (sensory case = a comparative audition); the app suite stays green (no regression
  to v0.3/v0.4 rich content, Stage E's `DigestPanel`, or the inbox).
- **Phase 4 — Consume the `choice_response`; merge the winner; preserve the loser.**
  Read the `choice_response` REPLY (`payload.choice` = winning option id, correlated
  by `re`), map the option id → branch worktree, merge the winner to the working
  branch, and save the loser as an alternative/tension on the page. The human's
  pick (via `buildChoiceResponse`) is the ONLY thing that triggers a merge — Two
  Paths never picks. *Verify:* round-trip on a throwaway repo/worktree — a
  `choice_response` selecting option A merges A's diff, preserves B's, leaves the
  tree clean.
- **Phase 5 — Cost gate + Stage E integration (confirm OQ1, OQ4).** Budget-gated,
  opt-in, wired to pick up Stage E digest candidates after a batch. *Verify:*
  dry-run invocation documented in the skill.

**Stop conditions:** any open question turning out to need Loudon; a fork whose
branches are unbounded/expensive (fall back to plain escalation, do not fork);
**any path where Two Paths would pick a winner itself** — that is a contract
violation, not a bug. The human always chooses.

## What Phase 0 must establish (ground truth, do not assume)

- That the Stage E digest can be read as the candidate source, and that the rec=n
  and sensory categories are cleanly separable from its existing fields
  (`auto_decisions` vs `ranked_escalations` + `gate_kind`/`rule_id`).
- The real shape of a steward's options for an eligible fork — which two are the
  concrete paths vs. meta-options to exclude.
- Whether the orchestrator's existing dispatch can be invoked with `isolation:
  'worktree'` cleanly on this machine, and how a branch worker returns its
  deliverable path for the comparison.

## Tried and rejected (negative space — don't re-explore)

- **Auto-picking the winner** (engine resolves the fork after running both):
  rejected on principle — the whole point is that the *human* chooses from
  finished work. Auto-pick would re-introduce the coupling break Stage E refused.
- **Three+ paths:** rejected — 2 is the comparison a human holds; more is cost
  without proportional signal.
- **Forking every escalation:** rejected — 2× compute is only worth it for the two
  trigger categories. Single-path triage (Stage E) remains the default.
- **A new write path / new board:** rejected — reuse the validated append and the
  existing (unused) `BRANCHES` channel.
- **Building checkpoints (§10.1) first:** deferred — the thin path is a directed
  fresh cycle per branch; checkpoints are a later enrichment.

## Load these files first

1. This handoff.
2. [[Stage E — Automated Trickster — handoff]] + `_ops/stigmergy/trickster-auto/`
   (the digest is the candidate source; the audition gate is the sensory signal).
3. [[Palace Agent Infrastructure Spec]] §4.5 (Speculative Execution), §10.1–10.2
   (Checkpoints + Branch Exploration), §2.3 (the `BRANCHES` board), §5 (Git).
4. [[Palace Conatus]] — the attention-is-the-bottleneck rationale.
5. `.claude/skills/palace-orchestrator/` (dispatch + `permanent.md`) — how a
   steward cycle is run; Two Paths runs two of them, isolated.
6. `_ops/swarm/persistent/blackboard.jsonl` — read the tail for real fork shapes.
7. **The rich-content `choice` type (the comparison surface — coordinate with it):**
   [[BBS Rich Content — handoff]], `_ops/stigmergy/app/src/lib/richcontent.js`
   (`choiceFromPayload`, `buildChoiceResponse`), `src/components/ChoiceBlock.jsx`,
   and `tests/e2e/rich-content2.spec.js`. This is the v0.4 STIGMERGY work in
   progress on the same `stigmergy-v0.3-rich-content` branch. Confirm it has landed
   before Phase 3.

## Receiving environment

- git commits clean Mac-side; if a worktree experiment wedges the index, `rm -f
  .git/HEAD.lock .git/index.lock` first.
- Two Paths extends both the orchestrator skill and the Stage E engine; STIGMERGY
  is the comparison surface (`cd _ops/stigmergy/app && npm run dev`).
- Tests: `npx vitest run` in the trickster-auto + app packages; keep Stage E green.

## See also

- [[Project Stewardship System]] — the umbrella; Stage F is a new mode past the
  original five stages.
- [[Stage E — Automated Trickster — handoff]] — the triage layer Stage F consumes.
- [[Palace Conatus]] — attention as the bottleneck; compute spent to save it.
