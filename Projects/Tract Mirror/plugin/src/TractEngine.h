#pragma once

// ============================================================================
// TractEngine - pure DSP for "Tract Mirror".
//
// A monophonic LPC voice synthesizer: a Rosenberg-style glottal source (open
// quotient + tension spectral tilt) plus aspiration noise, exciting a
// bidirectional two-rail Kelly-Lochbaum vocal tract whose reflection
// coefficients are k_i = (A_i - A_{i+1})/(A_i + A_{i+1}). This is a direct port
// of reference/kl_reference.py; the SIGN CONVENTIONS and end reflections are
// preserved exactly (validated against the uniform-tube 501/1503/2506 Hz check
// and per-vowel formants in reference/vowels.json).
//
// No JUCE dependency: this header uses only <vector>, <array>, <random>, <cmath>.
// PluginProcessor feeds it parameters and pumps samples.
// ============================================================================

#include <vector>
#include <array>
#include <random>
#include <cmath>
#include <cstdint>
#include <algorithm>

class TractEngine
{
public:
    // ---- Constants mirrored from reference/vowels.json (single source of truth).
    // These defaults are overwritten by setTubeConstants() once the processor has
    // parsed the embedded vowels.json, so the engine always uses the canonical
    // numbers rather than these fallbacks.
    static constexpr int   kControlPoints = 64;     // area function sample count
    static constexpr int   kNumAnchors    = 6;      // i e schwa u o a

    TractEngine() = default;

    // ---- Lifecycle ----------------------------------------------------------
    void prepare (double sampleRate);
    void reset();

    // ---- Tube constants from vowels.json (single source of truth) -----------
    // Called once after the processor parses the embedded JSON.
    void setTubeConstants (double tractLengthM,
                           double speedOfSound,
                           double glottalReflection,
                           double lipReflection,
                           double junctionLoss);

    // ---- Vowel anchor area functions (64-pt each, glottis -> lips) ----------
    // Anchor order is fixed: index 0..5 = i, e, schwa, u, o, a. The processor
    // loads these from vowels.json. Each is a 64-element area curve in cm^2.
    void setAnchorArea (int anchorIndex, const std::array<double, kControlPoints>& areaCm2);

    // ---- Per-block control parameters (set at block start / sub-block) -------
    struct Params
    {
        float vowelX     = 0.5f;
        float vowelY     = 0.45f;
        float tension    = 0.6f;
        float breath     = 0.15f;
        float glideMs    = 60.0f;
        float vibRateHz  = 5.0f;
        float vibDepthCt = 12.0f;
        float attackMs   = 15.0f;
        float releaseMs  = 120.0f;
        float brightness = 0.7f;
        float gainDb     = 0.0f;
    };
    void setParams (const Params& p) { params = p; }

    // ---- Effective vowel position (pad / CC arbitration lives in the processor) --
    // The processor resolves last-writer-wins between the XY pad parameter and the
    // two MIDI CCs, then hands the engine ONE target per axis. The engine smooths
    // its internal effective position toward that target with a ~15 ms one-pole
    // (on TOP of the ~10 ms area smoothing) so coarse 7-bit CC steps never zipper.
    // recomputeMorph() reads the smoothed effective position, NOT params.vowelX/Y.
    void  setVowelTarget (double x, double y) { vowelTargetX = x; vowelTargetY = y; }
    float getEffVowelX() const { return (float) effVowelX; }
    float getEffVowelY() const { return (float) effVowelY; }

    // ---- Monophonic note logic ---------------------------------------------
    // Last-note priority with held-note return on release; pitch bend +-2 st.
    void noteOn  (int midiNote, float velocity);
    void noteOff (int midiNote);
    void pitchBend (float bendNormalized);   // -1..+1 maps to -2..+2 semitones

    // ---- Per-sample render --------------------------------------------------
    float processSample();

    // ---- Analysis tap: tract impulse response on the CURRENT morphed areas. --
    // Runs the SAME Kelly-Lochbaum scattering loop (same k ladder, same end
    // reflections + junction loss) on a unit impulse with the radiation
    // first-difference OFF (raw transmitted pressure). This is the reference's
    // ANALYSIS path (kl_reference.tract_impulse_response, radiation=False) whose
    // spectral peaks are the exact tract poles / formant frequencies. Used by
    // the render harness to emit an analysis WAV the verify gate measures - the
    // faithful way to validate the ported tract (voiced-LPC at F0=110 cannot
    // resolve low formants from the sparse harmonic comb; the pole path can).
    // Leaves the live audio rails untouched (uses its own scratch state).
    void renderImpulseResponse (std::vector<float>& dst, int numSamples) const;

