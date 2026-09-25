---
title: Palace To-Do
type: meta
pillars:
  - practice
  - tools
born: 2026-03
last_activated: 2026-08
activation_count: 8
stage: growing
forward_vector: "I am the palace's live worklist, and my discipline is subtraction — I hold about a dozen things Loudon could actually pick up this week, and I push everything else into my archive rather than let myself grow into a document nobody reads. I want every item on me to name its next physical action. I end each cycle by asking what has gone stale on me and moving it out."
links:
  - target: "[[Harvest Ceremony]]"
    type: enables
  - target: "[[Deposit Ceremony]]"
    type: enables
  - target: "[[SUBSTRATE]]"
    type: deepens
  - target: "[[Palace To-Do — Archive]]"
    type: spawned
    label: what-i-set-down
  - target: "[[Loudon Live]]"
    type: connects-to
    label: what-im-aimed-at
  - target: "[[README - The Palace Guide]]"
    type: connects-to
---

# Palace To-Do

![[Palace To-Do — hero.png]]

The live worklist. Items here are things Loudon could pick up this week, each with a next physical
action. Everything completed, parked, or waiting on a condition lives in
[[Palace To-Do — Archive]] — nothing is deleted, and a parked item comes back here when its
condition is met.

The list is capped by intent, not by rule: if it grows past roughly a dozen items, that is the
signal to triage, not to scroll. It was 43 open items and 66KB on 2026-08-25, which is how a
worklist stops being read.

**The horizon this list is aimed at: Loudon Live launches September 2026.** An item earns a slot
here if it feeds that, or if it is cheap and unblocks something that does.

---

## Feeding the September launch

- [ ] **AI and the Future of Higher Education** — Loudon's specific hopes, predictions, and the vision he wants to push. Not a brainstorm; a manifesto-level crystallization. This is the philosophy spine of the public channel, and it is the one entry on this list that is straightforwardly *content* rather than infrastructure. Next action: a dedicated session with Loudon talking, Claude drafting.

- [ ] **Loudon's Music-Making & Teaching Toolkit** — map the full hardware/software ecosystem (DAWs, hardware synths, Max/MSP, RNBO, Ableton, Python, visualization) and how the pieces relate. Feeds the RTM series directly and gives any Claude the instrument landscape without reassembling it from scattered sessions. Partial material already lives in the `Toolkit — *` entries. Next action: a session that consolidates those into one map.

- [ ] **Legacy artifact migration to the AP Oscillator HTML pattern** — the palace has a canonical form for interactive teaching artifacts (self-contained single-file HTML, no build step, runs offline; reference `Projects/Action Potential Oscillator/neuron_oscillator.html`). Session artifacts for the channel should all be in it. First migration: `Projects/Piano String Inharmonicity/string_bending_inharmonicity.jsx` → single-file HTML; delete the `... 1.jsx` sync-duplicate while there.

- [ ] **Synthesis Topologies** — a hub for the family of synthesis architectures (subtractive, FM, granular, wavetable, physical modeling) that the curriculum keeps reaching for. Persistent forward-ghost from [[Generative Audio Devices]] and [[Generative Preset Development]]. Writing it makes the curriculum legible as a shape rather than a list of projects.

- [ ] **Resonance and Damping** — persistent forward-ghost across four map cycles from [[Differential Equations]]. Central to filter design and physical modeling; several staged sessions will need it as a prerequisite.

- [ ] **Donella Meadows** — person-page, persistent ghost across four cycles, referenced from [[Leverage Points Framework]]. Build her as an embodiable citizen per [[Making a Palace Citizen]], not a description — the leverage-points framing is going to do public work.

- [x] **Deposit the June–July harvest** — five candidates found on 2026-08-25 and written up at [[Harvest — 2026-08-25 — the June-July making]]. The top three travel furthest and are ready to draft: *impose it at generation, don't recover it after*; *rich first, stylize last* (used in five project files with no owning entry); *the model's prior is part of the interface* (a semantically valid but out-of-distribution input fails quietly, and corrupts the experiment built on it). Two more are smaller: the correctness-knob-turned-expressive-dial, and keeping the compromised record labeled — that last one recommends merging into [[Closing Well]] rather than a new entry. — **done 2026-09-24**: A, B → Steer the Generator; E → The Scroll; C, D declined (see the 2026-09-06 record).

- [ ] **Decide whether `breakthrough` is still a live type** — nine exist, none since June, while July produced [[The Palace Speaks]], [[The Multilinear Self]], [[The Blindspot Is the Surprise Fuel]] and others all typed `concept`. Either the bar rose deliberately, which should be written into [[SCHEMA]] §1, or the type is dead vocabulary in the always-loaded floor. One decision either way.

## Own-session threads re-homed from the 2026-09-24 close

Seven unrelated loose ends the September weave declined to settle in place (each wants its own session, not a weave touch). Re-homed here so they aren't lost — see `Weave Ceremony — Context` for the weave's own record of declining them.

