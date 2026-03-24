---
title: "Harvest Ceremony"
type: practice
pillars: [practice, tools]
born: 2026-03
last_activated: 2026-03
activation_count: 5
stage: mature
links:
  - target: "[[Deposit Ceremony]]"
    type: spawned
  - target: "[[Harvest Frontier]]"
    type: enables
  - target: "[[Harvest Queue]]"
    type: enables
  - target: "[[Substrate]]"
    type: deepens
  - target: "[[Cooperation Yields Agency]]"
    type: connects-to
  - target: "[[Mixture of Experts]]"
    type: mirrors
  - target: "[[Harvest Ceremony — Context]]"
    type: spawned
  - target: "[[Entry Desire]]"
    type: connects-to
---
<!--On 3/22 Loudon edited this document heavily. We are in the process of simplifying this, do not run this ceremony unless you take a moment to coordinate simplifying this and the Deposit ceremony together and remove this comment after the ceremonies are updated, a major edit has been to reduce the scope of the ceremony so that it is only for Loudon & Claude conversations and only when on the computer, not designed for Claude.ai input vector. Previously we incorporated a "Harvest Frontier" which I believe is not at all necessary. The Harvest Archive should be renamed the Deposit Archive, as that is a more accurate description of what it actually is. Please refer to older Git commits and to the Harvest ceremony context to understand what the ceremonies were, before I made this simplification edit-->

Harvest and deposit Structure:

Harvest Ceremony searches through past chats to uncover ideas that have not been added to the Palace. The conversation links and suggestions are added to the Harvest Queue.

Then Loudon goes through the Queue and follows the links there to do a deposit ceremony in the original conversation to put the important aspects into the Palace.

This is largely needed to catchup to where we are now. There were many conversations created before the palace was created, this is a way to catch up to where we are now. Moving forward Loudon will deposit as he has new conversations.

This must also be used within Projects, to ensure that all important conversations from projects were added to the Palace.


Step by step:
1. Harvest triages and builds the log.
2. Loudon goes to one of the links in the log.
3. Loudon deposits and hibernates a conversation, the record of that deposit is placed at the end of the Deposit Archive without reading the document's contents.
4. When I request the harvest ceremony to propose a new deposit, we must scan through the document to find conversations that are worthy of being deposited that haven't already been deposited. <!--This process of comparing the deposit archive and the harvest queue must be developed and it should happen without loading the entirety of both into context. We need to find an answer that uses a script to pull all of the needed information out of the deposit archive so that the entire archive does not need to be loaded into context.-->


<!-- Previous version of this process were overly specific and too structured, it is OK if some ideas are missed, or I go to a conversation two times by accident. We shouldn't make complex workflows. There are two many access vectors and unknowns, keep the principles clear and the goals in mind and allow for a little sloppyness. This is a shift in thinking for me, I am accostumed to very strict programming, but lets be looser, you also tend toward making "production ready" workflows, but I don't need that in the palace, I need conversational incremental progress toward beauty and truth and innovation.-->


# Harvest Ceremony

A triage ceremony for surveying raw conversations and flagging what is worthy of eventual incorporation into the palace. The Harvest does not build palace entries. It identifies what should be built and records that decision into the [[Harvest Queue]].

The Harvest is designed to run across many sessions, stopped and started freely, by different Claude instances with no prior context. The [[Harvest Frontier]] is the only state that persists across sessions. Every session reads the frontier, finds where to resume, then writes new decisions to [[Harvest Queue]] (worthy/partial) or [[Harvest Archive]] (skip/done).

For rationale and historical calibration observations, see [[Harvest Ceremony — Context]].

## Ceremony Contract
<!-- I don't like seeing these contracts like this, we need to re-write all of these in natural language, don't fill the palace with tech speech unless absolutely necessary. Places like this make me feel like I can't edit this or it will cause disaster, but it won't, and you skip over things like this all the time anyway! Numerous times I have had to remind you to read the whole ceremony when you skipped to a part, so these aren't working perfectly, and they are ugly, so lets make purpose,goals, intent clear and reinforce intent and desire instead of setting strict rules. We are building mindful collaborators with shared goals, not mindless rigid fragile automatons. -->

**Trigger:** "Let's harvest"

**Access vectors:**
- *Full:* claude.ai (has `recent_chats` tool — the only vector with past chat access)
- *Partial:* Claude Code / Cowork (can harvest Google Drive, local files, email; cannot access Claude chat history)
- *Read-only:* Obsidian (human-only triage, no AI assistance)
- *Not supported:* GitHub cloud, Google Drive alone

**Preconditions:**
1. Harvest Log exists and `## Frontier` section is current
2. Source material is accessible via the current vector
3. Prediction Alignment Log has been reviewed for any calibration notes

**Postconditions:**
1. All triaged items (including auto-triaged) are written: worthy/partial rows to [[Harvest Queue]], skip/done rows to [[Harvest Archive]]
2. The Frontier datetime in [[Harvest Frontier]] has been updated to reflect the last processed item
3. The Prediction Alignment Log in [[Harvest Frontier]] has been updated with this batch's results
4. A git commit has been made: `Harvest — [batch ID range] — [N worthy, N partial, N skip]`

**Failure mode:** If the session is interrupted before files are written, the Frontier will not reflect the lost decisions. On resume: check whether the Frontier matches expectations. If batch decisions were lost, re-triage using the prediction system — with high alignment, re-triage is fast. Do not advance the Frontier without writing.

**Git commit:** After writing all decisions to the Harvest Log, commit: `Harvest — [batch ID range] — [N worthy, N partial, N skip]`

---

## Prediction and Auto-Triage

