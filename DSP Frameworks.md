---
title: DSP Frameworks
type: hub
pillars:
  - tools
  - practice
  - creation
born: 2026-03
last_activated: 2026-03
activation_count: 1
stage: growing
confidence: demonstrated
energy: high
hook_quality: 7
beauty: 6
who_leads: loudon
links:
  - target: "[[FOUR PILLARS]]"
    type: enables
  - target: "[[Biomechanical Synthesis]]"
    type: connects-to
  - target: "[[Action Potential Oscillator]]"
    type: connects-to
  - target: "[[JSUI]]"
    type: connects-to
  - target: "[[Preset Oracle]]"
    type: connects-to
---

# DSP Frameworks: A Decision Tree for Rapid Iteration

![[DSP Frameworks — hero.png]]

A hub for choosing the right digital signal processing framework based on your specific goal, constraints, and alignment with the four pillars.

## The Problem: Max/MSP Iteration Speed

Max/MSP is brilliant for visual patching and real-time exploration. But it has a structural mismatch with LLM-assisted development: Claude can generate code faster than you can wire boxes. The visual paradigm is powerful for interactive discovery, but it becomes a bottleneck when the goal is rapid iteration of algorithmic ideas alongside a collaborator.

For Loudon's workflow — where each instrument is simultaneously a teaching artifact, a performance tool, and an exploration of the four pillars — the development framework needs to support:

1. **Fast code-to-plugin cycles** (minutes, not hours)
2. **Beautiful, meaningful interfaces** that teach as well as control
3. **Git-based process documentation** (the commit history IS the pedagogy)
4. **Open-source philosophy** without licensing entanglement
5. **Cross-platform VST3 export**

Max/MSP doesn't fail on any single criterion, but the combination creates friction.

## Framework Taxonomy

### Faust

**What:** A functional DSP language that compiles to C++, WebAssembly, RNBO, Max/MSP gen~, VST, AU, and more. Code is declarative and mathematical.

**Strengths:**
- Extremely fast prototyping of DSP algorithms
- `par()` primitive for parallel processing
- Compiles to nearly any target
- Mathematically expressive (closer to how DSP is described in literature)
- Active community, good documentation

**Weaknesses:**
- Steeper learning curve for those without functional programming background
- Less interactive exploration (code → compile → test cycle)
- GUI building is minimal (requires external UI framework for polished interfaces)

**Best for:** Mathematical DSP prototyping, algorithmic synthesis, rapid algorithm development

**Licensing:** GPL-like (with exceptions for exported code). Check carefully for your use case.

### Gen~

**What:** Max/MSP's compiled DSP sublanguage. Write signal-rate algorithms as text, compile within Max.

**Strengths:**
- Familiar to existing Max users
- Fast compared to Max patching
- Direct integration with Max ecosystem
- Good for signal processing chains

**Weaknesses:**
- Bound to Max ecosystem (no standalone VST export without additional tooling)
- Slower than Faust for complex algorithms
- Less mathematical expressivity than Faust

**Best for:** Max-centric workflows, when you want DSP speed without leaving Max

### RNBO

**What:** Cycling '74's export-to-anywhere system. Write in Max, export to VST3/AU, Max externals, RNBO runtime.

**Strengths:**
- Write in familiar Max patching environment
- Export to multiple targets from one source
- Strong Cycling '74 support
- Visual programming remains an option

**Weaknesses:**
- Still carries Max's visual-first paradigm (slow iteration with LLM collaboration)
- Licensing complexity (RNBO runtime itself is proprietary)

**Best for:** Teams already deep in Max/MSP who need plugin export

### Web Audio API + Canvas/WebGL

**What:** Browser-based DSP with JavaScript. Combine with Canvas or WebGL for interfaces.

