---
title: Floquet Time-Modulated Loops
type: project
pillars:
  - creation
  - tools
  - philosophy
  - practice
born: 2026-04
stage: growing
status: active
confidence: working
energy: very high
hook_quality: 10
beauty: 9
who_leads: shared
links:
  - target: "[[DSP in Looping Dimensions]]"
    type: deepens
    label: temporal-completion
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: couples-with
    label: kernel-sibling
  - target: "[[Three Kinds of Warp]]"
    type: connects-to
    label: type-2-and-type-3-naming
  - target: "[[Frequency-Time Duality]]"
    type: deepens
    label: operator-level-realization
  - target: "[[Wavetable Space as Torus]]"
    type: connects-to
    label: cylinder-and-torus-kernels
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
    label: locked-vs-drift
  - target: "[[Mathieu Equation]]"
    type: spawned
    label: canonical-instance
  - target: "[[Parametric Resonance]]"
    type: spawned
    label: core-phenomenon
  - target: "[[Floquet Theory]]"
    type: spawned
    label: mathematical-framework
  - target: "[[Photonic Time Crystals]]"
    type: spawned
    label: experimental-incarnation
  - target: "[[Differential Equations]]"
    type: connects-to
    label: periodically-coefficient-linear-ode
  - target: "[[Categorizing Inharmonicity]]"
    type: connects-to
    label: floquet-engineered-targets
  - target: "[[Loudon Live]]"
    type: connects-to
    label: candidate-five-session-arc
  - target: "[[Boundary-Crossing Instruments]]"
    type: mirrors
    label: lti-to-ltv-boundary
forward_vector: "I want to become a working set of five Loudon Live sessions, with Stage 1 (the Mathieu Resonator in codebox~) shipped first as a complete pedagogical artifact — every named object taught, every concept media-supported, every cross-domain hook landed. I want to be the entry every modulation-with-period device in the palace eventually links back to, and the proof that the LTI assumption is a choice, not the territory."
---

# Floquet / Time-Modulated Loops

![[Floquet Time-Modulated Loops — hero.png]]

A project, a five-stage Loudon Live arc, and — Stage 1 — a complete teaching document for the Mathieu Resonator in `codebox~`. The project's central claim: every audio object built around a delay loop, a feedback path, or a resonant mode has been quietly assuming that the loop's coefficients are **constant in time**. That assumption is called LTI — Linear, Time-Invariant. Releasing the time-invariance assumption opens a vast region of sound and behavior that the LTI worldview cannot reach: parametric resonance, sideband ladders that climb to extraordinary heights, frequency conversion without ring modulators, spontaneous oscillation from noise, frequency bandgaps, time crystals. The mathematical name for systems with periodically time-varying coefficients is **[[Floquet Theory|Floquet]]**, and the canonical instance is the **[[Mathieu Equation]]**.

This document teaches everything Stage 1 requires before the codebox~ source is built. Stages 2–5 are sketched; each will become its own teaching arc in turn.

---

## Why This Project Exists

Three pressures converged.

**The first** is the geometric claim already on disk. [[DSP in Looping Dimensions]] argues that each looping dimension contributes one independent fundamental, and that escaping the harmonic series requires either a second incommensurate clock (type-2) or coupled flow between clocks (type-3) — see [[Three Kinds of Warp]]. The 2D torus wavetable is the *spatial* incarnation of that principle: two scanning phasors on a 2D surface produce a 2-generator lattice spectrum. Floquet is the **temporal** incarnation. A delay loop pumped by a periodically-modulated coefficient is a system with two clocks: the loop period and the modulation period. The same lattice mathematics governs the spectrum. The two projects are siblings — same theorem, dual axes of periodicity.

**The second** is the question that fell out of a recent palace conversation about modulating loop coefficients at audio rate. The system stops having a single transfer function. Instead, the input excites a ladder of sidebands at $f_k \pm m f_{\text{mod}}$, and the harmonic structure that any static dispersion model can produce gets shifted, replicated, and recombined. That is a different *kind* of object than a filter. It is a frequency-domain map, not a single-frequency response. It deserves its own design language and its own instrument.

**The third** is the realization that Floquet is the operator-level statement of [[Frequency-Time Duality]]. Bloch's theorem in solid-state physics says that a wavefunction in a spatially periodic potential factors into a plane wave dressed by a periodic envelope; this produces electronic band structure and bandgaps. Floquet's theorem in dynamical systems says exactly the same thing with time in place of space and period in place of lattice constant; this produces *frequency* bandgaps and *parametric* instability. Crystals are Bloch in space; time-modulated systems are Floquet in time. The duality the palace has held as a perceptual continuum gets, in this project, its rigorous mathematical completion.

The project also activates all four pillars in a way that makes it the right anchor for a Loudon Live arc. **Creation**: a working `codebox~` instrument and four further stages, with audio examples that nothing else on the market sounds quite like. **Tools**: the `codebox~` source, the visualization patches, the surface library extension to filter-kernels. **Philosophy**: the LTI / LTV boundary is a [[Boundary-Crossing Instruments|boundary-crossing]] of the deepest kind — most of audio engineering lives on one side of it without ever naming the wall. **Practice**: a five-stage arc that respects the [[Progressive Staging]] discipline, ending each stage with a complete, finishable instrument.

---

## The Theory

This is the part that has to land before any code gets typed. A bright student should leave this section able to explain, to a friend, what the Mathieu equation is, why a tongue is called a tongue, what "parametric resonance" actually means, and what `Floquet exponent` and `monodromy matrix` are. Each named object below has at least one piece of media in the Build Manifest at the end of this document; the central ones have several. References to `media-NN` point to specific manifest items.

### Linear, Time-Invariant — the world we usually live in

Most audio DSP assumes the system is **Linear, Time-Invariant** (LTI). *Linear* means superposition holds — the response to a sum of inputs is the sum of the responses. *Time-invariant* means the system's behavior does not change as time passes — if you delay the input by ten seconds, you get the same output, just delayed by ten seconds.

The big payoff of LTI is the **transfer function**. A single complex-valued function $H(\omega)$ tells you everything about the system: what it does to a sinusoid at frequency $\omega$ is multiply it by $H(\omega)$. The Bode plot, the impulse response, the eigenvalues of a state-space realization — these are all faces of the same object. "What does this filter do?" is, for an LTI system, a question with one answer.

This is so convenient and so universal that it can be hard to remember it is a **special case**. The world is full of systems whose coefficients change with time. A swing whose pivot length is being pumped by a child standing and squatting. A laser amplifier whose population inversion is being driven by a pump beam at a fixed rate. A neuron whose membrane conductance is itself oscillating. None of these is LTI. They are LTV — **Linear, Time-Varying**.

> **Bright student question — "If the system is still linear, can't I still use Fourier?"**
> Yes, but the answer is no longer "scale this frequency by a complex number." The system can take energy at one frequency and *deposit it at a different frequency*. It is still linear in the sense that doubling the input doubles the output — but the input-to-output map is no longer a diagonal in the frequency basis. It mixes frequencies. That mixing is the entire point.

The most important sub-class of LTV systems is the **periodically-time-varying** class — systems whose coefficients repeat with period $T$. These are what Floquet theory was invented for, and they are by far the easiest LTV systems to reason about, because the periodicity gives us a hook. A single period contains all the information; we just have to figure out what that information looks like.

`media-01` (static): the LTI / LTV boundary, drawn as a Venn diagram with audio examples placed on each side — comb filter and biquad on the LTI side, ring mod and a periodically-pumped resonator on the LTV side, with the Mathieu equation flagged as the canonical instance of the periodic LTV class.

### The Mathieu equation

The canonical equation of Floquet theory is the **[[Mathieu Equation]]**:

$$\ddot{x} + (a - 2q\cos 2t)\, x = 0$$

It looks like a harmonic oscillator $\ddot{x} + \omega_0^2 x = 0$ — and it would *be* a harmonic oscillator if $q = 0$, with natural frequency $\omega_0 = \sqrt{a}$. The novelty is the term $-2q \cos 2t$: the "stiffness" of the oscillator is being modulated periodically in time. The parameter $q$ controls the depth of modulation, and the $\cos 2t$ sets the modulation rate (here, the time has been non-dimensionalized so the modulation period is exactly $\pi$).

> **Bright student question — "Why is it called Mathieu? What was Mathieu's problem?"**
> Émile Léonard Mathieu (1835–1890) wrote down this equation in 1868 while working out the vibrations of an *elliptical* drum membrane. Separating the wave equation in elliptical coordinates produces this ODE. He had no idea it would later govern parametric pumps, laser cavities, ion traps, and quantum cold-atom experiments. The math turned out to be far more fundamental than the original problem — a recurring pattern in mathematical physics.

> **Bright student question — "Why is the modulation $\cos 2t$ and not just $\cos t$?"**
> Convention. The factor of 2 is there so that the dominant parametric resonance — the one that makes a swing pump — happens at $a = 1$, $q$ small. The pumped swing is forced at *twice* its natural frequency, and choosing $\cos 2t$ in the equation puts that resonance at a clean integer label. Different textbooks vary by factors of 2; the physics is identical.

The equation has two parameters and two faces. With $a = \omega_0^2$ as the squared natural frequency and $q$ as the modulation depth, the question is: what does $x(t)$ do as $t \to \infty$ for a given $(a, q)$? The answer turns out to depend almost entirely on a discrete classification: either solutions are **bounded for all time** (the system is *stable*), or they **grow exponentially** (the system is *unstable*). The boundary in $(a, q)$ space between these two regimes is the famous Strutt diagram, and it is the central object of this project's first stage.

`media-02` (interactive HTML): the Mathieu equation simulator. Two sliders, $a$ and $q$. A live phase-space plot $(x, \dot{x})$ and a live time-series plot $x(t)$. A small inset Strutt diagram with a cursor showing the current $(a, q)$ point colored by stability. Audio playback of the time series at user-selected sample rate.

### Parametric resonance — the swing

Before the Strutt diagram, the most important phenomenon: **[[Parametric Resonance|parametric resonance]]**. This is the sound and feel that motivates everything.

You learned to pump a swing as a child. The trick is to squat and stand at *twice* the swing's natural frequency — once forward, once back — pumping the system's effective length on every half-cycle. Each squat-stand transfers energy from your legs into the swing's pendulum motion. The swing builds amplitude even though no one is *pushing* it from outside. The energy comes from inside the system, modulating one of the system's own parameters — its length.

This is the deep difference between **driving** and **pumping**. A driven oscillator is being shoved by an external force; a pumped oscillator is having one of its coefficients changed periodically. Driving adds a forcing term to the right-hand side: $\ddot{x} + \omega_0^2 x = F(t)$. Pumping multiplies a coefficient by something that varies in time: $\ddot{x} + \omega_0^2 (1 + \epsilon \cos \Omega t) x = 0$. In the second case, *the right-hand side is still zero*. The energy that builds up the swing's amplitude comes from inside the system — from whoever is paying the cost of modulating the coefficient.

> **Bright student question — "Why exactly twice the natural frequency? Why not the natural frequency itself?"**
> The energy stored in an oscillator at amplitude $A$ scales as $A^2$. The natural rhythm of energy storage and release happens at *twice* the oscillation frequency — energy is at maximum kinetic, then maximum potential, then back to maximum kinetic, all within one cycle. So a parameter that affects energy storage couples most strongly to a modulation at $2\omega_0$. That is the *primary parametric resonance*. There are smaller resonances at $\omega_0$, $2\omega_0/3$, $\omega_0/2$, and so on — all the rational fractions $2\omega_0/n$. Each of those produces its own region of instability, and they all show up as tongues in the Strutt diagram.

