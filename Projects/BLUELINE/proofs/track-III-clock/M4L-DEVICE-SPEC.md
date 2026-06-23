# BLUELINE Clock — Max for Live device build spec

> **Status (2026-06-16):** built and **live-validated round-trip** from Ableton — the transport+clock
> path runs perfectly with the patcher edit window closed (the `[qmetro]` + `valid()` self-heal fix holds,
> bug retired). **Section addressing has moved off Ableton locators/markers and onto the device's own-track
> MIDI clips** (§1, §2b): a clip is a named *span* (name + start + length), so sections are durations, not
> points. This spec is the as-built/as-designed reference. **Harness wire rename done** (commit `e4f4292`):
> `transport_sim.py` + `clock_client.html` emit/parse `/transport/section`, matching the live device.
> **The as-built JS now lives alongside as `transport.js`** — copy that file into `[js transport.js]`
> rather than pasting from the §2b block: a dropped `//` and three em-dashes pasted from this markdown
> silently broke the live copy on 2026-06-23 (regex-literal SyntaxError → `no function bang`). The file
> is the safe source; the §2b block below is documentation kept byte-identical to it.

> **Architecture refinement (2026-06-23, live-validated):** the transport's section stream now
> reads **arrangement locators (`cue_points`)**, not the device's own-track MIDI clips. Rationale:
> locators are **song-global** (they belong to the timeline, not a track) — the right fit for the
> *singleton* transport — while per-track MIDI clips are read by the separate **SCANNER** device
> (`scanner.js`), one per observed track. This splits what the earlier markers→clips decision
> conflated, and makes the transport **placement-agnostic** (drop it on any track). The OSC wire is
> unchanged (`/transport/section name start_bar length_bars`); only the source changed, so nothing
> downstream changes. The committed `transport.js` is the canonical marker-based source; the §2b
> listing below is the prior clip-based body, kept as history. **Live-validated 2026-06-23** against
> Loudon's Set — locators `Intro` / `Bridge A` / `Drop C (Vocals)` drove `/transport/section` with
> gap-derived spans, while three track-name scanners (`Hero` / `Shot` / `Lyrics`) ran concurrently.

**What you're building:** a small M4L device that reads Ableton Live's transport and emits the
BLUELINE OSC transport contract to the local relay, so the browser clock client (and, later, the
render) stays beat-locked to your Live session. It is the live source the `transport_sim.py`
stand-in was faking. **Nothing downstream changes** — build this to the contract and the relay +
client + determinism keep working unmodified.

**Where it goes:** a **Max Audio Effect** (or MIDI Effect) device dropped on the **section track** —
the arrangement track whose **named MIDI clips** mark the song's sections (intro / verse / drop). The
device reads its *own* host track's clips, so **placement is the configuration**: whatever track it sits
on is the one whose clips become sections — no separate setup. It produces no audio — it only observes the
transport and sends UDP. One per Set.

**Target:** `127.0.0.1 : 9001` (the relay's OSC/UDP port). Relay + client already built and proven in
`Projects/BLUELINE/proofs/track-III-clock/` (`osc_ws_relay.py`, `clock_client.html`).

---

## 1. The contract it must emit (do not change these — the client parses them)

```
/transport/bible    tempo:float  fps:int  beats_per_bar:int                # once on load + on tempo/sig change
/transport/beat     bar:int  beat:float  playing:int                       # repeatedly while running (~50 Hz is fine)
/transport/section  name:string  start_bar:int  length_bars:float          # when the play-head enters a named MIDI clip on the device's track
```

- A **section** is a named MIDI clip on the device's host track: `name` is the clip name, `start_bar`
  is its 1-indexed start bar, `length_bars` is its length in bars. It is a *span*, not a point — this is
  the markers→clips upgrade, and it is what supplies a board's `HOLD`/duration downstream.
- `bar` is **1-indexed**; `beat` is the **1-indexed position within the bar** (1.0 at the downbeat,
  2.5 on the "and" of beat 2, …). "Beat" = quarter note (matches BPM).
- `fps` is the **locked render fps** (a number *you* set in the device UI — 24, 30, …). It is NOT a
  Live property. Choosing tempo + fps so `fps·60/tempo` is a whole number is what makes beats land on
  whole frames (the device just reports them; the math lives in `clock.py` / the client).
- **Types are forgiving:** Max may send an integer-valued number as OSC `int` and a fractional one as
  `float`. The relay and client accept both for every field — you do **not** need to force float types.

---

## 2. The build (recommended path: `[js]` + the Live API)

This path handles tempo, time-signature, AND section clips in ~30 lines, accurate to the poll rate. Delivery
jitter doesn't matter for the **render** (frames are computed from bar.beat *arithmetically*, so the
result is exact regardless of when a message lands); it only affects how smooth the *live readout*
looks. (The simulator measured ~4.6 ms σ; the live device over Live's scheduler measured higher — tens
of ms — which is fine for the readout and irrelevant to the render.) For sample-accurate sub-beat
timing see §5 (the `plugsync~` upgrade) — not needed for the smallest useful device.

### 2a. Objects and wiring

