#!/usr/bin/env python3
"""
kernel_lib — the coupling-kernel population core for Neural Granular Synthesis.

Cycle 6 result, in one sentence: the mean-field population the project has run
since cycle 3 is the *degenerate* case of a more general model, and the two
raster signatures the entry names but has never rendered — traveling waves
(diagonal bands) and chimeras (coherent and incoherent domains coexisting) —
are mathematically unreachable from it.

The general model is Kuramoto-Sakaguchi on a ring:

    dtheta_i/dt = omega_i - K * SUM_j G(i-j) * sin(theta_i - theta_j + alpha)

Two knobs the project did not have:

  G  the coupling KERNEL over ring distance. Uniform G = the old mean-field
     model. Narrow G = local coupling. Exponential G (Kuramoto-Battogtokh,
     G(d) = (kappa/2) exp(-kappa*|d|)) = nonlocal, the chimera regime.
  alpha  the phase LAG. alpha = 0 is the old model (pull toward the mean).
     alpha near pi/2 makes a neuron nearly *ignore* its in-phase neighbors,
     which is what lets one patch of the ring lock while its neighbors drift.

Traveling waves need a narrow G (a global mean cannot have a direction).
Chimeras need both a nonlocal G and alpha != 0. Neither exists at G = uniform.

The kernel convolution is done with an FFT so cost is N log N per step, not
N^2 — the shader-parallel posture the entry asks for, on a CPU.
"""
import numpy as np


def ring_kernel(N, kind, kappa=4.0, width=0.06):
    """Normalized coupling weights over ring distance, as a length-N vector
    indexed by lag (so it can be circularly convolved directly)."""
    idx = np.arange(N)
    d = np.minimum(idx, N - idx) / N          # ring distance in [0, 0.5]
    if kind == "uniform":                      # mean-field: every neuron equal
        g = np.ones(N)
    elif kind == "local":                      # narrow Gaussian: neighbors only
        g = np.exp(-0.5 * (d / width) ** 2)
    elif kind == "nonlocal":                   # Kuramoto-Battogtokh exponential
        g = (kappa / 2.0) * np.exp(-kappa * d * 2.0)
    else:
        raise ValueError(kind)
    return g / g.sum()


class RingPopulation:
    """A persistent population of phase-oscillator neurons on a ring.

    Persistent, per the entry: neurons are never created or destroyed, they
    carry phase across every buffer. step() advances the whole population one
    dt and returns the indices that crossed threshold (spiked) this step.
    """

    def __init__(self, N, mean_hz, sigma, kernel, alpha, K, seed=7, twist=0,
                 bump=0.0):
        self.N, self.alpha = N, alpha
        rng = np.random.default_rng(seed)
        jitter = rng.uniform(-1, 1, N)
        self.omega = 2 * np.pi * np.maximum(0.2, mean_hz * (1 + sigma * jitter))
        # K is nondimensionalized against the mean angular frequency, the same
        # convention cycle 3 established, so K ~ 1 makes the coupling pull
        # comparable to the oscillation rate and the knob stays musical.
        self.K = K * float(np.mean(self.omega))
        x = np.arange(N) / N
        if bump:
            # Kuramoto-Battogtokh initial condition: a coherent patch of phase
            # centred on the ring, scrambled elsewhere. A chimera is bistable
            # with full sync, so it has to be SEEDED, not waited for.
            self.phase = np.mod(bump * np.exp(-30 * (x - 0.5) ** 2)
                                * rng.uniform(-1, 1, N), 2 * np.pi)
        else:
            # a twist q winds the phase q times around the ring: a q-armed
            # traveling wave, which only survives under narrow (local) coupling
            self.phase = np.mod(2 * np.pi * twist * x
                                + rng.uniform(0, 0.25, N), 2 * np.pi)
        self.Gf = np.fft.fft(kernel)

    def step(self, dt):
        z = np.exp(1j * self.phase)
        # circular convolution (kernel * z) — the local mean field at each site
        local = np.fft.ifft(np.fft.fft(z) * self.Gf)
        # -K * Im[ e^{i(theta+alpha)} * conj(local_field) ]  ==  the sin() sum
        drive = -self.K * np.imag(np.exp(1j * (self.phase + self.alpha)) * np.conj(local))
        new = self.phase + (self.omega + drive) * dt
        fired = np.nonzero(new >= 2 * np.pi)[0]
        self.phase = np.mod(new, 2 * np.pi)
        return fired

    def r_global(self):
        return abs(np.exp(1j * self.phase).mean())

    def r_local(self, win=0.08):
        """Local order parameter: coherence measured in a window around each
        neuron. Flat and high = locked. Flat and low = drift. HALF HIGH, HALF
        LOW = a chimera — the signature that cannot be seen in r_global."""
        g = ring_kernel(self.N, "local", width=win)
        return np.abs(np.fft.ifft(np.fft.fft(np.exp(1j * self.phase))
                                  * np.fft.fft(g)))


# The four regimes this cycle establishes. K is in units where 1.0 makes the
# coupling pull comparable to the oscillation rate.
REGIMES = [
    dict(name="DRIFT",           kern="uniform",  alpha=0.00,  K=0.0, sigma=0.18,
         twist=0, bump=0.0, width=0.06,
         caption="coupling off -- scatter, r -> 0",
         reads="no pitch at all, just a cloud of unrelated firings"),
    dict(name="MEAN-FIELD LOCK", kern="uniform",  alpha=0.00,  K=1.6, sigma=0.18,
         twist=0, bump=0.0, width=0.06,
         caption="uniform G, no lag -- vertical stripes, r -> 1",
         reads="one fused tone, the whole crowd on one beat"),
    dict(name="TRAVELING WAVE",  kern="local",    alpha=0.00,  K=1.2, sigma=0.01,
         twist=3, bump=0.0, width=0.012,
         caption="narrow G, no lag, q=3 twist -- diagonal bands",
         reads="pitch fused but the image sweeps around the ring"),
    dict(name="CHIMERA",         kern="nonlocal", alpha=1.457, K=1.0, sigma=0.00,
         twist=0, bump=6.0, width=0.06,
         caption="nonlocal G, lag ~ pi/2 -- locked and drifting domains coexist",
         reads="pitch on one side, noise on the other, from ONE population"),
]


def build(reg, N, mean_hz, seed=7):
    kern = ring_kernel(N, reg["kern"], width=reg.get("width", 0.06))
    return RingPopulation(N, mean_hz, reg["sigma"], kern, reg["alpha"], reg["K"],
                          seed=seed, twist=reg["twist"], bump=reg.get("bump", 0.0))