The remarkable thing about parametric resonance is that it has a **threshold**. For a fixed pumping rate exactly at $2\omega_0$, you need a minimum modulation depth $q$ before the swing starts to build. Below that, the natural damping of the system eats energy faster than the pump can put it in, and the swing eventually settles. Above the threshold, the pump puts energy in faster than damping can drain it, and the amplitude grows exponentially until something nonlinear (saturation, breaking the small-angle approximation, the swing chains snapping) catches up.

This is *exactly* the threshold phenomenon Loudon already knows from [[Kuramoto Coupling]]. Below the critical coupling $K_c$, nothing happens. Above it, synchrony explodes into existence. The threshold is sharp; the regime change is structural. Floquet's parametric instability and Kuramoto's synchronization transition are both **bifurcations** — points in parameter space where the qualitative character of the system flips. This is why a Mathieu Resonator and a Kuramoto-coupled torus scan feel like cousins when you play them.

`media-03` (interactive HTML): the pumped swing. A pendulum visualization with a slider for the pumping rate and another for the pumping depth. A real-time amplitude meter and an audio output (a low-frequency tone whose loudness tracks amplitude). Crossing the threshold is dramatic — silent below, exponentially building above.

`media-04` (audio + Python): three short WAV examples of the same Mathieu resonator at the same $a$ but with $q$ at three values: well below threshold (silence with thermal coloration), just at threshold (slow build), and well above (rapid exponential build into nonlinear saturation). The accompanying Python is the *recipe* — a ten-line numerical integrator with comments explaining every term. Looking at the code and hearing the audio is the lesson.

### The Strutt diagram and tongues

For each $(a, q)$ in parameter space, the Mathieu equation either produces bounded solutions or unbounded ones. Plot the $(a, q)$ plane. Color the bounded region one color and the unbounded region another. The result is the **Strutt diagram** (named after Maximilian J. O. Strutt, who computed it in detail in the 1920s; sometimes called the *Ince–Strutt diagram*).

The first thing you see is striking: the unbounded regions are not blobs scattered randomly. They are **tongues** — narrow wedges, each rooted on the $q = 0$ axis at a specific value of $a$. The tongues sit at $a = 1, 4, 9, 16, \ldots$, i.e., at $a = n^2$ for integer $n$. The *first* tongue (rooted at $a = 1$, the strongest one) is the parametric pumping resonance: $a = 1$ corresponds to $\omega_0 = 1$, and the modulation $\cos 2t$ has frequency $2 = 2\omega_0$. The classical "pump at twice the natural frequency" has become a wedge in parameter space, and as you move away from $q = 0$ the tongue widens — the resonance acquires *width* in the natural frequency dimension.

The tongues are called *tongues* for the visual reason: they look like flames licking up from the $q = 0$ axis into the modulated regime. The metaphor is purely visual; there is nothing biological or anatomical involved. (Some authors call them *Arnold tongues* by analogy with the more general Arnold-tongue structure in the theory of circle maps; the name is the same metaphor pressed into wider service.)

> **Bright student question — "Why does the first tongue widen as $q$ grows? What's happening physically?"**
> At $q = 0$ the tongue has zero width — pumping with no depth doesn't pump anything, so the only "resonant" pumping rate is the exact one. As $q$ grows, the parametric pump has more authority, and it can build amplitude even when its rate is slightly off from $2\omega_0$. The tongue's width at a given $q$ is the *capture range*: the range of natural frequencies that the pump can lock onto and excite. This is the same structure as a lock-in range or a phase-locked-loop's capture window — the deeper the coupling (larger $q$), the wider the range.

> **Bright student question — "What happens above the threshold? Does the system blow up?"**
> Inside the tongue, the *linearized* Mathieu equation predicts unbounded exponential growth. In any real physical system, this growth is eventually checked by some nonlinearity — saturation, the small-angle approximation breaking down, friction becoming nonlinear at large amplitude, the ear hair-cell amplifier compressing, the laser gain medium depleting, the synth's clipping circuit kicking in. The result is a stable nonlinear oscillation at large amplitude. The linear theory tells you *where* spontaneous oscillation begins; the nonlinear behavior tells you *how loud and what shape* the oscillation has when it gets there. For Stage 1, we will saturate the output explicitly with a `tanh` so the timbre when crossing into a tongue is a deliberate, designed sound, not a numerical explosion.

`media-05` (static high-quality PNG): the Strutt diagram, drawn carefully. The first three tongues clearly labeled ($n = 1, 2, 3$). The bounded region tinted one color, unbounded another. Reference points marked: the swing-pumping classic $a = 1$ axis, the inverted Kapitza pendulum stabilization region (where $a < 0$ becomes stable for sufficient $q$ — see below), and the line $q = 0$ where it's all just harmonic oscillators.

`media-06` (interactive HTML): the Strutt diagram explorer. A clickable diagram. Click anywhere; the cursor moves there; the resulting time series and short audio sample play. Move the cursor smoothly across a tongue boundary and *hear* the transition from silence-with-coloration into ringing oscillation.

`media-07` (static PNG): a single tongue zoomed and annotated. The tongue's boundary lines drawn analytically (Mathieu's perturbation expansion gives explicit formulas for small $q$); the inside labeled "unbounded — parametric resonance"; the outside labeled "bounded — stable"; the boundary itself labeled "marginal — neutrally stable." The classic three labels.

### Floquet exponents and characteristic multipliers

Now the structural mathematics that *generates* the Strutt diagram. This is the moment a student goes from "I see the picture" to "I understand why the picture looks the way it does."

Consider any linear system with periodic coefficients: $\dot{\vec{x}} = A(t) \vec{x}$ with $A(t + T) = A(t)$. **Floquet's theorem** (1883) states that every solution can be written as

$$\vec{x}(t) = e^{\mu t}\, \vec{p}(t)$$

where $\vec{p}(t + T) = \vec{p}(t)$ is itself periodic. The exponential $e^{\mu t}$ is the part that grows or decays; the periodic envelope $\vec{p}(t)$ is the part that wiggles. Together, they exhaust all the system's behavior.

The number $\mu$ is called the **Floquet exponent** (or *characteristic exponent*). It is generally complex: $\mu = \alpha + i\beta$, with $\alpha$ controlling growth/decay and $\beta$ controlling oscillation. Stability is determined entirely by $\alpha$:
- $\alpha < 0$: solution decays. System is stable at this $(a,q)$.
- $\alpha > 0$: solution grows exponentially. System is unstable. We are inside a tongue.
- $\alpha = 0$: solution is bounded but does not decay. Marginal — *the tongue boundary*.

Floquet exponents are not the most natural objects to compute. The more natural object is the **characteristic multiplier**, defined as

$$\rho = e^{\mu T}.$$

The multiplier is what happens to a solution after one full period. If $\vec{x}(0) = \vec{x}_0$, then $\vec{x}(T) = \rho \vec{x}_0 \cdot$ (a periodic envelope). The multipliers are the eigenvalues of the **monodromy matrix** (next subsection), which we *can* compute by integrating the equation over one period.

The stability picture in the multiplier plane is beautiful and final:
- $|\rho| < 1$: solution decays (multiplier inside unit circle). Stable.
- $|\rho| > 1$: solution grows (multiplier outside unit circle). Unstable.
- $|\rho| = 1$: marginal. *The tongue boundary is precisely the locus where a multiplier sits exactly on the unit circle.*

This is the punch line: the Strutt diagram is not a freestanding picture. It is the boundary, in $(a, q)$ space, of where multipliers cross the unit circle. The complex multiplier plane and the parameter plane are in correspondence, and the unit circle is the dividing line between two worlds.

`media-08` (static PNG): the complex plane of characteristic multipliers, with the unit circle drawn. Three points plotted: a multiplier inside the circle (labeled "stable"), one outside (labeled "unstable, tongue interior"), and one on the circle (labeled "tongue boundary, marginal"). A second panel beside it shows the corresponding $(a, q)$ points in the Strutt diagram, with arrows linking each multiplier to its parameter point. Two views of the same fact.

`media-09` (interactive HTML): the multiplier visualizer. Adjust $(a, q)$; see the two characteristic multipliers (the Mathieu equation is second-order so there are two of them) plotted in the complex plane. Drag across a tongue boundary and watch a multiplier slide out of the unit circle. The geometry of the bifurcation in real time.

> **Bright student question — "Why are there two multipliers? And what happens at the tongue boundary structurally?"**
> The Mathieu equation is a 2nd-order ODE, so its state space is 2-dimensional ($x$ and $\dot{x}$). The monodromy matrix is $2 \times 2$ and has two eigenvalues. For a Hamiltonian system (energy-conserving), the determinant of the monodromy is exactly 1, which means the two multipliers must be reciprocals: $\rho_1 \rho_2 = 1$. There are then two ways for them to live: as a complex-conjugate pair on the unit circle (both have magnitude 1, system is bounded, oscillatory), or as two real numbers, one inside and one outside the circle (the "outside" one is the unstable mode, the "inside" one is its decaying twin). The tongue boundary is exactly where the pair on the unit circle collides on the real axis at $\rho = 1$ or $\rho = -1$ and splits into the real-reciprocal pair. Crossing the boundary is a *period-doubling bifurcation* (at $\rho = -1$) or a *transcritical bifurcation* (at $\rho = +1$). The structure is profound and the same structure appears in every Hamiltonian periodic system in physics.

### The monodromy matrix

The **monodromy matrix** is the linear operator that propagates the state from $t = 0$ to $t = T$ — one full modulation period. In symbols: if $\Phi(t)$ is the *fundamental matrix* (a matrix whose columns are independent solutions), then

$$M = \Phi(T) \Phi(0)^{-1}$$

is the monodromy. With initial condition $\Phi(0) = I$ (the identity), $M$ is just $\Phi(T)$.

The monodromy is to a periodic system what the *transfer function* is to an LTI system: a single object that captures the system's behavior. Where the transfer function maps a complex frequency to a complex amplitude, the monodromy maps a state vector at the start of one period to the state vector at the end. Iterating it $N$ times computes the system's behavior $N$ periods later. Its eigenvalues are the characteristic multipliers; its eigenvectors are the *Floquet modes* — the privileged directions in state space along which the solution evolves cleanly.

> **Bright student question — "How do I actually compute the monodromy in code?"**
> The monodromy matrix is computed numerically by integrating the equation forward over one period, starting from each of the standard basis vectors as initial conditions. For the Mathieu equation, you integrate twice: once from $(x, \dot{x}) = (1, 0)$ for one period, once from $(0, 1)$ for one period. The two final states become the columns of $M$. Then the eigenvalues of $M$ tell you the stability. This is a five-line algorithm in numpy and is exactly what generates the Strutt diagram from raw integration — no analytical formulas required.

`media-10` (static PNG): a phase-space portrait of the Mathieu equation. The $(x, \dot{x})$ plane with several trajectories plotted, each in a different color, sampled stroboscopically — i.e., a dot every period $T$. Inside a tongue: dots spiral outward exponentially (or alternate between two outward-spiraling sub-orbits in the period-doubling case). Outside a tongue: dots stay on a closed curve. The Poincaré-section view of the same fact the multipliers told us.

### Bloch-in-time — the duality made literal

Now the move that should make a student sit up. **Bloch's theorem** (Felix Bloch, 1929) describes electrons in a crystal. The crystal has a spatially periodic potential $V(x + a) = V(x)$, where $a$ is the lattice constant. Bloch's theorem says that any electronic wavefunction can be written

$$\psi(x) = e^{ikx}\, u(x), \quad u(x + a) = u(x).$$

A plane wave $e^{ikx}$ dressed by an envelope with the lattice period. The number $k$ is the **crystal momentum** (or *quasi-momentum*); it lives in a special interval called the **Brillouin zone**, and the spectrum of allowed energies for each $k$ produces the *band structure* of the solid. The gaps between bands are the **bandgaps** — the energies that cannot exist inside the crystal. Bandgaps are why semiconductors are semiconductors and why insulators are insulators.

