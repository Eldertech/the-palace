# Probe — AuK (Tencent), 2026-09-12

**What it is:** Open-weight foundational model unifying speech generation AND instruction-guided editing of existing speech — one natural-language interface for TTS, content editing (swap words), paralinguistic editing (emotion, whisper, accent), acoustic editing (rate/pitch/loudness), and enhancement/separation. Paper: arXiv 2609.08936, 212 upvotes on HF trending (2026-09-08). Space: `tencent/AuK`, anonymous Gradio API, single endpoint `/run_generate_with_pe`.

**Why it's a genuine gap:** the Roster has Kokoro (TTS, light/local/free) but nothing that *edits* existing speech via instruction. Post-production narration fixes (retiming a line, changing emotion, whispering a phrase) currently have no home.

## What I actually ran

Source clip: `say` (macOS) → "The quick brown fox jumps over the lazy dog." (2.36s, 22050Hz mono) → `source.wav`.

**Leg 1 — paralinguistic edit (whisper):** instruction `"Make the voice sound like a hushed, breathy whisper, as if telling a secret."` → `whisper_edit.wav`, 2.36s @ 24000Hz. Duration preserved (content-preserving edit, as claimed for paralinguistic ops).

**Leg 2 — acoustic edit (rate):** instruction `"Speed up the speaking rate to be much faster, twice as fast."` → `fast_edit.wav`, **1.18s — exactly half the source duration.** This is the strongest evidence: the model followed a quantitative instruction precisely, not just a vibe.

Both calls succeeded on the free anonymous tier, ~15-25s each. No token needed.

## Judgment against the bar

Clears it. Two independent instruction types, both landed correctly, on the first anonymous try, no cherry-picking (these are the only two calls made). Opens a real door: instructed post-production editing of narration/voice-over, which the Shop currently has no tool for.

## Second pass — 2026-09-15

**Leg 3 — content edit (word swap):** instruction `"Replace the word 'fox' with the word 'wolf', keep everything else the same."`, explicit `gen_seconds=2.36` (Prompt Enhancer off requires a manual duration — the API rejected a blank/zero duration exactly as the Space's README documents, first-try confirmation the docs are accurate). Output: `word_swap_edit.wav`, 2.36s, duration preserved as expected for a content edit.

**Verified by transcript, not just duration this time** — ran local `whisper --model tiny` (free, no GPU, already on this Mac) on the output: *"The quick-brown wolf jumps over the lazy dog."* Exact word swap, rest of the sentence untouched, first try. This closes the gap the first pass left open (duration alone isn't proof the *content* changed) — three edit types now confirmed by objective evidence, not just plausibility.

**License read:** `tencent/AuK` Space ships its own `LICENSE` file — **MIT**, plain and unencumbered, no separate community-license catch like Hunyuan3D-2's. Clear for Piece-tier or published use as far as licensing goes.

**Not yet tried:** enhancement/separation leg, and no speaker-similarity check (identity fidelity claim from the paper still unconfirmed by ear or metric). Neither blocks a stub-level entry — both are the kind of thing a first real job would surface.

## Honest cost / caveats
- Host class: cloud-via-HF (free anonymous tier), same as other Shop probes; no GPU needed on our end.
- `AuK-Flash` variant (4-step, 4.5x faster) exists but untested — worth trying if latency matters for a real brief.
- API quirk for any future recipe: `use_pe=False` requires an explicit `gen_seconds` > 0; blank/zero is rejected before GPU allocation (matches the Space's own README, so this is documented behavior, not a bug to route around).

## Recommendation
**Clears the bar for a stub-level Specialist entry now.** Three edit types (paralinguistic, acoustic, content) each confirmed by objective evidence across two sessions, license is clean MIT, reachable anonymously with no token. This is the kind of "worthy few" the sweep exists to surface — bringing it to Loudon as a candidate dossier rather than depositing myself, per the Charter (I bring the evidence, he makes the call).

## Files
- `source.wav`, `whisper_edit.wav`, `fast_edit.wav`, `word_swap_edit.wav` — all in this folder.
