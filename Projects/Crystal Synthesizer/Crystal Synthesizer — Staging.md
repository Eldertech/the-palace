---
title: Crystal Synthesizer — Staging
born: 2026-04-21
loudon-live-status: planning
links:
  - target: "[[Crystal Synthesizer]]"
    type: connects-to
    label: staging-of
  - target: "[[Bessel Functions in Synthesis]]"
    type: connects-to
  - target: "[[Loudon Live]]"
    type: connects-to
forward_vector: I hold the Loudon Live staging plan for Crystal Synthesizer — the stage-by-stage path from concept to taught session — so the parent project's steward can advance presentation readiness without re-deriving the arc.
---

# Crystal Synthesizer — Staging

Someone reading this file and [[Crystal Synthesizer]] has everything needed to build and present every stage.

---

## Alignment Record
*Decisions reached in Phase 2 dialogue. Reference before any development session.*

| Decision | Choice |
|---|---|
| Implementation environment | Gen~ inside RNBO. Gen~ for DSP; RNBO for portability. |
| Stage 1 scope | Monophonic crystal partial selector — playable Max synthesizer |
| Epistemic frame | **Hypothesis-testing throughout.** Timbral descriptions are predictions, not facts. The instrument is the instrument of verification. |
| Session arc ratio | 70% making / 30% framing. Framing is HTML-led, not lecture. |
| Cross-domain anchor | "One structure, many projections" — same phonon mode ratios travel from Gen~ to RNBO to H90 to Faust, just as the same crystal symmetry generates both optical and acoustic properties. |
| Interface arc | Progressive across stages: functional → portable → serious → visual → physical |
| Audience | Autodidact Polymaths — DAW-fluent music producers, maker sensibility, no physics required |
| Stage 5 confirmed | Full physical model with real crystallographic database input |

---

## The Arc

The full project is the scientific method made audible:

| Stage | DSP | Interface | Question answered |
|---|---|---|---|
| 1 | Monophonic Gen~ partial bank | Functional Max patch | Do our timbral hypotheses hold? |
| 2 | Polyphonic + RNBO wrap | H90 hardware / Faust | Does the same structure travel? |
| 3 | Modal Crystal — resonant filters + decay | Interface begins in earnest | What does decay add to the physics? |
| 4 | Dispersion filter | Full VST with crystal visualization | What does the prism-in-time look and sound like? |
| 5 | Full physical model | Real crystallographic database input | What does this specific mineral actually sound like? |

---

## Stage 1: Monophonic Crystal Synthesizer
*[[Loudon Live]] Session — estimated 75–90 minutes*

### Session Arc

**Framing (≈20 min) — HTML-led**

Open `Projects/Crystal Synthesizer/session-1-interactive.html` on stream. Three beats:

1. *The optical fact* — rotating crystal dispersing white light. "Crystals don't create color — they reveal what's already there. The geometry determines which frequencies go where."
2. *The pivot question* — "If we move from light to sound, what would a crystal do?" Show the basic math: THz phonon modes scaled into audio Hz. The dispersion curve shape before anyone builds anything.
3. *The hypotheses* — all 7 Bravais lattice systems, each prediction explicitly labeled **hypothesis**. "Let's build the instrument and find out if we're right."

The HTML asks, it doesn't explain. Students arrive at the patch with a question.

**Making (≈55 min) — Gen~ inside Max**

Build sequence:
1. Single cubic mode — one partial, scaled into audio. Verify sound flows.
2. Full cubic partial bank — 3–6 partials, ratio-locked by crystal symmetry. Test hypothesis: does cubic sound thick and bright?
3. Swap to hexagonal — different ratios, different character. Compare directly.
4. Swap to triclinic — inharmonic scattered partials. Does it feel chaotic?
5. Add ADSR envelope — gate the output. Now it's playable.
6. Test all 7 lattice systems — play the same pitch through each. Take notes.

*What students build:* a working monophonic Max synthesizer whose timbre is determined by crystal physics, not design choice.

### Hilaritas Checklist
- [x] **Real thing to make** — working Gen~ partial bank, different timbres per lattice system, resistance in getting frequency scaling right
- [x] **Tool that extends** — Gen~ inside Max, at or just past the edge of most producers' current capability
- [x] **Cross-domain moment** — the moment a different lattice system sounds meaningfully different. "The geometry of the unit cell is audible."
- [x] **Reflecting surface** — see below

### Reflecting Surface
> *"You built an instrument whose timbre was chosen by physics, not by you. Did the cubic hypothesis hold? And — where in your music-making do you currently make choices that could be handed to a system like this? Would you want to?"*

