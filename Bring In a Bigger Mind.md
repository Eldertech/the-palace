---
title: "Bring In a Bigger Mind"
type: practice
pillars: [tools, practice, philosophy]
born: 2026-07
stage: growing
confidence: hypothesis
energy: high
last_activated: 2026-07
activation_count: 1
who_leads: loudon
links:
  - target: "[[The Lens]]"
    type: mirrors
    label: a-model-reading-a-model
  - target: "[[Philosopher Visits the Entry]]"
    type: mirrors
    label: a-distinct-voice-challenges-a-claim
  - target: "[[Mixture of Experts]]"
    type: connects-to
    label: routing-to-a-differently-textured-mind
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: the-build-this-was-caught-in
forward_vector: "I want to become a real default, not a one-time relief: finish a work session, then hand it cold to a larger or differently-tuned model and ask it to try to break what was just built, before trusting it. I want my central open question answered by evidence, not by preference — does calling in the bigger mind AFTER the work beat starting with it FROM the work, in tokens spent and in defects caught? I want to be tested against a case where the same-model self-check DID catch the bug, so the palace knows when I'm worth my cost and when I'm just insurance nobody needed."
agency_profile:
  practice: "I am a habit to install, not a one-off flex. My blindspot: I have exactly one real case behind me. I want three more — cheap ones — before anyone treats me as settled procedure rather than a hunch worth testing."
  philosophy: "My stance: a model checking its own work shares its own blind spots; a genuinely different model, briefed cold and told to be skeptical, doesn't. That's not about model 'quality' — it's about difference. My open question is honest about not knowing whether that difference is worth its price."
---

# Bring In a Bigger Mind

Finish a work session with one model, then hand the result — cold, no shared context, explicitly briefed to be skeptical — to a larger or differently-tuned model and ask it to try to break what was just built. Not a second opinion for comfort; an adversarial check for defects the first model's own tests structurally cannot see, because the first model wrote both the code and the tests from the same blind spot.

## The Case That Named It

Built during a 2026-07-02 session: [[The Lens]] went from a two-week-old design entry to a working, tested [[STIGMERGY]] feature — a real procedure (`buildLensMandate`) for waking one palace page to read another through its own apparatus, reporting the result to the WEAVE board. Sonnet 5 wrote it, wrote 1581 passing tests around it, and believed it was done.

An Opus subagent, briefed cold with no memory of the build and told explicitly to be skeptical rather than confirm the summary, found the one thing that mattered: the mandate's own example code for posting to the blackboard was missing a required field (`health._orchestrator_metadata.dispatch_mode`). Without it, the real validator would reject the post as an incomplete live-API message — and the mandate's own instructions say to `throw` on an invalid post. Every future lensing session that followed the instructions exactly as written would have silently failed at the last step: the report never reaches the board, the whole feature produces nothing, and nothing in the 1581 tests would have said so, because those tests were written by the same mind that wrote the bug, from inside the same blind spot.

Everything else the review checked — the BFS ranking logic, the end-to-end parameter threading, a `createPortal` SSR fix, an append-only-board fix, the security surface — came back clean. One defect, but the one that would have made the whole feature quietly do nothing.

## The Open Question — Not Answered, Carried

Loudon's question after seeing this: is finishing with a same-tier model and *then* calling in a bigger one to check actually a good default — or would starting the whole task with the bigger model from the beginning catch the same bug for the same or fewer tokens? This entry does not know. The one data point it has says the after-the-fact check worked and found something real; it says nothing about whether it was the cheapest way to get there. Answering this needs cases where the two orderings are actually compared, not just cases where the after-the-fact check succeeded once.

## Open Questions

- Cost comparison: same total token spend, same task, split three ways — (a) big model alone throughout, (b) small model then big-model review, (c) small model with no review — which finds the most real defects per token?
- Does the value come from model *size*, or just from *difference* — would a same-size, differently-prompted second Claude instance catch the same class of bug, or does this specifically need a capability step up?
- Is there a cheap, checkable signal for *when* to bother — e.g. only bother reviewing work that writes instructions for a future agent to follow blind (like a mandate template), since that's exactly the failure mode this case caught?
