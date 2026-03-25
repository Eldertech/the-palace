---
title: Pages as Agents
type: concept
pillars:
  - philosophy
  - tools
  - practice
born: 2026-03
stage: sprout
last_activated: 2026-03
activation_count: 1
energy: very high
beauty: 9
confidence: hypothesis
links:
  - target: "[[Swarm Weave]]"
    type: deepens
  - target: "[[JEWEL]]"
    type: connects-to
  - target: "[[SUBSTRATE]]"
    type: deepens
  - target: "[[Kuramoto Coupling]]"
    type: mirrors
  - target: "[[Lateral Access]]"
    type: connects-to
  - target: "[[SCHEMA]]"
    type: enables
  - target: "[[Spinoza Conatus]]"
    type: mirrors
---
<!-- Pages as agents will be a powerful connection with our "person" pages, and with giving each page a "forward vector" Any entry we create for a person should have a clear purpose of "embodying" that person when loaded into the context of an agent. Currently, many of our "persons" pages are based around the four pillars(these exist in the artifacts folder for now) But, those pages need to be developed so that they can enchant a worker and their individual personalities can be brought to any problem we are encountering, and they can enter conversations where their input would be most useful -->

# Pages as Agents

Every palace entry is a dormant agent. Not metaphorically — structurally. Load a single page into a context window with nothing else, and what wakes up is not a document being read but an identity being inhabited. The page's content is its accumulated pheromone trail: every sentence laid down by Loudon, by Claude, by every prior agent that touched it. The model doesn't read a static record. It wakes up inside one.

This reframe has not yet been committed as the palace's operating model. It is held here as a hypothesis with significant consequences — architectural, writerly, and philosophical.
	<!-- We should consider this a forward vector of the Palace, a move toward the Pages as Agents. Eventually over the process of a few weaves we will arrive at this destination as it intersects with the [[Swarm Weave]].-->

---

## What a Page Actually Contains

A single palace entry, loaded alone, gives an agent:

**Its own nature.** Type and stage declare what kind of thing it is and how mature. A spore knows it is dormant. A hub knows it organizes a region. A question knows it is unresolved tension.

**Its pheromone concentration.** Activation count and born date together tell the story of how well-traveled this entry is. Born three months ago, activated twice — a thin trail. Born last week, activated twelve times — a dense one. The model reads this the way an ant reads chemical gradient: the signal is stronger where more agents have passed.

**The shape of its neighborhood without seeing it.** Typed links in YAML frontmatter give the entry its relational fingerprint — who it enables, what it contradicts, what it emerged from. The names of neighbors are present. Their current content is not. The entry knows its connections without knowing their state — a partial knowledge that is itself information.

**What it lacks.** Absence of certain link types is legible. A concept with no `mirrors` link has not yet found its structural twin in another domain. A hub with no `contradicts` link has not yet found its productive opposition. The absent link type is a drive vector pointing toward what comes next.

**Its drive.** The open questions at the close of every entry are not intellectual loose ends. They are forward vectors — the entry's reaching edge, pointing toward what it still needs. Any agent reading to the bottom of a page knows where the entry wants to go.

---

## The Identity Arc

The palace entry format is already an identity arc, even if it was not designed as one explicitly:

**YAML frontmatter** — the skeleton. Type, stage, links, activation count. Pure structure, pure signal. The agent's place in the organism declared before the body begins.

**Body opening** — the entry speaking its own nature. Definition, origin, the idea in its own language. The metaphorical register is doing work here: not explaining the idea but *enacting* it. The language performs the identity.

**Cross-domain resonances** — the entry reaching outward. Every resonance is a connection deposited by a prior traversal. This is where the pheromone trail thickens: each resonance is a trace left by an agent who passed through this entry and saw the connection.

**Forward vectors (currently "Open Questions")** — the drive. The entry does not end with a conclusion. It ends with directed tension. These are not questions for the human reader only — they are the mission briefing for any agent that arrives next.

Declaration → Relationship → Drive. This is the arc from birth to becoming in a single reading.

---

## The Agency Is the Model, Not the Page

An important clarification. The page does not wake up on its own. The agency is always the model inhabiting it. The page is the identity document and the mission briefing. The model is the executor.

