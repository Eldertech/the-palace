---
title: "Crystal Synthesizer"
type: project
pillars: [creation, tools, philosophy]
born: 2026-02
last_activated: 2026-04
activation_count: 2
stage: fruiting
confidence: working
energy: high
hook_quality: 9
beauty: 10
who_leads: loudon
links:
  - target: "[[Hyperdimensional Prism]]"
    type: connects-to
  - target: "[[Wallpaper Groups]]"
    type: deepens
  - target: "[[Bessel Functions in Synthesis]]"
    type: connects-to
  - target: "[[Quantum Synthesizer]]"
    type: mirrors
  - target: "[[Boundary-Crossing Instruments]]"
    type: enables
  - target: "[[Harmonicity and Inharmonicity]]"
    type: couples-with
  - target: "[[Dispersion]]"
    type: emerged-from
  - target: "[[Differential Equations]]"
    type: deepens
  - target: "[[Signal-Rate CV Architecture]]"
    type: mirrors
  - target: "[[The Metaphor Stretch]]"
    type: spawned
    label: midwifed
  - target: "[[What Claim Does Scientific Sonification Make?]]"
    type: spawned
forward_vector: "The first audio exists. Seven lattice types rendered, spectral hypotheses directionally confirmed (cubic brightest → triclinic most scattered). Four Decision Points identified and built into the code as explicit pedagogical parameters. The live edge is now the fidelity question: what claim does this instrument make about actual crystals? Three paths named, none chosen. The next move is either first performance (which will force the choice) or building lesson material around the Decision Points — starting with N_PARTIALS as the most audibly dramatic. The honest artifact (beating sweeps that are wrong in detail but right in tendency) wants examination across other boundary-crossing instruments. Audio files at Projects/Crystal Audio/."
---

# Crystal Synthesizer

A synthesizer whose partial structure is derived directly from the vibrational phonon modes of crystalline lattices. Instead of harmonic series, FM spectra, or additive synthesis tables, a crystal synthesizer uses the actual mode frequencies and damping characteristics that emerge from real crystal physics.

The foundational insight: crystals are resonant systems. Their characteristic vibrations—phonons propagating through the lattice—obey quantized modal equations determined entirely by their 3D periodicity and atomic masses. Transpose these frequencies from THz (where crystals vibrate) into the audio range by scaling, and the phonon mode structure becomes an instrument's timbre palette. The optical properties that make crystals beautiful (birefringence, dispersion, pleochroism, fluorescence) emerge from the same anisotropic symmetries that shape the vibrational modes. Sonic and optical properties are not separate—they are different observational projections of the same underlying crystal structure.

## The Physical Reality: Crystals as Resonators

A crystal is a 3D lattice of atoms oscillating around equilibrium positions. In the simplest case, each atom couples to its neighbors through spring-like forces. The resulting system has a finite number of normal modes—the allowed vibrational patterns. These are *phonons*: quantized vibrations, analogous to photons (light quanta) but in the mechanical domain.

The phonon dispersion relation—the curve $\omega(k)$ mapping wavelength to frequency—is the essential mathematical description. For a simple cubic crystal:

$$\omega(k) = 2\sqrt{\frac{K}{m}} \left| \sin\left(\frac{k_x a}{2}\right) \right|$$

(where $K$ is the spring constant, $m$ is mass, $a$ is lattice spacing). The shape of this curve determines everything about how the crystal resonates. Long-wavelength phonons (small $k$) are slow; short-wavelength phonons are fast; the steepness of the curve encodes the material's acoustic impedance.

At room temperature, a crystal contains roughly $10^{22}$ phonons per cubic centimeter, excited thermally. Strike the crystal, and you excite many phonon modes simultaneously. These decay through damping (anharmonic coupling between modes), releasing energy as heat and sound. The *temporal decay profile* of these modes is what you hear as tone color and sustain.

In a synthesizer, instead of oscillating a mass-spring at a fixed frequency, we oscillate at the frequencies that are *natural to a chosen crystal*. The instrument *enacts* its physics.

## Bravais Lattice Taxonomy: Seven into Fourteen into 230
Interface design: 3D accurate slowly rotating wireframe diagram with the chemical letters below. light through fog shining through the wireframe and being dispersed and modulated by the rotating crystals.

