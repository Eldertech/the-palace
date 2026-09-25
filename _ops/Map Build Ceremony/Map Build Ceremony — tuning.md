---
title: "Map Build Ceremony — tuning"
born: 2026-09-25
links:
  - target: "[[Map Build Ceremony]]"
    type: connects-to
    label: tuning-for
forward_vector: "I am the Map Build's record of what each run taught it, numbered, each lesson tied to the spec change it forced, so the ceremony's version has a reason you can read. Append after a run that changed the ceremony; never prune what a real run taught."
---

# Map Build Ceremony — tuning

What each build taught the ceremony, and the lessons that reached it from elsewhere. Each item names what was shown and the spec change it forced, or says **owed** when the change hasn't landed. Newest last. Hashes are commits to `_ops/Map Build Ceremony.md` unless noted.

**v2.0** keeps the count the card already had. `version: 2` was stamped when the card took its present form on 2026-03-30 (`4fbb103f`), after the typed ghost manifest — the Map Log's "v2 ceremony" row of 2026-03-27. **v2.1 (2026-09-25)** adds the opening read and the version in the Map Log row (item 5). The number moves when the procedure does — a step, a postcondition, a gate — never for prose. A build's record is its Map Log row, whose scope cell names the version, and the commit that carries the row.

## From the first full builds — 2026-03-27

1. **An untyped ghost list mixed broken links with entries not yet written.** The first full build reported 15 ghosts; the v2 build the same day reported 7 *forward* ghosts (`_ops/Map Log.md`, the two 2026-03-27 rows). Forced: the ghost taxonomy, which types broken links and `_ops/` targets apart from entries not yet written, and version 2 (`4fbb103f`).
- run · 2026-04-01 · v2.0 · full · nothing new
- run · 2026-04-07 · v2.0 · full · nothing new
- run · 2026-04-27 · v2.0 · full, the April weave · nothing new
- run · 2026-05-14 · v2.0 · full, the May weave · nothing new

## From the weaves of June 2026 — tool only

2. **The builder, not the card, absorbed two lessons.** Vendored third-party docs were being counted as entries (138 dropped, `8bc59a63`), and the date-stamped builders have no stable name, so the Weave runs the newest by glob (`bb3612e4`). No spec change; see [[Weave Ceremony — tuning]] 9 and 10.
- run · 2026-06-05 · v2.0 · full, before the weave · nothing new
- run · 2026-06-05 · v2.0 · full, the afternoon weave · taught item 2
- run · 2026-06-07 · v2.0 · full, STIGMERGY enters the map · nothing new
- run · 2026-06-16 · v2.0 · full, the deep weave · nothing new
- run · 2026-07-04 · v2.0 · full, after the bundle-hygiene sweep · nothing new
- run · 2026-07-05 · v2.0 · full, @import symlinks skipped · nothing new
- run · 2026-08-26 · v2.0 · full, for the GNN experiment · nothing new
- run · 2026-09-24 · v2.0 · full, the September weave · nothing new

## From the versioning read — 2026-09-25

3. **The card says `_ops/` cards are not nodes; the builder has made them nodes since 2026-09-24.** Ceremony cards with a canon type are nodes in `build-map-2026-09-24.py` (`5b21f070`; [[Weave Ceremony — tuning]] 25), but Step 2 still says ops entries "are not mapped as nodes" (`Map Build Ceremony.md:77`), and `ops_ghost` still assumes the root scan can't see them (`:110`). Spec change owed: Step 2 and the ghost taxonomy catch up with the builder.
4. **The last two full builds left no Map Log row.** The newest row is 2026-07-04, but `_ops/maps/` holds full maps from 2026-08-26 and 2026-09-24. The postcondition still asks for the row, and without it the version stamp has nowhere to go. Spec change owed: find what built those maps without the row, and make the row part of that path — or say in the card where such a build records itself.

## From the Phase 5 review — 2026-09-25

5. **The card changed and the version didn't.** `8f3fe3f7` added the opening step — the tail read of this file (`Map Build Ceremony.md:62`) — and a clause to the postcondition: the Map Log row's scope cell names the version, and the commit that carries the row says what the run taught (`:42`). The same commit turned `version: 2` into `"2.0"`, the same value, so the ceremony scroll went on counting every build since March as a run of the current spec. Both changes are procedure. Forced: **v2.1**. No step changes here; the number catches up with `8f3fe3f7`.
