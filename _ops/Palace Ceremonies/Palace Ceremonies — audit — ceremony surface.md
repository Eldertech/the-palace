---
title: Palace Ceremonies — audit — ceremony surface
born: 2026-09-04
links:
  - target: "[[Palace Ceremonies]]"
    type: connects-to
    label: audits
forward_vector: "I hold the verified list of what is currently broken in the ceremony surface, each defect with a file:line anyone can open — and I shrink as they get fixed, ending empty."
---

# Palace Ceremonies — audit — ceremony surface

A standing register of defects in the ceremony surface, verified 2026-09-04. Every finding carries a pointer; open it, fix it, delete the row. The proposal at the bottom is the one structural move the rest of the list argues for.

The organizing test, and the one worth keeping even after the list empties: **is this reachable by the reader who needs it, at the moment they need it?** None of these is a knowledge failure — the palace knows all of it, correctly, somewhere. It is a reachability failure. The committer passes the test because it derives its trailers; the gotcha ledger fails it because nobody reads 30KB at the moment of decision.

## The measure

| file | size |
|---|---|
| `_ops/Deposit Ceremony.md` | 22.1KB — trimmed to 10.8KB in March 2026, regrew 105% |
| `Closing Well.md` | 31.1KB |
| `_ops/Closing Well Ceremony.md` — the "thin card" | 8.4KB |
| `Closing Well/Closing Well — gotchas.md` | 30KB, 23 traps |

Full spec surface to run one close plus one deposit: roughly 39K tokens, larger than the auto-loaded floor, read by the most spent instance in the building. Invocation is not the problem — 16 closes across 12 working days. What fails is what they guarantee.

The growth is structural, not sloppy: one trap now writes itself into the ledger, the card, *and* the practice entry. Three copies per failure, none ever removed.

## The standard already in the building

Two documents to restore toward rather than invent past.

**The Ceremony Reader** (`_ops/Palace Ceremonies.md`) is the palace's own quality test — read as gardener, traveler, poet; *"a good ceremony reads like a letter from someone who has done this before… it doesn't over-specify the route."* By that standard the Walk, Spore Check, Revival and Map Build have not drifted. Deposit and Closing Well have.

**The Return Ceremony** is the best-aligned ceremony document and the newest. It carries the rule the others need — the record answers, you do not; every row cites a command or a `file:line` — plus *a gap is not a finding*, *nothing needs doing is a first-class outcome*, and the line that is the range test already written: **a ceremony whose protocol is only executable is a ceremony a human can no longer audit.**

## Defects — verify, then fix

**Prose has roughly a zero adherence rate here; tools have a high one.** The committer produced 81 self-classifying deposit commits; `lint-baton-footer.py` caught a checklist stale seven weeks. The paragraphs did not take. Each defect below is a paragraph doing a tool's job, or a tool that cannot answer the question the paragraph asks it.

### Verification that cannot verify

- **`Palace-Verify` is typed by the agent.** The one field that exists to prevent self-report is a self-report. `_ops/Deposit Ceremony.md:253` — *"Then set `--verify verified` honestly."*
- **Step 7c's linters cannot be scoped to files.** `_ops/Deposit Ceremony.md:248` says run five linters "over the new files." Four of the five take no file argument; only `lint-bundle-hygiene.py:141` has `--paths`. `lint-link-directions` reads the newest map JSON — `_ops/maps/palace-map-full-2026-08-26.json`, which contains no node for anything deposited since. A "clean" report there is the tool being structurally unable to see the work.
- **Fifty false positives are the baseline.** `lint-doc-drift.py` returns 0 errors and 52 warnings on every run; 50 are W0 broken-path claims, mostly relative paths resolved against the wrong root. A check that reports fifty problems every time can never tell you a real one appeared.
- **`Palace-Resolves:` has one use, ever** — `fc2d89c` (2026-07-07), the commit that invented the rule. Zero since. Weave flags raised through the ceremony stay invisible to the board.
- **The Walk requires a surprise.** `_ops/Walk Ceremony.md:36` — postcondition 2 is "at least one unexpected connection or surprise has been named." A walk that found nothing has not completed, so it will name something. Same species as manufactured canon, smaller stakes — and it sits oddly beside `:73`, which grants that some walks produce no file changes at all.

### Stale and duplicated spec

Six documents describe the close: the card, `Closing Well.md` § Enchanted, `_ops/closing-well/README.md`, `dispatch.md`, `close-map-format.md`, `executor.md`. Three carried stale claims; two still do.

- `_ops/closing-well/close-map-format.md:129` — *"Deferred (Phase 5): the executors"*, two months after they shipped and were live-gated (`_ops/closing-well/README.md:144`).
- `_ops/Palace Ceremonies.md:77` — *"Recognition scaffold built (Phase 2); the Agent's full mechanism is being built."*
- **One artifact, two names.** `_ops/closing-well/close-map-format.md:1` calls it the **close map**; `_ops/Closing Well Ceremony.md:33,47` calls it the **reckoning + backstage checklist**. An agent looking for a backstage-checklist template finds neither.
- **The Deposit's opening block addresses a different surface.** `_ops/Deposit Ceremony.md:48–50` tells Claude its context is already full, not to pull the palace in, and to *fetch CLAUDE.md via the GitHub raw URL*. Written for a claude.ai window depositing a months-old thread; in Claude Code the palace is on disk and CLAUDE.md is already loaded. A literal reader fetches a file it is holding.

