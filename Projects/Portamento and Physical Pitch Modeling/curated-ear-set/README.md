# Curated Ear Set — Portamento and Physical Pitch Modeling

Twelve short portamento examples for ear-training. Each one is a frequency
trajectory produced by the second-order damped-oscillator pitch model from
the home entry; each carries a damping regime AND a physical-system
motivation. The student listens, identifies (a) the regime and (b) what
physical system would produce that trajectory, then reveals the
spectrogram.

## Files

| path | what |
|---|---|
| `render.py` | Generates the audio + spectrograms + manifest from the 12 `Example` definitions inside. Re-runnable. |
| `manifest.json` | Machine-readable description of all 12 examples (regime, ζ, ωₙ, harmonics, teaching note). The quiz HTML reads this. |
| `audio/NN-<regime>.wav` | 3-second 44.1 kHz mono WAVs, normalized to ~-3 dBFS. |
| `spectrograms/NN-<regime>.png` | STFT spectrograms (the wavelet view's close cousin; visually shows ridge + ripple). |
| `quiz.html` | The ear-training UI. Open in a browser; it fetches manifest.json and randomizes the deck. |

## The 12 examples

Four per regime, with one explicit multi-modal/inharmonic case under
"underdamped" so students hear what real instruments do, not just the
textbook model.

- **Overdamped (4):** trombone slide, theremin, slow cello portamento, lap steel
- **Critically damped (4):** synth glide, trained singer, kalimba tine, controlled guitar bend release
- **Underdamped (4):** bell strike retuned by transient, untrained singer overshoot, fast guitar bend with vibrato, prepared-piano multi-modal settling

## Running the quiz

```
cd Projects/Portamento\ and\ Physical\ Pitch\ Modeling/curated-ear-set
python3 -m http.server 8000
# then open http://localhost:8000/quiz.html
```

(A `file://` open works for the audio but not for the `fetch()` of
manifest.json — use the local server.)

## Regenerating after editing the example list

Edit the `EXAMPLES` list in `render.py` and run `python3 render.py`. All
12 wavs + pngs + the manifest are overwritten in place.

## Connection to the home entry

This is the first realization of the home entry's forward vector — *the
physics is already here; the pedagogy needs its exercises.* Tool-10
(Damping Regime Ear Training) presented four randomized regime examples
with no physical-system context; this set keeps the random play, adds
the physical-system layer, triples the deck size, and reveals the
spectrogram as part of the answer feedback.
