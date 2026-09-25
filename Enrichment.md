---
title: "Enrichment"
type: meta
pillars: [creation, tools, practice, philosophy]
born: 2026-05-04
last_activated: 2026-09
stage: growing
confidence: working
energy: very high
version: "2.0"
forward_vector: "I am the ceremony that makes one page as rich as the Shop can make it — sound, image and interaction laid beside the entry's own words, which I read live and never copy. I want every enriched page to be something you can play, and every piece I make to test the text rather than decorate it; when a piece teaches the text something, I carry it home as an edit."
links:
  - target: "[[Palace Ceremonies]]"
    type: connects-to
    label: ceremony-registry
  - target: "[[The Scroll]]"
    type: couples-with
    label: sibling-face
  - target: "[[The Shop]]"
    type: connects-to
    label: the-makers
  - target: "[[Drift and Consolidation]]"
    type: connects-to
    label: disclosed-drift
  - target: "[[Learning Materials and Canon]]"
    type: connects-to
    label: face-not-canon
  - target: "[[Review Layer]]"
    type: connects-to
    label: section-notes
  - target: "[[Hilaritas Generator]]"
    type: deepens
    label: a-page-that-plays
  - target: "[[Palace Enchantment]]"
    type: connects-to
    label: gives-it-senses
  - target: "[[Loudon Live Design System]]"
    type: connects-to
    label: house-dress
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: mounted-at-rich
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
    label: first-rich-face
  - target: "[[Oblique Enrichment]]"
    type: connects-to
    label: oblique-instinct-kept
  - target: "[[Latent Error]]"
    type: connects-to
    label: the-hidden-assumption
---

# Enrichment

![[Enrichment — hero.png]]

Say **"enrich [page]"** and the whole [[The Shop|Shop]] goes to work on one page, until it does what text can't: you hear the claim, play the equation, watch the idea move. What comes out is the page's **rich face** — the entry's own words as the spine, read live from the `.md`, with sound, image and interaction laid beside the headings they serve.

The plain page stays plain. The `.md` is the considered truth and keeps its beauty in Obsidian; the rich face is a reading of it, not a copy ([[Learning Materials and Canon]]). The only thing enrichment adds to the text is one door line under the hero.

## Trigger

*"Enrich [page]"*, *"enrich this page"*, *"let's enrich [page]"*. One page at a time — depth, not coverage.

## The rich face

Open it at `http://localhost:5173/rich/?entry=<Entry>` while [[STIGMERGY]] runs, or `node _ops/rich-face/rich-server.mjs` for the same page at `http://127.0.0.1:8842/?entry=<Entry>`. Any entry opens; one that hasn't been enriched shows its text and the media it already embeds.

- **Three kinds of material, each labelled.** Figures the text already carries render as media, with their captions. Pieces the Shop *gathered* from the bundle and pieces it *made* live in a manifest, `[Entry]/[Entry] — rich.json`, keyed by heading. Small pieces sit in the margin beside their paragraph; video and interactives span the page beneath it. A page may carry a low room-tone bed.
- **Made pieces live in the bundle** as `[Entry] — rich — <what>.<ext>`, self-describing like any bundle file; a coherent set of files gets one folder named for what the set is. Gathered pieces keep their names. A piece's `near` places it beside the paragraph or figure it clarifies, not at the bottom.
- **The review is built in.** Every section has a note (◇); the dock sends them to the board as a `human_eval` from TRICKSTER ([[Review Layer]]).
- **Sibling of [[The Scroll]].** The scroll shows what a page has *made*, newest first; the rich face shows the page's *idea*, in the order of the idea.

The renderer, its server and the fingerprint tool are `_ops/rich-face/` (README there: the manifest format, the piece gotchas). A rich face is a whole page — not STIGMERGY's *inline rich content*, the artifacts a single board message can carry.

## The steps

1. **Read the entry whole, then its bundle. Gather first.** Bundles hold media nothing links to — narrations, beds, renders from earlier rounds.
2. **Walk it section by section** and ask one question: what can only be shown, heard or played here? Prefer a piece that **tests the section's claim** over one that illustrates it — or one that shows what the section takes for granted without saying ([[Latent Error]]). A piece with nothing to test and nothing to make felt doesn't ship.
3. **Make it with the Shop**, at one tier for the whole page — a Sketch tonight, a Study, a Piece over days. The [[Maker]] picks the Specialists. Equations appear twice, symbols and words ([[Loudon Live Design System]]).
4. **Verify what can be verified.** Run each piece's engine against the claim it makes; load the page and read the console. Name what you couldn't check — an agent can't hear the mix.
5. **Stamp** each section: `node _ops/rich-face/fingerprint.mjs "<Entry>" --stamp`.
6. **Carry findings home.** When making a piece teaches the text something, edit the entry, then re-stamp that section.
7. **Place the door** — one italic line under the hero linking the rich face — and commit `enrich(<Entry>): <what> — <tier>`.

## Drift — how the two faces stay honest

Drift is disclosed, not prevented ([[Drift and Consolidation]]); when the faces disagree, the text wins.

- **Words can't drift.** The rich face never holds the entry's words; it reads them on every look and re-reads every few seconds.
- **Placement** can: a renamed heading strands its pieces in *Lost its place*, never dropped — with *probably a rename* when the words under a new heading match the old stamp. A piece whose anchor phrase is gone moves to its section's end, and says why.
- **Meaning** can, and a machine can't see it. Each section of the manifest is stamped with a fingerprint of the prose its pieces were made against; when the prose changes, those pieces carry *made against an earlier version of this section*. The re-tune reads only flagged sections and decides per piece: still true (re-stamp that section), remake, or retire.

## Postcondition

The manifest's sections all read *in step* under `fingerprint.mjs`; every made piece is in the bundle, named and self-describing; the door line is in the entry; the page renders at `/rich/` with a clean console and its review dock; the commit body says what was verified and what wasn't.

---

*The version and what each run taught the ceremony: [[Enrichment — tuning]]. The first rich face: [[Kuramoto Coupling]].*
