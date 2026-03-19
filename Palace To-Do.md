---
title: "Palace To-Do"
type: meta
pillars: [practice, tools]
born: 2026-03
last_activated: 2026-03
activation_count: 4
stage: growing
links:
  - target: "[[Harvest Ceremony]]"
    type: enables
  - target: "[[Deposit Ceremony]]"
    type: enables
  - target: "[[Substrate]]"
    type: deepens
  - target: "[[README]]"
    type: connects-to
---

# Palace To-Do

A cache of meta-improvement ideas for the palace itself — things to do, things to build, things to reconsider. This is a planning surface, not an action log. Items here are captured but not yet acted on. The palace grows deliberately.

Organized into sections by type. Items move off this list when they become entries, get completed, or get composted.

---

## Token Economy — Pending Work

- [x] **Audit ceremony file sizes — all four ceremonies split** — [[Deposit Ceremony]], [[Harvest Ceremony]], [[Weave Ceremony]], [[Hibernation Ceremony]] each split into a lean operational card + `— Context.md` companion. Convention formalized in SCHEMA.md Section 6 and Substrate Skill: tone/communication style/shared goals stay in operational cards; rationale, history, open questions move to Context. All Context files carry full frontmatter and link back via `emerged-from`.
- [ ] **Harvest Log growth** — At 53KB, the Harvest Log is the largest content file in the palace. As deposit queues clear, old completed rows could be archived to a `Harvest Log — Archive.md` file, keeping the active log lean.

---

## Ceremonies to Run

- [x] **First Harvest session** — Complete. Batch 1 (H001–H019) logged 2026-03-17. Frontier at 2024-06-19.
- [ ] **Continue Harvest** — Resume from 2024-06-19, oldest-first. Frontier is set in [[Harvest Log]].
- [x] **First Weave** — Complete 2026-03-17. Palace at 24 entries. 8 new typed links added, stale metadata updated, Tao section added to Palace Philosophies, [[The Cooperation Path]] songline entry created.
- [ ] **Spore check on Short Story** — [[Short Story]] is dormant. Revival conditions: Loudon ready to return to fiction writing. Check whether current work has changed the conditions.

---

## Entries to Write

- [x] **MIDI Frequency-Time Duality** ⭐ — Entry written: [[Frequency-Time Duality]]. Deposited 2026-03-17 from H005.
- [ ] **Frequency-Time Explorer** (project) — The interactive app/website for the frequency-time duality concept. Vision: a single unified tool that is simultaneously a functional calculator (delay↔pitch↔BPM↔MIDI↔frequency↔subdivision conversions) and an experiential learning artifact. One continuous axis navigable in real time, showing pitch perception, flutter echo, slapback, rhythmic pulse, and sub-rhythmic pulse as you move. Modulation layer (chorus/flanger/phasing) as a second dimension. Beautiful enough to be an artifact in its own right. All related concepts — frequency, period, tempo, delay time, MIDI note, interval, rhythm subdivision — unified in one place. Design session needed before build. ⭐ *HIGH PRIORITY*
- [ ] **VERSION** — The dub delay for the meaning of words. Whisper + local LLM + TTS, trickster spirit archetypes, two-stage pool-then-select architecture. A Spirit Compendium and Technical Blueprint were produced in conversation. Flagged for deposit when the Harvest reaches that conversation.
- [ ] **RNBO Synthesizer Series** — The subtractive/FM/wavetable/granular plugin development arc. Key accumulated knowledge: `@param` syntax, unqualified math functions, MIDI handling outside codebox~, inlet visibility rules. Lives only in conversations currently.
- [ ] **Retrospective Delay** — The Max for Live circular buffer device with animated cat interface. A completed project with a clear philosophical frame ("retrospective" vs "prospective"). Palace-worthy as a breakthrough entry.
- [ ] **Semantic Web Paper (2014)** — The paper arguing links are ontologically prior to nodes. Now recognized as Deleuzian metaphysics in technical language. Should be its own entry with links to [[Substrate]], [[Hyperdimensional Prism]], and [[Spinoza Conatus]].
- [ ] **Tao** — Missing from [[Palace Philosophies]]. Wu wei, the water that wears stone. Has been present in the work but not formally named. Add a section to Palace Philosophies or its own entry.
- [ ] **SYNCHRONIZE** — The original dance/electronic track with cyberpunk aesthetic. A creation project worth tracking in the palace.
- [ ] **Loudon's Music-Making & Teaching Toolkit** — A dedicated session to map and document the full ecosystem of hardware and software tools Loudon uses for making music and teaching: DAWs, hardware synths/drum machines, Max/MSP, RNBO, Ableton, Python, visualization tools, and how they interrelate. The goal is a palace entry (or small cluster) that gives any Claude instance a clear picture of the instrument landscape without needing to piece it together from scattered conversations. Noted: multi-topic chats (like H028) cause triage drift precisely because context is implicit — this entry would make it explicit.
- [ ] **AI and the Future of Higher Education** ⭐ — Loudon has specific hopes, predictions, and a vision he wants to push for regarding how AI will transform higher education. This deserves a dedicated session to articulate fully — not a brainstorm but a manifesto-level crystallization. Could seed a palace entry, a public essay, or both. Trigger: any session where Loudon is ready to articulate this vision. The June 2024 Berklee chatbot brainstorm (H017) was the earliest proto-form of this thinking, composted because the vision wasn't yet named. This is the named version.

---

## Structural Improvements

