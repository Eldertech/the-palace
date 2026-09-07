---
title: LDN RTM
type: project
pillars:
  - creation
  - tools
  - practice
  - philosophy
born: 2026-09
stage: sprout
status: active
confidence: working
energy: high
who_leads: human
forward_vector: "I want to prove that reading a manual end to end and testing every claim in it is a real way to learn — by doing it in public, completely, one product at a time, until the catalog itself is the argument. I want to be cheap enough to make that Loudon never dreads a recording day, and complete enough that no one else bothers to compete."
links:
  - target: "[[Loudon Live]]"
    type: member-of
    label: an-activity-of-the-school
  - target: "[[Autodidact Polymaths]]"
    type: exemplifies
    label: the-method-performed
  - target: "[[Progressive Staging]]"
    type: contradicts
    label: atomizes
  - target: "[[Loudon Live Post-producer]]"
    type: enables
    label: first-real-job
  - target: "[[Loudon Live Design System]]"
    type: connects-to
    label: house-style
  - target: "[[Quality Manifesto]]"
    type: connects-to
    label: refuses-the-count
  - target: "[[Toolkit — Audio Plugins]]"
    type: connects-to
    label: future-series-source
  - target: "[[LDN RTM — Live 12]]"
    type: spawned
    label: series-one
---

# LDN RTM

**Read The Manual.** Loudon takes one product's complete manual, reads it end to end, tests every claim in it, and makes a short video for every section — until the whole thing is covered.

This is not a content format that happens to be thorough. It is **a learning method Loudon actually uses**, performed where people can see it. He has read and tested many entire manuals; that is how he came to know the tools he knows. The series makes the method visible and argues, without ever saying so, that it works. The completeness is the evidence.

## The unit and the address

One video per manual section, numbered from the manual itself:

```
LDN RTM · Live 12 · 28.14 Compressor
LDN RTM · Serum 2 · 4.3 Warp Modes
```

The address does five jobs at once and costs nothing. It is a public checklist — anyone can see how much is done. It is citable: a forum answer can say *see RTM Live 12 · 24.4* and it resolves. It sorts, so back-to-back viewing works without curation. It carries no promise, which keeps it inside the [[Loudon Live Design System]] nevers. And it makes the feat legible without Loudon ever mentioning it — the numbers do the bragging.

The version token in the middle is load-bearing. An address only means something against a specific manual, so `Live 12` is a **finished, permanently-correct artifact** when Live 13 ships; the new version gets a short new series covering what changed, not a re-do of 250 videos. Same for Serum 2 → 3.

## Every knob, with an opinion on it

The manual is a **coverage checklist, not a script.** Loudon is not reading it aloud — he is working the device with the manual open beside him, learning it himself as he goes, and testing what it claims. Every parameter gets named and demonstrated. Every parameter also gets his read: what it's actually for, when it matters, what he'd do instead.

That perspective is not a designated segment. It is continuous, because it is simply him talking while he works. This is the whole difference between the series and the manual, and it cannot be systematized — which is why the tooling below deliberately produces *checklists* and never talking points.

## The no-timeline pipeline

The rule is absolute: **no editing timeline is ever opened.** Everything after recording is a batch script.

**Frame.** Live's Info View stays open in the lower left for the entire series, and the webcam sits exactly on top of it — a crop over a panel Loudon never refers to and viewers never need (4:3, not square: the panel isn't). It is a dead zone and a teleprompter in the same rectangle, and it means the cam placement is decided once and never re-checked. Closely cropped, boom mic out of frame, Hue lights on a filming preset, a repeatable backdrop. Clothing changes; the geometry doesn't.

**Legibility.** Live's display zoom at 150%, captured at 1920×1080. This one setting is the difference between watchable and not on a phone, which is where a search for *Vocoder formant shift* happens at 1am.

**Shape.** Three seconds of title card with the Lissajous in motion, then straight into the work — no verbal intro, no throat-clearing, first words are content. Two to six minutes, hard cap eight; over cap splits into `a` / `b`. Ends on the last word, then a single still frame of the Lissajous. No audio tag, no subscribe ask, and never a held frame of Loudon's face.

**Machinery.** The rig is *driven*, not clicked: `Projects/LDN RTM/obs/rtm.py` operates [[OBS]] over its WebSocket. One command runs a preflight that asserts the canvas, every transform, the capture target, the audio device, and live meters proving signal is arriving — and refuses to roll if any of it is wrong. One command rolls a take: card up, record, cut to the work. One ends it: end frame, stop, rename from the checklist row, advance the queue. Mic and program audio land on separate tracks, so a bad balance is a batch fix rather than a re-shoot, and the tail is an end-card held before the stop rather than an ffmpeg pad — so the video stream is copied, never re-encoded, and the batch touches audio only.