There are exactly 7 **primitive lattice systems** in 3D, distinguished by the symmetry of their unit cell:

The following timbral descriptions are derived from spectral analogy — reasoning from optical to acoustic behavior by structural parallel. They are not empirically verified. The Crystal Synthesizer exists precisely to test them. Each description below is a hypothesis. The builder's task is to confirm or disprove it.

1. **Cubic**: Three equal axes, 90-degree angles. Highest symmetry. Phonon mode density is isotropic (same in all directions). At the zone boundary, many degenerate modes create spectral clustering. Example: diamond, NaCl.
   - **Hypothesis:** *thick, bright, rich partials — high-frequency modes densely packed, clustering near the zone boundary.* To be tested.

2. **Tetragonal**: Two equal axes, one different, 90-degree angles. Middle symmetry.
   - **Hypothesis:** *slightly pinched, with directional coloration — two interleaved mode families from the axis asymmetry.* To be tested.

3. **Orthorhombic**: Three unequal axes, 90-degree angles. Lower symmetry.
   - **Hypothesis:** *less dense in high frequencies, more separated partials — three distinct mode groups with wider spacing.* To be tested.

4. **Hexagonal**: Triangular base, different height. Like a prism. Modes split into ordinary and extraordinary rays — birefringence in optics becomes birefringence in acoustics (frequency-dependent direction-dependent sound speed). Example: quartz, graphite.
   - **Hypothesis:** *birefringent — a doubled, shimmery quality from two distinct propagation velocities.* To be tested.

5. **Trigonal** (Rhombohedral): Similar symmetry to hexagonal but different geometry.
   - **Hypothesis:** *near-hexagonal with subtle asymmetries — a slight irregularity in partial spacing that adds shimmer without full birefringent doubling.* To be tested.

6. **Monoclinic**: Only one 90-degree angle. Lower symmetry.
   - **Hypothesis:** *complex, inharmonic — no simple pattern to partial spacing, more bell-like and unpredictable.* To be tested.

7. **Triclinic**: No perpendicular axes. Lowest symmetry. Every mode is unique; no degeneracies. Partials have no simple integer relationships. Example: plagioclase feldspar.
   - **Hypothesis:** *deeply inharmonic, each partial scattered, no recurring structure — chaotic, bell-like, unpredictable decay patterns. The most "alien" timbre of the seven.* To be tested — and the prediction here is the least certain.

When you add **glide reflection** (translation + reflection) and **screw rotation** (translation + rotation), the 7 primitive systems generate **14 Bravais lattices**. When you account for the atoms *within* the unit cell (basis), the full classification yields **230 space groups**—the complete enumeration of all possible 3D periodic symmetries in nature. Every crystal belongs to one of these 230 groups. Every crystal's phonon structure maps to its space group.

## The Optical-Sonic Bridge: Dispersion, Anisotropy, and Resonance

Crystals have distinctive optical properties because light interacts with their periodic electron density. The same periodicity that diffracts light also diffracts acoustic phonons.

**Dispersion** (frequency-dependent refractive index $n(\omega)$) occurs because light couples to bound electron oscillators. These oscillators have resonance frequencies (near UV/visible for most crystals). When light frequency approaches an oscillator frequency, the dielectric response blows up, creating strong wavelength-dependence.

**Acoustic dispersion** is structurally identical. Phonon frequency $\omega$ depends on wavelength $k$ according to the dispersion relation. In cubic crystals, dispersion is isotropic; in anisotropic crystals (hexagonal, tetragonal), different directions have different slopes. Birefringence in optics (two refractive indices depending on polarization) mirrors birefringence in acoustics (two sound speeds depending on the acoustic polarization).

**Pleochroism** (color varies with crystal orientation and viewing direction) has an acoustic analog: the frequency content of a phonon pulse depends on its propagation direction in the crystal.

**Fluorescence** (absorption of high-energy photons, re-emission at lower energy) echoes quantum cascade decay: when you excite a high phonon mode, it can decay into lower modes, radiating the energy difference as acoustic cascades.