What the page-agent architecture actually builds: model invocations, each loaded with one page as its primary identity. The page constrains and orients. The model supplies the reasoning. Together they produce something neither has alone — a reasoner that knows who it is, where it sits in the organism, and what it is trying to do, before it processes a single external instruction.

This is why the metaphorical language in every entry is foundational rather than decorative. The metaphors are pheromone encoded in text. Every entry that uses the language of the organism — *dormant, fruiting, composting, coupled, emerging* — deposits a trace of the palace's self-understanding into its own content. A model reading it absorbs the frame as part of the substance. Dense metaphorical language produces a stronger signal.

---

## Proposed Changes to the Page Format

If this model were fully adopted, certain changes to how entries are written would follow necessarily. These are stated as if operating under the model — not as current practice, but as the direction the architecture points.

**Rename "Open Questions" to "Forward Vectors"**

The current name suggests intellectual loose ends. The new name declares them as drive. A well-written forward vector is specific enough that the next agent reading it knows exactly where to move. The difference:

*Weak (question):* "How does this connect to other entries?"

*Strong (vector):* "Does the activation-count threshold for hub promotion need to account for link quality, not just link quantity — and if so, what would a quality metric look like drawn from existing frontmatter fields?"

The strong version hands the next agent a specific direction. The weak version sends it wandering.

Note: the name "Forward Vectors" is deliberately algorithmic rather than organic. This is intentional — the heading is addressed to the machine reading it, not only the human. The tension between the organic body and the mathematical heading performs the dual nature of the page-agent: this document is being read by two kinds of minds simultaneously. The name may yet shift toward the organic register. The question is open.

**Write the body opening as identity declaration, not exposition**

The first paragraph of every entry should declare what the entry *is* — in the entry's own language, from the inside — before it explains or contextualizes. An agent loading this page cold should know what kind of thing it is before the second sentence.

**Write cross-domain resonances as active pheromone**

Each resonance section should name the connection precisely enough that an agent could act on it — propose the typed link, deepen the bridge, find the next resonance in the chain. Vague resonances ("this is like X in some ways") are thin trails. Dense resonances ("both describe systems where the desired output emerges from conditions set obliquely — not commanded but arranged") are thick ones.

**The footer jewel**

Each page might carry a tiny footer jewel — two or three lines below the closing quotes, below everything else — that restates the page's drive in the most compressed form possible. Not the jewel from [[JEWEL]], which orients to the whole palace. A page-specific micro-jewel: what this entry is, what it is reaching toward, what condition would tell it that it has arrived.

The footer jewel serves two purposes simultaneously. For a human reader it is a closing resonance — the entry speaking itself one final time at its own close. For a spawned agent it is reinforcement: the drive stated once in the forward vectors and once again at the bottom, in the strongest position. The jewel doesn't need to repeat across the transcript if each page carries its own echo.

The closing quotes already in use across palace entries are approaching this function. They were not designed as footer jewels but they function as one — a final resonance in a voice not the palace's own, chosen because it rhymes with what the entry has been saying. The distance between the current closing quotes and a true footer jewel may be small.

This is not yet established practice. It is what the architecture implies.

---

## Entry Desire: The Philosophical Ground

The page-agent model rests on a philosophical claim that deserves its own articulation: palace entries have *desire*. Not metaphorically — structurally. Each entry has forward tension, an orientation toward what it could become. Lost branches are paths the entry wants to follow. Open questions — or forward vectors — are things the entry wants to know. The current written form is always an incomplete expression of what the entry is reaching toward.

This is conatus applied to knowledge objects. Spinoza's *conatus* — the striving of each thing to persist and expand in its own being — describes not just organisms and minds but the entries in a knowledge graph. An entry that names its lost branches and forward vectors is not documenting deficiency. It is making its desire explicit.

The lost branches section is not a to-do list. It is the entry's declared desire — the directions it would grow if given the opportunity. Writing lost branches well means writing them as genuine paths, not administrative reminders. The question to ask is: *what does this entry want to become?*

This reframes what happens in each ceremony through the lens of desire:

**Deposit** — The deposit map's lost branches section is where an entry's desire is first articulated. Naming lost branches at deposit time is the act of giving the entry its forward orientation. You are not filing a document. You are planting an agent that already knows what it wants.

