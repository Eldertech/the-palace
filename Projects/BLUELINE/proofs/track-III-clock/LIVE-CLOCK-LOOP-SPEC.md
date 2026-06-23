# BLUELINE — Live Clock Loop (full M4L + relay spec)

> **What this is (2026-06-17).** The complete spec for driving the comic-register clients (M0 previz ·
> M1 animatic · M2 motion comic) — and later the render — off a **live Ableton session** instead of
> self-play. It has three parts: (1) the **transport device** (already built + live-validated — see
> `M4L-DEVICE-SPEC.md`, recapped in §1), (2) the **clip-scan "scanner" device** (the genuinely new
> part — today only `m0-previz/clip_scan_sim.py` fakes it), and (3) the two **relay routes** (`/m1`,
> `/m2`) that let the existing players run off the relay. Loudon builds the Max patches himself; this is
> precise, testable guidance, not a patch.

The invariant that makes all of this safe: **nothing downstream changes.** Every client already speaks the
contract below; build the devices + routes to it and the relay, clients, and determinism keep working
unmodified. Determinism lives in the *arithmetic* (`(bar,beat)→frame` is exact at a locked tempo/fps), so
message jitter never reaches the render — it only affects how smooth the live read-out looks.

---

## 0. The loop

```
ABLETON LIVE  (one Set, three named-MIDI-clip tracks — "placement is the configuration")
  ├─ SECTION track     ── M4L device, MODE=MASTER  ─┐   /transport/bible  (load + tempo change)
  │   clips = intro/verse/drop (spans)              │   /transport/beat   (~20 Hz while running)
  │                                                  │   /transport/section(on entering a clip span)
  ├─ STORYBOARD track  ── M4L device, MODE=SCANNER ──┤   /board/scan · /board/clip×N · /board/scan_end
  │   clips = shot cues (one per board)             │      (one-shot, deferred, on demand)
  └─ LYRICS track      ── M4L device, MODE=SCANNER ──┘   /lyrics/scan · /lyrics/line×N · /lyrics/scan_end
      clips = lyric lines   (namespace = lyrics)          (see LYRICS-LAYER-SPEC.md)
                                   │
                          OSC / UDP  127.0.0.1:9001
                                   ▼
                    osc_ws_relay.py  (Shop machinery, unchanged engine)
                       serves: /  /previz  /m1  /m2   ·   broadcasts WS /ws
                                   │  WS / JSON
              ┌────────────────────┼─────────────────────┐
              ▼                    ▼                     ▼
        clock_client          /previz, /m1, /m2      (later) the render runner
        (determinism HUD)     (the players)          (sync-addressed frames)
```

One Set, one relay, one WS fan-out. The transport stream is **global** (one MASTER device per Set). The
scans are **per-track** and **one-shot** (a SCANNER device on each content track). Because a device reads
its *own* host track, **where you drop it is its entire configuration** — no separate setup screen.

---

## 1. MODE=MASTER — transport + sections  *(already built; recap only)*

Built and live-validated 2026-06-16 — full build in **`M4L-DEVICE-SPEC.md`**. It sits on the **section
track** and emits, from the reused `LiveAPI` polled by a **`[qmetro]`** on the low-priority thread:

```
/transport/bible    tempo:float  fps:int  beats_per_bar:int          # on load + tempo/sig change
/transport/beat     bar:int  beat:float  playing:int                 # ~20 Hz while running
/transport/section  name:string  start_bar:int  length_bars:float    # on entering a named clip span
```

Unchanged here. The two hard-won lessons it encodes — **reuse one `LiveAPI`** (never `new LiveAPI()` in
the poll; that froze Live) and **touch the Live API only from the low-priority thread** (`[qmetro]`, not
`[metro]`; else `jsliveapi: get: no valid object set` with the editor closed) — **also govern the scanner
in §2.**

---

## 2. MODE=SCANNER — the clip-scan device  *(new — this is the build)*

