// BLUELINE - M4L clip scanner (per-track, track-name-namespaced).
// outlet 0 -> [udpsend 127.0.0.1 9001]. Reads THIS device's host track's arrangement clips and
// emits a one-shot scan whose OSC address is PREFIXED BY THE HOST TRACK'S NAME -- so any number of
// scanners on different tracks coexist, each routed by its own track name:
//   /<Track>/scan      count
//   /<Track>/clip      idx  start(beats)  length(beats)  color(0xRRGGBB)  name
//   /<Track>/scan_end
// "Placement is the configuration": which track it sits on, and that track's NAME, is the whole setup.
// Run from [deferlow] (LOW-priority), never the transport poll. One LiveAPI at a time; guard validity.
autowatch = 1;
outlets = 1;

// OSC address segments can't hold space # * , / ? [ ] { } -- map anything outside [A-Za-z0-9_-] to _.
// Manual char check (no regex literal -- safest for Max's old js engine). Empty name -> "track".
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

function ns() { }                 // deprecated no-op: namespace now derives from the track name (kept so
                                  // a leftover [live.menu]->[prepend ns] doesn't spam "no function ns")
function bang() { scan(); }       // a [deferlow] bang triggers one scan
