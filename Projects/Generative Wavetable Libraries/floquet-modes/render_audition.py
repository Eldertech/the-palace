#!/usr/bin/env python3
"""
Floquet Modes — audition sweep render.

Plays the rendered Ableton table (64 frames x 1024 samples) as a real wavetable:
holds a fixed pitch and scans the wavetable Position knob 0 -> 1 over the
duration, so the ear hears exactly the timbral motion the Position sweep
produces. This is the listenable proof — no synth required to audition.

Playback: phase-accumulator oscillator at F0; for each output sample the
current single-cycle is a linear blend of the two bracketing frames, read at
the running phase with linear interpolation. Short raised-cosine fades guard the
ends against clicks.
"""

import wave
import numpy as np

TABLE_WAV = "floquet_modes_ableton.wav"
OUT_NAME = "floquet_modes_audition_sweep.wav"

F0 = 110.0          # A2 — low enough to hear the harmonic bloom clearly
SR = 44100
DURATION = 8.0
SAMPLES_PER_FRAME = 1024
N_FRAMES = 64


def load_table(path):
    with wave.open(path, "rb") as w:
        n = w.getnframes()
        raw = w.readframes(n)
    data = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0
    return data.reshape(N_FRAMES, SAMPLES_PER_FRAME)


def render(table):
    n_out = int(SR * DURATION)
    out = np.zeros(n_out, dtype=np.float64)

    phase = 0.0
    dphase = F0 / SR                       # cycles per sample, wraps [0,1)
    for i in range(n_out):
        pos = (i / (n_out - 1)) * (N_FRAMES - 1)   # 0 .. 63
        f0i = int(np.floor(pos))
        f1i = min(f0i + 1, N_FRAMES - 1)
        ffrac = pos - f0i

        # sample-read index within the cycle
        s = phase * SAMPLES_PER_FRAME
        s0 = int(np.floor(s)) % SAMPLES_PER_FRAME
        s1 = (s0 + 1) % SAMPLES_PER_FRAME
        sfrac = s - np.floor(s)

        a = (1 - sfrac) * table[f0i, s0] + sfrac * table[f0i, s1]
        b = (1 - sfrac) * table[f1i, s0] + sfrac * table[f1i, s1]
        out[i] = (1 - ffrac) * a + ffrac * b

        phase += dphase
        if phase >= 1.0:
            phase -= 1.0

    # fades
    fade = int(0.02 * SR)
    env = np.ones(n_out)
    ramp = 0.5 * (1 - np.cos(np.linspace(0, np.pi, fade)))
    env[:fade] = ramp
    env[-fade:] = ramp[::-1]
    out *= env

    peak = np.max(np.abs(out))
    if peak > 0:
        out = out / peak * 0.95
    return out


def main():
    table = load_table(TABLE_WAV)
    out = render(table)
    int16 = np.round(out * 32767.0).astype(np.int16)
    with wave.open(OUT_NAME, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(int16.tobytes())
    print(f"audition rendered: {OUT_NAME}  ({DURATION:.0f}s @ {F0:.0f} Hz, "
          f"position 0->1 over the sweep)")


if __name__ == "__main__":
    main()
