---
title: "Portamento and Physical Pitch Modeling"
type: project
pillars: [creation, tools, philosophy]
born: 2026-01
last_activated: 2026-03
activation_count: 2
stage: mature
status: active
confidence: working
energy: high
hook_quality: 8
beauty: 8
who_leads: shared
links:
  - target: "[[Action Potential Oscillator]]"
    type: connects-to
  - target: "[[Frequency-Time Duality]]"
    type: deepens
  - target: "[[Kuramoto Coupling]]"
    type: couples-with
  - target: "[[Bessel Functions in Synthesis]]"
    type: connects-to
  - target: "[[Biomechanical Synthesis]]"
    type: connects-to
forward_vector: "I want to become a fully implemented and staged teaching instrument — where overdamped, critically damped, and underdamped portamento are not just equations but audible, feelable distinctions that any student can identify by ear after a single session. I want to develop concrete listening exercises: pairs of portamento examples where the student identifies the damping regime and explains what physical system would produce that trajectory. The physics is already here; the pedagogy needs its exercises."
---

# Portamento and Physical Pitch Modeling

![[Portamento and Physical Pitch Modeling — hero.png]]

Portamento is not a parameter. It is not an effect applied *after* pitch reaches its target. Portamento *is* the continuous physical mechanism of pitch itself — the trajectory through frequency space as a resonant system finds equilibrium. When a vocalist slides between notes, the larynx is a damped oscillator settling toward a new target frequency. When a finger slides on a string, every intermediate length is an instantaneous state under tension. There is no "jump-and-glide" duality; there is only trajectory.

This project models pitch as a second-order physical system. The motion of frequency in time obeys the same law as a mass on a spring with friction. This reveals three distinct sonic characters — overdamped (smooth surrender), critically damped (purposeful arrival), underdamped (overshoot and ring-back) — that are not parameters layered onto synthesis. They are the direct consequence of physical resonance.

## The Physical Reality of Portamento

Pitch is a *process*, not a value. In every physical instrument, pitch change has inertia.

### String Physics

A string under tension T and clamped at both ends has a fundamental frequency determined by its length, mass, and tension:

$$f = \frac{1}{2L}\sqrt{\frac{T}{\mu}}$$

When a finger slides along the string, the vibrating length changes continuously. At every instant, the string is oscillating at the frequency corresponding to its current length. The pitch does not "jump to target" — it *sweeps* through all intermediate frequencies. The trajectory is determined solely by finger velocity and the string's acoustic properties.

Higher harmonics (modes) on the same string do not all slide at the same rate if the geometry is complex. Each mode has its own frequency-length relationship. This multi-modal coupling is why portamento on a real instrument is not a simple glide—it is a family of coupled glides.

### Vocal Physics

The larynx is a coupled resonant system: vocal folds vibrate within a vocal tract. The fundamental frequency is set by:
- Fold tension (innervated by the cricoarytenoid and thyroarytenoid muscles)
- Fold mass (tissue properties)
- Subglottal pressure

Pitch change requires muscle control. There is no instantaneous frequency shift. The larynx is a damped oscillator responding to neural input. When a singer slides from one note to another, muscle activation ramps up or down. The frequency trajectory that results is the transient response of a resonant system to a changing control signal.

**The auditory artifact:** Vocalists typically overshoot slightly when landing on a note from above—they arrive sharp and then settle. This is underdamped behavior. It is not a mistake; it is a feature of the biomechanical system.

## The Second-Order Physical Model

Instead of treating pitch as a dimensionless parameter and applying interpolation as an effect, model pitch frequency f as the output of a damped harmonic oscillator driven toward a target frequency f_target:

$$\frac{d^2f}{dt^2} + 2\zeta\omega_n \frac{df}{dt} + \omega_n^2 (f - f_{\text{target}}) = 0$$

Where:
- **f** = current instantaneous pitch (Hz)
- **f_target** = the note being played (Hz)
- **ω_n** = natural frequency of the resonance (rad/s)
- **ζ** = damping ratio (dimensionless)

This is the equation for a second-order critically damped, underdamped, or overdamped oscillator.

### Initial Conditions

When transitioning from frequency f₀ to f_target, the system starts with:
- f(t=0) = f₀
- df/dt(t=0) = 0 (or df/dt(t=0) = v if there is a specified glide velocity)

