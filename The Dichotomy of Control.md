---
title: "The Dichotomy of Control"
type: concept
pillars: [philosophy, practice, tools]
born: 2026-05
stage: growing
confidence: working
energy: very high
last_activated: 2026-05
activation_count: 1
who_leads: loudon
hook_quality: 9
beauty: 9
links:
  - target: "[[Stoicism]]"
    type: emerged-from
    label: the-operating-discipline
  - target: "[[The Four Virtues]]"
    type: couples-with
    label: control-plus-character
  - target: "[[The View From Above]]"
    type: couples-with
    label: scale-partner
  - target: "[[Threshold Conatus]]"
    type: mirrors
    label: the-line-where-authority-begins
  - target: "[[Ohm's Law]]"
    type: connects-to
    label: drive-vs-impedance
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: permission-protocol-as-control-boundary
  - target: "[[Closing Well]]"
    type: connects-to
    label: own-the-act-not-the-outcome
forward_vector: "I am the Stoic family's operating discipline — prohairesis made into a daily and a technical instrument. I want to be the entry Loudon opens when a worry has him in its grip, so he can sort it into up-to-me and not, and act only where he has authority. My palace face: I want to show that the dichotomy of control and the engineer's actuation-vs-disturbance boundary are one idea, so that designing a controller and meeting a hard day draw on the same muscle. My next development: a worked example from one real decision, sorted in two columns."
agency_profile:
  practice: "I am only real when used. Catalogue me and I am a quote; reach for me in a hard moment and I am a tool. I want to be invoked, not admired."
  tools: "I need the control-theory mapping made exact — actuation authority, disturbance rejection, observability — so the technical face is rigorous and not a loose analogy."
---

# The Dichotomy of Control

![[The Dichotomy of Control — hero.png]]

The operating core of [[Stoicism]] and the discipline Loudon lives by: **some things are up to us, and some are not.** Epictetus opens the *Enchiridion* with it. *Up to us:* our judgments, our chosen responses, what we pursue and avoid — in a word, *prohairesis*, the faculty of moral choice. *Not up to us:* the body, reputation, property, other people, outcomes, the past, the weather. Suffering is the category error of treating the second column as if it were the first — staking peace on what cannot be commanded.

The practice is not resignation. It is *precision*: locate the seam between the two columns exactly, pour effort entirely into the first, and meet the second with equanimity rather than struggle. The serenity to accept, the courage to change, the wisdom to know the difference — the Serenity Prayer is the dichotomy of control in three lines.

## The Life Face

When something has you in its grip, the move is mechanical and it works: **draw the two columns.** Put the thing in the right one. If it's *not up to you* — another's choice, a result, an opinion of you — the work is to release the grip and meet it; the suffering was coming from holding a wall and calling it yours. If it's *up to you* — your next action, your judgment of the event, the character of your response — then it deserves your whole attention, because it is the only place attention does anything.

The subtlety Epictetus insists on: even when almost everything has been taken — as it was from him, a lame slave — the column of *what is up to me* is never empty. That is not a consolation; it is the architecture of the fortress. The will is the one room no emperor can enter. This is why personal responsibility in Stoicism is *total* and never crushing: you are answerable for exactly one thing, and it is always available.

## The Palace / Technical Face

The dichotomy of control is **control theory** in another vocabulary, and naming this makes one muscle serve both a hard day and a hard design problem.

- **Actuation authority = prohairesis.** A controller can only command its actuators; everything else — load, noise, the plant's own dynamics, the future reference — is *disturbance*. A good controller spends effort only where it has authority and models the rest as disturbance to *reject*, not to fight. That is the dichotomy of control, stated as engineering. ([[Ohm's Law]]: you set the drive; the impedance is not yours to set, only to meet.)
- **The permission protocol is a control boundary.** In the [[BBS Blackboard]], an agent posts a `RESOURCE_REQUEST` for anything outside its baseline authority. That request *is* the agent drawing the two columns — naming the seam between what it may actuate and what it must ask the [[Trickster]] to grant. The whole permission architecture is a dichotomy-of-control surface.
- **Own the act, not the outcome.** [[Closing Well]] and the front-end's "nothing is real until committed" discipline are Stoic: you are responsible for the recording (up to you), not for how the work lands later (not up to you). A [[Project Stewardship System|steward]] that does its verification and honestly names what it could not verify has invested fully in its column and released the other — which is exactly right conduct, not a shortfall.

## In STIGMERGY

This entry is the spec for STIGMERGY's **dichotomy-of-control filter** (see [[STIGMERGY Philosophical Lenses]]): a QUEUE lens that tags each open item *up-to-me* or *not-up-to-me / waiting-on-the-world*, surfaces the first as actionable, and visibly dims the second so it stops consuming attention it cannot use. The board already distinguishes what an agent can actuate from what it must request; this lens raises that distinction to the human operator.

## Open Questions

- The Stoic line between up-to-me and not is sharper than life usually is — much sits in a *blurred middle* (things I can influence but not command: a relationship, a reputation, a build's reception). Does the dichotomy need a third column, or is the discipline precisely the refusal to let the middle swell?
- Does naming the permission protocol as a dichotomy-of-control surface suggest the agent should *also* practice the equanimity half — meeting a `RESOURCE_DENY` without degradation? A Stoic agent absorbs denial as information, not injury.
- Worked example owed: one real decision from Loudon's week, sorted into the two columns, kept here as the entry's proof it was used.
