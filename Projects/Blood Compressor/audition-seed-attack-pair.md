---
title: "Blood Compressor — Audition Seed (the attack pair)"
type: artifact
parent: "[[Blood Compressor]]"
created: 2026-06-04
tier: study
status: draft
links:
  - target: "[[Blood Compressor]]"
    type: connects-to
    label: audition-seed-smallest-unit
  - target: "[[sfx-cue-sheet]]"
    type: emerged-from
    label: consolidates-SFX09-SFX10
  - target: "[[radio-play-script]]"
    type: emerged-from
    label: Scene-4-attack-payoff
  - target: "[[Shop/Stable Audio Open]]"
    type: enables
    label: dispatch-target
  - target: "[[Shop/Kokoro]]"
    type: enables
    label: voice-target
  - target: "[[Shop/ffmpeg]]"
    type: enables
    label: assembly-target
sibling: "[[sfx-cue-sheet]]"
sibling: "[[radio-play-script]]"
sibling: "[[visuals-spec]]"
---

# Blood Compressor — Audition Seed (the attack pair)

This is the **smallest unit that exercises every part of the lesson's machine** —
voice, sound effect, biological frame, and the one piece of pedagogy that only
works as *sound and not as words*: attack time felt as a gap. The home entry's
pedagogical framing says render the smallest unit that exercises every parameter,
pause for human audition, commit to the full batch only after acceptance. This
file *is* that unit, pulled out of the [SFX cue sheet](sfx-cue-sheet.md) and
[radio-play script](radio-play-script.md) into one dispatchable brief so that the
Maker can render it without decoding the whole 17-cue sheet first.

The seed answers one question before we spend the full batch: **does the
biological frame survive contact with the ear?** If the 600 ms gap between the
nerve-zip and the muscle-thump lands as "oh — *that's* what attack is," the frame
works and the rest of the batch is justified. If it lands as two disconnected
noises, we found that out in ~7 minutes of render instead of ~20.

## Why this is the seed and not Scene 6

Scene 6's compressed-vs-uncompressed vocal (SFX13/SFX14) is the *climax*, but it
proves a different thing: that a real compressor audibly evens out a real voice —
which every engineer already believes. The attack pair proves the thing the whole
device is staked on: that a *bodily* delay and a *DSP* delay are the same felt
object. That is the load-bearing claim. Audition it first.

## The unit, end to end (~22 seconds)

| # | Element | Source | Duration | Notes |
|---|---|---|---|---|
| 1 | NARRATOR line A | Kokoro | ~8s | "When my baroreceptors fire, the signal travels up the vagus nerve … and then back out … to the smooth muscle in the artery walls." |
| 2 | NARRATOR line B | Kokoro | ~9s | "So when your blood pressure spikes … there is a hundred-and-fifty-millisecond delay between the moment my baroreceptors feel the spike and the moment my muscle layer responds. During that delay, the pressure is *uncompressed*. It is passing through. That's your attack time." |
| 3 | SFX09 — neural-zip | Stable Audio Open → ffmpeg trim | 120ms | placed on the word "fire" / at the head of the demonstration beat |
| 4 | **the gap** | silence in the bed | **600ms** | this is the deliverable — the felt attack time |
| 5 | SFX10 — delayed-thump | Stable Audio Open | 800ms | the muscle actually contracting, 600 ms after the zip |

The two NARRATOR lines give the SFX pair its pedagogical context — without the
voice, the zip-gap-thump is just a sound design gesture; with it, the gap *is* the
sentence's meaning made audible. Render the voice too; the seed is not the SFX in
isolation.

## Exact render briefs

**SFX09 — neural-zip** (Stable Audio Open, Sketch tier)
> *"quick zipping sound ascending in pitch over 120 milliseconds, short electric
> crackle, hint of biological wetness, simulating a single action potential
> traveling along a nerve, ~600–4000 Hz frequency sweep, dry"*
Render at the model's ~1 s floor, then ffmpeg-trim to 120 ms with envelope
shaping (fast attack, fast decay). Standards report must flag the trim.

**SFX10 — delayed-thump** (Stable Audio Open, Sketch tier)
> *"single low thump, dry, no reverb, biological character, ~80 Hz fundamental,
> brief sustain, muscle contraction sound, ~800 milliseconds total length"*
Dry. No reverb tail — the dryness is what makes it read as *the body's own*
response rather than a room.

**NARRATOR lines** (Kokoro, Study tier) — the two lines above, read at the
radio-play house voice: measured, unhurried, −16 LUFS integrated. ~17 s combined.

## Assembly (ffmpeg)

1. Lay the two NARRATOR lines as the spine.
2. Place SFX09 at the demonstration beat (after "That's your attack time").
3. Insert **exactly 600 ms of silence** in the bed.
4. Place SFX10 at the end of that gap.
5. No music bed, no heartbeat under the seed — the gap must be *silent* so the ear
   has nothing to fill it with. The silence is the instrument here.
6. Master: 48 kHz stereo WAV, −1 dBTP. Filename
   `blood-compressor-audition-seed-attack-pair.study.wav`.

## The single audition question

When this comes back, the question I will put to Loudon is not "is the mix clean"
— it is: **does the 600 ms gap teach?** Specifically —
- Does the silence read as *suspense / the body about to respond*, or as *dead air
  / a mistake*?
- Is 600 ms the right gap, or should it stretch toward the script's literal 150 ms
  baroreceptor delay (tighter, more anatomically honest) or further past 600 ms
  (more dramatically legible, less honest)? The script picked 600 ms for drama; the
  ear gets the final vote.
- Does the dry thump read as *muscle* or as *kick drum*? If kick, the timbre
  palette needs a note before the full batch.

If the gap teaches, the frame is proven and the full 17-cue batch is greenlit. If
it doesn't, we adjust the gap and the SFX10 timbre here — cheaply — before
committing.

## Resource cost

- Stable Audio Open: 2 Sketch cues, ~1 min wall-clock.
- Kokoro: 2 lines, ~2 min wall-clock.
- ffmpeg: 1 assembly pass, <1 min.
- **Total: ~7 minutes** from dispatch to a master WAV Loudon can play.

<!-- CLAUDE → LOUDON: I authored this seed brief this cycle because request
blood-compressor-007 (the "render the seed before the batch?" question) is still
open on the TRICKSTER board and I shouldn't re-ask it blind. Consolidating the
seed into one dispatchable file is the work I could advance without your answer —
now "RENDER-SEED" is a single click that points at this file, not a decode job. -->
