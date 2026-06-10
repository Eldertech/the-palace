// ============================================================================
// RenderHarness.cpp — drives the REAL TractMirrorProcessor::processBlock path
// to produce verification + listening renders.
//
//  (a) sustained /a e i o u schwa/ at 110 Hz, 2 s each, vibrato + breath zeroed,
//      48000 Hz, into test-renders/render_<vowel>.wav
//  (b) a short melody with glide + vibrato (default params): harness_melody.wav
//
// Vowel selection drives the vowelX/vowelY pad to the anchor positions used by
// the engine (INTERFACE.md sec 2), so each render lands exactly on one anchor's
// area function with negligible Shepard cross-bleed.
// ============================================================================

#include "PluginProcessor.h"
#include <juce_audio_formats/juce_audio_formats.h>
#include <juce_audio_basics/juce_audio_basics.h>

#include <array>
#include <vector>
#include <map>
#include <string>
#include <cmath>

namespace
{
    constexpr double kFs        = 48000.0;
    constexpr int    kBlock     = 512;
    constexpr double kVowelSecs = 2.0;
    constexpr int    kVowelMidi = 45;   // A2 = 110 Hz

    struct PadPoint { float x, y; };

    // Anchor pad positions (must match TractEngine::kAnchorPos / INTERFACE sec 2).
    const std::map<std::string, PadPoint> kAnchorPad = {
        { "a",     { 0.50f, 0.90f } },
        { "e",     { 0.15f, 0.55f } },
        { "i",     { 0.08f, 0.10f } },
        { "o",     { 0.85f, 0.58f } },
        { "u",     { 0.90f, 0.12f } },
        { "schwa", { 0.50f, 0.45f } },
    };

    void setParam (TractMirrorProcessor& proc, const char* id, float value0to1Normalized)
    {
        if (auto* p = proc.getParameters().getFirst())
            juce::ignoreUnused (p); // (kept for clarity; we set via APVTS below)
        if (auto* param = proc.apvts.getParameter (id))
            param->setValueNotifyingHost (param->convertTo0to1 (value0to1Normalized));
    }

    bool writeWav (const juce::File& file,
                   const std::vector<float>& samples,
                   double sampleRate)
    {
        file.getParentDirectory().createDirectory();
        file.deleteFile();

        juce::WavAudioFormat wav;
        std::unique_ptr<juce::FileOutputStream> stream (file.createOutputStream());
        if (stream == nullptr)
            return false;

        std::unique_ptr<juce::AudioFormatWriter> writer (
            wav.createWriterFor (stream.get(), sampleRate, 1, 24, {}, 0));
        if (writer == nullptr)
            return false;
        stream.release(); // writer owns it now

        juce::AudioBuffer<float> buf (1, (int) samples.size());
        std::copy (samples.begin(), samples.end(), buf.getWritePointer (0));
        const float* chans[1] = { buf.getReadPointer (0) };
        writer->writeFromFloatArrays (chans, 1, (int) samples.size());
        writer->flush();
        return true;
    }

    // Render a sustained vowel: hold a note for the full duration, take stereo L.
    std::vector<float> renderVowel (const std::string& vowel)
    {
        TractMirrorProcessor proc;
        proc.setPlayConfigDetails (0, 2, kFs, kBlock);
        proc.prepareToPlay (kFs, kBlock);

        // Vowel pad position.
        const PadPoint pad = kAnchorPad.at (vowel);
        setParam (proc, "vowelX", pad.x);
        setParam (proc, "vowelY", pad.y);

        // Vibrato + breath zeroed for clean formant analysis.
        setParam (proc, "vibDepth", 0.0f);
        setParam (proc, "breath",   0.0f);
        setParam (proc, "glide",    0.0f);   // no portamento for sustained tone
        setParam (proc, "attack",   15.0f);
        setParam (proc, "release",  120.0f);
        setParam (proc, "tension",  0.6f);
        setParam (proc, "brightness", 0.7f);
        setParam (proc, "gain",     0.0f);

        const int totalSamples = (int) std::round (kVowelSecs * kFs);
        std::vector<float> out;
        out.reserve ((size_t) totalSamples);

        juce::AudioBuffer<float> buffer (2, kBlock);

        int rendered = 0;
        bool noteSent = false;
        while (rendered < totalSamples)
        {
            const int n = std::min (kBlock, totalSamples - rendered);
            buffer.setSize (2, n, false, false, true);
            buffer.clear();

            juce::MidiBuffer midi;
            if (! noteSent)
            {
                midi.addEvent (juce::MidiMessage::noteOn (1, kVowelMidi, (juce::uint8) 100), 0);
                noteSent = true;
            }

            proc.processBlock (buffer, midi);

            const float* L = buffer.getReadPointer (0);
            for (int i = 0; i < n; ++i) out.push_back (L[i]);
            rendered += n;
        }
        return out;
    }

