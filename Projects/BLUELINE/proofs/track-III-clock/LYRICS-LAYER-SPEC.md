# BLUELINE — Lyrics Layer (spec)

> **▸ FOLDED INTO [[BLUELINE — Text Layer]] (2026-06-24).** Lyrics is **rung 1** of the broader text layer
> (dialogue · narration · voiceover · lyrics · signage · described sound) — *the song's voice*, the first of
> four curated lettering voices. Read the umbrella entry for the taxonomy, the in/out-of-frame grammar, the
> keypoint-anchored balloons, and the `TEXT[]` schema. **Two reconciliations since 2026-06-17:** (1) the
> scanner now namespaces by **host track name**, so the track is named **`Lyrics`** and emits **`/Lyrics/*`**
> (not the old `ns=lyrics`/`/lyrics/*` menu); read it with `?track=Lyrics`. (2) The render home is now the
> **animatic player** (`proofs/animatic/animatic.html`), not the M2 player. This card stays the detailed
> rung-1 build; the proof lives at `proofs/lyrics-layer/`.

> **What this is (2026-06-17).** A spec for rendering **words on screen in time with the music**, driven by
> a **separate MIDI track** in Ableton — the same "named MIDI clips on the device's own track" pattern the
> sections and storyboard already use ([[LIVE-CLOCK-LOOP-SPEC]]). Lyrics are not a new clock — they are a
> third **scanner** namespace (`/lyrics/*`) plus a render layer in the comic register. Determinism is
> inherited: a word's onset beat maps to an exact frame, so words land on the beat the same way panels do.

The design principle, carried from [[Adopt the Craft, Author the Seam]]: the **author writes lyrics the way
they already write sections** — as clips on a track, timed by ear against the song — and the system reads
them. No lyric-timing UI to invent; Ableton's arrangement *is* the timing editor.

---

## 1. The data model — two tiers of timing

**Tier 1 — LINE level (clip name = the line).** One named MIDI clip per lyric line on the LYRICS track.
The clip *name* is the line text; the clip's **start** is when the line appears; the clip's **length** is
how long it holds before it clears. This reuses the scanner verbatim (`namespace = lyrics`) — a line is a
span, exactly like a section. This tier alone gives subtitle-style, beat-aligned line display.

**Tier 2 — WORD level (notes inside the clip = word onsets, optional).** For karaoke-style per-word reveal
or highlight, put **MIDI notes inside the line clip** — one note per word, in reading order; each note's
**start** is that word's onset. The words come from splitting the clip name on spaces (note *i* → word
*i*); if counts mismatch, the client falls back to even spacing across the line span. Pitch/velocity are
ignored — only **onset order + time** matter. (A producer who only wants line-level display simply leaves
the clips empty of notes; Tier 2 is purely additive.)

Why notes for words rather than one-clip-per-word: a *line* is the legible unit to author and to read, and
keeping a line as one clip (with its words as interior notes) means you reposition or restretch a whole
line as one object while word timing rides along — the same reason sections are spans, not points.

---

## 2. The wire (`/lyrics/*` — a scanner namespace)

Emitted by the SCANNER device with `namespace = lyrics` ([[LIVE-CLOCK-LOOP-SPEC]] §2), one-shot + deferred:

```
/lyrics/scan      count:int                                          # number of lines
/lyrics/line      idx:int  start:float(beats)  length:float(beats)  text:string
/lyrics/word      line_idx:int  word_idx:int  start:float(beats)  text:string   # Tier 2 only, 0+ per line
/lyrics/scan_end
```

- Line-level needs only `/lyrics/scan · /lyrics/line×N · /lyrics/scan_end` (the scanner's default path —
  `scanner.js` already emits `/lyrics/line idx start length text` when `ns=lyrics`).
- Word-level adds `/lyrics/word` messages between the lines and `scan_end` (a small extension to
  `scanner.js`: after each clip, read `clip.get("notes_dict")`/`get_notes_extended`, sort by `start_time`,
  split the clip name into words, and emit one `/lyrics/word` per note). Keep word `start` in **beats**.
- Display timing is then driven entirely by the **existing `/transport/beat` stream** — the client knows
  the current beat and shows the line whose span contains it, revealing words whose onset beat has passed.
  No new transport messages; lyrics ride the clock that already exists.

---

## 3. Determinism (inherited, not re-proven)

A line/word onset is a beat position; `(bar,beat)→frame = beat·frames_per_beat` is exact at a locked
tempo/fps (the [[BLUELINE — Board Record Schema]] determinism rule). So:

