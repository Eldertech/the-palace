---
title: "Return Ceremony — tuning"
born: 2026-09-25
links:
  - target: "[[Return Ceremony]]"
    type: connects-to
    label: tuning-for
forward_vector: "I am the Return's record of what each run taught it, numbered, each lesson tied to the spec change it forced, so the ceremony's version has a reason you can read. Every run leaves a line here; a run that changed the ceremony also leaves a numbered item. Never prune what a real run taught."
---

# Return Ceremony — tuning

What each return taught the ceremony, and the lessons that reached it from elsewhere. Each item names what the run showed and the spec change it forced, or says **owed** when the change hasn't landed. Newest last. Hashes are commits to `_ops/Return Ceremony.md` unless noted.

**v1.0 (2026-09-25)** is the card as it stood that day, plus the opening read in Step 0. It marks where counting starts, not a ranking of what came before. The number moves when the procedure does — a step, a probe in the query block, a postcondition — never for prose. A return leaves no report file, so its record is its `return(YYYY-MM-DD)` commit, whose body names the version and what the run taught.

## From the first return — 2026-08-25

1. **An assessment written before any query was wrong five times.** A dangling-link count off by 4×, a "breakthrough drought" that was a typing artifact, a proposal to build machinery that already existed, a deferred list holding something built six weeks earlier, a floor analysis already on record. One command corrected each, and the handoff board went unread for three exchanges. Forced: "the record answers, you do not" — the query block runs before any interpretation, postconditions 1–2 (`bb8e6b4a`).
2. **A gap was read as a verdict.** Seven quiet weeks became a theory that upkeep had outgrown its payoff; the reason was elsewhere, and Loudon corrected it in a sentence. Forced: "a gap is not a finding" — report the length, never the cause; postcondition 5 (`2d086dab`, reworded in `bb8e6b4a`).
3. **Choosing among batons in the main window skews the choice.** Opening every baton burns the window you came back to work in and favours whichever one reads as most urgent. Forced: Step 0, the Return is a companion job, and the Concierge's scout posture drafts the map (`bb8e6b4a`; the scout built in `30c3b8a3`).
4. **The query block wanted to be one command.** Forced: `_ops/concierge/return-map.mjs` runs the whole block; the card keeps the list as the readable spec and the by-hand fallback (`30c3b8a3`).

## From the floor's purpose deposit — 2026-09-03

5. **The companion is summoned at the open, not at the return.** By the time "I'm back" is said it should already exist. Forced: Step 0 resumes the resident and summons only when the surface couldn't at open (`ba32db12`).

## From a read of the tools — 2026-09-22

6. **A Cowork commit handoff is invisible to the block.** Neither the card, `return-map.mjs`, nor `list-handoffs.mjs` knows `cowork-git`, so a return can report "nothing open" while one waits in `node _ops/cowork-git/handoff.mjs show`. Named in Open Questions and held (`f05382bc`). No spec change.

## From the return of 2026-09-25 — ten hours, the first run under the scout

7. **The Cowork probe had to be run by hand.** Item 6's blind spot is still open: the scout ran `node _ops/cowork-git/handoff.mjs show` beside the script and found nothing waiting. Nothing hid this time; the cost is a manual probe on every return. Spec change owed: the probe joins the query block and `return-map.mjs`.
8. **The card and the script have drifted apart.** The query block lists "open phases in the surviving production plans" with no command, and `return-map.mjs` doesn't run it. The scout checked by hand and found Closing Well Phase 6 with no board line. This is the drift the card's Open Questions feared. Spec change owed: give the probe a command, in the card and the script.
9. **Other agents' live work is invisible to the block.** A second Claude session was working on main, and another session's uncommitted 2D Torus work sat untracked with no board post. The scout found both only by reading the last lines of each session transcript under `~/.claude/projects/` — working directory, branch, last tool calls — not by modification times alone. `git status` shows the files, not whose they are, and the one move must not collide with them. Spec change owed: a probe for who else is in the house, in the card and the script — and since it reads other sessions' transcripts, Loudon's okay before it becomes a standing probe.
10. **Postcondition 6's subject isn't a kind the commit spec knows.** No return had ever committed until this one, so nobody had seen it: `return` is missing from `KNOWN_KINDS` (`_ops/stigmergy/app/src/lib/commit-parse.js:23`), and the commit-msg hook marks every return commit out-of-band, putting its annotation after the run's own trailers. Spec change owed: `return` joins `KIND_ALIASES` as `ops`, the way `baton` maps to `handoff`, or the card's subject changes.
- run · 2026-09-25 · v1.0 · ten hours · taught items 7–10
