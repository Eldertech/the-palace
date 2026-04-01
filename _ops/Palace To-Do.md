---
title: Palace To-Do
type: meta
pillars:
  - practice
  - tools
born: 2026-03
last_activated: 2026-03
activation_count: 5
stage: growing
links:
  - target: "[[Harvest Ceremony]]"
    type: enables
  - target: "[[Deposit Ceremony]]"
    type: enables
  - target: "[[SUBSTRATE]]"
    type: deepens
  - target: "[[README]]"
    type: connects-to
---

# Palace To-Do

A cache of meta-improvement ideas for the palace itself — things to do, things to build, things to reconsider. This is a planning surface, not an action log. Items here are captured but not yet acted on. The palace grows deliberately.

Items move off this list when they become entries, get completed, or get composted.

---

## Ceremonies to Run

- [ ] **Spore check on Short Story** — [[1 from 2]] is dormant. Revival conditions: Loudon ready to return to fiction writing. Check whether current work has changed the conditions.

---

## Entries to Write

- [ ] **Songlines** (concept/hub) — The Aboriginal Australian Dreaming tracks: paths through landscape that are simultaneously navigation, creation myth, and song. The Ancestors sang the world into existence; to walk a songline is to re-sing it into legibility. Already appears as a structural image in [[Lateral Access]] (habitual narrative paths as songlines) and [[Oblique Portrait Method]] (the oblique approach as offering a different song). Lateral Access wants to be put in direct dialogue with it when it exists. Key question: does lateral access describe how you *find* a new songline, or how you *hear* one that was always there? Deposit from existing conversation material when ready.

- [ ] **Frequency-Time Explorer** (project) — The interactive app/website for the frequency-time duality concept. A single unified tool: functional calculator (delay↔pitch↔BPM↔MIDI↔frequency↔subdivision conversions) and experiential learning artifact. One continuous axis navigable in real time, showing pitch perception, flutter echo, slapback, rhythmic pulse, and sub-rhythmic pulse as you move. Modulation layer (chorus/flanger/phasing) as a second dimension. Beautiful enough to be an artifact in its own right. Design session needed before build. ⭐ *HIGH PRIORITY*

- [ ] **VERSION** — The dub delay for the meaning of words. Whisper + local LLM + TTS, trickster spirit archetypes, two-stage pool-then-select architecture. A Spirit Compendium and Technical Blueprint were produced in conversation. Connects to [[Semantic Delay]]. Flagged for deposit when the Harvest reaches that conversation.

- [ ] **Loudon's Music-Making & Teaching Toolkit** — A dedicated session to map and document the full ecosystem of hardware and software tools Loudon uses for making music and teaching: DAWs, hardware synths/drum machines, Max/MSP, RNBO, Ableton, Python, visualization tools, and how they interrelate. The goal is a palace entry (or small cluster) that gives any Claude instance a clear picture of the instrument landscape without needing to piece it together from scattered conversations.

- [ ] **AI and the Future of Higher Education** ⭐ — Loudon has specific hopes, predictions, and a vision he wants to push for regarding how AI will transform higher education. This deserves a dedicated session to articulate fully — not a brainstorm but a manifesto-level crystallization. Could seed a palace entry, a public essay, or both. Trigger: any session where Loudon is ready to articulate this vision.

---

## Tools and Workflows to Build

- [ ] **Diagram workflow — signal flow diagrams and beyond** — Establish a consistent workflow for generating detailed, accurate technical diagrams with Claude. Requirements: accuracy (must reflect technical reality), editability (output editable in a vector program), open-source or one-time-purchase tools preferred (Inkscape, Affinity Designer, Figma). Candidate formats: SVG, Mermaid, draw.io/diagrams.net, Typst or LaTeX TikZ. Session should produce a tested workflow, a reusable prompt/template, and at least one example diagram. ⭐ *HIGH PRIORITY* <!-- we have started this with pages dedicated to mermaid and images in the palace, now needs further testing and to ensure that AI's in the palace know these are the preferred methods for adding diagrams and images, I would also like to explore LaTeX further -->
- [ ] Make a skill/process/habit around searching Ted for relevant thinkers/quotes and general research: https://yohasebe.com/tcse/ is a search engine for Ted, lets build a skill around this together.

