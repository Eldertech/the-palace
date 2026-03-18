---
title: "Palace Ceremonies"
type: hub
pillars: [practice, tools]
born: 2026-03
stage: growing
links:
  - target: "[[Substrate]]"
    type: deepens
  - target: "[[Substrate Skill]]"
    type: connects-to
  - target: "[[Harvest Ceremony]]"
    type: enables
  - target: "[[Deposit Ceremony]]"
    type: enables
  - target: "[[Walk Ceremony]]"
    type: enables
  - target: "[[Weave Ceremony]]"
    type: enables
  - target: "[[Spore Check Ceremony]]"
    type: enables
  - target: "[[Self-Model Update Ceremony]]"
    type: enables
  - target: "[[SCHEMA]]"
    type: connects-to
---
# Palace Ceremonies

The complete and canonical list of all palace ceremonies. Every ceremony has a trigger phrase — say it and the ceremony begins, no clarification needed. For operational details, follow the "Full Spec" link.

## Recurring Ceremonies

| Ceremony | Trigger | Cadence | What Happens | Full Spec |
|---|---|---|---|---|
| The Walk | "Let's walk" | Weekly | Pick a starting entry, follow typed links, note surprises, surface one unexpected connection | [[Walk Ceremony]] |
| The Weave | "Let's weave" | Monthly | Read ALL entries. Report topology: hubs, orphans, clusters, dormant. Propose new typed links. Process `_hibernation_queue/` first. | [[Weave Ceremony]] |
| The Spore Check | "Spore check" | Quarterly | Read all `stage: dormant` entries. Assign disposition: revive / hold / compost. | [[Spore Check Ceremony]] |
| The Self-Model Update | "Self-model update" | As needed | Revise [[Substrate]] — update the palace's self-description to reflect current state | [[Self-Model Update Ceremony]] |

## Harvest and Deposit Ceremonies

| Ceremony | Trigger | What Happens | Full Spec |
|---|---|---|---|
| The Harvest | "Let's harvest" | Triage raw source material (conversations, docs, files). Flag what's worthy for deposit. | [[Harvest Ceremony]] |
| The Deposit | "Let's deposit" | Read one flagged source deeply. Draft entries, propose links, write on approval. | [[Deposit Ceremony]] |
| The Hibernation | "Time to hibernate" | The closing act of a completed deposit. Write the closing note into the thread, update the harvest log, mark the conversation dormant. Begins the moment Loudon says "nothing left unsaid." | [[Hibernation Ceremony]] |

## Ad-Hoc Operations

Not full ceremonies, but palace-aware interactions that can happen in any conversation:

| Trigger | What Happens |
|---|---|
| "Add this to the palace" | Draft a new entry from the current conversation. Show for approval before writing. |
| "Connect this to the palace" | Propose typed links between the current topic and existing entries. |
| "What does the palace say about [topic]?" | Read relevant entries and synthesize. Follow typed links. |

---

## Ceremony Linter

Before any new ceremony is committed to this document or to [[Substrate Skill]], it must pass the Ceremony Linter. All six checks must pass. No partial passes.

| Check | Question |
|---|---|
| **Trigger** | Is there at least one exact phrase that invokes this ceremony without ambiguity? |
| **Preconditions** | Are the conditions that must be true *before* the ceremony begins stated explicitly? |
| **Protocol** | Are the steps numbered, ordered, and executable by a human with no AI? |
| **Postconditions** | Is there at least one checkable assertion that must be true when the ceremony ends? |
| **Failure Mode** | Is there a stated behavior for when the postcondition is not met? |
| **Git Commit** | Does the ceremony produce a named artifact or state change that belongs in version control? |

A ceremony that fails any check is revised before it is committed. A ceremony that passes all six is added to the tables above and to [[Substrate Skill]] in the same Schema Ceremony commit.

**The Linter passes its own test:**
Trigger: "lint this ceremony" / "does this ceremony pass?"
Precondition: A ceremony draft exists.
Protocol: Apply the six checks above in order.
Postcondition: Every check is marked pass or fail. No ceremony proceeds with a failing check.
Failure mode: Revise and re-lint. Do not commit a failing ceremony.
Git commit: The validated ceremony definition added to Palace Ceremonies and Substrate Skill. ✓
