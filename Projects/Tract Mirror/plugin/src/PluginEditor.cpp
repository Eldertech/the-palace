#include "PluginEditor.h"
#include "BinaryData.h"

namespace
{
    // APVTS ids in INTERFACE.md section 1 order. Relay names MUST equal these.
    // ccX / ccY are AudioParameterInt but bind through the same WebSliderRelay so
    // the GUI reads/writes them via getSliderState("ccX") / ("ccY").
    const juce::StringArray kParamIds {
        "vowelX", "vowelY", "tension", "breath", "glide", "vibRate",
        "vibDepth", "attack", "release", "brightness", "gain",
        "ccX", "ccY"
    };
}

TractMirrorEditor::TractMirrorEditor (TractMirrorProcessor& p)
    : juce::AudioProcessorEditor (p), processorRef (p)
{
    using Options = juce::WebBrowserComponent::Options;

    // ---- one relay + parameter attachment per APVTS id ----------------------
    Options options = Options{}
        .withNativeIntegrationEnabled()
        .withResourceProvider (
            [this] (const juce::String& url) { return provideResource (url); })
        .withNativeFunction (
            juce::Identifier ("noteEvent"),
            [this] (const juce::Array<juce::var>& args,
                    juce::WebBrowserComponent::NativeFunctionCompletion completion)
            {
                // noteEvent(note, velocity[0..127], isOn)
                const int   note = args.size() > 0 ? (int)   args[0] : -1;
                const int   vel  = args.size() > 1 ? (int)   args[1] : 0;
                const bool  on   = args.size() > 2 ? (bool)  args[2] : false;
                if (note >= 0 && note < 128)
                    processorRef.pushGuiNote (note,
                                              juce::jlimit (0.0f, 1.0f, (float) vel / 127.0f),
                                              on);
                completion (juce::var());
            });

    relays.reserve ((size_t) kParamIds.size());
    for (const auto& id : kParamIds)
    {
        auto relay = std::make_unique<juce::WebSliderRelay> (id);
        options = options.withOptionsFrom (*relay);
        relays.push_back (std::move (relay));
    }

    web = std::make_unique<juce::WebBrowserComponent> (options);
    addAndMakeVisible (*web);

    // Attach each relay to its parameter (bidirectional, automation-correct).
    attachments.reserve ((size_t) kParamIds.size());
    for (int i = 0; i < kParamIds.size(); ++i)
    {
        if (auto* param = processorRef.apvts.getParameter (kParamIds[i]))
            attachments.push_back (
                std::make_unique<juce::WebSliderParameterAttachment> (*param, *relays[(size_t) i]));
    }

    web->goToURL (juce::WebBrowserComponent::getResourceProviderRoot());

    setResizable (true, true);
    setResizeLimits (900, 560, 1920, 1200);
    setSize (1180, 720);

    startTimerHz (30);
}

TractMirrorEditor::~TractMirrorEditor()
{
    stopTimer();
    attachments.clear();   // detach before relays/web are destroyed
    web.reset();
    relays.clear();
}

void TractMirrorEditor::resized()
{
    if (web != nullptr)
        web->setBounds (getLocalBounds());
}

// ----------------------------------------------------------------------------
// Resource provider: serve the embedded GUI. The provider root maps to "/".
// ----------------------------------------------------------------------------
std::optional<juce::WebBrowserComponent::Resource>
TractMirrorEditor::provideResource (const juce::String& url) const
{
    // Normalise: the root request arrives as "/"; serve index.html for it.
    juce::String path = url;
    if (path.startsWithChar ('/'))
        path = path.substring (1);
    if (path.isEmpty() || path == "index.html")
    {
        const auto* data = reinterpret_cast<const std::byte*> (BinaryData::index_html);
        std::vector<std::byte> bytes (data, data + BinaryData::index_htmlSize);
        return juce::WebBrowserComponent::Resource { std::move (bytes),
                                                     juce::String ("text/html") };
    }
    return std::nullopt;
}

// ----------------------------------------------------------------------------
// 30 Hz viz pump: read the seqlock snapshot, emit `tractFrame` (INTERFACE.md 3).
// ----------------------------------------------------------------------------
void TractMirrorEditor::timerCallback()
{
    if (web == nullptr)
        return;

    const TractFrame f = processorRef.getVizFrame();

    const int n = juce::jlimit (0, 64, f.n);
    const int nK = juce::jmax (0, n - 1);

    juce::Array<juce::var> areas, k, energies;
    areas.ensureStorageAllocated (n);
    energies.ensureStorageAllocated (n);
    k.ensureStorageAllocated (nK);
    for (int i = 0; i < n; ++i)  areas.add    ((double) f.areas[(size_t) i]);
    for (int i = 0; i < nK; ++i) k.add        ((double) f.k[(size_t) i]);
    for (int i = 0; i < n; ++i)  energies.add ((double) f.energies[(size_t) i]);

    auto* obj = new juce::DynamicObject();
    obj->setProperty ("n",        n);
    obj->setProperty ("areas",    areas);
    obj->setProperty ("k",        k);
    obj->setProperty ("energies", energies);
    obj->setProperty ("gate",     f.gate);
    obj->setProperty ("pitchHz",  (double) f.pitchHz);
    obj->setProperty ("rms",      (double) f.rms);
    obj->setProperty ("vx",       (double) f.vx);   // effective vowel pos (CC-aware)
    obj->setProperty ("vy",       (double) f.vy);

    web->emitEventIfBrowserIsVisible (juce::Identifier ("tractFrame"), juce::var (obj));
}
