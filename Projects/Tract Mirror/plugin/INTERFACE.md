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

## 5. Browser fallback (mock mode)

gui/index.html must run standalone in a plain browser: if `window.__JUCE__` is absent, install
a mock that (a) keeps all controls live, (b) computes areas/k locally from the inlined
vowels.json data using the section-2 math, (c) animates plausible energies (slow morph cycle +
decay), so the same file is both the design mockup and the shipped GUI. Single self-contained
file: three.js r128 UMD + OrbitControls inlined, vowels.json inlined, JUCE frontend lib inlined.
No CDN at runtime, no emoji, footer "Loudon Live · Autodidact Polymaths".
