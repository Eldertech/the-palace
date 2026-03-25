---
title: "Harvest Ceremony — Context"
type: practice
pillars: [practice, tools]
born: 2026-03
last_activated: 2026-03
activation_count: 2
stage: growing
links:
  - target: "[[Harvest Ceremony]]"
    type: emerged-from
  - target: "[[Deposit Ceremony — Context]]"
    type: connects-to
  - target: "[[Deposit Archive]]"
    type: connects-to
  - target: "[[Oblique Portrait Method]]"
    type: deepens
---

# Harvest Ceremony — Context

The rationale, design history, and best practices behind the [[Harvest Ceremony]]. Read during Weaves, Schema Ceremonies, and when designing a new harvest — not during routine sessions.

---

## The Oblique Harvest — Best Practice (2026-03)

The most effective harvest Loudon and Claude have run used the [[Oblique Portrait Method]] applied to a large archive of conversations. Rather than reading each conversation carefully in sequence, the approach was:

**Present candidates as a fast game.** A card interface with quick signals — "burns bright," "deposit seed," "skip" — let Loudon respond from intuition rather than analysis. Interactive buttons replaced careful deliberation. The pace was fast. The music was on. The session felt like sorting through a record collection, not auditing a database.

**Results from three rounds (2026-03-23 to 2026-03-24):**
- Round 1 (Cowork session): 250 cards, 94 conversations, 36 deposit seeds, 59 "burns bright," 12+ new palace entries, 5+ enrichments
- Round 2: 300 cards, 86 conversations, 23 deposit seeds, 68 "burns bright," 13 new entries, 7 enrichments
- Round 3 (final): 90 cards, 35 conversations, 5 deposit seeds, 4 new entries
- Total: 640 cards reviewed. All past Claude conversations exhausted.

**Why oblique works better than direct:** A direct item-by-item audit asks Loudon to hold the whole palace in mind while evaluating each conversation, which is cognitively expensive and produces fatigue. The oblique approach asks Loudon to signal a felt sense — does this burn? — which is fast and accurate. Precision happens in the [[Deposit Ceremony]], not the harvest. The harvest's job is sorting, not analyzing.

**For future harvests:** Match the interface to the dataset. A new body of material (Google Drive documents, project archives, a new batch of conversations) may call for a different oblique game than what worked for the 2026-03 conversation archive. The principle holds; the specific mechanics should adapt.

---

## The Simplification (2026-03)

The harvest workflow grew too complex and started breaking under its own weight. An elaborate frontier/queue/archive split tried to minimize context window usage by maintaining many small specialized files, but this created brittleness: every access vector had slightly different capabilities, every ceremony had to know which files it could and couldn't touch.

The redesign simplified by trusting Claude's scripting abilities instead. Rather than pre-structuring all information into perfectly-sized files, the approach is now: use scripts to extract exactly what you need from large files, and don't build infrastructure to solve problems that scripting can handle more flexibly.

**What collapsed:** The Harvest Frontier (live state tracker), the Harvest Queue (pending deposits list), and the Harvest Archive (decision log) were three files doing the work of one. The Frontier and Queue are now composting. The Archive was renamed the [[Deposit Archive]] — a more accurate description of what it actually is.

**What remains:** The [[Deposit Archive]] as permanent record. Everything else is session-specific and can be created fresh each time.

---

## The Log Split (2026-03, now superseded)

Before the simplification, the original single `Harvest Log.md` was split into three files when it grew too large to load in full. This solved the context window problem but created coordination overhead. Documented here for historical reference.

The split structure was:
- Frontier — live state, where we left off
- Queue — pending deposits
- Archive — completed decisions

This worked for a time, then the overhead of coordinating three files across different access vectors became its own problem. The simplification resolved it.

---

## The Hibernation Absorption (2026-03)

The Hibernation Ceremony existed to solve one problem: deposit threads running in past conversation contexts couldn't safely write to palace files. It invented `_hibernation_queue/` as an intermediate step. Once the queue system simplified, the hibernation queue became unnecessary and was folded into the [[Deposit Ceremony]] closing steps. The closing note ritual — writing a resting-place marker into the conversation thread — was retained as genuinely valuable.

---

## Calibration Notes from 2026-03 Harvest

These notes emerged from the initial full harvest and are relevant for calibrating future ones:

- Narrative-as-pedagogy content: flag as partial, not skip — even if the pedagogical frame is the main value rather than the content
- Aesthetic craft output without a new framework: partial, not worthy
- Capability exploration ("can Claude do X?"): skip unless something unexpected happened
- Multi-topic chats that drift between domains: partial — deposit the best thread, flag the rest
- Auto-triage reached 95–100% alignment after batch 3, meaning Claude's intuition calibrated well with Loudon's after ~60 items

---

## Design Principles

When evaluating future changes to the harvest/deposit architecture:

- **Prefer scripting over structure.** New log files add coordination cost. Scripts that extract what you need from existing files add capability without overhead.
- **Ceremony context budgets are real.** A deposit thread in a rich conversation cannot load large palace files without crowding out the conversation itself.
- **Workarounds name real problems.** When a workaround accretes its own ceremony, that is a signal the underlying problem should be solved rather than managed.
- **Oblique before direct.** A fast game surfaces more genuine signal than careful sequential review. The deposit is where depth happens; the harvest is where sorting happens.

## Forward Vectors

- When the next harvest begins, what dataset is it? Google Drive? A new batch of conversations? Project archives? The answer shapes the oblique game.
- Should the [[Deposit Archive]] eventually have internal organization — by year, by pillar, by source type? Only worth solving when querying it manually becomes genuinely hard.
- Is there a harvest that works on the *palace itself* — finding entries that are underlinked, understaged, or contain unrealized connections? That would be a kind of internal harvest, distinct from the external archive harvest.
