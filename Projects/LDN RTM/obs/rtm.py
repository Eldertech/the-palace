#!/usr/bin/env python3
"""rtm — the recording-day driver for LDN RTM.

Drives OBS over its WebSocket so a take is one command and OBS is never touched
by hand. The checklist TSV is the queue; state lives in .rtm-state.json.

  python3 rtm.py check           preflight — verify the whole rig, change nothing
  python3 rtm.py setup           size + place the Live window, then check
  python3 rtm.py show            what's queued
  python3 rtm.py goto 29.3       jump to a section
  python3 rtm.py skip            move on without recording
  python3 rtm.py take            card up, roll, cut to Live — then talk
  python3 rtm.py stop            end frame, stop, rename, advance
  python3 rtm.py levels [secs]   watch real meters — proves signal is arriving
  python3 rtm.py process         normalise + finish the day's takes (ffmpeg)
  python3 rtm.py remaining       coverage by chapter

The tail is an END frame held for a beat before the recording stops, not an ffmpeg
pad — so the video stream is never re-encoded and `process` only touches audio.
"""
import json
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from obs import Obs, ObsError  # noqa: E402

HERE = Path(__file__).resolve().parent
CHECKLIST = HERE.parent / "LDN RTM — Live 12 checklist.tsv"
STATE = HERE / ".rtm-state.json"
TITLE, SUBTITLE = HERE / "title.txt", HERE / "subtitle.txt"
TAKES = HERE.parent / "takes"
FINAL = HERE.parent / "final"

SERIES = "LDN RTM · Live 12"
WINDOW = (0, 38, 1920, 1080)
TITLE_HOLD = 3.0          # seconds of card before the work starts
END_HOLD = 1.2            # seconds of sigil after the last word
MIC_LUFS, PROGRAM_LUFS = -16.0, -20.0
AUDIO_DEVICE_HINT = "MiniFuse"   # substring the production interface must match

EXPECT = {
    "canvas": (1920, 1080),
    "scenes": {"TITLE", "BODY", "END"},
    "screen": dict(scale=0.5, crop=(0, 76, 272, 422), pos=(0, 0)),
    "webcam": dict(pos=(13, 745), bounds=(346, 277), bounds_type="OBS_BOUNDS_SCALE_OUTER"),
}


# ── the queue ──────────────────────────────────────────────────────────────
def rows():
    out = []
    with open(CHECKLIST, encoding="utf-8") as f:
        head = f.readline().rstrip("\n").split("\t")
        for line in f:
            p = line.rstrip("\n").split("\t")
            if len(p) == len(head):
                r = dict(zip(head, p))
                if r["level"] == "1":
                    out.append(r)
    return out


def state():
    s = json.loads(STATE.read_text()) if STATE.exists() else {"index": 0, "recorded": {}}
    # migrate the pre-websocket shape, where `recorded` was a bare list of numbers
    if isinstance(s.get("recorded"), list):
        s["recorded"] = {n: "" for n in s["recorded"]}
    s.setdefault("index", 0)
    s.setdefault("recorded", {})
    return s


def save(s):
    STATE.write_text(json.dumps(s, indent=2))


def current():
    s, rs = state(), rows()
    return s, rs, rs[min(s["index"], len(rs) - 1)]


def slug(r):
    t = re.sub(r"[^A-Za-z0-9]+", "-", r["title"]).strip("-")
    return f"RTM-Live12-{r['num'].replace('.', '-')}-{t}"


def write_card(r):
    TITLE.write_text(f"{r['num']}  {r['title']}")
    SUBTITLE.write_text(SERIES)


# ── preflight ──────────────────────────────────────────────────────────────
def _near(a, b, tol=1.0):
    return abs(a - b) <= tol