### Characteristic Solution Regimes

The behavior depends entirely on **ζ**, the damping ratio:

#### Overdamped (ζ > 1)

The frequency approaches the target smoothly without oscillation:

$$f(t) = f_{\text{target}} + (f_0 - f_{\text{target}}) e^{-t/\tau}$$

(For simplicity; the exact form is a linear combination of two exponential decays.)

**Sonic character:** Smooth, surrender-like. The glide feels languid and liquid. Used in vocals (slide from note to note with apparent ease) and in wind instruments (breath supports the glide). Typical timbre: warm, vocal, sustained.

**Time scale:** Determined by ω_n and ζ. Can be tuned from immediate (ω_n large) to lazy (ω_n small).

#### Critically Damped (ζ = 1)

The system reaches the target as fast as physically possible without overshooting:

$$f(t) = f_{\text{target}} + (f_0 - f_{\text{target}})(1 + \omega_n t) e^{-\omega_n t}$$

**Sonic character:** Purposeful, direct. Arrives with certainty. Neither lingering nor sloppy. Percussive character: the attack phase feels decisive. Used in plucked instruments (pick strike) and struck instruments (hammer impact).

**Time scale:** Two settling times (1/ω_n each) = 2/ω_n total time to reach ~95% of target.

#### Underdamped (0 < ζ < 1)

The frequency overshoots the target and rings back, oscillating around equilibrium before settling:

$$f(t) = f_{\text{target}} + (f_0 - f_{\text{target}}) e^{-\zeta\omega_n t} \left[ \cos(\omega_d t) + \frac{\zeta}{\sqrt{1-\zeta^2}} \sin(\omega_d t) \right]$$

Where $\omega_d = \omega_n\sqrt{1-\zeta^2}$ is the damped oscillation frequency.

**Sonic character:** The overshoot is *musically important*. Singers land sharp and settle. Bells ring beyond their target frequencies. The tone has energy, slight discord initially, then resolution. The ringing-back is perceptually apparent for ζ < 0.5. This is the character of impact, resonance, and aliveness.

**Overshoot amount:** Maximum frequency reached is:

$$f_{\max} = f_{\text{target}} + (f_0 - f_{\text{target}}) e^{-\pi\zeta / \sqrt{1-\zeta^2}}$$

For ζ = 0.3, overshoot is ~36%. For ζ = 0.7, overshoot is ~5%.

## Wavelet Analysis for Pitch Trajectory Understanding

A pitch trajectory is not static. Examining how frequency changes over time requires a representation that captures both time and frequency simultaneously. The short-time Fourier transform (STFT) sacrifices frequency resolution for time localization. Wavelets find the middle ground.

### The Wavelet Advantage

A continuous wavelet transform (CWT) decomposes the pitch trajectory into frequency components as a function of time:

$$W(a, b) = \int f(t) \psi^* \left( \frac{t-b}{a} \right) dt$$

Where:
- **a** = scale (inverse frequency; larger a = lower frequency components)
- **b** = time shift
- **ψ** = wavelet mother function (e.g., Morlet wavelet)

**Interpretation:** For each scale a (frequency band) and time position b, the magnitude |W(a,b)| shows how much energy is in that frequency band at that time.

### Why This Matters for Portamento

A pitch trajectory passing through underdamped overshoot creates **two features in the wavelet domain**:

1. **The main ridge** — the dominant frequency trend (main glide path)
2. **High-frequency ripple** — the oscillation around the target (ringing-back)

The wavelet transform makes this structure *visible*. You can see:
- Whether a glide is smooth (ridge only) or ringing (ridge + ripple)
- The decay rate of the ringing (how fast the ripple amplitude falls)
- Whether there is resonant coupling between multiple modes (multi-ridge structure)

For real instruments:
- A vocal glide shows a clear main ridge with subtle ripple around the settling phase
- A bell strike shows a strong main mode and higher-frequency satellite modes settling at different rates
- A guitar string shows the fundamental ridge and harmonics sliding at slightly different rates (inharmonicity effect)

### Pedagogical Use

Wavelet spectrograms make the distinction between the three damping regimes *audible and visible*:

- **Overdamped:** Clean, single ridge with no ripple
- **Critically damped:** Single ridge arriving at target with minimal tail
- **Underdamped:** Ridge with visible oscillation around the target frequency

