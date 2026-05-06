# Local Hardware Profile

*Seed started 2026-05-05 from the maker-architecture conversation. Meant to grow with each new specialist installed.*

This document is read by the Coordinator before dispatching workers. It records what local generative-model specialists are installed on Loudon's primary machine, their compute requirements, and the cloud upgrade paths they punt to.

## Apple Silicon Mac (Loudon's primary)

### Speech (TTS)

- **Kokoro (ONNX)** — already installed, used by [[Talking Keyboard]] and [[Phoneme Choir]]. Lives at `/Users/loudonstearns/documents/TTS/`. ~few hundred MB. CPU/MPS. English well, multilingual partial, singing not at all.

### Music

- **MusicGen (Meta, via AudioCraft)** — install via `pip install audiocraft`. Model sizes: small ~300MB, medium ~1.5GB, large ~3.3GB. Apple Silicon supported via MPS. Best for instrumental sketches; weak on songs with lyrics.
- *Cloud upgrade:* **Suno** for songs with vocals — manual copy-paste workflow. Specialist that wants song-with-lyrics output should emit a Suno-shaped prompt as its text artifact.

### SFX / Environmental

- **AudioGen (Meta, via AudioCraft)** — same install as MusicGen. Designed specifically for environmental and SFX content (cathedral interiors, forest ambience, mechanical sounds, etc.). MPS supported.
- *Alternative:* **Stable Audio Open** (Stability AI) — handles both music and SFX, lighter footprint than AudioCraft. Worth comparing once both are installed.

### Image

- **Stable Diffusion via HuggingFace Diffusers** — install via `pip install diffusers transformers accelerate`. MPS backend supported. **SDXL Lightning** (4-step, fast) is the lower-quality fast option; matches "lower quality I can update later" preference.
- *Cloud upgrade:* **Midjourney** for higher-quality concept art — manual copy-paste workflow.

### Diagrams (no AI)

- **Mermaid** — renders inline in Obsidian, no install needed. Use for relational diagrams.
- **Graphviz** — `brew install graphviz`. Use for heavier topology / dependency graphs.
- **Excalidraw** — for hand-drawn-feel spatial diagrams.

### Math figures, data viz, algorithmic art

- **matplotlib, plotly, p5.js** — already in Loudon's stack. Data is the truth — no AI generation here.

## Manifest implications

Specialists carrying these tools should declare on their manifests:

- **Compute requirement** — RAM headroom needed at inference, VRAM if applicable, approximate seconds per output.
- **Co-scheduling constraints** — `parallel_safe: false` for memory-incompatible workers (e.g., two simultaneous SDXL instances on this machine would OOM).
- **Cloud upgrade target** — the hosted tool the specialist's text artifact would punt to (e.g., kokoro-maker → ElevenLabs; musicgen-maker → Suno; sdxl-maker → Midjourney) so the Producer can offer the upgrade as an alternative in its option-set.

## Open questions

- Should the Coordinator track "RAM in use across all workers" as a global state and serialize dispatch when above a threshold? Yes for local-model workers, irrelevant for cloud-call workers.
- When a local model produces output the Director rejects, should the Producer's "alternatives" automatically include a same-prompt cloud-upgrade emission? Probably yes, but only when the specialist's manifest declares an upgrade target.
- How does this profile stay in sync with what's actually installed? Manual edit per install, with periodic verification?
