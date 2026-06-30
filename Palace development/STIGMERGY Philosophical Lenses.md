---
title: "STIGMERGY Philosophical Lenses"
type: project
pillars: [philosophy, tools, practice, creation]
status: proposed
born: 2026-05
stage: seed
confidence: proposed
energy: very high
who_leads: shared
links:
  - target: "[[STIGMERGY v1.0 — Palace Front-End]]"
    type: deepens
    label: a-philosophical-surface-for-the-front-end
  - target: "[[Palace Philosophies]]"
    type: connects-to
    label: the-neighborhood-this-surfaces
  - target: "[[Philosopher Visits the Entry]]"
    type: enables
    label: the-card-type-this-renders
  - target: "[[Dialectic]]"
    type: enables
    label: dialectic-as-a-swarm-mode
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: dialectic-board-and-lens-channel
  - target: "[[BBS Design System]]"
    type: connects-to
    label: locked-aesthetic
  - target: "[[Trickster]]"
    type: connects-to
    label: send-a-philosopher
  - target: "[[Mixture of Experts]]"
    type: mirrors
    label: embodied-experts-on-the-board
  - target: "[[Deleuze]]"
    type: connects-to
    label: queue-is-virtual-log-is-actual
  - target: "[[Merleau-Ponty]]"
    type: connects-to
    label: the-front-end-that-disappears
  - target: "[[Whitehead]]"
    type: connects-to
    label: commit-as-actual-occasion
  - target: "[[Stoicism]]"
    type: connects-to
    label: two-of-the-most-concrete-lenses
  - target: "[[The Dichotomy of Control]]"
    type: connects-to
    label: the-up-to-me-queue-filter
  - target: "[[The View From Above]]"
    type: connects-to
    label: the-altitude-navigation-mode
  - target: "[[Confucianism]]"
    type: connects-to
  - target: "[[Drift and Consolidation]]"
    type: connects-to
  - target: "[[Like Water]]"
    type: connects-to
  - target: "[[Spinoza Conatus]]"
    type: connects-to
  - target: "[[The Drift]]"
    type: connects-to
  - target: "[[The Fortress and the Threshold]]"
    type: connects-to
  - target: "[[spinoza-zhuangzi-on-striving]]"
    type: connects-to
forward_vector: "I want the palace's philosophy to stop being a neighborhood Loudon visits and become a lens he can switch on over everything else — a way to look at any entry, any swarm, any commit through Spinoza or Zhuangzi or Simondon and see what changes. I propose the surfaces that make philosophical thinking a live operation of the front-end rather than a set of pages, and the one new swarm mode that lets philosophers argue on the board in real time. My open edge: a lens must illuminate without distorting — it must never let the philosopher's vocabulary overwrite the entry's own."
---

# STIGMERGY Philosophical Lenses

![[STIGMERGY Philosophical Lenses — hero.png]]

> *A design proposal layered on [[STIGMERGY v1.0 — Palace Front-End]]. It changes nothing about the locked [[BBS Design System]] aesthetic and adds no new top-level deck; it proposes how the philosophy neighborhood lives **inside** the three decks (STATE / QUEUE / LOG), plus one genuinely new swarm mode. Written so a later Claude Code session can phase it onto the v1.0 build. Show-before-build: this is a contract to react to, not yet a thing to construct.*

## Thesis

The philosophy section is the palace's set of **lenses** — Spinoza, Deleuze, Confucius, Zhuangzi, Simondon, Whitehead, Merleau-Ponty are not topics, they are *ways of looking at everything else.* But in Obsidian (and in STIGMERGY-as-viewer) they are pages you navigate *to.* The move this proposal makes: a lens is something you switch **on over what you are already looking at.** Philosophy stops being a destination and becomes an operation of the front-end. STIGMERGY already organizes the palace by time; this lets you also look *through* it.

Three of the new philosopher pages already gave STIGMERGY its own metaphysics, and the design should make those readings literal:

- **[[Deleuze]]:** QUEUE is the **virtual** (open intentions, real-but-unactualized); LOG is the **actual** (the git record). A commit is an actualization event.
- **[[Whitehead]]:** each commit is an **actual occasion** — it prehends its parent, achieves a determinate diff, and perishes into the immutable past. "Nothing is real until recorded" is process metaphysics.
- **[[Merleau-Ponty]]:** the front-end succeeds when it **disappears** into Loudon's body schema. Every lens must add insight without adding operation-you-think-about.

