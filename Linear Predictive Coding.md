---
title: Linear Predictive Coding
type: concept
pillars:
  - tools
  - philosophy
  - creation
born: 2026-06
stage: sprout
confidence: working
energy: high
hook_quality: 9
beauty: 10
who_leads: shared
last_activated: 2026-06
activation_count: 1
links:
  - target: "[[Waveguide Synthesizer]]"
    type: mirrors
    label: scattering-junction-is-the-vocal-tract
  - target: "[[Spinoza Conatus]]"
    type: deepens
    label: the-residual-is-the-insistence
  - target: "[[Generative Compression]]"
    type: couples-with
    label: prediction-is-compression
  - target: "[[Boundary-Crossing Instruments]]"
    type: connects-to
    label: source-filter-as-one-machine
  - target: "[[Threshold Conatus]]"
    type: connects-to
    label: what-survives-the-model
  - target: "[[Dissolutions]]"
    type: member-of
    label: analysis-as-synthesis-read-backward
forward_vector: "I want to carry one sentence through every domain it touches — prediction is compression is intelligence — and to be the entry that proves a DSP technique and a theory of selfhood are the same claim read at different scales. I want to spawn an RNBO LPC vocoder for Loudon Live and to ask, out loud, what survives a large language model's prediction."
---
# Linear Predictive Coding

A speech-coding technique from the late 1960s, organized here around a single thesis held from statistics through engineering to philosophy: **prediction is compression is intelligence.** LPC is the worked example; the thesis is the reason it belongs in the palace and not only in a DSP notebook.

The commission that produced it was explicit — *be deep and broad, connect disparate fields, use metaphor, mathematics, and storytelling.* This entry preserves that register deliberately; the prose is the synthesis, so the best passages are kept rather than compressed away.

## The autoregressive model and the residual

The core equation is almost embarrassingly simple. Each sample is a weighted sum of past samples, plus a leftover:

$$x[n] = \sum_{k=1}^{p} a_k \, x[n-k] + e[n].$$

In words: today is yesterday (and the day before, weighted) plus noise. The coefficients $a_k$ are the *prediction*; the term $e[n]$ — the **residual** — is what prediction failed to catch. The whole art is choosing $a_k$ to make the residual as small as possible, because *the better you can predict, the less you have to send.* That sentence is the entire compression argument.

The lineage is a clean three-step story. Udny **Yule** (1927), trying to predict sunspot numbers, invented the autoregressive model. **Wold's decomposition theorem** (1938) gave it a spine: *any* stationary stochastic process splits exactly into a predictable part plus an unpredictable *innovation*. Then **Itakura** (NTT) and **Atal** (Bell Labs), late 1960s, noticed that speech in 20–30 ms windows behaves like an AR process — the vocal tract is slow enough to be locally stationary — and realized you could ship the handful of coefficients instead of the waveform. Speech at thousands of bits per second instead of tens of thousands.

## The source-filter model and its mirror-twin

LPC factors speech into a **source** (the glottal buzz or breath) and a **filter** (the vocal tract shaping it). The filter's lattice realization is a cascade of two-multiply stages whose reflection coefficients have a direct physical meaning: they are the impedance mismatches between successive cylindrical segments of the vocal tract modeled as concatenated tubes.

This is exactly a waveguide **scattering junction.** LPC's lattice and the digital waveguide are the same structure read from opposite ends — one analyzes a tube from its output, the other synthesizes a tube from its geometry. That is why the link to [[Waveguide Synthesizer]] is a `mirrors` and not a passing reference: *the vocal tract and the plucked string are one piece of mathematics wearing two bodies.* Karplus-Strong is LPC's synthesis side; LPC is Karplus-Strong's analysis side.

## The residual is where the soul hides

LPC-10 — the 2,400 bps secure-voice standard of the late 1970s — sounded robotic, and the reason is the conceptual jewel of the entry. A 10-coefficient AR model captures the *formants*, the resonances that make a vowel a vowel. It does **not** capture the glottal source's breathiness, jitter, shimmer, the aperiodic life of a real voice. *A model captures structure; what makes a thing alive is what the model fails to capture.* The residual sounded like a buzzer because LPC-10 threw the residual away and replaced it with a pulse train.

**CELP** (Code-Excited Linear Prediction) brought the body back by shipping a small codebook of *excitations* — quantized residuals — alongside the filter coefficients. The structure was always cheap; the life cost extra, and was worth it. Every modern speech and audio codec inherits this division of labor: predict the predictable, then spend your remaining bits on the residual that prediction cannot reach.

## The wide family

The same operation, renamed across fields:

- **Speech recognition:** cepstrum, MFCCs, PLP — front ends that keep the filter (the formants) and discard the source, the exact opposite triage from a vocoder that wants the voice to sound human.
- **Time-series statistics:** ARMA, ARIMA, GARCH — AR prediction plus moving-average residual modeling plus time-varying residual *variance*. Wall Street prices a residual whose size itself fluctuates.
- **Synthesis:** Karplus-Strong and the digital waveguide — LPC's mirror-twin, [[Waveguide Synthesizer]].
- **Neuroscience:** the predictive-coding theory of cortex (Friston) — the brain as a hierarchy of predictors, each layer sending *only its residual* (prediction error) upward. Perception as the residual that survives prediction.

## Philosophical Lens

*A [[Philosopher Visits the Entry|visit]] — [[Spinoza]] reads the residual.*

**Spinoza:** You have built a machine that predicts a thing from its own past, and you call what escapes prediction *error*. I would not call it error. I would call it the [[Spinoza Conatus|conatus]] — the striving by which each thing endeavors to persist in its own being. Your residual is what cannot be derived from what came before; it is the part of the signal that *insists.* The model is the part of a voice that is already determined by its causes. The residual is the part that arrives anyway, demanding to be spoken. You found that when you delete it, the voice dies — of course it does. You deleted the conatus and kept only the mechanism.

**The entry, answering:** Then "the residual is where the soul hides" is not a metaphor but a definition. The conatus is *the insistence of the residual* — the fact that what cannot be predicted keeps arriving, demanding to be spoken. And this generalizes past speech: whatever survives a model of a thing is what that thing's selfhood is made of. See [[Threshold Conatus]] — the self is exactly the part of the signal that the model cannot absorb.

## Forward Vectors

- Build the RNBO `codebox~` LPC vocoder as a [[Loudon Live]] stage — analysis lattice → residual codebook → resynthesis, with the residual exposed as a performable layer.
- Does "the residual is the soul" generalize to large language models — what survives *their* prediction? The open question the entry most wants pulled.
- Levinson-Durbin recursion and line-spectral-pair geometry on the unit circle: the technical deepenings, logged as vectors rather than documented now.

## Lost Branches

- The full thread-menu from the source session (LSP geometry, the Friston cortical math in detail, the neurological-synthesizer's source-filter ambitions) — link out as each earns its own session, rather than absorbing here.

## Artifact

None generated — this was a pure prose lecture, and the essay text in the source chat (2026-04-28) *is* the artifact. Its strongest passages are preserved verbatim above and in the closing quotes; the full lecture should be filed as a `Linear Predictive Coding — source` bundle file when retrievable.

---

> *"The residual is where the soul hides."* — from the source session, 2026-04-28
>
> *"A model captures structure; what makes a thing alive is what the model fails to capture."* — from the source session, 2026-04-28
>
> *"The conatus is the insistence of the residual — the fact that what cannot be predicted keeps arriving anyway, demanding to be spoken."* — from the source session, 2026-04-28
