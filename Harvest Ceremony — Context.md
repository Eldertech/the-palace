---
title: "Harvest Ceremony — Context"
type: practice
pillars: [practice, tools]
born: 2026-03
last_activated: 2026-03
activation_count: 1
stage: sprout
links:
  - target: "[[Harvest Ceremony]]"
    type: emerged-from
  - target: "[[Deposit Ceremony — Context]]"
    type: connects-to
  - target: "[[Harvest Frontier]]"
    type: connects-to
  - target: "[[Harvest Queue]]"
    type: connects-to
  - target: "[[Harvest Archive]]"
    type: connects-to
---

# Harvest Ceremony — Context

The rationale, design history, and architectural decisions behind the [[Harvest Ceremony]]. Read during Weaves, Schema Ceremonies, and when revisiting the ceremony's design — not during routine harvest sessions.

---

## The Log Split (2026-03)

The original Harvest Ceremony used a single file — `Harvest Log.md` — as the persistent state for all harvest activity: frontier tracking, triage decisions, deposit queue, session history, and prediction alignment. This worked well early on but created a structural problem as the palace matured: every ceremony that touched the log had to load the entire file, and the file grew with every session.

The problem became acute when the deposit workflow clarified. Deposits were happening primarily in original conversation threads — a Claude instance in that thread needs to do slow, deliberate work with a context budget reserved for the conversation itself, not palace plumbing. And the coordinator role (browsing pending items to propose candidates and hand over links) needed only a small, fast-access list, not the full decision history.

**The redesign split the log into three files with non-overlapping jobs:**

- **[[Harvest Frontier]]** — live state only. Where the harvest left off, session history, prediction alignment log. Read at the start of every harvest session. Small and stable.
- **[[Harvest Queue]]** — pending deposits only. The actionable list. Read by the deposit coordinator. Shrinks as deposits complete.
- **[[Harvest Archive]]** — the permanent record of all decisions ever made (skip, compost, done). Never read during ceremony. Grows indefinitely; consulted only for audit or calibration review.

This separation means the deposit coordinator reads one small file, the deposit thread reads nothing from the palace unless specifically asked, and the harvest session reads only the frontier state it needs to resume. No ceremony loads more than it requires.

## The Hibernation Absorption (2026-03)

The Hibernation Ceremony existed to solve one problem: the Harvest Log was too large to safely edit from inside a past conversation thread. The ceremony invented `_hibernation_queue/` as an intermediate step — write a small structured record in the deposit thread, process it later during a Weave or maintenance session.

Once the log split made [[Harvest Queue]] small and directly writable, the entire reason for the queue and the Hibernation Ceremony disappeared. The deposit thread can now write the queue update directly. The three-act Hibernation structure (Confirm, Closing Note, Queue Record) was absorbed into the [[Deposit Ceremony]] closing steps. The closing note ritual — writing a resting-place marker into the conversation thread — was retained as genuinely valuable independent of the infrastructure problem it originally served.

## The Memory Flag Fallback

A new failure mode emerged from the redesign: deposits occasionally begin in claude.ai threads without filesystem access — either by accident or because the conversation is happening in a context that doesn't support file writes. For these cases, the deposit thread writes a memory flag: `PALACE TASK PENDING: [ID] — [topic] — deposit complete but queue not updated. Process in Claude Code or Cowork.` Any subsequent session sees the flag and completes the queue update. This keeps the ceremony's closing obligation from depending on infrastructure that may not always be present.

## Design Principles for Future Changes

When evaluating future changes to the harvest/deposit architecture, these principles guided the 2026-03 redesign and should guide future ones:

- **Each file should have one job.** If a file is being read for two different purposes by two different ceremonies, consider splitting it.
- **Ceremony context budgets are real.** A deposit thread running in a rich conversation context cannot load large palace files without crowding out the conversation itself. Architectural choices that minimize what each ceremony must read are worth pursuing.
- **Workarounds name real problems.** The hibernation queue was a workaround. When a workaround accretes its own ceremony, that is a signal the underlying problem should be solved rather than managed.
- **The coordinator and the worker have different needs.** The role that browses and proposes (coordinator) needs fast access to a small actionable list. The role that does the deep work (deposit thread) needs minimal palace context. Conflating these needs into one file creates friction for both.

## Open Questions

- As the Harvest Queue empties over time, will it need a "someday/maybe" tier for items that are worthy but not yet ready to deposit (e.g. waiting for a related entry to be written first)?
- Should the Harvest Frontier track which Claude Projects have been harvested and when, as a parallel frontier for project-scoped material?
- At what point does the Harvest Archive warrant its own internal organization — by year, by pillar, by source type?
