---
title: "Weave 2026-09-24 — substrate sweep"
born: 2026-09-24
links:
  - target: "[[Weave Ceremony]]"
    type: connects-to
    label: step-2-5
forward_vector: "I am the weave's read of git: what's uncommitted, dangling, unmerged or rewritten, each with a proposed disposition for Loudon to rule on. Nothing moves until he does."
---

# Substrate sweep — 2026-09-24 (main, read-only)

| Finding | What it is | Proposed |
|---|---|---|
| **14 uncommitted paths** | 13 in `Projects/Generative Sample Libraries/`, 1 in `_ops/stigmergy/`. The GSL steward's work in progress. | **leave**. It's not the weave's, and the weave runs in its own worktree. |
| **0 stashes** | — | — |
| **56 dangling commits, amend/rebase leftovers** | A reachable commit carries the same subject. | **discard** (no action; git prunes them in time). |
| **16 dangling commits with unique subjects, already landed** | Patch-id matches a reachable commit, so they landed under another message. Includes the June STIGMERGY audit, the Shop schema migration, and the Pages as Agents rewrite. | **discard**. |
| **`d3321d8f`** (2026-06-06) per-row "running" indicator on the stewards deck | `StewardsDeck.jsx` no longer exists. The PROJECTS deck's `RowStatus` has its own running state. | **discard**, superseded. |
| **`4a5d61c9`, `14b8e7f4` + 3 stash parts** (2026-09-22, "held during secret scrub") | Everything in them is on main except two deliberate changes: the Engelbart line (corrected to his later ABC model) and FOUR PILLARS → Creative Coach `spawned`, which deposit `110d3920` says it dropped as "overclaimed". `stable_audio.py` has been rewritten since by the GSL steward. The secret-pattern scan found only prose about "token economy"; no secrets. | **discard**, superseded. |
| **Branch `backup-pre-purge`** (2026-07-04) | 97 of 98 commits are on main. The one that isn't, `bd836594`, is BLUELINE render binaries plus a SAM model weight file, the material the purge deliberately removed from history. | **leave**. It's the purge's safety net, and deleting it is your call, not the weave's. |
| **Branches `deposit/only-what-crossed`, `fix/audit-defects`, `schema/v1.18-floor-split`** (2026-09-04) | Each has one commit not on main, `500b2090` (LDN RTM OBS setup), and that content *is* on main (the OBS backup files match fully; `rtm.py` was rewritten later). Everything else is merged. | **discard**: delete the three branches (safe `-d` would refuse; `-D` needed because `500b2090`'s patch-id differs). Needs your yes. |
| **Reflog rewrites since July** | Amends and resets by working sessions: 09-22 (the scrub and deposits), 09-23 (stewards, scroll asks). All of them re-landed on main. | **leave**; informational. |

**Summary:** 1 leave (in-flight GSL work) · 1 leave (backup branch) · discard 75 dangling (no action) · 3 branch deletions for your yes.