> **AS-BUILT (2026-06-23) — supersedes the board/lyrics sketch in the rest of §2.** The scanner shipped
> with three changes from the original design below. The canonical source is the committed **`scanner.js`**
> in this folder — copy that file into `[js scanner.js]`; don't paste from the block below.
>
> 1. **Namespace = the host TRACK NAME** (not a board/lyrics menu). The scanner reads its own track's name,
>    OSC-sanitizes it (`[A-Za-z0-9_-]`; anything else → `_`), and prefixes every message with it:
>    ```
>    /<Track>/scan      count:int
>    /<Track>/clip      idx:int  start:float(beats)  length:float(beats)  color:int(0xRRGGBB)  name:string
>    /<Track>/scan_end
>    ```
>    Any number of scanners on any tracks coexist, each routed by its own name — *placement + name is the
>    config*. The `[live.menu] namespace` and `ns()` are retired (a no-op `ns()` stub remains so a leftover
>    menu can't error). Verified live with `Hero` / `Shot` / `Lyrics` scanners running at once.
> 2. **Auto-rescan on STOP.** `scanner.js` arms a `live_set is_playing` observer (on its first load-bang) and
>    rescans on the **1→0 stop edge** — so the heavy pass (a transient `LiveAPI` per clip) lands while
>    *stopped*, never during play. Because every scanner watches the same transport, **one Stop rescans all
>    tracks at once** — decentralized, no central trigger, zero extra wiring. The manual SCAN bang still
>    works. This replaces the optional "rescan on stop" toggle in §2a (now built into the JS).
> 3. **Multi-track preview.** The players take `?track=<Name>` (default `board`) to choose which track drives
>    the main storyboard, and **previz additionally shows EVERY scanner track as a time-aligned lane** at the
>    bottom: one lane per track, clips placed by start (width = gap to next), one playhead swept by
>    `/transport/beat`, a ruler of locator sections. Open `http://127.0.0.1:8770/previz?track=Shot`.
>
> The §2 body below is the original board/lyrics sketch, kept as design history; trust `scanner.js` + this banner.

**Purpose.** Read the device's own track's MIDI clips and emit them as a one-shot scan, so a player builds
its storyboard from *Live clips* instead of an embedded array. Today `clip_scan_sim.py` fakes exactly this;
the device sends the **same OSC**, from a **deferred low-priority scan** — never from the transport poll.

**The scan contract (one-shot, not streamed):**

```
/board/scan      count:int                                                   # how many clips follow
/board/clip      idx:int  start:float(beats)  length:float(beats)  color:int(0xRRGGBB)  name:string
/board/scan_end                                                              # client rebuilds + redraws
```

- `start` / `length` are in **beats** (the client divides by `beats_per_bar` to get bar.beat, and `length`
  becomes the board's `HOLD`). `color` is the Live clip color as `0xRRGGBB` → the client paints the
  clip-color spine. `name` is the **cue carried in the clip name** — the client's `clipToShot()` maps it to
  a camera label and flips `flow` on if it matches `/draw|release|drop|flow|wind|run|fly/`.
- The scan is **idempotent and re-runnable**: a new `/board/scan … /board/scan_end` fully rebuilds the
  client's storyboard. Re-scan after you edit clips.

**Where it goes.** On the **storyboard track** (one device). For the lyrics track, the *same* device with a
`namespace` of `lyrics` emits `/lyrics/*` instead (see `LYRICS-LAYER-SPEC.md`) — identical mechanism, one
field changed.

### 2a. Objects and wiring (adds a scan trigger to the §1 patch, or a scan-only device)

```
[live.thisdevice] ─ b ─[t b b]──────────────┐ (one bang inits the LiveAPI; the other arms an initial scan)
                                             │
[live.text "SCAN CLIPS"] ─────────[t b]──────┴─▶ [deferlow]──▶ [js scanner.js]  (scan() on the LOW-PRI thread)
                                                                     │ outlet 0
                                                                     ▼
                                                        [udpsend 127.0.0.1 9001]   (OSC, native in Max)

UI (live.* so they save with the preset):
[live.text]  "SCAN CLIPS"  ── manual rescan after editing clips
[live.menu]  "namespace: board | lyrics"  ──[prepend ns]──▶ [js scanner.js]   (board track vs lyrics track)
[live.toggle]"rescan on stop" (optional) ◀── [live.observer is_playing] 1→0 ─▶ [t b]─▶ [deferlow]
```

**Why `[deferlow]`, not the transport `[qmetro]`:** the scan walks every clip and creates a transient
`LiveAPI` per clip to read its `name`/`start_time`/`length`. That is heavier than the 2-get transport poll
and must **not** ride the beat poll — run it once, on the **low-priority** queue, on demand. (Same thread
rule as MASTER; different cadence — one-shot vs. continuous.)

### 2b. `scanner.js` (paste into `[js scanner.js]`; pure ASCII — the em-dash/smart-quote compile trap from
`M4L-DEVICE-SPEC.md` §2b applies here too)

```javascript
// BLUELINE - M4L clip scanner. outlet 0 -> [udpsend 127.0.0.1 9001].
// Reads THIS device's host track's arrangement clips and emits a one-shot board (or lyrics) scan.
// Run from [deferlow] (LOW-priority), never from the transport poll. Reuse the lessons: one LiveAPI
// at a time, touch the API off the scheduler thread, guard validity.
autowatch = 1;
outlets = 1;

var NS = "board";                 // "board" -> /board/*, "lyrics" -> /lyrics/* (set by [live.menu])
var sigN = 4;                     // beats per bar (clips report start/length in BEATS, so we keep beats)

function ns(v) { NS = (v == "lyrics") ? "lyrics" : "board"; }   // message: "ns lyrics"

function scan() {
    var live = new LiveAPI(null, "live_set");
    sigN = live.get("signature_numerator")[0];
    var track = new LiveAPI(null, "this_device canonical_parent");   // placement = configuration
    if (!track || track.id == 0) { post("scanner: no host track\n"); return; }
    var clips = track.get("arrangement_clips");      // ["id", id1, "id", id2, ...]
    var rows = [];
    for (var i = 1; i < clips.length; i += 2) {
        var c = new LiveAPI(null, "id " + clips[i]);  // created only here, in the deferred pass
        rows.push([ c.get("start_time")[0],           // BEATS from song start
                    c.get("length")[0],               // BEATS
                    c.get("color")[0],                // 0xRRGGBB int
                    String(c.get("name")[0]) ]);
    }
    rows.sort(function (a, b) { return a[0] - b[0]; });

    var scanAddr = "/" + NS + "/scan";
    var rowAddr  = "/" + NS + (NS === "lyrics" ? "/line" : "/clip");
    var endAddr  = "/" + NS + "/scan_end";
    outlet(0, scanAddr, rows.length);
    for (var j = 0; j < rows.length; j++) {
        if (NS === "lyrics")   // /lyrics/line  idx  start  length  text   (no color; text carries the line)
            outlet(0, rowAddr, j, rows[j][0], rows[j][1], rows[j][3]);
        else                   // /board/clip   idx  start  length  color  name
            outlet(0, rowAddr, j, rows[j][0], rows[j][1], rows[j][2], rows[j][3]);
    }
    outlet(0, endAddr);
}

function bang() { scan(); }       // a [deferlow] bang triggers one scan
```

That is the whole scanner. It is `clip_scan_sim.py` made live: same addresses, same arg order, same
sorting — so every client that already parses `clip_scan_sim` output works against the device with no change.

---

## 3. The relay routes (`/m1`, `/m2`) — three lines

`osc_ws_relay.py` currently serves `/` (clock client), `/previz`, `/storyboard.json`. Add the two register
players so they run off the **same relay** (and thus the same `ws://<host>/ws` they already connect to):

```python
M1 = os.path.join(HERE, "..", "m1-animatic")
M2 = os.path.join(HERE, "..", "m2-motion-comic")
async def m1(request): return web.FileResponse(os.path.join(M1, "m1-animatic.html"))
async def m2(request): return web.FileResponse(os.path.join(M2, "m2-motion-comic.html"))
# ... in main(), beside the existing add_get calls:
app.router.add_get("/m1", m1)
app.router.add_get("/m2", m2)
```

Now `http://127.0.0.1:8770/m2` is the motion comic, beat-locked to the live Set, with the storyboard built
from the STORYBOARD track's clips (scanner) — no embedded array, no self-play. (The clients already prefer
a relay-built board over their embedded `EMBED`, and fall back to self-play when no relay is present.)