Keep `dispatch.md` (the runbook) and `Closing Well.md` (the why); fold `close-map-format.md`'s two live tables into the prompt that is their only reader. Collapse **duplicates**, keep **layers** — card and Context, reckoning and backstage, entry and bundle are the range test working, not redundancy.

### The ledger is an archive pretending to be a check

23 traps, 30KB, ~7.5K tokens, read cold at the most expensive moment. Its top failure — the spent instance talking itself out of dispatching the moderator — recurred four times regardless (gotchas 11 → 20 → 21 → 23). The ledger changed the documentation every time; no case is on record where it changed an outcome.

The numbering has already collided twice under many hands: two 12s (`Closing Well/Closing Well — gotchas.md:44` and `:48`) and two 13s (`:46` and `:56`).

**Make it a fix list.** A short curated set of live rules, rewritten when a trap recurs rather than appended — 11 + 20 + 21 + 23 collapse to one line: *dispatch the moderator; your reason not to is the tell.* The archive is the commit bodies, which already carry each close's full account. This is the move [[Deposit Archive]] already made when it became a view of the LOG deck, and it takes ~25KB out of what the moderator reads.

### The anti-ratchet rule, or it grows back

It grew back once already. Two clauses:

1. A trap earns a tool or one line; it earns prose only on its second occurrence.
2. A paragraph added to a ceremony card must name the paragraph it replaces.

That inverts the current default, which is prose immediately, in three places.

## The proposal — the four beats as the postcondition

CLAUDE.md § What You Are Here to Leave Behind now states the four beats: **look back honestly · decide together what's worth keeping · write only that · say plainly what you couldn't verify.** They are stated in the floor, at full context, to every arriving agent. The open call is whether they also become a **check**.

**The move, in two parts.**

*One — the four beats replace the bespoke postcondition lists across all thirteen ceremonies.* Today each card carries its own Completion Signal; the Deposit's is five items (`_ops/Deposit Ceremony.md:265–269`), two of which restate mechanism the committer and its linters already carry. If the beats are the literal postcondition, most of those lists are deletions, and the ceremonies stop each inventing a private definition of done. What survives per ceremony is only what that ceremony uniquely guarantees.

*Two — Deposit Step 4 leaves the card.* The deposit map's bullets (`_ops/Deposit Ceremony.md:134–140` — fold or mint, entry type, pillars, proposed stage, typed links, labels, tension map) are not the deposit's judgment. They are entirely the question *where does this go and what shape does it take*, which belongs to whoever holds SCHEMA — the [[Concierge]], addressed **before** drafting, because a finished draft argues for its own existence. Fold-or-mint is the case that proves it: minting is the drafter's cheap move (a blank file versus finding the seam in a long entry), so asking after the draft is asking too late. The Producer entry got held yesterday precisely because the companion was asked first.

What the Deposit card keeps is almost exactly the four beats: re-enter and look back honestly · decide with Loudon what's worth keeping · hand the placement to the companion · check what comes back and say what you could not verify. The card gets short because the expertise moved to where it is used — the destination is the reference half of SCHEMA, not the floor card.

**The argument against, stated at full strength.** Changing the postcondition of thirteen ceremonies is a structural commitment across thirteen files, close to Schema Ceremony weight (SCHEMA §5 lists adding or removing a ceremony as a ceremony-triggering change; redefining what *completion* means for all of them is at least that heavy). It risks flattening real differences — a Walk's completion and a Deposit's completion are not obviously the same object, and forcing them into one frame could produce the same "name a surprise or it didn't happen" pressure at larger scale. And it adds mechanism on the argument that mechanism is eating the work. The honest counter is that it is a net *deletion* of prose, and the tool-shaped fixes are the only lever that has demonstrably held here.

**The sequencing that follows from the evidence:** let the statement work first. Fix the ledger and the verify path — both are pure deletion plus one script, no new concepts. Then let the check earn itself.

## What is not settled

- **Does the deposit map's tension bullet change outcomes?** `tension` appears in 3 of 81 deposit commit bodies, `contradicts` in 2. A tension check can honestly run and find nothing, so this is suggestive, not proof — but a decision surface padded with items that rarely fire makes the two that do harder to see.
- **The deposit's slow re-entry pace was calibrated for a problem that mostly stopped.** The founding incident was depositing a months-old conversation Loudon had to re-inhabit. Nearly every deposit now is same-session. The ceremony does not distinguish the two cases, and the pace obligations read as ritual in the same-session one.
- **Deposit and close may be one practice.** [[Closing Well]] already says the deposit is a movement close and the session close the same thing at larger scale. If that is right, "deposit" is what the practice is called when the gesture is *keep* — and two documents with a shared spine is much of why the spec surface is what it is.
- **The load-bearing invention may be narrower than the apparatus around it.** Every catch on record — the companion's three catches, gotcha 22's cold read finding a rotted tracking home, gotcha 14's panel producing canon the transcript could not show — is one mechanism: **a reader who is not the drafter.** None was caught by the four gestures, the two-layer split, or the reckoning format. The panel is one implementation of that mechanism, and an expensive one.
- **`type: practice` on [[Closing Well]]** is worth re-examining against `hub` — its jurisdiction has widened. A Weave question, named so it does not get backed into.