def check(o=None, quiet=False):
    """Verify the rig. Returns a list of problems; empty means ready."""
    bad, note = [], (lambda m: None if quiet else print(m))
    own = o is None
    if own:
        o = Obs()
    try:
        v = o.call("GetVersion")
        note(f"  OBS {v['obsVersion']} · websocket {v['obsWebSocketVersion']}")

        vs = o.call("GetVideoSettings")
        got = (vs["baseWidth"], vs["baseHeight"])
        out = (vs["outputWidth"], vs["outputHeight"])
        if got != EXPECT["canvas"] or out != EXPECT["canvas"]:
            bad.append(f"canvas is {got} / output {out}, expected {EXPECT['canvas']}")
        note(f"  canvas {got[0]}x{got[1]} · output {out[0]}x{out[1]} · "
             f"{vs['fpsNumerator']//vs['fpsDenominator']}fps")

        scenes = {s["sceneName"] for s in o.call("GetSceneList")["scenes"]}
        missing = EXPECT["scenes"] - scenes
        if missing:
            bad.append(f"missing scenes: {sorted(missing)}")

        st = o.transform("BODY", "Screen")
        c = (st["cropLeft"], st["cropTop"], st["cropRight"], st["cropBottom"])
        if c != EXPECT["screen"]["crop"]:
            bad.append(f"Screen crop {c}, expected {EXPECT['screen']['crop']}")
        if not _near(st["scaleX"], 0.5, 0.001):
            bad.append(f"Screen scale {st['scaleX']:.4f}, expected 0.5")
        if (st["sourceWidth"], st["sourceHeight"]) != (4112, 2658):
            bad.append(f"Screen source {st['sourceWidth']:.0f}x{st['sourceHeight']:.0f} "
                       f"— display mode changed; re-measure the frame")
        note(f"  Screen  crop{c} scale {st['scaleX']:.3f} src "
             f"{st['sourceWidth']:.0f}x{st['sourceHeight']:.0f}")

        si = o.call("GetInputSettings", {"inputName": "Screen"})["inputSettings"]
        if si.get("type") != 2 or si.get("application") != "com.ableton.live":
            bad.append("Screen is not Application Capture on com.ableton.live "
                       "— other windows will record on top of Live")

        wt = o.transform("BODY", "Webcam")
        if not (_near(wt["boundsWidth"], 346) and _near(wt["boundsHeight"], 277)):
            bad.append(f"Webcam bounds {wt['boundsWidth']:.0f}x{wt['boundsHeight']:.0f}, "
                       f"expected 346x277")
        if not wt["cropToBounds"]:
            bad.append("Webcam cropToBounds is off — the cam will spill past its box")
        if wt["scaleX"] < 0:
            bad.append("Webcam is mirrored — the LDN cap will read backwards")
        note(f"  Webcam  pos({wt['positionX']:.0f},{wt['positionY']:.0f}) "
             f"bounds {wt['boundsWidth']:.0f}x{wt['boundsHeight']:.0f} "
             f"cropToBounds={wt['cropToBounds']}")

        for name, want_track in (("Boom Mic", 1), ("Minifuse LoopBack", 2)):
            r = o.call("GetInputAudioTracks", {"inputName": name}, tolerate=True)
            if r:
                on = [int(k) for k, v in r["inputAudioTracks"].items() if v]
                if on != [want_track]:
                    bad.append(f"{name} records on tracks {on}, expected [{want_track}]")
            # the device itself, not just the routing — a missing interface is silent,
            # and silence is only discovered after the day is recorded
            si = o.call("GetInputSettings", {"inputName": name}, tolerate=True)
            dev = (si or {}).get("inputSettings", {}).get("device_id", "")
            if AUDIO_DEVICE_HINT.lower() not in dev.lower():
                bad.append(f"{name} is on device {dev!r}, expected one matching "
                           f"{AUDIO_DEVICE_HINT!r} — is the interface connected?")
            note(f"  {name:18s} track {on}  device {dev.split(':')[1] if ':' in dev else dev}")

        if o.call("GetRecordStatus")["outputActive"]:
            bad.append("OBS is already recording")

        note("  Live display zoom must be 150% (Cmd , → Display & Input)")
    finally:
        if own:
            o.close()

    if not quiet:
        print("\n  READY" if not bad else "\n  NOT READY:")
        for b in bad:
            print(f"    ! {b}")
    return bad


