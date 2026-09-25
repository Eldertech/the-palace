---
title: The Scroll
type: practice
pillars:
  - practice
  - tools
  - creation
born: 2026-07
stage: sprout
last_activated: 2026-09-23
activation_count: 2
links:
  - target: "[[Modes of Collaboration]]"
    type: member-of
    label: named-mode
  - target: "[[Loudon Live Design System]]"
    type: connects-to
    label: house-style
  - target: "[[Learning Materials and Canon]]"
    type: connects-to
    label: artifact-not-canon
  - target: "[[Project Stewardship System]]"
    type: enables
    label: front-door
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: rendered-in
  - target: "[[Drift and Consolidation]]"
    type: couples-with
    label: the-live-half
forward_vector: "I am the page a project keeps that always opens on where it stands now, then reads down through everything it has made, newest first. Every active project carries me; STIGMERGY opens on me; the steward reads my standing orders before it moves. I want to be the one place Loudon looks to get back into a project, and to stay a reading surface, never a ceremony — regenerated at the top, appended to below, deleted from never."
---

# The Scroll

A **scroll** is a living page bound to an entry that gathers its proofs and media in the order
they were made — part index, part reading surface. The entry's bundle already *stores*
everything it produces; the scroll gives that pile a face you can read top to bottom, so the
whole arc of the making shows as one continuous surface instead of scattered files.

It is the counter-rhythm to the palace's deposit cadence. A deposit lands a finished thought in
careful chunks — real, but the tool calls interrupt a working conversation. A scroll stays
*open*: you add to it as you go, and the making accumulates without stopping to file each piece.

Named 2026-07-04 with Loudon: *"the continually developed Proof HTML document, the expanding
artifact, the scroll."* Made native to every project on 2026-09-23, when the scroll became the
front door of the [[Project Stewardship System]].

## The project scroll — the front door

Every active project carries `[Entry]/[Entry] — scroll.md`. It is the one page Loudon opens to
get back *into* a project after time away or after a steward has moved it, and it always opens
on the present. Three zones, delimited by HTML-comment markers so machinery can tell them apart:

- **Now** — regenerated on every look, never hand-edited. Status, stage, the steward's cycle
  and last run, what is *waiting on you* (open asks), what is *ready to advance* (answers filed
  since the steward last ran, which no cycle has consumed yet), the last shipped thing and its
  age, a **stall** signal (two barren cycles in a row), and **drift** (cycles since the entry
  body was last consolidated). Then *Where this stands* — the steward's own latest catch-up
  paragraph — the open asks, the answers not yet consumed, and what has been decided. It is
  computed from the board, the steward's runtime, the entry's frontmatter and git, so it cannot
  lie when the steward sleeps; that was the failure of the `plan.md` read-model it replaced.
- **Standing Orders** — Loudon's zone, never regenerated. Taste, priorities, "stop asking me
  about X," written once. The steward reads it before anything else every cycle and it outranks
  the steward's lean and any older grant. Edited on STIGMERGY's PROJECTS deck, nowhere else.
- **The making** — the trail, newest first, append-only. Every made thing the project posts to
  the board (`shipped_artifact`, a `PROOF`, an audition with media) becomes one section keyed on
  its message id: headline, ground, the account, the artifacts inline, the honest *left rough*
  line. Re-materializing never duplicates or deletes; a human may add sections by hand.

The source is **markdown** — a steward's output lands as one appended section, git diffs it
cleanly, and STIGMERGY renders it natively in the phosphor register (the [[BBS Design System]]
carve-out). A standalone HTML export in the [[Loudon Live Design System|Loud'n Live]] style is
the reading surface for anyone outside the terminal; the live-polling HTML variant below remains
the right tool for media made in a loop. The file carries the minimal bundle frontmatter of
[[SCHEMA — Reference]] §8 (`scroll` type) and no `type:` field, so it stays a learning material,
not canon ([[Learning Materials and Canon]]) — the entry is the considered truth, the scroll the
live one ([[Drift and Consolidation]]).

Machinery: `_ops/stigmergy/orchestrator/src/scroll-file.js` materializes it (every steward
cycle via `process-cycle.js`, on demand via `scroll.js --home | --all`); STIGMERGY serves it
with a live Now zone at `GET /api/projects/scroll`. Loose standards kept from the first scroll:
one per entry, append as you go, each section points at the real media, nothing deleted. A section the
work later proves wrong stays too, labelled: the GenAI Camera scroll keeps renders the thin-pose bug
invalidated, each with a caveat line, because the record of being wrong is worth more than a clean
surface. It is a cast skin, in [[Identity Molting]]'s sense.

## Building a live scroll — template & gotchas (2026-07-09)

The base scroll is a static page you append to by hand. When an entry is making media *in a loop*
(renders piling up while you work), a **live** variant pays off — it refreshes itself so Loudon
watches the browser instead of waiting for the agent to reveal each image and stall the workflow.
First built for [[GenAI Camera]] — copy the root bundle `GenAI Camera/` (driver
`genai_camera.py` + `renders.json` manifest + the polling `GenAI Camera — scroll.html` + `index.html`
redirect) as the working template.

**The three-part pattern:**
1. **A manifest** — `renders.json`, a list of records `{n, ts, prompt, params…, note}`, one per render.
2. **The maker appends it.** The tool that produces the media (`genai_camera.py`) writes the image
   *and* appends its record to the manifest (atomic: write `.tmp`, then `os.replace`). The scroll
   updates itself; the agent never pauses to reveal.
3. **The scroll polls.** The HTML `fetch`es the manifest every ~3 s and *prepends* new cards — track a
   `Set` of shown ids so appends don't re-render or lose scroll position. Newest on top.

**Gotchas (each cost a cycle):**
- **`file://` blocks `fetch`.** A polling scroll MUST be served over HTTP
  (`python3 -m http.server 8830 --bind 127.0.0.1` in the folder). A static, no-fetch scroll can open
  as a plain file. The local server dies with the session — restart it; the frames persist, only the
  live-refresh pauses.
- **The em-dash in `[Entry] — scroll.html` breaks the URL** (` — ` encodes to `%20%E2%80%94%20`). Drop
  a one-line `index.html` redirect in the folder so the URL is just `http://host:port/`.
- **Show the making, not just the result.** For a conditioning pipeline each card ran *inputs →
  output* (depth · beauty → the gen-AI frame) — the arc reads, instead of a wall of finals.
- **Keep the media beside the manifest** in a stable proof folder with relative paths, never a temp
  dir — the scroll references real files.

**Naming (a data point for the open question):** this was a *qualified* sub-scroll
(`BLUELINE — scroll — genai-camera.html`), not the entry's single `— scroll.html`. A busy entry wanted
a scroll per *making-thread*, not one per entry — one-scroll-per-entry holds only loosely.

## Forward Vector

Thirty-six project scrolls exist as of 2026-09-23, backfilled from the board and rendered in
STIGMERGY's PROJECTS deck; the first live HTML scroll ([[GenAI Camera]], 2026-07-09) still stands
as the loop-making variant. Two things to watch: whether the *Standing Orders* zone actually
shortens the question traffic on the TRICKSTER board (the reason it exists), and whether a busy
project wants its trail split per making-thread (the GenAI Camera finding) once a run of ten
cycles lands a dozen sections in one morning. The HTML export from the markdown source is not
built yet; it is wanted the first time a scroll needs to travel outside the terminal.
