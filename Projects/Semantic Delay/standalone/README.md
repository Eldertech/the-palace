# Semantic Delay — Standalone Instrument (Stage 2)

The first **playable** moment of the [Phase 1
plan](../../Semantic%20Delay.md#phase-1-plan--svc--vst-2026-04-20): mic in →
phrase segmentation → daemon call → scheduled-playback delay → audio out. No
DAW yet. This is where segmentation feel and delay timing get iterated, in
Python, fast — exactly the `STANDALONE-FIRST` / `BUILD-INSTRUMENT-FIRST`
direction granted on 2026-06-05.

It is the **first caller of the Stage 1 daemon over the wire** (RPC v0.1). It
runs today against the pass-through stub daemon (RTF≈0); the moment Stage 1.5
wires in SoulX-Singer-SVC, the same instrument plays voice-swapped echoes with
no changes here — the daemon's RPC surface is the stable contract.

## Files

- `audio_io.py` — `AudioSource` / `AudioSink` behind one interface. File
  backends (`WavFileSource`, `WavFileSink`) run anywhere; live backends
  (`LiveMicSource`, `LiveSpeakerSink`) wrap `sounddevice`, **imported lazily**
  so the module imports without PortAudio (which does not build in the palace
  sandbox). Also the `pcm_f32le` ↔ float32 helpers the daemon's wire uses.
- `segmenter.py` — `PhraseSegmenter`, a pure-numpy **energy-gate** VAD with
  onset + hangover. The default because webrtcvad / silero carry native build
  deps; it sits behind a one-method interface so a silero backend drops in
  later without touching the loop. Honest for iterating phrase *feel*.
- `delay_engine.py` — `DelayEngine`, the dub heart. Schedules each converted
  phrase at `phrase_end + delay`, sums overlapping echoes per block, lays down
  a geometric feedback train (`gain * feedback**k`). Block-based and
  allocation-light so it ports to C++ at Stage 5 unchanged.
- `instrument.py` — wires it all together. Conversion runs on a background
  worker thread (`PhraseConverter`) so the audio loop is never blocked on IPC —
  the same thread split the VST uses at Stage 5. Scheduling is by absolute
  sample index, so an async conversion lands correctly as long as it finishes
  before its playback sample (always true for a multi-second delay).
- `test_stage2_offline.py` — end-to-end proof: synthetic WAV → segment →
  socket → stub convert → delay → WAV out, asserting the dry tone, the delayed
  echo at the right time, and a quiet gap between them. **Passes** against the
  real daemon subprocess, no mic, no model.
- `demo/` — `stage2-phrase-delay-demo-input.wav` (two dry bursts) and
  `stage2-phrase-delay-demo.wav` (the same bursts after the instrument: a
  4-tap feedback delay at 0.5 s through the pass-through stub). An A/B you can
  listen to today to feel the segmentation + delay behavior.

## Run it

Start the daemon (stdlib-only, no model needed for the stub):

```bash
python ../daemon/semantic_delay_daemon.py
```

Offline (anywhere — this is what the test drives):

```bash
python instrument.py --input in.wav --output out.wav \
    --prompt-wav singer.wav --prompt spirit.test.v1 \
    --delay 0.5 --feedback 0.5 --taps 4
```

Live, on the Mac (needs `pip install sounddevice`):

```bash
python instrument.py --input mic --output speaker --delay 1.0 --feedback 0.4 --taps 3
```

Run the proof:

```bash
python test_stage2_offline.py   # prints PASS
```

## What's deliberately not here

- **No transformation yet** — the stub daemon passes audio through unchanged,
  so today the wet path is a clean delay of your own voice. Real voice-swap
  arrives with Stage 1.5 (model wiring in the daemon), invisibly to this code.
- **No silero/webrtcvad** — the energy gate is the Stage 2 default; a better
  VAD is a drop-in behind `PhraseSegmenter`'s interface when the sandbox
  constraint lifts (Mac-side).
- **No DAW, no plugin** — Stage 5+. The thread split and the block-based,
  allocation-light delay engine are written now so that port is mechanical.