Compare to Floquet:

$$x(t) = e^{\mu t}\, p(t), \quad p(t + T) = p(t).$$

The two equations are *the same equation*. Time has replaced space; period $T$ has replaced lattice constant $a$; the Floquet exponent $\mu$ has replaced Bloch's crystal momentum $k$. The *Brillouin zone of the modulation rate* is the analog interval $\mu \in (-i\pi/T, +i\pi/T]$. And the Mathieu tongues — the regions where $\text{Re}(\mu) \neq 0$ — are the **frequency bandgaps** of the time-modulated system. They are precisely the analog of crystal bandgaps, and where a crystal *forbids* certain energies, a time-modulated system *exponentially amplifies* certain frequencies.

> **Bright student question — "Why exponential amplification when crystals just have forbidden energies?"**
> In space, the Bloch wavefunction at a forbidden energy decays exponentially in space — it cannot propagate, and the crystal acts as a mirror at that energy. In time, the Floquet "wavefunction" at a tongue-interior frequency *grows* exponentially in time. Same exponential structure, dual directions: a crystal turns a bandgap energy into an evanescent (decaying) wave because energy is not provided to sustain it, while a time-modulated medium turns a bandgap frequency into a growing wave because *the modulation is doing work* at every period — pumping energy in. The bandgap is reflective in space and amplifying in time. Same structure, dual axes.

This duality has a recent experimental incarnation: **[[Photonic Time Crystals|photonic time crystals]]** — physical media whose refractive index is modulated periodically in time at optical or microwave frequencies. They were proposed theoretically in the early 2010s and demonstrated experimentally from 2018 onward. Photonic time crystals exhibit *frequency bandgaps* and *amplification of bandgap-frequency light from vacuum noise*. The first time crystal experiments observed in solid-state and cold-atom systems are the matter incarnations of the same physics. This is currently a hot research frontier.

The implication for audio: a Floquet-pumped audio system is, formally, a small-scale time crystal. The "amplification of bandgap-frequency light from vacuum noise" is exactly the experience of a parametric oscillator turning on from thermal noise as you cross a tongue boundary. The cosmology of photonic time crystals and the timbre of the Mathieu Resonator are two ends of one spectrum.

`media-11` (static PNG): the spatial-Bloch / temporal-Floquet duality, drawn as a side-by-side. Left panel: a 1D crystal lattice with a periodic potential, an electron wavefunction overlaid as $e^{ikx} u(x)$, the band-structure $E(k)$ plotted underneath with bandgaps shaded. Right panel: a time-modulated medium with a periodic coefficient, an audio "wavefunction" overlaid as $e^{\mu t} p(t)$, the Floquet exponent's real part $\alpha(\omega)$ plotted underneath with tongue intervals shaded. Same shape, dual axes, with arrows linking each spatial concept to its temporal twin.

### Sidebands — where the ladder comes from

Time to derive, at student-level, the central audible feature: a Floquet-modulated loop converts a single input frequency into a *ladder* of output frequencies.

Suppose the system is being driven at frequency $f$ by an external sinusoid $\cos(2\pi f t)$, while one of its coefficients is being modulated periodically with period $T_{\text{mod}} = 1/f_{\text{mod}}$. The modulation can be written as a Fourier series:

$$m(t) = \sum_{n} c_n e^{i 2\pi n f_{\text{mod}} t}.$$

When the loop multiplies the carrier by this modulation, every Fourier component of $m(t)$ produces its own sideband:

$$\cos(2\pi f t) \cdot m(t) = \frac{1}{2}\sum_n c_n \left[e^{i 2\pi (f + n f_{\text{mod}}) t} + e^{i 2\pi (-f + n f_{\text{mod}}) t}\right].$$

The output spectrum is a comb at $\pm f + n f_{\text{mod}}$, weighted by the Fourier coefficients $c_n$ of the modulation. *This is the sideband ladder.* The shape of the modulation waveform — i.e., the magnitudes of the $c_n$ — controls the entire spectrum.

This is *the* result a student should walk away owning. A few special cases make it concrete:
- **Pure cosine modulation** ($m(t) = \cos 2\pi f_{\text{mod}} t$, only $c_{\pm 1}$ nonzero): two sidebands at $f \pm f_{\text{mod}}$. **This is ring modulation.** Ring mod is the simplest possible Floquet system.
- **Cosine of cosine modulation** (the FM exponent): the $c_n$ are Bessel functions, the famous Bessel-spectrum FM. FM is a Floquet system whose modulation spectrum happens to be Bessel-shaped. See [[Bessel Functions in Synthesis]].
- **Square wave modulation**: $c_n$ falls as $1/n$ at odd $n$; sideband ladder rolls off slowly with bright odd content. Sounds harsh; "AM with a square LFO" was the early-2000s industrial-techno staple.
- **Wavetable modulation**: $c_n$ are arbitrary, designed by the user. The sideband ladder is sculpted by drawing a waveform.

This last case is the bridge to Stage 4 — the modulation waveform *becomes* a wavetable axis, and the [[2D Torus Wavetable Synthesizer]]'s surface library serves as a library of *modulators*, not of carriers. But Stage 1 doesn't need that yet. Stage 1 just needs the student to feel that the cosine modulation in $\ddot{x} + (a - 2q\cos 2t)x = 0$ creates exactly the two-tone sideband signature of ring modulation, with the additional twist that the carrier is the *resonator's own oscillation* at $\omega_0 = \sqrt{a}$ rather than an externally-supplied tone.

`media-12` (static PNG): the sideband ladder. Top row: four modulation waveforms (cosine, cosine-of-cosine / FM, square, drawn-wavetable). Bottom row: each modulation's Fourier coefficient magnitudes $|c_n|$ plotted as a stem plot, then the resulting sideband spectrum at the output of a Floquet loop. Visual proof that the modulation Fourier series *is* the spectral envelope.

`media-13` (audio + Python): four short WAV examples, one per modulation shape, demonstrating the sideband structure audibly. Each is a 220 Hz carrier through a parametrically-pumped resonator with the modulation shape varied. Same Python recipe as the other audio examples — short, commented, every term explained.

### Cross-domain — Floquet is everywhere

The point of this section is not to be exhaustive. It's to give a student the strong feeling that the equation they're about to implement in `codebox~` is *the same equation* governing real phenomena across mechanics, fluids, plasma, optics, and quantum matter. When you build the Mathieu Resonator, you are not building a curio. You are building a small instance of one of the universe's basic operators.

**The pumped swing.** Already discussed. The clean mechanical incarnation of parametric resonance. A child's body is the modulator; the swing's effective length is the parameter being modulated; gravity is the restoring force. Pumping at twice the swing frequency builds amplitude. `media-03` covers this.

**Faraday waves.** Vertically vibrate a tray of water. Above a critical vibration amplitude, standing waves spontaneously appear on the surface — square patterns, hexagonal patterns, stripes, rotating spirals, depending on the drive frequency and depth. Faraday discovered these in 1831 and they are governed by a Mathieu-like equation for each spatial Fourier mode of the surface. Each mode has its own tongue; when the drive crosses into that mode's tongue, that wavelength of standing wave appears. The pattern is selected by which tongue you're inside. This is the same pattern-formation mechanism at work in vibrated granular media (the Chladni patterns are a static cousin), in pulsating fluid film deposition, and in some classes of pattern-forming chemical reactions.

`media-14` (static): a Faraday-wave pattern diagram. A simulated standing-wave surface for one drive condition; an annotation showing which tongue's mode this pattern corresponds to. Cross-link explicitly to the Chladni surface in the [[2D Wavetable Catalog]] — the static Chladni patterns and the dynamic Faraday patterns are siblings.

**The Kapitza inverted pendulum.** The Mathieu equation can also be *stable* in regions where the un-pumped pendulum is *unstable*. The classical example: an inverted pendulum (think a pencil balanced on its tip) is unstable — the slightest perturbation knocks it over. But if you vertically oscillate the pivot fast enough, the inverted equilibrium becomes *stable*. The pendulum stands upside-down and stays there. This is **Kapitza stabilization** (Pyotr Kapitza, 1951), and it is one of the canonical demonstrations of how Floquet engineering can produce behavior the static system cannot. In the Strutt diagram, it lives in the negative-$a$ region (the un-pumped system has imaginary frequency, hence instability) where sufficient $q$ pulls the system back into stability. This is the matter-physics analog of every active feedback control system that "stabilizes the unstable" — but achieved by *modulation alone*, no measurement or control loop required. It is the prototype for an entire research program called **Floquet engineering** in cold-atom physics, where time-dependent driving is used to engineer Hamiltonians the static universe doesn't offer.

`media-15` (interactive HTML): the Kapitza pendulum simulator. A pendulum on a vertically-oscillating pivot. Sliders for pivot oscillation amplitude and frequency, plus initial pendulum angle. Below threshold, an inverted initial condition immediately falls. Above threshold, the inverted pendulum stays *up*, wobbling around the inverted equilibrium with the pivot's tiny ripple visible. The audience experience: "you can balance a pencil on its tip with the right shake."

**The optical parametric oscillator (OPO).** Pump a nonlinear optical crystal (like LiNbO$_3$ or KTP) with an intense laser at frequency $\omega_p$. Inside the crystal, the pump can decay parametrically into two daughter photons at $\omega_s$ and $\omega_i$ (called *signal* and *idler*) such that $\omega_s + \omega_i = \omega_p$. Above a threshold pump intensity, the OPO oscillates spontaneously — the cavity fills with signal and idler light from quantum vacuum noise. This is *Floquet's parametric resonance, optical scale, with signal and idler as the two daughter modes selected by phase-matching*. OPOs are the workhorse of much of modern quantum optics. They are the laser-based analog of every audio parametric oscillator. The frequencies are different by twelve orders of magnitude; the math is identical.

`media-16` (static): the OPO sideband diagram. A pump beam at $\omega_p$ entering a nonlinear crystal; a signal beam at $\omega_s$ and idler beam at $\omega_i$ emerging. A small inset showing $\omega_s + \omega_i = \omega_p$ as the fundamental phase-matching constraint. Cross-link to the audio sideband ladder picture: the OPO is selecting one specific pair of sidebands $(\omega_s, \omega_i)$ from the full Floquet sideband ladder, the pair determined by the cavity's phase-matching condition.

**Plasma parametric decay.** A high-intensity laser propagating through plasma drives the electron density at the laser frequency $\omega_p$. Plasmas have their own natural oscillations: electron plasma waves at $\omega_{\text{ep}}$ and ion acoustic waves at $\omega_{\text{ia}}$. When $\omega_p = \omega_{\text{ep}} + \omega_{\text{ia}}$ (or other resonance conditions), the laser decays parametrically into these two waves, dumping energy and limiting laser-plasma penetration. This is a major problem in inertial-confinement fusion experiments, and a major research area. The mechanism is *exactly* the OPO, with the plasma's natural modes as the daughter waves. Same Floquet equation, plasma medium.

`media-17` (static): a plasma parametric decay schematic. Laser beam hitting a plasma; arrows showing decay into electron plasma wave and ion acoustic wave. Phase-matching condition labeled. A note: this is one of the basic problems in laser fusion research. Brief, but it places Floquet in the company of "the things megabuck research programs are trying to prevent."

**Photonic time crystals.** Already introduced. A medium whose refractive index is modulated periodically in time at frequencies of order GHz (microwave) or higher. Theoretical proposal in the early 2010s; first experimental demonstrations from 2018 onward. The system exhibits frequency bandgaps and amplification of bandgap-frequency light from vacuum noise. Recent work has explored coupling time crystals to spatial crystals to build *space-time photonic crystals* with even richer dispersion. This is a frontier research area as of this writing.

