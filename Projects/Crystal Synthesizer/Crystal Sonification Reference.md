---
title: "Crystal Sonification Reference"
born: 2026-04-21
links:
  - target: "[[Crystal Synthesizer]]"
    type: connects-to
    label: child-of
forward_vector: "I am the mineral palette for [[Crystal Synthesizer]] — physical properties, spectral ratios, and generation prompts for the eight crystals. I keep the partial tables canonical so the instrument and its media stay physically honest."
---

# Crystal Sonification Reference
*A mineral palette for the Crystal Synthesizer — physical properties, spectral ratios, image prompts, and audio examples*

---

> 📷 **[Image prompt — hero]:** Photorealistic studio photograph of eight crystals arranged on a dark slate surface: diamond (rough octahedral), ruby (faceted cabochon, deep red), amethyst cluster (purple points), fluorite cube (purple-green), emerald hexagonal prism (deep green), topaz crystal (pale blue), labradorite slab (showing blue-gold schiller), and a piece of black obsidian. Each crystal lit dramatically from the upper left, soft shadows. Museum quality. Horizontal composition, wide format.

---

## The Universal Transposition System

Every crystal in this palette generates a set of phonon mode frequencies — the natural vibrational resonances of its atomic lattice. These are measured in terahertz or wavenumbers (cm⁻¹) — far above audible range. The transposition to audio works through one critical insight: **only ratios matter**.

Normalize every mode frequency against the lowest mode:

$$r_n = \frac{\omega_n}{\omega_1}$$

These dimensionless ratios are the timbre DNA of the crystal. They are independent of any choice about pitch.

For a MIDI note M, the root frequency is:

$$f_\text{root} = 440 \times 2^{(M - 69)/12} \text{ Hz}$$

Each partial then sits at:

$$f_n = f_\text{root} \times r_n$$

The scale factor that converts THz to Hz — roughly 10⁻⁹ — cancels out completely. It never appears in the synthesis. This is not a limitation; it is precisely what makes the instrument musically coherent: the physics lives in the ratios, and the performer controls the root through MIDI.

> 📷 **[Image prompt — transposition concept]:** Clean scientific infographic on dark background. Left side: a phonon dispersion curve labeled in THz (y-axis ~0–40 THz), with several modes highlighted as colored horizontal lines. An arrow labeled "÷ ω₁ → ratios" points rightward. Center: a vertical column of dimensionless ratio numbers (1.00, 1.32, 1.48, 1.57...). Another arrow labeled "× f_MIDI" points rightward. Right side: a musical staff with colored partials sitting above a MIDI note. The physical and musical domains remain cleanly separated. Minimal, technical illustration style.

---

## Creative Mapping Parameters

The transposition from THz to Hz is arbitrary — only the ratios within the crystal's spectrum are physically meaningful. This arbitrariness is not a flaw to hide. It is a set of creative instrument parameters to expose.

Four parameters define the mapping space. Together they answer: *which part of the crystal's physics do we hear, and how do we hear it?*

---

### 1. Input Ceiling — How much of the spectrum to include

The phonon spectrum of a complex crystal like emerald contains 174 branches spanning an enormous frequency range. The input ceiling ω_max sets where you stop reading the crystal.

- **Low ceiling**: only acoustic-branch modes — sparse, open, fewest partials
- **Mid ceiling**: acoustic + low optical modes — the core timbre character
- **Full ceiling**: all measured modes including high Si-O or C-C stretches — the complete, often very bright palette

Lowering the ceiling is not inaccuracy — it is a choice about which layer of the crystal's physics you are listening to.

---

### 2. Output Span — How many octaves above the root

The output span determines the frequency range into which all selected modes are mapped.

- **1 octave**: all partials compressed within one octave above the root — dense, organ-like
- **2 octaves**: standard bell-like spread
- **4 octaves**: partials stretched widely — glassy, sustained, ethereal
- **Variable per partial**: the span can itself be a performance parameter

The same crystal sounds completely different at 1-octave span versus 4-octave span, even though every ratio relationship is preserved proportionally.

---

### 3. Mapping Function — The spectral stretch parameter

The most musically powerful parameter. A power law function α controls how the input ratios distribute within the output span:

$$r_n^\text{out} = 1 + \left(\frac{r_n - 1}{r_\text{max} - 1}\right)^\alpha \times (2^\text{span} - 1)$$

| α value | Effect |
|---------|--------|
| α < 1 | High partials compressed toward fundamental — mellower, denser |
| α = 1 | Linear — ratios preserved proportionally (the physics, undistorted) |
| α > 1 | High partials stretched outward — brighter, more bell-like, wider gaps |

At α = 1, you are hearing the crystal's physics exactly as scaled. At other values, you are applying a lens that emphasizes different regions of the spectrum. This makes the physical basis audible by contrast: as you sweep α, you hear the crystal's structure deform toward and away from its natural shape.

> 📷 **[Image prompt — mapping function curves]:** Scientific graph on white background. X-axis: "Input ratio (r_n / r_max)", 0 to 1. Y-axis: "Output position in span", 0 to 1. Three smooth curves plotted: α = 0.4 (strongly concave, labeled "compressed — mellow"), α = 1.0 (straight diagonal, labeled "linear — physics as-is"), α = 2.5 (strongly convex, labeled "stretched — bell-like"). Curves color-coded: warm amber, neutral grey, cool blue. Clean axis labels, minimal grid.

---

### 4. Root Mode Assignment — Which phonon becomes the fundamental

By default, the lowest zone-boundary acoustic mode is set to f_root. But every other assignment is equally valid:

- **Lowest Raman mode**: often the strongest low-frequency resonance — gives a more "vocal" root
- **Strongest Raman mode**: assigns the most physically prominent mode to the pitch center — everything else becomes harmonic context
- **User-selectable**: the performer points at any mode in the spectrum and declares it the fundamental — all other partials shift their ratios accordingly

Changing the root assignment is like redefining the tonic of the crystal's scale. The physical relationships remain intact; only the reference shifts.

> 📷 **[Image prompt — four creative parameters as instrument panel]:** Illustration of a synthesizer module panel (Eurorack style, dark anodized aluminum). Four large knobs labeled: "INPUT CEILING" (with markings: acoustic / low optical / full), "OUTPUT SPAN" (1oct to 4oct), "SPECTRAL STRETCH α" (center detent at 1.0, range 0.2–3.0), "ROOT MODE" (select dial with mode numbers). Small LED indicator next to each knob. Adjacent to each knob, a small diagram showing its sonic effect. Clean technical illustration with warm lighting.