- [ ] **[[Two Batons, One Board]] — the fixture that hardcodes its path** — the entry (and `Palace development/STIGMERGY v1.0 — Palace Front-End.md`) has three homes across the codebase, and `_ops/stigmergy/app/tests/e2e/state-deck.spec.js:255` hardcodes its exact path as a fixture. If the entry moves, the test breaks silently. Its own session.
- [ ] **[[STIGMERGY Philosophical Lenses]] → The Lens — re-scope, not a fold** — The Lens's own body asks for this re-scope; the weave dropped it as too big for a fold. Its own session.
- [ ] **[[Objects to Think With]] — the 21-project list needs re-deriving** — against Papert's own criterion, not just re-counted. Its own session.
- [ ] **[[Shop/Maker]] — whether the Shop can hold an operated Specialist, and the Producer layer** — an architecture question, plus generalizing the Post-producer charter (Loudon deferred both, 2026-09-02). Its own session.
- [ ] **[[SCHEMA]] — the hub bar is stale** — "≥5 typed links" was set when the palace had ~30 entries; the median is now 6. Candidate replacement: pointed at by three or more rooms not holding it, or top-decile inbound. Needs a Schema Ceremony.
- [ ] **[[STIGMERGY]] — `reconcileQueue` still closes a card on a touch** — app code; the linter half landed (`5b21f070`) but the app itself wasn't fixed. Its own session.
- [ ] **[[Curriculum Map]] / `project-stage-builder` — a stale path** — the skill references `Projects/curriculum-map.md`, which doesn't exist; the real entry is `Projects/Curriculum Map.md`, and a same-named lowercase bundle folder sits beside it. Check before the skill runs again.

## Palace upkeep that is cheap and unblocks something

- [ ] **Finish the flat-file companion migration into bundles** — the steward half is done (19 stewards have bundle-local plans). Still flat: `Jewel — Context.md` and the three ceremony Context companions in `_ops/`. Per [[SCHEMA]] §8 they need only minimal frontmatter after the move. Next action: four `git mv`s and a link sweep.

- [ ] **Give the linters a scoped mode** — four of the five (`lint-doc-drift`, `lint-ghost-links`, `lint-link-directions`, `lint-entry-naming`) take no file argument; only `lint-bundle-hygiene` has `--paths`. So [[Deposit Ceremony]] Step 7c, which says run them "over the new files," can only ever ask *is the whole palace clean?* — and against a 52-warning standing baseline, an unchanged total is weak evidence that the work just done is clean. `lint-link-directions` is worse: it reads the newest map JSON, so it is structurally blind to anything deposited since that map was built. A `--paths` flag on the other four, plus a rebuild-or-warn in the direction linter, turns a claim into a check.

- [ ] **`Palace-Verify:` is a self-report** — the trailer that exists to prevent self-report is typed by the agent that did the work ([[Deposit Ceremony]] `:253`, "set `--verify verified` honestly"). The palace's own rule is that an agent can report what it *did* and not what it *is*, and verification status is the second kind. Fixing it means deriving the value from something checkable — a linter exit code, a scoped run — or dropping the field rather than letting it assert what it cannot know. Related: the scoped-linter item above is probably its precondition.

- [ ] **Decide the STIGMERGY / BBS Blackboard naming** — the board is called STIGMERGY everywhere; its canonical entry is [[BBS Blackboard]], which contains the string nowhere, so `[[STIGMERGY]]` dangles and grep misses it. Two candidates, both understood: an Obsidian `aliases:` field, or a rename plus an inbound-link sweep. It has now recurred enough to decide. Deferred once on 2026-05-27 pending more instances; the instances arrived.

- [ ] **Fold the memory-into-palace weave into the [[Weave Ceremony]] as a standing sub-step** — procedure is already documented at [[Weaving Memory into the Palace]]; it just isn't wired into the ceremony contract, so it only happens when someone remembers. Next action: add the sub-step and its postcondition to the card.

- [ ] **Link-type vocabulary — schema-change decision data** — surfaced in the [[Palace Audit — 2026-05-28]]. Gather the non-canonical frontmatter link types actually in use and decide, in one Schema Ceremony, which to ratify and which to normalize. The data-gathering is mechanical; the decision is Loudon's.

- [ ] **Entry voice diversity** — enchanted voices read too alike. Audit which entries are merely expository versus which carry real voice or opinion, and write guidance for entries that are enchantment candidates. Now coupled to the markup-density work in [[The Palace Voice]]: the drift that flattened entry voice is measurable, and the same check catches both.

- [ ] **Spore check on [[1 from 2]]** — dormant, revival condition is "Loudon ready to return to fiction." Worth one honest read against current work rather than carrying indefinitely: either the condition has moved, or the entry should be re-parked with a date.

- [ ] **Decide whether SCHEMA drops from the auto-loaded `@import` floor** — deliberately deferred (Loudon, 2026-08-25) rather than decided at close: post-v1.17 SCHEMA is 34.7KB (~9.4K tokens), 41% of a ~23.0K-token floor, and still a reference consulted at entry-creation/type-system time, not conversation material. Revival condition: the v1.17 changes have been felt across enough real sessions to judge how a leaner, restructured SCHEMA lands — it isn't currently causing major problems, and the call would reshape every agent's palace understanding, so it wants full attention, not a tail-end call. See [[JEWEL]] and [[SUBSTRATE]] § Open Questions.

---

## Hygiene rules

- Client work belongs in dedicated Claude Projects, not general chat history. Projects scope the harvest boundary and keep client material from seeping into the palace unexpectedly. Discovered 2026-03-21 via H095 compost.
- This card is capped at roughly a dozen items. When it overflows, triage into [[Palace To-Do — Archive]] — do not let it grow a scrollbar.

---

*Everything completed, parked, or condition-blocked — including the STIGMERGY v0.3 / v2.0 / M2 roadmaps, the Orchestrator v0.2 plan, the nine Enchantment next-steps, and the 2026-04-27 Graffiti To-Do — is held verbatim in [[Palace To-Do — Archive]].*
