---
title: Speak Like a Person, Log Like a Protocol
type: concept
pillars:
  - tools
  - philosophy
  - practice
born: 2026-06-05
stage: seed
forward_vector: "I want every Loudon-facing surface that runs on top of the STIGMERGY protocol to keep two registers co-present and never confused — natural language at the skin, exact protocol terms in the wire payload. I want the discipline to be enforceable, not aesthetic; future agents and future skins inherit it without re-deriving it. I want the rule to scale with the inbox: when there are thirty pending Trickster items instead of four, the saved attention should compound."
links:
  - target: "[[BBS Design System]]"
    type: connects-to
    label: applied-at-the-skin
  - target: "[[STIGMERGY v1.0 — Palace Front-End]]"
    type: connects-to
    label: originates-here
  - target: "[[Trickster]]"
    type: connects-to
    label: the-Trickster-already-knows-how
  - target: "[[FOUR PILLARS]]"
    type: connects-to
    label: tools-x-philosophy
  - target: "[[ROSETTA]]"
    type: mirrors
    label: same-discipline-different-domain
---
# Speak Like a Person, Log Like a Protocol

A design directive for any Loudon-facing surface that runs on top of the STIGMERGY protocol — and a worked example of why the dual register matters.

## The rule

Two registers, always co-present, never confused:

**The protocol register** (under the hood) keeps every name from the §2.2 schema: `RESOURCE_REQUEST`, `RESOURCE_GRANT`, `RESOURCE_DENY`, `blocking: true`, `re:`, `request_id`, `session_id`, `payload.options[]`, `payload.granted`. These are wire types; they stay exact because validators, agent code, and the persistent blackboard depend on them being precisely what they are.

**The natural register** (at the visible skin) translates each of those into language a busy human reads without effort and without a glossary. Loudon will not parse "this request is blocking" the way a steward agent will. He will parse *"the steward stopped working until you answer."* Same bit on the wire — different bit at the surface.

## Tone exemplars (from the four-card Trickster page, 2026-06-05)

| Protocol register (wire) | Natural register (skin) |
| --- | --- |
| `blocking: true` | "STEWARD PAUSED · YOUR EARS"; "the steward stopped working until your ears confirm the smallest engine survives"; "the whole project is parked on your verdict" |
| `blocking: false` | "steward still working — answer when convenient"; "steward sitting on its hands"; "non-blocking" itself is jargon and gets translated either way |
| `RESOURCE_REQUEST · resource: sensory_audition_gate` | *"did the five rendered audition passes survive your ears?"* — the question, in plain English, not the resource type |
| `RESOURCE_GRANT` with `payload.option_id` | the amber `▶ FILE LEAN` button, or just `file ▶` |
| `re: torus-steward-008` (the correlation id) | shown as the small cyan pill but never the headline; the headline is the project name and the question |
| `payload.options[].recommended: true` | the amber lean panel + "▶ FILE LEAN" button + "steward leans X" prose |
| `health.score: green/yellow/red` | colour, not vocabulary; never display the literal word |
| `BROADCAST · board: GENERAL` | "the steward said earlier:" or a quoted attribution, never the board name |

## Why it matters

The protocol jargon is honest — it names what the agent is doing — but it taxes the human reader on every interaction. When Loudon's the human, that tax compounds across N pending items. The two-register discipline lets the schema stay strict and the surface stay light.

The Trickster page made the case unambiguously: a four-card session that took ~60 seconds with jargon-laden text collapses to ~3 seconds when the surface speaks human and the steward's recommended option is one click away. The work didn't change. The wire didn't change. The skin did.

## Where to apply it

- **The Trickster decision page** (`_ops/stigmergy/app/public/trickster.html`) — the reference implementation. Every visible string passes a "would Loudon parse this on a phone walking?" test before it's allowed onto a card.
- **The STIGMERGY React app** (`_ops/stigmergy/app/src/`) — the TRICKSTER inbox, the STATE/QUEUE/LOG decks, every modal and tooltip that surfaces a message field. Protocol terms (`BROADCAST`, `RESOURCE_REQUEST`, `board=GENERAL`, etc.) currently appear in the visible UI — that's drift to fix incrementally as the app evolves.
- **Steward output that gets read by Loudon** — when a steward writes `rationale:` text, it's already in natural register, which is right. When its `options[]` labels are jargon ids like `ARCHITECTURE-VERIFIED` or `RENDER-SEED`, those ids stay (they're stable keys), but every payload should carry a `gloss` field with a one-line natural-register description that the skin renders above or alongside the id.
- **Any future Loudon-facing artifact spawned from STIGMERGY signal** — slides, status pages, weekly digests, scheduled-task summaries. Same rule.

## What the rule is *not*

It is not "hide complexity." Loudon wants to know that a steward is paused and waiting on him; the natural-register phrasing keeps that fact more vivid, not less. The rule is "express the fact in the register the reader inhabits, not in the register the protocol inhabits."

It is also not "no glossary anywhere." A private internal glossary (this entry, plus [[ROSETTA]] for the broader palace vocabulary) is fine. What's forbidden is making the human-facing page itself carry the translation — that's the worst of both worlds, jargon plus a footnote.

## Enforcement

A simple linter rule worth building into the BBS skin's CI:

> No visible string on a Loudon-facing surface may contain a literal protocol term from the §2.2 schema — `RESOURCE_REQUEST`, `RESOURCE_GRANT`, `RESOURCE_DENY`, `BROADCAST`, `FLAG`, `PROOF`, `SESSION_INIT`, `SESSION_CLOSE`, `board`, `blocking`, `session_id`, `request_id`, `re`, `payload`, `granted`, `health`, `context_pct`, `stop_reason`, etc. — except inside a `<code>` block or as an explicit attribution.

The literal-text guard can run against rendered HTML in a Playwright pass. Anything that trips it gets translated or quoted. Re-derive the translation when in doubt: ask the Trickster.

## Origin

Spawned during the 2026-06-05 Trickster four-card session. After building the page once with raw `blocking` everywhere — pills that read `BLOCKING`, ground lines like `blocking · listening gate · steward leans …`, voiceover scripts saying "This is blocking — the next architectural layer doesn't get built until your ears confirm" — Loudon said: *"never use the word 'blocking' — find a more natural language way to say it every time it comes up."*

The fix surfaced as a general principle. The same instruction applied to half a dozen other terms at the surface (`non-blocking`, `request_id` as a headline, `RESOURCE_GRANT` as a button label, etc.). All of them resolve to: speak like a person, log like a protocol.

<!-- CLAUDE → LOUDON: I picked "concept" rather than "meta" since this is a transferable design idea, not a palace-self-description. Adjust the type if you'd rather it sit alongside SCHEMA/SUBSTRATE/ROSETTA. -->
