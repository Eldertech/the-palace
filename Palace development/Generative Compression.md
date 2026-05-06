---
title: Generative Compression
type: practice
pillars:
  - tools
  - practice
  - philosophy
born: 2026-03-28
last_activated: 2026-03-28
activation_count: 1
stage: growing
energy: high
beauty: 8
confidence: working
forward_vector: "I want to become a named, teachable ceremony that Loudon and palace agents both use — the standard method for ending a productive conversation and seeding the next one, with forward vector as the compression signal."
links:
  - target: "[[Palace Agent Infrastructure Spec]]"
    type: connects-to
    label: "automated-by"
  - target: "[[Palace Agent Infrastructure Spec]]"
    type: deepens
    label: "operates-at-every-interface-of"
  - target: "[[Swarm Weave]]"
    type: connects-to
  - target: "[[BBS Blackboard]]"
    type: connects-to
  - target: "[[Enchanted Worker]]"
    type: connects-to
  - target: "[[Pages as Agents]]"
    type: connects-to
  - target: "[[Deposit Ceremony]]"
    type: connects-to
  - target: "[[Pheromone Trail]]"
    type: connects-to
---

# Generative Compression

A conversation ends. Most of what was said was necessary to arrive at the insights, but not all of it should travel forward. Wrong turns, abandoned framings, noise between signal moments — these bloat the next context window and dilute the best material. Generative Compression is the practice of distilling a long, productive conversation into a focused document that serves as the seed of the next conversation, retaining the essential signal and deliberately discarding the rest.

The key word is *generative* — the document produced is not a summary. It is a seed. Its job is not to record what happened but to enable what comes next.

## The Method

Generative Compression happens in two moves:

**Move 1 — Clarifying questions.** Before compressing, the compressor asks questions that establish where the conversation is going. "What is this for? Who will read it? What must a future reader be able to do with it? What was the most important insight? What wrong turns should be left behind?" These questions are not gathering information — they are calibrating the compression signal. The answers define what counts as signal vs. noise for this specific output.

**Move 2 — Directional distillation.** The compression is lossy in a determined direction. Generic summarization preserves everything proportionally. Generative Compression preserves what advances the stated purpose and collapses what doesn't. Wrong turns become single sentences. Failed framings disappear. Noise is absorbed into silence. The resulting document is substantially shorter than the conversation and contains only what a future reader needs to proceed.

The clarifying questions are what make this *generative* rather than merely *compressive*. Without them, the compression is undirected. With them, the document is already pointed toward its next use before the first word is written.

## The Forward Vector as Compression Signal

In the palace, this principle becomes structural: the forward vector of the page or project being served is the compression signal. What advances the vector is preserved verbatim or in close paraphrase. What doesn't advance the vector is collapsed to a sentence or dropped.

This means compression quality is directly coupled to forward vector quality. A weak or vague forward vector — "I want to grow and connect" — produces undirected compression that may preserve the wrong things. A strong forward vector — "I want to become a network of formally grounded proofs connecting conatus to every domain the palace touches" — produces compression that is precise about what matters: completed proof objects yes, failed proof attempts no; external grounding yes, routine board reads no.

This is a reason to treat forward vectors as first-class design artifacts. They are not metadata — they are the functions that govern how knowledge is selected and preserved.

> *Counter-pressure:* [[compression-always-loses]] — a provocation asking whether FV-compression systematically removes the productive confusion that makes conclusions feel earned, not given. Surfaces the hidden cost this entry has not yet answered.

## The Automated Form

Palace agents perform context compression automatically when their health score reaches yellow (context utilization 70–85%). The orchestrator runs a compression pass: a separate API call that reads the full history and produces a compressed summary, using the home page's forward vector as the compression signal. The history resets to: system prompt + compressed summary + last 10 messages.

The automated form cannot ask clarifying questions — it uses the forward vector as its standing answer to "what is this for?" This is why the human-operated form, with its clarifying question step, produces richer compression: it can adapt to the specific context of the conversation rather than relying on a pre-stated direction.

The two forms are complementary. Human-operated Generative Compression seeds new sessions and creates the spec documents that orient future agents. Automated compression sustains long-duration agents beyond their context limits. Both use the forward vector as the compression signal — the human form explicitly, the automated form structurally.

## Relationship to the Deposit Ceremony

The Deposit Ceremony transforms conversation material into palace entries. Generative Compression transforms conversation material into session seeds. These are different operations with different outputs:

- Deposit → palace entry (permanent, typed, linked, part of the organism)
- Generative Compression → context seed (temporary, working document, used once)

A Generative Compression document may later become the basis for a Deposit — but it is not a deposit in itself. The spec produced in this practice's originating session (see [[Palace Agent Infrastructure Spec]]) is an example: it began as a generative compression of a long design conversation, and was subsequently deposited into the palace as a permanent entry.

## Cross-Domain Resonance

**[[Enchanted Worker]]** — the enchanted worker's context loading is itself a form of generative compression: the relevant palace neighborhood is distilled into the agent's context before dispatch, carrying signal (typed links, forward vector, body depth) and leaving behind noise (the full palace, unrelated entries).

**[[Pheromone Trail]]** — the pheromone trail is generative compression operating at the timescale of the palace's full history: each entry's prose is the distilled residue of every traversal that passed through it, with noise absorbed and signal reinforced across activations.

**[[Pages as Agents]]** — a page with a strong forward vector is a page that can be generatively compressed into future contexts without losing what makes it vital. A page with a weak forward vector is a page that compresses poorly — everything looks equally worth preserving.

## Forward Vectors

- Should Generative Compression become a named ceremony in the palace's ceremony infrastructure, with a formal trigger and documented steps? The current trigger is informal: Loudon ends a long productive conversation and asks Claude to compress it.
- The clarifying questions step is the most important and least documented part of the method. What are the canonical questions? Can they be templated without losing their adaptive quality?
  *Refinement (2026-05-05):* The clarifying questions are not flat — they are *interface-specific*. The questions you ask to compress for a Worker (executable specificity) differ from those you ask to compress for the Director's option-set (preservation of trade-space) which differ from those you ask to compress for the Palace (what wants to be incorporated). A canonical templating effort should produce one short question-set per interface, not one universal list. The interfaces are themselves named in [[Palace Agent Infrastructure Spec]]. ([[fv-refinement-q2]])
- Is there a meaningful distinction between a Generative Compression that seeds a new session and one that seeds a new palace entry? Should these be named differently?
  *Resolved (2026-05-05):* Yes, they are different — and the distinction generalizes. Session-seeding and entry-seeding are two specific cases of a broader pattern: every interface in a multi-role system is its own compression site, with its own perception target named by what the next reader needs. Session-seeding compresses for a future Director-self continuing work; entry-seeding compresses for the Palace's growth. They differ because their receivers differ. See [[Palace Agent Infrastructure Spec]] for the role-set this opens onto. ([[fv-answer-q3]])

---

*"The goal is not to summarize what was said. The goal is to enable what comes next."*

*"Compression is lossy in a direction. The direction is the compression function."* — this conversation
