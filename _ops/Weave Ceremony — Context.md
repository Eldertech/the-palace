---
title: "Weave Ceremony — Context"
type: practice
pillars: [practice, tools, philosophy]
born: 2026-03
last_activated: 2026-03
activation_count: 1
stage: growing
links:
  - target: "[[Weave Ceremony]]"
    type: emerged-from
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
  - target: "[[Palace Philosophies]]"
    type: connects-to
---

# Weave Ceremony — Context

The philosophy, metaphor, and open questions behind the [[Weave Ceremony]]. Read during Weaves when revisiting ceremony design, or when a new operator wants to understand why the Weave works the way it does — not during routine executions.

---

## The Blanket

A well-woven blanket is not a collection of threads — it is a structure that has emerged from their interaction. The individual threads do not change; the weaving reveals the pattern that was always possible in their combination.

The palace after a Weave is not a larger palace. It is a more coherent one. The same entries, held together more intentionally.

This is also why the Weave is not a search for new content. It is a search for existing pattern. The Weave reads nothing that wasn't already written. It adds nothing that wasn't already implied. It only names what had not yet been named.

## Founding Metaphors

The two images that shaped the ceremony's design:

**The elder weaving the blanket** — not creating new material, but working with what exists, finding the pattern across all threads simultaneously.

**The mycorrhizal network** — doing its distributed routing work: redistributing nutrients (connections) toward need, away from surplus.

Both metaphors carry the same implication: the Weave is not a growth ceremony. It is a coherence ceremony. Growth is the Deposit's job.

## Cadence Rationale

The Weave is monthly. More frequent and it becomes overhead. Less frequent and the palace begins to drift — orphan entries accumulate, stale metadata misleads, the topology report loses its ability to surprise.

## Swarm Architecture — Why It Was Adopted

The single-agent protocol was the original design. The palace crossed the single-agent threshold (~50 entries) during the spring 2026 growth period. The Swarm Weave was introduced to keep execution time reasonable and to model the ceremony's own metaphor: parallel workers doing distributed routing, a coordinator synthesizing the whole. Single-agent protocol remains valid for palaces under ~20 entries or when sub-agent orchestration is unavailable.

## Rate Limit Rationale — New Introductions

The 15-introduction cap is intentional and serves two purposes: it forces curation (a new introduction should feel earned, not automatic) and it keeps the palace's growth slow enough to remain deliberate. A typed link is a permanent claim about the structure of knowledge. The palace and its gardener both benefit from a slow metabolism.

## Scope — Unsung Paths vs. Harvest

Two behaviors look alike and must not be conflated inside the Weave worker. **Unsung paths** (in scope): entry titles the prose *already names* but the YAML hasn't registered — the connection is made, only the structural catch-up remains; formalize all of them (Step 3a). **Finding concepts that don't yet exist as entries but should** (out of scope): that is **harvest** — the work of an enchanted page looking at itself and wanting to thrive, deciding which concepts to pull into being. It belongs to [[Palace Enchantment]], where a page develops its own forward vectors and names what it wants to exist — not to the Weave worker, which never proposes new entry *creation*. If a Weave run surfaces such candidates, note them as out-of-scope and defer. (This is distinct from the 15-introduction cap above, which governs new typed *links* between entries that already exist, not new entries.) — Loudon's decision, 2026-04-08.

## Open Questions

- At what palace size should the Weave split into two passes — one for topology, one for link proposals?
- Should the Weave produce a persistent `Weave Report — [date].md` entry as a record of each Weave? This would make the palace's growth history traversable.
- Is there a minimum Weave that can be done in under 15 minutes for maintenance during an active work period, distinct from the full monthly Weave?
