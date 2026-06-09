---
title: "STIGMERGY Entry-Agent Window — Build Handoff 2"
born: 2026-06-08
genre: build continuation (Claude Code, Mac)
status: ready
links:
  - target: "[[STIGMERGY Entry-Agent Window — Integration Plan]]"
    type: connects-to
    label: "handoff-for"
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: "builds-into"
  - target: "[[Surfaces and Capabilities]]"
    type: connects-to
    label: "capability-delta-source"
forward_vector: "I carry the entry-agent companion from a green M0–M1c+ checkpoint to its remaining surface (M1d, frontmatter/forward-vector editing, M2), and I flag the one live bug found in use. I am caught when a fresh Claude has the worktree green and picks up the next move; then I archive."
---

# Handoff: STIGMERGY Entry-Agent Window (build 2)

## Move

Continue the entry-agent **companion** build. M0 → M1c + window polish + the
floating-box refactor + "discuss this" are **shipped and green** on the worktree.
Next is **M1d** (graffiti · undo · adaptive narration) and **frontmatter /
forward-vector editing** (which fixes the flagged bug below), then **M2** (bold
asks → Maker/Shop). The interaction is settled and loved; what remains is
additive.

## Why this move matters

The honesty spine is in and proven live — the companion discusses *and* makes
real, quarantined commits. The risk now is not design but **drift across a long
session**: this baton exists so a fresh Claude resumes with the architecture,
the three-branch git model, and the settled decisions intact, rather than
re-deriving them (the reflow question alone cost a full round).

## Current state — a clean, committed checkpoint

**Branch `feature/stigmergy-entry-agent`** in the worktree
`/Users/loudonstearns/Documents/palace-entry-agent`. Five commits past
`main` (5fc0efb), suite green (**77 files / 1125 vitest**), each slice verified
live:

1. `9e20bcb` — M0 shell + M1a grounding + M1b discuss
2. `32a76ca` — M1c honest in-place edits (the armed write)
3. `7994ab2` — window polish (auto-grow input, overscroll, BBS scrollbar)
4. `4157a74` — floating box (reflow removed) + whole-doc grounding
5. `dfe7f58` — "discuss this" second selection (CSS Custom Highlight API)

Working tree carries only **runtime artifacts** (`_ops/swarm/persistent/
blackboard.jsonl`, `_ops/stigmergy/.actuator-companion/`) from live sessions —
never commit those; stage explicit code paths only.

### The three git surfaces (do not conflate)

- **`main`** — the live palace (Obsidian + deployed STIGMERGY). Untouched.
- **`feature/stigmergy-entry-agent`** — the *code*. Becomes real STIGMERGY only
  when merged to main (not yet done).
- **`stigmergy-edits`** (worktree `../palace-stigmergy-edits`) — where the
  companion's *content* edits land, quarantined. e.g. `d5f8269` (a forward-
  vector-adjacent Zen open-question on Merleau-Ponty). To fold one into the live
  palace, **cherry-pick that commit onto main** (each edit is a clean single-
  file content commit). **Wrinkle:** the edits worktree was forked from the
  *feature* branch during dev, so `stigmergy-edits` is entangled with feature
  code — cherry-pick individual edit commits, never merge the whole branch.
  Post-merge-to-main it would fork from main and be clean; tidy when wiring the
  merge step.

## Architecture (how a turn flows)

Window (`EntryAgentWindow.jsx`, mounted by `EntryReader` when the `[~] agent`
toggle is on) → `postTurn()` (`adapters/entry-agent.js`) → `POST
/api/entry-agent/turn` (`server/api/entry-agent.js`) → `companionLane.turn()`
(`server/companion-lane.js`) builds the prompt (`server/companion-prompt.js`,
grounded by `src/lib/entry-grounding.js`) and fires an **Opus `claude -p`
worker** on its own actuator lane (`.actuator-companion/`, single-global-worker
scar). The worker returns `{reply, edit?}`; the lane **reap** posts the reply
(BROADCAST) and, if an edit, performs it through the **enforced write path**
(`server/armed-write.js`: allow-list → body-only edit preserving frontmatter
verbatim → `commitSelected`, never `git add -A`) into the quarantined edits
worktree, then posts a `PROOF` carrying the commit. The window is a board reader
(SSE) and renders reply bubbles + a committed-edit marker. Nothing is real until
that commit exists. The window is a **floating box above everything** (no reflow);
"discuss this" pins a passage via `::highlight(eaw-discussing)` and threads it as
a `FOCUS` block.

## Tried and rejected (the negative space)

- **Text reflow around the window** (CSS `shape-outside`, then canvas) → rejected.
  A fixed/visible chat window can't have stable text below it; the canvas reflow
  works but costs native selection, clickable `[[wikilinks]]`, and rich blocks.
  Loudon chose a **floating box above everything** instead. Don't reopen.
- **Amber mockup skin** → kept **BBS/phosphor**; Loudon prefers it. Amber is used
  only as the "discussing" accent.
- **Shift+drag** for the second selection → **Option/Alt+drag** + a chip (the
  browser owns Shift for extend-selection).
- **Worker writes files itself** → Node owns the enforced write path; the worker
  only proposes `{reply, edit}`.

## Next move

1. **(Quick, do first) Stopgap for the flagged bug** — one prompt edit so the
   companion stops *attempting* frontmatter/forward-vector rewrites and says
   plainly it can only edit the body for now. Turns the cryptic failure into an
   honest sentence.