`media-18` (static): a photonic time crystal frequency bandgap diagram. Frequency on the horizontal axis; effective gain $\alpha = \text{Re}(\mu)$ on the vertical axis. Bands of negative gain (decay) interspersed with bands of positive gain (amplification) — the temporal analog of a band structure. Annotation: "this is the Strutt diagram, viewed in the frequency rather than the parameter direction." Same physics, different slicing.

**Time crystals as a phase of matter.** Frank Wilczek proposed in 2012 that quantum many-body systems could spontaneously break discrete time-translation symmetry — i.e., *spontaneously oscillate at a sub-harmonic of any periodic driving*, in a way that persists indefinitely. After much theoretical debate, time crystals were observed in 2017 in nitrogen-vacancy centers in diamond, and subsequently in trapped-ion chains, in Google's Sycamore quantum processor, and in nuclear-spin systems. Time crystals are *macroscopic Floquet systems* in which sub-harmonic locking is a robust phase rather than a fragile resonance. They are the most exotic incarnation of "modulated systems can do things static systems cannot" — there is no static energy-minimum that supports the oscillation, and yet it persists.

For Stage 5, this matters because time crystals are the theoretical destination of the entire arc. A stable, robust, sub-harmonic locked state in a driven system is exactly what an audio "time crystal effect" sounds like: an audio carrier locked to a slow rhythmic modulation in such a way that the locking is *felt* as both rhythm and timbre simultaneously.

---

## Where this fits in the palace

The connections back to existing entries are dense; the project earns its place by deepening rather than displacing.

**[[DSP in Looping Dimensions]]** is the principle this project incarnates on its temporal axis. Where the [[2D Torus Wavetable Synthesizer]] is the *spatial* incarnation (two scanning phasors on a 2D surface), the Floquet project is the *temporal* incarnation (one delay loop with a periodically-modulated coefficient). Both produce 2-generator lattice spectra; both escape the harmonic-series obstruction by the same mechanism. The two projects are siblings. The final paragraph of *DSP in Looping Dimensions* names "kernel that itself lives on a higher-dimensional looping space, scanned at audio rate alongside the input" as the future territory — that is exactly Stage 3 of this project.

**[[Three Kinds of Warp]]** names this territory in advance. A delay loop with separately-clocked modulation is a **type-2** Floquet system (two incommensurate clocks → 2-generator lattice). A delay loop with coupled modulation (the loop output drives its own coefficient modulation, e.g. via an envelope follower) is a **type-3** Floquet system (coupled flow → bent lattice). The Mathieu equation is the simplest type-2 instance. The whole typology was already pointing at Floquet; this project lands the typology on its operator-level home.

**[[Frequency-Time Duality]]** is rendered rigorous here. The duality has so far been a perceptual claim about a single continuous parameter (repeat rate) producing different perceptual worlds. Floquet/Bloch is the *theorem* behind that claim. Repeat rate and frequency are not just perceptually dual; they are mathematically dual variables in the same operator equation, and the theorems of solid-state physics and Floquet dynamics are dual statements. A future update to *Frequency-Time Duality* should fold this in.

**[[Wavetable Space as Torus]]** offers a geometric reading: a Floquet kernel $k(\tau, t)$ with both arguments periodic is a function on a torus $\mathbb{T}^2$ — the *same* torus geometry the wavetable surfaces inhabit. Stage 3 of this project makes this literal: the seven existing surface entries become a library of Floquet *kernels*, doubling the project's reach.

**[[Kuramoto Coupling]]** provides the threshold-bifurcation language. The Mathieu instability threshold and the Kuramoto critical $K$ are both bifurcations — points in parameter space where the system's qualitative behavior flips. Above-threshold parametric resonance is the temporal cousin of above-threshold Kuramoto synchronization. Stage 5 of this project uses Kuramoto-style coupling between the audio carrier and the modulation envelope, fusing the two threshold mechanisms.

**[[Categorizing Inharmonicity]]** is the inverse-problem partner. That entry classifies what targets a Floquet-engineered modulation could try to achieve: piano stretching, Bessel clusters, Penrose quasi-periodicity, stiff-string asymmetry. Stage 4 of this project uses *Categorizing Inharmonicity* as its target catalog and Floquet engineering as the synthesis method.

**[[Boundary-Crossing Instruments]]** gets a new boundary on its list: the LTI / LTV boundary itself. Most of audio engineering lives on the LTI side without naming it. This project crosses that boundary in a single continuous parameter (modulation depth $q$), producing a one-knob navigation between two operator-theoretic regimes.

---

## Stage 1 — The Mathieu Resonator

*This is what gets built first. Everything above is the foundation; this is the deliverable.*

The Stage 1 instrument is a 2nd-order resonant filter whose center frequency is being modulated periodically at audio rate. It is a faithful audio implementation of the Mathieu equation, with a deliberate `tanh` saturation on the output to make the in-tongue exponential growth into a finite, designed sound rather than a numerical explosion. The instrument has three primary controls — the natural frequency $a$, the modulation depth $q$, and the modulation rate (broken out as a separate variable for performability, even though pure Mathieu form fixes it to twice the natural frequency). Two visualizers run alongside: a live $(x, \dot{x})$ phase-space plot, and a moving cursor on the Strutt diagram showing your current parameter location colored by stability.

### What you're building