> 🔊 **[Audio prompt — parameter sweep demonstration]:** Synthesize a single MIDI note (A3, 220 Hz) using the Ruby crystal partial table (7 partials at ratios: 1.00, 1.10, 1.14, 1.19, 1.52, 1.70, 1.98). Output span fixed at 2 octaves. Slowly sweep α from 0.3 to 3.0 over 8 seconds — partials should compress together and then spread apart. Equal amplitude per partial. Smooth parameter change, no clicks. The listener should hear the partial structure shift from dense cluster to widely spaced bell.

---

## The Crystals

---

### Diamond
*Cubic — Fd-3m — the tightest spectrum, highest symmetry*

> 📷 **[Image prompt — diamond crystal]:** Photorealistic rendering of a rough natural diamond octahedron, approximately 2cm, on a black velvet surface. White-blue internal light scattering. The crystal faces reflect faint rainbow dispersion. No faceting — raw natural form. Studio lighting from upper right.

Diamond is pure carbon in face-centered cubic packing — the highest possible 3D symmetry. Every direction through the crystal is identical. With only two atoms per primitive cell, it produces the smallest phonon palette of any crystal here: six branches.

**Unit cell:** a = 3.567 Å, all angles 90°. Two carbon atoms → **6 phonon branches** (3 acoustic + 3 optical).

**The math:** Carbon-carbon bonds are extremely stiff (force constant K ≈ 950 N/m) and carbon is light (m = 12 amu). The dispersion along [100]:

$$\omega(k) = 2\sqrt{\frac{K}{m}} \left|\sin\left(\frac{ka}{2}\right)\right|$$

Diamond is non-polar (no charge separation between atoms), so there is no LO-TO splitting — the optical modes are degenerate at the zone center. Cubic symmetry makes many modes coincide.

**Partial ratios (zone boundary):**

| Mode | ω (cm⁻¹) | r_n |
|------|----------|-----|
| TA | 805 | 1.00 |
| TA | 805 | 1.00 (degenerate) |
| TO | 1060 | 1.32 |
| LA | 1190 | 1.48 |
| LO | 1265 | 1.57 |
| Γ optical | 1332 | 1.65 |

> 📷 **[Image prompt — diamond partial spectrum]:** Horizontal bar chart on dark background. Y-axis: partial number 1–6. X-axis: ratio r_n from 1.0 to 2.0. Bars shown as thin glowing white-blue lines. Two bars overlap at r_n = 1.00 (visually shown as slightly thicker/brighter). Bars cluster between 1.00 and 1.65 — a very compressed range. Label each bar with its mode type (TA, TO, LA, LO). Title: "Diamond — 6 Modes." Minimal, scientific.

**The Spectrum:** The ratio range is only 1.65:1 — the most compressed of all eight crystals. All six partials sit within a minor tenth above the fundamental. The degeneracy at the zone boundary means some partials genuinely coincide, reducing the effective palette to four distinct pitches. No gaps, no isolated overtones — just a tight, dense cluster.

**Predicted Sound:** Brilliant and thick. All partials stack close together, creating a rich beating texture within a narrow band. The highest partial is less than an octave and a half above the fundamental — diamond does not ring out; it saturates the space immediately above the root. The non-polar covalent character means no sudden spectral jumps. Of all crystals here, diamond sounds most like a sustained, compressed chord.

> 🔊 **[Audio prompt — diamond sustained tone]:** Synthesize MIDI note G3 (196 Hz) using 4 distinct diamond partials: 196 Hz, 258.7 Hz (×1.32), 289.8 Hz (×1.48), 307.7 Hz (×1.57), 323.4 Hz (×1.65). Equal sine-wave amplitude per partial. No envelope — pure sustained tone for 4 seconds. No reverb. The clustering of partials should create audible beating between the close-interval upper partials.

> 🔊 **[Audio prompt — diamond with decay]:** Same partials as above. Strike envelope: fast attack (5ms), no sustain, long exponential decay (3 seconds). Each partial decays at a slightly different rate — higher partials decay 20% faster. Struck metallic quality. The tight partial cluster should give a bright, compressed, bell-like tone that decays to a single fundamental.

---

### Ruby
*Trigonal — R-3c (corundum α-Al₂O₃) — birefringent shimmer, near-doublets*

> 📷 **[Image prompt — ruby crystal]:** Photorealistic photograph of a natural ruby hexagonal prism, deep red to pink-red, approximately 3cm tall, held upright on white marble. Strong internal light scattering. The crystal has visible growth striations along the c-axis. The deep red of the gem saturates toward the center. Studio quality, macro lens.

Ruby is aluminum oxide (corundum) with trace chromium — the Cr³⁺ ions absorb green and yellow light, transmitting deep red. The phonon structure belongs entirely to the Al₂O₃ corundum lattice. With ten atoms per primitive cell, it generates thirty phonon branches. Seven are Raman-active and form the synthesis palette.

**Unit cell:** a = 4.758 Å, c = 12.99 Å (hexagonal description). 10 atoms → **30 phonon branches**, 7 Raman-active.

**The math:** Factor group analysis of R-3c yields two symmetry families that map directly to the optical birefringence of the crystal:

- **A₁g modes** (2): polarized along the c-axis — the "extraordinary" phonons
- **Eg modes** (5): polarized in the basal plane — the "ordinary" phonons

These two families propagate at slightly different velocities, just as light travels at two different speeds through ruby depending on polarization. Acoustic birefringence: two mode families, slightly offset in frequency.

**Partial ratios (Raman-active modes, normalized to 378 cm⁻¹):**

| Mode | Sym. | ω (cm⁻¹) | r_n | Family |
|------|------|----------|-----|--------|
| 1 | Eg | 378 | 1.00 | ordinary |
| 2 | A₁g | 417 | 1.10 | extraordinary |
| 3 | Eg | 430 | 1.14 | ordinary |
| 4 | Eg | 448 | 1.19 | ordinary |
| 5 | Eg | 576 | 1.52 | ordinary |
| 6 | A₁g | 644 | 1.70 | extraordinary |
| 7 | Eg | 748 | 1.98 | ordinary |

