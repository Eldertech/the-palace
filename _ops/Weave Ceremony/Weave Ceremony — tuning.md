---
title: "Weave Ceremony — tuning"
born: 2026-09-24
links:
  - target: "[[Weave Ceremony]]"
    type: connects-to
    label: tuning-for
forward_vector: "I am the Weave's record of what each run taught it, numbered, each lesson tied to the spec change it forced, so the ceremony's version number has a reason you can read. Append after every run; never prune what a real run taught."
---

# Weave Ceremony — tuning

What each weave taught the ceremony, appended after the run. Each entry names the trap, where it came from, and the spec change it forced — or says plainly that none has landed yet. Newest last. Hashes are commits to `_ops/Weave Ceremony.md` unless noted.

## From the 2026-03-30 weave

1. **`connects-to` is the most under-described type.** Formalizing 34 unsung paths showed the body often names the relation more exactly than the type does. Forced: the label note in Step 3a and a new Step 3c, label enrichment (`b54785f4`).

## From the spring weave — activated 2026-04-07, recorded 2026-04-21

2. **One agent can't hold the palace any more.** Past about 50 entries a single-agent weave took too long. Forced: the Swarm Weave became the canonical path, with single-agent kept for palaces under ~20 (`76e60f39`; Context § Swarm Architecture).
3. **A weave without a fresh map is working on stale topology.** Forced: a Map Build as the standard opening step (`76e60f39`).

## From the two weaves of 2026-06-05

4. **Deposits were posting flags to a board the ceremony never read.** Forced: Step 1c (read the `weave_flag` inbox) and postcondition 2b (`6ef44f01`).
5. **Work can be lost in git's cracks before anyone looks at the graph.** Forced: Step 2.5, the substrate sweep, with recovery always additive and every discard named in the commit body (`6ef44f01`). The afternoon run discarded 7 dangling commits under it (`b445ac03`).
6. **The weave wrote links before reading SCHEMA, and §4 direction errors reached a commit.** Forced: Step 0, load the foundation, and precondition 3 (`7340f044`).
7. **SCHEMA's own wording for `deepens` / `emerged-from` was backwards** against the README and against usage, which had produced 9 reciprocal-direction pairs. Forced: Schema v1.9 (both point back to their ground) and the matching Step 0 trap (`00264952`).
8. **A careful hand audit still misses inverted arrows across dozens of worker links.** Forced: the link-direction linter as postcondition 2d and Step 6.5 (`8c412b02`). The afternoon run cleared 15 E1 errors and was the first to pass it (`83797950`).
9. **The map was counting vendored third-party docs as entries** (`node_modules`, venvs, build caches — 138 dropped). Forced: exclusions and a bundle-folder detector in the map builder. No spec change; tool only (`83797950`).

## From the doc-drift repair — 2026-06-09

10. **There is no stable map-builder name; the builders are date-stamped**, so the card's `build-map-<date>.py` placeholder was not runnable. Forced: Step 6.5 runs the newest builder by glob, the doc-drift linter joins as 2e, and a routing note for session artifacts (`14a4d13a`).

## From the simplification pass and deep-weave prep — 2026-06-16

11. **Guardrails written for weak workers aged badly.** Step 0 carried a long re-explanation of §4 traps aimed at Haiku; under the Sonnet-and-up baseline it was cut, with SCHEMA §4 and linter 2d as the backstop (`d0b2ee24`).
12. **Memory drifts from canon unless something tends it.** A MEMORY.md index line claimed a preference its own file had already reversed. Forced: Step 6b, reconcile memory (`ffff7c4e`), widened on 2026-07-05 to "weave memory home" (`0f319f83`).

## From the deep swarm weave — 2026-06-26 (parked, write-back finished 06-30)

13. **The run parked on usage limits mid-way.** The write-back then landed piecemeal on 06-30, closing with `031d2b3c` (CLOSEOUT). No spec change; the September plan answers it by ending every phase at a checkpoint in `RESUME.md` (`weave-2026-09-24/PLAN.md:45`).
14. **A naive frontmatter inserter jams the closing `---` onto the last label** when `links:` is the final key, and `yaml.safe_load` still passes it. Check structure, not just parse (`weave-2026-06-26/RESUME.md:41`). No spec change.
15. **Worker facts about people are unreliable** — one showed R. Murray Schafer dying in 1933 (it was 2021). Person fields were deferred to a lookup pass (`Weave Report — 2026-06-26.md:32`). No spec change.
16. **A full deep sweep costs too much**: about 60k tokens per Sonnet worker, near 21M for the whole palace. The run deep-read a ~73-entry priority set and scanned the rest with a free script (`weave-2026-06-26/RESUME.md:127-128`). No spec change.

## From the naming bugs — 2026-07-01

17. **macOS hides naming drift until a case-sensitive reader trips on it** — `Modes of collaboration/` beside `Modes of Collaboration.md` split a bundle. Forced: the entry-naming linter as postcondition 2f (`c541dc45`).

## From the charter conversation — 2026-07-05

18. **A newborn entry is the least-connected node by construction.** A deposit writes its outbound links; the links that make it reachable live in other files, and only a weave edits those. Forced: Step 0b, the new-entry catch-up (`0f319f83`; Context § Widened Charter).
19. **Hard caps had drifted into contradiction** — the postcondition said 5 new introductions, Step 3b and the Context said 15. Forced: the caps became guidelines for pace, which retired the contradiction instead of picking a number (`0f319f83`; Context § Rate Limit Rationale).

## From the Multi-Lens Weave — 2026-07-06

