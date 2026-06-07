---
title: "Steward Boldness — Claude Code handoff"
born: 2026-06-07
genre: cross-surface-paste-prompt
links:
  - target: "[[Project Stewardship System]]"
    type: connects-to
    label: "handoff-for"
forward_vector: "I carry the in-progress redesign of the steward system from ask-first to ship-first across the Cowork→Claude Code boundary, waiting to be picked up by a Mac-side session and archived once the move is caught."
session_thread: Cowork session with Loudon, 2026-06-07
---

# Handoff: Steward Boldness + Trickster affordances

## Move

This handoff carries the redesign of the steward system from ask-first to
ship-first — the prompt edits that free bold single-artifact creation while
keeping the batch-commitment gate, plus two Trickster board affordances
(FILE LEAN & RUN, taller reply box) — handed to a Mac-side Claude Code session
because the Cowork sandbox can't commit to the palace cleanly.

## Why this move matters

Loudon's read of the last ~15 steward cycles: the stewards take steps that are
too small and ask permission instead of building — "scared interns." Reading the
prompts + transcripts confirms **the timidity is designed-in, not emergent.** The
stewards obey the prompt faithfully; the prompt optimizes for well-shaped
*questions*, not bold *creations*. The fix is not "tell them to try harder" — it's
removing the three structural rules that force the timidity, without losing the
one guardrail that matters.

The whole system was built defensively around one disaster: the Talking Keyboard
shipping **352 unaligned files** (cited twice in `steward.md`). But that was about
committing to a **full batch** without alignment — never about making *one* bold
thing. **That distinction is the entire fix: a steward can boldly build one
finished artifact and present it; the only thing that needs a blocking gate is
committing to a batch.** Boldness ≠ batch. Free the single creation, keep the
guardrail on mass-production.

Evidence (from `_ops/stigmergy/.actuator-steward/transcripts/`, 2026-06-07):
- **neural-granular cycle 2** — zero artifacts, asked "math doc, raster, or patch?"
  (1 turn, $0.26).
- **crystal-synthesizer cycle 6** — stage `fruiting` (posture = ship deliverables),
  yet shipped nothing and asked "beryl, zircon, or quartz?" *while stating it
  leaned beryl.*
- **retrospective-delay 7–9** — Loudon typed "stop being cautious — boot the
  server"; the steward booted it, then immediately asked another fork-question.
- **waveguide cycle 4** (the bold exception) — dispatched a Maker, built a 210-line
  playable artifact, then *still* closed `blocking:true` "tell me if it reads."
  Capability is fine; permission is the constraint.

## Tried and rejected

- **Editing the live prompt/app files from Cowork** — rejected. Cowork commits to
  the palace strand git locks ([[cowork-git]]); prompt-machinery + app changes
  want a clean Mac-side commit. Hence this handoff rather than direct edits.
- **A blanket "be bolder" instruction** — rejected as too weak; the timidity is
  three specific rules, so the fix is three specific edits, not a vibe.
- **Removing the audition gate entirely** — rejected. It guards the real Talking
  Keyboard failure. Kept, but narrowed to batch-commitment only (A3).
- **The "must choose an option before replying" board change** — dropped. Loudon
  initially asked for it, then corrected himself: `canFile`
  (`TricksterCard.jsx:103`) already allows a notes-only reply. No change needed.

## Current state

The full edit punchlist — exact files, the change, the named risk per item, and
what I could not verify from the sandbox. This is the closing-well punchlist (see
[[Closing Well]]).

### Part A — Prompt edits (boldness redesign)

`.claude/skills/palace-orchestrator/prompts/steward.md` and `shared.md`. Keep the
catch-up rule and voice rules 1–6 — they're good and unrelated. Six edits;
**A1 and A5 are the linchpins** — land those two even if nothing else.