*Equivalently:* a player can stay on its own static `http.server` for the page and open a WebSocket to the
relay's host — but serving the page from the relay keeps `location.host` correct for the WS with zero
config, which is why the routes are the clean path.

---

## 4. The Ableton configuration (what Loudon builds in the Set)

| Track | Clips are | Device | Emits | Drives |
|---|---|---|---|---|
| **SECTION** *(any track — global)* | arrangement **LOCATORS** (intro/verse/drop) — markers, not clips | MASTER (one per Set) | `/transport/*` | the clock + section read-out everywhere |
| **STORYBOARD** (e.g. named `Shot`) | one named clip per shot; name = the cue; color = the spine | SCANNER | `/Shot/*` (track name) | the storyboard the players render |
| **LYRICS** (named `Lyrics`) | one named clip per lyric line; name = the line text | SCANNER | `/Lyrics/*` (track name) | the lyrics layer / a preview lane |

Three tracks, three devices, all built from the same two `.js` files (`transport.js`, `scanner.js`). The
song *is* the project file: edit a clip's name/length/position and the board moves with it on the next
**Stop** (auto-rescan) or a manual SCAN — the board record becomes Ableton-native, which is the whole point
of the clock track (Track III).

**Devices — canonical home is the Ableton User Library** (`Presets/MIDI Effects/Max MIDI Effect/`):
**transport** = the `BLUELINE - Transport` preset over `Imported/OSCSync.amxd` (loads `transport.js`, carries
the `FPS` param); **scanner** = `Blueline ClipScan 1.0.amxd` (loads `scanner.js`). Both are thin wrappers —
**all behavior is in the external `.js`**, the source of truth in this folder. Binary snapshots are committed
beside the source for drag-in reproducibility: `OSCSync.amxd` (transport) and `Blueline ClipScan 1.0.amxd`
(scanner). `autowatch` reloads the `.js`, so editing `transport.js` / `scanner.js` updates the live device
with no re-import.

