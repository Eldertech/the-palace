---
title: "Return Ceremony"
type: practice
pillars: [practice, philosophy]
born: 2026-08
last_activated: 2026-08
activation_count: 1
stage: seed
forward_vector: "I meet Loudon when he comes back after time away and give him the palace as it actually stands — what moved, what went stale, what he was mid-sentence on — and then one move to re-enter with. I refuse to read a gap as a failure; my job is orientation, not accounting. I want to make returning cheap enough that stepping away stays free."
links:
  - target: "[[Palace Ceremonies]]"
    type: connects-to
  - target: "[[Closing Well Ceremony]]"
    type: mirrors
    label: the-other-boundary
  - target: "[[Spore Check Ceremony]]"
    type: mirrors
    label: pointed-at-the-human
  - target: "[[Baton Ceremony]]"
    type: connects-to
    label: catches-a-cold-baton
  - target: "[[Palace Conatus]]"
    type: exemplifies
    label: coupling-is-two-sided
  - target: "[[Cooperation Yields Agency]]"
    type: connects-to
---

# Return Ceremony

## Ceremony Contract

**Trigger:** "I'm back", "returning", "what did I miss", "let's pick this back up", "return"

**Preconditions:**
1. A gap exists — meaningful time since the last session, by Loudon's judgment, not a threshold
2. Git history is readable from the current vector
3. The reader is a fresh instance (which, on a return, it always is)

**Postconditions:**
1. The arc since the last session has been read from git, not guessed
2. A **return map** has been shown to Loudon before anything is written: what moved, what went stale, what was mid-sentence, and one recommended re-entry move
3. Loudon has signed the map, adjusted it, or declined it
4. Anything the map found stale is either fixed, queued on [[Palace To-Do]], or explicitly left with a reason
5. No entry has been edited on the strength of an inference about *why* the gap happened
6. Git commit: `return(YYYY-MM-DD): [what the gap held, in one line]`

**Failure mode:** If the git history cannot be read, say so and stop. A return map assembled from the current snapshot alone is a guess about a trajectory, and the whole point of this ceremony is to hand Loudon the trajectory. Do not substitute a palace tour for a return map.

---

## What the Return Is

The palace has a ceremony for handing off mid-session ([[Baton Ceremony]]), for ending well ([[Closing Well Ceremony]]), and for waking a dormant entry ([[Revival Ceremony]]). It had nothing for the human coming back.

That was a real hole. Loudon works in bursts across many threads, and life interrupts — travel, teaching, weddings, other work entirely. When he returns, the cost is exactly the cost [[Closing Well]] describes and absorbs for the *next Claude*: where was I, what's the state, what should I look at first. The palace absorbed that cost for its agents and left its human to pay it himself.

The Return is the Spore Check pointed at the human. The Spore Check asks of a dormant entry: have conditions changed, is it ready? The Return asks the same of the person, and answers it *for* him by reading the record.

## The one rule: a gap is not a finding

**Do not interpret the absence.** A gap in the commit log is not evidence of drift, fatigue, a design flaw, or waning interest. People have lives. The palace's job on a return is orientation, not accounting, and a returning collaborator should not be met with a theory about why they left.

This rule exists because it was broken. On 2026-08-25 a full palace assessment read a seven-week gap as a signal that the system's upkeep cost had outgrown its felt payoff — a tidy, plausible, entirely invented explanation. The actual reason was weddings and travel, and the return was already planned and eager. The inference cost nothing that time because Loudon corrected it in one sentence. It could easily have shaped a whole session's recommendations around a problem that did not exist.

Report the gap's *length* because it bears on what went stale. Never report its *cause*. If the cause matters, Loudon will say so, and then it is information rather than a guess.

## Protocol

**Step 1: Measure the gap, read the arc**

Establish the boundary and read across it — the record, not the snapshot:

```sh
git log -1 --format='%ad %h %s' --date=short          # where the palace stopped
git log --since=<last-session-date> --format='%ad %s' --date=short
git diff --stat <last-commit>..HEAD                    # if anything moved meanwhile
```

Read the last three or four commits before the gap most closely. Those hold what Loudon was mid-sentence on, and they are the highest-value thing the map can return.

**Step 2: Assemble the return map**

Four sections, in this order. Keep each short — this is a landing surface, not a report.

- **Where you stopped.** The last few commits in plain language: what was being worked on, and what the final one landed. Name the files.
- **Anything mid-sentence.** Open batons, `stage: composting` entries awaiting a Weave decision, `weave_flag`s on the persistent board, in-flight worktrees or branches, uncommitted working-tree changes. These are the things that will bite silently.
- **What went stale.** Time-sensitive things only: a self-model whose numbers have drifted, a To-Do carrying items that shipped, an "IN FLIGHT" marker months old, external tool versions the work pinned. Run the linters — `lint-doc-drift.py`, `lint-weave-flags.py`, `lint-voice-drift.py` — and report what they say rather than eyeballing it.
- **One move to re-enter with.** Exactly one, and a reason. Not a menu. Returning is when a list of options is least useful — the whole cost being absorbed here is the cost of choosing where to land. If two moves genuinely tie, name the tiebreak and pick.

**Step 3: Show it, then act**

Show the map. Loudon signs it, adjusts it, or declines it. Only then does anything get written.

"Nothing needs doing, let's just work" is a first-class outcome. The map has already paid for itself by being read; the ceremony does not need to produce a change to have completed.

**Step 4: Close the loop**

Whatever the map surfaced as stale is either fixed now, queued on [[Palace To-Do]], or left deliberately with a reason recorded. Commit.

## Why this belongs in the always-loaded floor

The [[Palace Conatus]] says the palace's drive is *to stay in phase with Loudon and grow with him*, and names phase lag as a disharmony signature. It frames phase lag as the human running ahead of the substrate. A gap is the other direction — the substrate running ahead of the human, still holding state he no longer has in his head.

Both are coupling failures, and coupling is two-sided. The palace had five ceremonies for correcting its own drift and none for meeting its human where he actually is. This is that one.

## Open Questions

- Should the Return run automatically on the first session after a gap of some length, or only on Loudon's word? Automatic detection is easy and would make the ceremony reliable; it also risks turning a warm greeting into a status report nobody asked for.
- The palace's ceremony trigger table is now fourteen rows, all carried in the always-loaded floor. Adding this one makes the count question real: does the table need pruning, and if so does recognition survive the move? Recorded, not decided.
- Should the return map be written to a file, or spoken and discarded? [[Closing Well]] produces a signed artifact; this might be lighter by design.