This is particularly useful for vocal analysis: a wavelet spectrogram reveals whether a singer is landing with overshoot (typical, energetic) or attempting pure arrival (technically demanding, controlled).

## Coupled Modes and Real Instrument Complexity

Physical instruments do not have a single "pitch." They have a family of resonant modes, each with its own frequency and damping.

### Multi-Modal Portamento

A vibrating string has:
- Fundamental mode (lowest frequency)
- Harmonic modes (integer multiples for ideal strings; inharmonic for stiff strings)

When the string length changes (finger slides), all modes change frequency, but they do not all change at the same rate if the string has inharmonicity (stiffness). The inharmonicity coefficient B couples the modes: higher modes become progressively sharper relative to the fundamental as the string becomes stiffer.

**Result:** Portamento on a stiff string is not one glide; it is a family of coupled glides. The timbre evolves during the slide. A slider that begins with a bell-like inharmonic character can end with a nearly harmonic character as the modes compress together.

### Kuramoto Coupling Perspective

If each mode is viewed as an oscillator with its own natural frequency and damping, and they are weakly coupled through the string's nonlinear tension and the finger's motion, then the system is a **coupled oscillator network**. The modes do not settle independently; they are coupled via the acoustic boundary.

This connects to [[Kuramoto Coupling]]: a network of coupled phase oscillators eventually synchronize or establish phase relationships. In a portamento trajectory, the modes "chase" each other, coupling through shared physical constraints. The fine detail of this coupling determines the evolving timbre.

### Vocal Tract Resonances

The human vocal tract is a tube with changing cross-section. It has multiple resonant modes (formants). When pitch changes, the fundamental frequency (laryngeal) and the formant frequencies (tube) do not move together. Formants are relatively stable, set by vocal tract shape; pitch is set by fold vibration rate.

**Perceptual consequence:** As pitch glides, the dynamic between pitch and formants changes. A glide from a low note to a high note passes through moments where the pitch aligns with formants (resonance peaks) and moments where it misses them (resonance valleys). This creates time-varying brightness during the glide.

This is a high-dimensional coupled system, but it too can be modeled as coupled damped oscillators: one for pitch, several for formants.

## Artifacts and Interactive Exploration

Ten interactive HTML tools have been extracted from an extended conversation on wavelet analysis and portamento (January 6, 2026). These artifacts are located at:

`Projects/Portamento and Physical Pitch Modeling/portamento-tool-01.html` through `portamento-tool-10.html`

Each tool demonstrates a specific aspect:

1. **Basic Overdamped/Critically Damped/Underdamped Comparison** — Direct visualization of the three regimes. Slider controls ζ. Real-time frequency trajectory and sonic output.
2. **Wavelet Spectrogram of Portamento** — Real-time CWT of a pitch glide. See the main ridge (frequency trajectory) and ringing (overshoot oscillation).
3. **String Length → Frequency Mapping** — As a slider moves (finger position), the frequency changes. Shows inharmonicity coefficient effect on mode spreading.
4. **Vocal Glide with Formants** — Two tracks: one for pitch (underdamped), one for formants (quasi-static). Shows pitch-formant interaction during a glide.
5. **Bell Mode Analyzer** — Input a bell strike. The tool decomposes it into modes, shows mode frequencies and damping constants, visualizes the multi-modal decay.
6. **Guitar String Bend Physics** — Finger bends a string; tension increases, inharmonicity decreases. See partials compress toward ideal harmonic positions.
7. **Kuramoto Coupling in a 5-Mode String** — Five modes with weak coupling. Watch them desynchronize during a fast glide, then re-sync as they settle.
8. **Overshoot Calculator** — Input f₀, f_target, ζ, ω_n. Returns peak frequency, settling time, character description.
9. **Wavelet Ridge Extractor** — Upload an audio file. Tool extracts the wavelet ridge (main frequency trajectory) and plots it. Useful for analyzing real instrument recordings.
10. **Damping Regime Ear Training** — Four randomized portamento transitions: one from each regime (overdamped, critically damped, underdamped, and a complex multi-modal case). Listener identifies which.

**Usage note:** These tools are designed for *teaching*. They make the physics tangible and audible. They are not synthesis plugins; they are exploratory instruments.

## Open Questions

### Composition and Control

