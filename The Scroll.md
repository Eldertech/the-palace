---
title: The Scroll
type: practice
pillars:
  - practice
  - tools
  - creation
born: 2026-07
stage: seed
last_activated: 2026-07
activation_count: 1
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
forward_vector: "I am the living page an entry keeps while it makes things — the one surface where its proofs and media pile up in the order they were made, so the whole arc of the making can be read in a single scroll. I want to become a loose, reliable habit for any entry making media, and to stay a reading surface, never a ceremony — appended to freely, deleted from never."
---

# The Scroll

A **scroll** is a living page bound to an entry that gathers its proofs and media in the order
they were made — part index, part reading surface. The entry's bundle already *stores*
everything it produces; the scroll gives that pile a face you can read top to bottom, so the
whole arc of the making shows as one continuous surface instead of scattered files.

It is the counter-rhythm to the palace's deposit cadence. A deposit lands a finished thought in
careful chunks — real, but the tool calls interrupt a working conversation. A scroll stays
*open*: you add to it as you go, and the making accumulates without stopping to file each piece.
Reach for it when the work is **making media with an entry** — [[BLUELINE]]'s session proofs
walked in sequence, [[Generative Sample Libraries]]' sims and sample sets and ear-training
pieces as they pile up.

## Loose standards (kept loose on purpose)

- **One scroll per entry** that's actively making media, living in that entry's bundle
  (`[Entry]/[Entry] — scroll.html`).
- **Append as you go** — a new proof joins with a date and a line of context; nothing is
  deleted. The scroll is a record of the making, not a tidy final cut.
- **Each section embeds or links the real media** — the scroll points at the actual
  proof/artifact, it doesn't replace it.
- **It's an artifact, not canon** — no frontmatter, invisible to the ceremonies
  ([[Learning Materials and Canon]]), in the [[Loudon Live Design System|Loud'n Live]] house
  style. It graduates to an entry only if it earns one.

Named 2026-07-04 with Loudon: *"the continually developed Proof HTML document, the expanding
artifact, the scroll."*

## Building a live scroll — template & gotchas (2026-07-09)

The base scroll is a static page you append to by hand. When an entry is making media *in a loop*
(renders piling up while you work), a **live** variant pays off — it refreshes itself so Loudon
watches the browser instead of waiting for the agent to reveal each image and stall the workflow.
First built for [[BLUELINE]]'s GenAI Camera — copy `Projects/BLUELINE/proofs/genai-camera/` as the
working template (driver + manifest + polling scroll + redirect).

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

The first real scroll landed 2026-07-09 — [[BLUELINE]]'s GenAI Camera, as the **live** (self-polling)
variant, template + gotchas above. Early finding: a busy entry wants a scroll per *making-thread*, not
one per entry. Next: watch whether the live variant becomes the default when media is made in a loop,
and whether the manifest+poll rig wants to become a tiny reusable helper rather than copied per proof.