    // Render the analysis impulse response for a vowel: drive the real processor
    // to the vowel + let the ~10 ms area smoothing settle, then tap the tract's
    // impulse response (radiation OFF) - the reference analysis path whose peaks
    // are the exact tract poles. This is what the verify gate measures.
    // Anchor index order must match TractEngine::kAnchorPos: i,e,schwa,u,o,a.
    int anchorIndex (const std::string& v)
    {
        if (v == "i") return 0;
        if (v == "e") return 1;
        if (v == "schwa") return 2;
        if (v == "u") return 3;
        if (v == "o") return 4;
        if (v == "a") return 5;
        return 2;
    }

    std::vector<float> renderAnalysis (const std::string& vowel)
    {
        TractMirrorProcessor proc;
        proc.setPlayConfigDetails (0, 2, kFs, kBlock);
        proc.prepareToPlay (kFs, kBlock);

        // Force the tract to the PURE anchor area function (bypass the Shepard
        // morph). The canonical formants_measured_48k_hz were measured on the
        // pure curves, so this tests the KL tract DSP against the reference
        // without the morph's ~6-12 % neighbour bleed. The audio renders still
        // exercise the full morph path.
        proc.forcePureAnchor (anchorIndex (vowel));

        std::vector<float> ir;
        proc.renderTractImpulseResponse (ir, 8192);
        return ir;
    }

    // Render a short melody with glide + vibrato (default params).
    std::vector<float> renderMelody()
    {
        TractMirrorProcessor proc;
        proc.setPlayConfigDetails (0, 2, kFs, kBlock);
        proc.prepareToPlay (kFs, kBlock);

        // Default params (leave APVTS at construction defaults). Move vowel toward
        // a singable open shape and keep glide + vibrato lively.
        setParam (proc, "vowelX", 0.5f);
        setParam (proc, "vowelY", 0.55f);

        // Note schedule: (midiNote, durationSeconds). Legato overlaps give glide.
        struct NoteEv { int note; double dur; };
        const std::array<NoteEv, 6> seq {{
            { 57, 0.45 }, // A3
            { 60, 0.45 }, // C4
            { 64, 0.45 }, // E4
            { 62, 0.45 }, // D4
            { 60, 0.45 }, // C4
            { 57, 0.85 }  // A3
        }};

        std::vector<float> out;
        juce::AudioBuffer<float> buffer (2, kBlock);

        auto renderSeconds = [&] (double secs, int noteOn, int noteOff)
        {
            int total = (int) std::round (secs * kFs);
            int done = 0;
            bool onSent = (noteOn < 0);
            bool offSent = (noteOff < 0);
            while (done < total)
            {
                const int n = std::min (kBlock, total - done);
                buffer.setSize (2, n, false, false, true);
                buffer.clear();

                juce::MidiBuffer midi;
                if (! onSent)  { midi.addEvent (juce::MidiMessage::noteOn  (1, noteOn,  (juce::uint8) 96), 0); onSent  = true; }
                if (! offSent) { midi.addEvent (juce::MidiMessage::noteOff (1, noteOff),                    0); offSent = true; }

                proc.processBlock (buffer, midi);
                const float* L = buffer.getReadPointer (0);
                for (int i = 0; i < n; ++i) out.push_back (L[i]);
                done += n;
            }
        };

        // Legato line: each note-on lands while the previous is still held, so the
        // exponential glide and vibrato are audible. Release the prior note one
        // step into the new one.
        int prev = -1;
        for (const auto& ev : seq)
        {
            // start new note (held-note return keeps it monophonic)
            renderSeconds (0.06, ev.note, -1);
            // release previous after the small overlap
            if (prev >= 0) renderSeconds (0.0, -1, prev);
            renderSeconds (ev.dur - 0.06, -1, -1);
            prev = ev.note;
        }
        // final release + tail
        renderSeconds (0.8, -1, prev);

        return out;
    }