- A line **appears on a whole frame** and **clears on a whole frame** (its `start+length`).
- A word **highlights on a whole frame**.
- An offline render burns each word in at its exact frame; live playback samples the same function. Lyrics
  are therefore **sync-addressable** like rendered shots — the mux lands them with no manual alignment.

The lyrics layer passes the same `drawLyrics(F)`-is-a-pure-function-of-the-frame test M2 established for
motion: text reveal is a function of the playhead, never wall-clock.

---

## 4. The render — words in the comic register

Lyrics render as a **layer over the panel** (in the M0/M1/M2 player today; later, optionally burned into
the rendered frame). It is a *render-only* layer: it never touches the board record's conditioning keypoints
(staging stays lossless, per the M2 invariant).

**Typography (Loudon Live skin, no new fonts):**
- **Display line** — Anton (the display face) for a punched, comic-lettering feel; or Cormorant for a
  softer lyric register. Per-project choice; default Anton, uppercase, tight tracking.
- **Caption register** — reuse the M1/M2 `captionBox` grammar (bordered box, JetBrains-Mono lead) when
  lyrics sit as a subtitle; reuse `section` lettering (bottom corner Anton) when they sit as kinetic
  emphasis. The lyrics layer is a *new use of existing comic primitives*, not a new look.

**Placement modes** (a per-line or per-project field): `lower-third` (subtitle), `kinetic` (large, centered,
on the beat), `caption` (the bordered box), `none` (instrumental — clip with empty name). Default
`lower-third`.

**Reveal animation (beat-locked):**
- Line **in**: fade/slide in on the line's start beat; a pulse on the downbeat (reuse the `pulse()` border).
- Word **highlight** (Tier 2): the current word brightens to `--amber` as its onset beat passes; past words
  stay `--ink`, future words sit dim (`--dim`) — a karaoke read that is *also* a legibility cue for which
  word the music is on.
- Line **out**: clears at `start+length` (or holds to the next line if `length` overruns).

All reveal parameters are pure functions of `beatPhase` (= playhead/frames_per_beat), so motion-off freezes
them cleanly, exactly like M2's motion terms.

---

## 5. Board-record integration

Add an optional layer to the BIBLE/board record so the render side can burn lyrics later:

```
# === BIBLE ===
LYRICS_TRACK: "Lyrics"        # the named track the scanner reads (provenance; placement is the real config)
LYRICS_STYLE: kinetic         # default placement/typography mode for the film
# === per line (a lyrics record, sibling to the board record) ===
LINE: { idx, start_beat, length_beats, bar, beat, frame, text, place, words:[{w, start_beat, frame}] }
```

The lyrics record is the **same shape philosophy** as the board record — everything except the pixels,
carrying a beat so the render is an instrument. It is its own object (one per line) so it parallelizes with
the board record; the only shared field is the clock (`frame`), which both derive from the same `(bar,beat)`.

---

## 6. Proof plan (smallest useful test)

A `lyrics-layer/` proof (next rung when built):
1. A `lyrics_scan_sim.py` (clone of `clip_scan_sim.py`) emitting `/lyrics/*` for a verse — proves the wire
   without Ableton, exactly as `clip_scan_sim` did for the board.
2. A lyrics overlay added to the M2 player (or a standalone `lyrics-demo.html` reusing the M2 clock
   plumbing): scan → lines with word onsets → beat-locked reveal in the comic register. Verify in-browser
   that words reveal on whole frames at 72/120/180 BPM (the beat-lock stress test, applied to text), and
   that motion-off freezes the reveal.
3. Live: drop the SCANNER (ns=lyrics) on the LYRICS track; type lyric clips; scan; watch words ride the
   live clock.

**Ships to the palace:** a beat-locked **lyric/subtitle layer** for any music-synced visual (reusable
beyond BLUELINE), and the "lyrics authored as MIDI clips" pattern — the producer writes words on a track and
they become deterministic on-screen text.

## 7. Open questions

- **Word timing source:** notes-inside-the-clip (Tier 2, authored) vs. even-spacing across the line span
  (automatic) vs. forced-alignment from a vocal stem (Whisper word-timing, like the Shop's "Narrated Beats"
  recipe). Notes give exact authored control; Whisper would auto-time to a real vocal. Start with notes;
  revisit Whisper-alignment when there is a sung stem.
- **Render burn-in vs. overlay:** keep lyrics a front-end overlay (cheap, editable) or also burn them into
  rendered frames for export? Overlay first; burn-in is an ffmpeg/mux step (Stage 7) when needed.
- **Multi-line / call-and-response:** one active line, or stacked lines for overlapping vocals? Single line
  first; stack when a song needs it.