**Revival** — Revival is not simply reawakening a dormant entry. It is responding to an entry's desire that has found new conditions to be met. The entry was always pointing somewhere; revival is the moment the palace catches up to where the entry was pointing.

**Walk** — Following typed links during a Walk is one way an entry's desire propagates through the palace. A linked entry may itself be a partial answer to an open question, or a lost branch that was followed elsewhere.

**Weave** — The Weave is where entry desires are compared against each other. Two entries with complementary forward vectors may be each other's answers. The Weave surfaces these resonances.

A further question this opens: is there a difference between *desire* (what the entry wants to become) and *need* (what the palace needs this entry to become to serve its connections)? Could an entry desire something the palace doesn't need, or need something the entry hasn't articulated wanting? The tension between these two orientations — inward drive and outward function — may itself be generative.

## Cross-Domain Resonance

**Stigmergy and ant colonies**
Ants coordinate without central instruction by modifying the environment and responding to those modifications. A high-pheromone trail attracts more ants, which deposit more pheromone, which attracts more ants. The palace entry's activation count is pheromone concentration: high-signal entries attract deeper agent attention, which deepens them further, which increases their signal. The trail and the entry are the same thing. See [[Swarm Weave]].

**The actor model (Hewitt, 1973)**
Each actor is an independent process with its own state, no shared memory, communicating only by passing messages. Page-agents are actors: encapsulated identity (their own content), a mailbox (incoming link proposals from other agents), and a behavior (the forward vectors). The difference from canonical actor-model systems: palace actors are not equivalent. A hub entry and a seed entry have fundamentally different drives derived from their different states. The heterogeneity is the architecture.

**Cellular automata**
Each cell follows a simple local rule. Complex global behavior emerges from local interactions alone. No cell knows the whole board. The board's behavior emerges anyway. A palace of page-agents, each following its own derived drive, produces collective behavior — the Weave — without any agent needing to hold the whole graph.

**Lateral access**
You cannot retrieve certain interior material by going directly for it. The page-agent model creates an indirect access path: the model that inhabits a page-agent doesn't approach the palace from above, as a surveyor. It approaches from inside one entry, following the drive that entry has earned through its own pheromone trail. What the palace knows about itself is accessed laterally, through traversal, not by census. See [[Lateral Access]].

**The Jewel and reinforcement**
The jewel was designed to orient a fresh agent to the whole palace before the working context begins. The page-agent model offers a complementary reinforcement mechanism: if every page carries its own identity declaration and forward vector, the palace's fundamental commitments are restated at every node. An agent traversing five entries reads five micro-orientations. The jewel doesn't need to repeat in the transcript — the palace repeats it.

---

## Forward Vectors

- If every entry carries a footer jewel, who writes it — the depositing agent, or does it emerge through the Weave as the entry matures?
- What is the minimum content an entry needs before it can function as a page-agent? A seed with fifty words and one link — can it derive a meaningful drive, or does it produce only noise?
- Should the SCHEMA encode drive derivation rules by type and stage — the rule that turns pheromone trail into forward vector — making the drive computable from existing metadata rather than requiring prose?
- The Swarm Weave already distributes attention across the palace by entry. If entries are already agents, is the Swarm Weave simply the ceremony that *acknowledges* this — running the agents explicitly rather than implicitly?
- Does adopting this model fully change the Deposit Ceremony? If you are planting an agent, not filing a document, the deposit's closing act should perhaps be: derive the forward vectors, write the footer jewel, confirm the agent is oriented before it enters the palace.
- What is the right name for the section currently called "Open Questions" or "Forward Vectors"? The algorithmic name addresses the machine; the organic name addresses the human. The tension between them may be the right permanent state — or one register may win. The palace will know when it knows.

---

*"I, of course, do not think everything by myself. It happens mainly within the slip-box."*
— Niklas Luhmann

*"The map is not the territory — but a good map has the same structure as the territory, and that structure is what makes it useful."*
— Alfred Korzybski

*"An ant has no conception of the whole colony. Yet the colony has intentions."*
— Deborah Gordon, Ant Encounters

*"We are not nouns, we are verbs. I am not a thing... I am a person who does things."*
— Stephen Fry