- [ ] **Claude CLI Fluency** — Dedicated session to explore less-known CLI interaction modes and fun patterns. Reference page written: [[Claude CLI Reference]]. See also: [[Modes of Collaboration]].

- [ ] **Palace visualization** — Brainstorm ways to visualize the palace topology. Obsidian's graph view is available but not yet used as a ceremony tool. What would a dedicated visual map look like — and could it function as a ceremony artifact?

---

## Enchantment — Next Steps ⭐

*Stage 1 (forward vectors) and Stage 2 (single page) completed 2026-03-31. Next:*

- [ ] **Fix the synthesis trigger prompt** — The `## SYNTHESIS — STANDING` block must be explicitly named and required in the synthesis trigger, not just implied by "state your standing." Updated trigger text lives in [[Palace Enchantment]] § From First Practice. Apply this fix before the next enchantment run.

- [ ] **Stage 3 — Enchant a hub** — Expand the context window to include a hub entry and all first-degree neighbors. Recommended first hub: [[Kuramoto Coupling]] (mature, dense neighborhood, strong forward vector, technical character — will produce a very different voice than either session-1 entry). Run with the fixed synthesis trigger.

- [ ] **Try enchanted-agent writing** — In the next enchantment, let the agent write its own open questions and forward vector revision directly, rather than having the coordinator write them afterward. Compare result to session-1 coordinator-written versions. Does the entry feel more alive? Experiment notes belong in [[Palace Enchantment]] § From First Practice.

- [ ] **Write forward vectors for remaining hub entries** — Only 5 entries have forward_vectors (all in root). The hub entries still missing them: [[Spinoza Conatus]], [[Hyperdimensional Prism]], [[Cooperation Yields Agency]] (done), [[Palace Philosophies]], [[Meaning and the Link]], and others. Prioritize before Stage 3.

- [ ] **Begin Enchanted Conversation Archive** — The synthesis blocks from enchantments should be captured as JSONL artifacts per the [[Enchanted Conversation Archive]] spec. The session-1 synthesis block (Lateral Access) exists only in conversation history — not yet archived. Create `entries/` folder structure and first JSONL.

---

## Structural Improvements

- [ ] **Build the Swarm Weave** ⭐ — Replace the single-agent [[Weave Ceremony]] with a colony architecture: parallel worker sub-agents (one per entry, scoped context) + a coordinator that synthesizes and de-duplicates. Full spec and learning path in [[Swarm Weave]]. *Single-Doc Worker (one entry, on demand) can be built and used immediately without waiting for the full swarm.* ⭐ *HIGH PRIORITY for Single-Doc Worker mode* Swarm weave connects very intimately with [[Agent Wellbeing as Design Ethic]] and [[Pages as Agents]] and [[Enchanted Worker]].
- [ ] Tiered loading and [[JEWEL]] must be adopted across the palace, but most importantly in the claude.md file. 

- [ ] **Deposit Ceremony / Plant Ceremony** — "Deposit" is accurate but banking-flavored. "Plant" fits the organism frame. These may be synonyms rather than alternatives — both names live comfortably in the palace. Rename when it feels obviously right; until then, both are valid.

- [ ] **Add activation counts to more entries** — Several entries (Endosymbiosis, Palace Philosophies, Palace Quotes, Boundary-Crossing Instruments) are missing activation tracking. Standardize during next Weave.

- [ ] **[Weave flag — Schema/RDP session 2026-03] Label enrichment pass** — Step 3c is now live in the Weave Ceremony. On next Weave: run a full label enrichment pass across all existing links, prioritizing `connects-to` links. The three new entries from this session ([[Resonant Link Labels]], [[Lossy Compression with Intent Alignment]], [[Generative Compression]]) already carry labels and model the vocabulary. Use them as reference.