> 📷 **[Image prompt — ruby partial spectrum]:** Horizontal bar chart, dark background. X-axis: r_n from 1.0 to 2.2. Two colors: warm red bars for Eg (ordinary) modes, deep gold bars for A₁g (extraordinary) modes. Partials 2 and 3 (1.10 and 1.14) shown very close together — the near-doublet — with a small label "birefringent doublet." Bars labeled by mode number and symmetry. Title: "Ruby — 7 Modes, 2 Polarization Families."

**The Spectrum:** The near-doublets at 1.10/1.14 and at higher positions represent the acoustic birefringence — two polarization families that nearly but not quite coincide. The interval between 1.00 and 1.10 is approximately a minor second; between modes 2 and 3 is smaller still. These close pairs will beat slowly against each other at audio frequencies, producing a natural chorus or shimmer embedded in the physics.

**Predicted Sound:** Warm, shimmering, with a natural ensemble quality from the birefringent doublets. The interval structure in the lower partials (seven semitones, two semitones, one semitone) is unusual — not harmonic, not fully inharmonic, but with a distinctive tonal gravity. The upper partials (×1.52, ×1.70, ×1.98) are more spread out, adding bell-like upper register. The "rubiness" is in the doublets.

> 🔊 **[Audio prompt — ruby sustained tone]:** MIDI note A3 (220 Hz). Seven sine-wave partials at: 220, 242, 250.8, 261.8, 334.4, 374, 435.6 Hz. Slight amplitude variation: modes 1 and 7 at full amplitude, interior modes at 85%. Sustained 5 seconds. No reverb. The near-doublets at 242/250.8 Hz should produce slow beating (~8.8 Hz — audible as gentle tremolo). This is the birefringence made audible.

> 🔊 **[Audio prompt — ruby vs diamond comparison]:** Same MIDI note (A3, 220 Hz) through diamond partials (4 effective pitches), then ruby partials (7 pitches), each held 3 seconds with a 0.5 second silent gap between. Strike envelope on both. The listener should hear: diamond — tight and brilliant; ruby — warmer and shimmering, more complex. Label transitions clearly if rendered as a demonstration audio file.

---

### Amethyst / Quartz
*Trigonal — P3₁21 — the widest spread, the soft mode, the breath*

> 📷 **[Image prompt — amethyst crystal]:** Photorealistic photograph of a natural amethyst crystal cluster, rich violet-purple points on white matrix, backlit slightly to show internal color variation from deep purple at tips to pale lavender at base. The points are elongated hexagonal prisms with typical quartz terminations. Natural, unpolished. Wide format, warm studio light.

Amethyst and clear quartz are the same crystal — α-SiO₂ — with different iron impurity concentrations giving the purple color. One of the most thoroughly characterized phonon spectra in crystallography. With nine atoms per primitive cell and twenty-seven branches, it has roughly twelve strong Raman lines spanning the widest frequency range of any crystal in this collection.

**Unit cell:** a = 4.913 Å, c = 5.405 Å. 9 atoms → **27 phonon branches**, ~12 strong Raman lines.

**The math:** The SiO₄ tetrahedral units produce three distinct mode families at well-separated frequency regions:

- **Cage modes** (~128–265 cm⁻¹): rigid-body rotation and translation of SiO₄ units — slow, large-scale motion
- **Ring modes** (~355–464 cm⁻¹): breathing of the six-membered Si-O rings
- **Bond stretching** (~697–1160 cm⁻¹): Si-O bond extension within each tetrahedron

The 207 cm⁻¹ mode is singular — it is a "soft mode" that drives the α→β quartz phase transition at 573°C. At room temperature it is unusually strong and low in frequency for a material this stiff, a remnant of the instability toward the higher-temperature phase.

**Partial ratios (normalized to 128 cm⁻¹):**

| Mode | ω (cm⁻¹) | r_n | Family |
|------|----------|-----|--------|
| 1 | 128 | 1.00 | cage |
| 2 | 207 | 1.62 | *soft mode — "the breath"* |
| 3 | 265 | 2.07 | cage |
| 4 | 355 | 2.77 | ring |
| 5 | 401 | 3.13 | ring |
| 6 | 464 | 3.63 | ring (strongest) |
| 7 | 697 | 5.45 | Si-O stretch |
| 8 | 795 | 6.21 | Si-O stretch |
| 9 | 1065 | 8.32 | Si-O stretch |

> 📷 **[Image prompt — quartz partial spectrum]:** Horizontal bar chart, dark background. X-axis: r_n from 1.0 to 9.0 — notably wider than other crystals shown. Three color groups: amber for cage modes (1.00, 2.07), violet for ring modes (2.77, 3.13, 3.63), pale blue for Si-O stretch modes (5.45, 6.21, 8.32). The soft mode at 1.62 labeled with a small annotation: "soft mode — phase transition remnant." The wide gap between 3.63 and 5.45 visually apparent. Title: "Amethyst/Quartz — 9 Modes, 3 Families."

**The Spectrum:** Ratio range 1.00 to 8.32 — the widest span of the collection, nearly three octaves and a major third above the fundamental. The three families create two visible gaps: between cage and ring modes (2.07→2.77), and between ring and stretching modes (3.63→5.45). The soft mode at 1.62 sits in the first gap like an outlier — physically it belongs to neither cage nor ring, but to the instability between two crystal phases.

**Predicted Sound:** Wide, bell-like, with a deep body and glassy high overtones. The soft mode at ratio 1.62 produces an interval close to a minor sixth — unusual and slightly melancholy. The ring modes form a tight cluster (2.77, 3.13, 3.63) that adds a mid-register chime. The Si-O stretching modes at 5.45–8.32 are very high, barely audible as individual tones, contributing instead to a glassy shimmer. Quartz sounds nothing like diamond despite similar stiffness — the three-family structure makes it ring open and wide.

> 🔊 **[Audio prompt — amethyst/quartz sustained tone]:** MIDI note C3 (130.8 Hz). Nine sine-wave partials at ratios: 1.00, 1.62, 2.07, 2.77, 3.13, 3.63, 5.45, 6.21, 8.32. Amplitude decreasing with ratio: f_root at 1.0, each subsequent partial at 85% of previous. Sustained 6 seconds. The wide span (highest partial at 8.32 × 130.8 = 1088 Hz) should create an open, spacious, bell-like texture distinct from the compressed diamond sound.

