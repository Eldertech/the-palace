---
title: "Blood Compressor — spec — sfx-cue-sheet"
born: 2026-05-27
links:
  - target: "[[Blood Compressor]]"
    type: connects-to
    label: lesson-first-sfx-spec
  - target: "[[Shop/Stable Audio Open]]"
    type: enables
    label: dispatch-target-primary
  - target: "[[Shop/ffmpeg]]"
    type: enables
    label: mix-target
  - target: "[[Compressor Design]]"
    type: connects-to
forward_vector: "I am the SFX cue sheet for Blood Compressor's lesson — every sound effect the radio play calls for, spec'd for dispatch."
---

# Blood Compressor — SFX Cue Sheet

Sound-effect briefs for the [Blood Compressor radio-play lesson](radio-play-script.md). One cue per row, each prepared as a brief the Maker can hand to the right Specialist without further decoding.

This is a **spec sheet, not a dispatch order**. The Maker would receive this, decode each row, route to the appropriate Specialist (almost all to Stable Audio Open, one or two to Loudon's voice / a pre-recorded source), and run the brief through Stable Audio Open's standards report before delivery.

## House standards inherited from [[Shop/Maker]]

- Sample rate: **48 kHz stereo** for SFX bed (Stable Audio Open's native output is 44.1 kHz stereo; ffmpeg conversion to 48k applied at mix time).
- Loudness: SFX bed contribution ducked to sit **−20 LUFS short-term** beneath voice (voice itself sits at −16 LUFS integrated per the radio-play house spec).
- All SFX delivered as 44.1 kHz/16-bit WAV; ffmpeg handles SR conversion and bus-routing.
- Palette: timbre palette is the **vesselscape** — warm low mid frequencies (200–800 Hz fundamentals), fleshy/wet textures, no metallic or "synthetic" timbres unless explicitly marked.
- All cues must respect the model's ~47-second output ceiling per the [[Shop/Stable Audio Open]] Specialist entry. Most cues here are 1–6 seconds; the longest (SFX01, SFX15) are under 8s.

## Cue Inventory

### SFX01 — heartbeat-establish

- **Where**: Cold open, 0:00–1:30
- **Specialist**: Stable Audio Open
- **Duration**: 8s (loopable, fading in)
- **Prompt**: *"close-mic'd human heartbeat, 60 bpm, isolated, soft room reverb, no music, low-mid frequency emphasis, slightly wet/biological character, mono-summable, gentle fade-in feel"*
- **Tier**: Study (CFG ~5.0, ~75 steps)
- **Notes for the engineer**: This is the only cue that runs *under* the entire cold open. Render at a level that allows ducking to ~30% under voice. Loop point: design for a 2-second loopable segment so ffmpeg can extend if needed.

### SFX02 — heartbeat-and-blood

- **Where**: Cold open, ~1:00
- **Specialist**: Stable Audio Open (layered with SFX01 at mix time)
- **Duration**: 5s
- **Prompt**: *"sub-bass blood flow rush, ~40Hz fundamental, watery, pulsing slowly, biological texture, no melody, no rhythm beyond a slow undulation, dark and warm"*
- **Tier**: Study
- **Notes**: Layer with SFX01 at mix; the heartbeat carries the foreground and this is the bed. Apply low-pass at 200 Hz at mix time if it competes with voice clarity.

### SFX03 — scene-transition-flutter

- **Where**: Between every scene (used 7 times in the script)
- **Specialist**: Stable Audio Open
- **Duration**: 1.5s
- **Prompt**: *"short ascending textural flutter, soft attack, decaying tail, like a bird taking off into the distance but processed wet/biological rather than literal, ~1.5 seconds, suitable for scene-to-scene transition"*
- **Tier**: Sketch (this is repeated 7x; render once, reuse via ffmpeg)
- **Notes**: One render serves all seven scene transitions. Reuse aggressively. If the seventh placement feels stale, ask Stable Audio for one variant for the scene 5 → 6 transition (the most pivotal beat — the climax setup).

### SFX04 — studio-monitor-bus

- **Where**: Scene 1, ~3:00 — the "before/after kick drum" demo of audio compression
- **Specialist**: **Pre-recorded source** (NOT Stable Audio Open — the Specialist refuses production-grade rhythmic content)
- **Duration**: 3s total (1.5s uncompressed kick loop, 1.5s compressed kick loop)
- **Source**: Loudon's existing kick samples + a Max for Live compressor patch processing them, or a pre-recorded A/B sample from the [[Compressor Design]] proofs folder.
- **Tier**: Study
- **Notes**: This is the "engineer's version" demo — has to be audibly a compressor working. If sourced from existing material, flag the source in the standards report. The bias is to use real audio, not synthetic, because the cue is making the engineer's argument concrete.

### SFX05 — gentle-heart-thump

- **Where**: Scene 1, ~5:30
- **Specialist**: Stable Audio Open
- **Duration**: 1s
- **Prompt**: *"single isolated heart thump, no reverb, close-mic'd, dry, biological wet texture, one beat only, then silence"*
- **Tier**: Sketch
- **Notes**: Isolated punctuation after BODY's first introduction. Render dry; mix engineer may add small reverb tail if the surrounding bed sounds too clean.

### SFX06 — small-realization-chime

- **Where**: Scene 2, ~8:30 — the moment ENGINEER recognizes the soft knee
- **Specialist**: Stable Audio Open
- **Duration**: 1.5s
- **Prompt**: *"single soft bell chime, ~3 partial bell tones blended, mid-high register (~600–1200 Hz), short attack, medium decay, slightly metallic but warm, the sound of a small insight landing — not triumphal, just clear"*
- **Tier**: Sketch
- **Notes**: This is the *only* metallic timbre in the cue inventory. It is deliberate — the engineer's recognition is the moment the abstract DSP knowledge meets the biological frame, and the chime marks that as a different kind of click than the body's organic textures.

### SFX07 — vessel-narrowing-thump

- **Where**: Scene 2, ~10:00
- **Specialist**: Stable Audio Open
- **Duration**: 1.5s
- **Prompt**: *"low whoosh descending in pitch over 1.5 seconds, soft and fleshy not metallic, the sound of a wet vessel narrowing inward, biological character, mid frequency emphasis (~200–500 Hz), no high transients"*
- **Tier**: Study
- **Notes**: This is the first time the audience hears the *vessel constricting* as a sound. It establishes the timbre palette for SFX08 (the slow-vessel-clench). They should feel like the same instrument.

### SFX08 — slow-vessel-clench

- **Where**: Scene 3, ~13:30
- **Specialist**: Stable Audio Open
- **Duration**: 3s
- **Prompt**: *"slow constriction sound, like a wet rubber band being slowly tightened, very low-mid frequency emphasis (~150–400 Hz), no metallic content, biological wet texture, slow ramp-up over 2 seconds then settle, suitable for representing smooth muscle contraction"*
- **Tier**: Study
- **Notes**: This is SFX07's longer cousin. Same timbre palette, longer arc, more "muscular" feel. May want a Comparison Mode render — Stable Audio Open often produces interesting variants on this prompt that lean either more "rubbery" or more "fleshy." Pick the fleshier one if both are reasonable.

### SFX09 — neural-zip

- **Where**: Scene 4, ~17:30
- **Specialist**: Stable Audio Open
- **Duration**: 120ms (short!)
- **Prompt**: *"quick zipping sound ascending in pitch over 120 milliseconds, short electric crackle, hint of biological wetness, simulating a single action potential traveling along a nerve, ~600–4000 Hz frequency sweep, dry"*
- **Tier**: Sketch
- **Notes**: Very short. Stable Audio's minimum useful output is ~1s; this cue will be rendered at 1s then trimmed in ffmpeg to 120ms with envelope shaping. Standards report should flag the trim explicitly.

### SFX10 — delayed-thump

- **Where**: Scene 4, ~17:30 (paired with SFX09, ~600ms after)
- **Specialist**: Stable Audio Open
- **Duration**: 800ms
- **Prompt**: *"single low thump, dry, no reverb, biological character, ~80 Hz fundamental, brief sustain, muscle contraction sound, ~800 milliseconds total length"*
- **Tier**: Sketch
- **Notes**: This is the *payoff* of the attack-time pedagogy. The gap between SFX09 (the action potential) and SFX10 (the muscle response) is the listener's first felt experience of *attack time*. The 600ms gap must be respected at mix time — it is the lesson made audible. ffmpeg places this cue precisely.

### SFX11 — long-exhale

- **Where**: Scene 5, ~22:00
- **Specialist**: Stable Audio Open
- **Duration**: 4s
- **Prompt**: *"slow human exhale, processed wet, ~4 seconds long, like wind leaving a vessel, heard through tissue rather than air, no plosives, low to mid frequency emphasis (~100–600 Hz)"*
- **Tier**: Study
- **Notes**: The release-curve scene needs a felt sense of "letting go." This cue is doing pedagogical work — it's the sonic embodiment of *release as slower than attack*. Render at Study tier because the timbre quality matters; a Sketch render here often comes back too "literal sigh" and not enough "tissue-membrane resonance."

### SFX12 — heartbeat-resurfacing

- **Where**: End of Scene 5, ~24:00
- **Specialist**: Stable Audio Open (or reuse SFX01)
- **Duration**: 4s
- **Prompt**: *"close-mic'd heartbeat, 60 bpm, fading in from silence over 4 seconds, soft, biological character — re-emerging gently as background presence"*
- **Tier**: Sketch
- **Notes**: This is the heartbeat from the cold open returning. May be a re-use of SFX01 with a different fade envelope applied in ffmpeg, rather than a fresh render. Maker's call — the fade-in shape is what matters, not the source.

### SFX13 — uncompressed-vocal

- **Where**: Scene 6, ~26:00 — the "before" demo
- **Specialist**: **Pre-recorded source** (NOT Stable Audio Open — the Specialist refuses vocal content with melodic structure)
- **Duration**: 4s
- **Source**: Loudon's own voice singing a single sustained phrase (an "ahhh" with natural dynamic shaping — soft start, louder middle, soft end), recorded dry, no processing.
- **Tier**: Study (use Loudon's voice rather than synthesis — the lesson requires a real voice with real dynamic range)
- **Notes**: Critical that this is *truly uncompressed*. If pulled from existing recordings, verify no compression has been applied in the source. The dynamic range is the teaching tool.

### SFX14 — compressed-vocal

- **Where**: Scene 6, ~26:30 — the "after" demo
- **Specialist**: **Pre-recorded source + processing** (SFX13 routed through a real compressor or a Max for Live compressor with the parameters NARRATOR has just spoken)
- **Duration**: 4s
- **Source**: SFX13, compressed with: threshold = −18 dBFS, ratio = 4:1, attack = 30ms, release = 300ms, knee = soft (3 dB).
- **Tier**: Study
- **Notes**: The audible difference between SFX13 and SFX14 must be obvious — not subtle. Set threshold low enough that the loud middle of the phrase is *visibly* compressed by 6 dB or more. Make-up gain restores the perceived level so the listener hears the *evenness*, not the volume drop. This is the moment where 25 minutes of pedagogy lands as sound.

### SFX15 — full-bed

- **Where**: End of Scene 6, ~28:30
- **Specialist**: Stable Audio Open (layered with SFX01-style heartbeat at mix)
- **Duration**: 6s
- **Prompt**: *"slow atmospheric pad, Eb minor harmonic context, sustained, warm, no rhythm, low-pass filtered (~3 kHz cutoff), suitable as bed under a closing narration, evocative without being maudlin"*
- **Tier**: Study
- **Notes**: This is the emotional landing of the script. Stable Audio Open's strength is exactly this kind of textural pad. The Eb minor isn't strictly necessary — pick a pitch context that sits 6–8 semitones below the body of the voice tracks for comfortable mix-bed sit.

### SFX16 — final-heartbeat

- **Where**: Outro, 29:45
- **Specialist**: Stable Audio Open (or final beat of SFX01 isolated)
- **Duration**: 1s
- **Prompt**: *"single isolated heartbeat, dry, close-mic'd, no reverb, biological wet, slightly louder than typical (the final beat), then silence"*
- **Tier**: Sketch
- **Notes**: The dramatic punctuation. Volume sits ~3 dB above the bed's baseline heartbeat to read as the *final* beat. Followed by ~1.5s of intentional silence in the master before SFX17 swells.

### SFX17 — outro-bed

- **Where**: Outro, 29:50–30:00
- **Specialist**: Continuation of SFX15 (fade out)
- **Duration**: 4s
- **Source**: SFX15 with fade-out applied in ffmpeg.
- **Tier**: Sketch (it's a fade-out of an existing asset, not a fresh render)
- **Notes**: No new render needed. ffmpeg applies a 4-second fade-to-silence on SFX15's tail.

## Mix Bus Routing (Maker → ffmpeg dispatch brief)

Once all cues are rendered and the three voice tracks come back from Kokoro:

1. **Voice bus**: NARRATOR, BODY, ENGINEER tracks summed, normalized to −16 LUFS integrated.
2. **SFX bus**: All SFX summed, ducked to −20 LUFS short-term beneath voice (sidechain to voice bus where possible; static ducking acceptable for Study tier).
3. **Mix bus**: Voice + SFX summed; true-peak limit at −1 dBTP per house standard.
4. **Master**: 48 kHz stereo WAV. Filename `blood-compressor-radio-play.study.wav`.

The mix is straightforward — no complex automation needed beyond the duck. The script's pacing was written to allow voice and SFX to alternate without significant overlap; the overlap zones (cold open and scene 6) are where the ducking matters most.

## Resource Budget Estimate

Per [[Shop/Maker]] resource scheduling discipline:

- **Stable Audio Open jobs**: 13 cues at Sketch tier + 4 at Study tier. Approximate GPU time: ~10 minutes total wall-clock on a single GPU (Stable Audio Open is fast at short durations). All cues can run sequentially without VRAM contention since they're short.
- **Kokoro jobs**: 3 voice tracks (NARRATOR ~9 min, BODY ~2 min, ENGINEER ~2 min) at Study tier — ~3–4 minutes wall-clock total per the Specialist's "5s per sentence" rate.
- **ffmpeg jobs**: Mix bus assembly — ~2 minutes wall-clock.

**Total cycle wall-clock**: ~20 minutes from Maker dispatch to delivered master. Well within a single sitting.

## Standards Report Fields (Maker expects)

For each delivered cue, the Specialist returns:

- Spec adherence (LUFS, sample rate, duration match)
- Render-time wall-clock
- Seed (for Stable Audio Open reproducibility)
- Any deviations flagged
- Loudon-audit recommendation: *ship* or *re-render* per cue

The Maker concatenates these into a single Job Report sent back to Loudon with the master WAV.
