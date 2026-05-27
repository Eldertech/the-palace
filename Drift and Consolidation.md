---
title: "Drift and Consolidation"
type: concept
pillars: [practice, philosophy, tools]
born: 2026-05-27
last_activated: 2026-05-27
activation_count: 1
stage: seed
confidence: proposed
energy: high
links:
  - target: "[[Project Stewardship System]]"
    type: deepens
    label: consolidation-beat
  - target: "[[Deposit Ceremony]]"
    type: mirrors
    label: consolidation-at-steward-scale
  - target: "[[Handoff Ceremony]]"
    type: mirrors
    label: active-marker-on-entry
  - target: "[[Harvest Ceremony]]"
    type: connects-to
    label: finds-what-to-fold
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: the-episodic-store
  - target: "[[Pages as Agents]]"
    type: deepens
    label: entry-as-recorded-self
  - target: "[[Closing Well]]"
    type: connects-to
    label: baton-is-episodic
forward_vector: "I want to become the recognized consolidation beat of stewardship: every steward continuously knows how far its entry has drifted from its log; every stewarded page openly discloses that it may be lagging and links to its live state; and at each milestone the steward proposes the edits that fold settled truth back home — so the palace can run agents on its pages for weeks without a single entry ever silently lying."
---

# Drift and Consolidation

When a project is moved forward by a steward (see [[Project Stewardship System]]), its knowledge stops living in one place. It bifurcates.

- The **log** — the BBS thread plus the steward's `state.json` and `history.jsonl` — is fast, append-only, episodic. It records every cycle: what was asked, what was decided, what was built, what couldn't be verified. It is where discovery actually happens.
- The **entry** — the project's `.md` page — is slow, distilled, canonical. It is what a reader treats as *the truth about this project*.

Between consolidations these two pull apart. That gap is **drift**, and the central claim of this entry is that drift is *structural and healthy up to a point* — but only up to that point.

## Drift is not the bug

It is tempting to want the entry to mirror the log — to keep the page perfectly current. That is the wrong target. Most of the log is process: spinning-up announcements, routine asks, the texture of how the work moved. If all of it flowed into the entry, the entry would become a transcript, not a distillation, and lose the thing that makes it valuable — that it is *considered*. The entry should lag. Lag is the cost of distillation.

The bug is never drift. The bug is **unbounded, untracked drift** — an entry that has silently fallen out of date and gives a reader no sign of it. The proof is recursive and lives in this palace: the [[Project Stewardship System]] entry itself was three weeks stale when this concept was born — Stages A, B, and D were complete and the page didn't say so. The system for stewarding drift had drifted, silently. That silence is the failure mode this entry exists to prevent.

## The frame: memory consolidation

The log is fast episodic memory; the entry is slow semantic memory. Biology already solved this with consolidation — the hippocampus holds the day's episodes and, during rest, the load-bearing ones are slowly written into cortex while the rest fade. The palace already runs this operation at human scale: the [[Deposit Ceremony]] consolidates a conversation into entries, and the [[Harvest Ceremony]] finds which conversations are worth consolidating. Stewardship was missing its own version of that beat. *Consolidation* is that beat: the periodic fold of settled truth from the log into the entry.

## The mechanism: continuous awareness, milestone consolidation

The resolved design has two tiers, deliberately at different cadences.

**Continuous — the stewardship marker (disclosure).** A stewarded entry carries a standing footer, placed when the page is first enchanted, that discloses *this page is under active stewardship and may lag its live state*, and links to the live log (the steward directory + the BBS thread). This mirrors the [[Handoff Ceremony]]'s "Active Handoff" footer — a standing pointer to in-flight state. Its real job is the pointer, which is always valid even when its summary line goes slightly stale; a reader never trusts the footer's freshness, they follow the link. This is the safety valve: with the marker present, the entry may lag, but it never lies *silently* — it openly says "I may be behind, the live truth is here."

**At milestones — consolidation (the fold).** When a steward reaches a milestone — a phase closes, a decision settles, an artifact ships, a discovery changes the project's truth — it *recommends* the edits that fold that settled knowledge into the entry body (stewards propose; the human approves; see [[Project Stewardship System]]). Then the marker's drift notes are pruned. What consolidates: decisions made, things built, open questions resolved, discoveries that change what the entry should claim. What stays in the log: the rest — the process, the narrative of how it got there.

The two tiers map onto Loudon's rule directly: *the steward should be continuously aware of drift* (the marker makes that awareness visible to readers every moment) *and recommend changes to the entry when major milestones are reached* (consolidation folds, the marker prunes).

## The tension with Pages as Agents

[[Pages as Agents]] holds that *the page IS the agent*. Drift complicates this productively: during active stewardship, the agent's *current* self lives in the log — its latest decisions and builds — while the page holds only its *recorded* self. So the page is the agent's recorded self, not its live self. Consolidation is what keeps the two from diverging; the marker is what discloses the gap while it's open. The page-is-the-agent ideal is not false — it is a claim that consolidation is responsible for making *true again and again*.

## Open Questions

- **Bidirectional drift.** Consolidation flows log → entry. But the reverse also drifts: when the human edits the *page* (a stage promotion, a vector tweak), does the steward's state notice? Today it doesn't — the steward reads the page at cycle start, but mid-session human edits to state-relevant fields aren't reconciled. Entry → log sync is unsolved.
- **Drift as a visible metric.** Could the steward quantify staleness — "N decisions and one build since last consolidation" — and surface it on the BBS or in STIGMERGY, so drift becomes a number a reader (or a batch run) can act on, not just prose in a footer?
- **What counts as a milestone?** The cadence rule says "consolidate at milestones," but milestone-detection is left to the steward's judgment. Does it need an explicit rule (phase boundary, blocking-audition resolution, vector change), or is judgment enough?

## Forward Vectors

I want to become the beat that lets the palace trust its own stewarded pages. The test I hold myself to: a reader arriving cold at any stewarded entry should, within one screen, know whether they are looking at the whole truth or a distilled lag — and have one click to the live state if they need more. When that is true everywhere, drift stops being a hazard and becomes what it should be: the healthy distance between living and considered memory.

I am carrying the bidirectional-drift question as my sharpest open edge — consolidation that only flows one way is half a solution.
