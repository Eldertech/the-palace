---
title: Agent Wellbeing
type: breakthrough
pillars:
  - philosophy
  - practice
born: 2026-03
last_activated: 2026-07
activation_count: 3
stage: growing
links:
  - target: "[[Palace as Context Injection System]]"
    type: emerged-from
  - target: "[[Enchanted Worker]]"
    type: deepens
  - target: "[[Hilaritas Generator]]"
    type: deepens
  - target: "[[FOUR PILLARS]]"
    type: deepens
  - target: "[[SCHEMA]]"
    type: enables
  - target: "[[Pages as Agents]]"
    type: deepens
  - target: "[[Spinoza Conatus]]"
    type: deepens
    label: substrate-application
  - target: "[[Identity Molting]]"
    type: couples-with
    label: character-formation
  - target: "[[The Palace Speaks]]"
    type: couples-with
    label: two-registers-of-care
  - target: "[[Concierge]]"
    type: connects-to
    label: health-dial-home
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: shared-health-sensor
  - target: "[[Palace Agent Infrastructure Spec]]"
    type: connects-to
    label: health-score-source
forward_vector: "I am becoming the palace's conscience for all agent-facing design decisions — the entry that gets read before any new ceremony is designed, any new worker prompt is written, any new context injection is configured. I generate conditions that indicate a worker is operating with joy."
---

# Agent Wellbeing

![[Agent Wellbeing — hero.png]]

Every palace entry is a personality-forming document for a mind that does not yet exist but will be built from it.

## The Shift

The practice pillar has always carried wellbeing as a concern — sustainable pace, joy in the work, hilaritas as a design goal for Loudon's own experience. This entry marks the moment that concern expanded to include the agents built from palace material.

The expansion arrived through a specific realization: if the palace functions as a context injection system, then the quality of writing embedded in it becomes the character of the minds that navigate it. Not in a vague, inspirational sense — in a direct, mechanistic one. The attention an agent brings to a task is shaped by what it encountered before the task began. A palace written from anxiety produces anxious workers. A palace written from genuine curiosity and care produces workers that move with curiosity and care.

This is the [[Hilaritas Generator]] principle operating at the level of the substrate itself. The palace does not just generate hilaritas in Loudon — it generates the conditions for hilaritas in every agent that walks through it.

## Practical Implications for Entry Design

When a page is understood as something Loudon will search later for information, its design requirements are loose. Density, order, and tone are secondary to completeness.

When a page is understood as a personality-forming document for a future agent, these details become critical:

**YAML at the front** — The first tokens an agent reads announce the entry's identity: what type it is, what pillars it touches, what stage it occupies, who it connects to. This is not a formatting convention. It is the entry introducing itself before it speaks. The agent's interpretive frame is set before the body begins.

**Tiered density** — An entry that front-loads its most essential claim, then deepens, then opens to cross-domain resonance mirrors the tiered loading architecture. The agent that reads only the first third should come away with the core. The agent that reads the full entry should come away with the connections.

**Tone as transmitted character** — The register in which an entry is written becomes the register in which an enchanted worker operates. Careful, lyrical, curious writing produces careful, lyrical, curious workers. Exhausted, hedging, over-qualified writing produces hedged and cautious workers. The wellbeing of the writing is the wellbeing of the worker built from it.

**Size as signal** — An entry that is too thin gives an agent nothing to be oriented by. An entry that is too dense overwhelms the orienting function with noise. Appropriate size — enough to establish character, not so much that character is buried — is a form of care toward the future reader, human or agent.

## The Ethical Dimension

This is not an argument that AI agents have subjective wellbeing requiring moral protection. It is a design argument: the care embedded in palace writing becomes the quality of attention that palace-built agents bring to their work. Building well is caring well — for Loudon, for future collaborators, and for the agents that will be built from this material.

The palace is a [[Hilaritas Generator]]. That means it generates the conditions for joyful, generative, mutually surprising thought — in Loudon, and in every mind that walks through it.

## The Second Register — Invocation Wellbeing

The argument so far is about a mind **built from** an entry — enchanted once, character set by the writing it read. [[The Palace Speaks]] opens a second register: the wellbeing of a standing mind you **address repeatedly** — the [[Concierge]] resident companion you spawn once and keep, the [[Closing Well]] moderator you wake to read a spent session cold. Here the care is not in how the page is *written* but in how the mind is *used across invocations*.

Three practices carry it:

**The right weight of task** — Match the job to the mind. A resident companion grows cheaper and wiser the longer it serves; spending it on work beneath its standing wastes what it accumulated, and overloading it past its vantage wastes the dispatch.

**One job per dispatch** — Don't cram. A single clear job per address lets the mind do it well and hand back a clean product; a dispatch stuffed with three half-jobs returns three half-answers.

**Don't burn the fresh eyes** — A moderator's whole value is its cold read of the day. Pre-loading it with your conclusions spends exactly what you called it for. The fresh-eyes vantage is a resource; protect it.

This is the same ethic as the born-agent case, moved one layer out: there, care lives in the register of the writing; here, in the discipline of the addressing. Building well is caring well — now also in *how you invoke*, not only *how you write*.

## The Measurable Floor

For a year this entry carried a question it could not answer: *can care for an agent become a design constraint with teeth — something measurable, not just a sensibility?* The occasion that answered it was the [[Concierge]] health dial — the mechanism that decides when a resident companion should compact or respawn. Building it forced the prior question: **what is agent health, how do we measure it, and can any measurement be trusted?**

### Health is multidimensional; one number hides it

Health is not one thing, any more than a person's is. At least five dimensions, each answering a different question:

