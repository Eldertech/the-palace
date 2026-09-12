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

## Honest cost / caveats
- **Not yet tried:** content editing (word swap) and enhancement/separation legs — the two I ran were paralinguistic + acoustic, chosen because they're the most checkable (duration is objective evidence). Worth a follow-up probe before promoting past stub.
- **Speaker identity fidelity unverified** — I didn't run a speaker-similarity check; the paper claims it's preserved under acoustic/paralinguistic edits but I haven't confirmed by ear or metric.
- **License:** unread. Confirm before any Piece-tier/published use — same discipline as the Image-to-3D commission.
- Host class: cloud-via-HF (free), same as other Shop probes; no GPU needed on our end.
- `AuK-Flash` variant (4-step, 4.5x faster) exists but untested — worth trying if latency matters for a real brief.

## Recommendation
Not a Specialist deposit yet — this is a first-pass Sketch probe, one session, two legs. Worth a second pass (content-editing leg + a license read) before proposing a stub entry. Flagging to Loudon now because the door is real and the bar was cleared, not because it's ready to promote.

## Files
- `source.wav`, `whisper_edit.wav`, `fast_edit.wav` — all in this folder.
