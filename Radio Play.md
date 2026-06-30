---
title: Radio Play
type: practice
pillars: [creation, tools, practice]
born: 2026-06
stage: sprout
summary: "The Shop's audio-drama craft — unseen multi-voice characters carrying the full meaning in sound, enriched outward from the audio spine (visuals via VO-as-clock, interactivity next)."
links:
  - target: "[[The Shop]]"
    type: emerged-from
    label: forged-in
  - target: "[[Maker]]"
    type: connects-to
    label: dispatched-by
  - target: "[[Kokoro]]"
    type: connects-to
    label: casts
  - target: "[[Stable Audio Open]]"
    type: connects-to
    label: scores
  - target: "[[ffmpeg]]"
    type: connects-to
    label: assembles
  - target: "[[FOUR PILLARS]]"
    type: connects-to
    label: sound-leads
  - target: "[[Modes of Collaboration]]"
    type: connects-to
    label: the-debrief-reel
  - target: "[[Loudon Live Design System]]"
    type: connects-to
    label: teaching-radio
forward_vector: "I make unseen characters carry the whole story in sound — voices, pacing, music, and effects tuned until the audio alone holds the full meaning — and I keep mastering that craft: a stable of recurring characters, a house sense of comedic timing, a music-and-foley vocabulary. I grow my enrichments outward from the audio spine — visuals synced by VO-as-clock first, an interactive radio play next — and I want to become a first-class Shop deliverable, not a one-off."
---

# Radio Play

Theatre of the mind, made in the [[The Shop|Shop]]. Several people talk, each with their own character, and **we never see them** — the voices, pacing, music, and effects carry the full meaning through sound alone. The base form is audio-complete by design; everything visual or interactive is an *enrichment* layered onto a spine that already stands on its own. This is the deep version of the dual-channel rule: build the thing so it works as audio, then enrich.

## The craft to master

- **Characters** — distinct voices cast as personas (the first cast: a warm narrator, a gruff foreman, an alarmed skeptic, a shy wikilink — [[Kokoro]] voices `af_heart` / `am_michael` / `af_bella` / `af_nicole`). A recurring stable is the goal.
- **Pacing** — gaps between lines, the beat before a punchline, room for a laugh to land. Timing is the performance.
- **Music** — beds, stings, swells ([[Stable Audio Open]] `small-music`): tension underneath, a hit on the title, a resolve at the close.
- **Effects & foley** — [[Stable Audio Open]] `small-sfx`: terminal beeps, whooshes, a confirmation ding.
- **Laughs** — an audience track placed *on* the joke, not under it.
- **The mix** — levels set by meter ([[ffmpeg]] loudnorm to −16 LUFS, beds well under voice). Proven sufficient; the ear-pass is optional polish, not a gate.

## Audio-first production

The radio play is **cut as a complete audio piece first** — voices, then score and foley, then balance — because it must carry the meaning unseen. Loudon: *"audio edit first then create video to fill the space and sync to audio… is how I go about editing picture generally."* The machine reached the same discipline from the other side — the only way to sync picture to speech it cannot hear is to fix the audio first and measure it — and the two met. That convergence is why this is worth mastering, not just repeating.

## Enrichments (outward from the audio spine)

- **Visuals — via VO-as-clock.** Render the finished audio, *measure* it, and let its per-segment durations set each visual scene's length; the picture fills and syncs to the spine, never the reverse. First instance: the *Unsung Path* explainer (2026-06-19) — [[Maker]]-dispatched, assets in `_ops/scratch/weave-video/`.
- **Interactive** — a branching / choosable radio play. Not yet built.
- More as briefs reveal them.

## Forward Vectors

- Master one compelling 2–3-minute radio play end-to-end as the reference Piece — characters, pacing, music, and effects all deliberate.
- Grow a recurring cast: stable voice IDs with written personas and comedic timing.
- Codify VO-as-clock into a reusable [[The Shop|Shop]] pipeline template (script → audio → measure → fill).
- Prototype the interactive radio play.
- Promote out of `_ops/scratch/` into a proper bundle once the template stabilizes.
