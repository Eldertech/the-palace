"""
Mathieu equation simulation — hearing a Floquet tongue.

We integrate
    x'' + 2 gamma x' + omega_0^2 (1 + h cos(phi(t))) x = 0
where phi(t) is the phase of a slowly swept modulator. The modulation rate
sweeps through 2*f0, the principal Mathieu/parametric resonance, so you should
hear a tone at f0 emerge from silence as the system enters the tongue, peak,
and decay as the modulation rate sweeps past.

Outputs:
    mathieu_tongue.wav   — the audible state x(t)
    mathieu_tongue.png   — spectrogram with the tongue annotated
"""

import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy.io import wavfile
from scipy.signal import spectrogram

# ---------------------------------------------------------------- parameters
fs = 22050                    # sample rate (cd-quality is overkill for 200 Hz; halve for memory)
duration = 12.0               # seconds
N = int(fs * duration)
t = np.arange(N) / fs
dt = 1.0 / fs

f0 = 200.0                    # natural frequency (Hz)
omega_0 = 2 * np.pi * f0
gamma = 0.002 * omega_0       # weak damping
h = 0.08                      # modulation depth

# Sweep modulation rate from below 2*f0 to above
fT_start = 380.0
fT_end = 420.0
fT = fT_start + (fT_end - fT_start) * (t / duration)
# integrate instantaneous frequency to get phase
phase_T = 2 * np.pi * np.cumsum(fT) * dt

# ---------------------------------------------------------------- integrator
# Velocity Verlet on a damped Mathieu oscillator.
x = np.zeros(N)
v = np.zeros(N)
x[0] = 1e-6                   # tiny seed perturbation

cos_phase = np.cos(phase_T)

for n in range(N - 1):
    omega_sq = omega_0 ** 2 * (1.0 + h * cos_phase[n])
    a_n = -omega_sq * x[n] - 2.0 * gamma * v[n]

    v_half = v[n] + 0.5 * a_n * dt
    x[n + 1] = x[n] + v_half * dt

    omega_sq_next = omega_0 ** 2 * (1.0 + h * cos_phase[n + 1])
    a_next = -omega_sq_next * x[n + 1] - 2.0 * gamma * v_half
    v[n + 1] = v_half + 0.5 * a_next * dt

# ---------------------------------------------------------------- audio out
# Compress dynamic range a bit so the early growth is audible without
# squashing the peak — soft clip via tanh on a log-ish gain stage.
peak = np.max(np.abs(x))
x_norm = x / peak
# Gentle pre-emphasis: bring quiet parts up while leaving peak near 1
x_audio = np.tanh(3.0 * x_norm) * 0.9

wav_path = "mathieu_tongue.wav"
wavfile.write(wav_path, fs, (x_audio * 32767).astype(np.int16))

# ---------------------------------------------------------------- spectrogram
f_spec, t_spec, Sxx = spectrogram(
    x_norm, fs, nperseg=2048, noverlap=1536, window="hann"
)
Sxx_db = 10.0 * np.log10(Sxx + 1e-12)

fig, (ax1, ax2) = plt.subplots(
    2, 1, figsize=(13, 8), gridspec_kw={"height_ratios": [3, 1]}, sharex=True
)

mesh = ax1.pcolormesh(
    t_spec, f_spec, Sxx_db, shading="auto", cmap="magma",
    vmin=Sxx_db.max() - 80, vmax=Sxx_db.max(),
)
ax1.set_ylim(0, 1000)
ax1.set_ylabel("Frequency (Hz)")
ax1.set_title(
    f"Mathieu tongue — f0 = {f0} Hz, h = {h}, "
    f"fT swept {fT_start}–{fT_end} Hz over {duration:.0f} s"
)
ax1.axhline(f0, color="cyan", linestyle="--", alpha=0.7,
            label=f"f0 = {f0} Hz (natural mode)")
ax1.axhline(2 * f0, color="orange", linestyle=":", alpha=0.5,
            label=f"2 f0 = {2*f0} Hz")
ax1.legend(loc="upper right", fontsize=9)
fig.colorbar(mesh, ax=ax1, label="Power (dB)")

# Bottom panel: drive frequency over time, with tongue band highlighted
ax2.plot(t, fT, color="orange", lw=2, label="fT (drive rate)")
ax2.axhline(2 * f0, color="cyan", linestyle="--", alpha=0.7,
            label=f"2 f0 = {2*f0} Hz (principal tongue center)")
ax2.fill_between(
    t, 2 * f0 - h * f0, 2 * f0 + h * f0,
    color="cyan", alpha=0.15, label="approx. tongue width"
)
ax2.set_xlabel("Time (s)")
ax2.set_ylabel("fT (Hz)")
ax2.set_xlim(0, duration)
ax2.legend(loc="upper left", fontsize=9)

plt.tight_layout()
png_path = "mathieu_tongue.png"
plt.savefig(png_path, dpi=140)
plt.close(fig)

print(f"Wrote {wav_path}")
print(f"Wrote {png_path}")
print(f"Peak |x|: {peak:.3e}")
print(f"Final |x|: {np.abs(x[-1]):.3e}")