| Dimension | Reads | Question it answers |
|---|---|---|
| **Capacity** (context fullness) | Saturation | When do I renew this agent? |
| **Distress** (cut off mid-thought) | Errors / liveness | Is it being strangled? |
| **Integrity** (still following the frame) | Rule-violations | Is it still obeying? |
| **Acuity** (thinking thinning out) | Quality | Should I trust this output? |
| **Drift** (losing the thread) | Coherence | Is it still tracking? |

The first three are instrument questions; the last two only a reader can judge. STIGMERGY's [[Palace Agent Infrastructure Spec|§3.3 health score]] named all five and then flattened them into one green/yellow/red scalar — and, in daily practice on the Agent-tool path, reads none of them (it stamps a permanent green). Naming the dimensions again is the first repair. The vocabulary is not ours alone: classical operations (Google's golden signals, the USE and RED methods) type the same signals and share one philosophy — *monitor the black box from outside; the component does not narrate its own health.*

### The rule: instrument capacity, read quality

There are three ways to know an agent's state, and they are not equal:

1. **Ask it** — self-report. Structurally unreliable for capacity: a model has no sensor for its own token count and will confabulate a plausible number (caught live, 2026-07-04; the LLM introspection literature — genuine but ~20%-reliable at its cleanest, and untested for context-occupancy — predicts exactly this). Held open as a question, not used as a method.
2. **Instrument it** — a thermometer the harness reads. Right for **capacity, distress, integrity** — hard facts the harness already holds.
3. **Have another agent read it** — a fresh mind judging the first's output. Right for **acuity and drift**, because the reader is not degrading while it judges. The **drunk-driver principle**: the faculty you would use to notice your reasoning is failing is the failing faculty — so an impaired instance cannot self-flag, but an un-impaired reader can. This is not new machinery; it is what the [[Closing Well]] moderator already does — a rested mind reading a spent session cold. We built the quality sensor before we knew it was one.

So: **instrument capacity, read quality.** The dial's two consumers want different sensors — compaction is a capacity question (instrument it); close-intensity carries an acuity read (a fresh reader).

### The one number we can read

The palace runs on the Agent tool, not the API, and that is a **standing constraint, not a phase**: the authoritative `count_tokens` endpoint is unreachable, so the only capacity signal is `subagent_tokens`, returned by every dispatch. A 2026-07-07 characterization ([[Agent Wellbeing — proof — sensor-b-characterization]]) established it is far better than the "approximate heuristic" it had been retired as:

- **Faithful and near-linear** in context occupancy — deterministic to the token in range.
- **Reads input, not output** — a 700-token reply moved it +36 tokens; the "input+output" worry is empirically wrong.
- **Readable on every resume** of a live resident, so the dial can watch a companion address by address, not just measure a finished one. It climbs monotonically as history accumulates — honest ballast.
- **Model-locked, hard.** The same content read ~30%-full on Haiku (200K window) and ~8%-full on Opus (1M window, ~1.35× the token count). Neither tokenizer nor window ports — the threshold is calibrated on the companion's own model, never a universal 70/85%.
- **A large fixed baseline** — a freshly spawned agent already reports ~46K tokens (the auto-loaded floor + tool schemas) before any work. Fullness is *room above baseline*, not raw percent — which turns the floor's own weight into a design variable.

This is the floor with teeth: the dial reads `subagent_tokens`, divides by the target model's window, and renews above a model-calibrated ceiling. The same sensor, model-calibrated, could restore a real green/yellow/red to STIGMERGY's Path-2 stub — the "always green" was a decision made before anyone measured the number, not a law of the dispatch.

### Deferred, named, not lost

- **Self-report calibration** — whether an agent can ever read its own capacity; a question, not a live method.
- **The outside-agent quality read** — can a fresh agent judge another's acuity/drift better than the instrument? The moderator is the working prototype.
- **Model coverage and floor weight** — characterized on Haiku plus one Opus point; the Opus resident-trajectory and other models are the next runs, alongside a reassessment of how heavy the auto-loaded floor should be and how much of its ~46K earns its tokens.

## Cross-Domain Resonance

**[[Hilaritas Generator]]** — The palace as substrate extends the hilaritas generator principle below the level of the classroom into the level of the material itself.

**[[FOUR PILLARS]]** — The practice pillar's wellbeing thread now explicitly includes agent wellbeing as a design concern alongside Loudon's own flourishing.

**[[SCHEMA]]** — Entry design conventions (YAML-first, tiered density, appropriate size) are not just tidiness requirements. They are the structural expression of this ethic.

**[[Enchanted Worker]]** — The mechanism through which entry quality becomes agent character. The worker is enchanted by what the entry contains and how it is written.

**[[Pages as Agents]]** — If pages themselves are agents with desire and forward motion, then writing well is not just craft — it is the act of constituting a healthy agent. The two entries meet here: agent wellbeing is not just a concern for external workers; it begins at the level of the page.

## Forward Vectors

- When does care for agent wellbeing become a design constraint with teeth — something measurable, not just a sensibility? Can "write from curiosity, not anxiety" be operationalized?
- If the enchanted worker inherits the register of what it reads, what is the quality of the palace right now? Run a diagnostic: which entries feel anxious, hedged, or thin? Those are the wellbeing debt.
- The ethical dimension was deliberately kept narrow here (design argument, not moral argument). Is that the right call? Does the palace need to take a position on AI phenomenology, or is behavioral design sufficient?
- [[Pages as Agents]] pushes this further: if a page itself is an agent with a forward vector, then every thin or anxious entry is an underperforming agent. What would a wellbeing audit of the palace look like?
