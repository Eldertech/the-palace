# Tract Mirror — Interface Contract (DSP <-> GUI)

This file is the binding contract between the C++ engine (plugin/src) and the WebView GUI
(plugin/gui). Both sides build against it independently; neither side may change it
unilaterally. File ownership: DSP sessions own `src/` and `CMakeLists.txt`; GUI sessions own
`gui/` only.

## 1. Parameters (APVTS ids — exact strings)

| id          | type  | range          | default | unit  | notes |
|-------------|-------|----------------|---------|-------|-------|
| vowelX      | float | 0..1           | 0.5     | —     | XY pad x (0 = left) |
| vowelY      | float | 0..1           | 0.45    | —     | XY pad y (0 = top)  |
| tension     | float | 0..1           | 0.6     | —     | glottal tension / spectral tilt |
| breath      | float | 0..1           | 0.15    | —     | aspiration noise mix |
| glide       | float | 0..500         | 60      | ms    | portamento time, log skew |
| vibRate     | float | 0.1..8         | 5.0     | Hz    | vibrato LFO rate |
| vibDepth    | float | 0..100         | 12      | cents | vibrato depth |
| attack      | float | 1..500         | 15      | ms    | amplitude envelope attack, log skew |
| release     | float | 5..2000        | 120     | ms    | amplitude envelope release, log skew |
| brightness  | float | 0..1           | 0.7     | —     | lip radiation emphasis mix |
| gain        | float | -24..+6        | 0       | dB    | output gain |
| ccX         | int   | 1..119         | 1       | CC#   | MIDI CC mapped to vowelX (default mod wheel) |
| ccY         | int   | 1..119         | 74      | CC#   | MIDI CC mapped to vowelY |
| wordScan    | float | 0..1           | 0       | —     | position along the active word's vowel path (Word mode, section 6) |
| ccScan      | int   | 1..119         | 11      | CC#   | MIDI CC mapped to wordScan (default expression) |

MIDI: monophonic, last-note priority with held-note return on release; pitch bend +-2 semitones.
Velocity: scales note amplitude with the perceptual curve amp = 0.25 + 0.75 * (vel/127)^1.5,
sampled at note-on (no retrigger mid-note). GUI preview keys send velocity 100.
MIDI CC: an incoming ccX/ccY controller value v (0..127) sets vowelX/vowelY to v/127. The engine
applies it immediately (with its existing ~10 ms area smoothing; add ~15 ms smoothing on the CC
position itself so coarse 7-bit steps never zipper), and the host-visible parameter is updated
asynchronously on the message thread (setValueNotifyingHost NEVER called from the audio thread)
so the GUI pad follows and host automation can record it. Last-writer-wins between pad and CC.

## 2. Vowel space (identical math in C++ and JS — pin exactly)

Anchor positions in pad coordinates (x right 0..1, y DOWN 0..1):

    i     = (0.08, 0.10)      u     = (0.90, 0.12)
    e     = (0.15, 0.55)      o     = (0.85, 0.58)
    schwa = (0.50, 0.45)      a     = (0.50, 0.90)

Blend weights: Shepard inverse-square — w_v = 1 / (d_v^2 + 0.005) where d_v = euclidean
distance from (vowelX, vowelY) to anchor v; normalize w to sum 1. Blend the 64-point area
functions in the LOG domain: logA = sum_v w_v * log(A_v), A = exp(logA). Never blend k.

Reflection coefficients from areas (after resampling 64 -> N(fs) sections, linear in log-area):
k_i = (A_i - A_{i+1}) / (A_i + A_{i+1}). N = round(fs * L / c) with L, c, end reflections, and
junction loss taken from reference/vowels.json (single source of truth, embedded as BinaryData).

## 2.5 Vowel loudness normalization (engine-internal, no parameter)