**Strengths:**
- Your native tongue (you're fluent in Canvas, WebGL, SVG)
- Interface and DSP are in the same codebase (no separation, no context switching)
- Cross-platform (any browser)
- Excellent for interactive demos and teaching artifacts
- Can be wrapped as Electron or web-based app
- Tone.js library simplifies common tasks

**Weaknesses:**
- Audio latency is higher than native plugins (browser overhead)
- Not suitable for ultra-low-latency live performance or recording
- Harder to integrate with a DAW (though browser-to-DAW bridges exist)

**Best for:** Educational tools, interactive demos, performance art installations, non-DAW contexts


---

## Decision Tree for Loudon

**Q1: What's the end product?**

| If...                                  | Then...                             |
| -------------------------------------- | ----------------------------------- |
| Standalone VST3 plugin                 | Faust                               |
| Max patch that others will use         | Gen~ or Max patching                |
| Web-based interactive tool             | Web Audio + Canvas/WebGL            |
| Educational teaching artifact          | Web Audio                           |
| Live performance instrument (DAW-less) | Web Audio + custom hardware control |
| Algorithmic composition piece          | Faust                               |

**Q2: How important is iteration speed?**

- **Speed critical** (LLM collaboration, rapid experiments): Faust or Web Audio
- **Speed secondary** (careful design, performance matters): JUCE
- **Speed unimportant** (one-off projects, learning): Any framework

**Q3: How important is the interface?**

- **Interface IS the instrument** (visual feedback, pedagogy): Web Audio + Canvas/WebGL
- **Interface is secondary** (headless DSP, analysis tools): Faust or Csound
- **Interface is important but separate** (knobs and displays): Faust + JUCE UI or RNBO

**Q4: What's your preferred working language?**

- **JavaScript/TypeScript**: Web Audio
- **Functional programming**: Faust
- **Familiar Max environment**: RNBO or Gen~
- **Maximum control, C++**: JUCE
- **Mathematical expressivity**: Faust or Csound

---

## The Insight: Plugin as Teaching Artifact

Here's Loudon's core realization: **Every plugin is simultaneously an instrument AND a teaching artifact.**

When you build a neural synthesizer, you're not just creating a tool to make sounds. You're encoding:
- How a neuron works (the DSP)
- How to *think* about a neuron as an oscillator (the interface)
- How to *build* from first principles (the code and Git history)
- How to *play* it expressively (the control surface and performance gesture)

This means the framework choice directly affects how well you can teach.

**Web Audio + Canvas is the fastest path to this vision** because:
1. The DSP code and the visual interface are in the same file (no artificial separation)
2. The code is human-readable (JavaScript, not compiled binaries)
3. The Git history is pure text (every change is visible and commentable)
4. The rendering pipeline is yours to control (Canvas/WebGL/SVG can show *anything*)
5. The entire artifact can be shared as a single HTML file or repository

This aligns with your four pillars: the **technology** (Web Audio DSP), the **music** (synthesis algorithms and parameter control), the **philosophy** (how you think about the instrument's conceptual structure), and the **practice** (how you play it, what it teaches).

---

## Faust → VST3: The Recommended Path for Plugin Development

If your goal is a **production VST3 plugin** that can be used in any DAW, the Faust → VST3 pipeline is optimal:

1. **Prototype the DSP in Faust** (fast, mathematically clear)
2. **Build the UI separately** using Web technologies (Canvas/WebGL) or custom C++ (JUCE)
3. **Export to VST3** via Faust's VST3 target or wrap in JUCE

For Loudon's NeuroPulse project (a single-neuron synthesizer):
- Faust handles the integrate-and-fire DSP (recursive feedback, threshold detection)
- JUCE or Web components handle the oscilloscope display and parameter interface
- VST3 export delivers the plugin to any DAW

---

## Open Questions

- **Hybrid workflows:** Can you prototype in Faust, then selectively migrate performance-critical sections to JUCE for a production build?
- **Interface-first design:** If you start with Web Audio + Canvas for pedagogy, how do you "graduate" to a VST3 plugin without rewriting?
- **LLM collaboration at scale:** Which framework makes it easiest for an LLM to generate large, correct DSP code?
- **Live performance without DAWs:** How would a Web Audio instrument connect to hardware controllers and external effects?

---

<!-- CLAUDE → LOUDON: This hub is decision-support infrastructure. It maps frameworks to goals, not just to features. The key insight — plugin as teaching artifact — deserves its own entry or deep exploration. Consider linking from individual project entries (NeuroPulse, Biomechanical Synthesis, etc.) to this hub so the framework choice is documented for each. The Four Pillars alignment is central here; each framework enables different pillar combinations. -->
