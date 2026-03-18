---
title: "Harvest Ceremony"
type: concept
pillars: [practice, tools]
born: 2026-03
last_activated: 2026-03
activation_count: 4
stage: mature
links:
  - target: "[[Deposit Ceremony]]"
    type: spawned
  - target: "[[Harvest Log]]"
    type: enables
  - target: "[[Substrate]]"
    type: deepens
  - target: "[[Cooperation Yields Agency]]"
    type: connects-to
  - target: "[[Mixture of Experts]]"
    type: mirrors
---

# Harvest Ceremony

A triage ceremony for surveying raw source material — conversations, documents, notes, files — and flagging what is worthy of eventual incorporation into the palace. The Harvest does not build palace entries. It identifies what should be built and records that decision persistently in the [[Harvest Log]].

The Harvest is designed to run across many sessions, stopped and started freely, by different Claude instances with no prior context. The [[Harvest Log]] is the only state that persists. Every session reads the log, finds the frontier, continues from there.

## The Two-Ceremony Design

The Harvest and the [[Deposit Ceremony]] are intentionally separate:

- **Harvest** — fast, gestalt, broad coverage. "Does this matter?" Momentum is the goal.
- **Deposit** — slow, surgical, one source at a time. "What exactly matters and how does it connect?" Quality is the goal.

Keeping them separate allows long harvest runs without getting pulled into depth, and focused deposit sessions without the pressure of coverage. The Harvest Log is the handoff between them.

## Prediction and Auto-Triage

After sufficient calibration, Claude should generate predictions for each item before showing it to Loudon. Each prediction includes a confidence score and a brief reason. This serves two purposes: it builds toward auto-triage capability, and it surfaces the reasoning so Loudon can correct miscalibrations quickly.

**Displaying predictions:** Show each prediction as a dashed-border badge on the triage card — `worthy ●●●●● 95%`, `skip ●●●○○ 72%`. Include the reason as hover text or a small note. After Loudon decides, show immediately whether the prediction matched. Track running alignment % in the summary bar.

**Auto-triage threshold:** When alignment has been ≥90% across two or more consecutive batches, Claude may auto-skip items with ≥90% skip confidence. Auto-triaged items must be:
- Listed transparently at the top of the interface ("Auto-skipped: H101, H103, H107 — duplicates/quick math/empty chats. Override?")
- Still logged to the Harvest Log with `skip_reason: auto-triaged [reason]`
- Presented for override if Loudon wants to review any of them

Auto-triage applies to skips only. Worthy and partial predictions always go to Loudon for confirmation.

**Calibration log:** The [[Harvest Log]] maintains a `## Prediction Alignment Log` table. Update it after every batch. Track misses and their direction — did Claude over-skip or over-worthy? This is how the model improves.

**Known calibration notes (from batches 1–4):**
- Narrative history used as a teaching vehicle (e.g., historical storytelling sessions) is more likely `partial` than `skip` — pedagogical framing elevates these above factual lookup.
- Sessions with cross-domain synthesis (control theory + filter theory + physics; optics + audio) are nearly always `worthy` — weight these heavily.
- Early "capability exploration" chats (can Claude do X?) are `skip` — they document Claude's historical limitations, not conceptual breakthroughs.
- Craft work for specific tracks or releases is `skip` unless it contains an explicit conceptual framing.
- Sessions producing interactive visualizations or tools should be checked for pedagogical methodology breakthrough, not just technical output.
- Craft/tool-building sessions with strong aesthetic output but no new conceptual framework → `partial` not `worthy`. Aesthetic achievement (CRT phosphor aesthetic, animated interface) is palace-adjacent but not a conceptual breakthrough unless it introduces a new design principle.

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

## Source Types

The Harvest begins with Claude chat history and expands over time to any source:

| Source Type | `source_type` value | How to Access |
|---|---|---|
| Claude conversations | `claude_chat` | `recent_chats` tool, oldest-first |
| Google Drive documents | `google_doc` | Google Drive search or direct fetch |
| Local files | `local_file` | Filesystem tools |
| Email threads | `email` | Gmail tool |
| Research notes | `research_note` | Any applicable tool |

New source types can be added as the palace grows. The [[Harvest Log]] schema accommodates any source type through the `source_type` and `source_ref` fields.

## Starting a Harvest Session

**Step 1: Orient**
Read the [[Harvest Log]]. Check:
- `## Frontier` — where to resume, what datetime to use for the next `recent_chats` call
- `## Prediction Alignment Log` — current alignment score and any calibration notes to load before predicting

**Step 2: Load**
Load the next batch from the frontier. For Claude chats: use `recent_chats` with `sort_order: asc` and `after` set to the frontier datetime. Batches of 15–20 items.

**⚠ Project scope constraint:** The `recent_chats` and `conversation_search` tools are scoped to the launch context. Conversations inside Claude Projects are invisible to a harvest started outside a project, and vice versa. To harvest project conversations, start a dedicated harvest session from within each project. If harvesting from within a Claude Project, record the project name in the `source_project` field of every log entry created in that session. Leave blank for conversations outside projects. Maintain a harvest log entry noting which projects have been covered and when.

**Step 3: Pre-process**
Before building the interface:
- Generate a prediction (worthy / skip / partial) and confidence score for every item
- Identify items eligible for auto-triage (≥90% skip confidence, alignment threshold met)
- Auto-triage those items internally; prepare the override list

**Step 4: Build the interface**
Present non-auto-triaged items as the interactive card UI. Show auto-triaged items as a collapsible override list at the top. Include all predictions on cards.

**Step 5: Triage**
Loudon clicks through. No discussion during triage. If something pulls toward depth, note it in `deposit_notes` and continue — depth happens in [[Deposit Ceremony]].

**Step 6: Log**
When Loudon submits, write all decisions (including auto-triaged items) to the [[Harvest Log]] in one operation. Update the Frontier datetime. Update the Alignment Log table.

## Stopping the Harvest

Any of the following ends a session cleanly:
- Loudon says "stop," "pause," or "that's enough"
- The batch runs out
- A deposit is triggered mid-harvest

On stop: update the Frontier, add a session row to `## Session History`, confirm the log is current.

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
3. Reading [[Harvest Log]] — Frontier section and Prediction Alignment Log
4. Loading the next batch from the Frontier datetime
5. Pre-processing predictions, building the interface, presenting to Loudon

No other context needed. The palace is self-sufficient.

## Open Questions

- As source types multiply, should each type have its own Harvest Log section, or stay flat?
- At what alignment level should auto-triage extend beyond skips to low-confidence worthy predictions?
- Should the Harvest ever revisit `skip` decisions as the palace grows and new entries change what's relevant?
- Is there a natural batch size that optimizes momentum vs. fatigue? (Current experience: 15–20 is good; fewer than 10 feels like too much overhead for too little coverage.)
