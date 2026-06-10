#include "PluginProcessor.h"
#include "BinaryData.h"

#if JUCE_WEB_BROWSER
 #include "PluginEditor.h"
#endif

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

    // Two assignable MIDI CC numbers (INTERFACE.md sec 1). AudioParameterInt so the
    // host/GUI see whole CC numbers; range 1..119 (0 = bank-select / 120+ = channel
    // mode messages are excluded). Defaults: ccX = 1 (mod wheel), ccY = 74.
    using I = juce::AudioParameterInt;
    layout.add (std::make_unique<I>(juce::ParameterID { "ccX", 1 }, "CC -> X",
                                    1, 119, 1));
    layout.add (std::make_unique<I>(juce::ParameterID { "ccY", 1 }, "CC -> Y",
                                    1, 119, 74));

    // Word mode (INTERFACE.md sec 6): wordScan is the position along the active
    // word's vowel path (0..1); ccScan is the assignable MIDI CC mapped to it
    // (default 11 = expression). The word string itself is NOT a parameter - it
    // lives in plugin state, saved/restored alongside the APVTS tree.
    layout.add (std::make_unique<P>(juce::ParameterID { "wordScan", 1 }, "Word Scan",
                                    R (0.0f, 1.0f), 0.0f));
    layout.add (std::make_unique<I>(juce::ParameterID { "ccScan", 1 }, "CC -> Scan",
                                    1, 119, 11));

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
    pCcX      = apvts.getRawParameterValue ("ccX");
    pCcY      = apvts.getRawParameterValue ("ccY");
    pWordScan = apvts.getRawParameterValue ("wordScan");
    pCcScan   = apvts.getRawParameterValue ("ccScan");

    loadVowelsFromBinaryData();
}

TractMirrorProcessor::~TractMirrorProcessor()
{
    cancelPendingUpdate();   // no message-thread callback after we're gone
}

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
// Word mode (INTERFACE.md section 6). The processor owns the word string and
// the resolved path; setWord recomputes the path and publishes it to the audio
// thread. Message-thread only.
// ============================================================================
void TractMirrorProcessor::setWord (const juce::String& word)
{
    currentWord = word;

    // Build the path from the (UTF-8) word using the shared, contract-pinned map.
    const word_map::WordPath wp = word_map::build (word.toRawUTF8());
    wordPathPub.publish (wp);
}

