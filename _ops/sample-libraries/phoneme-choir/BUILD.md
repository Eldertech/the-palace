# Phoneme Choir — Build Contract

Sister to [[Talking Keyboard]]. Phase 1.x of [[Generative Sample Libraries]] — same Kokoro stack, different deliverable: every key fires a unique vocalization from a wide phoneme catalog voiced by a rotating pool of Kokoro voices.

## Stack

- **Source**: Kokoro-ONNX TTS, Loudon's TTS venv at `/Users/loudonstearns/documents/TTS/`
- **Model**: `kokoro-v1.0.onnx`, voices `voices-v1.0.bin` (54 voices in bundle)
- **Sample rate / depth**: 24 kHz mono, 16-bit PCM (Kokoro native)
- **Format**: SFZ
- **Player**: sforzando

## Architecture

One SFZ, 88 MIDI notes (A0=21 → C8=108) × 4 velocity layers = **352 unique cells**. Each cell is one (phoneme × voice) pair. No pitch-shifting — every sample plays at native pitch; the keyboard is a trigger pad.

## Phoneme catalog (88 percussive utterances, mapped in this order to MIDI 21–108)

Pivoted 2026-05-03 from the original mixed catalog after Kokoro proved unable to render trills (the `brrrrahhh` audition came out syllabified as "be-ah-rah-rah-rah", and no spelling variant fixed it). The whole instrument is now real percussive utterances Kokoro speaks cleanly, with sharp transients that exercise the responsive-onset pipeline well.

Categories: pops & taps, snaps & claps, drips & plops, clinks & clonks, knocks & thunks, pings & pongs, bangs & booms, beatbox kit syllables, short barks, sharp utterances.

| MIDI | Slug | Spoken text | MIDI | Slug | Spoken text |
|---|---|---|---|---|---|
| 21 | pop | pop     | 65 | ping  | ping  |
| 22 | tap | tap     | 66 | pang  | pang  |
| 23 | pat | pat     | 67 | pong  | pong  |
| 24 | tip | tip     | 68 | bang  | bang  |
| 25 | top | top     | 69 | bong  | bong  |
| 26 | dot | dot     | 70 | bonk  | bonk  |
| 27 | dap | dap     | 71 | bunk  | bunk  |
| 28 | dab | dab     | 72 | boom  | boom  |
| 29 | bop | bop     | 73 | blam  | blam  |
| 30 | bub | bub     | 74 | wham  | wham  |
| 31 | dub | dub     | 75 | bash  | bash  |
| 32 | nub | nub     | 76 | crash | crash |
| 33 | snap | snap   | 77 | smash | smash |
| 34 | clap | clap   | 78 | zap   | zap   |
| 35 | slap | slap   | 79 | zip   | zip   |
| 36 | flap | flap   | 80 | zoom  | zoom  |
| 37 | trap | trap   | 81 | dum   | dum   |
| 38 | clip | clip   | 82 | dom   | dom   |
| 39 | slip | slip   | 83 | tom   | tom   |
| 40 | snip | snip   | 84 | bim   | bim   |
| 41 | drip | drip   | 85 | bom   | bom   |
| 42 | plop | plop   | 86 | kim   | kim   |
| 43 | blip | blip   | 87 | kum   | kum   |
| 44 | blop | blop   | 88 | gum   | gum   |
| 45 | plonk | plonk | 89 | woof  | woof  |
| 46 | plink | plink | 90 | ruff  | ruff  |
| 47 | plunk | plunk | 91 | arf   | arf   |
| 48 | clink | clink | 92 | yip   | yip   |
| 49 | clank | clank | 93 | yap   | yap   |
| 50 | clonk | clonk | 94 | bark  | bark  |
| 51 | clunk | clunk | 95 | mew   | mew   |
| 52 | clock | clock | 96 | peep  | peep  |
| 53 | click | click | 97 | chirp | chirp |
| 54 | clack | clack | 98 | oink  | oink  |
| 55 | cluck | cluck | 99 | ha    | ha!   |
| 56 | knock | knock | 100 | ho   | ho!   |
| 57 | thunk | thunk | 101 | hey  | hey!  |
| 58 | tonk | tonk   | 102 | yo   | yo!   |
| 59 | tock | tock   | 103 | hup  | hup!  |
| 60 | tick | tick   | 104 | hut  | hut!  |
| 61 | tank | tank   | 105 | ouch | ouch! |
| 62 | dink | dink   | 106 | eek  | eek!  |
| 63 | dong | dong   | 107 | tsk  | tsk!  |
| 64 | ding | ding   | 108 | tut  | tut!  |

## Voice pool (12, bucketed by velocity)

| Velocity | Character | Voices |
|---|---|---|
| v1 (1–32) | gentle / breathy | af_nova, af_sky, bf_isabella |
| v2 (33–64) | warm | af_heart, af_bella, bm_lewis |
| v3 (65–96) | characterful / accent | bf_emma, bm_george, am_puck |
| v4 (97–127) | bold | am_michael, am_adam, am_fenrir |

Selection rule: `voice = bucket[v][note_index_within_range % 3]`. Velocity always changes voice character; within a bucket the specific voice cycles across nearby notes.

All 12 voices verified present in `voices-v1.0.bin` on 2026-05-03.

## Responsive-onset pipeline (the new step)

Every rendered WAV runs through three stages before its SFZ region is written:

1. **Onset detection** — find first sample where 5 ms windowed RMS exceeds **−45 dBFS**. This is the actual start of the phoneme; everything before it is Kokoro's leading silence/breath.
2. **Sample offset** — set SFZ `offset=` to (onset_sample − 2 ms-worth-of-samples = 48 samples @ 24 kHz). Two-millisecond cushion ensures we never clip the attack transient even if onset detection is slightly aggressive.
3. **Click-suppression fade-in** — set `ampeg_attack=0.003` (3 ms) on every region. Smooths the discontinuity from starting mid-waveform.

Onset detection runs in numpy — no extra deps. Offsets are written into `offsets.json` after the render and consumed by the SFZ writer.

## Filename and folder layout

- WAVs: `samples/phon_<3digit>_<slug>_<voice>.wav` → `phon_035_brrrahh_am_michael.wav`
- SFZ: `phoneme_choir.sfz` at project root
- Offsets sidecar: `offsets.json` at project root
- Build log: `build-log.md` at project root

## Counts

- 88 phonemes × 4 velocity layers = **352 WAV files**
- Estimated render time: ~2 minutes (extrapolated from Talking Keyboard's 352-file render)
- Estimated total size: ~16 MB

## Acceptance gates

- **Audition gate**: render `phon_035_brrrahh` × all 4 velocity-voices = 4 files. Loudon listens. Must hear: trill character preserved, no leading silence, no click on attack, four distinct voice characters. Only then full batch.
- **Final gate**: load `phoneme_choir.sfz` in sforzando. Spot-check a vowel, a plosive, a trill, a vocalization, a weird. Each should fire instantly with no leading silence and no click.
