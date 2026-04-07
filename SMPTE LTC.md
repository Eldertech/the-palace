---
title: "SMPTE LTC"
type: project
pillars: [tools, creation]
born: 2026-03
last_activated: 2026-03
activation_count: 1
stage: growing
confidence: working
energy: medium
hook_quality: 7
beauty: 6
who_leads: loudon
links:
  - target: "[[Ableton Extension SDK]]"
    type: connects-to
  - target: "[[Boundary-Crossing Instruments]]"
    type: deepens
    label: reverse-boundary-crossing
  - target: "[[Frequency-Time Duality]]"
    type: connects-to
  - target: "[[Signal-Rate CV Architecture]]"
    type: connects-to
  - target: "[[Modes of Collaboration]]"
    type: connects-to
    label: multi-device-sync
---

# SMPTE LTC

A time-stamping standard encoded as audio signal, essential for locking synthesizers, video playback, and distributed performance systems to a single clock. This is the engineering of temporal synchrony as sound.

## What SMPTE LTC Is

SMPTE Linear Timecode (LTC) is a standardized protocol that encodes time — hours:minutes:seconds:frames — as an audio signal that can be read by any hardware or software that supports it.

**The encoding:** Every frame of time generates 80 bits of audio data, encoded using biphase mark code. At 24 fps (film standard), that's 1920 bits per second; at 25 fps (PAL video), 2000 bits per second; at 29.97 fps (NTSC drop-frame), 2397.6 bits per second. The audio waveform itself carries the time information — peak detection yields the bit stream, and the bit stream yields the timecode.

**Why it matters:** Any audio interface that can send/receive audio can transmit LTC. A camera, a DAW, a synthesizer, a live lighting rig, a second laptop running a different application — all can lock their playheads to a single LTC signal sent from a master clock. No MIDI, no network, no video sync cable required. Just an audio cable and a standard protocol.

**The audio signal:** LTC is typically generated at -10 dBFS nominal level and sent to a spare audio channel (or headphone out) on any interface. Hardware reads it from a microphone input or line in, detects the phase transitions, decodes the bit stream, and locks its transport to it. The signal is "broadcast" — multiple devices can read the same LTC simultaneously.

## The Project Arc

Loudon's LTC project began as an Ableton Extension (Node.js + Ableton Extension SDK) and transitioned to Max MSP v8 native implementation.

**Phase 1: Ableton Extension** — Initial exploration of the Extension SDK led to a working LTC generator in JavaScript. The architecture was clean: `activate(context)` entry point, manifest declaration, message-passing API to Live. The extension could generate LTC bitstreams and output them to Ableton's audio system.

**Phase 2: Max MSP v8** — Port to Max for pedagogical and modularity reasons. Max's native signal processing primitives make the audio generation transparent and hackable. The biphase encoding logic, bit-to-time conversion, and frame-rate handling all become visual, researchable, and extendable. This version is better suited for teaching and for integration into custom performance rigs.

The transition was motivated by a desire to understand the signal flow visually and to build an instrument that lives outside a DAW context.

## Technical Architecture

**Generating the LTC bitstream:**
- Start with hours, minutes, seconds, frames (e.g., 01:34:27:18).
- Pack into 80-bit frame structure: user bits (user data field), timecode value (binary BCD encoding of HH:MM:SS:FF), status bits, parity.
- Encode using biphase mark code: each bit becomes a phase transition (clock edge) and a data transition (data edge). Clock always transitions; data transition depends on bit value.

**Converting bitstream to audio:**
- Biphase at the selected frame rate yields the bit rate: 1920 Hz clock at 24 fps, 2000 Hz at 25 fps, etc.
- Each bit cell is subdivided: clock transition happens early in the cell, data transition (if needed) happens late.
- Generate a square wave or sine wave that follows this pattern. The result is a complex waveform rich in the harmonic series around the clock frequency and data harmonics.

**Frame rate variants:**
- 24 fps: Standard film frame rate.
- 25 fps: PAL video (Europe, Asia).
- 29.97 fps: NTSC standard (North America, Japan) — actually 30000/1001 fps, often notated as 29.97.
- 30 fps: Drop-frame NTSC: compensates for the 29.97 reality by occasionally skipping frame numbers (a trickster convention in the spec itself).

Each variant has a slightly different bit rate and biphase clock frequency, and therefore a different audio spectrum. The decoder must be told the expected frame rate or detect it from the incoming signal.

**Implementation considerations:**
- Precision: Time must advance by exactly one frame per sample block, no drift over long runs.
- Latency: The LTC stream should be generated ahead of or exactly coincident with the audio being locked to it. Latency mismatches cause sync drift.
- Transposition: LTC is often scaled by ±6 dB for transmission over noisy channels or long cable runs, but the waveform shape must be preserved for phase detection to work.

## Why It Matters for Loudon

Loudon's live performance practice involves multiple devices — synthesizers, drum machines, effects units, a DAW, lighting control, possibly multiple computers running different software. Without timecode, they drift apart. Tempo markers, MIDI clock, or Network Time Protocol could provide coarse synchronization, but LTC provides sub-sample precision locking across everything on a single audio cable.

**For the live show:** A single machine runs Ableton (or Max) with LTC being generated and sent out on an unused channel. Every other device — hardware synthesizers, a video playback laptop, lighting control — receives that signal on a line-in and locks to it. The moment the master transport starts, every device on the network is in phase lock. No manual syncing, no beat skew, no waiting for gear to "catch up."

**For the pedagogy:** Building an LTC generator from first principles teaches the full signal chain of timecode: bit serialization, phase encoding, frequency generation, audio-rate signal synthesis. It connects abstract time (frames, BPM) to physical signal (waveform, spectrum). It is a beautiful exercise in audio-as-data.

**Connects to larger patterns:** This is a [[Boundary-Crossing Instrument]] in reverse — not "music becoming science" but "engineering becoming music infrastructure." It is also deeply tied to [[Frequency-Time Duality]]: LTC is literally the time axis encoded in frequency space. Every bit transition is a frequency/phase event. Reading LTC is a frequency-domain act that yields time-domain information.

## Open Questions

- **Human perception of LTC in mixes:** Can you hear LTC? Should it be filtered before monitoring? Most live rigs send LTC on a dedicated cable, but what happens if a human monitors it?
- **Jitter and long runs:** How does cable length, electrical noise, or interface quality affect phase lock? Are there thresholds beyond which LTC becomes unreliable?
- **Resampling and LTC:** If a Max patch is running at 96 kHz and the LTC bitstream was generated at 48 kHz, how does the upsampling affect decoder reliability?
- **Drop-frame NTSC edge cases:** The skip-frame convention in drop-frame NTSC is nonlinear. Has Loudon tested long runs (>1 hour) at 29.97 drop-frame to confirm frame accuracy?
- **Reverse playback:** Can LTC be read backward or at fractional speeds? (Probably not — the biphase code assumes forward continuous time, but worth documenting the answer.)
- **Multi-rate synchronization:** If a 24 fps camera and a 25 fps video system both need to lock to the same master, can a single LTC stream serve both, or does each need its own?

## The Trickster in Timecode

Timecode is a trickster convention: it pretends to measure absolute time but is in fact a counter. It has no relation to real time (wall clock time). A scene that is 1 second long in real time can be represented as 00:00:01:00 (one frame at 1 fps, nonsensical) or 00:00:01:24 (one frame at 24 fps) or 00:00:01:00 (one second in any fps if frames are large). The encoding is relative to frame rate, not to time. It is a beautiful abstraction, and SMPTE LTC makes it audible.
