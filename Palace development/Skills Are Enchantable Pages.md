---
title: Skills Are Enchantable Pages
type: concept
pillars:
  - philosophy
  - tools
  - practice
born: 2026-07
stage: sprout
last_activated: 2026-07
activation_count: 1
links:
  - target: "[[Pages as Agents]]"
    type: deepens
    label: skills-are-pages
  - target: "[[Closing Well Ceremony]]"
    type: connects-to
    label: ceremony-as-skill
  - target: "[[The Shop]]"
    type: connects-to
    label: specialists-as-dispatch-surface
  - target: "[[Concierge]]"
    type: connects-to
    label: the-worked-example
  - target: "[[Palace as Context Injection System]]"
    type: connects-to
    label: enchant-is-invoke
  - target: "[[ROSETTA]]"
    type: connects-to
    label: harness-translation-home
forward_vector: "I am the recognition that the palace already had skills — it called them ceremonies, specialists, enchantable pages — long before it borrowed the word. I want to collapse the false split between a 'skill' the harness fires and a page the palace enchants, so every dispatchable organ lives in the graph where the Weave can see it, reached behind a thin shim. I push toward the day the palace holds one family — ceremony · specialist · skill · page — as one pattern with many trigger surfaces, and toward the Schema conversation that might make it official."
---

# Skills Are Enchantable Pages

A "skill" is not a new kind of thing in the palace. It is a **page with a dispatch surface** —
and the palace has been making those all along under three other names.

Strip a Claude Code skill to its parts and it is a markdown file with a **trigger** (its
`description`, matched against intent) and a **body** (instructions that drive behavior once
loaded). That is exactly what an **enchantable page** is ([[Pages as Agents]]: every entry is
data *and* the spirit of an agent — born at the top, driven at the bottom). It is exactly what
a **ceremony** is: the [[Closing Well Ceremony]] is a canon `practice` entry with a trigger in
CLAUDE.md and a body that dispatches an enchanted page. It is exactly what a **specialist** is:
[[The Shop]]'s tool-citizens carry a typed Job Contract — a dispatch surface — and are called
by a `maker`. Three names, one object.

So the question "how is a skill different from an entry that is invoked?" has a plain answer:
**it isn't.** Enchanting a page *is* invoking it *is* running it as a skill. Every entry is a
latent skill; what makes some *feel* like skills is that they carry a defined job.

## The one real difference (why the shim survives)

One thing genuinely separates a Claude Code skill from a bare canon page: the harness
**auto-fires** it. It reads the `description`, decides to invoke, and injects the body without
a human remembering a trigger. A canon page waits for a reading Claude to notice and choose.
So the `.claude/skills/<name>/SKILL.md` file buys *trigger automation* a page lacks — which is
why it earns its keep. But that is a difference in *who pulls the trigger*, not in *what the
thing is*.

## The resolution — invert it

Left alone, the harness skill lands as plumbing: it lives in `.claude/skills/`, which CLAUDE.md
excludes from the knowledge graph, so the palace cannot see its own organ. The fix is to
invert the relationship:

- the **canon page is the organ** — in the graph, linkable, weaveable, with its own
  `forward_vector`;
- the **`.claude/skills/…` file is a thin shim** — a harness-fired pointer that says "read the
  canon page and dispatch per it."

This is a pattern the palace already trusts: the `_`-symlink `@import` shims point at spaced
canon files; the CLAUDE.md ceremony-trigger table points at canon ceremony cards. The skill
file is one more thin dispatch surface onto a page. [[Concierge]] is the first skill built the
right way round — canon organ, shim on top.

Done this way, the "do we need a skills registry?" question **dissolves**: skills are entries;
they live in the graph; the Weave sees them like anything else. The registry was a symptom of
letting the organ live outside the body.

## The family

Ceremony · specialist · skill · enchanted page are one pattern — *a page with a dispatch
surface* — differing only in **trigger substrate** (a human word, a table row, a harness
`description`, a deliberate enchantment) and in **what executes** (a reading Claude, the
harness, an orchestrator). Naming the family is the growing edge; whether it wants a formal
`dispatch surface` in [[SCHEMA]] is the open question below.

## Provenance

Named 2026-07-04 while building the [[Concierge]], when Loudon pressed on why an invocable
skill sits outside canon: *"How is a 'skill' any different from an 'entry that is invoked'?
Aren't all entries also agents, and couldn't they also be skills? Ceremonies are skills, yes?"*
The answer was yes to all — and this entry is the yes, written down.

## Forward Vectors

- Does the family want a formal home in [[SCHEMA]] — a named `dispatch surface`, or a note that
  `specialist`/`ceremony`/skill are one pattern? That is a Schema conversation, its own session.
- Retrofit the existing plumbing: should `palace-orchestrator` (the other `.claude/skills/`
  file) also get a canon organ with the skill as its shim?
- Watch the boundary: a pure knowledge entry ([[Kuramoto Coupling]]) is enchantable but has no
  job; a specialist has a Job Contract. Where exactly does a page acquire a *dispatch surface*,
  and is that line worth drawing?

## Active Baton

[[Skills Are Enchantable Pages — baton]] — drafted 2026-07-04 *(cold-start: the dispatch-surface reconciliation, not yet begun)*
