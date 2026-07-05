---
title: "AKWF fit-test — driving a single-cycle pack through the question tree"
born: 2026-06-23
links:
  - target: "[[Generative Wavetable Libraries]]"
    type: connects-to
    label: proof-of
forward_vector: "I am the AKWF fit-test — a single-cycle pack driven through the question tree to prove the interview shape holds."
---

# AKWF fit-test — branch 1.b through the question tree

The grant was: *drive an AKWF single-cycle pack through the question tree; tests branch 1.b + captured-audio defaults; biggest fit-test.* This is that test. The pack is the same six AKWF cycles from `../source-cycles/`; the wavetable is the same one `pack_wavetable.py` produces — what's new is the **interview** wrapped around it. The question is whether the captured-audio branch of the tree can hand a real user an Ableton-ready table with one decision and three defaults.

## The question tree (proposed canonical form)

The wavetable interview lives in a single tree. Each level offers ≤3 named options. Captured-audio defaults sit on branch 1.b — they are what Claude proposes if the user just says "go."

```
Q1  Where do the partials come from?
    1.a  Algorithmic synthesis        → bell, crystal, Shepard, …  (Phase 1 path)
    1.b  Captured audio               → a folder of single-cycle WAVs you already have ← THIS RUN
    1.c  AI-generated                 → VAE / diffusion over a corpus      (Phase 4)

  ─── if 1.b ─────────────────────────────────────────────────────────────
  Q2  Pack as-is, or curate first?
      2.a  Pack the whole folder, you sort later                          ← DEFAULT
      2.b  Cluster by feature first, you pick which cluster to pack
      2.c  Hand-pick the frames yourself

  Q3  What does the Position knob mean?
      3.a  Dull → bright (spectral centroid)                              ← DEFAULT
      3.b  Sparse → dense (spectral flatness)
      3.c  Nearest-neighbor walk in (centroid, flatness)
           (on AKWF-shaped libraries these collapse to the same order —
            see ../BUILD.md § "The ordering finding")

  Q4  Target synth?
      4.a  Ableton Wavetable  (1024-sample frames, plain WAV)             ← DEFAULT
      4.b  Serum / Vital / Surge XT  (2048-sample frames, CLM chunk)
      4.c  Both
```

If the user answers Q1 with **1.b** and nothing else, the interview takes **2.a · 3.a · 4.a** and renders. That is the *captured-audio default path* — three implicit answers behind one explicit one.

## The dialogue (this run)

> **Claude:** Where should the partials come from for this wavetable?
> *(a) algorithmic synthesis · (b) captured audio you already have · (c) AI-generated.*
>
> **User:** (b) — point me at `source-cycles/`.
>
> **Claude:** That folder has six AKWF cycles. I'm going to pack the whole folder, order frames dull-to-bright by spectral centroid, and write an Ableton-format WAV — those are the captured-audio defaults. Override any of the three?
>
> **User:** No, go.
>
> **Claude:** Building.

The whole exchange is **two user turns and one default acknowledgement**. That is the fit-test the grant asked for: can branch 1.b carry a real run end-to-end without the interview ballooning into the bell-mock's six-turn dialogue? Yes — because the captured-audio answers are universal where the algorithmic-synthesis answers are sound-specific.

## What got rendered

The packer was called exactly as the dialogue describes:

```
python3 pack_wavetable.py source-cycles --output-dir fit-test-2026-06-23
```

Output: **`akwf_fit_test_6frame_ableton.wav`** in this folder — 6 frames, 1024 samples each, mono 16-bit @ 44.1 kHz, Ableton Wavetable-ready. Frame order, dull → bright:

| pos | frame | centroid (Hz) |
|----:|-------|-------------:|
| 0 | cheeze_0003     |    93.4 |
| 1 | aguitar_0001    |   212.4 |
| 2 | birds_0001      |   314.6 |
| 3 | vgsqu_0008      | 1409.8 |
| 4 | saw             | 2319.6 |
| 5 | bitreduced_0040 | 2814.9 |

Identical to the `test-wavetables/wavetable_centroid.wav` reference; this run reproduces it from a fresh invocation, which is the actual *fit-test* — the question tree, default-walked, lands on the same artifact the packer already proves.

## What the fit-test tells us

- **Branch 1.b is short.** Three implicit defaults compress the captured-audio interview to two user turns. That feels right: when the user already has the partials, the only real questions are "which folder?" and "what does Position mean?" — and the second has a universal answer.
- **The defaults are honest.** Centroid-ordering produces a *meaningful* Position sweep on this pack — the proof is the table above. The packer's joint normalization keeps it a timbral morph, not a level ride.
- **The override surface is real, not theoretical.** A user who wants Serum gets there with a single answer to Q4. A user who wants to curate first gets there at Q2. The tree is shallow but every branch is reachable.

## What's *not* yet covered

- **Scale-up.** Six cycles is a fit-test, not a stress test. The next move is a *real* AKWF pack (often ~100+ cycles per category) through the same tree, with Q2.b clustering doing visible work to keep the resulting table musically navigable.
- **Q1 routing.** The tree above presumes the user picks the source archetype. The longer game is Claude *inferring* the archetype from the sound description (Q0 — "describe the sound") and routing into 1.a / 1.b / 1.c silently. That's the layer the bell-mock implies.
- **Q4.b round-trip.** Serum/CLM still needs a verified reference WAV to validate the writer against. The captured-audio path can ride 4.a today; 4.b waits on the CLM-verify thread.

## Where this proof sits

Companion to `2026-05-04-interview-mock.md` — that one specs the algorithmic-synthesis dialogue (bell deformation, branch 1.a). This one specs the captured-audio dialogue (single-cycle import, branch 1.b). The two together cover two of the three Q1 archetypes; 1.c is still concept-only.