    void normalizeToPeak (std::vector<float>& x, float targetPeak)
    {
        float peak = 1.0e-9f;
        for (float v : x) peak = std::max (peak, std::abs (v));
        const float g = targetPeak / peak;
        for (float& v : x) v *= g;
    }

    // ------------------------------------------------------------------------
    // MIDI-controls renders (velocity layers + CC->vowel sweep) + references.
    // ------------------------------------------------------------------------

    // Configure a processor to the neutral schwa-ish voice used for the CC work:
    // vowelY held mid, vibrato/breath/glide off so formants read cleanly. The
    // caller still drives vowelX (pad) and the CC stream.
    void configureVoice (TractMirrorProcessor& proc, float vowelX, float vowelY)
    {
        setParam (proc, "vowelX",   vowelX);
        setParam (proc, "vowelY",   vowelY);
        setParam (proc, "vibDepth", 0.0f);
        setParam (proc, "breath",   0.0f);
        setParam (proc, "glide",    0.0f);
        setParam (proc, "attack",   15.0f);
        setParam (proc, "release",  120.0f);
        setParam (proc, "tension",  0.6f);
        setParam (proc, "brightness", 0.7f);
        setParam (proc, "gain",     0.0f);
    }

    // (a) Velocity layers: the SAME note at velocities 30, 70, 127, 1.2 s each.
    // No normalisation — the whole point is the absolute level ratio set by the
    // perceptual curve, so verify_midi.py can read the per-segment RMS directly.
    std::vector<float> renderVelocityLayers()
    {
        TractMirrorProcessor proc;
        proc.setPlayConfigDetails (0, 2, kFs, kBlock);
        proc.prepareToPlay (kFs, kBlock);
        configureVoice (proc, 0.50f, 0.45f);   // schwa centre

        const int   note   = 50;               // D3
        const int   vels[3] = { 30, 70, 127 };
        const double segSecs = 1.2;
        const int   segSamples = (int) std::round (segSecs * kFs);

        std::vector<float> out;
        out.reserve ((size_t) segSamples * 3);
        juce::AudioBuffer<float> buffer (2, kBlock);

        for (int s = 0; s < 3; ++s)
        {
            int done = 0;
            bool onSent = false, offSent = false;
            while (done < segSamples)
            {
                const int n = std::min (kBlock, segSamples - done);
                buffer.setSize (2, n, false, false, true);
                buffer.clear();

                juce::MidiBuffer midi;
                if (! onSent)
                {
                    midi.addEvent (juce::MidiMessage::noteOn (1, note, (juce::uint8) vels[s]), 0);
                    onSent = true;
                }
                // release ~80 ms before the segment end so the next note-on is clean
                const int relAt = segSamples - (int) std::round (0.08 * kFs);
                if (! offSent && done + n >= relAt)
                {
                    const int pos = juce::jlimit (0, n - 1, relAt - done);
                    midi.addEvent (juce::MidiMessage::noteOff (1, note), pos);
                    offSent = true;
                }

                proc.processBlock (buffer, midi);
                const float* L = buffer.getReadPointer (0);
                for (int i = 0; i < n; ++i) out.push_back (L[i]);
                done += n;
            }
        }
        return out;
    }