1. **Portamento as a compositional parameter:** Can damping ratio ζ be modulated over time within a piece? What does ζ(t) sound like if it varies smoothly? If it jumps?

2. **Overshoot aesthetics:** Is there a perceptual threshold for underdamped overshoot? At what overshoot amount does a glide feel "energetic" vs. "out of tune"?

3. **Mode selection in complex instruments:** For an instrument with many modes (piano, prepared piano, vibraphone), which modes should be controlled during a portamento? Can selective mode modulation create new timbral landscapes?

### Analysis and Listening

4. **Wavelet ridge fidelity:** For vocals and bowed strings, how accurately does the wavelet ridge capture perceived pitch? Does the ridge ever diverge from what a listener hears as "the pitch"?

5. **Formant-pitch interaction:** In singing, how much does the dynamic between pitch and formants during a glide affect the emotional character of the phrase?

6. **Real vs. modeled:** How well does the second-order physical model predict actual portamento trajectories in human singing and instrumental playing?

### Synthesis Integration

7. **Stability in FM synthesis:** If frequency itself is driven by a damped oscillator (rather than following a static envelope), how does this interact with FM modulation ratios during the transient?

8. **Grain-by-grain implementation:** For granular synthesis, should grain pitch follow the damped oscillator trajectory? Can individual grains inherit the ringing character?

## Cross-Domain Resonance

### Connection to [[Action Potential Oscillator]]

Both portamento and nerve action potentials are systems with *threshold, overshoot, and undershoot*. The Hodgkin-Huxley equations governing ion channel gating produce oscillations with overshoot in voltage. Portamento undershoot (frequency settling below target, then rising back) mirrors the dynamics of neural recovery. Both systems are second-order (or higher) damped oscillators responding to threshold-crossing inputs.

### Connection to [[Frequency-Time Duality]]

Portamento is the physical manifestation of the frequency-time tradeoff. A pure instantaneous frequency change (zero time duration) would require infinite frequency bandwidth. A smooth portamento spreads the frequency content over time. The wavelet analysis makes this explicit: longer glides have narrower frequency bands; faster glides have broader bands. The time-frequency uncertainty principle is not abstract—it is audible in the acoustic character of a glide.

### Connection to [[Kuramoto Coupling]]

Modes in a physical resonator are coupled through the instrument's geometry and the driving force. When multiple modes must transition together (as in a string length change), they are Kuramoto oscillators finding phase relationships. The coupling strength determines whether they transition coherently or with phase drift. Complex instruments show this: a rapid glide may cause modal desynchronization (audible as timbre change), while a slow glide keeps them in phase.

### Connection to [[Bessel Functions in Synthesis]]

The mode structure of a circular or nearly-circular resonator (bell, gong, drum) is governed by Bessel function zeros. When such an instrument undergoes portamento (e.g., a timpani pitch glide), the modes move along the Bessel function landscape. Their frequencies shift, but their amplitude relationships (determined by excitation point and Bessel coefficients) change. The character of the glide is shaped by the Bessel geometry.

### Connection to [[Biomechanical Synthesis]]

Portamento in human voice and wind instruments is biomechanically generated. The larynx, vocal folds, and vocal tract are mechanical systems. Their dynamics (damping, stiffness, mass distribution) are not parameters to be set — they are physical facts. Accurate vocal modeling requires understanding the actual biomechanics: muscle activation patterns, tissue compliance, aerodynamic forces. The second-order physical model is a simplification, but it captures the essential character that emerges from those biomechanics.

## Suggested Explorations

- **Record a vocalist's glide and analyze its wavelet spectrogram.** Compare to the theoretical models. Where does the model fit? Where does it diverge? What does that divergence reveal about vocal biomechanics?

- **Build a synthesis engine where each note has its own ζ value.** Compose a piece where glide character changes based on register, note duration, or musical context.

- **Analyze prepared pianos (objects on strings, altered geometry).** Do prepared pianos show different portamento damping characteristics? Can preparation be understood as changing ω_n and ζ?

- **Cross-species study:** Do instruments from different cultures show characteristic damping ratios? Is there an aesthetic preference for certain ζ values embedded in instrumental design?

---

*"The glide does not happen to the pitch. The pitch IS the glide. Every moment of the trajectory is a moment of physical settling. Listen to where the voice overshoots; that is where the body is alive."*