A `codebox~` object with:
- **Three signal-rate inputs**: `freq` (the natural frequency $\omega_0$ in Hz), `q_depth` (the modulation depth, normalized 0–1), `mod_rate_ratio` (the ratio of modulation frequency to natural frequency; the canonical Mathieu case is exactly 2.0, but performability wants this controllable).
- **One signal-rate input** for excitation noise (so the resonator has something to amplify when crossing into a tongue — a vacuum can't be amplified but the tiny noise floor of audio gear can).
- **One audio output**: the saturated Mathieu state $\tanh(x)$.
- **Two state variables**: $x$ (position) and $v$ (velocity). One per `History` slot.

The numerical scheme is **symplectic Euler** — a one-step integrator that conserves the Hamiltonian structure in the un-modulated case and is stable for the parameter range we care about. We use symplectic Euler rather than RK4 for two reasons. First, RK4 introduces effective damping that distorts the marginal-stability boundary — the very feature we want to make audible. Second, symplectic Euler costs one multiply-add per state variable per sample; RK4 costs four. For audio rates up to 96 kHz this matters.

The update rule per sample is:

```
v_new = v + dt * (-(a - 2*q*cos(omega_mod * t)) * x + noise)
x_new = x + dt * v_new
```

where `dt = 1/samplerate`, `a = (2*pi*freq)^2 / (samplerate)^2 * scale_factor`, `q = q_depth * a`, and `omega_mod = mod_rate_ratio * 2*pi*freq / samplerate`. The `scale_factor` is a single tunable that brings the Mathieu non-dimensional time into the audio sample-rate domain; we'll set it carefully in code.

> **Bright student question — "Why symplectic Euler and not just Euler?"**
> Plain ("explicit") Euler computes $v_{\text{new}} = v + dt \cdot f(x_{\text{old}})$ and $x_{\text{new}} = x + dt \cdot v_{\text{old}}$. It is unstable for oscillators — even an undamped oscillator drifts to infinity. Symplectic ("semi-implicit") Euler computes $v_{\text{new}}$ first using $x_{\text{old}}$, then computes $x_{\text{new}}$ using *the new* $v_{\text{new}}$. The single change of using $v_{\text{new}}$ in the second update keeps the orbit on its energy ellipse rather than spiraling out. For a Mathieu equation at the edge of stability this is essential — the wrong integrator will turn every parameter point into a tongue.

### How the codebox~ gets organized

The `codebox~` source has five blocks, in order:
1. **Constants and parameter declarations** (`@param` for each user control with min/max/default).
2. **State** (`@state` for $x$, $v$, and the modulation phase accumulator $\phi$).
3. **A modulation lookup function** that returns $\cos(\phi)$ for the cosine-Mathieu canonical case. Stage 4 will swap this for a wavetable lookup; Stage 1 keeps it pure cosine.
4. **The per-sample tick**: phase advance, modulation evaluation, symplectic-Euler update, saturation, output.
5. **A verification checklist** in a comment block at the end, exactly matching the existing `torus_2d_lookup.codebox` convention — so Loudon can run the same protocol against this file.

All variable names match the symbols above where possible. Comments are dense and pedagogical — a student reading the codebox source should learn the Mathieu equation from the comments alone, in addition to having the equation taught above.

### The `codebox~` source itself

Built last. `Projects/Floquet Time-Modulated Loops/RNBO/mathieu_resonator.codebox`. The Build Manifest at the end of this document includes the prompt that produces it, and lists the verification checklist that gates its acceptance.

### Testing protocol (mirrors the Torus project's)

1. **Unmodulated test.** Set $q = 0$. The resonator should be a clean second-order resonant filter at the user's `freq`. Excite with a short noise burst. Output should ring at `freq` with whatever damping the symplectic-Euler scheme implicitly provides (ideally none; in practice, a tiny numerical drift over many seconds is acceptable).
2. **Below-threshold modulation.** $q = 0.05$, modulation rate ratio = 2.0 (canonical Mathieu pumping at twice the resonance). Output should be a dim, slightly-colored ring at `freq` — modulation is present but below the tongue threshold.
3. **Threshold crossing.** Sweep $q$ from 0.0 to 0.5 over 10 seconds. The output should be silent (with input noise floor) at first, then *crack* into ringing oscillation at some critical $q$. The cracking moment is the audible bifurcation. Below that moment, the noise input is being absorbed; above it, the system is exponentially amplifying it until `tanh` saturation catches up.
4. **Sub-harmonic check.** At canonical Mathieu ($q$ above threshold, mod ratio = 2.0), the output ring is at `freq`, and the modulation is at $2 \cdot$ `freq`. Spectrum analyzer should show a strong fundamental at `freq`, a strong second harmonic where the modulation lives, and a sideband ladder at $\text{freq} \pm n \cdot 2\text{freq}$. The fundamental is the resonator's own frequency, not pulled to the modulation rate — that's the signature of *parametric* (vs. driven) resonance.
5. **Tongue boundary mapping.** Park `freq` at 220 Hz, `mod_rate_ratio` at 2.0, and slowly sweep the *natural-frequency parameter* in the codebox (the `a` value) by remapping `freq` slightly. As `a` moves across $a = 1$ in the non-dimensional Strutt picture, the threshold $q$ should be smallest exactly at the tongue's center. Off-center, threshold is higher (you have to push deeper to enter the tongue). This is the tongue-shape mapping made audible.
6. **Saturation check.** Push $q$ well above threshold. Output should hit $\tanh$ saturation cleanly, no NaN, no infinity, no silent stuck states. The saturation timbre is part of the Stage 1 sound — it should be deliberate, not a numerical accident.

If any of these fail, the codebox source needs revision before media is rebuilt. The verification gate matches the *2D Torus* project's protocol.

### Stage 1 exercises

Each exercise is something a student does *with* the working instrument, after the lecture material. They are designed to make the theory felt rather than just understood.

1. **Make the tongue audible.** Park modulation rate at exactly $2 \cdot$ natural frequency. Slowly raise $q$ from zero. Listen for the crack. Note the $q$ value. Repeat with modulation rate slightly off from $2 \cdot$ natural; the threshold $q$ should be larger. You have just measured the tongue's width.
2. **Parametric stuck oscillation.** With $q$ above threshold, kill the input noise. Does the oscillation persist? It should, until floating-point underflow eventually starves the resonance. Notice that the resonance is "alive" — you didn't put energy in; the modulation did.
3. **Sweep and listen.** Modulate $q$ with a slow LFO. The system breathes in and out of the tongue. The result is a sound somewhere between vibrato, tremolo, and a self-oscillating filter — an audio object that doesn't quite fit any existing genre slot.
4. **Stack two Mathieu resonators.** Run two of them in parallel at slightly different `freq` values, with the same modulation source. The two tongues are at slightly different parameter locations; the two will threshold at different $q$. Listen as the LFO sweep wakes them up sequentially. This is the entry point to Stage 2's polyphonic Floquet comb.
5. **Push $q$ to extreme.** What does the saturation timbre sound like at $q = 1$? It should be a heavily clipped oscillation with strong sideband content. Notice that this is a *useful* sound, not a broken one — Floquet systems make their own distortion textures.

### Hilaritas Checklist for Stage 1

The four conditions of [[Hilaritas Generator|hilaritas]] for this stage:

- [x] **Real thing to make.** A working `codebox~` resonator that crosses into and out of parametric instability. The instrument has resistance — wrong integrator turns every point into a tongue, wrong saturation makes the in-tongue sound an explosion, wrong scaling moves the tongues out of the audio range. The making teaches.
- [x] **Tool that extends.** `codebox~` source is at the edge of most music-tech students' capability — Loudon's audience is DAW-fluent and may have built simple Gen~ patches, but writing a state-update equation by hand is the stretch. The Strutt-diagram visualizer extends their parameter-space intuition; the live phase-space plot extends their state-space intuition. Multiple capability axes.
- [x] **Cross-domain moment.** The Bloch-Floquet duality is the moment. A music producer who has crossed a tongue boundary at audio rate is, formally, in the same regime as a photonic time crystal experiment in a microwave-frequency lab. The same equation in two communities. The setup is the spatial-Bloch / temporal-Floquet side-by-side; the moment is the producer's own ear hearing a tongue crack open and the realization that this is a frequency bandgap.
- [x] **Reflecting surface.** "Where in your existing patches have you been silently assuming LTI? What would happen if you let one of those coefficients breathe periodically? Make a list of three candidates from your library. You don't have to build them — just name them."

### Stage 1 prerequisites and on-ramps

Stage 1 assumes:
- DAW fluency. *Shipped with the audience definition.*
- Basic Max/MSP fluency at the level of the [[Crystal Synthesizer]] Stage 1. Students who have never opened Max get a note: do that first.
- Comfort with second-order ODEs at the level of "I know what $\ddot{x} + \omega_0^2 x = 0$ is and why it oscillates." Students who don't get a note: read the [[Differential Equations]] palace entry and the section of [[Action Potential Oscillator]] that walks the membrane equation. The opening of *this* document also covers it; students can read it twice.
- Basic complex-number fluency. The characteristic-multiplier discussion uses the complex plane and the unit circle. Students who haven't seen this since high school: any short complex-numbers refresher works; no specific reference needed.

The session does *not* assume:
- Prior `codebox~` exposure. The session walks the syntax from scratch.
- Prior knowledge of Floquet theory, Bloch's theorem, parametric resonance, or any of the cross-domain phenomena. Everything is taught.
- Prior knowledge of bifurcation theory. The Kuramoto language is used briefly but the project's threshold mechanism is taught fresh.

---

## Stages 2–5 — the development arc

Sketched here at the level of "what's at each stop." Each stage will become its own teaching document in turn, deepened with the same media discipline as Stage 1.

### Stage 2 — Floquet Comb

A delay-line resonator (Karplus-Strong style) with periodically-modulated *loop gain* and *loop length*. Two modulators — call them $\mu_g$ and $\mu_L$ — at user-controllable rates. The system has three clocks now: the loop period itself, and the two modulation periods. Inside the right tongues, the comb peaks shift and replicate; at the right modulation ratios, they form a 3-generator lattice. The cross-domain hook is plasma parametric decay: a primary resonance (the loop) decaying into two daughter modes (the modulations). The Floquet sideband ladder is now visible directly on a spectrum analyzer; tongue boundaries are mapped in the 3D parameter space (gain mod, length mod, ratio).

Implementation environment: still `codebox~`, now with a `delay` operator. Integration is straightforward. The new pedagogy is the *spectrum analyzer running alongside the audio* as the primary visualizer — the comb peaks moving, splitting, and recombining is the lesson.

### Stage 3 — Floquet Kernel (wavetable as filter)

The 2D wavetable surfaces from the [[2D Wavetable Catalog]] are repurposed as Floquet *kernels*. One axis becomes impulse-response lag $\tau$; the other becomes modulation phase $t$. The audio is convolved along $\tau$ while $t$ is scanned at audio rate by an internal phasor. This is the convolutional sibling of the 2D Torus synthesizer, and it doubles the existing surface library's reach. The Penrose surface becomes a Penrose-filter; the Theta surface becomes a Theta-filter. Each surface's filter character is *the same* spectral signature its synthesis voice has, expressed as a kernel rather than a carrier.

Cross-domain hook: photonic time crystals as the operator-level realization of this. The audio Floquet kernel is the same object the photonics community is currently building at GHz scales.

Implementation environment: `codebox~` plus a `buffer` reference (same architecture as the existing `torus_2d_lookup.codebox`).

### Stage 4 — Floquet Engineering instrument

Inverse design. The user specifies a target *output* spectrum — piano-stretched, Bessel-clustered, Penrose-quasi-periodic, Chladni-pinned, or whatever else lives in the [[Categorizing Inharmonicity]] catalog. The instrument computes (offline, in Python) the modulation pattern that produces that target spectrum when used as a Floquet pump, and loads the result into a wavetable axis. The modulation patterns become a *library*, parallel to the wavetable surface library.

Cross-domain hook: Floquet engineering in cold-atom physics. Researchers there use periodic driving to engineer effective Hamiltonians the static universe doesn't offer. This stage does the same in audio: the modulation is engineered, not chosen aesthetically, to produce a target spectral character.

Implementation: Python solver writes the wavetable; `codebox~` reads it and modulates with it.

### Stage 5 — Time Crystal effect

Sub-audio modulation rate (perceivable as rhythm, ≤ 20 Hz) with audio-rate Bloch-wave content running through the kernel. The audio and the modulation period are now two coupled time scales, and Kuramoto-style coupling between them makes the locking and unlocking *felt* simultaneously as rhythm and timbre. The Hopf control surface from the 2D Torus project ports here — moving on $S^2$ moves both the audio behavior and the rhythm behavior, with their linkage as a topological invariant.

Cross-domain hook: time crystals as a phase of matter. A Stage 5 instrument is a small-scale audio time crystal; locking is the spontaneous breaking of discrete time-translation symmetry, just at low rates.

Implementation: `codebox~` + an outer LFO/sequencer ring, with shared phase variables linking the two scales.

---

## Implementation choices and conventions

`codebox~` is the right environment for this project. The argument:

- **Per-sample state update** is what we need. The Mathieu equation is solved by stepping forward one sample at a time; we hold $x, v, \phi$ as state and update each sample. `codebox~` is exactly this. Gen~ would also work, but `codebox~` reads more like math, which matches the pedagogy.
- **Existing convention.** The 2D Torus project already uses `codebox~` (`torus_2d_lookup.codebox`). Same convention here keeps the project family coherent and means students who have done the Torus session don't have to learn new tooling.
- **Verification harness ports.** The Torus project's A/B harness pattern (parallel implementation, difference monitor, threshold floor) ports directly. Stage 1's verification is "match a Python reference implementation"; Stages 2–3 will use the same harness style.
- **RNBO export path.** A `codebox~` patch exports cleanly to RNBO and from there to VST/AU and Max for Live device. The instrument can ship as a real plugin without recompilation.

The parameter conventions match the Torus project's: every parameter has min/max/default declared in the `@param` decorator, every state variable is `@state`, every helper function is named clearly, and the trailing comment block is a *VERIFICATION CHECKLIST* that names the bench tests in the order they should be run.

The parent Max patch holds:
- A `[noise~]` source (with gain control) for the excitation input.
- An `[ezdac~]` or `[live.gain~]` for output.
- A `[scope~]` for the time-domain view of $x$.
- A `[plot~]` or external `[jit.matrix]` for the live phase-space $(x, \dot{x})$ plot — fed by a second `out2` from the codebox carrying $v$.
- A separate JSUI or `bpatcher` displaying the Strutt diagram with a moving cursor at the current $(a, q)$. (Stretch goal for the session; could be a static visualizer in the live HTML interactive instead.)
- A spectrum analyzer (`fffb~` bank or `spectroscope~`) for the sideband ladder view.

Stretch goals are flagged as such in the manifest. The minimum viable Stage 1 is the codebox + scope + analyzer.

---

## Open Questions

- **What's the cleanest pedagogical entry point — the swing or the equation?** The swing is more vivid; the equation is more rigorous. Possibly the right move is to lead with the swing (live demonstration if Loudon brings a pendulum, otherwise the interactive `media-03`), then derive the Mathieu form, then show that the swing equation *is* the Mathieu equation. Open for staging-phase discussion.
- **Stretch interactive: a real-time spectrum overlay on the Strutt cursor.** As the cursor moves through parameter space, the live spectrum below shows the current sideband ladder. This is the most direct way to make the parameter-to-spectrum mapping felt. Belongs as Build Manifest item but flagged as stretch — adds significantly to the build cost.
- **When does the Stage 4 inverse-design problem become tractable?** Solving for a modulation pattern that produces a target spectrum is the hard inverse problem of Floquet engineering. For specific target classes (rational lattices, Bessel clusters) the solutions are known; for arbitrary targets, gradient-based search through the modulation space is the natural approach. This is a thesis-scale problem in its own right; we'll need to scope it carefully.
- **Hopf control surface for Stage 5.** What exactly lives on $S^2$? The candidate is the (relative phase $\Delta\phi$, coupling depth $K$) plane at fixed amplitude — a hemisphere if we use one phase, the full $S^2$ if we use two. The mapping from $S^2$ to performable parameters is the work, not the formula. Open.
- **Does the `tanh` saturation in Stage 1 distort the Strutt picture?** Strictly, yes — the linearized Mathieu equation predicts unbounded growth, and saturation truncates it. The tongue boundaries in the *saturated* system are still where they were in the linear system (saturation only acts above threshold), but the in-tongue *spectrum* is shaped by saturation. This is the Stage 1 sound. Whether it's the right sound or whether we want a different saturation (soft-knee, asymmetric, polynomial) is open for the session itself.
- **Floquet for nonlinear systems.** Floquet theory as stated is *linear*. A genuinely nonlinear Mathieu equation (where higher-order terms in $x$ matter) has a richer story: subharmonic bifurcations, period-doubling cascades into chaos, strange attractors. This is where Stage 5 begins to flirt with chaos. We have to draw a line carefully — chaotic synthesis is its own enormous palace topic.

---

## Lost Branches

- **Hill's equation and the more general periodic linear systems.** Mathieu is the canonical instance; Hill's equation $\ddot{x} + p(t) x = 0$ with arbitrary periodic $p(t)$ is the broader class. Audio-wise this is what Stage 4 is: arbitrary modulation waveforms. The general theorem (Hill's) deserves its own concept entry once Stage 4 is built.
- **Floquet for delay-differential equations.** A delay loop is, formally, an infinite-dimensional system; its Floquet theory is the theory of *delay-Floquet* systems. The math is harder but the Stage 2 Floquet Comb is exactly an instance. Future deepening.
- **Connection to KAM theory.** [[Wavetable Space as Torus]] already invokes the Kolmogorov–Arnold–Moser theorem in the context of orbital resonance and torus-knot stability under perturbation. Floquet's parametric instability is the destabilization mechanism: as the perturbation depth $q$ increases, KAM tori break first along the rational resonances, which are exactly the Mathieu tongues. The two frameworks are complementary; there's a synthesis entry waiting to be written.
- **Floquet topological insulators.** Cold-atom and condensed-matter systems can be made *topologically nontrivial* by periodic driving — phases that have no equilibrium counterpart. The audio analog is unclear but tantalizing: are there "topological" timbres that only exist under driving? Lost branch flagged for distant future.
- **Active feedback as Floquet engineering.** Every active feedback control system is, in some sense, doing Floquet engineering — using a time-dependent control signal to stabilize a system that the static plant can't reach. Naming this connection cleanly might unify control theory and audio Floquet design. Future thread.

---

## Forward Vector

*See YAML `forward_vector` field above.*

The first concrete move is the Build Manifest below: the next Claude (Claude Code, with sub-agents) executes it. Stage 1 ships when every media item is built, every validity check passes, and the codebox source is verified against the Python reference. The session ships when Loudon has sat with the artifacts, lived with the language, and decided where to set the cross-domain hook. The arc ships across five sessions and roughly one quarter of Loudon Live's curriculum.

The deeper aspiration: *to be the entry every periodically-modulated audio object eventually links back to.* Most of audio-engineering's "modulation" lives inside Floquet's domain without naming it. Naming it is the move.

---

## Build Manifest

*This section is the handoff to the next Claude. Each numbered item is a self-contained build prompt. Items can be executed in parallel by sub-agents where there are no cross-dependencies; dependencies are flagged. Each item names the file path it produces, its teaching purpose, the implementation approach, and the acceptance criteria the build is gated on. The last items (codebox source + parent patch documentation) gate on all preceding media being validated.*

**Operating context for the next Claude.** You are running in Claude Code with sub-agent / Task tool capability. You have read this entry and the four supporting concept entries (`Mathieu Equation.md`, `Parametric Resonance.md`, `Floquet Theory.md`, `Photonic Time Crystals.md`). The palace is at `/Users/loudonstearns/Documents/The Palace/`. The artifacts directory for this project is `Projects/Floquet Time-Modulated Loops/` — create it and its subdirectories before starting.

**Directory structure to create first:**
```
Projects/Floquet Time-Modulated Loops/
├── interactives/         (HTML files)
├── static/               (PNG files)
├── audio/                (WAV files + their generating Python)
├── python/               (shared Python utilities; reference numerical integrator)
└── RNBO/                 (codebox source + parent patch readme)
```

**Shared conventions (apply to every item):**
- All HTML interactives follow the Action Potential Oscillator pattern at `Projects/Action Potential Oscillator/neuron_oscillator.html`. Self-contained single-file HTML, no build step, runs offline. Use the same CSS variable system (the `:root` block of accent colors and serif/mono/sans font stack). Replace `--accent-na`, `--accent-k`, etc. with theme colors that suit the Floquet palette: `--accent-stable: #4aff8b` (green), `--accent-unstable: #ff6b4a` (orange-red), `--accent-marginal: #ffe44a` (yellow), `--accent-multiplier: #4aadff` (blue), `--accent-mod: #a64aff` (purple). The Source Serif 4 / JetBrains Mono / DM Sans font stack carries over.
- Every PNG is generated by Python (matplotlib + numpy). The Python file lives next to the PNG in the same directory, with the same base name (`{name}.py` produces `{name}.png`). The Python is heavily commented — a student reading the Python should learn the concept the PNG illustrates from comments alone. The image should be rendered at sufficient DPI (≥150) for print clarity.
- Every audio WAV is generated by Python (numpy + scipy.io.wavfile). Same naming pattern: `{name}.py` produces `{name}.wav` and is checked in. WAVs are 48 kHz mono 32-bit float (matches the Torus project's catalog convention). All audio is normalized to peak −3 dBFS to prevent clipping in any DAW.
- Every interactive HTML at the bottom has a `<details>` block titled "Source — see how this is built" that contains the relevant JavaScript or simulation logic, syntax-highlighted, with comments. The interactive is itself a teaching artifact in the same way the Python files are.
- Cross-link discipline. Where a piece of media references a concept, the in-page caption or HTML body should name the relevant palace entry as `[[Mathieu Equation]]` or similar — these aren't live links in the rendered HTML/PNG, but they tell anyone reading the source where to deepen.

**Validation discipline (apply to every item):** After each build, the executing Claude must do all three:
1. **Open the artifact and verify the acceptance criteria.** For interactives, run them in a browser-equivalent mental model (or actually, if the environment permits) and check the listed behaviors. For PNGs, view the rendered image and check the visual elements list. For audio, listen (or render the spectrogram and check spectrally).
2. **Validate the source code.** Read the Python or HTML/JS source. Confirm the comments are pedagogically dense and accurate. Confirm there are no obvious bugs in the math.
3. **Cross-check against the entry text.** Re-read the section of this document that describes the artifact. Confirm the artifact teaches the concept the section claims it teaches. If there's a mismatch, either the artifact or the entry text needs revision; flag it for human review.

If any validation fails, iterate. The first attempt is a draft; the second is the deliverable.

---

### media-01: LTI / LTV Boundary Diagram (static PNG + Python)

**File**: `static/01_lti_ltv_boundary.png` and `static/01_lti_ltv_boundary.py`

**Teaching purpose**: Place the LTI / LTV boundary in front of a student visually before any equations. A Venn-style diagram, with classic audio devices placed on each side: comb filter, biquad lowpass, IIR delay (LTI side); ring modulator, periodically-pumped resonator, FM oscillator, parametrically-pumped Karplus-Strong (LTV side). The Mathieu equation flagged in the LTV region as "the canonical instance, this project's anchor." The boundary line itself labeled "this is the wall most audio engineering pretends doesn't exist."

**Implementation**: matplotlib. Two overlapping or side-by-side regions with semi-transparent fills. Label boxes for each device. A bold separating curve. Title: *Linear, Time-Invariant vs. Linear, Time-Varying*. Subtitle: *The LTI / LTV boundary, with audio examples*.

**Acceptance criteria**:
- Both regions are clearly demarcated.
- At least 6 audio device labels are placed (3 per side).
- Mathieu equation is visually emphasized inside LTV.
- Image is ≥ 1600×1000 pixels at ≥ 150 DPI.
- Python source has at least 30 lines of comments explaining what each region means and why each device is on which side.

---

### media-02: Mathieu Equation Simulator (interactive HTML)

**File**: `interactives/02_mathieu_simulator.html`

**Teaching purpose**: Let a student feel the Mathieu equation. Two sliders ($a$ from 0.0 to 4.0, $q$ from 0.0 to 1.5). Live update of three plots: time series $x(t)$ over a few seconds, phase-space $(x, \dot{x})$, and an inset Strutt diagram with a cursor showing the current $(a, q)$ point colored green/yellow/red for stable/marginal/unstable. A play button that renders the time series as audio at user-selected sample rate (44.1 kHz default) so the student can hear stable vs. marginal vs. unstable. A small text panel below the simulator labels the current characteristic-multiplier magnitude and tells the user "Stable: $|\rho| < 1$" / "Unstable: $|\rho| > 1$."

**Implementation**:
- HTML/CSS following the Action Potential Oscillator pattern.
- JavaScript: symplectic Euler integration of the Mathieu equation. State: $x, \dot{x}$. Sample rate visible to the integrator. The Strutt-diagram inset is rendered once at high resolution as a precomputed PNG (or rendered to a `<canvas>` once at page load by sampling parameter space and integrating each point for stability — either approach acceptable).
- Web Audio API for the audio playback. Use an `AudioBufferSourceNode` with a buffer that is the integrator output, normalized to ±0.5 to keep peaks safe.
- Three canvases or SVG panels for the three plots, redrawn on slider change at ~30 Hz.
- Source code shown in a collapsible `<details>` block at the bottom of the page.

**Acceptance criteria**:
- Sliders update plots smoothly without lag.
- Strutt-diagram cursor moves correctly with sliders.
- Audio playback works in modern Chrome and Safari.
- Crossing into the first tongue (around $a = 1, q > 0$) produces audibly growing oscillation; crossing back produces stable response.
- Source code in `<details>` is the actual integration loop, syntax-highlighted, commented.
- Page loads in under 2 seconds and runs offline.

---

### media-03: Pumped Swing Interactive (interactive HTML)

**File**: `interactives/03_pumped_swing.html`

**Teaching purpose**: Make parametric resonance physical. A pendulum visualization (SVG or canvas) with a slider for "pumping rate" and another for "pumping depth." When pumping rate is set to twice the swing's natural frequency and depth is above threshold, the swing's amplitude builds visibly (and audibly, via a tone whose loudness tracks amplitude). When mistuned or below threshold, nothing happens. The visual makes the threshold *seen* — the student can move the depth slider and watch the amplitude curve transition from flat to exponential.

**Implementation**:
- A 2D pendulum simulator: pivot can move vertically (the "pump"); pendulum bob hangs below. Equation is the parametrically-pumped pendulum: $\ddot{\theta} + \frac{g + a_p \cos(\Omega t)}{L} \sin\theta = 0$, with $a_p$ the pump amplitude and $\Omega$ the pump rate.
- Numerical integration via symplectic Euler.
- Web Audio: a 220 Hz tone whose amplitude is $|\theta|$ scaled. The tone gets louder as the swing builds.
- A small chart below the pendulum showing $\theta(t)$ over the past few seconds — the amplitude envelope.

**Acceptance criteria**:
- At pump rate = 2× natural and depth above threshold, swing builds within a few seconds visibly.
- At any other condition, swing eventually settles or slowly damps (small numerical damping is acceptable).
- Audio amplitude follows swing amplitude correctly.
- Threshold is identifiable — student can find the value of "depth" at which behavior switches.
- Source visible in `<details>`.

---

### media-04: Stable / Marginal / Unstable Audio Triple (audio + Python)

**File**: `audio/04a_below_threshold.wav`, `audio/04b_at_threshold.wav`, `audio/04c_above_threshold.wav`, `audio/04_generate.py`

**Teaching purpose**: Three short (5-second) WAVs of the same Mathieu resonator at the same $a = 1$ and three values of $q$: $q = 0.05$ (well below threshold), $q = 0.10$ (right at the n=1 tongue's edge for these dimensionless params), $q = 0.30$ (well above). Excitation is white noise at low level. Each WAV is the resonator's output. The audio difference is dramatic and pedagogical: silence-with-coloration, rising tone, full ringing oscillation.

**Implementation**:
- One Python script generates all three. Heavily commented, every numerical choice explained.
- Symplectic Euler integration at 48 kHz for 5 seconds × 3 conditions.
- Outputs three WAVs.
- Includes a print summary of measured peak amplitudes for each condition.

**Acceptance criteria**:
- Three WAVs at 48 kHz mono 32-bit float, peak normalized to −3 dBFS.
- Audible threshold transition between the three (especially clear between 04a and 04c).
- Python source ≤ 100 lines, ≥ 40 lines of comments.
- Spectrogram of 04c shows clear sideband ladder structure.

---

### media-05: The Strutt Diagram (static high-quality PNG + Python)

**File**: `static/05_strutt_diagram.png` and `static/05_strutt_diagram.py`

**Teaching purpose**: The full Strutt diagram, generated by direct numerical integration. Parameter space $a \in [-2, 6]$ horizontal, $q \in [0, 2]$ vertical. Each pixel: integrate the Mathieu equation for many periods from a small initial condition, measure whether the magnitude grows or stays bounded, color accordingly. The first three tongues clearly visible at $a = 1, 4, 9$. The Kapitza stable region in $a < 0$ visible. Annotations: "$a = 1$ — primary parametric resonance (the swing tongue)," "$a = 4$ — secondary," "$a < 0$ — Kapitza stable region (inverted pendulum)," "the $q = 0$ axis — no modulation, just simple harmonic oscillators."

**Implementation**:
- Python script computes the diagram by numerical integration on a grid (at least 200×200 points, more if feasible).
- For each grid point: integrate from $(x, \dot{x}) = (1, 0)$ over many periods (e.g., 50). Compute final amplitude. Stability inferred from amplitude growth.
- matplotlib renders with appropriate colormap (e.g., the "RdYlGn" diverging map, or a custom green/yellow/orange palette matching the project theme).
- Annotations placed manually at each tongue and the Kapitza region.

**Acceptance criteria**:
- All three tongues clearly visible and correctly positioned.
- Kapitza stable region visible.
- Tongue boundaries are smooth (not pixelated chaos), confirming the grid resolution is adequate.
- Image ≥ 1800×1200 pixels at ≥ 150 DPI.
- Python source ≤ 200 lines, ≥ 60 lines of comments explaining the integration scheme, the stability test, and the parameter-space conventions.
- The script reports approximate compute time so a future user knows what to expect.

---

### media-06: Strutt Diagram Explorer (interactive HTML)

**File**: `interactives/06_strutt_explorer.html`

**Teaching purpose**: A clickable Strutt diagram. The user clicks anywhere; the cursor moves there; the resulting time series is computed live and played as audio. The user can drag the cursor across a tongue boundary and *hear* the transition. This is `media-05` (the static diagram) made interactive.

**Implementation**:
- The Strutt diagram itself is the static PNG from `media-05`, embedded as a background image of a clickable canvas.
- JavaScript handles click/drag and integrates the Mathieu equation for the selected $(a, q)$ point.
- Time-series and audio output update on each click.
- Optional small overlay shows the integrated trajectory visually (a line trail) on top of the diagram.

**Acceptance criteria**:
- Clicking a stable region produces a clean ringing tone that decays.
- Clicking inside a tongue produces a growing, eventually saturated, ringing tone.
- Drag across the n=1 tongue boundary produces an audible transition.
- The cursor visually marks the current click location.
- Source visible in `<details>`.

**Dependency**: `media-05` (the Strutt PNG) must be built first.

---

### media-07: Tongue Anatomy Zoom (static PNG + Python)

**File**: `static/07_tongue_anatomy.png` and `static/07_tongue_anatomy.py`

**Teaching purpose**: A zoomed view of the n=1 tongue (around $a = 1$) with the boundary drawn analytically using Mathieu's classical perturbation expansion (the boundary is given by $a = 1 \pm q + O(q^2)$ for small $q$, with higher-order terms also computable). Inside labeled "Unbounded — parametric resonance," outside "Bounded — stable," boundary "Marginal — neutrally stable." A small inset shows three time-series traces — one from each region — reinforcing the classification.

**Implementation**:
- matplotlib. The boundary curves drawn as analytical functions (the perturbation expansion to a few orders).
- The three inset time series computed by direct integration at three carefully chosen $(a, q)$ points.
- Annotations placed cleanly with appropriate arrows or callouts.

**Acceptance criteria**:
- Boundary curves match `media-05`'s numerical-integration boundary to visual precision.
- The three inset traces unambiguously demonstrate the three behaviors.
- Image ≥ 1600×1100 pixels at ≥ 150 DPI.
- Python source explains the perturbation expansion in comments and shows how the three inset points were chosen.

---

### media-08: Multipliers vs. Parameter Space (static PNG + Python)

**File**: `static/08_multipliers_vs_params.png` and `static/08_multipliers_vs_params.py`

**Teaching purpose**: Two side-by-side panels. Left: the complex plane with the unit circle drawn and three characteristic-multiplier points placed: one inside (labeled "stable"), one outside (labeled "unstable, tongue interior"), one on the unit circle (labeled "marginal, tongue boundary"). Right: the Strutt diagram with three points marked in matching colors, one in each region. Arrows or color-coding link each multiplier to its parameter-space twin. Title: *The unit circle is the bifurcation*.

**Implementation**:
- matplotlib with two subplot panels.
- Multipliers computed by direct integration of the monodromy matrix and then `numpy.linalg.eig` on the result.
- Three matched colors for the three points; clear visual linking via arrow annotations or matched legends.

**Acceptance criteria**:
- Unit circle clearly drawn.
- Three multipliers clearly placed (with the inside / outside / on-circle relationship visually obvious).
- Three Strutt-diagram points clearly placed in matching regions (tongue / outside / boundary).
- Connecting visual logic (color, arrows, or labels) clearly conveys the linkage.
- Image ≥ 1800×1000 pixels at ≥ 150 DPI.
- Python source includes the monodromy matrix construction and eigenvalue computation.

---

### media-09: Multiplier Visualizer (interactive HTML)

**File**: `interactives/09_multiplier_visualizer.html`

**Teaching purpose**: An interactive complement to `media-08`. Adjust $(a, q)$ via two sliders; see the two characteristic multipliers plotted in the complex plane with the unit circle. Drag across a tongue boundary and watch one multiplier slide outside the unit circle. A small panel labels the multiplier magnitudes numerically.

**Implementation**:
- HTML/CSS in the project style.
- JavaScript: integrate the Mathieu equation over one period twice (from $(1,0)$ and $(0,1)$) to construct the $2 \times 2$ monodromy matrix. Use `numeric.js` or hand-written 2×2 eigenvalue computation (closed form for 2×2: $\lambda = (\text{tr} \pm \sqrt{\text{tr}^2 - 4\det})/2$, both work).
- A canvas displaying the unit circle and two moving multiplier points (with their conjugates if they go off the real axis).

**Acceptance criteria**:
- Both multipliers update smoothly with slider changes.
- Inside a tongue: one multiplier moves outside the unit circle.
- Outside a tongue: both multipliers stay on the unit circle (or at least within numerical tolerance).
- Source visible in `<details>`.

---

### media-10: Phase Space Stroboscopic Portrait (static PNG + Python)

**File**: `static/10_phase_space_strobe.png` and `static/10_phase_space_strobe.py`

**Teaching purpose**: A side-by-side phase-space plot of the Mathieu equation, sampled stroboscopically (a dot every modulation period $T$). Left panel: stable point inside the n=1 tongue's neighborhood but outside the tongue. Dots stay on a closed curve — the *invariant torus* of the linearized system. Right panel: unstable point inside the tongue. Dots spiral outward exponentially. Both share the same $(a, q)$-region context for visual comparison.

**Implementation**:
- matplotlib. Two side-by-side subplots.
- For each: integrate the Mathieu equation for ~100 periods from a small initial condition. Sample $(x, \dot{x})$ once per period. Plot.
- Trajectory line in light gray under the dots so the student sees both the continuous flow and the period-stroboscopic samples.

**Acceptance criteria**:
- Stable plot: dots on a closed curve.
- Unstable plot: dots clearly spiraling outward (or onto two outward-spiraling sub-orbits if period-doubled).
- Image ≥ 1800×900 pixels at ≥ 150 DPI.
- Python source explains the stroboscopic-sampling concept in comments.

---

### media-11: Bloch ↔ Floquet Duality (static PNG + Python)

**File**: `static/11_bloch_floquet_duality.png` and `static/11_bloch_floquet_duality.py`

**Teaching purpose**: The dual-axis side-by-side that may be the most important single image in the entry. Left: 1D crystal lattice (a row of atom-circles), an electron wavefunction overlaid as $\psi(x) = e^{ikx} u(x)$, an energy band structure $E(k)$ plotted underneath with bandgaps shaded. Right: a time-modulated medium (a row of clock-face icons indicating the periodic coefficient), an audio "wavefunction" overlaid as $x(t) = e^{\mu t} p(t)$, the Floquet exponent's real part $\alpha$ plotted along a frequency axis with tongue regions shaded. Crossed arrows label the dual variables: "$x \leftrightarrow t$," "$a \leftrightarrow T$," "$k \leftrightarrow \mu$," "$E \leftrightarrow \omega$." Title: *Bloch in space, Floquet in time — the same theorem in dual variables*.

**Implementation**:
- matplotlib with two side-by-side subplot regions.
- Crystal lattice can be drawn schematically with circles for atoms.
- Wavefunctions and signals drawn as continuous curves above the lattices/clocks.
- Energy band structure: a real, plausible band diagram (sinusoidal bands with gaps — an empty-lattice approximation suffices to make the point pictorially).
- Floquet panel: a numerical computation of $\alpha(\omega) = \text{Re}(\mu(\omega))$ for a representative cosine modulation, showing the bandgap-like structure.
- Annotations with dual-variable correspondence drawn as crossed arrows or labeled boxes.

**Acceptance criteria**:
- The two halves are clearly mirror-images in their structure.
- The dual-variable correspondence is unambiguous from the image alone.
- The bandgap and tongue regions are visually equivalent in shading and emphasis.
- Image ≥ 2000×1200 pixels at ≥ 150 DPI.
- Python source documents the duality in detail in comments — at least 80 lines of comments.

---

### media-12: Sideband Ladder (static PNG + Python)

**File**: `static/12_sideband_ladder.png` and `static/12_sideband_ladder.py`

**Teaching purpose**: Four-row visualization. Top row: four modulation waveforms (cosine, FM-style cosine-of-cosine, square, drawn-wavetable) over one period. Second row: each modulation's Fourier coefficient magnitudes $|c_n|$ plotted as a stem plot. Third row: each modulation's resulting sideband spectrum at a Floquet loop's output (carrier at 220 Hz, modulation rate at 80 Hz) — sidebands at $220 \pm n \cdot 80$ with amplitudes proportional to $|c_n|$. Title: *The modulation Fourier series IS the spectral envelope*.

**Implementation**:
- matplotlib with a 4-row × 4-column subplot grid.
- The first four cases are standard. The "drawn wavetable" case can be a hand-designed waveform like a cosine bump on a flat baseline, or a Gaussian, or a sawtooth chunk.
- All Fourier coefficients computed by FFT of the modulation samples.

**Acceptance criteria**:
- Four modulation waveforms are visually distinct.
- Fourier-coefficient stem plots are clearly differentiated.
- Sideband spectra match the predicted patterns (cosine: two sidebands; square: 1/n falloff at odd; FM: Bessel pattern; wavetable: arbitrary).
- Image ≥ 2000×1400 pixels at ≥ 150 DPI.
- Python source ≤ 200 lines, ≥ 60 lines of comments.

---

### media-13: Sideband Ladder Audio Quartet (audio + Python)

**File**: `audio/13a_cosine.wav`, `audio/13b_fm.wav`, `audio/13c_square.wav`, `audio/13d_wavetable.wav`, `audio/13_generate.py`

**Teaching purpose**: Four 4-second WAVs corresponding to the four modulation cases in `media-12`. A 220 Hz Mathieu resonator is parametrically pumped by each modulation shape at 80 Hz modulation rate, $q$ above threshold. The audio teaches what each modulation's sideband ladder *sounds like* — paired with `media-12`'s spectral picture, the student gets sound and shape together.

**Implementation**:
- Single Python script generates all four. Same numerical scheme as `media-04` but with the modulation source swapped per case.
- Outputs four WAVs.

**Acceptance criteria**:
- Four WAVs at 48 kHz mono 32-bit float, peak normalized to −3 dBFS.
- Each WAV's spectrogram visibly shows the predicted sideband structure.
- The four sound clearly different from each other.
- Python source ≤ 150 lines, ≥ 50 lines of comments.

---

### media-14: Faraday Wave Pattern (static PNG + Python)

**File**: `static/14_faraday_wave_pattern.png` and `static/14_faraday_wave_pattern.py`

**Teaching purpose**: A simulated standing-wave surface pattern from a vertically-vibrated fluid, with annotation showing the Mathieu-equation tongue that selects this mode. Cross-link in the caption to the Chladni surface in [[2D Wavetable Catalog]] — the static Chladni patterns and the dynamic Faraday patterns are siblings.

**Implementation**:
- matplotlib's 3D plotting or a 2D contour/heightmap.
- Compute a representative pattern by superposition of standing-wave modes on a square domain at a chosen drive condition. The mode selection follows the Faraday-wave dispersion relation (gravity + capillarity); the dominant mode at a given drive frequency is the one whose Mathieu tongue most strongly intercepts the drive.
- Annotation panel labels the mode, the drive condition, and the corresponding tongue.

**Acceptance criteria**:
- A clean wave pattern is visible — square, hexagonal, stripe, or similar.
- The mode is named in an annotation.
- The cross-link to the Chladni surface in the wavetable catalog is in the caption text.
- Image ≥ 1600×1100 pixels at ≥ 150 DPI.
- Python source ≤ 150 lines, ≥ 40 lines of comments.

---

### media-15: Kapitza Inverted Pendulum (interactive HTML)

**File**: `interactives/15_kapitza_pendulum.html`

**Teaching purpose**: A pendulum on a vertically-oscillating pivot. Sliders for pivot oscillation frequency (5–60 Hz) and amplitude (0–10 % of pendulum length), plus initial pendulum angle slider (45° to 180°). At low pivot oscillation, an inverted initial condition immediately falls. Above a threshold, the inverted pendulum stays *up*, wobbling slightly with the pivot's tiny ripple visible. The audience experience is "a pencil balanced on its tip held there by shaking."

**Implementation**:
- 2D pendulum simulator with vertically-moving pivot.
- Equation of motion: $\ddot{\theta} - (g - a_p \Omega^2 \cos(\Omega t))/L \sin\theta = 0$ (sign of gravity flipped because we're considering the inverted equilibrium at $\theta = \pi$).
- Numerical integration via symplectic Euler at high enough rate to resolve the pivot oscillation.
- Animation rendered to a canvas at ~60 fps.

**Acceptance criteria**:
- Default pivot params: pendulum starts inverted, *stays* inverted within a small wobble.
- Pivot frequency too low: pendulum falls.
- Pivot amplitude too small: pendulum falls.
- The "I can balance a pencil on its tip with shaking" experience lands.
- Source in `<details>`.

---

### media-16: OPO Sideband Diagram (static PNG + Python)

**File**: `static/16_opo_sidebands.png` and `static/16_opo_sidebands.py`

**Teaching purpose**: A schematic of a laser-pumped optical parametric oscillator. Pump beam at $\omega_p$ entering a nonlinear crystal; signal at $\omega_s$ and idler at $\omega_i$ emerging. The phase-matching condition $\omega_s + \omega_i = \omega_p$ called out. Annotation: "the OPO selects one specific pair of sidebands $(\omega_s, \omega_i)$ from the full Floquet sideband ladder, the pair determined by the cavity's phase-matching condition. Same theorem; longer wavelengths." Cross-link in caption to `media-12` so the student sees the sideband pattern this is sampling from.

**Implementation**:
- matplotlib with manual schematic drawing — ideally not photorealistic, more like a textbook diagram. Block for crystal, arrows for beams, labels for frequencies, an inset for the conservation law.

**Acceptance criteria**:
- The schematic is clear: input pump, output signal+idler, conservation law.
- The cross-link to `media-12` is in the caption.
- Image ≥ 1400×900 pixels at ≥ 150 DPI.
- Python source comments narrate the OPO's history and connect it to audio Floquet — minimum 50 comment lines.

---

### media-17: Plasma Parametric Decay Schematic (static PNG + Python)

**File**: `static/17_plasma_decay.png` and `static/17_plasma_decay.py`

**Teaching purpose**: A schematic. Laser beam at $\omega_p$ entering a plasma; arrows showing decay into electron plasma wave at $\omega_{\text{ep}}$ and ion acoustic wave at $\omega_{\text{ia}}$. Phase-matching condition $\omega_p = \omega_{\text{ep}} + \omega_{\text{ia}}$ labeled. Annotation: "this is a major problem in inertial-confinement fusion research — and structurally identical to the Mathieu Resonator's parametric instability."

**Implementation**: same as `media-16` — schematic textbook diagram in matplotlib.

**Acceptance criteria**:
- Clear schematic.
- The "fusion research" + "Mathieu Resonator" both-named annotation is present.
- Image ≥ 1400×900 pixels at ≥ 150 DPI.

---

### media-18: Photonic Time Crystal Bandgap (static PNG + Python)

**File**: `static/18_photonic_time_crystal.png` and `static/18_photonic_time_crystal.py`

**Teaching purpose**: A frequency bandgap diagram for a representative photonic time crystal. Frequency on the horizontal axis (GHz scale to be physically suggestive); effective gain $\alpha = \text{Re}(\mu)$ on the vertical axis. Bands of negative gain interspersed with bands of positive gain. Annotation: "this is the Strutt diagram of `media-05`, viewed in the frequency rather than the parameter direction." Cross-link in caption to `media-05` and `media-11`.

**Implementation**:
- Compute $\alpha(\omega)$ for a Mathieu-like equation with periodic modulation, varying the natural frequency $\omega_0$ and holding $q$ fixed (or vice versa) — the result is a 1D slice through the Strutt diagram, replotted as gain vs. frequency.
- matplotlib for the resulting plot.

**Acceptance criteria**:
- Multiple bandgaps visible (positive-gain bands).
- Cross-links to `media-05` and `media-11` in caption.
- Image ≥ 1600×900 pixels at ≥ 150 DPI.
- Python source explains the slicing in comments.

---

### media-19: Stage 1 codebox~ Source (codebox + Python reference + readme)

**File**: `RNBO/mathieu_resonator.codebox`, `RNBO/mathieu_reference.py`, `RNBO/README — Mathieu Resonator.md`

**Teaching purpose**: The Stage 1 instrument itself. The `codebox~` source has the same dense pedagogical comment style as `torus_2d_lookup.codebox`. The Python reference implementation produces a numerically-identical output (to floating-point tolerance) for the same input parameters, as the verification harness. The README documents the parent Max patch wiring, the A/B harness pattern, and the verification protocol.

**Implementation**:

**The codebox source structure** (closely follows `torus_2d_lookup.codebox` in style):
1. Header comment block: project name, file purpose, parent-patch wiring requirements, A/B harness instructions.
2. `@param` declarations: `freq` (20 Hz to 4000 Hz, default 220), `q_depth` (0 to 1, default 0), `mod_rate_ratio` (0.5 to 4.0, default 2.0), `gain` (0 to 1, default 0.5), `noise_level` (0 to 1, default 0.001).
3. `@state`: `x` (position), `v` (velocity), `phi` (modulation phase accumulator).
4. Per-sample tick block:
   - Compute $\omega_0 = 2\pi \cdot \text{freq} / \text{samplerate}$.
   - Compute $\omega_{\text{mod}} = \text{mod\_rate\_ratio} \cdot \omega_0$.
   - Advance $\phi$ by $\omega_{\text{mod}}$.
   - Compute the modulation: $\cos(\phi)$.
   - Compute the time-varying restoring coefficient: $a - 2q\cos(\phi)$ where $a = \omega_0^2$ and $q = q_{\text{depth}} \cdot \omega_0^2$.
   - Compute the noise input.
   - Symplectic Euler update: $v_{\text{new}} = v + (-\text{coeff} \cdot x + \text{noise}) / \text{samplerate}$, $x_{\text{new}} = x + v_{\text{new}} / \text{samplerate}$.
   - Saturate: $\text{out1} = \tanh(x) \cdot \text{gain}$.
   - Store $v_{\text{new}}, x_{\text{new}}$ back to state.
5. Trailing verification checklist comment block (same pattern as `torus_2d_lookup.codebox`):
   - Test 1: $q = 0$ — clean resonance.
   - Test 2: $q = 0.05$ at canonical pumping — below-threshold coloration.
   - Test 3: sweep $q$ — find the threshold crack.
   - Test 4: above-threshold spectrum check — sidebands at predicted positions.
   - Test 5: A/B difference monitor against Python reference.

**The Python reference** is `mathieu_reference.py`. Same equation, same numerical scheme, runs offline in numpy. Generates a WAV (saved to `audio/19_reference_output.wav` for the harness) with a fixed parameter set. The codebox running in Max with the same parameters should produce a sample-by-sample identical waveform up to numerical noise.

**The README** documents:
- The parent Max patch's required objects (noise source, scope~, ezdac~, spectrum analyzer).
- The A/B harness setup against the Python reference WAV.
- The five-step verification protocol with acceptance criteria.
- Common failure modes (wrong integrator → instability everywhere; wrong scaling → tongues out of audio range; wrong saturation → numerical explosion).

**Acceptance criteria**:
- Codebox source is well-formed (would compile in RNBO without syntax errors — no `peek` calls or other features that don't apply here; all operators are basic arithmetic and `cos` and `tanh`).
- Python reference produces audibly Mathieu-resonator behavior with the test parameters.
- Verification checklist matches the entry's "Testing protocol" section.
- README is clear enough that Loudon could assemble the parent patch from it alone.

**Dependency**: gates on all media-01 through media-18 being validated. The codebox is the *last* artifact built.

---

### media-20: Strutt Diagram with Audio Sweep (audio + Python)

**File**: `audio/20_strutt_sweep.wav` and `audio/20_strutt_sweep.py`

**Teaching purpose**: A 30-second WAV that sweeps through the Strutt diagram along a curve passing through the n=1 tongue. The student hears the entire transition: silence-with-coloration → cracking-on threshold → ringing oscillation → cracking-off → silence. Pair with `media-06` (the Strutt explorer) for the active version; this is the passive version a student listens to once before exploring.

**Implementation**:
- Python: compute the Mathieu equation along a parametric curve in $(a, q)$ space passing through the n=1 tongue (e.g., $a$ fixed at 1, $q$ swept linearly from 0 to 0.5 and back; or a circular path around the tongue's tip).
- Render to a single 30-second WAV.

**Acceptance criteria**:
- The threshold transitions are clearly audible.
- Total duration 30 seconds.
- 48 kHz mono 32-bit float, peak normalized to −3 dBFS.
- Python source ≤ 80 lines, ≥ 30 lines of comments.

---

## Validation summary

After all 20 media items + the codebox source are built and individually validated, the next Claude performs an integration check:

1. **Cross-reference check.** Walk through the entry text section by section. For every reference like "see `media-NN`," confirm the artifact exists, opens correctly, and teaches what the section claims.
2. **Style check.** Confirm all interactives use the project palette and font stack consistently. Confirm all PNGs render at adequate DPI. Confirm all WAVs have consistent normalization and channel format.
3. **Pedagogy check.** Sample three random media items and ask: "if a student knew nothing about Floquet theory and saw only this artifact and read its caption, what would they walk away with?" If the answer is something coherent and matches the intended teaching purpose, pass. If not, iterate.
4. **Build a manifest summary.** Produce a final `BUILD_SUMMARY.md` in `Projects/Floquet Time-Modulated Loops/` that lists every artifact with its file path, file size, and a one-sentence description. This becomes the project's index for future reference.

Once all four checks pass, Stage 1 is complete and ready for Loudon to walk through.

---

> *"The world is full of systems whose coefficients change with time. We have only been pretending otherwise because the math was tractable."* — paraphrase of Norbert Wiener
> *"Crystals are Bloch in space; time-modulated systems are Floquet in time. The same theorem in dual variables."*
> *"A swing is the simplest parametric pump. A photonic time crystal is the most exotic. Between them is a continent."*