---

## 5. Test procedure

**Sim path (no Ableton — proves the relay + routes + clients):**
1. `_tools/ComfyUI/venv/bin/python Projects/BLUELINE/proofs/track-III-clock/osc_ws_relay.py`
2. Open `http://127.0.0.1:8770/m2` (after adding the §3 routes). It should connect to the relay (dot green).
3. `python3 Projects/BLUELINE/proofs/track-III-clock/transport_sim.py 120 24` — the player should beat-lock,
   sections updating; the determinism HUD `12 frames/beat · on whole frame ✓`.
4. `python3 Projects/BLUELINE/proofs/m0-previz/clip_scan_sim.py` — the player should **rebuild its
   storyboard from the 8 scanned clips** (`srcnote` reads "storyboard built from 8 Live clips").

**Live path (the device, against the same relay):**
5. Drop MASTER on the SECTION track (FPS 24, tempo 120); drop SCANNER (ns=board) on the STORYBOARD track.
6. Press Play → transport beat-locks (as in `M4L-DEVICE-SPEC.md` §3). Click **SCAN CLIPS** → the player
   rebuilds the board from the live clips. Edit a clip name/length, re-scan → the board follows.

---

## 6. Acceptance

The live clock loop is done when, with the relay running and the routes added: pressing Play in Live
beat-locks `/m2` (on-beats on whole frames, low jitter); clicking SCAN on the storyboard track rebuilds the
player's board from the Set's clips; and the lyrics scanner (ns=lyrics) feeds the lyrics layer. It
reproduces the `transport_sim` + `clip_scan_sim` proofs from a **live Set**, with the players unmodified.

## 7. Gotchas carried in (do not relearn)

- **`[qmetro]` for the poll, `[deferlow]` for the scan — never `[metro]`.** Touch `LiveAPI` only on the
  low-priority thread or you get `no valid object set` once the editor window is closed.
- **One `LiveAPI` at a time, reused for the poll.** The scan may make transient per-clip `LiveAPI`s (it is
  one-shot), but the transport poll must reuse a single object — per-tick allocation froze Live.
- **The scan is one-shot and deferred**, never on the beat poll. Re-scan on demand (button) or on stop.
- **Beats, not bars, on the wire for clips** — the client converts with `beats_per_bar`. Keep `start`/
  `length` in beats to match `clip_scan_sim`.
- **Non-x/4 meters** (6/8, 7/8): the `beats = quarter notes` assumption needs care; BLUELINE's fixed-tempo
  shots are x/4 — flag/avoid for now (carried from `M4L-DEVICE-SPEC.md` §4).
- **Wire rename already pending** in the harness: `/transport/locator` → `/transport/section`
  (`transport_sim.py`, `clock_client.html`) before the next live run; the relay is format-agnostic.