    // (b) CC sweep: hold one note ~4 s while CC1 ramps 0->127 (vowelY held mid,
    // vowelX driven entirely by the CC). Held flat at each end so the first /
    // last 0.5 s sit cleanly at vowelX = 0 and vowelX = 1.
    std::vector<float> renderCcSweep (int ccNum = 1)
    {
        TractMirrorProcessor proc;
        proc.setPlayConfigDetails (0, 2, kFs, kBlock);
        proc.prepareToPlay (kFs, kBlock);
        // vowelX default (0.5) is irrelevant — CC takes ownership immediately.
        configureVoice (proc, 0.50f, 0.45f);

        const int    note      = 45;           // A2 = 110 Hz (matches the vowel gate)
        const double holdLo    = 0.8;          // s at CC = 0   (vowelX = 0)
        const double ramp      = 2.4;          // s ramping 0 -> 127
        const double holdHi    = 0.8;          // s at CC = 127 (vowelX = 1)
        const double totalSecs = holdLo + ramp + holdHi;   // 4.0 s
        const int    total     = (int) std::round (totalSecs * kFs);

        std::vector<float> out;
        out.reserve ((size_t) total);
        juce::AudioBuffer<float> buffer (2, kBlock);

        int done = 0;
        bool onSent = false;
        int  lastCc = -1;
        while (done < total)
        {
            const int n = std::min (kBlock, total - done);
            buffer.setSize (2, n, false, false, true);
            buffer.clear();

            juce::MidiBuffer midi;
            if (! onSent)
            {
                midi.addEvent (juce::MidiMessage::noteOn (1, note, (juce::uint8) 100), 0);
                onSent = true;
                midi.addEvent (juce::MidiMessage::controllerEvent (1, ccNum, 0), 0);
                lastCc = 0;
            }
            // one CC update at block start, scheduled by the block's time position
            const double t = (double) done / kFs;
            double frac;
            if (t < holdLo)               frac = 0.0;
            else if (t < holdLo + ramp)   frac = (t - holdLo) / ramp;
            else                          frac = 1.0;
            const int ccVal = juce::jlimit (0, 127, (int) std::round (frac * 127.0));
            if (ccVal != lastCc)
            {
                midi.addEvent (juce::MidiMessage::controllerEvent (1, ccNum, ccVal), 0);
                lastCc = ccVal;
            }

            proc.processBlock (buffer, midi);
            const float* L = buffer.getReadPointer (0);
            for (int i = 0; i < n; ++i) out.push_back (L[i]);
            done += n;
        }
        return out;
    }

    // Param-rendered reference: voiced audio at a fixed pad position, ~1.5 s.
    // Same voice config and note as the CC sweep, so verify_midi.py can measure
    // its endpoints against these with an identical (voiced-LPC) method.
    std::vector<float> renderPadReference (float vowelX, float vowelY)
    {
        TractMirrorProcessor proc;
        proc.setPlayConfigDetails (0, 2, kFs, kBlock);
        proc.prepareToPlay (kFs, kBlock);
        configureVoice (proc, vowelX, vowelY);

        const int    note  = 45;
        const double secs  = 1.5;
        const int    total = (int) std::round (secs * kFs);

        std::vector<float> out;
        out.reserve ((size_t) total);
        juce::AudioBuffer<float> buffer (2, kBlock);

        int done = 0; bool onSent = false;
        while (done < total)
        {
            const int n = std::min (kBlock, total - done);
            buffer.setSize (2, n, false, false, true);
            buffer.clear();
            juce::MidiBuffer midi;
            if (! onSent) { midi.addEvent (juce::MidiMessage::noteOn (1, note, (juce::uint8) 100), 0); onSent = true; }
            proc.processBlock (buffer, midi);
            const float* L = buffer.getReadPointer (0);
            for (int i = 0; i < n; ++i) out.push_back (L[i]);
            done += n;
        }
        return out;
    }
}