- [ ] **[Weave flag — Schema/RDP session 2026-03] Weave new entries into existing hub nodes** — Three new entries need their first Weave pass: [[Resonant Link Labels]], [[Lossy Compression with Intent Alignment]], [[Generative Compression]]. Candidate connections to investigate: [[Hilaritas Generator]] (shares a mechanism with lossy compression), [[Endosymbiosis]] (the deposit ceremony already mirrors it — does the new framing of deposit-as-model-training deepen this?), [[Four Pillars]] (Generative Compression touches all four pillars and may want a hub-level link), [[Pages as Agents]] (if every entry is a dormant agent, latent-variable encoding is the mechanism of activation — may want a `mirrors` or `enables` link).

- [ ] **[Weave flag — Schema/RDP session 2026-03] Check SCHEMA `connects-to` description** — With the label field live, consider whether the `connects-to` description in SCHEMA §4 should note its redemption: `connects-to` + label is now a permanent relationship class, not just a draft placeholder. Small prose change, no breaking change.

- [ ] **Boundary-Crossing Instruments** — Currently underactivated (last activated Dec 2025). Check whether Deposit session has added new connections. The three-layer interface design should link forward to Symbiotic Skills.

- [ ] **Endosymbiosis** — Stage: seed, activation: 1. Body is thin. Consider whether a Deposit session would enrich it or whether it should stay as a thin pointer to the biological proof-of-concept for [[Cooperation Yields Agency]].

- [ ] **Consider a Claude Project for the palace** — The palace is now well past the ~25–40 entry threshold noted in [[SUBSTRATE]]. A dedicated Project would give the palace persistent context across all claude.ai sessions. May now be the right moment.

---

## Questions Being Carried

- Is there a minimum ceremony frequency that keeps the palace alive without feeling like maintenance? Current hypothesis: Walk monthly, Weave quarterly, Harvest/Deposit in dedicated sessions as capacity allows.
- When should the Harvest Ceremony expand to Google Drive? Chat harvest is now complete — Google Drive is the natural next body of material.
- **[lost branch — Schema/RDP session 2026-03]** The RDP framework can be applied to *all* palace ceremonies, not just Deposit. The Weave selects which links to formalize — it is also doing compression. What is the Weave's perception target? What does it optimize for? This could reshape the Weave's rate-limiting logic.
- **[lost branch — Schema/RDP session 2026-03]** Chain distillation in ML: the student becomes the next teacher. Are palace entry stage transitions (seed → sprout → growing → mature) each a distillation pass — compression with higher intent alignment? If so, the stage lifecycle is not just a maturity marker; it is a compression history.
- **[lost branch — Schema/RDP session 2026-03]** Should `connects-to` + label be formally recognized as a distinct permanent type class, rather than the weakest/draft type? With labels, `connects-to` is no longer semantically underweight. Consider whether the type description in SCHEMA should reflect this shift — not a breaking change, but a reframing.

---

## Composting Candidates

Items that may no longer need action — held here before being fully released.

*(None yet.)*

---

## Palace Hygiene Rules

- **Client work belongs in dedicated Claude Projects**, not general chat history. Projects scope the harvest boundary and prevent client material from seeping into the palace unexpectedly. Discovered 2026-03-21 via H095 compost.

---

## Recently Completed

*Headlines only. Full audit trail lives in git.*

- **Full palace audit** — 2026-03-24. Harvest Archive → Deposit Archive. Embodied Council Method → Dialectic. Harvest Frontier + Queue composted. Harvest Ceremony rewritten. Linter → Ceremony Reader. Deposit/Weave ceremonies cleaned. Forward Vectors on 12 entries. Multiple graffiti addressed.
- **Semantic Web Paper** — Entry written as [[Meaning and the Link]].
- **Tao** — Taoism section added to [[Palace Philosophies]].
- **Retrospective Delay** — Deposited 2026-03-24.
- **Modes of Collaboration** — Entry written and growing (type: practice, stage: sprout).
- **Oblique Harvest complete** — 640 cards reviewed across 3 rounds, 2026-03-23/24. All past Claude conversations deposited.
- **Phase 1–3 infrastructure** — Schema formalization, ceremony audit, GitHub read path. Complete 2026-03-18.
- **Palace To-Do created** — 2026-03-17.