```
[live.thisdevice]                         ← bangs when the device finishes loading
      |
   [t b b]
    |    \________________________
    |                             \
[message bible]              [toggle]──[qmetro 50]     ← ~20 Hz poll, LOW-priority thread (see below)
    |   (refresh+send on load)         |
    |                          [js transport.js]       ← poll() on each bang
    \____________________________/   |
                                  (outlet 0)
                                     |
                       [udpsend 127.0.0.1 9001]        ← OSC out to the relay

UI (live.* so they're automatable / preset-saved):
[live.numbox]  "FPS" (default 24, int) ──[prepend fps]──▶ [js transport.js]
[live.text]    "resend BIBLE" (button) ─────────────────▶ [message bible] ▶ [js]
[live.toggle]  "RUN" ───────────────────────────────────▶ [qmetro 50]  (and gate emit if you prefer)
[live.comment] status (optional) ◀── route a status string out a 2nd js outlet
```

**⚠️ Gotcha — `[qmetro]`, not `[metro]` (the "no valid object set" bug).** If the poll runs from a plain
`[metro]`, the LiveAPI `.get()` happens on Max's **high-priority (scheduler) thread**, and with Live's
Overdrive on (the default) that throws `jsliveapi: get: no valid object set` + `SendMessage error 2:
Bad parameter value` — **but only when the patcher edit window is closed** (an open editor keeps the
patch serviced on the main thread, masking it). LiveAPI must be touched from the **low-priority thread**.
Fix: drive the poll with **`[qmetro]`** (it fires on the low-priority queue) — *not* `[metro]`. The
`valid()` guard in `poll()` is the belt-and-suspenders backstop (it re-creates the LiveAPI if it ever
comes up invalid, and skips a tick rather than erroring).

**Two rules that keep Ableton responsive** (the first build froze Live by breaking them):
1. **Reuse the LiveAPI object** — created once via `init()`/`valid()`, never inside `poll()`.
   `new LiveAPI()` per tick is what locks up Live.
2. **Poll gently, from the low-priority thread** — `[qmetro 50]` (≈20 Hz) is plenty: the determinism is
   in the *arithmetic* (bar.beat → frame is exact), so the poll only needs to be smooth for the live
   readout, not fast. Drop to `[qmetro 100]` (10 Hz) for lighter; go to `plugsync~` (§5) only if you need
   sample-accurate sub-beat. **`[live.thisdevice]` also fires `bible`** on load, so the clock + caches
   are sent automatically — no need to click the button unless tempo/signature changes.

Notes:
- `[live.thisdevice]` → `[t b b]`: one bang fires `bible` (initial clock), the other turns the
  `[metro 20]` on. (Or wire the toggle so you start/stop manually.)
- `[udpsend]` in Max **speaks OSC natively**: send it a message whose first atom is the `/address`
  followed by the args and it emits a correct OSC packet. That is exactly what `transport.js` outputs.
- Put the FPS `[live.numbox]` range at 1–120, default 24.

### 2b. `transport.js` (copy the committed `transport.js` in this folder — preferred; or paste into a `[js transport.js]` object and save next to the .amxd)

**Paste discipline (avoid the `no function bang` bug):** Max's old JS engine can fail to compile if the
source has **non-ASCII characters** (em-dashes, smart quotes) or a stray markdown ` ``` ` fence — and a
failed compile means *none* of the functions register, so a bang reports `js: no function bang`. The
code below is **pure ASCII**; paste only what's *between* the fences, and if you see the error, check the
Max console for the one-time `transport.js: SyntaxError ... line N` above the spam.

```javascript
// BLUELINE Track III - M4L transport sender. outlet 0 -> [udpsend 127.0.0.1 9001]
// Reuse ONE LiveAPI (never "new LiveAPI" in poll - that froze Live). Poll from [qmetro]
// (LOW-priority thread) - a plain [metro] errors "no valid object set" when the editor is closed.
autowatch = 1;
outlets = 1;

var FPS = 24;                 // the LOCKED render fps (set from the UI: message "fps 24")
var api = null;               // the ONE persistent LiveAPI on live_set
var track = null;             // the device's OWN track -- its MIDI clips are the sections
var sigN = 4;                 // cached beats-per-bar (refreshed in refresh())
var sections = [];            // cached [[start_bar, length_bars, name], ...]  (markers->clips)
var lastSection = -1;         // index of the section the play-head is currently inside

// validity-guarded LiveAPI: created once, re-created if it ever goes invalid. (api.id==0
// means "no valid object" -- happens if it's touched before the device is fully live.)
function valid() { return api && api.id != 0; }
function init() {                                   // call from [live.thisdevice]
    api = new LiveAPI(null, "live_set");
    track = new LiveAPI(null, "this_device canonical_parent");  // the host track (placement = config)
    refresh();
}

