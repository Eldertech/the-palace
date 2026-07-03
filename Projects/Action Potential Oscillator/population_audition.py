"""
Population audition for Action Potential Oscillator — cycle 4.

N Kuramoto-coupled integrate-and-fire neurons. Each fires when its
membrane voltage crosses threshold, then enters a refractory period.
A shaped spike (fast Na rise + slower K fall) is summed to the mix.
Coupling K is swept slowly from 0 -> 1; the audible payoff is the
incoherent crowd snapping into a phase-locked drone somewhere in
K ∈ [0.05, 0.3].

Run: python3 population_audition.py
Out: neuropulse-population-audition.wav  (30s, mono, 48kHz)
"""

import numpy as np
from scipy.io import wavfile

SR = 48000
DUR = 30.0
N = 32                              # population size
TAU_MS = 12.0                       # mean membrane time constant
TAU_SPREAD = 0.18                   # heterogeneity (sigma/mean)
F_BASE = 110.0                      # mean natural firing rate (Hz)
F_SPREAD = 0.10
SPIKE_MS = 1.2                      # Na rise + K fall total
REFRAC_MS = 4.0

rng = np.random.default_rng(7)
tau = TAU_MS * 1e-3 * (1 + TAU_SPREAD * rng.standard_normal(N))
f_nat = F_BASE * (1 + F_SPREAD * rng.standard_normal(N))   # natural rates Hz
drive = 1.2 + 0.05 * rng.standard_normal(N)                # rheobase multiplier
spike_samps = int(SPIKE_MS * 1e-3 * SR)
refrac_samps = int(REFRAC_MS * 1e-3 * SR)

# Shaped spike: fast Na rise (1/3) + slower K fall (2/3), asymmetric AP.
t_sp = np.arange(spike_samps)
rise_n = spike_samps // 3
fall_n = spike_samps - rise_n
spike_shape = np.concatenate([
    np.sin(np.linspace(0, np.pi/2, rise_n)) ** 0.6,
    np.cos(np.linspace(0, np.pi/2, fall_n)) ** 1.4 * 0.9,
])
# tail negative dip = hyperpolarization
hp = -0.18 * np.exp(-np.linspace(0, 6, refrac_samps))
spike_full = np.concatenate([spike_shape, hp])

n_total = int(DUR * SR)
mix = np.zeros(n_total + len(spike_full))

# K sweep: slow triangle 0 -> 1 -> 0
def K_at(n):
    x = n / n_total
    return 1.0 - abs(2 * x - 1)   # tri 0..1..0

V = np.zeros(N)
phase_state = np.zeros(N, dtype=np.int32)   # 0 charge, 1 refractory
refrac_left = np.zeros(N, dtype=np.int32)
# Kuramoto phase proxy: track time-since-last-spike / mean period
last_spike = -np.ones(N) * 9999
mean_period = 1.0 / f_nat

# discrete leak coefficient
alpha = np.exp(-1.0 / (SR * tau))
# per-step drive current sized to hit threshold ~ at natural rate without coupling
# threshold = 1 (normalized); steady-state V = drive_i; firing time ~ tau*ln(drive/(drive-1))
I = drive.copy()

V_thresh = 1.0

for n in range(n_total):
    K = K_at(n)

    # Kuramoto-style mean field: where in their cycle is everyone?
    # phase proxy = (now - last_spike) / period, wrap 2π
    now = n / SR
    phi = 2 * np.pi * ((now - last_spike) / mean_period)
    # mean field per neuron: drag toward mean phase
    mean_phi = np.angle(np.mean(np.exp(1j * phi)))
    coupling = K * np.sin(mean_phi - phi)   # phase advance/retard
    # convert phase nudge to instantaneous drive boost (small, signed)
    I_eff = I + 0.35 * coupling

    # LIF integrate (only neurons in charge phase)
    charging = phase_state == 0
    V[charging] = alpha[charging] * V[charging] + (1 - alpha[charging]) * I_eff[charging]

    # Refractory countdown
    refr = phase_state == 1
    refrac_left[refr] -= 1
    done_refr = refr & (refrac_left <= 0)
    phase_state[done_refr] = 0
    V[done_refr] = 0.0

    # Detect threshold crossings
    fired = charging & (V >= V_thresh)
    if np.any(fired):
        # stamp spike into mix (sum over neurons that fired this sample)
        idxs = np.where(fired)[0]
        mix[n:n + len(spike_full)] += spike_full * len(idxs)
        last_spike[fired] = now
        phase_state[fired] = 1
        refrac_left[fired] = refrac_samps + spike_samps
        V[fired] = 0.0

audio = mix[:n_total]
# normalize with headroom
peak = np.max(np.abs(audio))
if peak > 0:
    audio = audio / peak * 0.85

# Soft DC removal — single-pole HPF at ~20 Hz
hpf_a = np.exp(-2 * np.pi * 20.0 / SR)
y = np.zeros_like(audio)
prev_x = 0.0
prev_y = 0.0
for n in range(len(audio)):
    y[n] = hpf_a * (prev_y + audio[n] - prev_x)
    prev_x = audio[n]
    prev_y = y[n]
audio = y

wavfile.write("neuropulse-population-audition.wav",
              SR, (audio * 32767).astype(np.int16))
print(f"wrote neuropulse-population-audition.wav  "
      f"N={N}  dur={DUR}s  sr={SR}  peak_pre_norm={peak:.3f}")
