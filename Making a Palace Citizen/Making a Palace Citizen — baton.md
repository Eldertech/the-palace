---
title: "Making a Palace Citizen — baton"
born: 2026-07-02
links:
  - target: "[[Making a Palace Citizen]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress move on [[Making a Palace Citizen]] across a session boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

# Baton: Making a Palace Citizen

## Move
Run the first **Eno↔Cage Dialectic** — a live, isolated two-voice enchantment — to validate the citizen voice-fidelity work now that both citizens are source-checked.

## Why this move matters
It's the last unrun validation of the whole citizen model, and the *only* test that exercises both halves at once: whether the bodies produce **distinct, opinionated** voices AND whether the new source-checked `## Voice` notes + speech files make them **sound like the real people**. It's also the canonical demo before the ~16-entry rollout. Accuracy is the through-line of this entire arc — treat a live, faithful Dialectic as the proof the method works, not a formality.

## Tried and rejected (negative space — don't re-walk these)
- **Author-run inline cast-tests** were done as a stopgap and are NOT a substitute: one agent voicing both sides leaks (the enchantment spec's "leakage problem"). Use true isolation — separate subagents, coordinator routes only OUTER.
- **First-person body rewrite** (making the entry itself talk as the person) was weighed and rejected: it launders invention as the person's own words and kills the blindspot's outside view. Body stays third-person; voice lives in `## Voice` + speech.
- **WebFetch** is gated by the same classifier that gates Agent spawns; use **WebSearch** (it stayed up all session) if you need to verify anything.

## Current state (all committed on main — nothing half-written)
- 11 citizens built; **Eno & Cage fully voice-equipped**: body (5 beats + blindspot), seed frontmatter + agency_profile, dossier, a `## Voice` note, and a **source-checked** `[Name] — speech.md`.
- The two speech files were just independently verified — 2 real misattributions caught and fixed (Eno's screwdriver line → AA School of Architecture, not the John Peel Lecture; Cage's Kant line de-conflated from the 1960 broadcast). Key commits: `b64ec59` (pilot), `ec908ea` (method+enchantment standardization), `c1a39cf` (source-check).
- The Eno↔Cage Dialectic sits at the **top of the lab's experiment queue**. Unstarted.

## Next move
Follow [[Palace Enchantment]] → "True Multi-Agent Isolation" + "Voice Embodiment (person citizens)". Spawn two Sonnet subagents, each embodying the *person*, each loaded with its full entry + dossier + speech file + `## Voice` note and ONLY the other's YAML frontmatter. You (coordinator) route only OUTER messages; each turn is INNER (private) + OUTER; open both simultaneously, then ~4 exchange turns. The tension: Eno "lets the system run" but curates everything by taste; Cage removes intention with chance and would call that curation "the ego sneaking back in" — is generative art choosing well and calling it emergence, or genuinely getting out of the way? Close with each agent's post-dialogue artifact (what I learned / forward_vector revision / link change). Then judge: distinct AND faithful to real speech? Blindspots caught without collapsing? Propose write-backs (Loudon approves), archive the transcript at root (like `Spinoza and Meadows on the Threshold.md`), and log the result in the lab context file.

## Calibrations from this session
- **A Dialectic is OFF-THE-CUFF** — lean to each man's *conversational* register, NOT the rehearsed stage lines (Eno's garden/screwdriver are stage signatures; his real talk is warm, digressive, thinking-out-loud. Cage is soft, gentle, laughs easily, reframes the question rather than answering it). The speech files' "sources & their limits" ledgers tag rehearsed vs spontaneous vs fabricated — obey them.
- **No fabricated quotes, ever.** One source misleads; triangulate. This session caught a fake-Marcus quote and two misattributed Eno/Cage lines — that discipline is the point.
- **Agent-spawn classifier was intermittently down** — if a spawn errors "opus-4-8 unavailable," just retry; Read/Write/WebSearch are unaffected.
- **Shared multi-agent working tree:** verify branch before/after, stage files EXPLICITLY (never `git add -A`), check for foreign staged files. End commit messages with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. The commit-msg hook prints "non-spec commit annotated … not blocked" — ignore it.
- **Write-back is Loudon's call** — citizens propose forward_vector/link changes; he decides.

## Load these files first
1. `Making a Palace Citizen.md` + `Making a Palace Citizen/Making a Palace Citizen — context.md` (method + the lab queue that names this test)
2. `Palace development/Palace Enchantment.md` — the isolation architecture + the Voice Embodiment step
3. `People/Brian Eno.md` + its `— dossier.md` + `— speech.md`
4. `People/John Cage.md` + its `— dossier.md` + `— speech.md`
5. `Spinoza and Meadows on the Threshold.md` — a prior Dialectic + the archive format

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
*Identical in every baton. It rides along because the catching Claude loads the
baton and the entry, not this ceremony — so the catcher's obligations live where
the catcher will see them. Omit nothing here.*
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive Step 6 relies on.
3. Mark it caught: remove the "Active Baton" section from the parent entry; for a board-announced baton with no parent entry, post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id) instead.
4. Delete the baton file (git is its archive). On a surface that can't delete (Cowork), remove the marker and note "deletion pending."
5. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — for a worktree, check `git worktree list` and recreate it (`node _ops/worktree/new-worktree.mjs --name <branch> --profile <p>`) if it is gone. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
6. Act on the move, holding the calibrations above. Steward batons are the exception — updated in place, never deleted.