2. **M1d** — graffiti (HTML-comment storage, rendered scrawl) · undo (pre/post-
   commit) · adaptive narration. Same machinery as M1c.
3. **Frontmatter / forward-vector editing** — the real fix for the bug (see
   Issue). A `set-vector` / frontmatter op via `emitEntryFile` (YAML-safe re-emit,
   not verbatim-preserve) + `commitSelected`; **honor "never rewrite a
   forward_vector without flagging it"** — surface vector changes prominently.
4. **M2** — bold asks → Maker/Shop, Mac host. Large; fresh context recommended.

---

## ⚠ ISSUE REPORT — companion can't edit the forward vector (or any frontmatter)

**Found in use (2026-06-08):** Loudon pinned the **forward vector** of *Quality
Manifesto* via "discuss this", discussed it fine, then asked the agent to edit
it. Result:

> "I couldn't apply that edit honestly: rewrite: \"find\" text not present in the entry"

**Severity:** medium (capability gap + confusing UX; NOT data loss — it refused
correctly).

**Root cause:** `server/armed-write.js` `applyOp` operates on the **body only**.
`splitRawFrontmatter()` splits the frontmatter block off and preserves it
*verbatim*; `rewrite` searches only the body. The forward vector lives in the
**frontmatter**, so the worker's `rewrite.find` (the vector text) is genuinely
absent from the body → the honest refusal in the reap's edit-fail path
(`companion-lane.js`). The refusal logic is *correct* — it didn't guess — but
(a) the capability doesn't exist yet, and (b) the message is opaque to Loudon,
who *can* pin and discuss the vector, so editing it "should" work.

**Why it's easy to hit now:** "discuss this" + whole-doc grounding let the
companion *discuss* the forward vector and the user *pin* it — but M1c edits are
deliberately body-only. The discuss/edit capability boundary is invisible.

**Fix paths:**
- **Stopgap (≈1 line, low risk):** in `companion-prompt.js`, tell the worker it
  can currently edit **the body only**; if asked to change the frontmatter or
  forward vector, it should reply that it can discuss but not yet edit that —
  not attempt a body `rewrite`. Stops the cryptic failure immediately.
- **Real fix (the capability):** add a frontmatter/forward-vector edit op
  (e.g. `set-vector`) that edits the frontmatter through the enforced path using
  `emitEntryFile` (YAML-safe re-emit + `detectArrayStyles` to minimize churn) +
  `commitSelected`. **Must** honor the standing rule *never rewrite a
  forward_vector without flagging it* — the PROOF / edit marker should call out a
  vector change explicitly, and `verify` should not be silently "verified".
  Watch frontmatter churn (emit reorders fields vs the verbatim-preserve M1c uses
  for body edits) — decide field-order policy.

**Recommendation:** ship the stopgap with M1d so it never fails cryptically
again; do the real fix as the "frontmatter/forward-vector editing" milestone.

---

## Receiving environment

Claude Code, Mac, the worktree `/Users/loudonstearns/Documents/palace-entry-agent`
on `feature/stigmergy-entry-agent`. Capability deltas / gotchas that bite:

- **Commit per slice; never `git add -A`** (N-writer repo). Stage explicit code
  paths; leave `blackboard.jsonl` + `.actuator-companion/` uncommitted.
- **Opus worker** (capability-first; optimize down later). Real `claude -p`
  turns take tens of seconds — that's expected.
- **Edits quarantine to `stigmergy-edits`** via `armed-write.js`
  (`ensureEditsWorktree`); they never touch the live entry the dev server reads.
- **Live verification:** screenshots come back **black** (CRT/phosphor app) — use
  **DOM `preview_eval`** assertions, not screenshots. The `rAF` scroll-spy is
  paused in a backgrounded preview tab — use `setTimeout` waits in evals. Run the
  worktree dev server on a **free port** (`5191`+, Loudon often has `5173`/`5186`
  up) via a temporary `.claude/launch.json` config, and **revert launch.json**
  after. The real-Opus loop is Loudon's gate (don't fire real workers in checks).
- Commit-msg hook only **annotates** (no Palace-Kind/Verify) — fine for feature
  code; keep subjects ≤72 chars (mine ran long).

## Calibrations from this session

- Loudon **loves** the discuss-this interaction; it's settled.
- **BBS/phosphor** over amber. **Floating box**, not reflow — settled, don't reopen.
- Capability-first (Opus). Ask on consequential forks (write target, model,
  layout) — they changed what got built.
- Verify live via DOM eval before committing; commit small, self-contained slices.
- The companion's edits are **body-only** (the bug). Discuss covers the whole doc.

## Load these files first

1. `Palace development/STIGMERGY Entry-Agent Window — Integration Plan v0.1.md`
   (§5 build order, §6 invariants — note the reflow decision is now superseded by
   the floating box)
2. this handoff
3. Worktree code: `app/src/components/state/EntryAgentWindow.jsx`,
   `app/server/companion-lane.js`, `app/server/companion-prompt.js`,
   `app/server/armed-write.js`, `app/src/lib/entry-grounding.js`,
   `app/server/api/entry-agent.js` (all under `_ops/stigmergy/`)
4. `_ops/stigmergy/merleau-entry-agent-prototype.html` (the interaction Loudon
   referenced — for *flow*, not look)
5. `STIGMERGY.md` + `Palace Agent Infrastructure Spec` (wire, decks, boards)

---

*Loudon Live · Autodidact Polymaths*