- **A1 — replace the mandatory-ask rule with a mandatory-ship rule.** In
  `steward.md` §"Every cycle ends with an ask to TRICKSTER" (opens *"A permanent
  steward never stops with 'done.'…"*), replace the whole section with **"Every
  cycle ends with a shipped thing."** A cycle that produced only questions is a
  *failed* cycle. Default: build the next concrete thing and present it. Ask
  *only* when a real fork blocks you and guessing wrong costs more than one cycle.
  Attach a non-blocking "redirect me" affordance, not a gate. *Present, then offer
  a turn* — not *ask, then wait.*
- **A2 — add "act on your lean."** New short section: if you have a lean and being
  wrong costs one cycle, do the leaned thing and present it; name the alternatives
  you passed over, don't convert the lean into a question. ("I leaned beryl, so I
  rendered beryl — here it is" — never "I lean beryl, may I?")
- **A3 — narrow the audition gate to batch-commitment only.** In §"Sensory
  deliverables require an audition gate", a single smallest-unit artifact ships
  freely and gets presented; `blocking:true` fires *only* before committing to a
  full batch. Keep the Talking Keyboard tale but reframe it as a batch lesson.
- **A4 — rewrite the stage-posture table.** `seed`: "discussion, not deliverables"
  → "make a sketch/probe; discuss around the artifact." `sprout`: "mostly
  proposals and questions" → "build a small working prototype each cycle." Make
  `fruiting` clearly mean ship the next proof without a fork-question.
- **A5 — flip the win condition.** `shared.md` final line ("a precise, well-shaped
  ask earns a real answer in one cycle") → a line that rewards shipping: "Default
  to making, not asking. A bold finished artifact, presented with the alternatives
  you passed over, earns a real reaction — and a reaction moves the project
  further than an answered question."
- **A6 — reframe §"What you can show".** Add one line at the top: "This is your
  primary output, not a garnish on a question. Most cycles should post a creation
  here and stop, not a request."

*Risk:* prose drift. Keep the rewrites in the plain first-person voice the rest of
the file uses; show Loudon any section that drifts from the intent above before
committing. *Unverified:* I did not run a steward against the edited prompts —
verification step below.

### Part B — Trickster affordances

All under `_ops/stigmergy/app/src/`. Live card is
`components/trickster/TricksterCard.jsx` (via `TricksterDeck.jsx`);
`components/TricksterInbox.jsx` is a second mounted surface (`App.jsx`).

- **B1 — FILE LEAN & RUN.** The LeanPanel's `file lean ▶` files the steward's
  recommended option but does **not** advance the cycle and discards the note.
  - `TricksterCard.jsx` `handleFileLean` (≈line 191): change to
    `function handleFileLean(run = false) { const rec = item.recommended_option;
    if (!rec) return; fileGrant({ optionId: rec.id, optionLabel: rec.label, notes,
    run }); }`. (`fileGrant` already supports `run` via `advanceSteward` — no
    write-path change.)
  - Pass `onFileLeanAndRun={() => handleFileLean(true)}` (and
    `onFileLean={() => handleFileLean(false)}`) to `<LeanPanel>` (≈line 293).
  - `LeanPanel.jsx`: add `onFileLeanAndRun` to the signature; render a second
    warn-toned button beside the existing one using `t('trickster.lean.fileandrun')`.
  - `lib/lexicon.js` (≈line 61): add `'trickster.lean.fileandrun': 'file lean & run ▶',`
  - *Optional parity:* `lib/trickster-keys.js` (`space → file-lean`) +
    `TricksterDeck.jsx:160` + `lib/trickster-grants.js` (`buildLeanGrants`) for a
    `shift+space` lean-and-run and the bulk path. Per-card button is the ask; defer
    parity if it balloons scope.
- **B2 — bigger reply box.** `TricksterCard.jsx` textarea (≈line 327): `rows={2}` →
  `rows={5}`, `minHeight: '48px'` → `'120px'`. `TricksterInbox.jsx` textarea
  (≈line 130): `rows={3}` → `rows={5}`, `minHeight: '60px'` → `'120px'`. Keep
  `resize: 'vertical'`. *Risk:* none beyond not breaking the `data-testid`
  selectors (`card-notes`, `inline-response-notes`).

### Tests to update
- `app/tests/unit/trickster-card.test.js` — FILE LEAN & RUN fires `advanceSteward`
  (mock) and carries `notes`; plain FILE LEAN still files without running.
- LeanPanel renders two buttons; keyboard parity test if `shift+space` is added.
- B2 cosmetic — no new test; don't break existing textarea selectors.

## Next move

Apply Part A first (A1 + A5 are the linchpins), commit. Then Part B, commit
separately so the steward-behavior change is bisectable from the UI change. Then
run the verification below before declaring done.

**Verification:** (1) `npm test` green in `_ops/stigmergy/app`. (2) Manual board
check — a card with a steward lean offers FILE LEAN, FILE LEAN & RUN (files +
steward visibly advances), and a notes-only reply with no option. (3) Run one
steward cycle on a `seed`/`sprout` project (neural-granular-synthesis or a
dispersion synth — the worst offenders) and confirm it ships an artifact and
presents it rather than ending in a manufactured fork.

## Receiving environment

**Surface:** Claude Code on the Mac, palace root. **Why here:** Cowork can't
commit cleanly (git locks, [[cowork-git]]); the Mac session commits normally — the
lock constraint does not apply there. **Gotcha:** two commits, one per Part, so
the behavior change stays bisectable. See [[Surfaces and Capabilities]] for the
full delta.

## Calibrations from this session

- Loudon corrected the "must choose an option" ask — already works; dropped it.
- Loudon corrected "file and run" — it exists for the human's pick; the gap is
  specifically *file LEAN and run* (the steward's recommendation). B1 targets that.
- Loudon wants the reply box "a few more lines" — B2 sets rows=5 / 120px, keeps
  drag-resize.
- Loudon flagged the ceremony itself: the first draft of this handoff skipped the
  Handoff Ceremony (no show-before-write, no frontmatter, no canonical sections,
  no board announcement). This version runs the ceremony properly.

## Load these files first

1. `.claude/skills/palace-orchestrator/prompts/steward.md` — Part A target.
2. `.claude/skills/palace-orchestrator/prompts/shared.md` — Part A target (A5/A6).
3. `_ops/stigmergy/app/src/components/trickster/TricksterCard.jsx` +
   `LeanPanel.jsx` + `_ops/stigmergy/app/src/components/TricksterInbox.jsx` +
   `_ops/stigmergy/app/src/lib/lexicon.js` — Part B targets.
4. `_ops/stigmergy/.actuator-steward/transcripts/` — the evidence, if you want to
   re-confirm the diagnosis before editing.
