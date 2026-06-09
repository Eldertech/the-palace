# Deposit Proposal — Promote the Interview skill to auto-loading

*Drafted by the Generative Sample Libraries steward, cycle 17 (2026-06-08), on Loudon's PROMOTE-SKILL grant (`resp-mq2anr6h-b58kr8`, against `gsl-steward-031`). This is a proposal, not an executed write. A steward does not write into canon skill-space on its own — this draft is the "show before writing" step. Nothing under any `/skills/` path has been touched.*

---

## Why now — the graduation criterion is met twice over

The Interview skill (`_ops/sample-libraries/skills/interview/SKILL.md`) carries its own promotion rule in its §"When this skill graduates":

> *Graduation criterion: Phase 3 has tested the question tree against at least one non-Kokoro source. The test passes when the Interview produces a working multisample on that source without major restructuring of the question tree or the defaults.*

One non-Kokoro source was the bar. We have cleared it twice:

| Source | What it proves | Artifact on disk | Audition verdict |
|---|---|---|---|
| **Crystal (Hexagonal)** — palace synthesis via `crystal_synth.py` | tonal synthesis source, not TTS | `Projects/Generative Sample Libraries/crystal-instrument/` — 176 WAVs (88 notes × 2 vel layers), 176-region SFZ | APPROVE (`gsl-steward-012`) |
| **Shepard drones** — Gaussian octave-stack synthesis | a second, structurally different synthesis source | `Projects/Generative Sample Libraries/shepard-instrument/` — 12 drones (one per pitch class), 128-region SFZ | APPROVE (`gsl-steward-028`) |

Both ran through the same question tree, the same two hard gates (convention agreement, audition-before-batch), and the same filename/folder defaults — with no restructuring of the Interview between them. Generality has been *earned across two sources*, exactly as the skill's last line demands ("Generality is earned across multiple sources, not asserted in advance"). The skill is ready to leave its project-local home.

---

## The promotion move (as the skill itself specifies)

The skill names its own graduation move. Faithfully executed, it is four edits plus one file copy:

1. **Copy** `_ops/sample-libraries/skills/interview/SKILL.md` → `/skills/sample-library-interview/SKILL.md`.
2. In the promoted copy, change `location:` from `_ops/sample-libraries/skills/interview/` to `/skills/sample-library-interview/`.
3. Change `status:` to `promoted` and record the two graduating sources + the GRANT (`gsl-steward-031` PROMOTE-SKILL) and date.
4. Add a `promoted_from:` field pointing back to the project-local origin path.
5. Decide the fate of the project-local copy (see the fork below).

### Proposed frontmatter for the promoted copy

```yaml
---
name: sample-library-interview
description: Conducts the chat-driven interview that turns a request into a deployment-ready sampled instrument. Trigger when the user wants to generate a sample library — palace synthesis, local WAV folder, AI audio sub-agents, web sources. Enforces convention agreement before rendering and audition cycle before any full batch.
location: /skills/sample-library-interview/
status: promoted — graduated to auto-loading 2026-06-08 (GSL cycle 17) on PROMOTE-SKILL grant (gsl-steward-031). Graduation criterion met twice: Crystal Hexagonal (gsl-steward-012 APPROVE) and Shepard drones (gsl-steward-028 APPROVE), both non-Kokoro synthesis sources run through the same question tree with no restructuring.
promoted_from: _ops/sample-libraries/skills/interview/SKILL.md
home_project: "[[Generative Sample Libraries]]"
phase: 2
---
```

(`promotion_path:` is dropped from the promoted copy — the path has been walked, so the field has nothing left to point at.)

---

## The fork that needs Loudon's call

Two things genuinely need a human decision before any write into `/skills/`:

### Fork A — does `/skills/` even exist as a home in this palace?

Every skill in this palace today lives under `_ops/.../<name>/SKILL.md` (project-local) or under `.claude/skills/` (the orchestrator). **There is no top-level `/skills/` directory.** The skill's own graduation text was written months ago assuming a `/skills/` user-skill space that may have been superseded by the `.claude/skills/` convention. So the real question is not just "promote yes/no" — it is *where* the auto-loading home actually is now:

- `/skills/sample-library-interview/` — the literal path the skill names (would create a new top-level dir).
- `.claude/skills/sample-library-interview/` — the convention the palace actually uses today for auto-loading skills.

I lean `.claude/skills/` because that is where auto-loading is already wired, but this is a structural commitment I should not make for you.

### Fork B — what happens to the project-local copy?

The skill offers two endings: *"Leave the project-local copy as a redirect stub, or delete it once the promoted version is verified."* A redirect stub keeps `[[wikilinks]]` and the dozen existing `obsidian://...interview/SKILL.md` references in the home entry alive; a delete is cleaner but breaks every back-reference until they are rewritten.

---

## Why this is a deposit ceremony and not a steward write

Promotion moves a file out of the project's own `_ops/` bundle and into shared canon skill-space, and it rewrites the home entry's references. That is a canon edit — it goes through the Deposit Ceremony with Loudon, not through an autonomous steward write. This proposal is the draft the ceremony consumes.