function refresh() {          // cache signature + this track's arrangement clips (on load / change)
    if (!valid()) api = new LiveAPI(null, "live_set");
    if (!track || track.id == 0) track = new LiveAPI(null, "this_device canonical_parent");
    sigN = api.get("signature_numerator")[0];      // assumes x/4 meter
    sections = [];
    var clips = track.get("arrangement_clips");    // ["id", id1, "id", id2, ...] -- named MIDI clips
    for (var i = 1; i < clips.length; i += 2) {
        var c = new LiveAPI(null, "id " + clips[i]);   // created only here, not per-tick
        var startBar = Math.floor(c.get("start_time")[0] / sigN) + 1;  // 1-indexed start bar
        var lenBars  = c.get("length")[0] / sigN;                      // span in bars
        sections.push([startBar, lenBars, c.get("name")[0]]);
    }
    sections.sort(function (a, b) { return a[0] - b[0]; });
}

function fps(v) { FPS = v; }                        // message: "fps 30"

function bible() {                                  // refresh caches + send the locked clock
    if (!valid()) init(); else refresh();
    outlet(0, "/transport/bible", api.get("tempo")[0], FPS, sigN);
}

function bang() { poll(); }                         // a [qmetro] bang (LOW-priority thread) drives poll

function poll() {                                   // light: 2 gets/tick on the reused api
    if (!valid()) { init(); if (!valid()) return; } // self-heal, or skip this tick if not ready yet
    var beats   = api.get("current_song_time")[0];  // beats (quarter notes) since song start
    var playing = api.get("is_playing")[0];
    var bar     = Math.floor(beats / sigN) + 1;
    var beatInBar = (beats % sigN) + 1;             // 1-indexed float
    outlet(0, "/transport/beat", bar, beatInBar, playing);

    var cur = -1;                                   // which section span contains this bar?
    for (var i = 0; i < sections.length; i++) {
        var s0 = sections[i][0], s1 = s0 + sections[i][1];
        if (bar >= s0 && bar < s1) { cur = i; break; }
    }
    if (cur !== lastSection) {                       // emit on entering a different section clip
        lastSection = cur;
        if (cur >= 0)
            outlet(0, "/transport/section", sections[cur][2], sections[cur][0], sections[cur][1]);
    }
}
```

That's the whole device. `bible` refreshes the caches + sends the clock; `poll` does just two
`.get()`s on the **reused** LiveAPI; sections come from the cached list of this track's clips. **The
reuse + the gentler metro (below) are what keep Ableton responsive** — the first version froze Live by
creating LiveAPI objects in the poll loop.

---

## 3. Test procedure (proves it against the already-built relay + client)

1. Start the relay:
   `_tools/ComfyUI/venv/bin/python Projects/BLUELINE/proofs/track-III-clock/osc_ws_relay.py`
2. Open `http://127.0.0.1:8770` in a browser (the clock client).
3. Drop the device on the **section track** (named MIDI clips: intro / verse / drop); set FPS to 24;
   set the Set tempo to **120** (a locked pair).
4. Press **Play** in Live. The client should show: BIBLE = 120 BPM / 24 fps / FPB 12 (exact);
   bar.beat advancing; **on-beats landing on whole frames** (residual 0.000); jitter a few ms;
   the section name + span updating as the play-head enters each clip.
5. Set tempo to **128** and watch the client flip to `DRIFTS ✗` with non-zero residuals — the device
   is honest about a bad tempo/fps pair (it just reports; the client catches the drift).

---

## 4. Edge cases to handle (small)

- **Stop:** `is_playing` goes 0 → you still emit `/transport/beat … 0`; the client can freeze on stop.
- **Tempo / signature change:** re-send `bible` (wire a `[live.observer] tempo` → `[message bible]`,
  or just press the "resend BIBLE" button). The client recomputes FPB live.
- **Loop / jump:** `current_song_time` jumps; `poll()` recomputes bar.beat from scratch, so loops just work.
- **Non-x/4 meters (6/8, 7/8):** the `beats = quarter notes` assumption needs care; flag/avoid for now —
  BLUELINE's fixed-tempo shots are x/4. (Handle denominators later if a Set needs it.)
- **Count-in:** `current_song_time` can be negative during count-in; `bar` will be ≤ 0 — fine, the
  client just shows pre-roll.

---

## 5. Upgrade (optional, later): sample-accurate sub-beat via `plugsync~`

If you ever need sub-beat events tighter than the metro poll: replace the polling with `[plugsync~]`
(outputs bars / beats / units as **signals**, sample-accurate). Snapshot its position with
`[snapshot~ 5]` or detect beat edges with `[edge~]`/`[change]`, format the same `/transport/beat`
message, and send to the same `[udpsend]`. The contract and everything downstream are unchanged — this
only tightens the source. Not needed for the first device; the poll path is already inside a frame.

---

## 6. Acceptance

The device is done when, with the relay + client running and a locked tempo/fps, pressing Play in Live
makes the client show on-beats on whole frames with low jitter and section clips arriving as named spans
as the play-head enters them — i.e. it reproduces the `transport_sim.py` proof from a **live** Set.
**Met (2026-06-16):** the transport+clock path is live-validated round-trip and runs with the editor
closed; `transport_sim.py` is now a test fixture and this device is the clock source for every
music-synced render. The remaining open item is the wire rename in the harness (see the Status banner).