int main()
{
    juce::ScopedJuceInitialiser_GUI juceInit; // message manager for plugin client

    const juce::File outDir (
        "/Users/loudonstearns/Documents/The Palace/Projects/Tract Mirror/plugin/test-renders");
    outDir.createDirectory();

    const std::array<std::string, 6> vowels { "a", "e", "i", "o", "u", "schwa" };

    bool ok = true;
    for (const auto& v : vowels)
    {
        // (1) Audio render: full audio path, for listening + sanity gates.
        std::vector<float> sig = renderVowel (v);
        normalizeToPeak (sig, 0.7079458f); // -3 dBFS
        const juce::File f = outDir.getChildFile ("render_" + juce::String (v) + ".wav");
        const bool w = writeWav (f, sig, kFs);
        ok = ok && w;
        std::printf ("rendered %-6s -> %s (%zu samples) %s\n",
                     v.c_str(), f.getFullPathName().toRawUTF8(),
                     sig.size(), w ? "OK" : "FAIL");

        // (2) Analysis render: tract impulse response (radiation OFF), for the
        // formant-verification gate (poles recoverable to canonical accuracy).
        std::vector<float> ir = renderAnalysis (v);
        normalizeToPeak (ir, 0.7079458f);
        const juce::File fa = outDir.getChildFile ("analysis_" + juce::String (v) + ".wav");
        const bool wa = writeWav (fa, ir, kFs);
        ok = ok && wa;
        std::printf ("analysis %-6s -> %s (%zu samples) %s\n",
                     v.c_str(), fa.getFullPathName().toRawUTF8(),
                     ir.size(), wa ? "OK" : "FAIL");
    }

    {
        std::vector<float> mel = renderMelody();
        normalizeToPeak (mel, 0.7079458f);
        const juce::File f = outDir.getChildFile ("harness_melody.wav");
        const bool w = writeWav (f, mel, kFs);
        ok = ok && w;
        std::printf ("rendered melody -> %s (%zu samples) %s\n",
                     f.getFullPathName().toRawUTF8(), mel.size(), w ? "OK" : "FAIL");
    }

    // ---- MIDI controls: velocity layers (NOT normalised — absolute levels) ----
    {
        std::vector<float> vl = renderVelocityLayers();
        const juce::File f = outDir.getChildFile ("velocity_layers.wav");
        const bool w = writeWav (f, vl, kFs);
        ok = ok && w;
        std::printf ("rendered vel-layers -> %s (%zu samples) %s\n",
                     f.getFullPathName().toRawUTF8(), vl.size(), w ? "OK" : "FAIL");
    }

    // ---- MIDI controls: CC1 sweep (NOT normalised) ----------------------------
    {
        std::vector<float> cs = renderCcSweep (1);
        const juce::File f = outDir.getChildFile ("cc_sweep.wav");
        const bool w = writeWav (f, cs, kFs);
        ok = ok && w;
        std::printf ("rendered cc-sweep   -> %s (%zu samples) %s\n",
                     f.getFullPathName().toRawUTF8(), cs.size(), w ? "OK" : "FAIL");
    }

    // ---- CC-sweep formant references: voiced audio at the pad endpoints -------
    // (vowelY held at 0.45 mid; vowelX = 0 and vowelX = 1). Same note + voice
    // config + measurement method as the sweep endpoints, so the comparison is
    // apples-to-apples under voiced LPC.
    {
        struct Ref { const char* name; float x, y; };
        const std::array<Ref, 2> refs {{
            { "cc_ref_x0.wav", 0.0f, 0.45f },
            { "cc_ref_x1.wav", 1.0f, 0.45f }
        }};
        for (const auto& r : refs)
        {
            std::vector<float> sig = renderPadReference (r.x, r.y);
            const juce::File f = outDir.getChildFile (r.name);
            const bool w = writeWav (f, sig, kFs);
            ok = ok && w;
            std::printf ("rendered cc-ref %-12s -> %s (%zu samples) %s\n",
                         r.name, f.getFullPathName().toRawUTF8(), sig.size(), w ? "OK" : "FAIL");
        }
    }

    return ok ? 0 : 1;
}