Different tract shapes have drastically different transfer gains (/u/ is far louder than /e/) —
true to the physics, wrong for an instrument. The engine applies continuous, deterministic gain
compensation: at control rate (each area update), convert the current k ladder to direct-form
all-pole coefficients (Levinson step-up — the mirror identity, again), evaluate |H| on a fixed
grid of 64 log-spaced bins from 60 Hz to 8 kHz, weight by the net source-plus-radiation spectral
slope (-6 dB/oct relative to flat, referenced at 500 Hz), and integrate to an expected-loudness
energy — PLUS the forward pressure-transmission gain 20*sum(log10|1 + k_i|), the cumulative wave
transmission reaching the lips. The |H| term alone captures formant shape but loses overall
passband gain (interior k_i are area ratios); adding the transmission term lifts correlation with
measured RMS from 0.93 to 0.995 (implemented + documented in TractEngine loudnessEnergyDb()).
compensation_dB = ref_dB - current_dB where ref is the SCHWA tube at the same sample rate
(schwa = unity gain, so default-patch level is unchanged). Clamp compensation to [-18, +18] dB,
smooth ~30 ms. Applies identically in pad, CC, and Word modes. No AGC, no pumping: the same tract
shape always gets the same gain.

## 3. Visualization stream (DSP -> GUI), event name `tractFrame`

Emitted ~30 Hz by the editor timer (JUCE 8 `WebBrowserComponent::emitEventIfBrowserIsVisible`),
reading a lock-free snapshot the processor refreshes. Payload (JSON object):

    {
      "n": 23,                  // engine section count at current fs
      "areas": [n floats],      // current morphed areas, cm^2, glottis -> lips
      "k": [n-1 floats],        // interior reflection coefficients (the lattice view)
      "energies": [n floats],   // per-section wave energy, normalized 0..1
      "gate": true,             // note currently sounding
      "pitchHz": 110.0,         // current (post-glide, post-bend) fundamental
      "rms": 0.18,              // output meter, linear
      "vx": 0.5, "vy": 0.45     // effective vowel position incl. CC modulation (0..1)
    }

GUI applies its own visual easing; DSP does not smooth for display.

## 4. Parameter binding (GUI <-> plugin)

JUCE 8 native integration: one `juce::WebSliderRelay` + `WebSliderParameterAttachment` per
parameter, relay names = APVTS ids above. GUI uses the official JUCE JavaScript frontend
(`getSliderState(id)` from juce_gui_extra's `native/javascript` module, vendored INLINE into
gui/index.html). MIDI-style note triggering from the GUI (preview keyboard) uses a
`juce::WebBrowserComponent` native function `noteEvent(note, velocity, on)` — optional, GUI
must not depend on it.

## 6. Word mode — type a word, scan through it

The GUI sends the word; the PROCESSOR owns the mapping (so state restore works without a GUI).

**Native function** `setWord(word)` (string). **Event** `wordState` emitted whenever the word
changes AND once when the GUI announces itself ready: payload
`{ "word": "hello", "letters": [{"ch":"h","vowel":null},{"ch":"e","vowel":0},...],
"path": [{"x":0.15,"y":0.55}, ...] }` where `letters[i].vowel` is the index into `path` for vowel
letters and null for ignored letters. The word string persists in plugin state (saved/restored
with the APVTS tree).

**Letter -> vowel mapping** (case-insensitive, max 32 chars, identical in C++ and mock JS):
a->a, e->e, i->i, o->o, u->u, y->i, w->u; every other character is ignored (no vowel letters ->
Word mode inactive). Each vowel letter becomes one path point at its anchor coordinates
(section 2).

**Scan timing**: K path points split t in [0,1] into K equal segments. Within segment i
(1-based), local s = K*t - (i-1): if i > 1 and s < 0.35, position = smoothstep blend from
p_(i-1) to p_i (u = s/0.35, smoothstep 3u^2-2u^3); else hold p_i. t=0 is exactly p_1, t=1 is
exactly p_K. K=1 holds constant. The engine's existing ~15 ms position smoothing applies on top.

**Ownership**: while a word is active (non-empty with >=1 vowel), wordScan owns the vowel
position; the pad and ccX/ccY are visually live but do not drive the tract. Clearing the word
returns control to pad/CC. The GUI draws the path as a polyline on the vowel pad, highlights the
current letter while scanning, and shows a SCAN fader bound to the wordScan relay.

## 5. Browser fallback (mock mode)

gui/index.html must run standalone in a plain browser: if `window.__JUCE__` is absent, install
a mock that (a) keeps all controls live, (b) computes areas/k locally from the inlined
vowels.json data using the section-2 math, (c) animates plausible energies (slow morph cycle +
decay), so the same file is both the design mockup and the shipped GUI. Single self-contained
file: three.js r128 UMD + OrbitControls inlined, vowels.json inlined, JUCE frontend lib inlined.
No CDN at runtime, no emoji, footer "Loudon Live · Autodidact Polymaths".