juce::var TractMirrorProcessor::getWordStateVar() const
{
    // Recompute from the canonical word string (the publisher snapshot is for the
    // audio thread; here we own the message-thread source of truth).
    const word_map::WordPath wp = word_map::build (currentWord.toRawUTF8());

    auto* obj = new juce::DynamicObject();
    obj->setProperty ("word", currentWord);

    juce::Array<juce::var> letters;
    for (int i = 0; i < wp.length; ++i)
    {
        auto* lo = new juce::DynamicObject();
        lo->setProperty ("ch", juce::String::charToString ((juce::juce_wchar) wp.chars[i]));
        if (wp.letterVowel[i] >= 0)
            lo->setProperty ("vowel", wp.letterVowel[i]);
        else
            lo->setProperty ("vowel", juce::var());   // null
        letters.add (juce::var (lo));
    }
    obj->setProperty ("letters", letters);

    juce::Array<juce::var> path;
    for (int i = 0; i < wp.pathLen; ++i)
    {
        auto* po = new juce::DynamicObject();
        po->setProperty ("x", (double) wp.path[i].x);
        po->setProperty ("y", (double) wp.path[i].y);
        path.add (juce::var (po));
    }
    obj->setProperty ("path", path);

    return juce::var (obj);
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

// Drain GUI preview-keyboard notes (message thread producer) into the engine.
// Applied at block start so they share the synthesis path with host MIDI.
void TractMirrorProcessor::drainGuiNotes()
{
    int r = guiNoteRead.load (std::memory_order_relaxed);
    const int w = guiNoteWrite.load (std::memory_order_acquire);
    while (r != w)
    {
        const GuiNote& gn = guiNotes[(size_t) r];
        if (gn.isOn) engine.noteOn (gn.note, gn.velocity);
        else         engine.noteOff (gn.note);
        r = (r + 1) % kGuiNoteCap;
    }
    guiNoteRead.store (r, std::memory_order_release);
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
    f.vx      = engine.getEffVowelX();    // current smoothed vowel position (CC-aware)
    f.vy      = engine.getEffVowelY();

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
    drainGuiNotes();   // fold GUI preview-keyboard notes into the engine

    // ── Resolve the vowel target for this block (pad / CC last-writer-wins) ────
    // Detect pad/automation takeover by CHANGE, not by absolute divergence: the
    // pad owns the axis again only when the host param MOVED since last block to a
    // value the CC did not write. This is robust to the async host-param echo not
    // having landed yet — while CC owns the axis and the echo is in flight the
    // host param is simply unchanged, so no spurious takeover fires; whereas a real
    // pad/automation grab moves the host param to a value != ccLastPushed.
    const float padX = pVowelX->load();
    const float padY = pVowelY->load();
    const float kEps = 2.0e-3f;     // below the CC 7-bit grid (1/127 ~ 7.9e-3)
    if (ccOwnsX && prevPadX >= 0.0f
        && std::abs (padX - prevPadX) > kEps
        && std::abs (padX - ccLastPushedX) > kEps)
        ccOwnsX = false;
    if (ccOwnsY && prevPadY >= 0.0f
        && std::abs (padY - prevPadY) > kEps
        && std::abs (padY - ccLastPushedY) > kEps)
        ccOwnsY = false;
    prevPadX = padX;
    prevPadY = padY;

    // ── wordScan takeover detection (same change-based logic as the pad axes) ──
    const float wsParam = pWordScan->load();
    if (ccOwnsScan && prevWordScan >= 0.0f
        && std::abs (wsParam - prevWordScan) > kEps
        && std::abs (wsParam - ccLastPushedScan) > kEps)
        ccOwnsScan = false;
    prevWordScan = wsParam;

    // Which CC numbers are assigned right now (snapshot for this block).
    const int ccNumX    = juce::jlimit (1, 119, (int) std::round (pCcX->load()));
    const int ccNumY    = juce::jlimit (1, 119, (int) std::round (pCcY->load()));
    const int ccNumScan = juce::jlimit (1, 119, (int) std::round (pCcScan->load()));

    // ── Active word path (INTERFACE.md sec 6). When a word is active (>=1 vowel),
    // wordScan OWNS the vowel position; the pad and ccX/ccY are visually live but
    // do not drive the tract. Resolve the scanned pad coordinate and hand it to
    // the engine, overriding the pad/CC arbitration below. ───────────────────
    const word_map::WordPath activeWord = wordPathPub.read();
    const bool wordActive = activeWord.active();

    // Helper: set the engine vowel target for THIS block from the current state.
    auto applyVowelTarget = [&] ()
    {
        if (wordActive)
        {
            const float ws = ccOwnsScan ? ccTargetScan : pWordScan->load();
            const word_map::PadPoint p = word_map::scan (activeWord, ws);
            engine.setVowelTarget ((double) p.x, (double) p.y);
        }
        else
        {
            engine.setVowelTarget (ccOwnsX ? (double) ccTargetX : (double) padX,
                                   ccOwnsY ? (double) ccTargetY : (double) padY);
        }
    };

    // Apply the resolved target before rendering the head of the block.
    applyVowelTarget();

    bool ccTouchedThisBlock = false;

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
        else if (msg.isController())
        {
            // Assignable CC -> vowel: value v (0..127) sets vowelX/Y to v/127.
            // CC becomes the most-recent writer for that axis (last-writer-wins);
            // the engine responds immediately via the ~15 ms smoothed position,
            // and we queue an async host-param push (message thread) below.
            const int  cc  = msg.getControllerNumber();
            const float val = (float) msg.getControllerValue() / 127.0f;
            if (cc == ccNumX)
            {
                ccTargetX = val; ccOwnsX = true; ccTouchedThisBlock = true;
                applyVowelTarget();   // word-active: ignored for vowel; pad echo still queued
            }
            if (cc == ccNumY)
            {
                ccTargetY = val; ccOwnsY = true; ccTouchedThisBlock = true;
                applyVowelTarget();
            }
            if (cc == ccNumScan)
            {
                // ccScan -> wordScan (INTERFACE.md sec 6 / sec 1). Same last-writer
                // -wins + async host-sync as the pad axes. Drives the vowel only
                // when a word is active; the host-param push happens regardless so
                // the GUI fader + automation follow.
                ccTargetScan = val; ccOwnsScan = true; ccTouchedThisBlock = true;
                applyVowelTarget();
            }
        }
    }

    // render the remainder of the block
    for (; sample < numSamples; ++sample)
    {
        const float y = engine.processSample();
        outL[sample] = y;
        if (++vizSampleCounter >= vizInterval) { vizSampleCounter = 0; publishViz(); }
    }

    // ── Coalesced async host-param push (message thread does setValueNotifyingHost)
    // Only when a CC actually moved an axis this block. We stash the value CC last
    // pushed so the takeover detector above can tell pad moves from CC echo.
    if (ccTouchedThisBlock)
    {
        if (ccOwnsX)    { pendingHostX.store (ccTargetX, std::memory_order_release); ccLastPushedX = ccTargetX; }
        if (ccOwnsY)    { pendingHostY.store (ccTargetY, std::memory_order_release); ccLastPushedY = ccTargetY; }
        if (ccOwnsScan) { pendingHostW.store (ccTargetScan, std::memory_order_release); ccLastPushedScan = ccTargetScan; }
        triggerAsyncUpdate();   // safe to call from the audio thread; coalesces
    }

    // stereo: same signal both channels
    for (int ch = 1; ch < numChannels; ++ch)
        buffer.copyFrom (ch, 0, outL, numSamples);
}

