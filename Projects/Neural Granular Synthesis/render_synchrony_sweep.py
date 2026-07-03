"""
Render the audible counterpart to raster-three-regimes.png:
a 24 s WAV walking the Kuramoto coupling K from 0 -> 2*K_c so the
crowd of N grain-voices moves from inharmonic wash to fused tone.

Mirrors the live synchrony-sonifier.html offline so Loudon can drop a
fixed audition into his DAW.
"""
import numpy as np
from scipy.io import wavfile
from pathlib import Path

SR        = 48000
DUR       = 24.0
N         = 96
F_MEAN    = 220.0         # Hz, center pitch (A3)
SPREAD    = 0.012         # max relative pitch jitter at r=0
K_MAX_X   = 2.0           # final K in units of K_c
SEED      = 7

rng = np.random.default_rng(SEED)

# natural frequencies (Hz) — narrow gaussian around F_MEAN
nat_hz = F_MEAN * (1.0 + 0.004 * rng.standard_normal(N))
omega  = 2 * np.pi * nat_hz                       # rad/s
# K_c for Kuramoto on a unimodal gaussian: 2/(pi*g(0)); we nondimensionalise
# the slider against mean angular freq so K=1 sits near criticality, matching
# the explorer's coupling-scaling fix from cycle 3.
K_c    = float(np.mean(omega))                    # nondim base
jitter = rng.standard_normal(N)

# control-rate state
theta  = rng.uniform(0, 2*np.pi, N).astype(np.float64)
CR     = 1000.0                                   # control-rate Hz
DT_C   = 1.0 / CR
SAMPLES_PER_CTRL = int(SR / CR)

n_samples = int(SR * DUR)
audio     = np.zeros(n_samples, dtype=np.float64)

# grain-voice state (continuous oscillators, gain-windowed)
voice_phase = rng.uniform(0, 2*np.pi, N)
voice_gain  = np.zeros(N)
voice_env_t = np.zeros(N)        # seconds into current grain
voice_dur   = np.full(N, 0.08)
prev_theta  = theta.copy()
r_smooth    = 0.0

t_ctrl = 0.0
sample_idx = 0
ctrl_steps = int(DUR * CR)

def order_param(th):
    z = np.mean(np.exp(1j * th))
    return abs(z), np.angle(z)

for step in range(ctrl_steps):
    frac = step / (ctrl_steps - 1)
    K = K_MAX_X * frac * K_c                      # 0 -> 2*K_c

    r, psi = order_param(theta)
    r_smooth = 0.9 * r_smooth + 0.1 * r

    # Kuramoto mean-field update
    dtheta = omega + K * r * np.sin(psi - theta)
    new_theta = theta + dtheta * DT_C

    # detect wrap-throughs (grain onsets)
    wrapped = (np.floor(new_theta / (2*np.pi)) !=
               np.floor(theta / (2*np.pi)))
    # onset alignment: grains near psi are loud; off-phase quieter, scaled by r
    align   = 0.5 + 0.5 * np.cos(new_theta - psi)
    onset_g = (1.0 - r_smooth) + r_smooth * align
    voice_gain  = np.where(wrapped, 0.9 * onset_g, voice_gain)
    voice_env_t = np.where(wrapped, 0.0, voice_env_t)
    voice_dur   = np.where(wrapped, 0.06 + 0.10 * r_smooth, voice_dur)

    # detune collapse: pitch = f_mean*(1 + spread*(1-r)*jitter_i)
    voice_hz = F_MEAN * (1.0 + SPREAD * (1.0 - r_smooth) * jitter)

    theta = new_theta

    # render this control block
    blk = SAMPLES_PER_CTRL
    end = min(sample_idx + blk, n_samples)
    L   = end - sample_idx
    if L <= 0:
        break
    tt = np.arange(L) / SR

    # advance voice phases linearly across the block
    w = 2*np.pi * voice_hz
    phase_grid = voice_phase[:, None] + w[:, None] * tt[None, :]
    voice_phase += w * (L / SR)
    voice_phase %= 2*np.pi

    # raised-cosine envelope over voice_dur[i]
    env_t = voice_env_t[:, None] + tt[None, :]
    norm  = np.clip(env_t / voice_dur[:, None], 0.0, 1.0)
    env   = 0.5 - 0.5 * np.cos(np.pi * norm)
    env  *= (env_t < voice_dur[:, None])

    sig = np.sin(phase_grid) * env * voice_gain[:, None]
    audio[sample_idx:end] = sig.sum(axis=0) / np.sqrt(N) * 0.8

    voice_env_t += L / SR
    sample_idx = end

# soft clip, normalise
audio = np.tanh(1.2 * audio)
peak  = np.max(np.abs(audio)) + 1e-9
audio = (audio / peak * 0.95 * 32767).astype(np.int16)

out = Path(__file__).parent / "synchrony-sweep.wav"
wavfile.write(out, SR, audio)
print(f"wrote {out}  ({DUR:.1f}s, N={N}, K: 0 -> {K_MAX_X}*K_c)")