### Prerequisites

Students need: basic Max/MSP fluency, some additive synthesis exposure, Gen~ installed.

*AI catch-up prompt:*
> "I'm learning to build synthesizers in Max/MSP using Gen~. Explain what Gen~ is, how it differs from regular Max patching, and walk me through building a simple additive oscillator bank with 4 partials at fixed frequency ratios. Assume I know Max basics but haven't used Gen~ before."

Prior [[Loudon Live]] prerequisite: none for Stage 1.

### Materials
- [`session-1-interactive.html`](Crystal%20Synthesizer/session-1-interactive.html) — HTML framing artifact
- [`session-1-implementation.md`](Crystal%20Synthesizer/session-1-implementation.md) — Gen~ patch architecture, pseudocode, mode ratio tables

---

## Stage 2: Polyphonic + Portability
*[[Loudon Live]] Session — estimated 75–90 minutes*
*Status: planned, not yet developed*

### Scope

Take the Stage 1 monophonic Gen~ patch:
- Make it polyphonic (voice allocation in Max)
- Wrap it in RNBO
- Export to Eventide H90 preset
- Introduce the Faust path

### Cross-domain moment
RNBO → H90 → Faust mirrors the crystal insight itself: same underlying structure, multiple material projections. This is "one structure, many projections" made explicit in the toolchain.

### Hilaritas checklist (draft)
- [ ] Real thing to make — a polyphonic instrument that runs on hardware
- [ ] Tool that extends — RNBO export, likely new territory for most of the audience
- [ ] Cross-domain moment — the portability path as structural parallel to crystal symmetry
- [ ] Reflecting surface — to be determined in Stage 2 development session

---

## Stage 3: Modal Crystal
*Status: planned, not yet developed*

### Scope

Each phonon mode becomes a resonant filter with physics-derived Q (from mode lifetime). Broadband impulse excitation → modes ring down with characteristic decay times. This is the first stage where decay becomes a primary parameter, not an afterthought.

Interface development begins here in earnest. The performance gesture question becomes urgent: what is the physical action that "strikes" the crystal? How does the performer control direction, excitation pattern, crystal selection?

### Notes for development
- Q-factor derivation from anharmonic decay rate — see [[Bessel Functions in Synthesis]] entry as preparation
- The Stage 3 interface is the first place where the "3D rotating wireframe" visual from the entry's interface note becomes buildable
- Prerequisite [[Loudon Live]]: Stage 2

---

## Stage 4: Dispersion Filter + VST
*Status: planned, not yet developed*

### Scope

Frequency-dependent delay derived from the actual phonon dispersion relation. Each frequency component travels at a different speed through the "crystal" — separation in time, like a prism separates in space. This is not metaphor: it is the same physics in different materials.

Full VST plugin with a sophisticated interface that shows crystals — the optical-sonic bridge made visible. The rotating wireframe visualization from the entry becomes the primary UI surface.

### Notes for development
- The dispersion filter is the closest Stage to the optical-sonic bridge metaphor — the most teachable version of "same physics, different material"
- Interface scope is the largest of any stage — warrants its own design session before development begins
- Prerequisite [[Loudon Live]]: Stage 3

---

## Stage 5: Full Physical Model (Stretch Goal)
*Status: concept, not yet planned*

### Scope

The complete physical simulation: real crystallographic database input (Crystallography Open Database or ICSD), actual phonon mode structure for a chosen mineral, full anharmonic coupling between modes.

The instrument imports a real crystal's data and produces the sound that crystal would make. Stage 1 asked "what do we think a crystal would sound like?" Stage 5 answers: exactly this.

### Notes for development
- Crystallography Open Database (COD) is open access and machine-readable — viable data source
- The hypothesis arc is completed: the predictions made in Stage 1 are verified or corrected by ground-truth data in Stage 5
- This stage may require a physics collaborator or deeper literature review — flag for future planning
- Interface: real mineral selector (by name, by space group, by optical property) feeding a visualization of the actual crystal structure

---

## Open Questions Across Stages

From the palace entry — to be answered as stages develop:

- How do you auralize a phonon dispersion curve directly? Is the dispersion relation itself a "timbre" parameter? *(most relevant to Stage 3–4)*
- Can you map anharmonic mode coupling into real-time parameter modulation? *(Stage 3)*
- Do crystals with high optical birefringence also have pronounced acoustic anisotropy? *(empirical test, Stage 1 onward)*
- The triclinic hypothesis is the least certain. What do we actually hear? *(Stage 1)*
- What is the performance gesture? *(Stage 3)*