Most provocatively: **the refractive index at a given frequency tells you the group velocity of light at that frequency**. By analogy, **the phonon dispersion curve at a given frequency tells you the group velocity of sound at that frequency**. Optical dispersion material (a prism) separates white light spatially by frequency. An *acoustic dispersion* crystal would separate a broadband sound pulse into frequency-dependent arrival times—each frequency component travels at a different speed. This is not metaphor—it is the same physics in different materials.

A crystal synthesizer could exploit this: feed a complex harmonic signal through a "crystal filter" whose frequency-dependent delay is derived from the actual phonon dispersion relation. The output is not just frequency-filtered but *temporally dispersed*—frequencies separate in time the way a prism separates them in space.

## What the Instrument Would Be

Several architectural possibilities:

**Option 1: Wavetable Synthesizer with Crystal Basis**
- Generate the phonon mode structure for a chosen crystal and lattice direction.
- Render the mode frequencies (scaled into audio range) as a custom harmonic partial table.
- Use standard ADSR envelope and modulation, but the partial *set* is determined by crystal physics, not design choice.
- Sweeping the "crystal resonance direction" (which direction through the lattice the phonons propagate) shifts the timbre in real-time.

**Option 2: Modal Synthesizer**
- Excite each phonon mode independently.
- Each mode has its own resonant filter at the mode frequency, with Q-factor determined by the mode's lifetime (anharmonic decay rate).
- Strike the crystal (broadband impulse) and let the excited modes ring down with their characteristic decay times.
- This directly models how a real crystal resonates.

**Option 3: Dispersion Filter**
- Frequency-dependent delay derived from the phonon dispersion relation.
- Broadband input → each frequency component delayed by $\tau(\omega) = -d\Phi/d\omega$ where $\Phi$ is the phase response.
- For anisotropic crystals, the delay also depends on propagation direction.
- Dramatically different sound from frequency-independent filtering: frequencies don't just change amplitude, they shift in time.

**Option 4: Coupled Oscillators**
- Implement the crystal lattice directly as a grid of coupled mass-spring oscillators.
- Excite one (or several) atoms; watch the vibration propagate.
- Map the resulting atomic displacement patterns to filter coefficients or waveform shapes.
- This is most faithful to the physics but computationally intensive.

## Why This Matters: Phonons as Synthesis Paradigm

Every synthesizer embodies a physical model—either explicitly or implicitly.

- Additive synthesis: *spectrum is arbitrary*. You choose the partials. This is closest to "anything goes."
- FM synthesis: *partials obey Bessel function weighting*, reflecting phase-space rotation. The physics constrains which spectra are reachable.
- Wavetable synthesis: *partials obey a stored waveform's Fourier series*. Again, constraint through physics (the waveform's geometry).

A crystal synthesizer inverts the paradigm: instead of "what spectrum can I make," it asks "what spectrum does Nature make in this material?" The crystal becomes the *specification* for which sounds are possible. You do not choose the partials arbitrarily; the crystal's symmetry and physics choose them for you.

This connects to [[Hyperdimensional Prism]]: the crystal is a prism machine. Its periodicity multiplies a single atom's vibrational mode through 230 possible symmetries, generating all the possible collective phonon modes. The timbre emerges not from design but from the symmetry group's projection.

## Open Questions

- How do you auralize a phonon dispersion curve directly? Is the dispersion relation itself a "timbre" parameter?
- Can you map anharmonic mode coupling (mode-mode interactions) into real-time parameter modulation?
- Do crystals with high optical birefringence also have pronounced acoustic anisotropy? If so, what do birefringent crystals *sound* like?
- The triclinic lattice generates the most inharmonic phonon structure. Is there a triclinic "timbre" that is uniquely chaotic or bell-like?
- How would a performer interface with this? Choosing a crystal, a direction, an excitation pattern—these feel like the controls. What is the performance gesture?

## Forward Vectors
- Implement a prototype crystallographic oscillator bank in Gen~ where symmetry group determines partial relationships
- Explore whether [[Wallpaper Groups]] can generate timbral palettes that are perceptually "crystalline" vs "amorphous"
- Test the hypothesis: a crystal structure's point group maps to a specific spectral fingerprint

