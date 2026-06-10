cmake_minimum_required(VERSION 3.22)
project(TractMirror VERSION 0.1.0)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ── JUCE via FetchContent ─────────────────────────────────────────────────────
include(FetchContent)

FetchContent_Declare(
    JUCE
    GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
    GIT_TAG        8.0.12
    GIT_SHALLOW    TRUE
)
FetchContent_MakeAvailable(JUCE)

# ── Binary data (GUI assets seam for three.js + embedded vowels.json) ─────────
# vowels.json is the single source of truth (tube constants + 64-pt area curves);
# it is embedded so the processor parses it once at construction. The resource
# symbol is BinaryData::vowels_json (named resource "vowels_json").
juce_add_binary_data(GuiAssets
    SOURCES
        gui/index.html
        ../reference/vowels.json
)

# ── Plugin target ─────────────────────────────────────────────────────────────
juce_add_plugin(TractMirror
    VERSION                     0.1.0
    BUNDLE_ID                   com.LoudonLive.TractMirror
    COMPANY_NAME                "Loudon Live"
    PRODUCT_NAME                "Tract Mirror"
    PLUGIN_MANUFACTURER_CODE    Loud
    PLUGIN_CODE                 Trkm
    FORMATS                     VST3 AU Standalone
    IS_SYNTH                    TRUE
    NEEDS_MIDI_INPUT            TRUE
    NEEDS_MIDI_OUTPUT           FALSE
    AU_MAIN_TYPE                kAudioUnitType_MusicDevice
    PLUGIN_AU_MAIN_TYPE         kAudioUnitType_MusicDevice
    EDITOR_WANTS_KEYBOARD_FOCUS FALSE
)

target_sources(TractMirror
    PRIVATE
        src/PluginProcessor.cpp
        src/PluginEditor.cpp
        src/TractEngine.cpp
)

target_include_directories(TractMirror
    PRIVATE
        src
)

target_compile_definitions(TractMirror
    PUBLIC
        JUCE_WEB_BROWSER=1
        JUCE_USE_CURL=0
        JUCE_VST3_CAN_REPLACE_VST2=0
)

target_link_libraries(TractMirror
    PRIVATE
        GuiAssets
        juce::juce_audio_utils
        juce::juce_dsp
        juce::juce_gui_extra
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags
)

# ── Render harness (console) ──────────────────────────────────────────────────
# Drives the REAL PluginProcessor::processBlock path to render the verification
# vowels and a listening melody. Links the same processor + engine sources.
juce_add_console_app(TractMirrorRender
    PRODUCT_NAME "TractMirrorRender"
)

target_sources(TractMirrorRender
    PRIVATE
        src/RenderHarness.cpp
        src/PluginProcessor.cpp
        src/TractEngine.cpp
)

target_include_directories(TractMirrorRender
    PRIVATE
        src
)

target_compile_definitions(TractMirrorRender
    PUBLIC
        JUCE_WEB_BROWSER=0
        JUCE_USE_CURL=0
        # The console app reuses the plugin's processor; give it the JucePlugin_*
        # identifier the AudioProcessor base expects (getName()).
        JucePlugin_Name="Tract Mirror"
)

target_link_libraries(TractMirrorRender
    PRIVATE
        GuiAssets
        juce::juce_audio_utils
        juce::juce_dsp
        juce::juce_gui_extra
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_warning_flags
)