20. **A baton-launched weave skipped the flag inbox**, because 2b was the one postcondition with no check behind it. Forced: `lint-weave-flags.py` gates 2b however the weave is launched (`8845461f`).
21. **Fixing the graph doesn't tell the board.** Without a `Palace-Resolves:` trailer per flag, 35 resolved flags stayed open; PROOF posts are narration the queue never reads (`multi-lens-weave-2026-07-06/weave-flags-resolved.md:1-9`; [[Closing Well — tuning]] 19). **Spec change still owed:** Step 1c still says a touch retires a flag (`Weave Ceremony.md:156`).
22. **One cut of the map only sees what that cut can see.** The oblique pass found pairs no folder, community or mirror lens could assemble. Forced: Multi-Lens as the canonical execution, and the HTML report as postcondition 5b (`8845461f`; `synthesis-report.md` § IV-b).

## From the voice measurement — 2026-08-25

23. **A stated value with no check drifts to the writer's default.** Word choice held; em-dashes rose 41% and bold 53%. Forced: the voice-drift linter as 2g, flag-only, set at p90 because a check that fails half the corpus teaches you to ignore it (`62d6ffbd`).

## From the September weave — 2026-09-24 (found and fixed during the run)

24. **The flag linter was wrong in both directions.** It matched `*<entry>*.md` and counted `target_entry`, so a touch to a scroll or a gotchas file "closed" a flag, and it couldn't read older payloads. Fixed in the tool, which now reports touched-but-unverified (`dd094117`; `PLAN.md:86`). Spec change owed at Step 1c, as in 21.
25. **Ceremony cards were link targets but not nodes**, so their links never counted as inbound. Loudon, 2026-09-23: ceremonies are woven. Forced: the "Ceremonies are woven too" line (`8972a53d`; builder in `dd094117`).
26. **The catch-up measured the wrong thing twice.** Total degree hid entries with no inbound links (OBS: 7 links, 0 inbound); inbound-only then counted symmetric links one way — 17 "unreachable" were really 1, and 46% of walk proposals re-drew links that already existed. Forced: Step 0b now counts reach (`8972a53d`; `RESUME.md:42`; Context § Who the Workers Should Be).
27. **Growing the workers up didn't help; the harness was the problem.** The elder arm was as wrong as the children (71% invalid) at 16% more cost. Showing each room's existing links both ways and "read both pages first" took duplicates from 13% to 2%. No spec change: workers stay children (Context § Who the Workers Should Be; `ab/RESULT.md`).
28. **No first reader caught its own errors.** Every correction came from a second reader — the Concierge's cold read, blind judges, a skeptic pass that refuted 33 of 82 batch candidates. Proposed, not yet a rule: a skeptic stage before any batch signing, and the Concierge reading the decision surface cold (Context § Who the Workers Should Be).
29. **A pair of entries carries one typed link.** A weaker link isn't added beside a specific one; a generic `connects-to` is retyped in place; direct lineage reciprocals are the exception. Recorded in the Context; the card doesn't say it yet. Spec change owed.
30. **The "≥5 typed links" hub bar was set when the palace had ~30 entries**; the median is now 6. This run used worker convergence (three or more unassigned workers) or the top inbound decile instead. Departure, unverified; the card still says ≥5 (`PLAN.md:135`, `:203`; `Weave Ceremony.md:162`). Spec change owed.
31. **One lens at a time costs Loudon four sittings and hides the cross-lens signal.** All Core lenses fanned out together, against the template (`PLAN.md:202`; `Multi-Lens Worker Prompt Template.md:140`). Departure, unverified.

## From the 2026-09-24 plan — the six adjustments (applied this run, unverified)

32. **The Bridge lens.** Tool entries and thought entries are written in separate vocabularies by one mind; pair them and ask each find to quote both pages and pass a fidelity test (`PLAN.md:36`, `:118`).
33. **A walk for the newcomers and the unreachable.** Workers follow typed links outward from each target and propose inbound links from neighbours, rather than surveying (`PLAN.md:37`, `:117`).
34. **A two-pile signing, sampled.** Pile A holds only moves already judged elsewhere; Loudon reads ten at random, and one wrong item sends the pile back — so a single yes is honest (`PLAN.md:38`, `:144-153`).
35. **The board tells the truth.** Payloads read from the board, a trailer per closed flag, touches checked by hand, the flag linter green before any trail is posted — the answer to 21 and 24 (`PLAN.md:39`, `:180`).
36. **Pheromone trails.** Held findings go on the board as flags the next weave reads first, with an advisory `expires_after`, instead of becoming a longer queue (`PLAN.md:40`, `:165`, `:192`).
37. **Cross-cycle convergence.** Workers never see July's held list; anything they find again on their own counts as confidence that has survived time (`PLAN.md:41`, `:130`).

## From the 2026-09-24 close (the ceremony-evolution close, after the weave)

38. **The ledger's first forced change was "read the ledger".** The card told a run to write tuning items and never to read them, so the four owed changes (21, 24, 29, 30) had no path back into a run. Loudon, at the close: "Is there a point in logging growth if we don't ask to check it." Forced: Step 0 now reads this file, owed items first, then anything after the last-run version — **v1.1**. The rule itself went into Schema v1.21 for every ceremony.
39. **The weave should watch its own language.** Loudon, 2026-09-24 close: look for over-complex, self-analysing prose, propose simplification, and be freer with deletion. "Lighter" means simpler statements of fact and taste, not less content. Spec change owed: fold this into the Multi-Lens Worker Prompt Template, applied at the next weave.
