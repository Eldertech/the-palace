#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include <atomic>
#include <array>
#include <vector>
#include "TractEngine.h"

// ============================================================================
// Lock-free visualization snapshot (DSP -> editor). Sequence-counter double
// buffer: the audio thread writes into the inactive slot, bumps an even/odd
// sequence; the editor reads the slot whose sequence is stable across a read.
// Fields mirror INTERFACE.md section 3 (event `tractFrame`).
// ============================================================================
struct TractFrame
{
    int   n = 0;
    std::array<float, 64> areas {};     // current morphed areas, cm^2 (n used)
    std::array<float, 64> k {};         // interior reflection coeffs (n-1 used)
    std::array<float, 64> energies {};  // per-section energy 0..1 (n used)
    bool  gate = false;
    float pitchHz = 0.0f;
    float rms = 0.0f;
    float vx = 0.5f;    // effective vowel position incl. CC modulation (0..1)
    float vy = 0.45f;
};

class VizPublisher
{
public:
    // Audio thread (single writer). Seqlock over a double buffer: each publish
    // writes the slot the current sequence does NOT mark active, then advances
    // the sequence by 2 (parity even -> even). The odd interim value tells a
    // concurrent reader "write in progress, retry".
    void publish (const TractFrame& f)
    {
        const uint32_t seq = sequence.load (std::memory_order_relaxed);
        const int writeSlot = ((seq >> 1) & 1u) ^ 1;        // the inactive slot
        sequence.store (seq + 1, std::memory_order_release); // -> odd: in progress
        buffers[(size_t) writeSlot] = f;
        std::atomic_thread_fence (std::memory_order_release);
        sequence.store (seq + 2, std::memory_order_release); // -> even: done; active slot flips
    }

    // Editor thread (reader). Retries if a write was in progress.
    TractFrame read() const
    {
        for (int attempt = 0; attempt < 16; ++attempt)
        {
            const uint32_t s1 = sequence.load (std::memory_order_acquire);
            if (s1 & 1u) continue;                          // write in progress
            const int activeSlot = (int) ((s1 >> 1) & 1u);
            TractFrame f = buffers[(size_t) activeSlot];
            std::atomic_thread_fence (std::memory_order_acquire);
            const uint32_t s2 = sequence.load (std::memory_order_acquire);
            if (s1 == s2)
                return f;
        }
        return buffers[0];
    }

private:
    std::array<TractFrame, 2> buffers {};
    std::atomic<uint32_t> sequence { 0 };
};

class TractMirrorProcessor : public juce::AudioProcessor,
                             private juce::AsyncUpdater
{
public:
    TractMirrorProcessor();
    ~TractMirrorProcessor() override;

    // ── AudioProcessor interface ──────────────────────────────────────────────
    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;

    void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return JucePlugin_Name; }

    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int) override {}
    const juce::String getProgramName(int) override { return {}; }
    void changeProgramName(int, const juce::String&) override {}

    void getStateInformation(juce::MemoryBlock& destData) override;
    void setStateInformation(const void* data, int sizeInBytes) override;

    // ── APVTS — exposed so the editor (and later real DSP) can reach it ────────
    juce::AudioProcessorValueTreeState apvts;

    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

    // ── Visualization read (editor polls from a Timer) ────────────────────────
    TractFrame getVizFrame() const { return viz.read(); }

    // ── GUI preview-keyboard note injection ───────────────────────────────────
    // The editor's "noteEvent" native function pushes here from the message
    // thread; processBlock drains it on the audio thread. Single-producer /
    // single-consumer, fixed capacity, allocation-free on the audio thread.
    // A dropped event under flood is acceptable for a preview keyboard.
    void pushGuiNote (int midiNote, float velocity, bool isOn) noexcept
    {
        const int w = guiNoteWrite.load (std::memory_order_relaxed);
        const int next = (w + 1) % kGuiNoteCap;
        if (next == guiNoteRead.load (std::memory_order_acquire))
            return;                                   // full -> drop (preview only)
        guiNotes[(size_t) w] = { midiNote, velocity, isOn };
        guiNoteWrite.store (next, std::memory_order_release);
    }

    // ── Analysis tap (render harness / verification gate) ─────────────────────
    // Tract impulse response on the current morphed areas, radiation OFF - the
    // reference analysis path whose spectral peaks are the exact tract poles.
    void renderTractImpulseResponse (std::vector<float>& dst, int numSamples) const
    {
        engine.renderImpulseResponse (dst, numSamples);
    }

    // Force the tract to one pure anchor (0..5 = i,e,schwa,u,o,a) for analysis.
    void forcePureAnchor (int anchorIndex) { engine.forcePureAnchor (anchorIndex); }

private:
    TractEngine engine;
    VizPublisher viz;

    // Cached atomic param pointers (resolved once at construction).
    std::atomic<float>* pVowelX    = nullptr;
    std::atomic<float>* pVowelY    = nullptr;
    std::atomic<float>* pTension   = nullptr;
    std::atomic<float>* pBreath    = nullptr;
    std::atomic<float>* pGlide     = nullptr;
    std::atomic<float>* pVibRate   = nullptr;
    std::atomic<float>* pVibDepth  = nullptr;
    std::atomic<float>* pAttack    = nullptr;
    std::atomic<float>* pRelease   = nullptr;
    std::atomic<float>* pBright    = nullptr;
    std::atomic<float>* pGain      = nullptr;
    std::atomic<float>* pCcX       = nullptr;  // assignable MIDI CC number for vowelX
    std::atomic<float>* pCcY       = nullptr;  // assignable MIDI CC number for vowelY

    int    vizSampleCounter = 0;
    int    vizInterval = 800;      // recomputed in prepareToPlay for ~60 Hz
    TractFrame vizScratch;

    // GUI preview-keyboard note FIFO (SPSC, fixed capacity).
    struct GuiNote { int note; float velocity; bool isOn; };
    static constexpr int kGuiNoteCap = 64;
    std::array<GuiNote, kGuiNoteCap> guiNotes {};
    std::atomic<int> guiNoteWrite { 0 };
    std::atomic<int> guiNoteRead  { 0 };

    void drainGuiNotes();

    // ── MIDI-CC -> vowel arbitration (last-writer-wins between pad and CC) ─────
    // The audio thread sets a per-axis CC target and latches "CC owns this axis";
    // it then asks the message thread (AsyncUpdater) to push the value to the host
    // parameter via setValueNotifyingHost (NEVER called on the audio thread). Pad/
    // automation takeover is detected by the host param diverging from the value
    // CC last wrote. coalesced: the audio thread overwrites the pending target and
    // re-triggers; the message thread always reads the latest.
    bool   ccOwnsX = false;
    bool   ccOwnsY = false;
    float  ccTargetX = 0.5f;        // CC-driven vowelX (0..1), audio thread
    float  ccTargetY = 0.45f;       // CC-driven vowelY (0..1), audio thread
    float  ccLastPushedX = -1.0f;   // last value handed to the host param (X)
    float  ccLastPushedY = -1.0f;   // last value handed to the host param (Y)
    float  prevPadX = -1.0f;        // host vowelX param seen last block (change detect)
    float  prevPadY = -1.0f;        // host vowelY param seen last block

    // Cross-thread mailbox for the async host-param push (coalesced, lock-free).
    std::atomic<float> pendingHostX { -1.0f };  // <0 => nothing pending on X
    std::atomic<float> pendingHostY { -1.0f };
    void handleAsyncUpdate() override;          // message thread: setValueNotifyingHost

    void loadVowelsFromBinaryData();
    void pullParams();
    void publishViz();

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(TractMirrorProcessor)
};