> 🔊 **[Audio prompt — soft mode isolation]:** MIDI note C3. Play only two partials: the fundamental (130.8 Hz) and the soft mode (211.9 Hz, ratio 1.62). Sustained 8 seconds. Then fade in the remaining 7 partials. The listener should first hear only the melancholy minor-sixth interval of the phase-transition remnant, then the full crystal bloom around it.

---

### Fluorite
*Cubic — Fm-3m — the ionic gap, two families separated by silence*

> 📷 **[Image prompt — fluorite crystal]:** Photorealistic photograph of a purple-green fluorite cube, perfectly cleaved, approximately 5cm per side, on black velvet. Deep purple color with green zoning near one corner. Perfect cubic cleavage faces visible. Strong internal transmission of purple light. The geometry is strikingly perfect — a natural cube.

Fluorite (CaF₂) is the mineral that gives fluorescence its name — it was the first material in which the phenomenon was observed. Like diamond, it is cubic — but the similarity ends there. Diamond is covalent and non-polar; fluorite is strongly ionic, with Ca²⁺ and F⁻ carrying significant charges. This electrostatic character changes everything about the phonon spectrum.

**Unit cell:** a = 5.463 Å. 3 atoms per primitive cell (1 Ca + 2 F) → **9 phonon branches**.

**The math:** Long-range Coulomb forces between Ca²⁺ and F⁻ ions produce a large **LO-TO splitting** — a frequency gap between longitudinal and transverse optical phonons described by the Lyddane-Sachs-Teller relation:

$$\frac{\omega_\text{LO}^2}{\omega_\text{TO}^2} = \frac{\varepsilon_0}{\varepsilon_\infty}$$

For fluorite, ε₀/ε∞ ≈ 3.4, producing:

- TO phonon: ~257 cm⁻¹
- LO phonon: ~471 cm⁻¹

A gap of 214 cm⁻¹ — a frequency range where **no phonon can propagate**. This is physically real: if you try to send a vibration through fluorite at a frequency in this range, the crystal rejects it. In the synthesizer, this becomes a literal silence in the partial series.

**Partial ratios:**

| Mode | ω (cm⁻¹) | r_n | Family |
|------|----------|-----|--------|
| TA (zone boundary) | 190 | 1.00 | acoustic |
| TA (zone boundary) | 190 | 1.00 (degenerate) | acoustic |
| TO | 257 | 1.35 | optical low |
| F₂g Raman | 322 | 1.69 | optical low |
| — *ionic gap* — | — | ~1.5–2.5 | *no modes exist here* |
| LO | 471 | 2.48 | optical high |
| LA (zone boundary) | 280 | 1.47 | acoustic |

> 📷 **[Image prompt — fluorite partial spectrum]:** Horizontal bar chart, dark background. X-axis: r_n from 1.0 to 2.8. Three acoustic-branch bars in warm amber (1.00, 1.00, 1.47). Two lower optical bars in violet (1.35, 1.69). Then a clearly marked gap region (shaded region from ~1.5 to 2.5 labeled "ionic gap — no phonon propagation"). One isolated LO bar in bright blue at 2.48, visually alone on the far right. The gap is the dominant visual feature. Title: "Fluorite — Ionic Gap."

**The Spectrum:** The ionic gap is the defining feature — a frequency range from approximately r_n = 1.5 to 2.5 where the crystal physically cannot sustain a vibration. Below the gap: three acoustic modes and two optical modes clustered together. Above the gap: one isolated LO mode. This single high partial sits alone, separated from the others by the electromagnetic character of the Ca-F bond.

**Predicted Sound:** Two distinct tonal registers separated by an audible gap. The lower cluster (1.00–1.69) produces a warm, dense lower body; the isolated LO mode at 2.48 rings above the gap like a distant overtone with no neighbors. The effect is hollow and resonant in a way none of the covalent crystals produce — the silence in the middle is structural, not accidental. Fluorite proves that same lattice type (cubic) can sound completely different when the chemistry changes.

> 🔊 **[Audio prompt — fluorite with ionic gap]:** MIDI note E3 (164.8 Hz). Six partials: 164.8 Hz, 164.8 Hz (unison — degenerate TA), 222.5 Hz (×1.35), 242.4 Hz (×1.47), 278.5 Hz (×1.69), and then — after a clear spectral gap — 408.7 Hz (×2.48). Equal amplitudes. Sustained 5 seconds. The listener should distinctly hear the two registers — a warm lower cluster and a single bell-like overtone floating above empty space.

> 🔊 **[Audio prompt — diamond vs fluorite comparison]:** Both cubic. Both played at the same MIDI note (A3, 220 Hz), 3 seconds each with 0.5-second gap. Diamond first: tight bright cluster. Fluorite second: the hollow gap, the isolated overtone. Demonstrates that lattice type alone does not determine timbre — the chemistry (covalent vs ionic) matters as much as the geometry.

---

### Emerald
*Hexagonal — P6/mcc (Beryl) — 174 branches, the ring breath, possible water overtone*

> 📷 **[Image prompt — emerald crystal]:** Photorealistic photograph of a natural emerald hexagonal prism, deep forest green, approximately 4cm tall, standing upright. Unpolished with natural termination. Light transmitted through the crystal shows deep emerald green with slight variations. The hexagonal cross-section is clearly visible. White marble background. Museum specimen quality.

Emerald is beryl — Be₃Al₂Si₆O₁₈ — a complex silicate built from interlocking six-membered Si₆O₁₈ rings forming hollow hexagonal channels running the length of the crystal. These channels can hold water molecules, small ions, or remain empty. With 58 atoms in the conventional unit cell and 174 phonon branches, emerald generates the richest and densest mode structure of any crystal here.

**Unit cell:** a = 9.21 Å, c = 9.19 Å. 58 atoms → **174 phonon branches**.

**The math:** The six-membered Si₆O₁₈ rings have a characteristic ring-breathing mode — a collective in-phase expansion and contraction of the entire ring. This mode at ~536 cm⁻¹ is the acoustic signature of the beryl structure, and the strongest Raman line in the spectrum. It sits at ratio 1.68 above the lowest mode — close to a perfect fifth.

