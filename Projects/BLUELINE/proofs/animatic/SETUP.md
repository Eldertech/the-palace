# BLUELINE — Animatic · setup card

The rendered-board animatic: the 6 storyboard boards sequenced in time on the live Track-III clock.
Two layers — **timing** (Ableton clip position + length) and **content** (clip name + `board-records.json`).
The music leads; the boards follow.

## 1 · Run the bridge (Mac, no GPU)

```
_tools/ComfyUI/venv/bin/python Projects/BLUELINE/proofs/track-III-clock/osc_ws_relay.py
```
Then open **http://127.0.0.1:8770/animatic**  (defaults to the `Boards` track; override with `?track=Name`).
Standalone preview without Ableton: `▶ self-play` button, or serve the folder and open `animatic.html`.

## 2 · The Ableton Set

| Track | Holds | Device | Emits |
|---|---|---|---|
| any (e.g. `Clock`) | the transport | **Blueline Transport 1.0** (MASTER, one per Set) | `/transport/bible` (tempo,fps) · `/transport/beat` (~20Hz) · `/transport/section` |
| **`Boards`** (exact name, no spaces) | 6 MIDI clips, one per shot | **Blueline ClipScan 1.0** (SCANNER) | `/Boards/scan` · `/Boards/clip …` · `/Boards/scan_end` |

- **Sections** = arrangement **Locators** (Create → Add Locator), named `intro` / `verse` / `drop` …
- **Tempo / fps:** 120 BPM + device FPS 24 → 12 frames/beat (dead-on). Any fixed tempo is fine — the HUD goes
  green when `frames_per_beat = (fps×60)/tempo` is whole; tell me your tempo and I'll give the fps that keeps it whole.
- Editing clips + **Stop** auto-rescans. Press **Play** → the animatic plays in time.

## 3 · The 6 clips on the `Boards` track

Name each clip with a **leading shot number** (collision-free routing) + the prompt gist. Position = when it
hits; length = how long it holds. Placeholder bars below (replace with your song's structure):

| Clip name (paste-ready) | Board | Placeholder start · hold |
|---|---|---|
| `01 · noir city, many rooftop fires, high wide, smoke` | 01 | bar 1 · 8 beats |
| `02 · figure on crushed sedan roof, arm out pointing, embers` | 02 | bar 3 · 8 |
| `03 · CU braced legs explode upward, car roof buckling, debris` | 03 | bar 5 · 8 |
| `04 · worm's-eye, figure plummeting at camera, coat flaring, fire sky` | 04 | bar 7 · 8 |
| `05 · hard crouch landing, radial pavement crack, woman's body, crowd recoiling` | 05 | bar 9 · 8 |
| `06 · POV straight down at dying woman's face, blood/sweat falling, kiss off-frame` | 06 | bar 11 · 8 |

Full prompts + negatives + seeds (so clip names can stay short) live in **`board-records.json`**.

## 4 · How a clip becomes a frame

```
frames_per_beat = (fps × 60) ÷ tempo          # frames per beat = (frames/sec × sec/min) ÷ beats/min
frame_IN        = clip_start_beats × frames_per_beat   # a clip at bar 5 → 16 beats → 16×12 = frame 192
```
The board holds from `frame_IN` to the next clip's `frame_IN`. Pick tempo & fps so `frames_per_beat` is whole →
every clip lands on an exact frame, no drift. The clip's **position+length is the edit**; its **name is the content**.

## 5 · Verify without Ableton

```
_tools/ComfyUI/venv/bin/python Projects/BLUELINE/proofs/animatic/verify_animatic.py     # round-trips the contract -> PASS
_tools/ComfyUI/venv/bin/python Projects/BLUELINE/proofs/animatic/clip_scan_animatic.py  # fire a 6-board scan at the relay
```

## Files
- `animatic.html` — the player (rendered-board register; reuses the M0 previz clock plumbing)
- `boards/01..06.png` — the six keeper boards (copied from the new-story storyboard)
- `board-records.json` — reproducible prompt/negative/seed per board
- `verify_animatic.py` — headless contract verifier · `clip_scan_animatic.py` — 6-board scan sim
- relay route `/animatic` + `/boards` added to `../track-III-clock/osc_ws_relay.py`
