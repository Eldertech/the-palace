// BLUELINE Track III - M4L transport sender. outlet 0 -> [udpsend 127.0.0.1 9001]
// Track-AGNOSTIC: reads tempo/beat/locators from live_set only -- drop it on ANY track.
// Sections come from ARRANGEMENT LOCATORS (cue_points), which are song-global, NOT per-track;
// per-track MIDI clips are read by the separate SCANNER device (scanner.js). One transport per Set.
// Reuse ONE LiveAPI (never "new LiveAPI" in poll - that froze Live). Poll from [qmetro]
// (LOW-priority thread) - a plain [metro] errors "no valid object set" when the editor is closed.
autowatch = 1;
outlets = 1;

var FPS = 24;                 // the LOCKED render fps (set from the UI: message "fps 24")
var api = null;               // the ONE persistent LiveAPI on live_set
var sigN = 4;                 // cached beats-per-bar (refreshed in refresh())
var marks = [];               // cached [[time_beats, name], ...] from cue_points (arrangement locators)
var lastSection = -1;         // index of the locator-section the play-head is currently inside

// validity-guarded LiveAPI: created once, re-created if it ever goes invalid. (api.id==0
// means "no valid object" -- happens if it's touched before the device is fully live.)
function valid() { return api && api.id != 0; }
function init() {                                   // call from [live.thisdevice]
    api = new LiveAPI(null, "live_set");
    refresh();
}

function refresh() {          // cache signature + the song's locators (cue_points) -- GLOBAL, not track-bound
    if (!valid()) api = new LiveAPI(null, "live_set");
    sigN = api.get("signature_numerator")[0];      // assumes x/4 meter
    marks = [];
    var cps = api.get("cue_points");               // ["id", id1, "id", id2, ...] -- arrangement locators
    for (var i = 1; i < cps.length; i += 2) {
        var cp = new LiveAPI(null, "id " + cps[i]); // created only here, not per-tick
        marks.push([ cp.get("time")[0], String(cp.get("name")[0]) ]);   // time in BEATS
    }
    marks.sort(function (a, b) { return a[0] - b[0]; });
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

    // which locator-section are we in? the latest locator at or before the play-head.
    var cur = -1;
    for (var i = 0; i < marks.length; i++) {
        if (beats >= marks[i][0]) cur = i; else break;
    }
    if (cur !== lastSection) {                       // emit on crossing into a different locator
        lastSection = cur;
        if (cur >= 0) {
            var startBeat = marks[cur][0];
            var startBar  = Math.floor(startBeat / sigN) + 1;
            var nextBeat  = (cur + 1 < marks.length) ? marks[cur + 1][0] : -1;
            var lenBars   = (nextBeat >= 0) ? (nextBeat - startBeat) / sigN : 0;  // 0 = open (to song end)
            outlet(0, "/transport/section", marks[cur][1], startBar, lenBars);
        }
    }
}