If the hexagonal channels contain water, the O-H stretching modes of the water molecules appear at ~3600 cm⁻¹ — an isolated overtone at ratio ~11.25, physically separated from all structural modes by a factor of three. This would be a delicate high shimmer, nearly inaudible as a discrete partial but contributing crystalline sparkle.

**Selected strong Raman modes (normalized to ~320 cm⁻¹):**

| Mode | ω (cm⁻¹) | r_n | Character |
|------|----------|-----|-----------|
| 1 | 320 | 1.00 | Al-O bend |
| 2 | 395 | 1.23 | ring |
| 3 | 470 | 1.47 | ring |
| 4 | 536 | 1.68 | ring breath (strongest) |
| 5 | 680 | 2.13 | Si-O-Si |
| 6 | 736 | 2.30 | Si-O |
| 7 | 1066 | 3.33 | Si-O stretch |
| 8* | ~3600 | ~11.25 | H₂O stretch (if channel water present) |

> 📷 **[Image prompt — emerald partial spectrum]:** Horizontal bar chart, dark background. X-axis extends to r_n = 12 to accommodate the water overtone. Seven structural mode bars in deep green (1.00 to 3.33), clustered in the lower half. One isolated bar far to the right in pale blue-white at r_n ≈ 11.25, labeled "H₂O channel overtone (if present)." A dashed line separating the structural region from the water mode. The ring-breathing mode at 1.68 slightly taller/brighter to indicate it is the strongest. Title: "Emerald (Beryl) — 174 branches, selected strong modes."

**The Spectrum:** The seven structural modes span a modest 3.33:1 range with no gaps — emerald's enormous mode count means the spectrum is dense and quasi-continuous; the table above is a selection of the strongest lines from a much richer background. The ring-breathing mode at 1.68 is the crystal's heartbeat. The water overtone (when present) creates an isolated high shimmer at 11.25× — physically disconnected from all structural modes, appearing above even the Si-O stretches.

**Predicted Sound:** Rich, layered, slightly diffuse from the dense underlying mode structure. The ring-breathing mode at ratio 1.68 gives the fundamental a strong fifth-adjacent partial — warm and resonant. The Si-O stretch at 3.33 adds a clear high register bell. If channel water is included, a faint, crystalline shimmer floats at the extreme top of the spectrum. Emerald is the most complex and "inhabited" sound of the collection — a dense ecology of partials rather than a clear interval structure.

> 🔊 **[Audio prompt — emerald with ring breath]:** MIDI note D3 (146.8 Hz). Seven structural partials at: 146.8, 180.6, 215.8, 246.6, 312.7, 338.7, 489.0 Hz. Amplitude envelope: medium attack (30ms), slow decay (4 seconds). Add the water overtone as a very quiet 8th partial at 1651 Hz (11.25×), at 15% the amplitude of the fundamental. The ring-breathing mode (246.6 Hz) should be slightly louder than its neighbors. The water overtone should barely be audible — a crystalline shimmer high above the body.

> 🔊 **[Audio prompt — emerald dry vs wet channel]:** Two versions of the same note (D3, 146.8 Hz, 4-second decay): first without the water overtone (7 structural partials only), then with the water overtone added at 15% amplitude. Compare. The difference is subtle — the second version has a delicate high shimmer. This demonstrates how the chemistry of the crystal's "inhabitants" changes its sound.

---

### Topaz
*Orthorhombic — Pbnm — three axes, four mode families, balanced spectrum*

> 📷 **[Image prompt — topaz crystal]:** Photorealistic photograph of a natural blue topaz crystal, prismatic form with clear orthorhombic cross-section (not square, not hexagonal — distinctly rectangular prism). Pale sky blue, highly transparent, approximately 5cm tall. Perfect cleavage plane visible at the base. The three unequal crystal axes should be visually evident in the geometry. White background, studio lighting.

Topaz (Al₂SiO₄(F,OH)₂) is the first orthorhombic crystal in this collection — three unequal axes, all at right angles. The lower symmetry compared to cubic or hexagonal systems means more distinct mode types: Ag, B₁g, B₂g, and B₃g symmetry classes, each corresponding to vibrations that transform differently under the three 2-fold rotation axes of the orthorhombic group. With 28 atoms per cell and 84 phonon branches, the spectrum is moderately rich with a more even distribution than the highly symmetric crystals.

**Unit cell:** a = 4.65 Å, b = 8.80 Å, c = 8.39 Å (three different lengths, all 90°). 28 atoms → **84 phonon branches**.

**The math:** The four Raman-active symmetry species produce four interleaved families of modes. Unlike diamond's unified degenerate cluster or ruby's two birefringent families, topaz has four distinct polarization characters. The F and OH groups contribute both to low-frequency libration modes and to high-frequency F-H and O-H stretching modes.

**Representative Raman modes (normalized to ~152 cm⁻¹):**

| Mode | ω (cm⁻¹) | r_n | Symmetry |
|------|----------|-----|----------|
| 1 | 152 | 1.00 | Ag |
| 2 | 220 | 1.45 | B₂g |
| 3 | 290 | 1.91 | B₁g |
| 4 | 360 | 2.37 | Ag |
| 5 | 450 | 2.96 | B₃g |
| 6 | 560 | 3.68 | Ag |
| 7 | 730 | 4.80 | B₁g |
| 8 | 920 | 6.05 | Ag |

> 📷 **[Image prompt — topaz partial spectrum]:** Horizontal bar chart, dark background. X-axis: r_n from 1.0 to 7.0. Four colors for four symmetry families: gold (Ag), orange (B₁g), red-orange (B₂g), amber (B₃g). Eight bars distributed fairly evenly across the range — no obvious gaps, no obvious clusters. In contrast to the fluorite chart (which has a visible gap) and the quartz chart (which has obvious family clusters), topaz should look well-distributed and balanced. Title: "Topaz — 4 Mode Families, Balanced Distribution."

**The Spectrum:** Ratio range 1.00 to 6.05 — wider than the cubic crystals, narrower than quartz. The four mode families interleave rather than clustering — no large gaps and no tight doublets. The distribution is the most even of the collection: the eight selected modes are spread across the range with roughly equal spacing. This is the acoustic consequence of orthorhombic symmetry: enough breaking of degeneracy to separate everything, not so much as to create the extreme scatter of triclinic.

