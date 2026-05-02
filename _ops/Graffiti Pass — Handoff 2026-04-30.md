---
title: Graffiti Pass — Handoff 2026-04-30
type: meta
born: 2026-04-30
stage: sprout
links:
  - target: "[[Palace To-Do]]"
    type: connects-to
---

# Graffiti Pass — Handoff 2026-04-30

> **Purpose of this file:** a one-shot handoff so a fresh Claude can continue the Palace To-Do graffiti cleanup without re-deriving everything. Read this in full before resuming work.

---

## What's happening

Loudon and a previous Claude have been systematically working through the **Palace Graffiti To-Do** section in `_ops/Palace To-Do.md`. That section was created during the 2026-04-27 Swarm Weave to capture in-file `<!-- ... -->` comments that needed dedicated session work, not Weave-time fixes. There are two sub-sections:

- **From Loudon to Claude (live requests)** — 12 items
- **From Claude to Loudon (CLAUDE→LOUDON observations awaiting response)** — 5 items

This session worked the first sub-section. **6 of 12 are done. 6 remain.** The Claude→Loudon sub-section is untouched.

## How we've been working (the established pattern)

Loudon's preference, confirmed across six items: **dialogue-first, then execute.**

The recipe:

1. **Read the entry and surface the actual graffiti notes** — quote them in the conversation, add context Loudon may not remember.
2. **Propose 2–3 explicit options (A / B / C)** with stated tradeoffs, depth, and what each commits to. Give your read at the end (which one you'd recommend and why).
3. **Wait for Loudon to pick.** He almost always picks one of the options unmodified; occasionally he'll say "do the lightest version" or override.
4. **Execute the picked option as a sequence of focused edits.** Use `Edit` rather than rewriting whole files when possible. Update YAML links and activation count on the touched entries. Remove inline graffiti comments only after their content is folded into prose.
5. **Update the Palace To-Do** — change `[ ]` to `[x]` on the resolved item with a multi-sentence resolution note that any future audit can read for context.
6. **Brief Loudon on what landed** in 2–4 lines, then announce the next item with a short preview and ask if he wants the entry pulled up.

Tone-wise: Loudon writes architecturally, expects density without padding, and dislikes both over-summarization and reflexive flattery. He tends to give terse confirmations ("execute", "option B", "yes"). Match the register.

## What was completed this session (one-line each)

1. **[[Compressor Design]]** — All-Pass Filters and Inharmonicity section split: DSP mechanism moved to [[Harmonicity and Inharmonicity]] § All-Pass Networks as Inharmonic Resonators; kaleidoscope cascade moved to [[Hyperdimensional Prism]] § The All-Pass Origin (with "the interface IS the physics" punchline preserved).
2. **[[Mixture of Experts]]** — Restructured around three substrates: **Neural** (LLM MoE), **Curated** (the palace), **Embodied** (Excellent Adventure / Dialectic). 2024 procedural-experts insight promoted to "Substrate Indifference" claim. Reciprocal sections added to [[Excellent Adventure]] and [[Dialectic]].
3. **[[Pages as Agents]]** — New § The Person-Page Frontier synthesizes both graffiti notes into one arc: current state (person-pages in `Artifacts/`) → embodiment-grade design principles → four-step arrival path. Names [[Donella Meadows]] as the first deliberately-designed person-page.
4. **[[Palace Map]]** — Three substantial additions: § Format and the Reading Agent (edge-list for agent context, compact adjacency for human audit only — the choice is not neutral when the consumer is an LLM); § Links Before Objects: The Trickster Move (ghost nodes as desire-tracking, not bug-tracking); § The Paratrooper Provisioning (seven-item kit naming the **`pillars` field as the authorization layer** — the highest-leverage finding of the session).
5. **[[Palace as Context Injection System]]** — Minimal-touch coupling work: new sub-section "Person-Pages as Maximum-Strength Injection" closes the triangle [[Pages as Agents]] ↔ [[Palace as Context Injection System]] ↔ [[Mixture of Experts]]. All three now reach each other through any traversal direction.
6. **[[Piano String Inharmonicity]]** — Option A (link fix + pattern reference). The graffiti's structural question turned out to have been **already answered** by palace evolution since the comment was written 5 weeks ago: the **Action Potential Oscillator HTML pattern** has crystallized as the canonical convention, deployed across 6+ projects. Entry updated to point at the convention; actual JSX→HTML migration deferred as a Tools-and-Workflows todo.

## Architectural findings worth preserving

Three findings from this session deserve to survive into future work:

### The pillars field is the authorization layer (retroactive naming)

This is the highest-leverage finding. The `pillars` field in entry YAML has been working as a permissions / scope-of-action declaration since SCHEMA was written, but had not been named as such. **An agent inhabiting `pillars: [tools]` has tool-making freedom; `pillars: [philosophy]` has reasoning freedom; `pillars: [creation]` has the freedom to make.** Combined with `agency_profile` (added in SCHEMA v1.1), an agent now carries both *what kind of action it is allowed to take* (pillars) and *how it characteristically takes it* (agency_profile). This is named in [[Palace Map]] § The Paratrooper Provisioning. A future SCHEMA v1.2 documentation pass should make the pillars-as-authorization claim explicit in §3 of [[SCHEMA]].

### The triangle: Pages as Agents ↔ Palace as Context Injection System ↔ Mixture of Experts

These three entries describe one mechanism from three angles:

- **[[Pages as Agents]]** — the **page-side** view: every entry is a dormant agent waiting to wake.
- **[[Palace as Context Injection System]]** — the **context-side** view: loading a page is identity construction, not information transfer.
- **[[Mixture of Experts]]** — the **pattern-side** view: page-loading is one substrate of MoE routing; person-pages are embodied experts in a pool.

After this session all three are bidirectionally linked with substantive prose anchors — not just YAML links. Future graffiti and Weaves should treat them as a triangle rather than three separable concerns.

### The Action Potential Oscillator HTML pattern is canonical

For interactive technical artifacts, the convention is: **self-contained single-file HTML, no build step, runs offline, with the canonical CSS `:root` block + Source Serif 4 / JetBrains Mono / DM Sans font stack.** Reference: `Artifacts/Action Potential Oscillator/neuron_oscillator.html`. Documented most fully in [[Floquet Time-Modulated Loops]]. Deployed across 6+ projects. Older `.jsx` artifacts (e.g., the one in `Artifacts/Piano String Inharmonicity/`) are now legacy and need migration.

### Lower-priority but worth knowing

- **Trickster move (links before objects)** — Ghost nodes are not broken references but generative obligations. The trickster's structural role in the palace is to add links to nowhere. Persistent ghost nodes (3+ map cycles) are high-priority deposit candidates the palace has been requesting for months.
- **Format asymmetry** — Edge-list and compact-adjacency formats encode mathematically identical graphs but read differently to LLMs. Edge-list preserves [[Lateral Access]]; compact adjacency smuggles in a parent/child reading. Edge-list is canonical for agent context; compact adjacency is for human audit only.
- **Embodied MoE has cross-talk between experts** — the [[Dialectic]] does this natively; neural MoE does not yet have a strong analog. The embodied substrate may be ahead of the neural substrate on this frontier.

## What's next

The next graffiti item is **[[README - The Palace Guide]]** — four editorial notes from Loudon:

1. Add forward_vector framing as "the invocation of an agent at the bottom of every page"
2. Move from "open questions & budding branches" to "forward vector"
3. Add deposit ceremony as central to palace growth
4. Establish the philosophy section's importance and how philosophies should be used

This is a substantial item — it's editorial work on the palace's main guide, not just a single-paragraph touch. Likely wants a thorough read of the current README first, then options-style proposal.

## Remaining queue

**From Loudon to Claude (5 still open):**

- [[README - The Palace Guide]] *(next up)*
- [[Symbiotic Skills]] — needs full rewrite based on actual practices
- [[Substrate Skill]] — "Should this live in `_ops`?"
- [[The Fortress and the Threshold]] — needs an origin (Confucius/Epictetus dialectic; Zen-master angle)
- [[Wallpaper Groups]] — add Four Pillars reference
- [[Toolkit — Synthesizers]] — two clarifications (DSI Explorer Desktop vs. Evolver Desktop; Prophet model)

**From Claude to Loudon (5 untouched):**

- [[Wavetable Space as Torus]] — three sub-sections need claim-level verification
- [[Wavetable Synthesis -- Research & Higher-Dimensional Design]] — design principle to dwell on
- [[DSP Frameworks]] — plugin-as-teaching-artifact deserves an entry
- [[Enchanted Conversation Archive]] — link back through synthesis phase
- [[Palace AI Partnership Philosophy]] — needs a concrete contrastive example

The Loudon→Claude items are review/proposal-style. The Claude→Loudon items are different in shape — they ask Loudon to make a call rather than handing him drafted edits. Expect that sub-section to feel more like dialogue than execution.

## Deferred work that emerged during this session

These were spun out as new todo items rather than handled in-line:

- **Legacy artifact migration to AP Oscillator HTML pattern** (in Tools and Workflows to Build) — first migration target is [[Piano String Inharmonicity]]'s JSX. Includes deleting the duplicate `string_bending_inharmonicity 1.jsx` from Obsidian sync (requires explicit user permission).
- **Donella Meadows person-page** — the brief is now in [[Pages as Agents]] § The Person-Page Frontier. Will be the first deliberately-designed person-page when Loudon takes it on.
- **SCHEMA v1.2 documentation pass for pillars-as-authorization** — naming the structural commitment that's been there all along. No schema change required; documentation only.

## Resume protocol for the fresh Claude

1. Read this entire file.
2. Read `_ops/Palace To-Do.md` § Palace Graffiti To-Do — surfaced 2026-04-27 Swarm Weave (skim the completed items, focus on the 11 still-open ones).
3. Greet Loudon with a one-line acknowledgement that you're picking up the graffiti pass at item 7 ([[README - The Palace Guide]]) and ask if he wants the entry pulled up.
4. Hold the dialogue-first / options-style pattern. Don't propose more than three options per item. Be concise.
5. Match the established voice: dense, architecturally precise, no padding, no flattery, no emojis, no over-summarization.

---

*Generated 2026-04-30 at the close of session 6/12 of the graffiti pass.*