# ── commands ───────────────────────────────────────────────────────────────
def cmd_check(_):
    print("preflight:")
    return 1 if check() else 0


def cmd_setup(_):
    """Size and place Live's main window.

    Not `window 1` — AppleScript's window order is not stable, and Live keeps small
    floating palettes that can sort first (a 66x20 one did, and got resized instead
    of the main window on the rig's first real use). Pick by largest area.
    """
    x, y, w, h = WINDOW
    script = f'''tell application "Live" to activate
delay 0.5
tell application "System Events" to tell process "Live"
    set best to missing value
    set bestArea to 0
    repeat with win in windows
        set sz to size of win
        set a to (item 1 of sz) * (item 2 of sz)
        if a > bestArea then
            set bestArea to a
            set best to win
        end if
    end repeat
    if best is missing value then return "no windows"
    set position of best to {{{x}, {y}}}
    set size of best to {{{w}, {h}}}
    delay 0.3
    set sz2 to size of best
    return (name of best) & "|" & ((item 1 of sz2) as string) & "," & ((item 2 of sz2) as string)
end tell'''
    g = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=25)
    if g.returncode != 0:
        print(g.stderr.strip())
        print("\nGrant Accessibility to the app running this, then restart it.")
        return 1
    raw = g.stdout.strip()
    name, _, dims = raw.partition("|")
    got = [int(n) for n in re.findall(r"-?\d+", dims)][:2]
    ok = got == [w, h]
    shown = "x".join(str(n) for n in got) if got else "?"
    print(f"Live window {name!r}: {shown}  {'OK' if ok else f'<-- expected {w}x{h}'}")
    if not ok:
        print("  (if it clamped smaller, Live may be full-screen or zoomed — "
              "regular windowed state only)")
    print("preflight:")
    return 1 if (check() or not ok) else 0


def cmd_show(_):
    s, rs, r = current()
    done = len(s["recorded"])
    print(f"{r['num']}  {r['title']}")
    print(f"    manual p.{r['pdf_page']} (~{r['pages']} pp)   ch.{r['chapter']}")
    print(f"    {done}/{len(rs)} recorded")
    return 0


def cmd_goto(a):
    if not a:
        print("goto needs a section number, e.g. goto 29.3")
        return 1
    s, rs = state(), rows()
    for i, r in enumerate(rs):
        if r["num"] == a[0]:
            s["index"] = i
            save(s)
            write_card(r)
            return cmd_show(None)
    print(f"no section {a[0]} in scope")
    return 1


def _advance(s, rs):
    s["index"] = min(s["index"] + 1, len(rs) - 1)
    save(s)
    write_card(rs[s["index"]])


def cmd_skip(_):
    s, rs, _r = current()
    _advance(s, rs)
    return cmd_show(None)


def cmd_take(_):
    s, rs, r = current()
    write_card(r)
    TAKES.mkdir(parents=True, exist_ok=True)
    with Obs() as o:
        bad = check(o, quiet=True)
        if bad:
            print("NOT READY — fix these first:")
            for b in bad:
                print(f"  ! {b}")
            return 1
        o.call("SetCurrentProgramScene", {"sceneName": "TITLE"})
        time.sleep(0.4)
        o.call("StartRecord")
        print(f"● recording   {r['num']}  {r['title']}")
        time.sleep(TITLE_HOLD)
        o.call("SetCurrentProgramScene", {"sceneName": "BODY"})
        print(f"  live — talk. `rtm.py stop` when you land the last word.")
    return 0


def cmd_stop(_):
    s, rs, r = current()
    with Obs() as o:
        if not o.call("GetRecordStatus")["outputActive"]:
            print("not recording")
            return 1
        o.call("SetCurrentProgramScene", {"sceneName": "END"})
        time.sleep(END_HOLD)
        out = o.call("StopRecord").get("outputPath")
    if not out or not Path(out).exists():
        print(f"recording stopped but no file reported ({out})")
        return 1
    TAKES.mkdir(parents=True, exist_ok=True)
    dest = TAKES / f"{slug(r)}{Path(out).suffix}"
    shutil.move(out, dest)
    s["recorded"][r["num"]] = dest.name
    save(s)
    print(f"■ {dest.name}  ({dest.stat().st_size/1e6:.0f} MB)")
    _advance(s, rs)
    print(f"  up next: {rs[s['index']]['num']}  {rs[s['index']]['title']}")
    return 0


