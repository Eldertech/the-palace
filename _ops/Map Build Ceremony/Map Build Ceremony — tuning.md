---
title: "Map Build Ceremony — tuning"
born: 2026-09-25
links:
  - target: "[[Map Build Ceremony]]"
    type: connects-to
    label: tuning-for
forward_vector: "I am the Map Build's record of what each run taught it, numbered, each lesson tied to the spec change it forced, so the ceremony's version has a reason you can read. Every run leaves a line here; a run that changed the ceremony also leaves a numbered item. Never prune what a real run taught."
---

# Map Build Ceremony — tuning

What each build taught the ceremony, and the lessons that reached it from elsewhere. Each item names what was shown and the spec change it forced, or says **owed** when the change hasn't landed. Newest last. Hashes are commits to `_ops/Map Build Ceremony.md` unless noted.

**v2.0** keeps the count the card already had. `version: 2` was stamped when the card took its present form on 2026-03-30 (`b54785f4`), after the typed ghost manifest — the Map Log's "v2 ceremony" row of 2026-03-27. **v2.1 (2026-09-25)** adds the opening read and the version in the Map Log row (item 5). The number moves when the procedure does — a step, a postcondition, a gate — never for prose. A build's record is its run line here, which names the version, and the commit that carries it.

## From the first full builds — 2026-03-27

1. **An untyped ghost list mixed broken links with entries not yet written.** The first full build reported 15 ghosts; the v2 build the same day reported 7 *forward* ghosts (`_ops/Map Log.md`, the two 2026-03-27 rows). Forced: the ghost taxonomy, which types broken links and `_ops/` targets apart from entries not yet written, and version 2 (`b54785f4`).
- run · 2026-04-01 · v2.0 · full · nothing new
- run · 2026-04-07 · v2.0 · full · nothing new
- run · 2026-04-27 · v2.0 · full, the April weave · nothing new
- run · 2026-05-14 · v2.0 · full, the May weave · nothing new

## From the weaves of June 2026 — tool only

2. **The builder, not the card, absorbed two lessons.** Vendored third-party docs were being counted as entries (138 dropped, `83797950`), and the date-stamped builders have no stable name, so the Weave runs the newest by glob (`14a4d13a`). No spec change; see [[Weave Ceremony — tuning]] 9 and 10.
- run · 2026-06-05 · v2.0 · full, before the weave · nothing new
- run · 2026-06-05 · v2.0 · full, the afternoon weave · taught item 2
- run · 2026-06-07 · v2.0 · full, STIGMERGY enters the map · nothing new
- run · 2026-06-16 · v2.0 · full, the deep weave · nothing new
- run · 2026-07-04 · v2.0 · full, after the bundle-hygiene sweep · nothing new
- run · 2026-07-05 · v2.0 · full, @import symlinks skipped · nothing new
- run · 2026-08-26 · v2.0 · full, for the GNN experiment · nothing new
- run · 2026-09-24 · v2.0 · full, the September weave · nothing new

## From the versioning read — 2026-09-25

3. **The card says `_ops/` cards are not nodes; the builder has made them nodes since 2026-09-24.** Ceremony cards with a canon type are nodes in `build-map-2026-09-24.py` (`dd094117`; [[Weave Ceremony — tuning]] 25), but Step 2 still says ops entries "are not mapped as nodes" (`Map Build Ceremony.md:77`), and `ops_ghost` still assumes the root scan can't see them (`:110`). Spec change, paid in v2.4 (item 7): Step 2 and the ghost taxonomy catch up with the builder.
4. **The last two full builds left no Map Log row.** The newest row is 2026-07-04, but `_ops/maps/` holds full maps from 2026-08-26 and 2026-09-24. The postcondition still asks for the row, and without it the version stamp has nowhere to go. Spec change, paid in v2.3 (item 6): find what built those maps without the row, and make the row part of that path — or say in the card where such a build records itself.

## From the Phase 5 review — 2026-09-25

5. **The card changed and the version didn't.** `b8b83e37` added the opening step — the tail read of this file (`Map Build Ceremony.md:62`) — and a clause to the postcondition: the Map Log row's scope cell names the version, and the commit that carries the row says what the run taught (`:42`). The same commit turned `version: 2` into `"2.0"`, the same value, so the ceremony scroll went on counting every build since March as a run of the current spec. Both changes are procedure. Forced: **v2.1**. No step changes here; the number catches up with `b8b83e37`.

## From the bundle walk — 2026-09-26

6. **The Map Log duplicated this ledger and had stopped being kept.** A walk of the whole palace for pages that belong in a bundle found `_ops/Map Log.md`: no script reads or writes it, only this card's step 7 did, and its last row is 2026-07-04 (item 4). Every build it recorded is already here as a run line, and every map file from 2026-03-27 on is still in `_ops/maps/`, its `meta` carrying the node, edge and forward-ghost counts and each ghost by name. Forced: **v2.3** — step 7 and the postcondition write the run line here, with the counts in it, and ghost persistence reads the map files. The log is frozen in `Archive/` as [[Map Build Ceremony — log]]. Pays item 4.

## From the canon-agreement run — 2026-09-26

7. **The map and STIGMERGY disagreed about what is canon, and the builder dropped link types.** Set against PULSE, which reads frontmatter as YAML, the builder's line-by-line reader differed three ways. It kept `Toolkit — Audio Plugins` as a node though its frontmatter did not parse (an unquoted `: ` in the forward vector). It read a one-line `- { target, type, label }` link as a bare target, so 109 typed links on 22 Shop pages (20 specialists, 2 makers) came out as `connects-to` with no label. And it called 42 of its 61 forward ghosts "not yet written" when each was a link to a bundle file or material that exists. Forced: **v2.4** — Step 2 reads frontmatter as YAML and names what will not parse in `meta.yaml_errors`; the ghost taxonomy gains `file_ghost` for any link to a file that is not a node, so a forward ghost is a target with no file anywhere; `ops_ghost` folds into it, since every one it held was a bundle file; and Step 2 says `_ops/` cards with a canon type are nodes (pays item 3). Builder: `build-map-2026-09-24.py`. After the change, map and PULSE agree on 316 nodes and 2,772 links, types and labels included. Maps before v2.4 count file ghosts as forward, so read ghost persistence across v2.4 maps only.
- run · 2026-09-26 · v2.4 · full, 316 nodes, 2772 edges, 19 forward ghosts · taught item 7

## From the neighborhoods question — 2026-09-26

8. **The card offered a mode nothing could run.** Its trigger, Modes and Step 1 offered a neighborhood map read from a `neighborhood:` or `cluster:` field, but no entry carries either field and the builder writes full maps only. Loudon: bounded surveys are something we grow toward, and how neighborhoods are calculated is an open question — a page can live in several, and they can be drawn many ways. Forced: **v2.5** — the trigger drops "neighborhood map for [X]", Step 1's scope is `full`, and Bounded Survey is described as grown toward, pointing at the Weave's lens partitions as the nearest thing today. The same trigger leaves CLAUDE.md, ROSETTA and Palace Ceremonies; [[Palace Map]] carries the question.
