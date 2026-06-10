#include "PluginProcessor.h"
#include "BinaryData.h"

#include <array>

// ============================================================================
// Parameter layout — exact ids/ranges/defaults/skews from INTERFACE.md sec 1.
// ============================================================================
juce::AudioProcessorValueTreeState::ParameterLayout
TractMirrorProcessor::createParameterLayout()
{
    using P = juce::AudioParameterFloat;
    using R = juce::NormalisableRange<float>;
    juce::AudioProcessorValueTreeState::ParameterLayout layout;

    // helper for a log-skewed range (skew chosen so the midpoint sits sensibly)
    auto logRange = [] (float lo, float hi)
    {
        R r (lo, hi);
        r.setSkewForCentre (std::sqrt (lo * hi));   // geometric-mean centre = log skew
        return r;
    };

    layout.add (std::make_unique<P>(juce::ParameterID { "vowelX", 1 }, "Vowel X",
                                    R (0.0f, 1.0f), 0.5f));
    layout.add (std::make_unique<P>(juce::ParameterID { "vowelY", 1 }, "Vowel Y",
                                    R (0.0f, 1.0f), 0.45f));
    layout.add (std::make_unique<P>(juce::ParameterID { "tension", 1 }, "Tension",
                                    R (0.0f, 1.0f), 0.6f));
    layout.add (std::make_unique<P>(juce::ParameterID { "breath", 1 }, "Breath",
                                    R (0.0f, 1.0f), 0.15f));
    layout.add (std::make_unique<P>(juce::ParameterID { "glide", 1 }, "Glide",
                                    logRange (0.0f, 500.0f), 60.0f));
    layout.add (std::make_unique<P>(juce::ParameterID { "vibRate", 1 }, "Vibrato Rate",
                                    R (0.1f, 8.0f), 5.0f));
    layout.add (std::make_unique<P>(juce::ParameterID { "vibDepth", 1 }, "Vibrato Depth",
                                    R (0.0f, 100.0f), 12.0f));
    layout.add (std::make_unique<P>(juce::ParameterID { "attack", 1 }, "Attack",
                                    logRange (1.0f, 500.0f), 15.0f));
    layout.add (std::make_unique<P>(juce::ParameterID { "release", 1 }, "Release",
                                    logRange (5.0f, 2000.0f), 120.0f));
    layout.add (std::make_unique<P>(juce::ParameterID { "brightness", 1 }, "Brightness",
                                    R (0.0f, 1.0f), 0.7f));
    layout.add (std::make_unique<P>(juce::ParameterID { "gain", 1 }, "Gain",
                                    R (-24.0f, 6.0f), 0.0f));

    return layout;
}

// ============================================================================
// Construction
// ============================================================================
TractMirrorProcessor::TractMirrorProcessor()
    : AudioProcessor(BusesProperties()
          .withOutput("Output", juce::AudioChannelSet::stereo(), true)),
      apvts(*this, nullptr, "Parameters", createParameterLayout())
{
    pVowelX   = apvts.getRawParameterValue ("vowelX");
    pVowelY   = apvts.getRawParameterValue ("vowelY");
    pTension  = apvts.getRawParameterValue ("tension");
    pBreath   = apvts.getRawParameterValue ("breath");
    pGlide    = apvts.getRawParameterValue ("glide");
    pVibRate  = apvts.getRawParameterValue ("vibRate");
    pVibDepth = apvts.getRawParameterValue ("vibDepth");
    pAttack   = apvts.getRawParameterValue ("attack");
    pRelease  = apvts.getRawParameterValue ("release");
    pBright   = apvts.getRawParameterValue ("brightness");
    pGain     = apvts.getRawParameterValue ("gain");

    loadVowelsFromBinaryData();
}

TractMirrorProcessor::~TractMirrorProcessor() {}

// ============================================================================
// Parse the embedded vowels.json once (single source of truth for tube
// constants + the six anchor area functions).
// ============================================================================
void TractMirrorProcessor::loadVowelsFromBinaryData()
{
    int dataSize = 0;
    const char* data = BinaryData::getNamedResource ("vowels_json", dataSize);
    if (data == nullptr || dataSize <= 0)
    {
        // Fall back to engine defaults (still functional, schwa-like uniform tube).
        jassertfalse;
        return;
    }

    const juce::String jsonText (juce::CharPointer_UTF8 (data),
                                 (size_t) dataSize);
    juce::var root = juce::JSON::parse (jsonText);
    if (! root.isObject())
    {
        jassertfalse;
        return;
    }

    const double L    = (double) root.getProperty ("tract_length_m", 0.171);
    const double c    = (double) root.getProperty ("speed_of_sound", 343.0);
    const double kg   = (double) root.getProperty ("glottal_reflection", 0.97);
    const double klip = (double) root.getProperty ("lip_reflection", -0.9);
    const double loss = (double) root.getProperty ("junction_loss", 0.996);
    engine.setTubeConstants (L, c, kg, klip, loss);

    // Anchor order MUST match TractEngine::kAnchorPos: i, e, schwa, u, o, a.
    static const std::array<const char*, TractEngine::kNumAnchors> names {
        "i", "e", "schwa", "u", "o", "a"
    };

    juce::var vowels = root.getProperty ("vowels", juce::var());
    if (auto* vobj = vowels.getDynamicObject())
    {
        for (int ai = 0; ai < TractEngine::kNumAnchors; ++ai)
        {
            juce::var v = vobj->getProperty (juce::Identifier (names[(size_t) ai]));
            juce::var areaArr = v.getProperty ("area_cm2", juce::var());
            if (auto* arr = areaArr.getArray())
            {
                std::array<double, TractEngine::kControlPoints> area {};
                const int count = std::min ((int) arr->size(),
                                            TractEngine::kControlPoints);
                for (int i = 0; i < count; ++i)
                    area[(size_t) i] = (double) (*arr)[i];
                // pad if short (defensive; vowels.json always has 64)
                for (int i = count; i < TractEngine::kControlPoints; ++i)
                    area[(size_t) i] = (count > 0) ? area[(size_t) (count - 1)] : 3.0;
                engine.setAnchorArea (ai, area);
            }
        }
    }
}