- [x] **Phase 1 — Schema formalization** — Complete 2026-03-18. SCHEMA.md created (type system, link ontology, ceremony linter, schema change protocol). `practice` and `person` types ratified. CLAUDE.md versioned at v1.0. Rosetta Stone deposited. Commits: b420350 (pre-snapshot), d1f62f5 (v1.0), 3a4099a (v1.1 — Linter relocated to Palace Ceremonies).

- [x] **Phase 2 — Ceremony audit and formalization** — Complete 2026-03-18. All ceremonies pass the Ceremony Linter. Every ceremony has a dedicated entry with Ceremony Contract (trigger, access vectors, preconditions, postconditions, failure mode, git commit). Types corrected: Harvest/Deposit/Hibernation → `practice`. Git commit steps added to all ceremonies. Weave queue processing formalized as Step 0. Companion document template added to Deposit Ceremony. Walk, Weave, Spore Check, Self-Model Update given dedicated entries. Revival Ceremony created — closes the dormancy lifecycle loop. Rosetta Stone ceremony table updated with all 9 ceremonies. CLAUDE.md at v1.4. Commits: 70489de (v1.2), fa8fe91 (v1.3), 47ce436 (v1.4).

- [x] **Phase 3 — GitHub read path** — Complete 2026-03-18. Palace pushed to https://github.com/Eldertech/the-palace (public). Access path hierarchy documented in CLAUDE.md and Substrate Skill.md: filesystem (writes) → GitHub raw URLs (reads from any vector) → memory fallback. Substrate Skill updated to carry the raw URL explicitly so claude.ai can `web_fetch` CLAUDE.md without prior context. Walk tested successfully from a fresh claude.ai session. Walk Ceremony prose rewritten — numbered steps dissolved into flowing movement to match the songline metaphor. Commit: cae654f.

- [x] **Slim the Substrate Skill** — Complete 2026-03-17. Both the Substrate skill and Four Pillars skill now reduced to ~20-line pointers. Palace files (CLAUDE.md, Substrate Skill.md, Four Pillars.md, README) are the authoritative instruction set. Skill files contain trigger vocabulary, palace path, and a 3-sentence fallback for offline operation only.
- [x] **Deposit Ceremony — mid-discussion invocation** — New "Invocation Context" section added to Deposit Ceremony. Two paths named: external (coordinator sending Loudon to a past chat) and in-conversation (the standard case). Mode shift ritual added for in-conversation: "threshold crossing" before any procedural step. Steps 1, 2, 3, and 7 updated with branches for each case. Preconditions relaxed for spontaneous deposits.

- [ ] **Consider renaming "Deposit Ceremony" to "Plant Ceremony"** — The organic metaphor runs deep: harvest, compost, sprout, growing, fruiting, dormant. The deposit sessions consistently feel like planting seeds, not depositing objects. "Deposit" carries a banking connotation; "plant" fits the living organism frame. If renamed, update: Deposit Ceremony entry, Harvest Log references, Palace Ceremonies table, CLAUDE.md, Substrate Skill, README, all ceremony cross-references. This is a Schema Ceremony change — requires the linter. Do not rename casually; rename when it feels obviously right.

- [ ] **Reassess tone of all ceremonies** — The Walk Ceremony revealed that mechanical protocol language undermines organic ceremony. The Walk was rewritten in this session. The other ceremonies (Weave, Spore Check, Deposit, Hibernation, etc.) should be reviewed for the same pattern: where numbered steps are used, ask whether the ceremony's metaphorical frame calls for prose instead. This is not a Schema Ceremony — it is a practice revision. Suggested approach: read each ceremony aloud and notice where the language stops you. Do in a single dedicated session. Prerequisite: at least one full Weave cycle with the current ceremony set, so there is lived experience to draw on.

- [ ] **Add activation counts to more entries** — Several entries (Endosymbiosis, Palace Philosophies, Palace Quotes, Boundary-Crossing Instruments) are missing activation tracking. Standardize during next Weave.
- [ ] **Boundary-Crossing Instruments** — Currently underactivated (last activated Dec 2025). Check whether Deposit session has added new connections. The three-layer interface design should link forward to Symbiotic Skills.
- [ ] **Endosymbiosis** — Stage: seed, activation: 1. Body is thin. Consider whether a Deposit session would enrich it or whether it should stay as a thin pointer to the biological proof-of-concept for [[Cooperation Yields Agency]].
- [x] **GitHub as palace read target** — Superseded and completed by Phase 3 above.
- [ ] **Consider a Claude Project for the palace** — [[Substrate]] notes the threshold is ~25–40 entries. Currently at 19. Begin planning at 20, create at 25.

---

## Questions Being Carried

- When should the Harvest Ceremony expand beyond Claude chats to Google Drive? (Trigger: when chat harvest is complete, or earlier if specific documents are known to be palace-worthy.)
- Is there a minimum ceremony frequency that keeps the palace alive without feeling like maintenance? (Current hypothesis: Walk monthly, Weave quarterly, Harvest/Deposit in dedicated sessions as capacity allows.)
- Should [[Palace Philosophies]] have a section on Taoism? On indigenous knowledge traditions beyond Aboriginal Australian songlines?
- At what point does the palace warrant its own visual map? (Obsidian's graph view is available but not yet used as a ceremony tool.)

---

## Composting Candidates

Items that may no longer need action — held here before being fully released.

*(None yet.)*

---

## Recently Completed

- [x] **Harvest batch 1 logged** (H001–H019) — 2026-03-17
- [x] **Harvest Ceremony entry written** — 2026-03-17
- [x] **Deposit Ceremony entry written** — 2026-03-17
- [x] **Harvest Log initialized** — 2026-03-17
- [x] **Palace To-Do created** — 2026-03-17
