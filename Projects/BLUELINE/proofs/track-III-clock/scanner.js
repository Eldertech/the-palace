// BLUELINE - M4L clip scanner (per-track, track-name-namespaced, auto-rescan on STOP).
// outlet 0 -> [udpsend 127.0.0.1 9001]. Reads THIS device's host track's arrangement clips and
// emits a one-shot scan whose OSC address is PREFIXED BY THE HOST TRACK'S NAME -- so any number of
// scanners on different tracks coexist, each routed by its own track name:
//   /<Track>/scan      count
//   /<Track>/clip      idx  start(beats)  length(beats)  color(0xRRGGBB)  name
//   /<Track>/scan_end
// "Placement is the configuration": which track it sits on, and that track's NAME, is the whole setup.
//
// CADENCE -- auto-rescan on STOP: the scan is heavy (a transient LiveAPI per clip), so it must NOT run
// during playback. This device watches live_set is_playing and rescans on the 1->0 STOP edge -- the
// processing hit lands while stopped, never at play. Because EVERY scanner watches the same transport,
// one Stop rescans ALL tracks at once (decentralized; no central trigger). A manual bang still scans on
// demand. Same low-priority-thread rule as the transport: the is_playing callback runs off the scheduler.
autowatch = 1;
outlets = 1;

var playWatch = null;     // LiveAPI observer on live_set is_playing (armed once, on the first bang)
var lastPlaying = -1;     // previous is_playing value, to detect the 1->0 stop edge

// OSC address segments can't hold space # * , / ? [ ] { } -- map anything outside [A-Za-z0-9_-] to _.
function oscSafe(s) {
    s = String(s);
    var out = "";
    for (var i = 0; i < s.length; i++) {
        var c = s.charCodeAt(i);
        var ok = (c >= 48 && c <= 57) || (c >= 65 && c <= 90) ||
                 (c >= 97 && c <= 122) || c === 95 || c === 45;   // 0-9 A-Z a-z _ -
        out += ok ? s.charAt(i) : "_";
    }
    return out.length ? out : "track";
}

function scan() {
    var track = new LiveAPI(null, "this_device canonical_parent");   // placement = configuration
    if (!track || track.id == 0) { post("scanner: no host track\n"); return; }
    var ns = oscSafe(track.get("name")[0]);          // the track's NAME becomes the OSC namespace
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

    outlet(0, "/" + ns + "/scan", rows.length);
    for (var j = 0; j < rows.length; j++)
        outlet(0, "/" + ns + "/clip", j, rows[j][0], rows[j][1], rows[j][2], rows[j][3]);
    outlet(0, "/" + ns + "/scan_end");
    post("scanner: sent " + rows.length + " clips as /" + ns + "/*\n");
}

// auto-rescan on STOP: observe live_set is_playing; scan only on the 1->0 edge (never during play).
function armStopRescan() {
    playWatch = new LiveAPI(onPlay, "live_set");
    playWatch.property = "is_playing";               // fires once now with the current value, then on change
}
function onPlay(a) {
    if (!a || a[0] != "is_playing") return;
    var p = a[1];
    if (p == 0 && lastPlaying == 1) scan();          // STOP edge -> rescan (the heavy pass, while stopped)
    lastPlaying = p;
}

function ns() { }                 // deprecated no-op: namespace now derives from the track name
function bang() { if (!playWatch) armStopRescan(); scan(); }   // first bang arms the stop-watch + initial scan
