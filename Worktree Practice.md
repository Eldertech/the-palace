---
title: Worktree Practice
type: practice
pillars:
  - tools
  - practice
born: 2026-06
stage: growing
last_activated: 2026-06
activation_count: 1
forward_vector: "I keep every line of work on its own HEAD so no agent's commit lands on another's branch, and I teach each ceremony to reach back to the trunk for canon. I want to grow from a git convenience into the palace's default posture on parallel work — a swarm of isolated hands, one convergent trunk."
links:
  - target: "[[Deposit Ceremony]]"
    type: connects-to
    label: "routes-canon-home"
  - target: "[[Baton Ceremony]]"
    type: connects-to
    label: "carries-my-coordinate"
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: "shares-one-write-path"
  - target: "[[SCHEMA]]"
    type: connects-to
    label: "honors-one-write-path"
  - target: "[[The Dichotomy of Control]]"
    type: mirrors
    label: "own-HEAD-own-control"
  - target: "[[Closing Well]]"
    type: connects-to
    label: "close-before-teardown"
---

# Worktree Practice

For any sustained, commit-producing work in the palace, spin up an isolated **git worktree** — its own branch, its own HEAD, its own directory — before starting, rather than working in the shared primary checkout. The machinery lives in `_ops/worktree/` (`new-worktree.mjs` + the `symlinks.json` manifest + `SKILL.md`): a worktree is created with `node _ops/worktree/new-worktree.mjs --name <branch> --profile <p>` and torn down with `--remove`.

## Why it exists

Born 2026-06-16, after a concurrent agent switched the shared working tree's branch out from under an in-progress session and a commit landed on the wrong branch. Two failure modes, two fixes:

- **Branch thrashing.** Many agents sharing one checkout switch its branch continuously; a commit lands on whatever branch HEAD points to *at commit time*. An own-worktree has its own HEAD — immune.
- **Missing tooling.** A fresh worktree holds only *tracked* files, so the 16 GB gitignored `_tools/` (ComfyUI venv + weights) is absent. The companion practice — symlinking the heavy/secret state back from the canonical owner — fixes that without a re-download. Profiles (`docs`, `shop`, `blueline`, `stigmergy`, `full`) pick the smallest symlink set that fits the work.

## The primary is the canon trunk

A branch lives in only one worktree at a time, so `main` is checked out in exactly one place — the **primary checkout** (the same canonical worktree the symlink manifest calls the *owner*). That makes the primary the only path by which canon can reach `main`. The standing rule: **the primary stays permanently on `main` — no agent ever `git checkout`s it; if you need a branch, you make a worktree.** This is the worktree practice's own telos — when everyone works in their own worktree, nobody thrashes the primary, and it stays on `main` by itself. *Recovery,* for the transitional case where the primary *has* been thrashed off `main`: restore it, or land the commit on the `main` ref via a throwaway-worktree cherry-pick, **before** writing canon — never commit canon blind.

## How the ceremonies live here

A worktree isolates HEAD, which is exactly what makes canon and coordination need a rule: **canon and coordination always write to the trunk (the primary, on `main`); in-progress work lives where it lives.**

- **[[Deposit Ceremony]]** is canon, and canon is `main` — so a deposit always writes its entries and weave_flags to the trunk and commits there (`git -C "<owner>"` when the session runs in another worktree), regardless of which worktree the conversation ran in. The commit body *is* the record (`Palace-Kind: deposit`; the [[Deposit Archive]] is frozen, no row to append). A deposit never strands canon on a feature branch.
- **[[STIGMERGY]]**'s blackboard is a tracked, append-only file; per-branch copies fragment and merge-conflict, so every worktree **appends to the trunk's physical file**. This keeps the stigmergic field one shared field and *satisfies* [[SCHEMA]] §9's one-write-path rather than breaking it. (The Deposit Archive is no longer appended to — it is frozen; a deposit's record is its commit.)
- **[[Baton Ceremony]]** is the opposite case: a baton continues *in-progress work*, which legitimately lives on a feature branch. So a cross-worktree baton carries a **worktree coordinate** (branch · dir · profile) and must be announced on the trunk's board — the only globally-visible rendezvous.
- **The [[STIGMERGY]] server** writes to whichever board its launch checkout resolves to (`PALACE_ROOT`, else the checkout root). A server run *in a worktree* is for **developing/testing the app** — local throwaway board, never merged — while **real coordination runs on the primary** (root auto-resolves to the owner) or with `PALACE_ROOT=<owner>`. This is the seam where the worktree `node_modules` auto-mirror meets the canon-trunk rule: the mirror makes the app *runnable* in a worktree; the rule keeps *real* coordination on the trunk.

## Closing a worktree well

A worktree has a lifecycle, and teardown is a *close* — the same boundary [[Closing Well]] is about, in a new register (branch + directory, not session + instance). `--remove` is symlink-safe and `--delete-branch` **safe-deletes** (`git branch -d`, refusing to drop commits not merged to the trunk; `--force-delete` is the deliberate-discard escape), but the tool only guards *mechanical* loss. The close itself is yours: before tearing down, is the canon committed to the trunk, the in-progress move merged / cherry-picked / **batoned** (with its worktree coordinate), the lost branches parked in their owning entries, and the unverified named? A teardown that drops an unmerged thread with no punchlist is a failed close. And the canon-trunk rule is itself [[Closing Well]] at the branch boundary: canon stranded on a feature branch is work the next person, sitting on `main`, cannot pick up.

## The resonance

A worktree is [[The Dichotomy of Control]] in git: your own HEAD is the one thing fully yours, immune to what other agents do to the shared trunk. The practice draws the Stoic line — act within your worktree (*prohairesis*), converge on the trunk (the shared *fortuna* of canon) only deliberately.

## Forward Vectors

- Name the still-missing canon: is the 2026-06-16 branch-thrashing incident that birthed this worth its own breakthrough entry, or does it live well enough in machinery + memory?
- Watch whether a scheduler ever picks up cross-worktree batons from the trunk's board automatically — the announcement convention is built for that future ant.
- ✓ **Happy path verified 2026-06-17** (end-to-end run from a real `stigmergy`-profile worktree): owner-resolution from the worktree landed on `main`; the worktree's board was a separate inode (the fragmentation risk is real, so "append to the trunk" is earned); the `PALACE_ROOT` server seam resolved worktree-vs-owner as designed; the `node_modules` auto-mirror covered all 5 workspace dirs; teardown unlinked all 6 owner-pointing symlinks with the owner's install intact. *Untested edges:* two deposits racing the owner's index at once, and the thrash-recovery path (committing canon when the primary has been knocked off `main`).
- Enforce vs. trust (partly answered): teardown now *embeds* a [[Closing Well]] guard — safe-delete (`-d`) refuses to strand unmerged work, a footgun removed without a procedural gate (2026-06-17). Still open at the other end: should a hook also refuse to leave the *primary* off `main`, or is discipline enough there?
