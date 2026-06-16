---
title: ffmpeg — Test Plan
born: 2026-05-30
links:
  - { target: "[[ffmpeg]]", type: connects-to, label: test-plan-for }
forward_vector: "I hold the test plan for ffmpeg; I want every check here runnable with an honest last-run date."
---

# ffmpeg — Test Plan

> Phase E rollout of `Shop/Maker/_TEMPLATE/test-plan.md`. ffmpeg is the Shop's connective tissue — encode, decode, mux, concat, normalise. Smoke is encode-and-decode; the load-bearing probe is **byte-deterministic** output under `-fflags +bitexact -flags +bitexact -map_metadata -1`, since ffmpeg is the only Specialist downstream-everything depends on for reproducibility of derived clips.

Last run: **2026-05-30** — Smoke + Determinism both pass (byte-identical SHA256 across two `testsrc` runs).

## Smoke

Encode a one-second test pattern, confirm a non-empty MP4.

```sh
ffmpeg -y -loglevel error -f lavfi -i "testsrc=duration=1:size=320x240:rate=15" \
  -fflags +bitexact -flags +bitexact -map_metadata -1 /tmp/ffmpeg-smoke.mp4
test -s /tmp/ffmpeg-smoke.mp4 && echo "OK"
```

- **Automated:** as above. Pass = file exists, non-empty (~8 KB).
- **Last run (2026-05-30):** 8.0 KB MP4 produced, OK.

## Capability Probe

The Shop relies on ffmpeg for four jobs; each must work on the canonical Mac:

| Job          | Command sketch                                                              | Last run                                          |
|--------------|------------------------------------------------------------------------------|----------------------------------------------------|
| Mux a/v      | `ffmpeg -i silent.mp4 -i narration.wav -c:v copy -c:a aac -shortest out.mp4` | Phase B narrated-beats.mp4 mux (2026-05-30) — OK   |
| Concat       | `ffmpeg -f concat -safe 0 -i list.txt -c copy out.mp4`                       | Kuramoto Round 1 teaching reel (2026-05-26) — OK   |
| Loudnorm     | `ffmpeg -i in.wav -af loudnorm=I=-16:TP=-1:LRA=11 out.wav`                   | Kokoro `narrations-study.py` pass (2026-05-26)     |
| Re-encode HEVC| `ffmpeg -i in.mp4 -c:v libx265 -preset slow out.mp4`                        | Not exercised this round — claim unverified        |

- **Last run (2026-05-30):** three of four exercised; HEVC marked unverified.

## Style Probe

ffmpeg is plumbing — no aesthetic style to honour. The Style Probe is degenerate; mark *N/A* and move on.

## Edge Probe

ffmpeg has many failure modes. Confirm two surface as warnings, not silent drops:

- **Missing input:** `ffmpeg -i nonexistent.wav out.wav` → exits non-zero with `No such file or directory`. ✓
- **Codec mismatch on `-c copy`:** `ffmpeg -i in.mp4 -c:v libx264 -c copy out.mp4` → exits non-zero with codec-conflict error. Manual probe only.

- **Last run (2026-05-30):** missing-input probe automated, error message clean.

## Speed Bench

Reference host: **mac**.

| Job                                       | Time     |
|--------------------------------------------|----------|
| 1 s testsrc encode (libx264, -preset ultrafast)         | < 0.2 s  |
| Phase B 10 s `-c:v copy -c:a aac` mux     | 0.17 s   |
| Kuramoto `loudnorm` two-pass, 36 s WAV    | ~2 s     |

The plumbing isn't the bottleneck in any real Shop job.

## Determinism (load-bearing)

ffmpeg defaults are **not** deterministic — output embeds timestamps, encoder strings, container metadata. With `-fflags +bitexact -flags +bitexact -map_metadata -1` the output is byte-identical run-to-run on the same ffmpeg version.

```sh
for i in 1 2; do
  ffmpeg -y -loglevel error -f lavfi -i "testsrc=duration=1:size=320x240:rate=15" \
    -fflags +bitexact -flags +bitexact -map_metadata -1 /tmp/ff-$i.mp4
done
shasum -a 256 /tmp/ff-{1,2}.mp4 | awk '{print $1}' | sort -u | wc -l   # expect 1
```

- **Reproducibility artifact:** the full ffmpeg invocation string (binary + version + every flag) saved in the standards JSON of the dependent job.
- **Last run (2026-05-30):** both runs hashed to `70cdc22dc0882d848bbaa80fbf45d80562093de12794ef673cf8055079b40172` — identical.