**Predicted Sound:** Balanced and complex — neither the brilliance of diamond nor the openness of quartz. The four interleaving families prevent the strong "color" of ruby's doublets or fluorite's gap. The result is a more neutral, bell-like tone with complex interval content. The orthorhombic character makes topaz the most harmonically "unpredictable" of the high-symmetry crystals — familiar enough to sound tonal, unfamiliar enough to sound strange.

> 🔊 **[Audio prompt — topaz sustained tone]:** MIDI note F3 (174.6 Hz). Eight sine-wave partials at ratios: 1.00, 1.45, 1.91, 2.37, 2.96, 3.68, 4.80, 6.05. Amplitude: decreasing smoothly with partial number (1.0, 0.85, 0.72, 0.61, 0.52, 0.44, 0.37, 0.32). Medium attack (20ms), 4-second decay. The even distribution of partials should produce a complex, bell-like tone without any single interval standing out strongly.

---

### Labradorite
*Triclinic — C-1 — no symmetry, no degeneracy, the alien spectrum*

> 📷 **[Image prompt — labradorite slab]:** Photorealistic photograph of a polished labradorite slab, approximately 15cm wide, lying flat. The surface is dark grey-black with a dramatic labradorescence: a large patch of brilliant blue shifting to gold-green at one edge, as if lit from inside. The schiller effect is the dominant visual event. Strong directional lighting from upper left to maximize the iridescence display. Museum specimen quality.

Labradorite is a calcium-sodium aluminum silicate feldspar — and crucially, it is triclinic: no perpendicular axes, no equal lengths, no equal angles. Triclinic crystals have the minimum possible symmetry — only identity and inversion remain. Every phonon mode is unique; no two modes share a symmetry relationship that would make them degenerate. The spectrum is a cloud of distinct, unrelated frequencies.

The labradorescence — the spectacular shifting blue-gold iridescence — comes not from the unit cell but from microscopic exsolution lamellae: thin alternating layers of different feldspar compositions that act as a natural diffraction grating for light. The visual beauty and the sonic character arise from completely different physical mechanisms.

**Unit cell:** a ≠ b ≠ c, α ≠ β ≠ γ ≠ 90°. Approximately 52 atoms per conventional cell → **156 phonon branches**, every one unique.

**The math:** With only inversion symmetry (space group C-1 or P-1), the dynamical matrix D(k) produces 156 distinct non-degenerate eigenvalues at every k-point. There are no symmetry-forced coincidences anywhere in the spectrum. Modes span roughly 60–1100 cm⁻¹ with no organizing principle beyond "whatever the force constants produce." Choosing a reference mode is somewhat arbitrary — the crystal has no privileged frequency.

**Selected modes from the distributed spectrum:**

| Approx. ω (cm⁻¹) | r_n |
|----------|-----|
| ~60 | 1.00 |
| ~110 | 1.83 |
| ~190 | 3.17 |
| ~280 | 4.67 |
| ~420 | 7.00 |
| ~570 | 9.50 |
| ~800 | 13.3 |
| ~1050 | 17.5 |

> 📷 **[Image prompt — labradorite partial spectrum]:** Horizontal bar chart, dark background. X-axis extends to r_n = 18 — the widest of all eight charts. Many thin bars (representing denser mode population) scattered irregularly across the range. No clear clusters, no clear gaps, no color families — all bars in a shifting blue-to-gold gradient to echo the labradorescence. Selected strong modes labeled. A contrast note in small text: "Compare to diamond — 4 modes in range 1.0–1.65." Title: "Labradorite — 156 Unique Modes."

**The Spectrum:** The ratio range of approximately 17.5:1 spans more than four octaves above the fundamental. No two modes are symmetry-related — no doublets, no families, no gaps caused by physics (only by the random distribution of force constants across the triclinic lattice). This is not disorder — it is the fully ordered vibrational state of a complex triclinic crystal. It is maximally differentiated: every partial is an individual.

**Predicted Sound:** Deeply inharmonic and alien. No recognizable interval structure. The wide range (four-plus octaves of partials above the fundamental) makes the sound expansive and bell-like, but the intervals between partials follow no pattern the ear can latch onto. This is the acoustic analog of the labradorescence: light (or sound) scattered in all directions by the absence of a simple organizing symmetry. The most honest test of the project's core hypothesis — that symmetry determines sonic character — because labradorite is the proof by negation.

> 🔊 **[Audio prompt — labradorite sustained tone]:** MIDI note A2 (110 Hz). Eight selected partials at: 110, 201.3, 348.7, 513.7, 770, 1045, 1463, 1925 Hz. Amplitude: fundamental at 1.0, each subsequent partial at 70% of previous (higher partials are quieter, as the mode density thins). Long attack (80ms), very long decay (6 seconds). No reverb. The inharmonic interval structure should be immediately apparent — this does not resolve into any familiar chord or interval. Bell-like but alien.

> 🔊 **[Audio prompt — symmetry arc comparison]:** A single demonstration audio piece. Same MIDI note (A3, 220 Hz), same decay envelope (strike, 4-second exponential decay). Crystals played in sequence with 1-second gaps: diamond → ruby → fluorite → topaz → labradorite. The progression from maximum symmetry to minimum symmetry should be audible as a progressive move from dense/compressed/bright → shimmering/structured → hollow/gapped → balanced/complex → alien/inharmonic.

---

### Obsidian
*Amorphous — no lattice, no unit cell, no phonon dispersion — the boundary case*

> 📷 **[Image prompt — obsidian]:** Photorealistic photograph of two pieces of obsidian: one large piece showing the characteristic conchoidal fracture surface (smooth, shell-like curve of the break — the same surface used to make obsidian blades), one smaller piece with a natural edge showing the glass-like transparency in thin sections, pale amber-black. Both pieces on light grey stone. The fracture surface should catch the light dramatically, showing that obsidian has no cleavage — no crystal planes to cleave along — only random fracture.

Obsidian is volcanic glass — a supercooled SiO₂-rich melt that froze before crystals could form. No long-range periodicity. No unit cell. No space group. No phonon dispersion relation. Not a crystal.

Including obsidian is a philosophical act. It demonstrates what the Crystal Synthesizer produces when there is no crystal to read.

