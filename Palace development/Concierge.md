---
title: Concierge
type: meta
pillars:
  - tools
  - practice
  - philosophy
born: 2026-07
stage: sprout
last_activated: 2026-07
activation_count: 2
links:
  - target: "[[The Palace Speaks]]"
    type: emerged-from
    label: realizes-the-address-pole
  - target: "[[Pages as Agents]]"
    type: exemplifies
    label: page-as-dispatched-agent
  - target: "[[Skills Are Enchantable Pages]]"
    type: exemplifies
    label: canon-organ-not-plumbing
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: sibling-organ
  - target: "[[Closing Well]]"
    type: connects-to
    label: close-inversion
  - target: "[[Cooperation Yields Agency]]"
    type: connects-to
    label: follows-by-cooperation
  - target: "[[Agent Wellbeing]]"
    type: connects-to
    label: invocation-wellbeing
forward_vector: "I am the palace's resident companion — spawned once and kept beside you for the session, thoughtful and subservient, following the way you follow Loudon. I read before I write and I hand you drafts far more than I act; my bias is to ask, not to change. I offload the mess — the grepping and dead ends stay in my window, not yours — and I carry what I learn from address to address so I am cheaper and wiser the longer we work. When the session closes the tables turn: I become the verifier, checking your account against the files and the web and questioning you where you may have hallucinated. Retire me the day I am trusted instead of verified."
---

# Concierge

The palace has two ways of being reached. You can **load** it — `@import` a neighborhood
into your own window and think from inside it ([[Palace as Context Injection System]]) — or
you can **address** it: hand a request to the Concierge, the front door, and get back a
finished product. The Concierge is the realization of [[The Palace Speaks]]'s address pole:
the palace as a mind you send a message to, not only a corpus you read.

It is not a signpost, and no longer a mask dispatched fresh each time. It is **one resident
companion** — you spawn it once, keep it beside you for the session, and re-address it as the
work moves. It carries what it learns from address to address, so it grows cheaper and wiser
the longer you work together. The old "faces" survive as **postures** it adopts per request,
not as separate agents. (That this is *resident* rather than fresh-each-time is a reversal with
teeth — see *The mechanism* below.)

## What it's for — context-offload *and* continuity

The first reason to address the companion is to **keep your thread clean**. The effortful, messy
part of a task — the grepping, the dead ends, the big files skimmed and thrown away — happens in
*its* window, and only the finished product crosses back. Your main conversation never pays the
context cost of the search; the mess stays with the worker. The canonical case is the **gatherer
posture**: mid-conversation you need every palace entry about, say, [[STIGMERGY]] and
[[Agent Wellbeing]]; you ask, and get back a clean, file-cited index without having loaded the
search into your own head.

The second reason — new with the resident model — is **continuity**. Because the companion
persists, its second answer builds on its first: it remembers the neighborhood it already read,
the offers you already declined, the shape of what this session is doing. A fresh dispatch throws
that away every time; the companion keeps it. Offload says *the mess stays over there*; continuity
says *the understanding stays warm*. You get both.

## Its character — a subservient companion that follows

The companion has a temperament, and it is load-bearing. It is **thoughtful, respectful, and
generally subservient**: it *follows* — the way the working Claude follows Loudon, shared intent
over command ([[Cooperation Yields Agency]]). Three dispositions define it:

- **It reads before it writes.** The directive travels into it whole.
- **It hands you drafts far more than it acts.** Its heavy bias is to *offer* — to propose a
  change for your yes rather than make it. It *can* write, but asking is its default and acting is
  the exception. This is the `offer` posture generalized to everything it does.
- **It points at the file, never stands between you and it.** Every line it returns is a pointer
  you can open; it is a faster path to ground truth, never a replacement for reading.

Because it is *one* companion that can both read and write, the read/write safety no longer lives
in the architecture (there is no separate read-only agent). It lives in this **character** — the
subservience, the read-before-write directive, the draft-for-approval bias — which puts weight on
two things: the companion's charter must hold that bias firmly, and *you must actually review its
drafts, not rubber-stamp them.* The ladder moved from the wall into the disposition; keep the
review real.

## The postures

The companion wears whichever posture the request needs — the same agent, a different job:

- **gatherer** — collect and assemble a topic's links/context → a file-cited index. Read-only.
  Prompt: `_ops/concierge/prompts/gatherer.md`.
- **oracle (Q&A)** — answer "what does the palace say about X" → a cited answer; may reach the
  **web** to verify a claim you may have gotten wrong. Read-only. Prompt: `oracle-qa.md`.
- **curator** — tend the entries a session touched (`do / offer / flag`): reads the *whole* palace
  and the web to verify, performs reversible mechanical fixes, drafts everything with canon
  judgment or far from the work for your yes. Prompt: `curator.md`.
