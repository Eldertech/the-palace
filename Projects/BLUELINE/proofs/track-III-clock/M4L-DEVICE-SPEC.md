# BLUELINE Clock — Max for Live device build spec

**What you're building:** a small M4L device that reads Ableton Live's transport and emits the
BLUELINE OSC transport contract to the local relay, so the browser clock client (and, later, the
render) stays beat-locked to your Live session. It is the live source the `transport_sim.py`
stand-in was faking. **Nothing downstream changes** — build this to the contract and the relay +
client + determinism keep working unmodified.

**Where it goes:** a **Max Audio Effect** (or MIDI Effect) device dropped on the **Master track**.
It produces no audio — it only observes the transport and sends UDP. One per Set.

**Target:** `127.0.0.1 : 9001` (the relay's OSC/UDP port). Relay + client already built and proven in
`Projects/BLUELINE/proofs/track-III-clock/` (`osc_ws_relay.py`, `clock_client.html`).

---

## 1. The contract it must emit (do not change these — the client parses them)

```
/transport/bible    tempo:float  fps:int  beats_per_bar:int     # once on load + on tempo/sig change
/transport/beat     bar:int  beat:float  playing:int            # repeatedly while running (~50 Hz is fine)
/transport/locator  name:string  bar:int                        # when the play-head enters a bar that has a locator
```

- `bar` is **1-indexed**; `beat` is the **1-indexed position within the bar** (1.0 at the downbeat,
  2.5 on the "and" of beat 2, …). "Beat" = quarter note (matches BPM).
- `fps` is the **locked render fps** (a number *you* set in the device UI — 24, 30, …). It is NOT a
  Live property. Choosing tempo + fps so `fps·60/tempo` is a whole number is what makes beats land on
  whole frames (the device just reports them; the math lives in `clock.py` / the client).
- **Types are forgiving:** Max may send an integer-valued number as OSC `int` and a fractional one as
  `float`. The relay and client accept both for every field — you do **not** need to force float types.

---

## 2. The build (recommended path: `[js]` + the Live API)

This path handles tempo, time-signature, AND locators in ~30 lines, accurate to the poll rate. Delivery
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

### 2b. `transport.js` (paste into a `[js transport.js]` object; save next to the .amxd)

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
var sigN = 4;                 // cached beats-per-bar (refreshed in refresh())
var cues = [];                // cached [[bar, name], ...]
var lastLocatorBar = -1;

// validity-guarded LiveAPI: created once, re-created if it ever goes invalid. (api.id==0
// means "no valid object" — happens if it's touched before the device is fully live.)
function valid() { return api && api.id != 0; }
function init() { api = new LiveAPI(null, "live_set"); refresh(); }   // call from [live.thisdevice]

function refresh() {          // cache signature + cue points (cheap, on load / tempo-sig change)
    if (!valid()) api = new LiveAPI(null, "live_set");
    sigN = api.get("signature_numerator")[0];      // assumes x/4 meter
    cues = [];
    var cps = api.get("cue_points");               // ["id", id1, "id", id2, ...]
    for (var i = 1; i < cps.length; i += 2) {
        var cp = new LiveAPI(null, "id " + cps[i]); // created only here, not per-tick
        cues.push([Math.floor(cp.get("time")[0] / sigN) + 1, cp.get("name")[0]]);
    }
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

    if (bar !== lastLocatorBar) {                   // emit a cached locator when we enter its bar
        lastLocatorBar = bar;
        for (var i = 0; i < cues.length; i++)
            if (cues[i][0] === bar) { outlet(0, "/transport/locator", cues[i][1], bar); break; }
    }
}
```

That's the whole device. `bible` refreshes the caches + sends the clock; `poll` does just two
`.get()`s on the **reused** LiveAPI; locators come from the cached list. **The reuse + the gentler
metro (below) are what keep Ableton responsive** — the first version froze Live by creating LiveAPI
objects in the poll loop.

---

## 3. Test procedure (proves it against the already-built relay + client)

1. Start the relay:
   `_tools/ComfyUI/venv/bin/python Projects/BLUELINE/proofs/track-III-clock/osc_ws_relay.py`
2. Open `http://127.0.0.1:8770` in a browser (the clock client).
3. Drop the device on the Master track; set FPS to 24; set the Set tempo to **120** (a locked pair).
4. Press **Play** in Live. The client should show: BIBLE = 120 BPM / 24 fps / FPB 12 (exact);
   bar.beat advancing; **on-beats landing on whole frames** (residual 0.000); jitter a few ms;
   locators appearing as the play-head passes them.
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
makes the client show on-beats on whole frames with low jitter and locators arriving on their bars —
i.e. it reproduces the `transport_sim.py` proof from a **live** Set. At that point `transport_sim.py`
is retired to a test fixture and this device becomes the clock source for every music-synced render.
