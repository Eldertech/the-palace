"""
Particle Synthesis — render a dispersion audition.

A wideband impulse passed through a dispersion relation omega(k) = c*k + alpha*k^3
so frequency components travel at different group velocities. High frequencies
arrive first; low frequencies trail. The chirp is the audible signature of
physical dispersion -- the sound of a stone skipping on ice, or the attack of a
struck bar.

Renders three seeds at increasing alpha (linear -> mild -> strong dispersion)
so the ear can hear dispersion *emerge* as a parameter, not as an applied
modulation. This is the smallest unit that exercises the physics; the batch is
gated until the ear confirms.
"""
import numpy as np
import wave
import struct
from pathlib import Path

SR = 48000
DUR = 2.0
N = int(SR * DUR)
OUT = Path(__file__).parent

def render(alpha: float, c: float = 1.0, name: str = "seed") -> Path:
    # Wideband impulse: flat spectrum across audible range.
    t = np.arange(N) / SR
    x = np.zeros(N)
    x[100] = 1.0  # impulse at ~2 ms
    X = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(N, 1 / SR)
    # wavenumber k proportional to frequency for a 1D medium
    k = 2 * np.pi * freqs
    # group delay tau(omega) from dispersion relation omega(k) = c*k + alpha*k^3
    # phase velocity vp = omega/k, group velocity vg = d omega / d k = c + 3*alpha*k^2
    # delay = L / vg over a fixed propagation length L=1; normalize so omega=0 -> tau=0
    L = 1.0
    vg = c + 3 * alpha * k**2
    # invert: lower vg -> longer delay; clamp to avoid div0 at k=0
    vg = np.where(vg <= 0, c, vg)
    tau = L / vg - L / c   # subtract reference so the impulse is not bulk-delayed
    # apply linear phase shift per frequency = -omega * tau
    phase = -2 * np.pi * freqs * tau
    X_disp = X * np.exp(1j * phase)
    y = np.fft.irfft(X_disp, n=N)
    # ring it through a soft envelope so the tail decays naturally
    env = np.exp(-t * 1.5)
    y = y * env
    # normalize
    peak = np.max(np.abs(y)) or 1.0
    y = (y / peak) * 0.85
    # write 16-bit WAV
    path = OUT / f"2026-06-23-dispersion-{name}.wav"
    with wave.open(str(path), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        ints = (y * 32767).astype(np.int16)
        w.writeframes(ints.tobytes())
    return path

if __name__ == "__main__":
    for alpha, name in [(0.0, "01-no-dispersion"), (3e-9, "02-mild"), (3e-8, "03-strong")]:
        p = render(alpha, name=name)
        print(f"rendered {p.name}  ({p.stat().st_size} bytes)")