**Renders land beside their sources, never in the palace.** `process` writes a `final/` next to the footage it was given; `--out DIR` overrides, and scattered sources are refused rather than guessed at. The first default wrote student feedback into the palace repo, where Loudon went looking for it and did not find it — a knowledge graph is not a media library, and a tool that puts output where its code lives has confused its own convenience for the user's.

**The operator is a checker, not a co-host.** It asserts the rig before a take, stays silent during, and reports after; on a first batch it also checks the *process*, feeding back how the working method should change. The role has no palace entry yet — it earns one when it has run real takes and accumulated its own decisions. The seam is held open at [[Loudon Live Post-producer]] § Deferred.

**The retake rule replaces editing.** Flub and restart. Budget of two — the third take ships with the stumble in it. A 250-video catalog with no stumbles reads as a product; one with them reads as a person, which is the honesty the [[Loudon Live Design System]] asks for.

## Rules that protect the person making it

The stated purpose is to become genuinely comfortable making screen content and to build a process where **no single video is precious and the aggregate is the work.** That goal is fragile in a specific way, so:

- **No video is important. The catalog is important.** Version one stays up. A better Compressor video in a year is `(revisited)`; the old one does not come down.
- **No analytics, ever** — already [[Loudon Live Post-producer]] canon, and on a grind this long, checking views at video 30 is how the project dies. The only signal is someone showing what they made.
- **Ship complete chunks, not calendar slots.** A release is *all eight MIDI effects* or *all of Drift* — never a partial device, never half a chapter. No announced schedule; the pace is allowed to surge and stall.
- **Release without fanfare.** One post at the end, when finishing it will speak for itself.

## Series

- **[[LDN RTM — Live 12]]** — series one. In progress.
- **Queued:** Serum, Soundtoys, and the [[Toolkit — Audio Plugins]] shortlist (H3000 Factory, Diva, Zebra2, Reaktor 6, Surge XT, Vital, MeldaProduction).
- **Sponsored:** a manufacturer buying an RTM is buying a slot in an established, numbered, exhaustive format — a much better thing to sell than a one-off, and the reputation path [[Loudon Live]] already names.

## The control panel — a documented aesthetic override

The recording control panel — the operator's surface, on a second screen — wears the [[BBS Design System]] terminal aesthetic rather than the [[Loudon Live Design System]] house style. CLAUDE.md requires a new override to be a deliberate decision documented in the artifact's parent entry, so: **this is an instrument, not a teaching artifact.** It is read at a glance by one person mid-work, it displays live state — queue position, levels, dropped frames, coverage — and that is the register the swarm terminal already speaks. The house style governs everything the audience sees; the terminal governs what the operator sees. Because capture is scoped to Live's application windows, a panel on a second screen cannot leak into a recording.

## Cross-Domain Resonances

- **[[Loudon Live]]** — RTM is one activity of a sprawling school that also holds workshops, concept videos, interactive artifacts, and retreats. Not the channel; a thing the channel does.
- **[[Autodidact Polymaths]]** — the method made visible. Reading the whole manual and testing every claim *is* the posture, demonstrated rather than described.
- **[[Progressive Staging]]** — the productive contradiction. Staging insists every stage is a complete pedagogical moment; RTM's units are deliberately not moments. Completeness only teaches at catalog scale. Both are true and the palace holds both.
- **[[Loudon Live Post-producer]]** — the batch pipeline is exactly the apprenticeship it was specced for.

## Lost branches

A fixed cadence of twenty videos every other week — proposed and rejected; the pace should be free to surge and stall. The perspective as a designated ninety-second slot — rejected; it is continuous because it is just him. An audio outro tag — rejected. The cam in a screen corner — superseded by the Info View crop. A name other than RTM — rejected; RTM is the umbrella.

## Forward Vectors

*See YAML `forward_vector`.*

**The rig is not RTM-specific, and a second use has already appeared.** `rtm.py` is a queue, a frame, and a batch: only the checklist source and the filename slug know anything about manuals. Loudon records **audio commentary on student projects** the same way — same capture, same two tracks, same normalisation — differing only in what the queue holds (a roster instead of manual sections) and where the output goes (individuals, not a public catalog). Building that is a different queue, not a different tool, and the seam is worth keeping clean as this grows.

The rig is built and tested end to end — preflight, take, stop, rename, batch. What remains before the pilot chunk is `RTM Sandbox.als` (the fixed bed, drum loop, and held chord), one take recorded with real audio, and one video watched at speed. Then: all eight MIDI effects, complete, shipped. After that the control panel, and the YouTube posting path — which arrives at the same connector [[Loudon Live Post-producer]] defers for publishing, from a second direction. Open: whether the Post-producer's promotion ladder counts RTM chunks the way it counts sessions, and whether the public checklist page wants to live in the palace or only on the channel.
