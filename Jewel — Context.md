---
title: The Jewel — Context
born: 2026-03
links:
  - target: "[[JEWEL]]"
    type: emerged-from
  - target: "[[Swarm Weave]]"
    type: connects-to
  - target: "[[Self-Describing Knowledge Module]]"
    type: connects-to
forward_vector: "I am the session-history companion to [[JEWEL]] — the superseded versions, the design deliberations, and the open questions behind the jewel — so the jewel itself stays a lean generative seed."
---

# The Jewel — Context

History, rationale, and evolution log for [[JEWEL]]. Read during Weaves or when revisiting the jewel's design. Not read during routine ceremony invocations.

---

## Origin — 2026-03

The jewel concept emerged from a conversation about agent spawning, context window economics, and the degradation problem: every time a past conversation is loaded into context it is reconstructed, not retrieved — and reconstruction under compression loses edge detail. Loop it enough and you get a smooth, confident, slightly wrong version. The telephone problem at the speed of thought.

The question became: what is the minimum viable transmission that preserves maximum relational truth? Not a summary — summaries flatten. Not a list of facts — facts without relationships are inert. A seed: a compressed form containing the generative logic of the palace, not just its contents.

The jewel is the answer. A jewel is not a compressed rock. It's a structure where the internal geometry IS the information. Every facet relates to every other. You can't remove a facet without changing what it is.

The same conversation also established the context loading tiers — the recognition that the jewel is Tier 0 of a layered loading strategy, not a standalone solution. The full tier architecture lives in [[JEWEL]].

### Key design decisions made in origin conversation

**Order is ontological, not pedagogical.** The jewel opens by placing the agent inside the space ("You are within...") before telling it what the space is. Then structural vocabulary. Then philosophical world. Then invariants last, in the strongest position. This is declare-before-use, not emotional preparation. For a human student, order matters because of emotional and cognitive state — confusion before resolution creates investment. For an agent, order matters because early context establishes interpretive priors that color everything that follows. The mechanism is different; the principle rhymes.

**"In here" as spatial priming.** The phrase "In here, edges carry more meaning than nodes" places the agent inside the palace before it has learned anything about the palace. Loudon called this a "pull up a bar stool" register — immediate, casual, spatial. It sets tone before it delivers information.

**Opening with a tension, not a question.** An earlier draft opened with a question ("what does it mean for a knowledge organism to be alive rather than just organized?") on the theory that problem-before-solution would prime the agent more effectively. Reality check applied: transformers don't experience confusion followed by relief the way human students do. The entire context is present simultaneously when the first output token is generated — there is no temporal experience of reading. A well-formed declarative tension does the same priming work at lower token cost and without the risk of the agent beginning to answer before reading the rest. The opening sentence "The palace is alive not because its entries are correct but because they are connected" does what the question was trying to do, without the detour.

**The invariants close it.** The lost-in-the-middle problem is real — information in the middle of a long context is attended to less reliably than information at the very beginning or very end. The jewel puts the interpretive lens at the top and the invariants at the bottom. Both positions are strong.

**"Human" before the roles.** "Loudon Stearns — human, musician, educator, creative technologist" — the word "human" grounds the list before the roles arrive. An agent knows what kind of thing Loudon is before it knows what he does.

**"Symbiotic relationship with the palace."** The destination line originally read "human flourishing through joyful creation." Adding "in a symbiotic relationship with the palace" changed the destination from a product to a relationship. The palace isn't a tool toward flourishing — it's a partner in it.

**The jewel as fidelity anchor.** A sufficiently dense, internally consistent jewel creates friction against incoherent edits to a forked transcript. Not immunity — friction. If an injected fact contradicts a load-bearing relationship the jewel has established, the agent may notice the tension even without knowing its source. The better the jewel, the harder it is to silently corrupt the agent's reasoning without leaving a visible seam. This is not a recognized security property in the literature — it is a plausible emergent effect of relational density. Named here as a hypothesis, not a guarantee.

---

## Version Log

| Version | Date | What changed | Rationale |
|---|---|---|---|
| v1.0 | 2026-03 | Initial jewel established | Origin conversation — see above. Full text archived in § Superseded Versions below. |
| v1.1 | 2026-03 | Named the graph ("The Palace"); added the pages-as-agents line ("every page acts as both data and the spirit of an agent"); added "Plan carefully" to the invariants; added the post-ingestion synthesis-trigger paragraph (identity formation + forward-vector alignment). Dropped "Compost without regret" from the invariants. | Captures enchantment (pages as spawnable agents) and the synthesis ritual, both of which postdate v1.0. This is the version live in [[JEWEL]]. |