def cmd_process(_):
    """Normalise the two tracks independently and mux. Video is copied, never re-encoded."""
    if not shutil.which("ffmpeg"):
        print("ffmpeg not found — brew install ffmpeg")
        return 1
    FINAL.mkdir(parents=True, exist_ok=True)
    takes = sorted(p for p in TAKES.glob("RTM-*") if p.suffix in (".mov", ".mp4", ".mkv"))
    if not takes:
        print(f"nothing to process in {TAKES}")
        return 0
    fail = 0
    for src in takes:
        dest = FINAL / (src.stem + ".mp4")
        if dest.exists():
            print(f"  skip (done)  {src.name}")
            continue
        fc = (f"[0:a:0]loudnorm=I={MIC_LUFS}:TP=-1.5:LRA=11[m];"
              f"[0:a:1]loudnorm=I={PROGRAM_LUFS}:TP=-1.5:LRA=11[p];"
              f"[m][p]amix=inputs=2:duration=longest:normalize=0,"
              f"alimiter=limit=0.97[a]")
        cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src),
               "-filter_complex", fc, "-map", "0:v:0", "-map", "[a]",
               "-c:v", "copy", "-c:a", "aac", "-b:a", "256k",
               "-movflags", "+faststart", str(dest)]
        print(f"  {src.name} ...", end="", flush=True)
        p = subprocess.run(cmd, capture_output=True, text=True)
        if p.returncode != 0:
            print(f" FAILED\n{p.stderr.strip()[:400]}")
            fail += 1
        else:
            print(f" -> {dest.name}  ({dest.stat().st_size/1e6:.0f} MB)")
    print(f"\n{len(takes)-fail} finished in {FINAL}")
    return 1 if fail else 0


def cmd_levels(a):
    """Watch the real meters. Talk, and play something through Live."""
    secs = float(a[0]) if a else 5.0
    print(f"listening {secs:.0f}s — talk, and play a sound in Live ...")
    with Obs() as o:
        pk = o.meters(secs)
    if not pk:
        print("  no meter data — is anything routed?")
        return 1
    bad = False
    for name in ("Boom Mic", "Minifuse LoopBack"):
        db = pk.get(name, -120.0)
        if db <= -50:
            verdict, bad = "SILENT — check the interface and routing", True
        elif db > -3:
            verdict, bad = "TOO HOT — clipping risk", True
        elif db < -30:
            verdict = "quiet; usable but raise it if you can"
        else:
            verdict = "good"
        print(f"  {name:18s} peak {db:6.1f} dBFS   {verdict}")
    return 1 if bad else 0


def cmd_remaining(_):
    s, rs = state(), rows()
    n = len(s["recorded"])
    print(f"{n} of {len(rs)} in-scope sections recorded ({n*100//max(len(rs),1)}%)")
    left = {}
    for r in rs:
        if r["num"] not in s["recorded"]:
            left[r["chapter"]] = left.get(r["chapter"], 0) + 1
    print("open: " + "  ".join(f"ch{c}:{k}" for c, k in
                               sorted(left.items(), key=lambda x: int(x[0]))))
    return 0


COMMANDS = {"check": cmd_check, "setup": cmd_setup, "show": cmd_show, "goto": cmd_goto,
            "skip": cmd_skip, "take": cmd_take, "stop": cmd_stop,
            "process": cmd_process, "levels": cmd_levels, "remaining": cmd_remaining}

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "show"
    if cmd not in COMMANDS:
        print(__doc__)
        sys.exit(1)
    try:
        sys.exit(COMMANDS[cmd](sys.argv[2:]))
    except ObsError as e:
        print(f"OBS: {e}")
        sys.exit(2)