    // ---- Analysis helper: force the tract to ONE pure anchor area function. --
    // Bypasses the Shepard morph and resamples a single anchor's 64-pt curve to
    // N (log domain), then recomputes k. Used by the harness to render an
    // analysis IR at the CANONICAL vowel (the formants_measured_48k_hz numbers
    // were measured on the pure anchor curves, before any blend), so the gate
    // tests the KL tract DSP itself against the reference. The Shepard morph is
    // a separate, spec-conformant feature exercised by the audio renders.
    void forcePureAnchor (int anchorIndex);

    // ---- Visualization read-out (filled by the processor's publisher) -------
    int   getN()            const { return N; }
    void  copyAreas (std::vector<float>& dst) const;     // current morphed areas cm^2
    void  copyK     (std::vector<float>& dst) const;     // interior reflection coeffs
    void  copyEnergies (std::vector<float>& dst) const;  // per-section energy 0..1
    bool  isGateOpen()      const { return gateOpen || envValue > 1.0e-5f; }
    float getCurrentPitchHz() const { return currentPitchHz; }
    float getLastOutputRms() const { return outputRms; }

    // ---- Loudness normalization toggle (verification harness only) ----------
    // Production always leaves this ON. The render harness flips it OFF to capture
    // the PRE-normalization vowel-loudness spread for the before/after table; with
    // it off, loudCompLin is forced to 1.0 (the legacy behaviour).
    void  setLoudnessNormEnabled (bool on) { loudNormEnabled = on; }
    bool  isLoudnessNormEnabled() const { return loudNormEnabled; }

private:
    // ---- Sample rate / section count ---------------------------------------
    double fs = 48000.0;
    int    N  = 24;                 // sections at this rate

    // ---- Tube constants (from vowels.json) ---------------------------------
    double tractLengthM      = 0.171;
    double speedOfSound      = 343.0;
    double glottalReflection = 0.97;
    double lipReflection     = -0.9;
    double junctionLoss      = 0.996;
    double radiationLowpass  = 0.75; // one-pole on reflected lip wave (audio model)

    // ---- Anchor area functions (64-pt) -------------------------------------
    // Index 0..5 = i, e, schwa, u, o, a (matches the Shepard anchor list below).
    std::array<std::array<double, kControlPoints>, kNumAnchors> anchorAreas {};
    bool anchorsLoaded = false;

    // Shepard anchor pad positions (x right 0..1, y DOWN 0..1) per INTERFACE.md sec 2.
    // Order MUST match anchorAreas indices.
    struct Anchor { float x, y; };
    static constexpr std::array<Anchor, kNumAnchors> kAnchorPos {{
        { 0.08f, 0.10f },   // 0 i
        { 0.15f, 0.55f },   // 1 e
        { 0.50f, 0.45f },   // 2 schwa
        { 0.90f, 0.12f },   // 3 u
        { 0.85f, 0.58f },   // 4 o
        { 0.50f, 0.90f }    // 5 a
    }};

    // ---- Current morphed tract state ---------------------------------------
    std::vector<double> areaTargetN;   // morph target, length N (cm^2)
    std::vector<double> areaSmoothedN; // control-rate smoothed areas, length N
    std::vector<double> k;             // interior reflection coeffs, length N-1
    bool areasInitialized = false;

    // ---- Kelly-Lochbaum delay rails ----------------------------------------
    std::vector<double> railF;         // forward, length N
    std::vector<double> railB;         // backward, length N
    double lipLpState = 0.0;           // radiation lowpass state
    double radPrev    = 0.0;           // previous transmitted for first-difference

    // ---- Energies (per-section, smoothed for display) ----------------------
    std::vector<double> energyRaw;     // length N

    // ---- Area smoothing (control-rate ~10 ms) ------------------------------
    double areaSmoothCoeff = 0.0;      // one-pole coefficient
    int    controlInterval = 0;        // samples between morph recomputes
    int    controlCounter  = 0;

