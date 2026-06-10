#pragma once

#include <juce_gui_extra/juce_gui_extra.h>
#include <memory>
#include <vector>
#include "PluginProcessor.h"

// ============================================================================
// WebView editor. Hosts the embedded gui/index.html (three.js tract + lattice +
// control surface) via juce::WebBrowserComponent with native JUCE integration:
//
//   - one juce::WebSliderRelay per APVTS parameter (relay names = the 11 ids in
//     INTERFACE.md section 1), each driven by a WebSliderParameterAttachment so
//     GUI <-> host parameter sync is bidirectional and automation-correct;
//   - a resource provider that serves the embedded BinaryData GUI at the
//     provider root (index.html with text/html mime);
//   - a native function "noteEvent"(note, velocity, isOn) that the GUI preview
//     keyboard calls; it pushes onto the processor's lock-free note FIFO, drained
//     by processBlock into real MIDI note handling;
//   - a 30 Hz Timer that reads the seqlock viz snapshot and emits the
//     `tractFrame` event with the exact INTERFACE.md section 3 schema.
// ============================================================================
class TractMirrorEditor : public juce::AudioProcessorEditor,
                          private juce::Timer
{
public:
    explicit TractMirrorEditor (TractMirrorProcessor&);
    ~TractMirrorEditor() override;

    void resized() override;

private:
    void timerCallback() override;

    // Serve the embedded GUI for resource-provider requests.
    std::optional<juce::WebBrowserComponent::Resource> provideResource (const juce::String& url) const;

    // Broadcast a `wordState` event to the GUI (INTERFACE.md sec 6).
    void emitWordState (const juce::var& state);

    TractMirrorProcessor& processorRef;

    // One relay per parameter (ownership) + its parameter attachment.
    std::vector<std::unique_ptr<juce::WebSliderRelay>>               relays;
    std::vector<std::unique_ptr<juce::WebSliderParameterAttachment>> attachments;

    std::unique_ptr<juce::WebBrowserComponent> web;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (TractMirrorEditor)
};