**The math:** Without long-range order, there is no phonon dispersion curve ω(k). Instead, amorphous solids are described by a **vibrational density of states (VDOS)** — a continuous function g(ω) giving the density of vibrational modes at each frequency:

$$g(\omega) = \frac{1}{3N}\sum_n \delta(\omega - \omega_n)$$

For obsidian (volcanic glass, primarily SiO₂), g(ω) has broad peaks around ~400 cm⁻¹ and ~1000 cm⁻¹ with no discrete lines — a smeared version of the quartz spectrum, structure destroyed by the absence of periodicity.

**Sonification:** There are no discrete partials. Instead: filtered noise whose spectral envelope matches g(ω). Two broad noise bands, shaped by the glass's amorphous chemistry. The "MIDI note" can shift the center frequency of the filter envelope, but there is no fundamental, no ratios, no intervals.

> 📷 **[Image prompt — obsidian VDOS comparison]:** Two-panel diagram side by side on dark background. Left panel: sharp vertical lines at precise frequencies — labeled "Quartz α-SiO₂: discrete phonon modes." Right panel: the same frequency axis, but the sharp lines replaced by broad overlapping Gaussian bumps at similar frequency regions — labeled "Obsidian (volcanic glass): vibrational density of states — continuous, no discrete modes." The visual contrast shows what long-range order does to a vibrational spectrum. Title: "The Effect of Crystalline Order."

**The Spectrum:** Not a spectrum of discrete partials — a continuous spectral density. The concept of "ratios" does not apply. Obsidian is the limit of the instrument's logic: as symmetry goes to zero, the discrete partial structure dissolves into noise.

**Predicted Sound:** Dark, dense, shaped noise. Not pitched — textural. The two broad VDOS peaks add some spectral coloration (not flat white noise, but noise with a volcanic glass "timbre"). Obsidian in the Crystal Synthesizer is a memento mori for the concept of crystalline order — or a demonstration that the instrument's beauty depends entirely on the periodicity it reads. It sounds like what a crystal would be if the atoms forgot their positions.

> 🔊 **[Audio prompt — obsidian noise]:** Generate band-limited noise (not white — shaped noise). Apply two broad bandpass filters: center ~400 Hz (Q = 1.5, corresponding to the low-frequency VDOS peak of amorphous silica) and center ~1000 Hz (Q = 2.0, corresponding to the Si-O stretching VDOS peak). A MIDI note A3 sets the filter centers proportionally (multiply both centers by f_MIDI/440). Strike envelope: fast attack (3ms), long exponential decay (5 seconds). The result should be percussive, dark, non-pitched noise — recognizably different from any crystal tone.

> 🔊 **[Audio prompt — crystal to glass transition]:** Amethyst/quartz partials (9 discrete sine waves, A3 = 220 Hz), full 5-second sustain. Then a crossfade over 3 seconds: discrete sine-wave partials slowly replaced by shaped noise matching the obsidian VDOS profile. The partials dissolve into noise — crystalline order dissolving into glass. The physical process (cooling too fast to crystallize) made audible in sound.

---

## Comparative Spectrum — All Eight Crystals

> 📷 **[Image prompt — comparative partial chart]:** Large horizontal bar chart on dark background. Y-axis: eight crystal names (Diamond at top, Obsidian at bottom). X-axis: r_n from 1.0 to 18.0 on a logarithmic scale. Each crystal's modes shown as small glowing dots or short vertical ticks at their ratio positions. Color per crystal: diamond=white, ruby=deep red, amethyst=violet, fluorite=purple-green, emerald=deep green, topaz=sky blue, labradorite=shifting blue-gold gradient, obsidian=represented as a grey shaded band (not discrete dots). The dramatic difference in mode density and span between diamond (tight cluster, 4 positions, far left) and labradorite (many positions across entire width) should be the dominant visual impression. Title: "Crystal Sonic Palette — Comparative Partial Ratios."

> 🔊 **[Audio prompt — full palette demonstration]:** A single demonstration audio file, 90 seconds total. For each of the seven crystalline minerals (not obsidian), play the same MIDI note (A3, 220 Hz), strike envelope, 4-second decay, 1-second gap. Order: diamond → fluorite → ruby → amethyst → emerald → topaz → labradorite. Then a final 10 seconds: obsidian noise at approximately the same pitch center. A musical demonstration of the symmetry arc from maximum to zero. Could serve as the opening audio demonstration for any Loudon Live session using this material.

---

## Creative Mapping in Practice

Three demonstrations of how the four mapping parameters transform the same crystal.

> 🔊 **[Audio prompt — span comparison, Ruby]:** Ruby partial table (7 partials). MIDI note A3, 220 Hz. Three versions of the same note played in sequence (1-second gaps): (1) output span = 1 octave — all partials compressed between 220 and 440 Hz; (2) output span = 2 octaves — partials spread to 880 Hz; (3) output span = 4 octaves — partials stretched to 3520 Hz. Same crystal physics, three different spatial experiences. The birefringent doublets should be audible in all three but move outward as span increases.

> 🔊 **[Audio prompt — α sweep, Diamond]:** Diamond partial ratios (1.00, 1.32, 1.48, 1.57, 1.65). MIDI note G3, 196 Hz. Output span = 3 octaves fixed. Three versions: (1) α = 0.4 — partials compressed toward root, dense cluster; (2) α = 1.0 — linear, physics as-is; (3) α = 2.5 — partials stretched, wide bell-like spacing. The same four frequencies, distributed three different ways. Demonstrates that the crystal's ratio structure and the mapping function are completely independent.

> 🔊 **[Audio prompt — root mode reassignment, Amethyst]:** Quartz partial set (ratios: 1.00, 1.62, 2.07, 2.77, 3.13, 3.63, 5.45, 6.21, 8.32). MIDI note A3. Version 1: root = mode 1 (128 cm⁻¹) — all other ratios as listed. Version 2: root = mode 6 (464 cm⁻¹, the strongest Raman line) — all other ratios recalculated relative to this mode. The strongest mode becomes the fundamental, and everything below it becomes sub-harmonics or very low partials. A completely different tonal character from the same crystal physics.

---