    // ---- Vowel loudness normalization (INTERFACE.md sec 2.5) ---------------
    // Different tract shapes have very different transfer gains (/u/ far louder
    // than /e/). At control rate (each area update) we convert the current k
    // ladder to all-pole coefficients (Levinson step-up — the mirror identity),
    // evaluate |H| on a fixed log-spaced grid, weight by the net source+radiation
    // spectral slope, integrate to an expected-loudness energy, and apply a
    // frequency-FLAT make-up gain referenced to the schwa tube (schwa = unity).
    // All buffers are fixed-size (sized for the max section count) so the
    // control-rate path is allocation-free. The reference energy is computed once
    // at prepare from the schwa anchor's resampled k ladder.
    static constexpr int kMaxSections = 128;   // ceiling on N (>> any audio fs)
    static constexpr int kLoudBins    = 64;    // |H| evaluation grid
    static constexpr double kLoudFLo  = 60.0;  // Hz
    static constexpr double kLoudFHi  = 8000.0;// Hz
    std::array<double, kLoudBins> loudBinHz   {}; // log-spaced bin centres (Hz)
    std::array<double, kLoudBins> loudBinW    {}; // -6 dB/oct weights (energy), ref 500 Hz
    double loudRefEnergyDb   = 0.0;   // schwa reference loudness energy (dB), per fs
    double loudCompDb        = 0.0;   // current smoothed compensation (dB)
    double loudCompLin       = 1.0;   // 10^(loudComp/20), applied in the audio path
    double loudCompSmoothCoeff = 0.0; // ~30 ms one-pole per control tick
    bool   loudInit          = false; // snap compensation on first morph (no jump)
    bool   loudNormEnabled   = true;  // production ON; harness flips off for "before"

    // Compute the expected-loudness energy (in dB) of a k ladder (length count)
    // via Levinson step-up -> |H| on the log grid -> source-weighted integral.
    // Allocation-free: uses fixed-size scratch. `kLadder` is read [0, count).
    double loudnessEnergyDb (const double* kLadder, int count) const;
    void   buildLoudnessGrid();        // fill loudBinHz / loudBinW (fs-independent w)
    void   computeSchwaReference();    // loudRefEnergyDb from the schwa anchor ladder
    void   updateLoudnessCompensation();// control-rate: refresh loudComp{Db,Lin}

    // ---- Effective vowel position smoothing (~15 ms, per control tick) ------
    // The target is set by the processor (pad / CC last-writer-wins arbitration);
    // the effective position one-poles toward it before the Shepard morph runs.
    double vowelTargetX  = 0.5;
    double vowelTargetY  = 0.45;
    double effVowelX     = 0.5;
    double effVowelY     = 0.45;
    double vowelSmoothCoeff = 0.0;     // ~15 ms one-pole per control tick
    bool   vowelPosInit  = false;      // snap on first morph (no zipper at start)

    // ---- Glottal source state ----------------------------------------------
    double glottalPhase = 0.0;         // 0..1 phase accumulator
    std::mt19937 rng { 0x72616374u };  // deterministic noise seed ("ract")
    std::normal_distribution<double> gauss { 0.0, 1.0 };
    double voicedDcState = 0.0;        // DC blocker state (one-pole highpass)
    double voicedDcPrev  = 0.0;

    // ---- Note / pitch state -------------------------------------------------
    static constexpr int kMaxHeld = 16;
    std::array<int, kMaxHeld> heldNotes {}; // stack of currently-held notes
    int    heldCount = 0;
    int    currentNote = -1;
    float  currentVelocity = 0.0f;     // raw 0..1 velocity of the last note-on
    double velocityAmp = 1.0;          // perceptual amplitude sampled AT note-on
    bool   gateOpen = false;

    double targetPitchHz  = 110.0;     // glide destination
    double currentPitchHz = 110.0;     // glided current pitch
    double pitchBendSemis = 0.0;       // -2..+2
    double glideCoeff = 0.0;           // recomputed from glideMs each sample-ish

    // ---- Vibrato LFO --------------------------------------------------------
    double vibPhase = 0.0;

    // ---- Amplitude envelope (linear attack, exponential release) -----------
    enum class EnvStage { Idle, Attack, Sustain, Release };
    EnvStage envStage = EnvStage::Idle;
    double envValue = 0.0;
    double attackInc = 0.0;            // linear increment per sample
    double releaseCoeff = 0.0;         // exponential multiplier per sample

    // ---- Output meter -------------------------------------------------------
    float outputRms = 0.0f;
    double rmsAccum = 0.0;
    int    rmsCount = 0;

    Params params;

    // ---- Helpers ------------------------------------------------------------
    void   recomputeSectionCount();
    void   recomputeMorph();           // Shepard blend -> resample -> target areas
    void   updateReflectionCoeffs();   // k from areaSmoothedN
    void   updateEnvelopeRates();
    double midiToHz (int note) const;
    static double resampleLogAt (const std::vector<double>& logCp, double pos01);

    void   pushHeld (int note);
    void   removeHeld (int note);
};