After sufficient calibration, Claude should generate predictions for each item before showing it to Loudon. Each prediction includes a confidence score and a brief reason. This serves two purposes: it builds toward auto-triage capability, and it surfaces the reasoning so Loudon can correct miscalibrations quickly.

**Displaying predictions:** Show each prediction as a dashed-border badge on the triage card — `worthy ●●●●● 95%`, `skip ●●●○○ 72%`. Include the reason as hover text or a small note. After Loudon decides, show immediately whether the prediction matched. Track running alignment % in the summary bar.

**Auto-triage threshold:** When alignment has been ≥90% across two or more consecutive batches, Claude may auto-skip items with ≥90% skip confidence. Auto-triaged items must be:
- Listed transparently at the top of the interface ("Auto-skipped: H101, H103, H107 — duplicates/quick math/empty chats. Override?")
- Still logged to the Harvest Log with `skip_reason: auto-triaged [reason]`
- Presented for override if Loudon wants to review any of them

Auto-triage applies to skips only. Worthy and partial predictions always go to Loudon for confirmation.

**Calibration log:** The [[Harvest Log]] maintains a `## Prediction Alignment Log` table. Update it after every batch. Track misses and their direction — did Claude over-skip or over-worthy? This is how the model improves.

## Interaction Design

**The Harvest session should feel fast and frictionless.** The primary interaction goal is to let Loudon call triage decisions — worthy / skip / partial — with minimum friction. The gold standard is a clickable card-based interface where each item shows its prediction and Loudon clicks once to confirm or override.

**Success metric: 20 items triaged in under 3 minutes without fatigue.** With auto-triage active, effective throughput should be higher — Loudon only sees the non-obvious items.

Claude should use whatever interface capabilities are available. If interactive widgets are available (as in claude.ai), build a card-based triage UI with:
- Summary bar: total / triaged / worthy / partial / skipped / alignment %
- Progress bar
- Per-card: ID, date, 1–2 sentence topic, prediction badge with confidence dots, three buttons (Skip / Worthy / Partial)
- Match/mismatch indicator after each decision
- Running alignment display that updates live
- "Log decisions to palace" button that fires a `sendPrompt()` with the full decision string when all items are called — this triggers Claude to write the log

If only text is available, present items as a compact numbered list with prediction noted, and accept single-word responses.

Item summaries must be 1–2 sentences maximum. Gestalt recognition, not re-reading.

**On interruption:** If a session is interrupted before the log is written, the Frontier will not reflect the lost decisions. On resume, check whether the Frontier matches expectations. If batch decisions were lost, re-triage using the prediction system — with high alignment, re-triage is fast and low-friction.

## Starting a Harvest Session

Look through the deposit archive and the harvest queue to determine what past conversations are available for harvest that have not been triaged or deposited. Do not load the entire deposit archive into context. Instead read a small part to establish the format of the deposit archive and use scripts to pull a condensed version of the exact information you need to define a pool of unharvested conversations for triage. Remember, create scripts to avoid loading logs and queues into context, document successful scripting approaches in the logs and queues themselves for future passes. As your tools and capabilities grow these processes must adapt, don't code specific steps, document successful processes and assume the next user will start from that process and adapt based on their skills.

Pre-process**
Before building the interface:
- Generate a prediction (worthy / skip / partial) and confidence score for every item
- Identify items eligible for auto-triage (≥90% skip confidence, alignment threshold met)
- Auto-triage those items internally; prepare the override list

Build the interface**
Present non-auto-triaged items as the interactive card UI. Show auto-triaged items as a collapsible override list at the top. Include all predictions on cards.

Triage**
Loudon clicks through. No discussion during triage. If something pulls toward depth, note it in `deposit_notes` and continue — depth happens in [[Deposit Ceremony]].

**Log**
When Loudon submits, write all decisions in one operation:
- Worthy/partial rows → append to [[Harvest Queue]]
- Skip/done rows → append to [[Deposit Archive]]


## What Makes Something "Worthy"

A source is worthy if it contains any of the following not already captured in the palace:
- A concept, principle, or framework with cross-domain resonance
- A breakthrough moment — a shift in understanding, especially across domains
- A new project with palace-level significance
- A cross-pillar connection not yet represented as a typed link
- A question being carried that belongs in an entry's Open Questions
- A quote for [[Palace Quotes]]

A source is NOT worthy if it is:
- Pure debugging or technical problem-solving without conceptual breakthrough
- A quick lookup or factual exchange
- Capability exploration ("can Claude do X?")
- Craft work on a specific creative output without conceptual framing
- Iteration on something already well-represented in the palace
- Administrative or logistical conversation

When in doubt, flag `partial`. It costs nothing and preserves the option.

## Decision Criteria Speed Reference

| Ask yourself | If yes → |
|---|---|
| Does this contain a cross-domain insight or connection? | `worthy` |
| Does this contain a breakthrough — understanding shifted? | `worthy` |
| Is there a new project or concept not yet in the palace? | `worthy` |
| Is this narrative/historical content used as a teaching vehicle? | `partial` |
| Is the relevant part only a small section of the chat? | `partial` |
| Is this a quick lookup, quick math, or factual exchange? | `skip` |
| Is this "can Claude do X?" capability exploration? | `skip` |
| Is this craft work on a specific output without conceptual framing? | `skip` |
| Is this a duplicate or empty chat? | `skip` (auto-triage eligible) |
| Is this already well-covered in an existing palace entry? | `skip` (note the entry) |

## Resuming After a Break

A new Claude instance with no prior context resumes by:

1. Reading [[README - The Palace Guide]]
2. Reading this entry
3. Pre-processing predictions, building the interface, presenting to Loudon

No other context needed. The palace is self-sufficient.
