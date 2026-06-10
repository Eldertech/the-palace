// ============================================================================
// TractEngine.cpp - implementation. Direct port of reference/kl_reference.py.
// See TractEngine.h and reference/REPORT.md sec 6 ("what the C++ port must not
// get wrong") for the load-bearing sign conventions.
// ============================================================================

#include "TractEngine.h"

namespace
{
    constexpr double kPi      = 3.14159265358979323846;
    constexpr double kTwoPi   = 2.0 * kPi;

    inline double clampd (double v, double lo, double hi)
    {
        return v < lo ? lo : (v > hi ? hi : v);
    }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
void TractEngine::prepare (double sampleRate)
{
    fs = sampleRate;
    recomputeSectionCount();

    // Control-rate area smoothing ~10 ms one-pole. Coefficient applied per
    // control update (every controlInterval samples).
    controlInterval = std::max (1, (int) std::round (fs * 0.001)); // ~1 ms tick
    const double smoothMs = 10.0;
    const double tau = smoothMs * 0.001;
    // per control-tick coefficient
    const double dtTick = (double) controlInterval / fs;
    areaSmoothCoeff = std::exp (-dtTick / tau);

    // Effective vowel-position smoothing: ~15 ms one-pole, same control tick.
    const double vowelTau = 15.0 * 0.001;
    vowelSmoothCoeff = std::exp (-dtTick / vowelTau);

    reset();
}

void TractEngine::reset()
{
    railF.assign ((size_t) N, 0.0);
    railB.assign ((size_t) N, 0.0);
    energyRaw.assign ((size_t) N, 0.0);
    lipLpState = 0.0;
    radPrev    = 0.0;

    glottalPhase = 0.0;
    vibPhase     = 0.0;
    voicedDcState = 0.0;
    voicedDcPrev  = 0.0;

    envStage = EnvStage::Idle;
    envValue = 0.0;

    heldCount = 0;
    currentNote = -1;
    currentVelocity = 0.0f;
    velocityAmp = 1.0;
    gateOpen = false;

    controlCounter = 0;
    outputRms = 0.0f;
    rmsAccum = 0.0;
    rmsCount = 0;

    // Snap the effective vowel position to the current params so the tract starts
    // on the right vowel without an audible glide at the first block.
    vowelTargetX = (double) params.vowelX;
    vowelTargetY = (double) params.vowelY;
    effVowelX = vowelTargetX;
    effVowelY = vowelTargetY;
    vowelPosInit = false;

    // Initialize morph to whatever the params point at (or schwa-ish midpoint).
    if (anchorsLoaded)
    {
        recomputeMorph();
        areaSmoothedN = areaTargetN;       // snap on reset (no zipper at start)
        updateReflectionCoeffs();
        areasInitialized = true;
    }
}

void TractEngine::recomputeSectionCount()
{
    N = (int) std::round (fs * tractLengthM / speedOfSound);
    N = std::max (4, N);
    areaTargetN.assign ((size_t) N, 3.0);
    areaSmoothedN.assign ((size_t) N, 3.0);
    k.assign ((size_t) (N - 1), 0.0);
    railF.assign ((size_t) N, 0.0);
    railB.assign ((size_t) N, 0.0);
    energyRaw.assign ((size_t) N, 0.0);
}

// ---------------------------------------------------------------------------
// Tube constants + anchors
// ---------------------------------------------------------------------------
void TractEngine::setTubeConstants (double tractLengthM_,
                                    double speedOfSound_,
                                    double glottalReflection_,
                                    double lipReflection_,
                                    double junctionLoss_)
{
    tractLengthM      = tractLengthM_;
    speedOfSound      = speedOfSound_;
    glottalReflection = glottalReflection_;
    lipReflection     = lipReflection_;
    junctionLoss      = junctionLoss_;
    recomputeSectionCount();
}

void TractEngine::setAnchorArea (int anchorIndex,
                                 const std::array<double, kControlPoints>& areaCm2)
{
    if (anchorIndex < 0 || anchorIndex >= kNumAnchors)
        return;
    anchorAreas[(size_t) anchorIndex] = areaCm2;

    // Mark loaded once we have at least the last anchor written; cheap check:
    // require all anchors to be non-degenerate (any > 0). We trust the loader to
    // call this for all six.
    anchorsLoaded = true;
}

// ---------------------------------------------------------------------------
// Note logic: last-note priority + held-note return, pitch bend
// ---------------------------------------------------------------------------
void TractEngine::pushHeld (int note)
{
    // remove if already present, then push to top
    removeHeld (note);
    if (heldCount < kMaxHeld)
        heldNotes[(size_t) heldCount++] = note;
}

void TractEngine::removeHeld (int note)
{
    int w = 0;
    for (int r = 0; r < heldCount; ++r)
        if (heldNotes[(size_t) r] != note)
            heldNotes[(size_t) w++] = heldNotes[(size_t) r];
    heldCount = w;
}

double TractEngine::midiToHz (int note) const
{
    return 440.0 * std::pow (2.0, (note - 69) / 12.0);
}

void TractEngine::noteOn (int midiNote, float velocity)
{
    pushHeld (midiNote);
    currentNote = midiNote;
    currentVelocity = velocity;

    // Perceptual velocity curve, sampled ONCE at note-on (INTERFACE.md sec 1):
    //   amp = 0.25 + 0.75 * (vel/127)^1.5
    // `velocity` arrives already normalised to 0..1 (= vel/127) from both the host
    // (MidiMessage::getFloatVelocity) and the GUI preview FIFO (vel/127), so the
    // two paths apply the identical curve. This scales the whole note's excitation
    // and never retriggers mid-note; glide / vibrato / pitch-bend are untouched.
    const double vNorm = clampd ((double) velocity, 0.0, 1.0);
    velocityAmp = 0.25 + 0.75 * std::pow (vNorm, 1.5);

    targetPitchHz = midiToHz (midiNote);

    // First note from silence: snap pitch so there is no glide from a stale value.
    if (envStage == EnvStage::Idle || envStage == EnvStage::Release)
    {
        if (envStage == EnvStage::Idle)
            currentPitchHz = targetPitchHz;
    }

    gateOpen = true;
    envStage = EnvStage::Attack;
    updateEnvelopeRates();
}

void TractEngine::noteOff (int midiNote)
{
    removeHeld (midiNote);

    if (heldCount > 0)
    {
        // held-note return: retrigger pitch to the most-recent still-held note,
        // but do NOT restart the envelope (legato glide).
        currentNote = heldNotes[(size_t) (heldCount - 1)];
        targetPitchHz = midiToHz (currentNote);
        gateOpen = true;
    }
    else
    {
        // all released -> release stage
        currentNote = -1;
        gateOpen = false;
        envStage = EnvStage::Release;
        updateEnvelopeRates();
    }
}

void TractEngine::pitchBend (float bendNormalized)
{
    pitchBendSemis = 2.0 * clampd (bendNormalized, -1.0, 1.0);
}

void TractEngine::updateEnvelopeRates()
{
    const double atkSamples = std::max (1.0, params.attackMs * 0.001 * fs);
    attackInc = 1.0 / atkSamples;

    const double relSamples = std::max (1.0, params.releaseMs * 0.001 * fs);
    // exponential release reaching ~ -60 dB over relSamples
    releaseCoeff = std::exp (std::log (0.001) / relSamples);
}

// ---------------------------------------------------------------------------
// Morphing: Shepard blend (log domain) -> resample 64 -> N (log domain)
// ---------------------------------------------------------------------------
double TractEngine::resampleLogAt (const std::vector<double>& logCp, double pos01)
{
    // logCp has kControlPoints entries on [0,1]; linear interp in log domain.
    const int C = (int) logCp.size();
    if (C == 1) return logCp[0];
    const double x = clampd (pos01, 0.0, 1.0) * (double) (C - 1);
    const int i0 = (int) std::floor (x);
    const int i1 = std::min (i0 + 1, C - 1);
    const double frac = x - (double) i0;
    return logCp[(size_t) i0] * (1.0 - frac) + logCp[(size_t) i1] * frac;
}

void TractEngine::recomputeMorph()
{
    if (! anchorsLoaded)
        return;

    // ---- Effective vowel position: one-pole toward the processor-set target --
    // The processor resolves pad/CC last-writer-wins and sets (vowelTargetX/Y);
    // here we smooth the EFFECTIVE position at ~15 ms (per control tick), then the
    // Shepard blend reads the smoothed position. The first morph snaps (no zipper
    // at start); thereafter the one-pole tames coarse 7-bit CC steps.
    if (! vowelPosInit)
    {
        effVowelX = vowelTargetX;
        effVowelY = vowelTargetY;
        vowelPosInit = true;
    }
    else
    {
        effVowelX = vowelSmoothCoeff * effVowelX + (1.0 - vowelSmoothCoeff) * vowelTargetX;
        effVowelY = vowelSmoothCoeff * effVowelY + (1.0 - vowelSmoothCoeff) * vowelTargetY;
    }

    // ---- Shepard inverse-square weights over the six anchors ----------------
    std::array<double, kNumAnchors> w {};
    double wsum = 0.0;
    for (int v = 0; v < kNumAnchors; ++v)
    {
        const double dx = effVowelX - (double) kAnchorPos[(size_t) v].x;
        const double dy = effVowelY - (double) kAnchorPos[(size_t) v].y;
        const double d2 = dx * dx + dy * dy;
        const double wv = 1.0 / (d2 + 0.005);     // w_v = 1/(d^2 + 0.005)
        w[(size_t) v] = wv;
        wsum += wv;
    }
    const double inv = (wsum > 0.0) ? (1.0 / wsum) : 0.0;
    for (auto& wv : w) wv *= inv;                 // normalize to sum 1

    // ---- Blend the 64-pt area functions in the LOG domain -------------------
    // logA = sum_v w_v * log(A_v) ; A = exp(logA). Never blend k.
    std::vector<double> logBlend ((size_t) kControlPoints, 0.0);
    for (int cp = 0; cp < kControlPoints; ++cp)
    {
        double acc = 0.0;
        for (int v = 0; v < kNumAnchors; ++v)
        {
            const double a = anchorAreas[(size_t) v][(size_t) cp];
            acc += w[(size_t) v] * std::log (std::max (a, 1.0e-6));
        }
        logBlend[(size_t) cp] = acc;
    }

    // ---- Resample 64 -> N, linear in log-area, then exp ---------------------
    for (int s = 0; s < N; ++s)
    {
        const double pos = (N > 1) ? (double) s / (double) (N - 1) : 0.0;
        const double logv = resampleLogAt (logBlend, pos);
        areaTargetN[(size_t) s] = std::exp (logv);
    }
}

void TractEngine::updateReflectionCoeffs()
{
    // k_i = (A_i - A_{i+1})/(A_i + A_{i+1}), sections glottis -> lips.
    for (int i = 0; i < N - 1; ++i)
    {
        const double ai  = areaSmoothedN[(size_t) i];
        const double aip = areaSmoothedN[(size_t) (i + 1)];
        const double denom = ai + aip;
        k[(size_t) i] = (denom > 1.0e-12) ? (ai - aip) / denom : 0.0;
    }
}

// ---------------------------------------------------------------------------
// Per-sample render
// ---------------------------------------------------------------------------
float TractEngine::processSample()
{
    if (! areasInitialized && anchorsLoaded)
    {
        recomputeMorph();
        areaSmoothedN = areaTargetN;
        updateReflectionCoeffs();
        areasInitialized = true;
    }

    // ===== Control-rate updates (morph target + area smoothing) =============
    if (++controlCounter >= controlInterval)
    {
        controlCounter = 0;
        recomputeMorph();
        // one-pole smoothing of the area vector toward the target (no zipper)
        for (int s = 0; s < N; ++s)
        {
            const double tgt = areaTargetN[(size_t) s];
            double& cur = areaSmoothedN[(size_t) s];
            cur = areaSmoothCoeff * cur + (1.0 - areaSmoothCoeff) * tgt;
        }
        updateReflectionCoeffs();
    }

    // ===== Pitch: glide (exponential), pitch bend, vibrato ==================
    // exponential glide toward target. Time constant from glideMs.
    const double glideMs = std::max (0.0, (double) params.glideMs);
    if (glideMs < 0.5)
    {
        currentPitchHz = targetPitchHz;
    }
    else
    {
        // per-sample coefficient: reach ~ -60 dB of the gap over glideMs
        const double glideSamples = std::max (1.0, glideMs * 0.001 * fs);
        const double gc = std::exp (std::log (0.001) / glideSamples);
        currentPitchHz = targetPitchHz + (currentPitchHz - targetPitchHz) * gc;
    }

    // vibrato in cents -> ratio
    vibPhase += (double) params.vibRateHz / fs;
    if (vibPhase >= 1.0) vibPhase -= 1.0;
    const double vibCents = (double) params.vibDepthCt * std::sin (kTwoPi * vibPhase);

    const double totalSemis = pitchBendSemis + vibCents / 100.0;
    double f0 = currentPitchHz * std::pow (2.0, totalSemis / 12.0);
    f0 = clampd (f0, 1.0, fs * 0.45);

    // ===== Amplitude envelope (linear attack, exponential release) ==========
    switch (envStage)
    {
        case EnvStage::Idle:
            envValue = 0.0;
            break;
        case EnvStage::Attack:
            envValue += attackInc;
            if (envValue >= 1.0) { envValue = 1.0; envStage = EnvStage::Sustain; }
            break;
        case EnvStage::Sustain:
            envValue = 1.0;
            break;
        case EnvStage::Release:
            envValue *= releaseCoeff;
            if (envValue < 1.0e-5) { envValue = 0.0; envStage = EnvStage::Idle; }
            break;
    }

    // ===== Glottal source ===================================================
    // Phase accumulator at f0.
    glottalPhase += f0 / fs;
    if (glottalPhase >= 1.0) glottalPhase -= 1.0;

    // --- Rosenberg-style flow pulse as a closed-form function of phase. -------
    // Matches kl_reference.rosenberg_pulse: an opening branch (raised cosine,
    // rising 0->1 over [0,Tp)) and a closing branch (cosine quarter-wave, 1->0
    // over [Tp, open_len)), zero in the closed phase. tension reshapes the
    // open/close split exactly as the reference does.
    const double oq = 0.6; // open quotient (reference default)
    const double tension = clampd ((double) params.tension, 0.0, 1.0);
    double closeFrac = 0.2 + 0.6 * (1.0 - tension);
    closeFrac = clampd (closeFrac, 0.1, 0.8);
    const double openPhase = oq;                 // fraction of period glottis is open
    const double TpFrac = openPhase * (1.0 - closeFrac); // opening-phase end (in phase)

    double voiced = 0.0;
    const double ph = glottalPhase;
    if (ph < TpFrac)
    {
        // opening branch: 0.5*(1 - cos(pi * ph / Tp))
        const double denom = (TpFrac > 1.0e-9) ? TpFrac : 1.0e-9;
        voiced = 0.5 * (1.0 - std::cos (kPi * ph / denom));
    }
    else if (ph < openPhase)
    {
        // closing branch: cos(0.5*pi*(ph-Tp)/tc)
        const double tc = openPhase - TpFrac;
        const double denom = (tc > 1.0e-9) ? tc : 1.0e-9;
        voiced = std::cos (0.5 * kPi * (ph - TpFrac) / denom);
    }
    else
    {
        voiced = 0.0; // closed phase
    }

    // DC-block the voiced flow (the reference subtracts the buffer mean; a
    // one-pole highpass is the streaming equivalent and keeps the pulse AC).
    const double dcR = 0.999;
    const double voicedAc = voiced - voicedDcPrev + dcR * voicedDcState;
    voicedDcState = voicedAc;
    voicedDcPrev  = voiced;

    // Scale voiced to a roughly unit-RMS excitation. The raised/quarter-cosine
    // pulse with OQ 0.6 has RMS ~0.3 before DC removal; multiply up so the two
    // paths mix at comparable level (reference normalizes each path to unit RMS).
    const double voicedExc = voicedAc * 3.0;

    // --- Aspiration noise path (turbulence rides on the glottal envelope) -----
    double noise = gauss (rng);
    const double env = 0.3 + 0.7 * std::min (1.0, std::abs (voiced));
    noise *= env;

    const double breath = clampd ((double) params.breath, 0.0, 1.0);
    double excitation = (1.0 - breath) * voicedExc + breath * noise;

    // Gate the excitation by the amplitude envelope and the velocity amplitude
    // sampled at note-on (the perceptual curve lives in noteOn()).
    excitation *= envValue * velocityAmp;

    // ===== Kelly-Lochbaum tract step (line-for-line port of step()) =========
    // Read the waves currently sitting in each section; compute new rails.
    const double loss = junctionLoss;

    // Glottal end (section 0): reflect returning backward wave + add excitation.
    double newF0 = glottalReflection * railB[0] + excitation;

    // Interior junctions i = 0..N-2.
    // Temporary buffers are avoided by computing into the new arrays in place
    // where the read index does not collide. We need both old f[i] and old
    // b[i+1]; write to scratch then commit.
    // Use small stack-free scratch via member rails swapped through locals.
    static thread_local std::vector<double> newF, newB;
    if ((int) newF.size() != N) { newF.assign ((size_t) N, 0.0); newB.assign ((size_t) N, 0.0); }

    newF[0] = newF0;

    for (int i = 0; i < N - 1; ++i)
    {
        const double fIn = railF[(size_t) i];
        const double bIn = railB[(size_t) (i + 1)];
        const double w = k[(size_t) i] * (fIn - bIn);
        const double fOut = (fIn + w) * loss;   // into section i+1 (forward)
        const double bOut = (bIn + w) * loss;   // into section i   (backward)
        newF[(size_t) (i + 1)] = fOut;
        newB[(size_t) i]       = bOut;
    }

    // Lip end (section N-1, open): forward wave reflects with lip_reflection
    // through a one-pole radiation lowpass.
    const double fLip = railF[(size_t) (N - 1)];
    const double a = radiationLowpass;
    lipLpState = (1.0 - a) * fLip + a * lipLpState;
    newB[(size_t) (N - 1)] = lipReflection * lipLpState;

    // Transmitted lip pressure (part of forward wave not reflected back).
    const double transmitted = (1.0 + lipReflection) * fLip;

    // AUDIO radiation. The reference's validated audio path is the PURE first
    // difference of the transmitted pressure (+6 dB/oct); that emphasis is what
    // keeps the upper formants audible against the steeply-rolled-off glottal
    // source. So the first difference is ALWAYS applied (reference physics),
    // and `brightness` adds an EXTRA high-frequency tilt on top rather than
    // scaling the core radiation down toward a flat (formant-burying) spectrum.
    const double bright = clampd ((double) params.brightness, 0.0, 1.0);
    const double firstDiff = transmitted - radPrev;
    radPrev = transmitted;
    // Extra brightness emphasis: a second, lighter first-difference contribution.
    // bright 0.5 -> reference radiation; >0.5 brighter, <0.5 softer HF. The base
    // first difference is preserved so formant structure never collapses.
    const double extra = (bright - 0.5) * 0.8;     // -0.4 .. +0.4
    double out = firstDiff + extra * firstDiff;

    // Commit rails + per-section energy snapshot.
    for (int i = 0; i < N; ++i)
    {
        railF[(size_t) i] = newF[(size_t) i];
        railB[(size_t) i] = newB[(size_t) i];
        // wave energy ~ f^2 + b^2, lightly smoothed for display
        const double e = newF[(size_t) i] * newF[(size_t) i]
                       + newB[(size_t) i] * newB[(size_t) i];
        energyRaw[(size_t) i] = 0.95 * energyRaw[(size_t) i] + 0.05 * e;
    }

    currentPitchHz = currentPitchHz; // (kept; pitch for viz already updated)

    // ===== Output gain ======================================================
    const double gainLin = std::pow (10.0, (double) params.gainDb / 20.0);
    // Static makeup: raw tract output peak is ~0.02 for a 110 Hz pulse train
    // (REPORT sec 9). Lift it to a usable level.
    const double makeup = 8.0;
    double y = out * makeup * gainLin;

    // soft safety clip to keep the bus bounded if a transient overshoots
    if (y > 1.5) y = 1.5; else if (y < -1.5) y = -1.5;

    // RMS meter (block-windowed)
    rmsAccum += y * y;
    if (++rmsCount >= 512)
    {
        outputRms = (float) std::sqrt (rmsAccum / (double) rmsCount);
        rmsAccum = 0.0;
        rmsCount = 0;
    }

    return (float) y;
}

// ---------------------------------------------------------------------------
// Analysis helper: force the tract to one pure anchor area function.
// ---------------------------------------------------------------------------
void TractEngine::forcePureAnchor (int anchorIndex)
{
    if (anchorIndex < 0 || anchorIndex >= kNumAnchors || ! anchorsLoaded)
        return;

    const auto& cp = anchorAreas[(size_t) anchorIndex];

    // log-domain resample 64 -> N (matches kl_reference.resample_area).
    std::vector<double> logCp ((size_t) kControlPoints, 0.0);
    for (int i = 0; i < kControlPoints; ++i)
        logCp[(size_t) i] = std::log (std::max (cp[(size_t) i], 1.0e-6));

    for (int s = 0; s < N; ++s)
    {
        const double pos = (N > 1) ? (double) s / (double) (N - 1) : 0.0;
        areaTargetN[(size_t) s]   = std::exp (resampleLogAt (logCp, pos));
        areaSmoothedN[(size_t) s] = areaTargetN[(size_t) s];   // snap (no smoothing)
    }
    updateReflectionCoeffs();
    areasInitialized = true;
}

// ---------------------------------------------------------------------------
// Analysis tap: tract impulse response (radiation OFF), reference analysis path.
// ---------------------------------------------------------------------------
void TractEngine::renderImpulseResponse (std::vector<float>& dst, int numSamples) const
{
    dst.assign ((size_t) std::max (1, numSamples), 0.0f);

    // Local rails + lip lowpass state (do not touch the live audio state).
    std::vector<double> f ((size_t) N, 0.0);
    std::vector<double> b ((size_t) N, 0.0);
    std::vector<double> nf ((size_t) N, 0.0);
    std::vector<double> nb ((size_t) N, 0.0);
    const double loss = junctionLoss;

    for (int n = 0; n < numSamples; ++n)
    {
        const double excitation = (n == 0) ? 1.0 : 0.0;

        // Glottal end.
        nf[0] = glottalReflection * b[0] + excitation;

        // Interior junctions.
        for (int i = 0; i < N - 1; ++i)
        {
            const double fIn = f[(size_t) i];
            const double bIn = b[(size_t) (i + 1)];
            const double w = k[(size_t) i] * (fIn - bIn);
            nf[(size_t) (i + 1)] = (fIn + w) * loss;
            nb[(size_t) i]       = (bIn + w) * loss;
        }

        // Lip end. The reference analysis IR (tract_impulse_response,
        // radiation_lowpass=0.0) reflects the raw forward wave with no lip
        // lowpass, so the recovered poles are the canonical ones. Match that.
        const double fLip = f[(size_t) (N - 1)];
        nb[(size_t) (N - 1)] = lipReflection * fLip;

        // Raw transmitted pressure (radiation first-difference OFF).
        dst[(size_t) n] = (float) ((1.0 + lipReflection) * fLip);

        f.swap (nf);
        b.swap (nb);
    }
}

// ---------------------------------------------------------------------------
// Visualization read-out
// ---------------------------------------------------------------------------
void TractEngine::copyAreas (std::vector<float>& dst) const
{
    dst.resize ((size_t) N);
    for (int i = 0; i < N; ++i) dst[(size_t) i] = (float) areaSmoothedN[(size_t) i];
}

void TractEngine::copyK (std::vector<float>& dst) const
{
    dst.resize ((size_t) (N - 1));
    for (int i = 0; i < N - 1; ++i) dst[(size_t) i] = (float) k[(size_t) i];
}

void TractEngine::copyEnergies (std::vector<float>& dst) const
{
    dst.resize ((size_t) N);
    double mx = 1.0e-9;
    for (int i = 0; i < N; ++i) mx = std::max (mx, energyRaw[(size_t) i]);
    const double inv = 1.0 / mx;
    for (int i = 0; i < N; ++i)
        dst[(size_t) i] = (float) clampd (energyRaw[(size_t) i] * inv, 0.0, 1.0);
}