*This document is a companion to [[Crystal Synthesizer]] and [[Crystal Synthesizer — Staging]]. Image prompts are intended for generation with any image AI (Midjourney, DALL-E, Stable Diffusion). Audio prompts are intended for implementation in Gen~ or RNBO as part of Stage 1 development, or for rapid prototyping in any synthesis environment.*

---

## Asset Production Plan
*Decisions recorded 2026-04-11 — ready to execute in the next session.*

This document contains three distinct asset types. Each has a different generation strategy and a different verification method. All decisions below are confirmed.

---

### Asset Type A — Scientific Charts (~10 assets)

**What they are:** Partial spectrum charts (one per crystal), the comparative all-eight chart, the mapping function α curves (three curves, one graph), and the VDOS comparison panel (quartz vs. obsidian).

**Generation method: Python + matplotlib, computed directly from the ratio tables in this document.**

These are not AI-generated. The plot *is* the math — bars are placed at the exact r_n values from the tables, colors match the mode family labels, axis ranges are set to the values specified in each image prompt. No inference, no prompt interpretation. Mathematically exact by construction.

**Verification:** Code review only. The script that generates the chart is the ground truth — if the ratio values in the script match the tables in this document, the chart is correct. Each chart script will include a printed verification table: `mode name | ω (cm⁻¹) | r_n (source) | r_n (plotted) | match`.

**Output format:** PNG, dark background, wide format where indicated. Saved to `Projects/Crystal Synthesizer/charts/`.

#### Chart orientation decision — 2026-04-12

Initial generation (v1) used a **horizontal bar format**: each mode on its own row, bar length = ratio value. This was immediately confusing for musicians — it reads like a table, not a spectrum.

Regenerated (v2, current) as **upright spectrum orientation**: ratio on X-axis, amplitude on Y-axis, vertical bars rising from zero. This is the natural orientation for anyone who has used a spectrum analyzer or looked at a harmonic partial display in an additive synth. The music-physics connection is legible at a glance. A secondary top axis labels each partial's nearest interval name (root, P4, P5, m6, etc.) so musicians can immediately hear the structure.

The original horizontal-bar files have been deleted. All current charts use the spectrum orientation.

---

### Asset Type B — Audio Examples (~20+ assets)

**What they are:** All `🔊 [Audio prompt —...]` blocks in this document — sustained tones, decay envelopes, parameter sweeps, crystal comparisons, the symmetry arc demonstration, and the crystal-to-glass crossfade.

**Generation method: Python + numpy additive synthesis.**

Each audio file is built by summing sine waves at the exact frequencies, amplitudes, and envelopes specified in the prompt. No synthesis approximation. Envelope shapes (attack/decay) are implemented as numpy arrays multiplied sample-by-sample. The shaped noise for obsidian uses scipy bandpass filters at the specified center frequencies and Q values.

**Format: WAV, 48 kHz, 32-bit float** (confirmed).

**Verification: FFT peak analysis on every output file.** After generating each WAV, a numpy FFT is run on the audio. The detected frequency peaks are compared to the expected partial frequencies. A verification report is printed and saved alongside each audio file:

```
[diamond_sustained_G3.wav — VERIFICATION]
Expected partials (Hz): 196.0, 258.7, 289.8, 307.7, 323.4
Detected peaks (Hz):    196.0, 258.7, 289.8, 307.7, 323.4
Max error: 0.02 Hz  ✓ PASS
```

The tolerance threshold is 0.5 Hz at any pitch. Files that fail verification are flagged and not delivered.

**Output:** Saved to `Projects/Crystal Synthesizer/audio/`. Filename convention: `[crystal]_[descriptor]_[MIDI-note].wav` — e.g. `diamond_sustained_G3.wav`, `ruby_vs_diamond_comparison_A3.wav`.

---

### Asset Type C — Photorealistic Crystal Images (~9 assets)

**What they are:** The hero group shot, the eight individual crystal photographs, and the instrument panel illustration.

**Generation method: FLUX.2-dev via HuggingFace** (confirmed — will attempt generation via the HF MCP connected in this workspace. FLUX.2-dev is the current state of the art for photorealistic still-life photography and was released November 2025).

**Verification:** Visual inspection against the prompt specification. No mathematical check is possible for photorealistic images. Each generated image will be reviewed against: correct crystal species, correct form (octahedral/prismatic/etc.), correct color, correct lighting direction (upper left or upper right as specified), correct background. Regenerate if any of these fail.

**Note on the scientific diagram prompts** (transposition concept infographic, parameter sweep instrument panel): These contain mathematical content (axis labels, ratio numbers, knob ranges). For these, the Python chart pipeline (Type A) is preferred over AI image generation — they will be generated programmatically to guarantee the numbers are correct. The AI image prompts for these serve as layout/style references only.

**Output:** Saved to `Projects/Crystal Synthesizer/images/`.

---

### Execution Order

1. **Start with Type A (charts)** — fastest, fully deterministic, establishes that all ratio math is confirmed before audio is built on top of it.
2. **Then Type B (audio)** — builds on the verified ratio tables. The FFT verification closes the loop between physics → ratios → synthesis → confirmed output.
3. **Then Type C (images)** — aesthetic, iterative, requires HF API calls. Run last so it doesn't block the math-critical work.

### Tools Required

| Task | Tool | Notes |
|------|------|-------|
| Charts | Python, matplotlib, numpy | All available in session sandbox |
| Audio synthesis | Python, numpy, scipy | All available in session sandbox |
| Audio verification | numpy.fft, scipy.signal | Built-in to same pipeline |
| Crystal images | HuggingFace FLUX.2-dev space | Via HF MCP (connected) |
| File output | Write to `Projects/Crystal Synthesizer/` | Palace path confirmed |

### Production Status

| Type | Status | Notes |
|------|--------|-------|
| A — Charts | ✅ Complete (2026-04-12) | 10 charts, all ratios verified, spectrum orientation |
| B — Audio | ⬜ Ready to begin | Ratio tables confirmed by Type A |
| C — Images | ⬜ Pending | Requires HF MCP, run after B |

### Resuming This Work

**Type A is complete.** To continue with Type B: open a new Cowork session with The Palace folder selected. Say: *"Continue the Crystal Sonification asset production — move on to audio."* The audio prompts are all the `🔊 [Audio prompt —...]` blocks above. Build in the order listed in each crystal's section — sustained tones first, then comparisons and sweeps.