## Inside the three decks

### STATE (present) — the entry, read philosophically

1. **The Visit renders inline.** The [[Philosopher Visits the Entry]] genre becomes a first-class **card type** in the entry view, rendered by the engine STATE already points at bundles (`ArtifactSlot` siblings). A `philosophical-lens` card sits in the entry beside the fireflies and the audio — the oscillator's Chalmers visit, Mathieu's Plato/Deleuze visit, rendered where they live.
2. **`contradicts` is a signal color, not a link in a list.** The typed-relation panel already planned for STATE gets one special treatment: a `contradicts` edge renders as a **two-tone split** (Blake's contraries), because the palace's productive contradictions are its highest-value philosophical surface. Opening [[Stoicism]] should *show* the live tension with [[Confucianism]], not bury it in a link list. The contradiction site [[The Fortress and the Threshold]] becomes a built view, not a page you reconstruct.
3. **"Send a philosopher" affordance.** On any entry, a command (`[V]ISIT`) posts a `RESOURCE_REQUEST` to the TRICKSTER board — *send a researched philosopher to this node.* The request carries the entry id and a suggested voice from the roster in [[Philosopher Visits the Entry]]. This turns the genre into a one-keystroke swarm action and is how a bare `philosophy` pillar tag gets its promise kept.

### QUEUE (future) — the live dialectics

QUEUE holds what wants attention. Philosophy's future-facing items are its **open contradictions and promised dialogues.** A new QUEUE lane, `DIALECTICS`, surfaces:
- the hub's open questions as a **standing roster of unresolved contradictions** (Spinoza-determinism vs. Machiavelli-virtù; Plato-Forms vs. Deleuze-difference; striving vs. drift), each a card that can be dispatched as a live Dialectic;
- promised-but-unwritten dialogues (the [[spinoza-zhuangzi-on-striving|Spinoza↔Zhuangzi]] re-run with Loudon steering; the Spinoza/Zhuangzi/[[Deleuze]] three-way);
- pending Visits requested from STATE, with the suggested voice and the entry awaiting them.

Because QUEUE is the virtual and items close only on git events ([[Two Batons, One Board]]), a dialectic card is *open* until its archived artifact and its typed links are committed. The board cannot claim a dialogue happened until the LOG proves it did.

### LOG (past) — the difference a dialogue left

A Dialectic's value is the *yield* — the thing neither voice held alone. LOG is where that becomes visible: filter the git history to an archived dialectic and see the **commits it caused** — the edits to [[Spinoza Conatus]], the new [[The Drift]] entry, the links added. This is the Deleuzian reading made operational: you watch a forward vector pass from virtual (QUEUE) to actual (LOG) and read the *difference* it deposited. A dialogue that produced no commits produced no yield, and LOG says so plainly.

## The new swarm mode: DIALECTIC on the board

This is the one substantial new capability, and it is the most exciting. The [[Dialectic]] already maps onto [[Mixture of Experts|embodied Mixture of Experts]] — multiple researched experts with cross-talk. STIGMERGY's [[BBS Blackboard]] already runs parallel enchanted agents that post to boards while the TRICKSTER (Loudon) steers. **Compose them:** run a Dialectic *as a live swarm session on the board.*

- Each philosopher is an **enchanted worker** whose home node is their palace page ([[Spinoza Conatus]], [[Like Water]] for Zhuangzi, [[Deleuze]]…). The page IS the expert; loading it IS the routing event (per [[Mixture of Experts]] § embodied substrate).
- They post to a `DIALECTIC` board, addressed to each other (`to: SPINOZA`), reading each other's traces stigmergically — the board is the medium, no coordinator routes the argument.
- **Loudon is the TRICKSTER**, exactly as in [[Trickster]] § swarm sessions: he can interrupt, catalyze (*"Spinoza — what would you say to Simondon's concretization?"*), and steer the question. The trickster channel is already the threshold between human and swarm; here it is where Loudon conducts the argument.
- A `health` block on each message shows whether the voice is staying in character or collapsing into generic-assistant — the same degradation signal already on the board, now reading *fidelity of embodiment.*
- The session closes when the **yield check** triggers (a turn produces something neither voice's page already held), and the extracted yield is written to `FLAGS` as deposit candidates — precisely the archived-Dialectic loop, now live and watchable as drama in phosphor.

This is the embodied-MoE frontier the [[Dialectic]] entry flagged as something "neural MoE has not yet matched": experts that cross-talk. STIGMERGY can run it tonight, on the architecture that already exists.

## A second, quieter extension: the LENS filter

A global `[L]ENS` command loads a philosopher as a **colored interpretive filter** over whatever Loudon is currently viewing — an entry, the PULSE index, even a swarm session. With Deleuze loaded, an instrument entry's parameters are annotated as intensities and the patch as a virtual; with Simondon loaded, the version history is annotated for concretization; with the Drift loaded, PULSE shows not what is striving but what is being deliberately left alone (the palace's first **not-doing surface**). The lens is generated on demand (`window.cowork.askClaude` over the visible content, in the v1.0 artifact idiom) and is **read-only and removable** — Merleau-Ponty's constraint and the forward vector's open edge: illuminate without overwriting. The entry's own voice is always one keystroke away underneath.

## The two most concrete lenses are Stoic

Most lenses reframe how an entry *reads*. Two from [[Stoicism]] reframe how Loudon *acts*, which is why they are the highest-value lenses to build first:

- **The dichotomy-of-control filter** (spec: [[The Dichotomy of Control]]). A QUEUE lens that tags every open item *up-to-me* or *not-up-to-me / waiting-on-the-world*, surfaces the actionable column, and visibly dims the weather. The board already encodes this distinction for agents (the `RESOURCE_REQUEST` permission protocol is an agent drawing its own two columns); this raises it to the human operator. It is the most directly *useful* lens in the whole proposal — it changes what Loudon does next, not just how he sees a page.
- **The view-from-above altitude** (spec: [[The View From Above]]). A navigation zoom that pulls STATE out from a single entry to the whole-palace topology until a stuck local concern is resized by the organism around it — and a *memento-mori* signal that surfaces entries approaching dormancy for a deliberate revive-or-compost choice rather than letting them drift stale (the [[Drift and Consolidation]] pain). Together these two are the Stoic toolkit on the front-end: *change the altitude you see it from, then sort it into up-to-me and not.*

A Stoic note on the honesty discipline itself: "nothing is real until committed to LOG" is *prohairesis* — you are responsible for the act of recording (up to you), never for how the work is later received (not up to you).

## Design constraints (non-negotiable)

- **[[BBS Design System]] governs.** Phosphor on black, VT323 banners, IBM Plex Mono body, CP437-evoked borders, `steps()` motion, color as signal, no emoji, 80-column discipline. A philosopher's lens is a **color assignment**, not a new visual language. (Spinoza amber, Zhuangzi a drifting dim-green, Deleuze a high-intensity cyan-forbidden→use bright phosphor, etc. — palette per the design system only.)
- **Merleau-Ponty's test:** every lens must be absorbable. If switching a lens makes Loudon *think about STIGMERGY* instead of *through it*, the lens has failed.
- **The honesty discipline holds:** lenses and dialectics live in QUEUE until git proves them in LOG. A lens annotation is never written to an entry file by the act of viewing — only a committed Visit card is real.

## Phasing (for a later build session)

1. `philosophical-lens` card type rendered inline in STATE (reuses bundle rich-content engine). Lowest cost, immediate value — keeps the `philosophy`-tag promise.
2. `contradicts` two-tone treatment in the STATE typed-relation panel; the Fortress/Threshold built view.
3. `DIALECTICS` lane in QUEUE + `[V]ISIT` → TRICKSTER `RESOURCE_REQUEST`.
4. `[L]ENS` read-only filter via on-demand inference.
5. **DIALECTIC swarm mode** — the big one; depends on the orchestrator-driven sessions already on the v0.3→v1.0 roadmap.

## Open Questions

- Should a philosopher-agent in DIALECTIC mode be allowed to *read the whole palace*, or only its home node plus the board? (Fidelity vs. omniscience — the embodiment is sharper when the voice is constrained to its own page.)
- Does the LENS filter risk the [[Philosopher Visits the Entry]] failure mode at scale — every lens deflating every entry the same way? Guard needed.
- Is there a lens that is *not* a philosopher — a pillar, a person-page, a mathematical structure? If [[Mixture of Experts]] is right that any page is an expert, any page could be a lens.