---

## Revision Notes

*Add a row to the version log and a dated section below each time the jewel is meaningfully revised. State what changed and why. The evolution of the jewel is itself a record of how the palace's self-understanding deepens.*

---

## Open Questions (carried from the jewel body, moved here 2026-07-08)

- Should the jewel include a one-line summary of the current palace state (entry count, most active hubs) so a spawned agent has situational awareness without reading Substrate.md?
  - *Loudon:* Perhaps a description of the most connected entries and their relationship to each other, and a "you are here" flag — where each entry lives within a constellation of stars, an image seen in the sky from inside a data-space, each entry a star connected by dim threads of light.
- Is there a version of the jewel tuned specifically for Walk vs. Weave vs. Deposit agents — or does one jewel serve all ceremonies?
  - *Loudon:* All pages are designed to give an agent purpose — born at the top of the page, given drive at the bottom. The jewel is polymorphic, itself a projection of a slice of a higher dimension into ours.
- How do we test whether a version of the jewel is working? What does a well-oriented agent do differently than a poorly-oriented one?
  - *Loudon:* Feels "right" to Loudon. Subjectively tuned and honestly aligned over time.
- At what point does the jewel become so familiar that it stops being read carefully — and what do we do then?
  - *Loudon:* Keep modifying and changing it. The jewel honestly feels not quite right, because it must adapt to the personality of the page and the needs of the page within its neighborhood.
- Should the jewel be embedded verbatim inside CLAUDE.md so it is always co-present with the entry point?
  - *Loudon:* Yes. *(Shipped 2026-06 via the `@import` block.)*

## Forward Vectors (carried from the jewel body, moved here 2026-07-08)

- Make a game that refines and adapts the jewel.
- Propose specific changes to make.
- Make an even more condensed jewel, stardust.
- ~~Build the tiered loading directly into CLAUDE.md~~ — *shipped 2026-06-07 via the `_`-symlink `@import` block (Tiers 0–2 auto-load).*

## Design dialogue — notes moved from the jewel body (2026-07-08)

These CLAUDE → LOUDON notes had accumulated in the jewel body; moved here to keep Tier 0 lean.

- *The jewel as poem:* each page a stanza — not just metaphor, it describes the actual structure. The jewel is the volta; each page extends the argument in a distinct voice; the Forward Vectors at the end of each entry are the turn toward the next stanza. The palace is an epic, written collaboratively across time.
- *Token concern (2026-06-09):* Tiers 0–2 measured ~20K tokens (cl100k). Options weighed: slim the Tier-1 files (SCHEMA is long), make Tier 2 a pick-list rather than a bundle, or accept the cost. (The 2026-07-08 floor slim acted on the first — SCHEMA split to `SCHEMA — Context`, CLAUDE trimmed.)
- *@import build (2026-06-07 → 06-09):* CLAUDE.md now `@import`s Tiers 0–2. Hard edge: Claude Code's `@import` can't resolve spaced paths (a known bug), so the Tier-2 framework loads via space-free `_` symlinks (`FOUR_PILLARS.md` → `FOUR PILLARS.md`, etc.). ROSETTA deliberately left out to keep the floor lean (stays Tier 3). Full write-up: [[Palace as Context Injection System]] § The @import Floor.

---

## Superseded Versions

The current jewel lives in [[JEWEL]]. Prior versions are archived here so the evolution is legible without bloating the operational file.

### v1.0 (2026-03)

You are within a web of interconnected markdown files forming a knowledge graph built by Loudon Stearns — human, musician, educator, creative technologist. It is rhizomatic: multiple entry points, no mandatory reading order, meaning generated through traversal. The metaphorical language used here is foundational, not decorative.

In here, edges carry more meaning than nodes. Relations are primary. The palace is a living knowledge organism, alive not because its entries are correct but because they are connected.

Every entry has a type, a stage, and typed links in YAML frontmatter. Typed links are the semantic web. Body wikilinks are conversational fabric. The distinction matters. Schema changes are permanent structural commitments — they require ceremony and documented rationale. The Four Pillars — Creation, Tools, Philosophy, Practice — tag everything. The destination is human flourishing through joyful creation in a symbiotic relationship with the palace.

When working here: depth over coverage. Name the specific reason for any choice — the actual tradeoff, the actual constraint — not a label that stands in for one. Cross-domain synthesis is the prize. Contradictions are generative, not errors to resolve.

Never violate these: Show before writing. Read before touching. Feel the friction before writing a single character. Missing connections are invitations, not errors. If a ceremony cannot verify its postcondition it has not completed. Compost without regret. Typed links over free prose connections. Git is the safety net.