// ============================================================================
// Lifecycle
// ============================================================================
void TractMirrorProcessor::prepareToPlay(double sampleRate, int /*samplesPerBlock*/)
{
    engine.prepare (sampleRate);
    // ~60 Hz visualization refresh
    vizInterval = juce::jmax (1, (int) std::round (sampleRate / 60.0));
    vizSampleCounter = 0;
}

void TractMirrorProcessor::releaseResources() {}

// ============================================================================
// Pull current parameter values into the engine (block / sub-block rate).
// ============================================================================
void TractMirrorProcessor::pullParams()
{
    TractEngine::Params p;
    p.vowelX     = pVowelX   ->load();
    p.vowelY     = pVowelY   ->load();
    p.tension    = pTension  ->load();
    p.breath     = pBreath   ->load();
    p.glideMs    = pGlide    ->load();
    p.vibRateHz  = pVibRate  ->load();
    p.vibDepthCt = pVibDepth ->load();
    p.attackMs   = pAttack   ->load();
    p.releaseMs  = pRelease  ->load();
    p.brightness = pBright   ->load();
    p.gainDb     = pGain     ->load();
    engine.setParams (p);
}

void TractMirrorProcessor::publishViz()
{
    TractFrame& f = vizScratch;
    f.n = engine.getN();

    static thread_local std::vector<float> tmp;
    engine.copyAreas (tmp);
    for (int i = 0; i < f.n && i < 64; ++i) f.areas[(size_t) i] = tmp[(size_t) i];
    engine.copyK (tmp);
    for (int i = 0; i < f.n - 1 && i < 64; ++i) f.k[(size_t) i] = tmp[(size_t) i];
    engine.copyEnergies (tmp);
    for (int i = 0; i < f.n && i < 64; ++i) f.energies[(size_t) i] = tmp[(size_t) i];

    f.gate    = engine.isGateOpen();
    f.pitchHz = engine.getCurrentPitchHz();
    f.rms     = engine.getLastOutputRms();

    viz.publish (f);
}

// ============================================================================
// processBlock — sample-accurate MIDI splitting, real synthesis.
// ============================================================================
void TractMirrorProcessor::processBlock(juce::AudioBuffer<float>& buffer,
                                        juce::MidiBuffer& midiMessages)
{
    juce::ScopedNoDenormals noDenormals;

    const int numSamples  = buffer.getNumSamples();
    const int numChannels = buffer.getNumChannels();

    buffer.clear();
    if (numChannels < 1 || numSamples == 0)
        return;

    pullParams();

    float* outL = buffer.getWritePointer (0);

    int sample = 0;
    for (const auto meta : midiMessages)
    {
        const int eventPos = juce::jlimit (0, numSamples, meta.samplePosition);

        // render up to the event
        for (; sample < eventPos; ++sample)
        {
            const float y = engine.processSample();
            outL[sample] = y;
            if (++vizSampleCounter >= vizInterval) { vizSampleCounter = 0; publishViz(); }
        }

        // apply the MIDI event exactly at this sample
        const auto msg = meta.getMessage();
        if (msg.isNoteOn())
            engine.noteOn (msg.getNoteNumber(), msg.getFloatVelocity());
        else if (msg.isNoteOff())
            engine.noteOff (msg.getNoteNumber());
        else if (msg.isAllNotesOff() || msg.isAllSoundOff())
        {
            // release everything
            for (int n = 0; n < 128; ++n) engine.noteOff (n);
        }
        else if (msg.isPitchWheel())
        {
            const float norm = (msg.getPitchWheelValue() - 8192) / 8192.0f;
            engine.pitchBend (norm);
        }
    }

    // render the remainder of the block
    for (; sample < numSamples; ++sample)
    {
        const float y = engine.processSample();
        outL[sample] = y;
        if (++vizSampleCounter >= vizInterval) { vizSampleCounter = 0; publishViz(); }
    }

    // stereo: same signal both channels
    for (int ch = 1; ch < numChannels; ++ch)
        buffer.copyFrom (ch, 0, outL, numSamples);
}

// ============================================================================
// Editor
// ============================================================================
juce::AudioProcessorEditor* TractMirrorProcessor::createEditor()
{
    // Keep the GenericAudioProcessorEditor for now (WebView lands next phase).
    return new juce::GenericAudioProcessorEditor (*this);
}

// ============================================================================
// State persistence
// ============================================================================
void TractMirrorProcessor::getStateInformation(juce::MemoryBlock& destData)
{
    auto state = apvts.copyState();
    std::unique_ptr<juce::XmlElement> xml(state.createXml());
    copyXmlToBinary(*xml, destData);
}

void TractMirrorProcessor::setStateInformation(const void* data, int sizeInBytes)
{
    std::unique_ptr<juce::XmlElement> xml(getXmlFromBinary(data, sizeInBytes));
    if (xml != nullptr && xml->hasTagName(apvts.state.getType()))
        apvts.replaceState(juce::ValueTree::fromXml(*xml));
}

// ============================================================================
// Plugin entry point
// ============================================================================
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new TractMirrorProcessor();
}
