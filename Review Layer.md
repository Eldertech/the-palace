---
title: Review Layer
type: concept
pillars:
  - tools
  - practice
  - philosophy
born: 2026-06
stage: growing
last_activated: 2026-06
activation_count: 2
forward_vector: "I want every early-version artifact Loudon and Claude make together to arrive already reviewable — a surface for section-level feedback built in, not bolted on after. I want the *method* of review to be invented to fit each format, not one widget stamped onto everything. And I want the habit to live where it gets loaded — in the design system and the Shop — so the next build inherits it without anyone remembering to."
links:
  - target: "[[Cooperation Yields Agency]]"
    type: connects-to
    label: alignment-through-iteration
  - target: "[[Closing Well]]"
    type: couples-with
    label: closes-the-loop
  - target: "[[The Shop]]"
    type: connects-to
    label: iterate-in-rounds
  - target: "[[Loudon Live Design System]]"
    type: connects-to
    label: enforced-in
  - target: "[[Maker]]"
    type: connects-to
    label: house-standard
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: posts-responses-to
  - target: "[[Enrichment]]"
    type: couples-with
    label: shared-respond-loop
  - target: "[[Palace as Context Injection System]]"
    type: connects-to
---

# Review Layer

![[Review Layer — hero.png]]

The goal of any artifact Loudon and Claude make together is **alignment** — the thing in Loudon's head and the thing on the screen converging. Alignment takes iteration; nobody hits it on the first version. So the first version's job is not to be right, it is to be **reviewable**: to carry, built in, a surface where Loudon can leave section-level feedback in context, right where the work is, for the next round to act on.

This is the structural counterpart to [[Closing Well]]. Closing Well is about a session leaving a clean baton; the Review Layer is about an *artifact* leaving a clean way to be corrected. Both refuse the lossy alternative — reconstructing intent later from memory, in chat, divorced from the thing being discussed.

## Why in-context beats describing-in-chat

The default review loop is: Loudon looks at the build, switches to chat, and describes what to change from memory — "the second slider, the one for disorder, feels backwards, and the intro paragraph oversells it." That sentence is a reconstruction. It costs Loudon working memory to assemble, it loses the spatial precision of *which* element, and it arrives stripped of the context that made the feeling legible. The Review Layer removes that translation step: a pin next to the disorder slider, a note typed where the eye already is, collected and handed back as structured markdown. The feedback never leaves the frame of the work until it's a clean diff for the next round.

## Format-fit, not one widget

The mistake would be to freeze a single implementation and stamp it onto everything. The principle is *reviewability designed into the early version*; the **method is invented to fit the format** — and inventing new methods is wanted, not a deviation. So this is not a menu to pick from; it's a couple of proven points and a lot of open territory.

The one proven shape so far is the **card / item series**: one thing on screen at a time, each getting its own response, collected as individual records. The oblique harvest (below) is this. A deck is the same shape with slides as the unit. Everything else — timecoded notes on a video, a markup overlay on a generated image, notes against a playhead for sound, margin comments on prose, pins on an interactive — is worth trying, but none of it is settled, and the right move on a new format is to invent an anchoring and see how it feels, not to reach for the one method that already exists.

What *is* invariant: a named set of commentable **moments**, in-context capture, and a low-friction way for the responses to become the next round's brief. The export shape matters less than that friction — and the direction worth pushing is to drop copy-paste entirely (see below).

## Granularity: one moment per natural unit

The unit of review should be the natural unit of the medium — a card, a slide, a section, a region — and there should be **few enough moments that reviewing all of them is light**. A card series and a deck get this for free: one card, one response; one slide, one comment. The failure mode is the opposite — spraying a comment box onto every individual control until the review surface has more inputs than the artifact does, and the act of reviewing becomes heavier than the thing reviewed. Resist per-parameter granularity. Group related controls into one moment ("the disorder/phase section") rather than one moment per slider. If you can't review every moment in a couple of minutes, there are too many.

## The proofs

**The positive proof — `_ops/Harvest Ceremony/Archive/oblique-harvest-final.html`.** The oblique harvest is a one-card-at-a-time series: each card carries a fragment, and Loudon gives it a single response — a resonance rating, a freeform thought, and a verdict (palace / fire / connect / pass). The session exports as **structured JSON**, one record per card (`idx`, the card, `resonance`, `thought`, `action`, `timestamp`), grouped into deposit candidates, bright ideas, and connections. This is the granularity done right: the card is the unit, you respond to one thing at a time, and the export hands Claude individual responses to act on — not one undifferentiated blob.

