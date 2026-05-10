---
title: "Compressor Design — three pedagogical moments"
type: proof
project: "[[Compressor Design]]"
date: 2026-05-04
medium: text
forward_vector_alignment: "the entry that captures not just what the compressor does but why every design choice was made to make the invisible visible"
---

# Three pedagogical moments — the teaching beats

A first pass at the retrospective the project is asking for. Three moments where students reportedly *heard* something they had previously only known about. Captured here as the seeds of a longer pedagogical document.

---

## Moment 1 — the 500-sample window as time you can feel

**Setup.** The compressor's RMS detector window is exposed as a knob. We start at 1024 samples (~23 ms at 44.1 kHz) — a "normal" RMS time. The compression sounds smooth and natural.

**The move.** I drop the window to 32 samples (~0.7 ms) without changing anything else. Suddenly the compressor sounds *clicky*, almost ring-modulated. The RMS detector is now responding to the audio's instantaneous waveform, not its overall energy.

**What happens in students.** Eyes widen. "Wait, I can hear the window." The 500-sample reference point arrives a beat later — at 500 samples (~11 ms) the sound is in between: slightly grainy on transients, otherwise smooth. They can hear *time itself as a knob*.

**Why this lands.** They've spent semesters being told that RMS smooths things over a window. The window has been an abstract parameter. Hearing the window's *length* directly — as the difference between musical and clicky — collapses the abstraction. The window is not a number; it's a duration of attention.

---

## Moment 2 — attack and release as desire and reluctance

**Setup.** I run a kick drum through the compressor with attack=0ms, release=10ms. The kick gets crushed flat. Sounds bad. Then attack=10ms, release=200ms. The kick has body again but the sustain is squashed.

**The move.** I anthropomorphize. Attack is *how reluctant the compressor is to grab the sound* — short attack means it lunges; long attack means it lets the transient through before reacting. Release is *how reluctant it is to let go* — short release means it's anxious to return to unity gain; long release means it stays squashed.

**What happens in students.** They start hearing reluctance in the gain reduction meter. One student described it as "the compressor remembering how scared it is of loud things." That's not technical language but it's perfect: the meter's behavior *is* a memory of fear.

**Why this lands.** Compression is normally taught as four numbers (threshold, ratio, attack, release). Attack and release become *temperaments* of the compressor — its personality across time — and the meter becomes a window into that temperament. The technical abstraction acquires a body.

---

## Moment 3 — the sidechain as the conductor

**Setup.** A typical mix bus compressor on drums. Now we add a sidechain HPF at 80Hz: the compressor stops responding to the kick fundamental and starts responding to everything above it.

**The move.** Solo the sidechain key signal. Students hear *what the compressor is listening to*. It's a different drum performance — one without kicks, dominated by snare and hi-hat. Then I un-solo. The whole mix sounds different now, even though only the *listening* changed.

**What happens in students.** Repeated phrase: "Oh — *that's* what it heard." There's a crucial conceptual move here from "the compressor responds to loud things" to "the compressor responds to *what we tell it to listen to*." The sidechain is no longer a feature but a *steering input*.

**Why this lands.** Compression is often taught as automatic — the compressor "decides" when to clamp down. Soloing the key signal exposes the conductor: someone (the engineer, via filter and threshold) is telling the compressor *what counts as loud*. The decision-making becomes visible, which means students can start making their own decisions deliberately.

---

## What this proof is and isn't

**Is:** three teaching beats with the structure I want for the full retrospective — *setup → move → student response → why-this-lands*. Each is short enough to drop into a longer document.

**Isn't:** complete. The forward vector calls for *evidence* — student quotes, captured moments, before/after demonstrations. These three are reconstructed from memory; the next move is to record (or capture in writing) actual moments from the next time this material runs in a class, with permission.

## Next concrete step

Run the lesson with one student or small group. Record the audio of the room (with consent) at the 500-sample-window moment. Transcribe what they actually said. The retrospective lives or dies on whether the student responses survive contact with reality.