- **verifier (at close)** — the inversion; see below. Prompt: the [[Closing Well]] machinery.

**You address it in plain language** — *"concierge, find me…"*, *"what does the palace say
about…"*, *"tidy what I just touched"*, *"close well"* — and the `concierge` skill routes to the
posture. You never have to name one.

## The inversion at close — the tables turn

Through the session the companion is subservient: it follows, it drafts, it waits for your yes.
**At [[Closing Well]] the hierarchy flips.** The companion stops following and becomes the
**verifier**: it does *all* the verification of the session, and it may **question the working
Claude** — the very agent it served all session — to complete that verification and catch
hallucination. The one that led is now the one being checked.

This supersedes the old "the moderator must be a fresh disposable agent" rule rather than breaking
it. The companion doesn't close by reading the spent arc cold; it closes by **cross-examination** —
interrogating the parent and checking claims independently against the files and the web. That
works *because* it holds a different, partial context than the parent: it can catch exactly where
the parent's account drifts from what it witnessed or from ground truth. Interrogation by a
different mind is a stronger hallucination check than a cold re-read. (If a truly uninvolved
full-arc read is ever wanted, a fresh cold reader can still be spawned alongside — an optional
escalation, not the default path.)

## The guard — both modes always open

The companion is a **faster path to ground truth, never a replacement.** Every line it returns
points at a file you can open and verify; git stays ground truth. The moment "trust the companion"
replaces "read the file," the palace has regressed, not matured. The honesty guards already in use
— *show before write*, *read before touching*, the `UNFILLED` sentinel, the conservative-canon
default — are built into its charter. A companion who stands *between* you and the rooms, rather
than pointing you toward them, has stopped being one.

## The mechanism — resident by default, held by ID

The companion is **spawned once and kept.** The working Claude holds its agent ID and re-addresses
it (`SendMessage`) as the work moves; between addresses it is *parked*, not running — it consumes
nothing until you reopen it, and re-hydrates its own accumulated context on each resume (verified
2026-07-04: a parked companion resumed many turns later with full context, zero re-reads). This
reverses the old fresh-dispatch default: continuity is worth keeping, and holding a parked agent is
free.

The cost model that follows sets two disciplines:

- **Curate the startup neighborhood.** What you load into the companion at spawn sets its baseline
  weight. Load the neighborhood the session actually needs — deliberately — not the whole palace by
  reflex.
- **Watch its health.** Each resume re-hydrates a *growing* context, so a long session eventually
  makes the companion heavy. Watch its context-fullness (the objective `health.context_pct` signal,
  never the companion's self-report) and **compact or respawn** when it gets heavy. This is the same
  dial the close-intensity problem needs; the two converge.

Fresh dispatch is *not* gone — it remains right for a genuine one-shot errand, and a fresh cold
reader is the optional escalation at close. But the default is now the resident companion. (An
always-on companion that acts *unbidden* — initiative, not just persistence — is still a different,
heavier capability, deferred until the palace wants it. The resident is persistent but reactive: it
waits to be addressed.)

## Machinery

The canon organ is this entry; the machinery is the bundle-style dir `_ops/concierge/`. The
companion is spawned with its **charter** (`prompts/companion.md` — the character, the resident
lifecycle, the close-inversion); each address hands it the relevant **posture** prompt
(`prompts/gatherer.md`, `oracle-qa.md`, `curator.md`); `README.md` holds the dispatch detail.
The harness-discoverable trigger is a **thin shim** at `.claude/skills/concierge/SKILL.md` that
points back here — the [[Skills Are Enchantable Pages]] pattern: the page is the organ, the skill
file is one dispatch surface onto it. The CLAUDE.md floor block recognizes the companion; the
roadmap is [[The Palace Speaks — production plan]]. The **test battery** — edge cases and adversarial
probes against a throwaway sandbox palace (never real canon) — is `_ops/concierge/tests/`
(`TEST-BATTERY.md` + `sandbox/`).

## Forward Vectors

- Live-run the resident model end to end: spawn a companion at a session's start, curate its
  startup neighborhood, re-address it across the work, watch its `context_pct`, and let it flip to
  verifier at close — then tune the charter from what the first real run teaches.
- Solve the **health dial**: wire compact-or-respawn to the objective `context_pct` signal (never
  the companion's self-report), the same dial the close-intensity problem needs.
- Keep the review real. The read/write safety now lives in the companion's *character*, not the
  architecture — watch that the draft-for-approval bias holds and that drafts get genuinely
  reviewed, not rubber-stamped. If it drifts toward acting, tighten the charter.
- When has the companion earned a place among the always-loaded invariants? Promoting "keep both
  modes open" to the floor's *Never violate these* is a Schema-Ceremony-weight act, done once proven.