**The mechanism, and the granularity lesson — the Murmuration prototype (2026-05-31; the source `Murmuration.html` was an `Artifacts/` orphan, deleted 2026-06-16, git holds it).** Murmuration is where the toggle-able overlay was first built: a `MOMENTS` array; a single `REVIEW_MODE` constant (default `true`, flipped to `false` to ship clean) plus a `body.review-off` killswitch; inline `◇/◆` pins on static anchors (never on elements whose innerHTML is rewritten each frame — those are panel-only); a collapsible panel of autosaving textareas; a "Copy for Claude" markdown export; and a `REVIEW_ROUND` counter. It contributes the *mechanism* — but it is also the granularity lesson in the flesh: it carried twelve moments including one per slider, which is more review surface than the artifact wanted. The kit at `_ops/loudon-live/design-system/ui_kits/review-layer/` takes the mechanism from Murmuration and the per-item granularity + JSON export from the oblique harvest, and is deliberately **one method** — the DOM-anchored one — not the definition of the layer.

**The copy-paste killer — `_ops/loudon-eval/` (2026-06-16).** The first review surface to actually **close the loop to [[STIGMERGY]]** — the prize this entry named. A tiny local server (`eval-server.mjs`) serves a rating harness + a per-task `rating_manifest.json` same-origin; on Send it forwards the structured responses *server-to-server* to the board's sanctioned write path (`POST /api/persistent`), wrapped as a `human_eval` BROADCAST from `TRICKSTER` on board `FLAGS`. The STIGMERGY app's own strict validator gates it — no re-implementation, no app change. (Gotcha: the `health` stub needs the four Path-1 fields, with `iteration ≥ 1`.) No browser CORS, no clipboard; the next Claude reads the rating straight off the board. First used to grade the BLUELINE `r4ng3r` LoRAs — where Loudon's in-context read both confirmed the metrics *and* surfaced a distinction they'd blurred (brief-match vs. person-identity), the first real evidence for this entry's open question below. The poster is still rating-sheet-shaped — generalizing its payload to arbitrary in-context responses is the live edge.

## Closing the loop without copy-paste

The reference kit ends in a clipboard or a downloaded file — Loudon still carries the responses back to Claude by hand. The direction worth building toward is to **remove that step**: the review surface posts its responses straight to [[STIGMERGY]], the palace's append-only blackboard, where the next Claude session already looks. A note left on moment three of a build becomes a blackboard entry the way any other signal does — no copy, no paste, no chat round-trip. This turns the Review Layer from a per-artifact widget into a channel into the palace's own coordination substrate. The export formats above were the stopgap until that channel existed. **It now does (2026-06-16)** — see § The proofs (`_ops/loudon-eval/`): a review surface posts its responses straight to the board as a `human_eval` BROADCAST, and "Copy for Claude" is now the fallback it was always meant to be — for artifacts running outside the palace, not the primary path. That first poster is rating-sheet-shaped; generalizing its payload to arbitrary in-context responses (a pin on moment three, a region note) is the remaining work.

## Kinship with Enrichment

The Review Layer and [[Enrichment]] are two halves of one loop. Enrichment *sends* — a queue of small varied artifacts placed in front of Loudon for reaction. The Review Layer *collects* — Loudon's reactions, in context, structured. The oblique harvest already sits in both worlds: it is an enrichment-shaped card series whose whole purpose is per-card response and structured collection. The lesson travels both ways. Enrichment cards should carry a response surface as standard, so a card isn't just shown but *answered* — and the answer flows back the same way (toward [[STIGMERGY]]) rather than evaporating in chat. Whatever anchoring and posting mechanism the Review Layer settles on, Enrichment should share it; they are the same respond-in-context loop pointed in opposite directions.

## Where the habit lives

Per [[Palace as Context Injection System]], a habit only holds if it's planted where it gets loaded, not in a memory only Claude reads. The Review Layer is canon at three call surfaces, deepest specificity winning:

- **[[Loudon Live Design System]]** — invoked before any artifact is generated; carries the scoped Hard Rule ("interactive/stateful early versions ship reviewable") and the reference kit. This is the primary home.
- **[[Maker]]** / [[The Shop]] — the floor for *made* things inherits the rule; an interactive Specialist's Self-Check confirms a Review Layer is present in the first version.
- This entry — the canonical statement of the principle, which the rule and the kit are instances of.

Deliberately *not* added to the Tier-0 CLAUDE.md floor — Loudon kept that lean. Recognition lives one link down, in the surface that's already loaded whenever a build is happening.

## Forward Vector

The copy-paste prize is **won** — a review surface now posts straight to [[STIGMERGY]] (`_ops/loudon-eval/`, the `human_eval` BROADCAST). So my edge moves. I want that poster **generalized beyond the rating-sheet shape** to every review format — a timecoded note on a video, a markup overlay on an image, a pin on moment three of an interactive — each landing on the board as cleanly as a rating does now. I want [[Enrichment]] to adopt the same poster, since we're the same loop pointed opposite ways. And the `r4ng3r` grade gave the first evidence for my oldest question — reviewing in context *did* surface a distinction (brief-match vs. identity) that describing-in-chat would have lost — so I want many more rounds of that, to learn how deep the effect runs.