// ============================================================================
// Async host-parameter push (message thread). Pulls the coalesced CC-driven
// vowel values from the lock-free mailbox and writes them to the host parameter
// via setValueNotifyingHost — the ONLY place that call is made, and it is never
// on the audio thread (INTERFACE.md sec 1). A negative sentinel means "nothing
// pending"; we clear it after consuming so a later identical value still pushes.
// ============================================================================
void TractMirrorProcessor::handleAsyncUpdate()
{
    const float x = pendingHostX.exchange (-1.0f, std::memory_order_acquire);
    const float y = pendingHostY.exchange (-1.0f, std::memory_order_acquire);
    const float w = pendingHostW.exchange (-1.0f, std::memory_order_acquire);

    if (x >= 0.0f)
        if (auto* p = apvts.getParameter ("vowelX"))
            p->setValueNotifyingHost (p->convertTo0to1 (juce::jlimit (0.0f, 1.0f, x)));
    if (y >= 0.0f)
        if (auto* p = apvts.getParameter ("vowelY"))
            p->setValueNotifyingHost (p->convertTo0to1 (juce::jlimit (0.0f, 1.0f, y)));
    if (w >= 0.0f)
        if (auto* p = apvts.getParameter ("wordScan"))
            p->setValueNotifyingHost (p->convertTo0to1 (juce::jlimit (0.0f, 1.0f, w)));
}

// ============================================================================
// Editor
// ============================================================================
juce::AudioProcessorEditor* TractMirrorProcessor::createEditor()
{
#if JUCE_WEB_BROWSER
    return new TractMirrorEditor (*this);
#else
    // Render harness build (no WebView): a generic editor keeps the contract.
    return new juce::GenericAudioProcessorEditor (*this);
#endif
}

// ============================================================================
// State persistence
// ============================================================================
void TractMirrorProcessor::getStateInformation(juce::MemoryBlock& destData)
{
    auto state = apvts.copyState();
    std::unique_ptr<juce::XmlElement> xml(state.createXml());
    // Word mode (INTERFACE.md sec 6): the word string is NOT an APVTS parameter,
    // so persist it as an attribute on the saved XML root alongside the tree.
    xml->setAttribute ("tractMirrorWord", currentWord);
    copyXmlToBinary(*xml, destData);
}

void TractMirrorProcessor::setStateInformation(const void* data, int sizeInBytes)
{
    std::unique_ptr<juce::XmlElement> xml(getXmlFromBinary(data, sizeInBytes));
    if (xml != nullptr && xml->hasTagName(apvts.state.getType()))
    {
        // Restore the word first (read the attribute before replaceState may
        // touch the element), then the parameter tree. setWord recomputes the
        // path + republishes it to the audio thread; an attaching editor re-emits
        // wordState via its GUI-ready handshake.
        const juce::String savedWord = xml->getStringAttribute ("tractMirrorWord", juce::String());
        apvts.replaceState(juce::ValueTree::fromXml(*xml));
        setWord (savedWord);
    }
}

// ============================================================================
// Plugin entry point
// ============================================================================
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new TractMirrorProcessor();
}
